import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (!auth) return Response.json({ user: null });
  const payload = await verifyToken(auth.replace("Bearer ", ""));
  if (!payload) return Response.json({ user: null });
  const db = getDb();
  const user = db.users.find(u => u.id === payload.userId);
  if (!user) return Response.json({ user: null });
  const { password, ...safe } = user;
  return Response.json({ user: safe });
}