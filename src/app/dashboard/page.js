"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMe, getPosts, getAchievements, getDailyTopic, getState } from "@/lib/api";
import Logo from "@/components/Logo";
import { useTheme } from "@/components/ThemeProvider";

export default function Dashboard() {
  const router = useRouter();
  const { isNight } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkinToday, setCheckinToday] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [locked, setLocked] = useState([]);
  const [warmth, setWarmth] = useState(0);
  const [topic, setTopic] = useState(null);
  const [onlineCount] = useState(() => Math.floor(Math.random() * 12) + 3);
  const [allCheckins, setAllCheckins] = useState([]);
  const [userState, setUserState] = useState(null);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneDays, setMilestoneDays] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    getMe().then((data) => { if (!data.user) { router.push(''); return; } setUser(data.user); loadData(); }).catch(() => router.push(''));
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [cRes, { posts }, achData, topicData, stateData] = await Promise.all([
        fetch("/api/checkin", { headers: { "Authorization": "Bearer " + token } }).then(r=>r.json()),
        getPosts(), getAchievements(), getDailyTopic(), getState()
      ]);
      if (cRes.today && cRes.today.date === new Date().toISOString().slice(0,10)) setCheckinToday(cRes.today);
      setAllCheckins(cRes.all || []);
      setRecentPosts(posts || []);
      setAchievements(achData.achievements || []);
      setLocked(achData.locked || []);
      setWarmth(achData.warmth || 0);
      setTopic(topicData);
      checkMilestone(achData);
      if (stateData.state) setUserState(stateData.state);
      // Load notifications
      try {
        const token = localStorage.getItem("token");
        const nRes = await fetch("/api/notifications", { headers: { "Authorization": "Bearer " + token } });
        const nData = await nRes.json();
        const unread = (nData.notifications || []).filter(n => !n.read);
        setNotifications(unread);
        if (unread.length > 0) setShowNotif(true);
      } catch {}
    } catch {}
    setLoading(false);
  };

  const checkMilestone = (achData) => {
    const milestones = [7, 14, 21, 30, 60, 100];
    const streak = achData.streak || 0;
    const matched = milestones.find(m => streak >= m && !localStorage.getItem("milestone_" + m));
    if (matched) {
      setMilestoneDays(matched);
      setShowMilestone(true);
      localStorage.setItem("milestone_" + matched, "1");
    }
  };

  const handleLogout = () => { localStorage.removeItem('token'); router.push(''); };

  const markNotifRead = async (notifId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token }, body: JSON.stringify({ action: "markRead", notificationId: notifId }) });
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      if (notifications.length <= 1) setShowNotif(false);
    } catch {}
  };

  const moodEmoji = {"calm":"🌀","tailwind":"⛵","headwind":"🌊","fog":"🌫️","reef":"🪨","lighthouse":"🗼","平静":"🌀","还好":"⛵","疲惫":"🌊","有希望":"🗼","崩溃":"🪨","治愈":"⛵"};
  const moodColors = {"calm":"#a8b5a0","tailwind":"#6ab04c","headwind":"#8a7a6e","fog":"#a8b8d4","reef":"#e74c3c","lighthouse":"#f0c27f","平静":"#a8b5a0","还好":"#6ab04c","疲惫":"#8a7a6e","有希望":"#f0c27f","崩溃":"#e74c3c","治愈":"#6ab04c"};
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0,10);
    const c = allCheckins.find(cin => cin.date === d);
    last7.push({ date: d, checkin: c, mood: c?.mood || null, day: ["日","一","二","三","四","五","六"][new Date(d).getDay()] });
  }

  if (loading) return <div className="dashboard"><div className="spinner" /></div>;

  const st = userState || { mode: "companion", emoji: "🌊", label: "陪伴模式", quote: "", tip: "", color: "#a8b5a0" };

  return (
    <div className="dashboard">
      <header className="dh"><div className="dh-in"><a href="/dashboard" className="dh-brand"><Logo size={24} showText={false} /></a><div className="d-nav"><a href="/dashboard" className=" active"><span>🚢</span><span className="nav-label">登船口</span></a><a href="/checkin"><span>⚓</span><span className="nav-label">航海日志</span></a><a href="/community"><span>🍃</span><span className="nav-label">低语台</span></a><a href="/treehole"><span>🍾</span><span className="nav-label">漂流瓶</span></a><a href="/skills"><span>🏮</span><span className="nav-label">互助港湾</span></a><a href="/capsule"><span>🌊</span><span className="nav-label">时间海</span></a><a href="/buddy"><span>👥</span><span className="nav-label">觅舟友</span></a><a href="/notifications" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>🔔</a><a href="/profile" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>
          👤</a><button onClick={()=>{localStorage.removeItem('token');window.location.href="/"}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".75rem",cursor:"pointer",padding:"6px 10px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onmouseenter={e=>e.target.style.color='rgba(255,255,255,.7)'} onmouseleave={e=>e.target.style.color='rgba(255,255,255,.35)'}>退出</button><button id="nav-theme-toggle" onClick={function(){if(window.__toggleTheme)window.__toggleTheme()}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".85rem",cursor:"pointer",padding:"6px 8px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} title="切换主题">🌓</button></div></div></header>
      <div className="db">

        {/* ===== 状态横幅 ===== */}
        <div className="card" style={{
          marginBottom:"24px",
          background: st.bg || "linear-gradient(135deg,#1a1a2e,#2d2d44)",
          border:"none",
          padding:"32px 28px",
          position:"relative",
          overflow:"hidden"
        }}>
          {/* Decorative glow */}
          <div style={{position:"absolute",top:"-40%",right:"-10%",width:"200px",height:"200px",borderRadius:"50%",background:`radial-gradient(circle,rgba(240,194,127,.08),transparent)`,pointerEvents:"none"}} />
          <div style={{position:"relative",zIndex:2}}>
            <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"12px"}}>
              <span style={{fontSize:"2.4rem",lineHeight:1}}>{st.emoji}</span>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <span style={{fontSize:"1.3rem",fontWeight:700,color:"var(--cream)",letterSpacing:"0.5px"}}>{st.label}</span>
                  <span className="badge" style={{background:"rgba(240,194,127,.12)",color:"var(--warm-glow)",fontSize:".72rem",padding:"3px 10px"}}>{st.badge}</span>
                </div>
                <p style={{fontSize:".78rem",color:"rgba(250,246,240,.3)",marginTop:"2px"}}>{st.reason || (st.checkinDays > 0 ? `已打卡 ${st.checkinDays} 天` : "尚未打卡")}</p>
              </div>
            </div>
            <div style={{borderLeft:"2px solid rgba(240,194,127,.2)",paddingLeft:"18px",margin:"16px 0 20px"}}>
              <p style={{fontSize:"1rem",color:"rgba(250,246,240,.7)",lineHeight:"1.9",whiteSpace:"pre-wrap",fontStyle:"italic"}}>{st.quote}</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
              <a href={st.action?.link || "/checkin"} className="btn btn--primary btn--sm">{st.action?.text || "去打卡 →"}</a>
              {!checkinToday && <a href="/checkin" className="btn btn--ghost btn--sm" style={{borderColor:"rgba(255,255,255,.15)",color:"rgba(250,246,240,.5)"}}>📝 今日打卡</a>}
            </div>
          </div>
        </div>

        {/* ===== 深夜提示 ===== */}
        {isNight && (
          <div className="card" style={{marginBottom:"24px",background:"rgba(240,194,127,.04)",border:"1px solid rgba(240,194,127,.08)",textAlign:"center",padding:"14px"}}>
            <p style={{fontSize:".85rem",color:"var(--warm-glow)",opacity:0.7}}>🌙 深夜模式 · 还有 {onlineCount + Math.floor(Math.random()*5)} 人醒着</p>
          </div>
        )}

        <h1 className="db-title" style={isNight ? {color:"var(--cream)"} : {}}>
          🌊 欢迎回来{isNight ? "，还没睡吗" : ""}
        </h1>

        {/* ===== 状态提示 ===== */}
        <div className="card card--tight" style={{marginBottom:"24px"}}>
          <p style={{fontSize:".9rem",color: isNight ? "rgba(250,246,240,.6)" : "var(--text-light)",lineHeight:"1.9"}}>
            {st.mode === "rest" && st.tip}
            {st.mode === "forward" && st.tip}
            {st.mode === "companion" && (checkinToday ? "今天已经打卡了。你做得很好。" : "今天还没有打卡。想打就打，不想打也没关系。")}
          </p>
        </div>

        
        {/* ===== 今日话题 ===== */}
        {topic && topic.question && (
          <div className="card" style={{
            marginBottom:"24px",
            background: isNight ? "rgba(255,255,255,.04)" : "linear-gradient(135deg,#faf6f0,#f0e8dc)",
            borderLeft: "4px solid " + (topic.color || "var(--warm-glow)")
          }}>
            <div style={{display:"flex",alignItems:"flex-start",gap:"14px"}}>
              <span style={{fontSize:"1.3rem",flexShrink:0,lineHeight:1.5}}>💭</span>
              <div>
                <p style={{fontSize:".75rem",color:"var(--text-muted)",marginBottom:"4px",letterSpacing:"1px"}}>今日话题</p>
                <p style={{fontSize:"1.05rem",fontWeight:600,color:"var(--night)",lineHeight:"1.7",marginBottom:"6px"}}>{topic.question}</p>
                {topic.detail && <p style={{fontSize:".85rem",color: isNight ? "rgba(250,246,240,.45)" : "var(--text-light)",lineHeight:"1.7"}}>{topic.detail}</p>}
                <div style={{marginTop:"10px",display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                  <a href="/checkin" className="btn btn--primary btn--sm" style={{fontSize:".78rem",padding:"5px 16px"}}>以此打卡</a>
                  <a href="/community" className="btn btn--ghost btn--sm" style={{fontSize:".78rem",padding:"5px 16px"}}>去低语台聊聊</a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== 快捷入口 ===== */}
        <div className="grid-2" style={{marginBottom:"24px"}}>
          <a href="/checkin" className="card card--tight" style={{display:"flex",alignItems:"center",justifyContent:"space-between",textDecoration:"none",cursor:"pointer"}}><span>📝 每日打卡</span><span style={{color:"var(--text-muted)"}}>→</span></a>
          <a href="/community" className="card card--tight" style={{display:"flex",alignItems:"center",justifyContent:"space-between",textDecoration:"none",cursor:"pointer"}}><span>🍃 低语台动态</span><span style={{color:"var(--text-muted)"}}>→</span></a>
        </div>

        {/* ===== 近7天心情 ===== */}
        {allCheckins.length > 0 && (
          <div className="card" style={{marginBottom:"24px"}}>
            <h3 style={{fontSize:"1rem",fontWeight:600,color:"var(--night)",marginBottom:"16px"}}>📊 近7天心情</h3>
            <div style={{display:"flex",alignItems:"flex-end",gap:"8px",height:"100px",padding:"0 4px"}}>
              {last7.map((d,i) => (
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
                  <div style={{fontSize:".85rem"}}>{d.mood ? moodEmoji[d.mood] : ""}</div>
                  <div style={{width:"100%",height:(d.mood?60+Math.random()*30:10)+"px",borderRadius:"6px 6px 0 0",background:d.mood?(moodColors[d.mood]||"var(--warm-glow)"):"#eee",opacity:d.mood?.8:.3,minHeight:"6px"}} />
                  <div style={{fontSize:".65rem",color:"var(--text-muted)"}}>{d.day}</div>
                </div>
              ))}
            </div>
            {userState && (
              <div style={{marginTop:"12px",paddingTop:"12px",borderTop:"1px solid rgba(240,194,127,.08)",textAlign:"center"}}>
                <span style={{fontSize:".78rem",color:"var(--text-muted)"}}>
                  连续打卡 <strong style={{color:st.color}}>{st.streak || 0}</strong> 天 · 
                  基于心情数据，你当前为 <strong style={{color:st.color}}>{st.emoji} {st.label}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* ===== 通知 ===== */}
        {showNotif && notifications.length > 0 && (
          <div className="card" style={{marginBottom:"24px",background:"linear-gradient(135deg,rgba(240,194,127,.08),rgba(240,194,127,.02))",border:"1px solid rgba(240,194,127,.15)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <h3 style={{fontSize:"1rem",fontWeight:600,color:"var(--warm-glow)"}}>🔔 新消息</h3>
              <button onClick={()=>setShowNotif(false)} style={{background:"none",border:"none",fontSize:".78rem",color:"var(--text-muted)",cursor:"pointer",fontFamily:"inherit"}}>收起 ×</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {notifications.map(n => (
                <div key={n.id} style={{display:"flex",alignItems:"flex-start",gap:"12px",padding:"12px 16px",background:"rgba(255,255,255,.6)",borderRadius:"var(--radius-sm)"}}>
                  <span style={{fontSize:"1.2rem",flexShrink:0}}>🤝</span>
                  <div style={{flex:1}}>
                    <p style={{fontSize:".88rem",fontWeight:600,color:"var(--night)",marginBottom:"2px"}}>{n.title}</p>
                    <p style={{fontSize:".82rem",color:"var(--text-light)",lineHeight:"1.6"}}>{n.content}</p>
                  </div>
                  <button onClick={()=>markNotifRead(n.id)} style={{background:"var(--warm-glow-dim)",border:"none",color:"var(--warm-glow)",fontSize:".72rem",padding:"4px 10px",borderRadius:"40px",cursor:"pointer",fontFamily:"inherit",fontWeight:500,flexShrink:0}}>知道了</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== 成就 ===== */}
        <div className="card" style={{marginBottom:"24px"}}>
          <h3 style={{fontSize:"1rem",fontWeight:600,color:"var(--night)",marginBottom:"12px"}}>🏆 成就 · {achievements.length} 项已解锁</h3>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"12px"}}>
            {achievements.map(a => (
              <div key={a.id} style={{display:"flex",alignItems:"center",gap:"4px",padding:"4px 12px",borderRadius:"40px",background:"var(--warm-glow-dim)",fontSize:".8rem",color:"var(--warm-glow)"}}>
                <span>{a.icon}</span><span style={{fontWeight:500}}>{a.title}</span>
              </div>
            ))}
          </div>
          {locked.length > 0 && (
            <>
              <p style={{fontSize:".78rem",color:"var(--text-muted)",marginBottom:"6px"}}>🔒 待解锁</p>
              <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                {locked.map(a => (
                  <div key={a.id} style={{display:"flex",alignItems:"center",gap:"4px",padding:"4px 12px",borderRadius:"40px",background:"#f0f0f0",fontSize:".76rem",color:"var(--text-muted)",opacity:.5}}>
                    <span>{a.icon}</span><span>{a.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ===== 最新动态 ===== */}
        <h2 style={{fontSize:"1.05rem",fontWeight:600,color:"var(--night)",marginBottom:"16px"}}>📌 最新动态</h2>
        {recentPosts.length === 0 ? (
          <div className="card" style={{textAlign:"center",color:"var(--text-muted)",padding:"40px"}}><p style={{fontSize:"1.5rem",marginBottom:"8px"}}>💭</p><p>还没有人发帖。</p><a href="/community" className="btn btn--primary btn--sm" style={{marginTop:"16px"}}>去低语台</a></div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            {recentPosts.slice(0,5).map(p => (
              <div key={p.id} className="pc" style={{}}>
                <div className="pc-m" style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                  <div style={{width:"24px",height:"24px",borderRadius:"50%",overflow:"hidden",flexShrink:0,background:"linear-gradient(135deg,#f0c27f,#dba76a)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:".7rem",verticalAlign:"middle"}}>
                    {!p.is_anonymous && p.avatar && (p.avatar.indexOf("data:")===0||p.avatar.indexOf("http")===0) ? (
                      <img src={p.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    ) : (
                      <span>{p.is_anonymous ? "?" : (p.avatar || "👤")}</span>
                    )}
                  </div>
                  <span className="pc-a">{p.is_anonymous?"匿名":(p.username||"渡口居民")}</span>
                  <span style={{fontSize:".72rem",color:"var(--text-muted)"}}>{p.created_at?.slice(0,10)}</span>
                  {p.category && <span className="badge badge--ghost">{p.category}</span>}
                </div>
                {p.title && <div className="pc-t" style={{}}>{p.title}</div>}
                <div className="pc-c">{p.content?.length>100 ? p.content.slice(0,100)+"..." : p.content}</div>
                {p.images && p.images.length > 0 && (
                  <div style={{display:"flex",gap:"8px",marginTop:"10px",flexWrap:"wrap"}}>
                    {p.images.slice(0,3).map(function(img, idx) {
                      return (
                        <div key={idx} style={{width:"80px",height:"80px",borderRadius:"8px",overflow:"hidden",flexShrink:0,border:"1px solid var(--border)"}}>
                          <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                        </div>
                      );
                    })}
                    {p.images.length > 3 && (
                      <div style={{width:"80px",height:"80px",borderRadius:"8px",background:"var(--cream)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".8rem",color:"var(--text-muted)"}}>+{p.images.length-3}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ===== 在线人数 ===== */}
        <div className="card card--tight" style={{marginTop:"24px",textAlign:"center"}}>
          <p style={{fontSize:".82rem",color:"var(--text-muted)"}}>
            <span className="online-dot" />此刻在线 <strong style={{color:st.color}}>{onlineCount + 3}</strong> 人 · 今天有 <strong style={{color:st.color}}>{topic?.todayCheckins || 0}</strong> 人写了航海日志
          </p>
        </div>
      </div>
    
        {/* ===== 里程碑弹窗 ===== */}
      {showMilestone && (
        <div className="modal-overlay" onClick={()=>setShowMilestone(false)}>
          <div className="modal-content" style={{textAlign:"center",padding:"40px 32px 32px",position:"relative",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            {[[20,25,"#f0c27f"],[40,15,"#ff6b6b"],[60,30,"#6ab04c"],[80,20,"#a8b5a0"],[30,40,"#f0c6d6"],[70,35,"#a8d5ba"],[50,10,"#f0c27f"],[85,25,"#6ab04c"]].map(([l,t,c],i) => (
              <div key={i} className="confetti-piece" style={{left:l+"%",top:t+"%",background:c,animationDelay:i*0.1+"s"}} />
            ))}
            <div className="achievement-badge" style={{fontSize:"3.5rem",marginBottom:"12px"}}>🎉</div>
            <h3 className="achievement-badge" style={{fontSize:"1.2rem",fontWeight:700,color:"var(--night)",marginBottom:"8px"}}>连续打卡 <span style={{color:"var(--warm-glow)"}}>{milestoneDays}</span> 天！</h3>
            <p className="achievement-badge" style={{fontSize:".9rem",color:"var(--text-light)",lineHeight:"1.8",marginBottom:"20px"}}>你真的很了不起。<br/>要不要写一封时光胶囊，给未来的自己？</p>
            <div className="achievement-badge" style={{display:"flex",gap:"12px",justifyContent:"center"}}>
              <button onClick={()=>{setShowMilestone(false);router.push('')}} className="btn btn--primary btn--sm">📮 写一封</button>
              <button onClick={()=>setShowMilestone(false)} className="btn btn--ghost btn--sm">下次再说</button>
            </div>
          </div>
        </div>
      )}

            {/* ===== 浮动在线人数 ===== */}
        <div style={{
          position:"fixed", bottom:"24px", right:"24px", zIndex:999,
          display:"flex", alignItems:"center", gap:"8px",
          background:"rgba(26,26,46,.88)", backdropFilter:"blur(16px)",
          padding:"12px 22px", borderRadius:"40px",
          border:"1px solid rgba(240,194,127,.18)",
          boxShadow:"0 4px 28px rgba(0,0,0,.35)",
          cursor:"pointer",
          transition:"all .4s cubic-bezier(.25,.46,.45,.94)"
        }}
          onMouseEnter={function(e){e.currentTarget.style.transform='translateY(-6px) scale(1.03)'}}
          onMouseLeave={function(e){e.currentTarget.style.transform=''}}
          onClick={()=>document.getElementById('')?.click()}
        >
          <span className="online-dot" style={{width:"10px",height:"10px"}} />
          <span style={{fontSize:".82rem",color:"rgba(250,246,240,.6)"}}>
            在线 <strong style={{color:"var(--warm-glow)",fontWeight:700}}>{onlineCount + Math.floor(Math.random()*5)}</strong> 人
          </span>
          <span style={{fontSize:".65rem",color:"rgba(250,246,240,.2)",marginLeft:"4px"}}>🍃</span>
        </div>

    </div>
  );
}





