import { NextResponse } from "next/server";
import { getDb, saveDb, makeId } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { targetUserId, action } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  if (targetUserId === payload.userId) return NextResponse.json({ error: "不能和自己配对" }, { status: 400 });

  const db = getDb();
  if (!db.pairs) db.pairs = [];

  if (action === "send") {
    const existing = db.pairs.find(p => 
      (p.fromId === payload.userId && p.toId === targetUserId) ||
      (p.fromId === targetUserId && p.toId === payload.userId)
    );
    if (existing) return NextResponse.json({ error: "已发送过请求或已是搭子" }, { status: 400 });
    db.pairs.push({
      id: makeId("pair"), fromId: payload.userId, toId: targetUserId,
      status: "pending", created_at: new Date().toISOString()
    });
    saveDb(db);
    return NextResponse.json({ ok: true, status: "pending" });
  }

  if (action === "accept") {
    const req2 = db.pairs.find(p => p.fromId === targetUserId && p.toId === payload.userId && p.status === "pending");
    if (!req2) return NextResponse.json({ error: "请求不存在" }, { status: 400 });
    req2.status = "matched"; req2.matched_at = new Date().toISOString();
    // Create notifications
    if (!db.notifications) db.notifications = [];
    const fromUser = db.users.find(u => u.id === targetUserId);
    const toUser = db.users.find(u => u.id === payload.userId);
    const fromName = fromUser?.username || fromUser?.email?.split("@")[0] || "渡口居民";
    const toName = toUser?.username || toUser?.email?.split("@")[0] || "渡口居民";
    db.notifications.push({
      id: makeId("notif"), userId: targetUserId,
      type: "pair_matched", title: "🤝 配对成功！",
      content: `${toName} 接受了你的配对请求，你们已经成为搭子了！`,
      read: false, created_at: new Date().toISOString()
    });
    db.notifications.push({
      id: makeId("notif"), userId: payload.userId,
      type: "pair_matched", title: "🤝 配对成功！",
      content: `你与 ${fromName} 成功配对，去搭子页面看看吧！`,
      read: false, created_at: new Date().toISOString()
    });
    saveDb(db);
    return NextResponse.json({ ok: true, status: "matched" });
  }

  if (action === "reject") {
    const req2 = db.pairs.find(p => p.fromId === targetUserId && p.toId === payload.userId && p.status === "pending");
    if (!req2) return NextResponse.json({ error: "请求不存在" }, { status: 400 });
    req2.status = "rejected";
    saveDb(db);
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  if (action === "unpair") {
    db.pairs = db.pairs.filter(p => !((p.fromId === payload.userId && p.toId === targetUserId) || (p.fromId === targetUserId && p.toId === payload.userId)));
    saveDb(db);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}

export async function GET(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const db = getDb();
  if (!db.pairs) db.pairs = [];
  if (!db.userLocations) db.userLocations = {};

  // My pairs
  const myPairs = db.pairs.filter(p => p.fromId === payload.userId || p.toId === payload.userId);
  
  // Enrich with user info and locations
  const enriched = myPairs.map(p => {
    const otherId = p.fromId === payload.userId ? p.toId : p.fromId;
    const otherUser = db.users.find(u => u.id === otherId);
    const otherLoc = db.userLocations[otherId];
    const myLoc = db.userLocations[payload.userId];
    let distance = null;
    if (otherLoc && myLoc) {
      const R = 6371;
      const dLat = (otherLoc.lat - myLoc.lat) * Math.PI / 180;
      const dLon = (otherLoc.lng - myLoc.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(myLoc.lat * Math.PI / 180) * Math.cos(otherLoc.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    }
    return { ...p, otherUser: { id: otherId, username: otherUser?.username || "渡口居民", email: otherUser?.email, avatar: otherUser?.avatar || "👤" }, distance };
  });

  // Get pending requests (others want to pair with me)
  const pendingRequests = db.pairs.filter(p => p.toId === payload.userId && p.status === "pending");
  const pendingEnriched = pendingRequests.map(p => {
    const fromUser = db.users.find(u => u.id === p.fromId);
    return { ...p, fromUser: { id: p.fromId, username: fromUser?.username || "渡口居民", avatar: fromUser?.avatar || "👤" } };
  });

  return NextResponse.json({
    pairs: enriched,
    pendingRequests: pendingEnriched,
    allUsers: db.users.filter(u => u.id !== payload.userId).slice(0, 50).map(u => ({ id: u.id, username: u.username || u.email?.split("@")[0] || "渡口居民", avatar: u.avatar || "👤" }))
  });
}
