import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const topics = [
  { question: "今天，你原谅自己了吗？", detail: "我们总是对别人很宽容，却对自己很苛刻。今天试着对自己说一句「没关系」。", color: "#f0c27f" },
  { question: "今天有没有一件小事让你感觉好一点？", detail: "哪怕只是一杯热茶、一段音乐、一道夕阳。记录下来，它们是生活的锚点。", color: "#a8b5a0" },
  { question: "如果今天是一句话，它会是什么？", detail: "不用很深刻，不用很精彩。只是你此刻最真实的感受。", color: "#d4a373" },
  { question: "你今天最想感谢什么？", detail: "可以是一个人、一件事、或者只是——今天你还好好地在这里。", color: "#e8c9a9" },
  { question: "如果可以给昨天的自己一个建议，你会说什么？", detail: "不用是「振作起来」这种话。也许只是一句「早点睡」或者「饭要按时吃」。", color: "#c8d2c0" },
  { question: "你最近一次笑是因为什么？", detail: "试着回忆一下。如果太久想不起来，今天去找一个让你笑的理由。", color: "#f0c27f" },
  { question: "今天你为自己做了什么？", detail: "哪怕只是洗了澡、换了床单、给植物浇了水。照顾自己，是重要的能力。", color: "#a8b5a0" },
  { question: "你现在最需要的什么？", detail: "是一个拥抱？是一句肯定？是一个方向？还是只是——好好睡一觉。", color: "#d4a373" },
  { question: "今天有什么让你觉得「还算不错」的瞬间？", detail: "低谷里的一点点好，也值得被放大。", color: "#e8c9a9" },
  { question: "你想对低谷渡口的其他人说什么？", detail: "可以是一句鼓励，也可以只是一句「我在这里」。", color: "#c8d2c0" },
];

export async function GET(req) {
  const today = new Date().toISOString().slice(0, 10);
  const dayOfYear = Math.floor((Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) - Date.UTC(new Date().getFullYear(), 0, 0)) / 86400000);
  const topic = topics[dayOfYear % topics.length];

  // Count how many people checked in today
  const db = getDb();
  const todayCount = db.checkIns.filter(c => c.date === today).length;

  return Response.json({ ...topic, date: today, todayCheckins: todayCount });
}