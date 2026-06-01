import { getDb, saveDb, makeId } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return Response.json({ error: "请先登录" }, { status: 401 });

  const { content, mood } = await req.json();
  const today = new Date().toISOString().slice(0, 10);
  const db = getDb();

  if (db.checkIns.find(c => c.user_id === payload.userId && c.date === today)) {
    return Response.json({ error: "今天已打卡" }, { status: 400 });
  }

  db.checkIns.push({
    id: makeId("c"),
    user_id: payload.userId,
    date: today,
    content: content || "",
    mood: mood || "",
    created_at: new Date().toISOString()
  });
  saveDb(db);
  return Response.json({ ok: true });
}

export async function GET(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return Response.json({ error: "请先登录" }, { status: 401 });

  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const todayCheckin = db.checkIns.find(c => c.user_id === payload.userId && c.date === today) || null;
  const history = db.checkIns.filter(c => c.user_id === payload.userId && c.date >= monthAgo).sort((a, b) => b.date.localeCompare(a.date));
  const allCheckins = db.checkIns.filter(c => c.user_id === payload.userId);

  return Response.json({ today: todayCheckin, history, all: allCheckins });
}