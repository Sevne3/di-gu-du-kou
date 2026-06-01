import { getDb, saveDb, makeId } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return Response.json({ error: "请先登录" }, { status: 401 });

  const { can_provide, need, bio, status } = await req.json();
  if (!can_provide?.trim() || !need?.trim()) return Response.json({ error: "「我能提供」和「我需要」都必须填写" }, { status: 400 });

  const db = getDb();
  if (!db.skills) db.skills = [];
  db.skills.push({
    id: makeId("sk"),
    user_id: payload.userId,
    can_provide: can_provide.trim(),
    need: need.trim(),
    bio: bio?.trim() || "",
    status: status || "available",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  saveDb(db);
  return Response.json({ ok: true });
}

export async function GET(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return Response.json({ skills: [] });

  const db = getDb();
  const list = (db.skills || []).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const enriched = list.map(s => {
    const user = db.users.find(u => u.id === s.user_id);
    return { ...s, username: user?.username || user?.email?.split("@")[0] || "渡口居民" };
  });
  const userSkills = enriched.filter(s => s.user_id === payload.userId);
  const othersSkills = enriched.filter(s => s.user_id !== payload.userId);

  return Response.json({ skills: enriched, userSkills, othersSkills });
}

export async function PUT(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return Response.json({ error: "请先登录" }, { status: 401 });

  const { skillId, status } = await req.json();
  const db = getDb();
  const skill = (db.skills || []).find(s => s.id === skillId);
  if (!skill) return Response.json({ error: "未找到" }, { status: 404 });
  if (skill.user_id !== payload.userId) return Response.json({ error: "无权限" }, { status: 403 });

  skill.status = status || "completed";
  skill.updated_at = new Date().toISOString();
  saveDb(db);
  return Response.json({ ok: true });
}