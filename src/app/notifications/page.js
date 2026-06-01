"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { getMe } from "@/lib/api";

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then(d => { if (!d.user) { router.push(''); return; } setUser(d.user); loadNotifs(); }).catch(() => router.push(''));
  }, []);

  const loadNotifs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/notifications", { headers: { "Authorization": "Bearer " + token } });
      const d = await res.json();
      setNotifs(d.notifications || []);
    } catch {}
    setLoading(false);
  };

  const markRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token }, body: JSON.stringify({ action: "markRead", notificationId: id }) });
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const getIcon = (type) => {
    const icons = { "new_message": "💌", "bottle_reply": "🍾", "exchange_request": "🚢", "system": "🌿" };
    return icons[type] || "🔔";
  };

  if (loading) return <div className="dashboard"><div className="spinner" /></div>;

  return (
    <div className="dashboard">
      <header className="dh"><div className="dh-in"><a href="/dashboard" className="dh-brand"><Logo size={20} showText={false} /></a><div className="d-nav"><a href="/dashboard"><span>🚢</span><span className="nav-label">登船口</span></a><a href="/checkin"><span>⚓</span><span className="nav-label">航海日志</span></a><a href="/community"><span>🍃</span><span className="nav-label">低语台</span></a><a href="/treehole"><span>🍾</span><span className="nav-label">漂流瓶</span></a><a href="/skills"><span>🏮</span><span className="nav-label">互助港湾</span></a><a href="/capsule"><span>🌊</span><span className="nav-label">时间海</span></a><a href="/buddy"><span>👥</span><span className="nav-label">觅舟友</span></a><a href="/notifications" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>🔔</a><a href="/profile" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>👤</a><button onClick={()=>{localStorage.removeItem('token');window.location.href="/"}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".75rem",cursor:"pointer",padding:"6px 10px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onmouseenter={e=>e.target.style.color='rgba(255,255,255,.7)'} onmouseleave={e=>e.target.style.color='rgba(255,255,255,.35)'}>退出</button><button id="nav-theme-toggle" onClick={function(){if(window.__toggleTheme)window.__toggleTheme()}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".85rem",cursor:"pointer",padding:"6px 8px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} title="切换主题">🌓</button></div></div></header>
      <div className="db">
        <h1 className="db-title">🔔 消息中心</h1>
        <p style={{color:"var(--text-light)",fontSize:".9rem",marginBottom:"24px"}}>你的私信、交换意向和漂流瓶回信都会出现在这里。</p>

        {notifs.length === 0 ? (
          <div className="card" style={{textAlign:"center",padding:"48px 24px"}}>
            <p style={{fontSize:"2.5rem",marginBottom:"12px",opacity:.4}}>🔔</p>
            <p style={{color:"var(--text-muted)",fontSize:".9rem"}}>还没有消息</p>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {notifs.map(n => (
              <div key={n.id} className="card" style={{
                padding:"16px 20px", cursor:"pointer",
                opacity: n.read ? 0.6 : 1,
                borderLeft: n.read ? "3px solid transparent" : "3px solid var(--warm-glow)"
              }} onClick={() => { if (!n.read) markRead(n.id); }}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
                  <span style={{fontSize:"1.3rem",flexShrink:0}}>{getIcon(n.type)}</span>
                  <div style={{flex:1}}>
                    <p style={{fontSize:".9rem",color:"var(--text)",fontWeight:n.read?400:600,marginBottom:"4px"}}>{n.title}</p>
                    <p style={{fontSize:".82rem",color:"var(--text-light)",lineHeight:"1.5"}}>{n.content}</p>
                    <p style={{fontSize:".7rem",color:"var(--text-muted)",marginTop:"6px"}}>{n.created_at?.slice(0,16).replace("T"," ")}</p>
                  </div>
                  {n.type === "new_message" && (
                    <button onClick={(e) => { e.stopPropagation(); markRead(n.id); router.push("/buddy?with=" + n.relatedId); }} className="btn btn--primary btn--sm" style={{fontSize:".72rem",padding:"4px 10px",flexShrink:0}}>去回复</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}