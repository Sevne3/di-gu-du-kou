import { getDb, saveDb, makeId } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return Response.json({ error: "Please login first" }, { status: 401 });
  const { toUserId, content } = await req.json();
  if (!toUserId || !content?.trim()) return Response.json({ error: "Missing parameters" }, { status: 400 });
  if (content.trim().length > 2000) return Response.json({ error: "Content too long" }, { status: 400 });
  const db = getDb();
  if (!db.messages) db.messages = [];
  db.messages.push({ id: makeId("msg"), fromUserId: payload.userId, toUserId, content: content.trim(), created_at: new Date().toISOString(), read: false });
  saveDb(db);

  // Create notification for recipient
  if (!db.notifications) db.notifications = [];
  const fromUser = db.users.find(u => u.id === payload.userId);
  const fromName = fromUser?.username || fromUser?.email?.split('@')[0] || '渡口居民';
  db.notifications.push({
    id: makeId('notif'),
    userId: toUserId,
    type: 'new_message',
    title: fromName + ' 给你发了一条消息',
    content: content.trim().slice(0, 80) + (content.trim().length > 80 ? '...' : ''),
    relatedId: payload.userId,
    read: false,
    created_at: new Date().toISOString()
  });
  saveDb(db);

  return Response.json({ ok: true });
}

export async function GET(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return Response.json({ error: "Please login first" }, { status: 401 });
  const db = getDb();
  if (!db.messages) db.messages = [];
  const convUserId = req.nextUrl.searchParams.get("with");
  let messages = db.messages.filter(m => m.fromUserId === payload.userId || m.toUserId === payload.userId);
  if (convUserId) {
    messages = messages.filter(m => (m.fromUserId === payload.userId && m.toUserId === convUserId) || (m.toUserId === payload.userId && m.fromUserId === convUserId));
  }
  messages.sort((a,b) => a.created_at.localeCompare(b.created_at));
  const enriched = messages.map(m => {
    const fromUser = db.users.find(u => u.id === m.fromUserId);
    const toUser = db.users.find(u => u.id === m.toUserId);
    return { ...m, fromUsername: fromUser?.username || fromUser?.email?.split("@")[0] || "Buddy", toUsername: toUser?.username || toUser?.email?.split("@")[0] || "Buddy" };
  });
  return Response.json({ messages: enriched });
}
