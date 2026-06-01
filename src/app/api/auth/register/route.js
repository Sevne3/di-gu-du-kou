import { getDb, saveDb, makeId } from "@/lib/db";
import { createToken } from "@/lib/auth";
const bcrypt = require("bcryptjs");

const RESEND_KEY = process.env.RESEND_API_KEY;
// VERCEL_PROJECT_PRODUCTION_URL is more reliable on Vercel
const BASE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL 
  ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL 
  : process.env.VERCEL_URL 
    ? "https://" + process.env.VERCEL_URL 
    : "http://localhost:4567";

function makeVerificationToken() {
  return Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15);
}

function buildWelcomeEmail(link) {
  return [
    "<div style=\"max-width:480px;margin:40px auto;padding:32px;background:#faf6f0;border-radius:20px;font-family:sans-serif\">",
    "<h1 style=\"font-size:1.4rem;color:#1a1a2e;margin-bottom:24px\">🌿 欢迎来到低谷渡口</h1>",
    "<p style=\"color:#5d4e37;line-height:1.8;font-size:0.95rem\">你收到这封邮件，是因为有人在低谷渡口注册了账号。</p>",
    "<p style=\"color:#5d4e37;line-height:1.8;font-size:0.95rem\">点击下方按钮验证你的邮箱：</p>",
    "<div style=\"text-align:center;margin:32px 0\">",
    "<a href=\"" + link + "\" style=\"display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#f0c27f,#dba76a);color:#1a1a2e;text-decoration:none;border-radius:40px;font-weight:600;font-size:0.95rem\">验证邮箱</a>",
    "</div>",
    "<p style=\"color:#8a7a6e;font-size:0.82rem;line-height:1.6\">如果这不是你操作的，请忽略这封邮件。<br/>链接有效期 24 小时。</p>",
    "<p style=\"color:#b8aaa0;font-size:0.78rem;margin-top:24px;text-align:center\">低谷渡口 — 你不是一个人</p>",
    "</div>"
  ].join("\n");
}

async function sendVerificationEmail(email, token) {
  if (!RESEND_KEY) {
    console.log("RESEND_KEY not configured, skipping email");
    return { sent: false, reason: "no_key" };
  }
  const link = BASE_URL + "/verify-email?token=" + token + "&email=" + encodeURIComponent(email);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "低谷渡口 <onboarding@resend.dev>",
        to: email,
        subject: "🌿 验证你的邮箱 — 低谷渡口",
        html: buildWelcomeEmail(link)
      })
    });
    const result = await res.json();
    if (!res.ok) {
      console.log("Resend API error:", res.status, JSON.stringify(result));
      return { sent: false, reason: "api_error", detail: result };
    }
    console.log("Verification email sent to", email, "id:", result.id);
    return { sent: true, id: result.id };
  } catch(e) {
    console.error("Send email failed:", e.message);
    return { sent: false, reason: "exception", message: e.message };
  }
}

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password || password.length < 6) {
      return Response.json({ error: "请填写邮箱和密码（至少6位）" }, { status: 400 });
    }
    const db = getDb();
    if (db.users.find(u => u.email === email)) {
      return Response.json({ error: "该邮箱已被注册" }, { status: 400 });
    }
    const id = makeId("u");
    const hash = await bcrypt.hash(password, 10);
    const verificationToken = makeVerificationToken();
    db.users.push({
      id, email, password: hash, username: "", situation: "",
      emailVerified: false, verificationToken,
      created_at: new Date().toISOString()
    });
    saveDb(db);

    // Await the email sending
    const emailResult = await sendVerificationEmail(email, verificationToken);

    const token = await createToken(id);
    return Response.json({
      token, user: { id, email, emailVerified: false },
      message: "注册成功！请查看你的邮箱完成验证。",
      emailSent: emailResult.sent
    });
  } catch (err) {
    console.error("Register error:", err.message);
    return Response.json({ error: "注册失败" }, { status: 500 });
  }
}
