-- ========================================
-- 低谷渡口 - Supabase 数据库建表脚本
-- 用法：在 Supabase Dashboard → SQL Editor 中执行
-- ========================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT DEFAULT '',
  email TEXT UNIQUE,
  password TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
  last_checkin TEXT DEFAULT '',
  streak INTEGER DEFAULT 0,
  achievements TEXT DEFAULT '[]'
);

-- 2. 打卡记录
CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  date TEXT,
  mood TEXT,
  note TEXT DEFAULT '',
  created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- 3. 帖子（低语台）
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  title TEXT DEFAULT '',
  content TEXT,
  category TEXT DEFAULT '心情',
  images TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- 4. 评论
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES posts(id),
  user_id TEXT REFERENCES users(id),
  content TEXT,
  created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- 5. 互动（点赞/表情）
CREATE TABLE IF NOT EXISTS reactions (
  id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES posts(id),
  user_id TEXT REFERENCES users(id),
  type TEXT DEFAULT 'like',
  created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- 6. 漂流瓶
CREATE TABLE IF NOT EXISTS treeholes (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  content TEXT,
  mood_tag TEXT DEFAULT '',
  is_picked INTEGER DEFAULT 0,
  picked_by TEXT DEFAULT '',
  anonymous_name TEXT DEFAULT '',
  created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- 7. 漂流瓶回复
CREATE TABLE IF NOT EXISTS bottle_replies (
  id TEXT PRIMARY KEY,
  bottle_id TEXT REFERENCES treeholes(id),
  sender_id TEXT REFERENCES users(id),
  content TEXT,
  created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- 8. 技能交换
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  can_provide TEXT,
  need TEXT,
  bio TEXT DEFAULT '',
  status TEXT DEFAULT 'available',
  created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- 9. 技能消息
CREATE TABLE IF NOT EXISTS skill_messages (
  id TEXT PRIMARY KEY,
  exchange_id TEXT REFERENCES skills(id),
  sender_id TEXT REFERENCES users(id),
  receiver_id TEXT REFERENCES users(id),
  content TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- 10. 时光胶囊
CREATE TABLE IF NOT EXISTS time_capsules (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  content TEXT,
  subject TEXT DEFAULT '',
  deliver_at TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- 11. 私信
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT REFERENCES users(id),
  receiver_id TEXT REFERENCES users(id),
  content TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- 12. 鼓励语录
CREATE TABLE IF NOT EXISTS encouragements (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  text TEXT,
  author TEXT DEFAULT '',
  shown_date TEXT
);

-- 13. 配对
CREATE TABLE IF NOT EXISTS pairs (
  id TEXT PRIMARY KEY,
  from_id TEXT REFERENCES users(id),
  to_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- 14. 用户位置
CREATE TABLE IF NOT EXISTS user_locations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  lat REAL,
  lng REAL,
  updated_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- 15. 通知
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT DEFAULT 'system',
  content TEXT,
  is_read INTEGER DEFAULT 0,
  related_id TEXT DEFAULT '',
  created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- 16. 每日话题
CREATE TABLE IF NOT EXISTS daily_topics (
  id TEXT PRIMARY KEY,
  date TEXT,
  title TEXT,
  content TEXT,
  created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- ========================================
-- 启用 Row Level Security（可选）
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treeholes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottle_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE encouragements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_topics ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 创建公共访问策略（允许所有操作）
-- ========================================
CREATE POLICY "公开访问" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "公开访问" ON checkins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "公开访问" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "公开访问" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "公开访问" ON reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "公开访问" ON treeholes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "公开访问" ON bottle_replies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "公开访问" ON skills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "公开访问" ON skill_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "公开访问" ON time_capsules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "公开访问" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "公开访问" ON encouragements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "公开访问" ON pairs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "公开访问" ON user_locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "公开访问" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "公开访问" ON daily_topics FOR ALL USING (true) WITH CHECK (true);
