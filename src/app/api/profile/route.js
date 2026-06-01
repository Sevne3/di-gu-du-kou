import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const db = getDb();
  const user = db.users.find(u => u.id === payload.userId);
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username || "",
      email: user.email,
      avatar: user.avatar || "👤",
      bio: user.bio || "",
      created_at: user.created_at
    }
  });
}

export async function PUT(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { username, avatar, bio } = await req.json();
  const db = getDb();
  const user = db.users.find(u => u.id === payload.userId);
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  if (username?.trim()) user.username = username.trim();
  if (avatar) user.avatar = avatar;
  if (bio !== undefined) user.bio = bio.trim();

  saveDb(db);
  return NextResponse.json({ ok: true });
}