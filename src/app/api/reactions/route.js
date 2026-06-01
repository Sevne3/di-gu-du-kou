import { getDb, saveDb, makeId } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const REACTION_TYPES = {
  "heart": { label: "我懂你", icon: "❤️", color: "#e74c3c" },
  "same": { label: "有同感", icon: "👍", color: "#f39c12" },
  "hug": { label: "抱抱你", icon: "🤗", color: "#9b59b6" },
  "cheer": { label: "加油", icon: "💪", color: "#27ae60" }
};

export async function POST(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return Response.json({ error: "请先登录" }, { status: 401 });

  const { postId, type } = await req.json();
  if (!postId || !type) return Response.json({ error: "参数不完整" }, { status: 400 });
  if (!REACTION_TYPES[type]) return Response.json({ error: "无效的互动类型" }, { status: 400 });

  const db = getDb();
  if (!db.reactions) db.reactions = [];

  const existing = db.reactions.find(r => r.user_id === payload.userId && r.post_id === postId && r.type === type);
  if (existing) {
    db.reactions = db.reactions.filter(r => r.id !== existing.id);
    saveDb(db);
    const counts = getCounts(db, postId);
    return Response.json({ ok: true, action: "removed", type, counts });
  }

  db.reactions.push({
    id: makeId("re"),
    user_id: payload.userId,
    post_id: postId,
    type,
    created_at: new Date().toISOString()
  });

  const user = db.users.find(u => u.id === payload.userId);
  if (user) user.warmth_score = (user.warmth_score || 0) + 1;

  saveDb(db);
  const counts = getCounts(db, postId);
  return Response.json({ ok: true, action: "added", type, counts });
}

export async function GET(req) {
  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId) return Response.json({ counts: {} });

  const db = getDb();
  const counts = getCounts(db, postId);

  const auth = req.headers.get("authorization");
  let userReactions = {};
  if (auth) {
    const payload = await verifyToken(auth.replace("Bearer ", ""));
    if (payload) {
      const userReacted = (db.reactions || []).filter(r => r.post_id === postId && r.user_id === payload.userId);
      userReacted.forEach(r => { userReactions[r.type] = true; });
    }
  }

  return Response.json({ counts, userReactions, types: REACTION_TYPES });
}

function getCounts(db, postId) {
  const reactions = (db.reactions || []).filter(r => r.post_id === postId);
  const counts = {};
  Object.keys(REACTION_TYPES).forEach(type => {
    counts[type] = reactions.filter(r => r.type === type).length;
  });
  return counts;
}
