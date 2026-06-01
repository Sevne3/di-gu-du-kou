import { NextResponse } from "next/server";
import { getDb, saveDb, makeId } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// Mood tag labels
const moodLabels = {
  "comfort":"求安慰","joy":"分享快乐","rant":"单纯吐槽","emo":"深夜emo"
};

export async function GET(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  const db = getDb();
  const bottles = (db.bottles || []).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const replies = db.bottleReplies || [];

  if (payload) {
    // My bottles (sent)
    const myBottles = bottles.filter(b => b.sender_id === payload.userId).map(b => ({
      ...b, replyCount: replies.filter(r => r.bottleId === b.id).length
    }));
    // Bottles I picked up (with reply threads)
    const pickedBottles = bottles.filter(b => b.picked_by === payload.userId && b.sender_id !== payload.userId).map(b => ({
      ...b, replyCount: replies.filter(r => r.bottleId === b.id).length
    }));
    // My replies (bottles I replied to)
    const myRepliedIds = new Set(replies.filter(r => r.sender_id === payload.userId).map(r => r.bottleId));
    const repliedBottles = bottles.filter(b => myRepliedIds.has(b.id) && b.sender_id !== payload.userId && b.picked_by !== payload.userId).map(b => ({
      ...b, replyCount: replies.filter(r => r.bottleId === b.id).length
    }));
    
    // Get daily pick count
    const today = new Date().toISOString().slice(0, 10);
    const pickLog = db.bottlePickLogs || [];
    const todayPicks = pickLog.filter(l => l.user_id === payload.userId && l.date === today).length;
    const maxPicks = 5;

    return NextResponse.json({
      myBottles, pickedBottles, repliedBottles,
      todayPicks, maxPicks,
      myBottleCount: myBottles.length,
      totalBottles: bottles.length,
      unreadCount: bottles.filter(b => !b.is_picked && b.sender_id !== payload.userId).length
    });
  }

  return NextResponse.json({
    myBottles: [], pickedBottles: [], repliedBottles: [],
    todayPicks: 0, maxPicks: 5, totalBottles: bottles.length,
    unreadCount: bottles.filter(b => !b.is_picked).length
  });
}

export async function POST(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await req.json();
  const db = getDb();

  // Case 1: Throw a bottle
  if (body.action === "throw") {
    const { content, mood_tag } = body;
    if (!content?.trim()) return NextResponse.json({ error: "写点什么再丢吧" }, { status: 400 });
    if (!db.bottles) db.bottles = [];
    db.bottles.push({
      id: makeId("btl"),
      sender_id: payload.userId,
      content: content.trim(),
      mood_tag: mood_tag || "comfort",
      created_at: new Date().toISOString(),
      is_picked: false,
      picked_by: null
    });
    saveDb(db);
    return NextResponse.json({ ok: true, message: "瓶子已漂向大海 🌊" });
  }

  // Case 2: Fish a bottle (pick up random)
  if (body.action === "fish") {
    const today = new Date().toISOString().slice(0, 10);
    if (!db.bottlePickLogs) db.bottlePickLogs = [];
    const todayPicks = db.bottlePickLogs.filter(l => l.user_id === payload.userId && l.date === today).length;
    if (todayPicks >= 5) {
      return NextResponse.json({ error: "今天体力耗尽了，明天再来吧 🌙" }, { status: 429 });
    }

    // Get available bottles (not picked, not own)
    const available = (db.bottles || []).filter(b => !b.is_picked && b.sender_id !== payload.userId);
    if (available.length === 0) {
      return NextResponse.json({ error: "海里暂时没有瓶子漂着 🌊" }, { status: 404 });
    }

    // Pick a random bottle
    const picked = available[Math.floor(Math.random() * available.length)];
    picked.is_picked = true;
    picked.picked_by = payload.userId;
    picked.picked_at = new Date().toISOString();

    // Log the pick
    db.bottlePickLogs.push({
      id: makeId("bpl"),
      user_id: payload.userId,
      bottleId: picked.id,
      date: today
    });

    // Generate anonymous nickname for the sender
    const nicknames = ["远方的航海士A","陌生的海鸥B","孤独的灯塔C","流浪的信天翁D","深海的鲸鱼E","沉默的浮标F"];
    const senderNick = nicknames[Math.abs(picked.sender_id.split("_").pop().charCodeAt(0) || 0) % nicknames.length];

    saveDb(db);
    return NextResponse.json({
      bottle: {
        id: picked.id,
        content: picked.content,
        mood_tag: picked.mood_tag,
        mood_label: moodLabels[picked.mood_tag] || picked.mood_tag,
        sender_nickname: senderNick,
        created_at: picked.created_at
      }
    });
  }

  // Case 3: Send a reply to a bottle
  if (body.action === "reply") {
    const { bottleId, content } = body;
    if (!bottleId || !content?.trim()) return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
    if (!db.bottleReplies) db.bottleReplies = [];
    
    // Check the bottle exists
    const bottle = (db.bottles || []).find(b => b.id === bottleId);
    if (!bottle) return NextResponse.json({ error: "瓶子不存在" }, { status: 404 });

    db.bottleReplies.push({
      id: makeId("btr"),
      bottleId: bottleId,
      sender_id: payload.userId,
      content: content.trim(),
      created_at: new Date().toISOString()
    });
    saveDb(db);

    // Create notification for bottle owner
    if (!db.notifications) db.notifications = [];
    db.notifications.push({
      id: makeId('notif'),
      userId: bottle.sender_id,
      type: 'bottle_reply',
      title: '你的漂流瓶收到了回信',
      content: '有人给你的漂流瓶写了回信',
      relatedId: bottleId,
      read: false,
      created_at: new Date().toISOString()
    });
    saveDb(db);

    // Return the reply with a nickname
    const nicknames = ["远方的航海士A","陌生的海鸥B","孤独的灯塔C","流浪的信天翁D","深海的鲸鱼E","沉默的浮标F"];
    const replyNick = nicknames[Math.abs(payload.userId.split("_").pop().charCodeAt(0) || 0) % nicknames.length];
    const bottleNick = nicknames[Math.abs(bottle.sender_id.split("_").pop().charCodeAt(0) || 0) % nicknames.length];

    return NextResponse.json({
      reply: {
        id: db.bottleReplies[db.bottleReplies.length - 1].id,
        content: content.trim(),
        sender_nickname: replyNick,
        created_at: new Date().toISOString(),
        is_me: true
      },
      bottle_nickname: bottleNick
    });
  }

  // Case 4: Get replies for a bottle
  if (body.action === "getReplies") {
    const { bottleId } = body;
    const bottle = (db.bottles || []).find(b => b.id === bottleId);
    if (!bottle) return NextResponse.json({ error: "瓶子不存在" }, { status: 404 });

    const bottleReplies = (db.bottleReplies || []).filter(r => r.bottleId === bottleId).sort((a, b) => a.created_at.localeCompare(b.created_at));
    
    const nicknames = ["远方的航海士A","陌生的海鸥B","孤独的灯塔C","流浪的信天翁D","深海的鲸鱼E","沉默的浮标F"];
    const bottleNick = nicknames[Math.abs(bottle.sender_id.split("_").pop().charCodeAt(0) || 0) % nicknames.length];

    const enriched = bottleReplies.map(r => {
      const isSender = r.sender_id === bottle.sender_id;
      const nick = isSender ? bottleNick : nicknames[Math.abs(r.sender_id.split("_").pop().charCodeAt(0) || 0) % nicknames.length];
      return {
        ...r, sender_nickname: nick, is_me: r.sender_id === payload?.userId
      };
    });

    return NextResponse.json({ replies: enriched, bottle_nickname: bottleNick });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}