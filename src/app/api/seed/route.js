import { getDb, saveDb } from "@/lib/db";
const bcrypt = require("bcryptjs");

export async function GET() {
  const db = getDb();
  if (db.users.length > 0) return Response.json({ ok: true, message: "已有数据" });

  const ids = { u1: "u_seed_1", u2: "u_seed_2", u3: "u_seed_3", u4: "u_seed_4" };
  const hash = await bcrypt.hash("demo123", 10);
  const now = new Date();

  db.users.push(
    { id: ids.u1, email: "xiaoming@demo.com", password: hash, username: "小明", situation: "失业中", warmth_score: 15, created_at: new Date(now - 86400000*5).toISOString() },
    { id: ids.u2, email: "xiaohong@demo.com", password: hash, username: "小红", situation: "负债中", warmth_score: 8, created_at: new Date(now - 86400000*4).toISOString() },
    { id: ids.u3, email: "xiaogang@demo.com", password: hash, username: "小刚", situation: "迷茫中", warmth_score: 5, created_at: new Date(now - 86400000*3).toISOString() },
    { id: ids.u4, email: "xiaomei@demo.com", password: hash, username: "小美", situation: "原生家庭困扰", warmth_score: 12, created_at: new Date(now - 86400000*2).toISOString() }
  );

  const moods = ["平静","还好","疲惫","有希望","崩溃","治愈"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i*86400000).toISOString().slice(0,10);
    db.checkIns.push(
      { id:"c_1_"+i, user_id:ids.u1, date:d, content:i===0?"投了三份简历":"继续找工作中", mood:moods[i%6], created_at:d+"T12:00:00.000Z" },
      { id:"c_2_"+i, user_id:ids.u2, date:d, content:i===0?"做了顿饭":"好好生活", mood:moods[(i+2)%6], created_at:d+"T12:00:00.000Z" }
    );
  }

  db.posts.push(
    { id:"p_seed_1", user_id:ids.u1, title:"失业第三个月，心态有点崩", content:"面了一家感觉聊得还行，但说等通知。大概率又没戏了。有没有同样经历的人聊聊？", category:"心情", is_anonymous:0, created_at:new Date(now-3600000*2).toISOString() },
    { id:"p_seed_2", user_id:ids.u2, title:"分享一个远程兼职渠道", content:"在做远程数据标注，时薪不高但时间自由，不要求经验。评论区可以找我。", category:"工作互助", is_anonymous:0, created_at:new Date(now-3600000*5).toISOString() },
    { id:"p_seed_3", user_id:ids.u3, title:"深夜睡不着", content:"凌晨两点又醒了。翻了翻以前的照片，那个时候还挺快乐的。", category:"深夜陪伴", is_anonymous:1, created_at:new Date(now-3600000*8).toISOString() },
    { id:"p_seed_4", user_id:ids.u4, title:"免费帮做PPT和海报", content:"自学了设计，PPT美化和海报制作没问题，有需要可以找我。", category:"技能交换", is_anonymous:0, created_at:new Date(now-86400000).toISOString() },
    { id:"p_seed_5", user_id:ids.u1, content:"楼下流浪猫生了一窝小猫，看着它们挤在一起睡觉，觉得生活也没那么糟。", category:"日常", is_anonymous:0, created_at:new Date(now-86400000*2).toISOString() }
  );

  db.comments.push(
    { id:"cm_1", post_id:"p_seed_1", user_id:ids.u2, content:"我失业两个月了，懂你。一起加油。", created_at:new Date(now-3600000).toISOString() },
    { id:"cm_2", post_id:"p_seed_1", user_id:ids.u3, content:"能面就是进步，我之前连面试都约不到。", created_at:new Date(now-1800000).toISOString() },
    { id:"cm_3", post_id:"p_seed_2", user_id:ids.u4, content:"求联系方式！正好在找远程工作。", created_at:new Date(now-3600000*3).toISOString() },
    { id:"cm_4", post_id:"p_seed_3", user_id:ids.u1, content:"我也失眠。睡不着就来看看，知道有人醒着。", created_at:new Date(now-3600000*6).toISOString() },
    { id:"cm_5", post_id:"p_seed_4", user_id:ids.u3, content:"太棒了！需要帮忙做个简历封面！", created_at:new Date(now-3600000*12).toISOString() }
  );

  db.treeholes = [
    { id:"th_1", user_id:ids.u1, content:"地铁上看到一个人穿着一样的旧衣服，突然想哭。不是可怜他，是懂他。", is_public:1, created_at:new Date(now-86400000).toISOString() },
    { id:"th_2", user_id:ids.u3, content:"爸妈又打电话问工作的事了。知道是关心我，但每句都像刀子。", is_public:1, created_at:new Date(now-86400000*2).toISOString() },
    { id:"th_3", user_id:ids.u4, content:"今天有人问我「你还好吗」，差点当众哭出来。太久没人问过了。", is_public:1, created_at:new Date(now-86400000*3).toISOString() },
    { id:"th_4", user_id:ids.u2, content:"其实不是还不起债，是不知道还完以后日子怎么过。", is_public:1, created_at:new Date(now-86400000*4).toISOString() }
  ];

  db.skills = [
    { id:"sk_1", user_id:ids.u4, offer:"PPT设计 / 海报制作", need:"英语陪练 / 简历修改", description:"失业期间自学了设计，熟练PPT美化、海报制作。想换英语口语陪练或简历修改指导。", contact:"xiaomei_wx", status:"open", created_at:new Date(now-86400000*2).toISOString() },
    { id:"sk_2", user_id:ids.u1, offer:"Excel数据处理", need:"写作/文案", description:"做过3年数据分析，Excel和SQL都可以。想学写作，可以互相教。", contact:"ming_2026", status:"open", created_at:new Date(now-86400000).toISOString() }
  ];

  db.reactions = [
    { id:"re_1", user_id:ids.u2, post_id:"p_seed_1", created_at:new Date(now-3600000).toISOString() },
    { id:"re_2", user_id:ids.u3, post_id:"p_seed_1", created_at:new Date(now-1800000).toISOString() },
    { id:"re_3", user_id:ids.u4, post_id:"p_seed_3", created_at:new Date(now-3600000*4).toISOString() },
    { id:"re_4", user_id:ids.u1, post_id:"p_seed_4", created_at:new Date(now-3600000*6).toISOString() }
  ];

  saveDb(db);
  return Response.json({ ok:true, users:4, checkins:14, posts:5, comments:5, treeholes:4, skills:2, reactions:4 });
}