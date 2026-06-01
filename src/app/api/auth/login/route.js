import { getDb } from "@/lib/db";
import { createToken } from "@/lib/auth";
const bcrypt = require("bcryptjs");

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const db = getDb();
    const user = db.users.find(u => u.email === email);
    if (!user) {
      return Response.json({ error: "邮箱或密码错误" }, { status: 401 });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return Response.json({ error: "邮箱或密码错误" }, { status: 401 });
    }
    const token = await createToken(user.id);
    return Response.json({ token, user: { id: user.id, email: user.email, emailVerified: user.emailVerified || false } });
  } catch (err) {
    console.error("Login error:", err.message);
    return Response.json({ error: "登录失败" }, { status: 500 });
  }
}
