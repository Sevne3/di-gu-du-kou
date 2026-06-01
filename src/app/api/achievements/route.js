import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return Response.json({ error: "请先登录" }, { status: 401 });

  const db = getDb();
  const uid = payload.userId;
  const user = db.users.find(u => u.id === uid);
  const userCheckins = db.checkIns.filter(c => c.user_id === uid);
  const userPosts = db.posts.filter(p => p.user_id === uid);
  const userComments = db.comments.filter(c => c.user_id === uid);
  const userReactions = (db.reactions || []).filter(r => r.user_id === uid);
  const userSkills = (db.skills || []).filter(s => s.user_id === uid);

  const warmth = user?.warmth_score || 0;
  const earned = [];
  const locked = [];

  // Check-in achievements
  const dates = [...new Set(userCheckins.map(c => c.date))].sort();
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (let i = dates.length - 1; i >= 0; i--) {
    const expected = new Date();
    expected.setDate(expected.getDate() - (dates.length - 1 - i));
    if (dates[i] === expected.toISOString().slice(0, 10)) streak++;
    else break;
  }

  const checkinCount = userCheckins.length;
  const achList = [
    { id: "first_checkin", icon: "🌱", title: "第一步", desc: "完成第一次打卡", check: checkinCount >= 1 },
    { id: "streak_3", icon: "💪", title: "小有坚持", desc: "连续打卡3天", check: streak >= 3 },
    { id: "streak_7", icon: "🔥", title: "坚持一周", desc: "连续打卡7天", check: streak >= 7 },
    { id: "streak_14", icon: "🌟", title: "两周坚守", desc: "连续打卡14天", check: streak >= 14 },
    { id: "streak_30", icon: "👑", title: "月度温暖使者", desc: "连续打卡30天", check: streak >= 30 },
    { id: "checkin_7", icon: "📅", title: "累计7天", desc: "累计打卡7天", check: checkinCount >= 7 },
    { id: "checkin_14", icon: "📅", title: "累计14天", desc: "累计打卡14天", check: checkinCount >= 14 },
    { id: "checkin_30", icon: "🌙", title: "月度记录者", desc: "累计打卡30天", check: checkinCount >= 30 },
    // Post achievements
    { id: "first_post", icon: "📢", title: "勇敢发声", desc: "发布第一篇帖子", check: userPosts.length >= 1 },
    { id: "post_3", icon: "🗣️", title: "乐于分享", desc: "发布3篇帖子", check: userPosts.length >= 3 },
    { id: "post_10", icon: "✍️", title: "社群贡献者", desc: "发布10篇帖子", check: userPosts.length >= 10 },
    // Comment achievements
    { id: "first_comment", icon: "💬", title: "温暖回应", desc: "第一次回应别人", check: userComments.length >= 1 },
    { id: "comment_5", icon: "🤗", title: "暖心使者", desc: "回应5个人", check: userComments.length >= 5 },
    { id: "comment_20", icon: "❤️", title: "倾听达人", desc: "回应20个人", check: userComments.length >= 20 },
    // Reaction achievements
    { id: "first_reaction", icon: "👋", title: "我懂你", desc: "第一次给别人的帖子共鸣", check: userReactions.length >= 1 },
    { id: "reaction_10", icon: "🤝", title: "共鸣者", desc: "共鸣10篇帖子", check: userReactions.length >= 10 },
    // Anonymous
    { id: "anonymous", icon: "🕊️", title: "勇敢的匿名者", desc: "使用过匿名发帖", check: userPosts.some(p => p.is_anonymous) },
    // Skills
    { id: "first_skill", icon: "🛠️", title: "技能分享者", desc: "在技能集市发布过技能", check: userSkills.length >= 1 },
    // Warmth
    { id: "warmth_10", icon: "✨", title: "温暖之光", desc: "积累10点温暖值", check: warmth >= 10 },
    { id: "warmth_50", icon: "🔥", title: "温暖火炬", desc: "积累50点温暖值", check: warmth >= 50 },
    { id: "warmth_100", icon: "🌞", title: "太阳", desc: "积累100点温暖值", check: warmth >= 100 },
  ];

  achList.forEach(a => {
    if (a.check) earned.push(a);
    else locked.push(a);
  });

  return Response.json({ achievements: earned, locked: locked.slice(0, 5), streak, checkinCount, warmth });
}