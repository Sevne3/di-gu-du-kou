import { getDb, saveDb } from "@/lib/db";

const RESEND_KEY = process.env.RESEND_API_KEY;
const BASE_URL = process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:4567";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const email = url.searchParams.get("email");

    if (!token || !email) {
      return Response.json({ error: "无效的验证链接" }, { status: 400 });
    }

    const db = getDb();
    const user = db.users.find(u => u.email === email && u.verificationToken === token);

    if (!user) {
      return Response.json({ error: "验证链接无效或已过期" }, { status: 400 });
    }

    user.emailVerified = true;
    user.verificationToken = null;
    saveDb(db);

    return Response.json({ message: "邮箱验证成功！" });
  } catch (err) {
    return Response.json({ error: "验证失败" }, { status: 500 });
  }
}

function buildVerifyEmail(link) {
  return [
    '<div style="max-width:480px;margin:40px auto;padding:32px;background:#faf6f0;border-radius:20px;font-family:sans-serif">',
    '<h1 style="font-size:1.4rem;color:#1a1a2e;margin-bottom:24px">🌿 重新验证邮箱</h1>',
    '<p style="color:#5d4e37;line-height:1.8;font-size:0.95rem">点击下方按钮验证你的邮箱：</p>',
    '<div style="text-align:center;margin:32px 0">',
    '<a href="' + link + '" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#f0c27f,#dba76a);color:#1a1a2e;text-decoration:none;border-radius:40px;font-weight:600;font-size:0.95rem">验证邮箱</a>',
    "</div>",
    '<p style="color:#8a7a6e;font-size:0.82rem;line-height:1.6">链接有效期 24 小时。</p>',
    '<p style="color:#b8aaa0;font-size:0.78rem;margin-top:24px;text-align:center">低谷渡口 — 你不是一个人</p>',
    "</div>"
  ].join("\n");
}

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: "请提供邮箱" }, { status: 400 });

    const db = getDb();
    const user = db.users.find(u => u.email === email);
    if (!user) return Response.json({ error: "用户不存在" }, { status: 404 });
    if (user.emailVerified) return Response.json({ error: "邮箱已验证" }, { status: 400 });

    const token = Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15);
    user.verificationToken = token;
    saveDb(db);

    if (RESEND_KEY) {
      const link = BASE_URL + "/verify-email?token=" + token + "&email=" + encodeURIComponent(email);
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "低谷渡口 <onboarding@resend.dev>",
          to: email,
          subject: "🌿 重新验证你的邮箱 — 低谷渡口",
          html: buildVerifyEmail(link)
        })
      });
    }

    return Response.json({ message: "验证邮件已发送，请查收。" });
  } catch (err) {
    return Response.json({ error: "发送失败" }, { status: 500 });
  }
}
