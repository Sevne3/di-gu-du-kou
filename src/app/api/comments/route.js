import { getDb, saveDb, makeId } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return Response.json({ error: "请先登录" }, { status: 401 });

  const { postId, content } = await req.json();
  if (!postId || !content?.trim()) return Response.json({ error: "参数不完整" }, { status: 400 });

  const db = getDb();
  db.comments.push({
    id: makeId("cm"),
    post_id: postId,
    user_id: payload.userId,
    content: content.trim(),
    created_at: new Date().toISOString()
  });
  saveDb(db);
  return Response.json({ ok: true });
}

export async function GET(req) {
  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId) return Response.json({ comments: [] });

  const db = getDb();
  const comments = db.comments.filter(c => c.post_id === postId).sort((a, b) => a.created_at.localeCompare(b.created_at));
  
  const enriched = comments.map(c => {
    const user = db.users.find(u => u.id === c.user_id);
    return { ...c, username: user?.username || "" };
  });
  return Response.json({ comments: enriched });
}