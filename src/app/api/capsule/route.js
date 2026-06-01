import { NextResponse } from "next/server";
import { getDb, saveDb, makeId } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// Simple obfuscation for content storage (since JSON file DB)
// XOR with user ID as key to prevent casual reading
function obfuscate(text, userId) {
  const key = userId || "ferry_key";
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const kc = key.charCodeAt(i % key.length);
    result += String.fromCharCode(text.charCodeAt(i) ^ kc);
  }
  return btoa(encodeURIComponent(result));
}

function deobfuscate(encoded, userId) {
  try {
    const key = userId || "ferry_key";
    const xorStr = decodeURIComponent(atob(encoded));
    let result = "";
    for (let i = 0; i < xorStr.length; i++) {
      const kc = key.charCodeAt(i % key.length);
      result += String.fromCharCode(xorStr.charCodeAt(i) ^ kc);
    }
    return result;
  } catch { return "[内容解密失败]"; }
}

// Auto-delivery check: find and deliver due capsules
function checkAndDeliver(db, now) {
  const delivered = [];
  const capsules = db.timeCapsules || [];
  const due = capsules.filter(c => c.status === "pending" && c.deliver_at <= now);
  
  for (const c of due) {
    // Check if user still exists
    const userExists = db.users.some(u => u.id === c.user_id);
    if (!userExists) {
      c.status = "expired";
      c.expired_at = new Date().toISOString();
      continue;
    }
    
    // Decrypt content for delivery
    let decrypted = "";
    try { decrypted = deobfuscate(c.content_encrypted, c.user_id); } catch { decrypted = "[内容已损坏]"; }
    
    // Create notification for the user
    if (!db.notifications) db.notifications = [];
    db.notifications.push({
      id: makeId("notif"),
      userId: c.user_id,
      type: "time_capsule",
      title: "来自过去的信·" + (c.subject || "无题"),
      content: decrypted.slice(0, 80) + (decrypted.length > 80 ? "..." : ""),
      relatedId: c.id,
      read: false,
      createdAt: now
    });
    
    // Also create a system message in messages
    if (!db.messages) db.messages = [];
    db.messages.push({
      id: makeId("msg"),
      fromUserId: "system",
      toUserId: c.user_id,
      content: JSON.stringify({ type: "time_capsule", capsuleId: c.id, subject: c.subject || "无题", text: decrypted, originalDate: c.created_at }),
      created_at: new Date().toISOString(),
      read: false,
      isCapsule: true
    });
    
    c.status = "delivered";
    c.delivered_at = now;
    delivered.push(c.id);
  }
  
  if (delivered.length > 0) saveDb(db);
  return delivered;
}

export async function GET(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const db = getDb();
  const now = new Date().toISOString();
  
  // Auto-delivery check
  checkAndDeliver(db, now);
  
  // Count new deliveries for this user
  const userDeliveries = (db.notifications || [])
    .filter(n => n.userId === payload.userId && n.type === "time_capsule" && !n.read);
  
  // Do NOT return any capsule content - just delivery count
  return NextResponse.json({ 
    newDeliveries: userDeliveries.length,
    ok: true 
  });
}

export async function POST(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { content, subject, deliverDate } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "请写下你想说的话" }, { status: 400 });
  if (!deliverDate) return NextResponse.json({ error: "请选择送达日期" }, { status: 400 });
  
  // Validate date is at least tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);
  if (deliverDate < minDate) return NextResponse.json({ error: "送达日期必须至少是明天" }, { status: 400 });

  const db = getDb();
  if (!db.timeCapsules) db.timeCapsules = [];

  // Encrypt content
  const encrypted = obfuscate(content.trim(), payload.userId);

  db.timeCapsules.push({
    id: makeId("cap"),
    user_id: payload.userId,
    content_encrypted: encrypted,
    subject: subject?.trim() || "",
    deliver_at: new Date(deliverDate + "T00:00:00Z").toISOString(),
    status: "pending",
    created_at: new Date().toISOString(),
    user_email: db.users.find(u => u.id === payload.userId)?.email || ""
  });

  saveDb(db);
  return NextResponse.json({ ok: true, deliverDate });
}

export async function PUT(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { capsuleId } = await req.json();
  const db = getDb();
  const capsule = (db.timeCapsules || []).find(c => c.id === capsuleId && c.user_id === payload.userId);
  if (!capsule) return NextResponse.json({ error: "未找到" }, { status: 404 });

  // Return decrypted content for viewing
  const decrypted = deobfuscate(capsule.content_encrypted, payload.userId);
  return NextResponse.json({
    capsule: {
      id: capsule.id,
      subject: capsule.subject,
      content: decrypted,
      deliver_at: capsule.deliver_at,
      delivered_at: capsule.delivered_at,
      created_at: capsule.created_at,
      status: capsule.status
    }
  });
}