import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const moodType = {
  "reef":"negative","headwind":"negative","fog":"negative",
  "calm":"neutral","tailwind":"positive",
  "lighthouse":"positive",
  "疲惫":"negative","崩溃":"negative",
  "平静":"neutral","还好":"neutral",
  "有希望":"positive","治愈":"positive"
};

const stateConfig = {
  "rest": {
    "label": "休憩模式",
    "emoji": "🌙",
    "badge": "累了就歇歇",
    "color": "#8a7a6e",
    "bg": "linear-gradient(135deg,#2d2d44,#1a1a2e)",
    "quote": "休息不是偷懒。\n是你给自己的温柔。",
    "tip": "今天不需要做任何事。\n躺着、发呆、看云——都可以。",
    "action": {
      "text": "把烦恼扔进瓶子里吧 →",
      "link": "/treehole"
    }
  },
  "companion": {
    "label": "陪伴模式",
    "emoji": "🌊",
    "badge": "平常心，有人在",
    "color": "#a8b5a0",
    "bg": "linear-gradient(135deg,#1a1a2e,#2d2d44)",
    "quote": "不用刻意开心或努力。\n你在这里就很好。",
    "tip": "有人在社群里醒着。\n想说话的时候，那里有人听。",
    "action": {
      "text": "去社群看看 →",
      "link": "/community"
    }
  },
  "forward": {
    "label": "前进模式",
    "emoji": "☀️",
    "badge": "状态不错，继续走",
    "color": "#f0c27f",
    "bg": "linear-gradient(135deg,#1a1a2e,#16213e)",
    "quote": "你已经在往好的方向走了。\n不用太快，保持节奏就好。",
    "tip": "今天要不要试试：\n给自己定一个小小的目标？",
    "action": {
      "text": "去打卡 →",
      "link": "/checkin"
    }
  }
};

export async function GET(req) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ","");
    if (!token) return NextResponse.json({error:"未登录"},{status:401});
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({error:"登录已过期"},{status:401});
    const db = getDb();
    const userCheckins = db.checkIns.filter(c=>c.userId===payload.userId).sort((a,b)=>b.date.localeCompare(a.date));
    const last3 = userCheckins.slice(0,3).map(c=>c.mood);
    let mode = "companion";
    if (last3.length >= 3) {
      var badCount = last3.filter(function(m){return m==="reef"||m==="fog"||m==="疲惫"||m==="崩溃"}).length;
    var types = last3.map(m=>moodType[m]||"neutral");
      if (types.every(function(t){return t==="negative"})) mode = "rest";
      else if (types.every(function(t){return t==="positive"})) mode = "forward";
      else {
        var n = types.filter(function(t){return t==="negative"}).length;
        var p = types.filter(function(t){return t==="positive"}).length;
        if (n >= 2) mode = "rest";
        else if (p >= 2) mode = "forward";
      }
    }
    let reason = "情绪平稳过渡中";
    if (mode === "rest") {
      if (badCount >= 2) reason = "最近连续遇到风浪，先在此停泊休整吧";
      else reason = "最近几天的航行有些吃力";
    }
    else if (mode === "forward") reason = "最近几天的状态比较积极";
    const config = stateConfig[mode];
    let streak = 0, today = new Date();
    for (let i=0;i<30;i++) {
      const d = new Date(today); d.setDate(d.getDate()-i);
      const ds = d.toISOString().slice(0,10);
      if (userCheckins.some(c=>c.date===ds)) streak++;
      else if (i>0) break;
    }
    return NextResponse.json({ state:{mode,reason,...config,checkinDays:userCheckins.length,streak}, recent:userCheckins.slice(0,7), last3Moods:last3 });
  } catch(e) {
    return NextResponse.json({error:e.message},{status:500});
  }
}