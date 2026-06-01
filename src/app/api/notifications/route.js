import { NextResponse } from "next/server";
import { getDb, saveDb, makeId } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const db = getDb();
  if (!db.notifications) db.notifications = [];
  const userNotifs = db.notifications
    .filter(n => n.userId === payload.userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 20);

  return NextResponse.json({ notifications: userNotifs });
}

export async function POST(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { action, notificationId } = await req.json();
  if (action === "markRead") {
    const db = getDb();
    if (!db.notifications) db.notifications = [];
    const notif = db.notifications.find(n => n.id === notificationId && n.userId === payload.userId);
    if (notif) notif.read = true;
    saveDb(db);
  }

  return NextResponse.json({ ok: true });
}
