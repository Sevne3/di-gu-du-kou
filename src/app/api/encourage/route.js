import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const encouragements = [
  {
    "id": "e01",
    "text": "这一切都会过去的。",
    "author": "亚伯拉罕·林肯"
  },
  {
    "id": "e02",
    "text": "生活就像骑自行车，要保持平衡就得不断前进。",
    "author": "爱因斯坦"
  },
  {
    "id": "e03",
    "text": "黑夜无论怎样悠长，白昼总会到来。",
    "author": "莎士比亚"
  },
  {
    "id": "e04",
    "text": "当你感到绝望时，请记住世界上还有书籍、诗歌和温柔的风。",
    "author": "村上春树"
  },
  {
    "id": "e05",
    "text": "我们都有迷茫的时候，但正是在这些时刻，我们才能找到真正的自己。",
    "author": "赫尔曼·黑塞"
  },
  {
    "id": "e06",
    "text": "山穷水复疑无路，柳暗花明又一村。",
    "author": "陆游"
  },
  {
    "id": "e07",
    "text": "人生不如意事十之八九，常想一二。",
    "author": "林清玄"
  },
  {
    "id": "e08",
    "text": "不要因为走得太远，忘了我们为什么出发。",
    "author": "纪伯伦"
  },
  {
    "id": "e09",
    "text": "世界以痛吻我，要我报之以歌。",
    "author": "泰戈尔"
  },
  {
    "id": "e10",
    "text": "黑夜给了我黑色的眼睛，我却用它寻找光明。",
    "author": "顾城"
  },
  {
    "id": "e11",
    "text": "人生最曼妙的风景，竟是内心的淡定与从容。",
    "author": "杨绛"
  },
  {
    "id": "e12",
    "text": "人生没有白走的路，每一步都算数。",
    "author": "李宗盛"
  },
  {
    "id": "e13",
    "text": "Everything will be okay in the end. If it is not okay, it is not the end.",
    "author": "John Lennon"
  },
  {
    "id": "e14",
    "text": "在你最黑暗的时刻，你才能看到星星。",
    "author": "Emerson"
  },
  {
    "id": "e15",
    "text": "勇气不是没有恐惧，而是面对恐惧依然前行。",
    "author": "Mandela"
  },
  {
    "id": "e16",
    "text": "人可以被毁灭，但不能被打败。",
    "author": "Hemingway"
  },
  {
    "id": "e17",
    "text": "生活是一面镜子，你对它笑，它就对你笑。",
    "author": "萨克雷"
  },
  {
    "id": "e18",
    "text": "真正的勇者，是看透生活的真相后依然热爱生活。",
    "author": "罗曼·罗兰"
  },
  {
    "id": "e19",
    "text": "千里之行，始于足下。",
    "author": "老子"
  },
  {
    "id": "e20",
    "text": "天行健，君子以自强不息。",
    "author": "周易"
  },
  {
    "id": "e21",
    "text": "如果你跌倒了，何不抬头看看星星？",
    "author": "几米"
  },
  {
    "id": "e22",
    "text": "每个人都是月亮，总有一个阴暗面，从来不让人看见。",
    "author": "马克·吐温"
  },
  {
    "id": "e23",
    "text": "即使慢，驰而不息，纵会落后，纵会失败，但一定可以达到他所向的目标。",
    "author": "鲁迅"
  },
  {
    "id": "e24",
    "text": "当你为错过太阳而哭泣的时候，你也将错过群星。",
    "author": "泰戈尔"
  },
  {
    "id": "e25",
    "text": "世界上只有一种真正的英雄主义，那就是在认清生活的真相后依然热爱生活。",
    "author": "罗曼·罗兰"
  },
  {
    "id": "e26",
    "text": "与其诅咒黑暗，不如点燃一支蜡烛。",
    "author": "埃莉诺·罗斯福"
  },
  {
    "id": "e27",
    "text": "在风暴中，总有平静的中心。",
    "author": "安妮·弗兰克"
  },
  {
    "id": "e28",
    "text": "你的负担将变成礼物，你受的苦将照亮你的路。",
    "author": "泰戈尔"
  },
  {
    "id": "e29",
    "text": "那些不能杀死我的，必将使我更强大。",
    "author": "尼采"
  },
  {
    "id": "e30",
    "text": "做一个有太阳的人，温暖自己，也温暖别人。",
    "author": "三毛"
  },
  {
    "id": "e31",
    "text": "不经历风雨，怎么见彩虹。",
    "author": "李宗盛"
  },
  {
    "id": "e32",
    "text": "命运给你一个比别人低的起点，是想告诉你，让你用你的一生去奋斗出一个绝地反击的故事。",
    "author": "刘同"
  },
  {
    "id": "e33",
    "text": "活着，就是一场盛大的遇见。",
    "author": "宫崎骏"
  },
  {
    "id": "e34",
    "text": "没有一个冬天不可逾越，没有一个春天不会来临。",
    "author": "佚名"
  },
  {
    "id": "e35",
    "text": "总要有人仰望星空，不然世界就不会进步。",
    "author": "柏拉图"
  },
  {
    "id": "e36",
    "text": "把脸一直向着阳光，这样就不会看到阴影。",
    "author": "海伦·凯勒"
  },
  {
    "id": "e37",
    "text": "成长是一笔交易，我们都是用朴素的童真与未经人事的洁白交换长大的勇气。",
    "author": "宫崎骏"
  },
  {
    "id": "e38",
    "text": "万物皆有裂痕，那是光照进来的地方。",
    "author": "Leonard Cohen"
  },
  {
    "id": "e39",
    "text": "生活不能等待别人来安排，要自己去争取和奋斗。",
    "author": "路遥"
  },
  {
    "id": "e40",
    "text": "Tomorrow is another day.",
    "author": "玛格丽特·米切尔"
  },
  {
    "id": "e41",
    "text": "我是一只看似孤独的鲸，但我终将遇见另一片海。",
    "author": "佚名"
  },
  {
    "id": "e42",
    "text": "世界上最快乐的事，莫过于为理想而奋斗。",
    "author": "苏格拉底"
  },
  {
    "id": "e43",
    "text": "有些路看起来很很近，可是走下去却很远。",
    "author": "林徽因"
  },
  {
    "id": "e44",
    "text": "人生最大的荣耀不在于从不跌倒，而在于每一次跌倒后都能爬起来。",
    "author": "奥利弗·戈德史密斯"
  },
  {
    "id": "e45",
    "text": "长风破浪会有时，直挂云帆济沧海。",
    "author": "李白"
  },
  {
    "id": "e46",
    "text": "路漫漫其修远兮，吾将上下而求索。",
    "author": "屈原"
  },
  {
    "id": "e47",
    "text": "没有比人更高的山，没有比脚更长的路。",
    "author": "汪国真"
  },
  {
    "id": "e48",
    "text": "也许我们无法改变风向，但我们可以调整风帆。",
    "author": "亚里士多德"
  },
  {
    "id": "e49",
    "text": "生命中最重要的是不是你遭遇了什么，而是你记住了什么，以及你如何铭记它。",
    "author": "Gabriel Garcia Marquez"
  },
  {
    "id": "e50",
    "text": "凡是过往，皆为序章。",
    "author": "莎士比亚"
  }
];

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization");
    const payload = await verifyToken(auth?.replace("Bearer ", ""));
    if (!payload) return NextResponse.json({ error: "请先登录" }, { status: 401 });
    const db = getDb();
    if (!db.shownEncouragements) db.shownEncouragements = {};
    if (!db.shownEncouragements[payload.userId]) db.shownEncouragements[payload.userId] = [];
    const shown = db.shownEncouragements[payload.userId];
    const available = encouragements.filter(e => !shown.includes(e.id));
    const pool = available.length > 0 ? available : encouragements;
    if (available.length === 0) {
      db.shownEncouragements[payload.userId] = [];
      saveDb(db);
    }
    const picked = pool[Math.floor(Math.random() * pool.length)];
    if (!db.shownEncouragements[payload.userId]) db.shownEncouragements[payload.userId] = [];
    db.shownEncouragements[payload.userId].push(picked.id);
    saveDb(db);
    return NextResponse.json({ encouragement: picked, remaining: pool.length - 1 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
