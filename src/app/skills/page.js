"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { getMe, getSkills, createSkill, updateSkill, sendMessage } from "@/lib/api";

const moodIcons = { "available":"🌊", "view_only":"👀", "completed":"✅" };
const moodLabels = { "available":"可交换", "view_only":"仅围观", "completed":"已成交" };
const moodColors = { "available":"#4a9eff", "view_only":"#a8b5a0", "completed":"#6ab04c" };

function TypewriterText() {
  const [displayed, setDisplayed] = useState("");
  const fullText = "以我所长，换你所需；在彼此的短板里，照见同行的光。";
  
  useEffect(() => {
    let i = 0;
    setDisplayed("");
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setDisplayed(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 60);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <p style={{
      fontSize:"1.05rem",
      fontFamily:"Georgia, \"Noto Serif SC\", serif",
      color:"#f0c27f",
      lineHeight:"1.8",
      margin:0,
      letterSpacing:"1px",
      textShadow:"0 0 20px rgba(240,194,127,.15), 0 0 40px rgba(240,194,127,.08)",
    }}>
      "{displayed}"
      <span style={{
        animation:"blink 1s step-end infinite",
        color:"#f0c27f",fontWeight:300,marginLeft:"2px"
      }}>|</span>
      <style dangerouslySetInnerHTML={{__html:"@keyframes blink { 50% { opacity: 0; } }"}} />
    </p>
  );
}

export default function SkillsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [othersSkills, setOthersSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [canProvide, setCanProvide] = useState("");
  const [need, setNeed] = useState("");
  const [bio, setBio] = useState("");
  const [skillStatus, setSkillStatus] = useState("available");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [onlineCount] = useState(() => Math.floor(Math.random() * 15) + 3);
  // Exchange dialog
  const [exchangeTarget, setExchangeTarget] = useState(null);
  const [exchangeMsg, setExchangeMsg] = useState("");
  const [sendingEx, setSendingEx] = useState(false);

  useEffect(() => {
    getMe().then(d => { if (!d.user) { router.push(''); return; } setUser(d.user); loadSkills(); }).catch(() => router.push(''));
  }, []);

  const loadSkills = async () => {
    try { const d = await getSkills(); setSkills(d.skills || []); setUserSkills(d.userSkills || []); setOthersSkills(d.othersSkills || []); } catch {}
    setLoading(false);
  };

  const showMsg = (msg, type) => { setMessage(msg); setTimeout(() => setMessage(""), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canProvide.trim() || !need.trim()) { showMsg("「我能提供」和「我需要」都必须填写"); return; }
    setSubmitting(true);
    try {
      await createSkill({ can_provide: canProvide.trim(), need: need.trim(), bio: bio.trim(), status: skillStatus });
      setCanProvide(""); setNeed(""); setBio(""); setSkillStatus("available"); setShowForm(false);
      showMsg("🚢 小船已经离港，正在驶向互助港湾...");
      loadSkills();
    } catch { showMsg("发布失败"); }
    setSubmitting(false);
  };

  const markDone = async (id) => { try { await updateSkill(id, "completed"); loadSkills(); } catch {} };

  const openExchange = (s) => {
    setExchangeTarget(s);
    setExchangeMsg("你好，我对你的「" + s.can_provide + "」感兴趣，我可以帮你「" + s.need + "」，你看可以吗？");
  };

  const handleExchange = async () => {
    if (!exchangeMsg.trim() || !exchangeTarget) return;
    setSendingEx(true);
    try {
      await sendMessage(exchangeTarget.user_id, exchangeMsg.trim());
      await updateSkill(exchangeTarget.id, "completed");
      showMsg("💌 意向已发送，已标记为已成交！");
      setExchangeTarget(null);
      setExchangeMsg("");
      loadSkills();
    } catch { showMsg("发送失败"); }
    setSendingEx(false);
  };

  if (loading) return <div className="dashboard"><div className="spinner" /></div>;

  const SkillCard = ({ s, isMine }) => (
    <div className="skill-card" style={{
      background:"linear-gradient(135deg,#1a1a2e 0%,#2d2d44 100%)",
      border:"1px solid rgba(240,194,127,.12)",
      borderRadius:"16px",padding:"20px",
      transition:"all .3s ease",position:"relative",overflow:"hidden"
    }}>
      {/* Top wave decoration */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"4px",background:"linear-gradient(90deg,#f0c27f,#dba76a)"}} />
      
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
        <span style={{fontSize:".82rem",color:"rgba(250,246,240,.5)"}}>
          ⛵ {s.username || "渡口居民"}
        </span>
        <span style={{
          fontSize:".72rem",padding:"3px 10px",borderRadius:"40px",
          background:moodColors[s.status]+"22",color:moodColors[s.status],
          border:"1px solid "+moodColors[s.status]+"44"
        }}>
          {moodIcons[s.status]||"🌊"} {moodLabels[s.status]||"可交换"}
        </span>
      </div>

      {/* Boat card - can_provide vs need */}
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"14px"}}>
        <div style={{flex:1,background:"rgba(250,246,240,.06)",borderRadius:"12px",padding:"14px",border:"1px solid rgba(240,194,127,.08)"}}>
          <p style={{fontSize:".7rem",color:"rgba(240,194,127,.5)",marginBottom:"4px",letterSpacing:"1px"}}>🚢 我能提供</p>
          <p style={{fontSize:".95rem",fontWeight:600,color:"rgba(250,246,240,.85)",lineHeight:"1.4"}}>{s.can_provide}</p>
        </div>
        <div style={{fontSize:"1.3rem",color:"rgba(240,194,127,.4)",flexShrink:0}}>⛵</div>
        <div style={{flex:1,background:"rgba(250,246,240,.04)",borderRadius:"12px",padding:"14px",border:"1px solid rgba(255,255,255,.06)"}}>
          <p style={{fontSize:".7rem",color:"rgba(250,246,240,.25)",marginBottom:"4px",letterSpacing:"1px"}}>🎯 我需要</p>
          <p style={{fontSize:".95rem",fontWeight:600,color:"rgba(250,246,240,.85)",lineHeight:"1.4"}}>{s.need}</p>
        </div>
      </div>

      {/* Bio */}
      {s.bio && <p style={{fontSize:".8rem",color:"rgba(250,246,240,.45)",lineHeight:"1.7",marginBottom:"12px",fontStyle:"italic",paddingLeft:"8px",borderLeft:"2px solid rgba(240,194,127,.15)"}}>“{s.bio}”</p>}

      {/* Time + actions */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid rgba(255,255,255,.05)",paddingTop:"12px"}}>
        <span style={{fontSize:".7rem",color:"rgba(250,246,240,.25)"}}>{s.created_at?.slice(0,10) || ""}</span>
        <div style={{display:"flex",gap:"8px"}}>
          {isMine && s.status !== "completed" && (
            <button onClick={()=>markDone(s.id)} className="btn btn--sm" style={{fontSize:".72rem",padding:"4px 12px",background:"rgba(106,176,76,.12)",color:"#6ab04c",border:"1px solid rgba(106,176,76,.2)",borderRadius:"40px",cursor:"pointer",fontFamily:"inherit"}}>✅ 标记完成</button>
          )}
          {!isMine && s.status === "available" && (
            <button onClick={()=>openExchange(s)} className="btn btn--sm" style={{fontSize:".72rem",padding:"4px 14px",background:"linear-gradient(135deg,#f0c27f,#dba76a)",color:"#1a1a2e",border:"none",borderRadius:"40px",cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>💌 想交换</button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <header className="dh"><div className="dh-in"><a href="/dashboard" className="dh-brand"><Logo size={20} showText={false} /></a><div className="d-nav"><a href="/dashboard"><span>🚢</span><span className="nav-label">登船口</span></a><a href="/checkin"><span>⚓</span><span className="nav-label">航海日志</span></a><a href="/community"><span>🍃</span><span className="nav-label">低语台</span></a><a href="/treehole"><span>🍾</span><span className="nav-label">漂流瓶</span></a><a href="/skills" className="active"><span>🏮</span><span className="nav-label">互助港湾</span></a><a href="/capsule"><span>🌊</span><span className="nav-label">时间海</span></a><a href="/buddy"><span>👥</span><span className="nav-label">觅舟友</span></a><a href="/notifications" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>🔔</a><a href="/profile" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>
          👤</a><button onClick={()=>{localStorage.removeItem('token');window.location.href="/"}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".75rem",cursor:"pointer",padding:"6px 10px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onmouseenter={e=>e.target.style.color='rgba(255,255,255,.7)'} onmouseleave={e=>e.target.style.color='rgba(255,255,255,.35)'}>退出</button><button id="nav-theme-toggle" onClick={function(){if(window.__toggleTheme)window.__toggleTheme()}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".85rem",cursor:"pointer",padding:"6px 8px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} title="切换主题">🌓</button></div></div></header>
      <div className="db">
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px",marginBottom:"16px"}}>
          <h1 className="db-title" style={{marginBottom:0}}>🏮 互助港湾</h1>
          <button onClick={()=>setShowForm(!showForm)} className="btn btn--primary btn--sm" style={{fontSize:".82rem",padding:"8px 18px",borderRadius:"40px"}}>
            {showForm ? "收起" : "🏮 发布能力"}
          </button>
        </div>

        {/* Dynamic banner */}
        <div style={{
          background:"linear-gradient(135deg,rgba(240,194,127,.08),rgba(74,158,255,.08))",
          border:"1px solid rgba(240,194,127,.1)",borderRadius:"12px",padding:"12px 18px",marginBottom:"20px"
        }}>
          <p style={{fontSize:".88rem",color:"rgba(250,246,240,.6)",textAlign:"center"}}>
            🌙 当前港湾有 <strong style={{color:"var(--warm-glow)"}}>{skills.length}</strong> 位船员正在寻找搭档，用你擅长的换你需要的。
          </p>
        </div>

        {/* Message */}
        {message && (
          <div style={{padding:"10px 18px",background:"rgba(240,194,127,.1)",border:"1px solid rgba(240,194,127,.2)",borderRadius:"12px",textAlign:"center",marginBottom:"16px"}}>
            <p style={{fontSize:".85rem",color:"var(--warm-glow)"}}>{message}</p>
          </div>
        )}

        {/* Publish form */}
        {showForm && (
          <div className="card" style={{marginBottom:"24px",background:"linear-gradient(135deg,#1a1a2e,#2d2d44)",border:"1px solid rgba(240,194,127,.12)"}}>
            <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"14px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                <div>
                  <label style={{fontSize:".75rem",color:"rgba(240,194,127,.6)",marginBottom:"4px",display:"block"}}>🚢 我能提供 *</label>
                  <input className="input" placeholder="如：PPT设计、吉他教学" value={canProvide} onChange={e=>setCanProvide(e.target.value)} required style={{background:"rgba(255,255,255,.06)",borderColor:"rgba(255,255,255,.08)",color:"rgba(250,246,240,.8)"}} />
                </div>
                <div>
                  <label style={{fontSize:".75rem",color:"rgba(240,194,127,.6)",marginBottom:"4px",display:"block"}}>🎯 我需要 *</label>
                  <input className="input" placeholder="如：英语陪练、帮忙修图" value={need} onChange={e=>setNeed(e.target.value)} required style={{background:"rgba(255,255,255,.06)",borderColor:"rgba(255,255,255,.08)",color:"rgba(250,246,240,.8)"}} />
                </div>
              </div>
              <div>
                <label style={{fontSize:".75rem",color:"rgba(240,194,127,.6)",marginBottom:"4px",display:"block"}}>📝 个人简介（选填）</label>
                <textarea className="input" style={{minHeight:"60px",resize:"vertical",fontFamily:"inherit",lineHeight:"1.8",background:"rgba(255,255,255,.06)",borderColor:"rgba(255,255,255,.08)",color:"rgba(250,246,240,.8)"}} placeholder="简单介绍一下自己，让对方更了解你…" value={bio} onChange={e=>setBio(e.target.value)} />
              </div>
              <div>
                <label style={{fontSize:".75rem",color:"rgba(240,194,127,.6)",marginBottom:"6px",display:"block"}}>📌 状态</label>
                <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                  {[["available","🌊 可交换"],["view_only","👀 仅围观"]].map(([v,lab]) => (
                    <label key={v} style={{display:"flex",alignItems:"center",gap:"4px",fontSize:".8rem",color:skillStatus===v?"var(--warm-glow)":"rgba(250,246,240,.4)",cursor:"pointer"}}>
                      <input type="radio" name="skillStatus" value={v} checked={skillStatus===v} onChange={()=>setSkillStatus(v)} style={{accentColor:"var(--warm-glow)"}} />
                      {lab}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn" disabled={submitting} style={{
                padding:"12px",borderRadius:"40px",border:"none",fontSize:".9rem",fontWeight:600,cursor:"pointer",
                background:"linear-gradient(135deg,#f0c27f,#dba76a)",color:"#1a1a2e",fontFamily:"inherit"
              }}>
                {submitting ? "⛵ 出航中..." : "🏮 发布能力交换"}
              </button>
            </form>
          </div>
        )}

        {/* My skills */}
        {userSkills.length > 0 && (
          <>
            <h2 style={{fontSize:"1rem",fontWeight:600,color:"rgba(250,246,240,.5)",marginBottom:"14px",letterSpacing:"1px"}}>🚢 我的发布</h2>
            <div style={{display:"flex",flexDirection:"column",gap:"14px",marginBottom:"32px"}}>
              {userSkills.map(s => <SkillCard key={s.id} s={s} isMine />)}
            </div>
          </>
        )}

        {/* Others skills */}
        <h2 style={{fontSize:"1rem",fontWeight:600,color:"rgba(250,246,240,.5)",marginBottom:"14px",letterSpacing:"1px"}}>🌊 港湾里的船员们</h2>
        {othersSkills.length === 0 ? (
          <div className="card" style={{textAlign:"center",padding:"48px 24px",background:"linear-gradient(135deg,#1a1a2e,#2d2d44)",border:"1px solid rgba(240,194,127,.08)"}}>
            <p style={{fontSize:"2.5rem",marginBottom:"12px",opacity:.4}}>⛵</p>
            <p style={{color:"rgba(250,246,240,.3)",fontSize:".9rem",marginBottom:"6px"}}>港湾还没有其他船员</p>
            <p style={{color:"rgba(250,246,240,.2)",fontSize:".82rem"}}>发布你的能力，成为第一个吧</p>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"14px",marginBottom:"40px"}}>
            {othersSkills.map(s => <SkillCard key={s.id} s={s} />)}
          </div>
        )}
      </div>

      {/* Exchange dialog */}
      {exchangeTarget && (
        <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(10,22,40,.7)",backdropFilter:"blur(6px)"}} onClick={()=>setExchangeTarget(null)}>
          <div style={{maxWidth:"440px",width:"90%",background:"linear-gradient(160deg,#1a1a2e,#2d2d44)",border:"1px solid rgba(240,194,127,.12)",borderRadius:"20px",padding:"28px 24px"}} onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",marginBottom:"20px"}}>
              <p style={{fontSize:"2rem",marginBottom:"6px",opacity:.6}}>💌</p>
              <h3 style={{fontSize:"1rem",color:"rgba(250,246,240,.8)",fontWeight:600}}>发送交换意向</h3>
            </div>
            
            {/* Target info */}
            <div style={{background:"rgba(250,246,240,.04)",borderRadius:"12px",padding:"14px",marginBottom:"16px"}}>
              <p style={{fontSize:".78rem",color:"rgba(240,194,127,.5)",marginBottom:"6px"}}>⛵ {exchangeTarget.username || "渡口居民"}</p>
              <p style={{fontSize:".82rem",color:"rgba(250,246,240,.55)",lineHeight:"1.6"}}>
                能提供：<strong style={{color:"rgba(250,246,240,.8)"}}>{exchangeTarget.can_provide}</strong><br />
                需要：<strong style={{color:"rgba(250,246,240,.8)"}}>{exchangeTarget.need}</strong>
              </p>
              {exchangeTarget.bio && <p style={{fontSize:".78rem",color:"rgba(250,246,240,.35)",fontStyle:"italic",marginTop:"6px",borderTop:"1px solid rgba(255,255,255,.05)",paddingTop:"6px"}}>“{exchangeTarget.bio}”</p>}
            </div>

            <textarea className="input" style={{minHeight:"90px",resize:"vertical",fontFamily:"inherit",lineHeight:"1.8",fontSize:".85rem",background:"rgba(255,255,255,.06)",borderColor:"rgba(255,255,255,.08)",color:"rgba(250,246,240,.7)",marginBottom:"14px"}} value={exchangeMsg} onChange={e=>setExchangeMsg(e.target.value)} />

            <div style={{display:"flex",gap:"10px"}}>
              <button onClick={()=>setExchangeTarget(null)} style={{flex:1,padding:"10px",borderRadius:"40px",border:"1px solid rgba(255,255,255,.08)",background:"transparent",color:"rgba(250,246,240,.4)",cursor:"pointer",fontSize:".85rem",fontFamily:"inherit"}}>取消</button>
              <button onClick={handleExchange} disabled={sendingEx||!exchangeMsg.trim()} style={{
                flex:1,padding:"10px",borderRadius:"40px",border:"none",
                background:"linear-gradient(135deg,#f0c27f,#dba76a)",color:"#1a1a2e",
                cursor:"pointer",fontSize:".85rem",fontWeight:600,fontFamily:"inherit"
              }}>{sendingEx?"发送中...":"💌 发送意向"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Online indicator */}
      <div style={{position:"fixed",bottom:"24px",right:"24px",zIndex:999,display:"flex",alignItems:"center",gap:"8px",background:"rgba(26,26,46,.85)",backdropFilter:"blur(12px)",padding:"10px 18px",borderRadius:"40px",border:"1px solid rgba(240,194,127,.12)",boxShadow:"0 4px 20px rgba(0,0,0,.2)",cursor:"pointer",transition:"all .3s ease"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 8px 30px rgba(0,0,0,.3)"}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.2)"}}>
        <span className="online-dot" style={{width:"10px",height:"10px"}} />
        <span style={{fontSize:".82rem",color:"rgba(250,246,240,.6)"}}>在线 <strong style={{color:"var(--warm-glow)",fontWeight:700}}>{onlineCount}</strong> 人</span>
      </div>
    </div>
  );
}