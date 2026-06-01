"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { getMe } from "@/lib/api";

const avatarOptions = ["👤","🌊","🌸","🌟","🦋","🌙","🍀","🌈","🕊️","🎵","📚","☕","🎨","🌻","🍃","💫"];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("👤");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getMe().then(async (d) => {
      if (!d.user) { router.push(''); return; }
      setUser(d.user);
      await loadProfile();
    }).catch(() => router.push(''));
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/profile", { headers: { "Authorization": "Bearer " + token } });
      const d = await res.json();
      if (d.user) {
        setUsername(d.user.username || "");
        setAvatar(d.user.avatar || "👤");
        setBio(d.user.bio || "");
      }
    } catch {}
    setLoading(false);
  };

  const handleUploadImage = (e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 2*1024*1024) { setMsg('图片不能超过 2MB'); setTimeout(()=>setMsg(''),2000); return; } const reader = new FileReader(); reader.onload = (ev) => { setAvatar(ev.target?.result || avatar); }; reader.readAsDataURL(file); }; const saveProfile = async () => {
    if (!username.trim()) { setMsg("昵称不能为空"); setTimeout(() => setMsg(""), 2000); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ username: username.trim(), avatar, bio: bio.trim() })
      });
      const d = await res.json();
      if (d.ok) setMsg("✅ 保存成功！");
      else setMsg("保存失败");
    } catch { setMsg("保存失败"); }
    setSaving(false);
    setTimeout(() => setMsg(""), 2000);
  };

  if (loading) return <div className="dashboard"><div className="spinner" /></div>;

  return (
    <div className="dashboard">
      <header className="dh"><div className="dh-in"><a href="/dashboard" className="dh-brand"><Logo size={20} showText={false} /></a><div className="d-nav"><a href="/dashboard"><span>🚢</span><span className="nav-label">登船口</span></a><a href="/checkin"><span>⚓</span><span className="nav-label">航海日志</span></a><a href="/community"><span>🍃</span><span className="nav-label">低语台</span></a><a href="/treehole"><span>🍾</span><span className="nav-label">漂流瓶</span></a><a href="/skills"><span>🏮</span><span className="nav-label">互助港湾</span></a><a href="/capsule"><span>🌊</span><span className="nav-label">时间海</span></a><a href="/buddy"><span>👥</span><span className="nav-label">觅舟友</span></a><a href="/notifications" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>🔔</a><a href="/profile" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>👤</a><button onClick={()=>{localStorage.removeItem('token');window.location.href="/"}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".75rem",cursor:"pointer",padding:"6px 10px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onmouseenter={e=>e.target.style.color='rgba(255,255,255,.7)'} onmouseleave={e=>e.target.style.color='rgba(255,255,255,.35)'}>退出</button><button id="nav-theme-toggle" onClick={function(){if(window.__toggleTheme)window.__toggleTheme()}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".85rem",cursor:"pointer",padding:"6px 8px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} title="切换主题">🌓</button></div></div></header>
      <div className="db">
        <h1 className="db-title">👤 个人资料</h1>

        {msg && (
          <div style={{padding:"10px 18px",background:"var(--warm-glow-dim)",border:"1px solid var(--warm-glow)",borderRadius:"12px",textAlign:"center",marginBottom:"16px"}}>
            <p style={{fontSize:".85rem",color:"var(--warm-glow)"}}>{msg}</p>
          </div>
        )}

        {/* Avatar picker */}
        <div className="card" style={{marginBottom:"20px",textAlign:"center"}}>
          <div style={{position:"relative",display:"inline-block",marginBottom:"12px"}}>{avatar?.startsWith("data:")||avatar?.startsWith("http")?(<img src={avatar} alt="avatar" style={{width:"72px",height:"72px",borderRadius:"50%",objectFit:"cover",border:"2px solid var(--warm-glow)"}} />):(<p style={{fontSize:"3.5rem",marginBottom:"0"}}>{avatar}</p>)}</div>
          <p style={{fontSize:".85rem",color:"var(--text-light)",marginBottom:"12px"}}>选择你的头像</p>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",justifyContent:"center"}}>
            {avatarOptions.map(a => (
              <button key={a} onClick={()=>setAvatar(a)} style={{
                fontSize:"1.5rem",width:"44px",height:"44px",borderRadius:"50%",
                border: avatar === a ? "2px solid var(--warm-glow)" : "2px solid transparent",
                background: avatar === a ? "var(--warm-glow-dim)" : "var(--cream)",
                cursor:"pointer",transition:"all .2s"
              }}>{a}</button>
            ))}
          </div>
        </div>
          <div style={{marginTop:"12px"}}><label className="btn btn--ghost btn--sm" style={{fontSize:".78rem",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"4px"}}>📷 上传图片<input type="file" accept="image/*" style={{display:"none"}} onChange={handleUploadImage} /></label></div>

        {/* Edit form */}
        <div className="card" style={{marginBottom:"20px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            <div>
              <label style={{fontSize:".82rem",color:"var(--text-light)",display:"block",marginBottom:"4px"}}>昵称</label>
              <input className="input" placeholder="你的昵称" value={username} onChange={e=>setUsername(e.target.value)} />
            </div>
            <div>
              <label style={{fontSize:".82rem",color:"var(--text-light)",display:"block",marginBottom:"4px"}}>个人简介</label>
              <textarea className="input" style={{minHeight:"80px",resize:"vertical",fontFamily:"inherit",lineHeight:"1.8"}} placeholder="写一句自我介绍吧…" value={bio} onChange={e=>setBio(e.target.value)} />
            </div>
            <div>
              <p style={{fontSize:".82rem",color:"var(--text-muted)"}}>邮箱：{user?.email || ""}</p>
            </div>
            <button onClick={saveProfile} disabled={saving} className="btn btn--primary btn--block">
              {saving ? "保存中..." : "💾 保存修改"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}