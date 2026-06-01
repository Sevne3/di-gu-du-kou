"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useTheme } from "@/components/ThemeProvider";
import { getMe } from "@/lib/api";

export default function CapsulePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasWritten, setHasWritten] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [deliverDate, setDeliverDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sealing, setSealing] = useState(false);
  const [toast, setToast] = useState("");
  const [typewriterText, setTypewriterText] = useState("");
  const [onlineCount] = useState(() => Math.floor(Math.random() * 12) + 3);

  const fullPlaceholder = "亲爱的未来的自己：此刻的你，正在经历什么？希望这封信能成为你回望时的一盏小灯。";

  useEffect(() => {
    getMe().then(d => { if (!d.user) { router.push(''); return; } setUser(d.user); load(); }).catch(() => router.push(''));
  }, []);

  // Typewriter effect on modal open
  useEffect(() => {
    if (!showModal) { setTypewriterText(""); return; }
    let i = 0;
    setTypewriterText("");
    const timer = setInterval(() => {
      if (i < fullPlaceholder.length) {
        setTypewriterText(fullPlaceholder.slice(0, i + 1));
        i++;
      } else clearInterval(timer);
    }, 35);
    return () => clearInterval(timer);
  }, [showModal]);

  const load = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/capsule", { headers: { "Authorization": "Bearer " + token } });
      const d = await res.json();
    } catch {}
    setLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !deliverDate) { showToast("请填写完整信息"); return; }
    
    // Check date is at least tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().slice(0, 10);
    if (deliverDate < minDate) { showToast("送达日期必须至少是明天"); return; }

    setSealing(true);
    // 1.5s seal animation
    await new Promise(r => setTimeout(r, 1500));
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/capsule", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ content: content.trim(), subject: subject.trim(), deliverDate })
      });
      const d = await res.json();
      if (d.error) { showToast(d.error); setSealing(false); setSubmitting(false); return; }
      
      setContent(""); setSubject(""); setDeliverDate("");
      setShowModal(false);
      setHasWritten(true);
      showToast("🌊 信件已沉入时间海，将于 " + deliverDate + " 在消息中心与你重逢");
    } catch(e) { showToast("创建失败，请检查网络或控制台错误"); console.error(e); }
    setSealing(false);
    setSubmitting(false);
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  if (loading) return <div className="dashboard"><div className="spinner" /></div>;

  return (
    <div className="dashboard">
      <header className="dh"><div className="dh-in"><a href="/dashboard" className="dh-brand"><Logo size={20} showText={false} /></a><div className="d-nav"><a href="/dashboard"><span>🚢</span><span className="nav-label">登船口</span></a><a href="/checkin"><span>⚓</span><span className="nav-label">航海日志</span></a><a href="/community"><span>🍃</span><span className="nav-label">低语台</span></a><a href="/treehole"><span>🍾</span><span className="nav-label">漂流瓶</span></a><a href="/skills"><span>🏮</span><span className="nav-label">互助港湾</span></a><a href="/capsule" className="active"><span>🌊</span><span className="nav-label">时间海</span></a><a href="/buddy"><span>👥</span><span className="nav-label">觅舟友</span></a><a href="/notifications" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>🔔</a><a href="/profile" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>👤</a><button onClick={()=>{localStorage.removeItem('token');window.location.href="/"}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".75rem",cursor:"pointer",padding:"6px 10px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onmouseenter={e=>e.target.style.color='rgba(255,255,255,.7)'} onmouseleave={e=>e.target.style.color='rgba(255,255,255,.35)'}>退出</button><button id="nav-theme-toggle" onClick={function(){if(window.__toggleTheme)window.__toggleTheme()}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".85rem",cursor:"pointer",padding:"6px 8px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} title="切换主题">🌓</button></div></div></header>
      <div className="db">
        {/* Toast */}
        {toast && (
          <div style={{
            position:"fixed",bottom:"100px",left:"50%",transform:"translateX(-50%)",
            zIndex:9999,background:"rgba(240,194,127,.15)",border:"1px solid rgba(240,194,127,.3)",
            borderRadius:"14px",padding:"14px 24px",fontSize:".9rem",color:"#f0c27f",
            backdropFilter:"blur(12px)",textAlign:"center",maxWidth:"90%",
            animation:"fadeInUp .4s ease"
          }}>{toast}</div>
        )}

        {/* Ceremony page */}
        <div style={{
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          minHeight:"calc(100vh - 120px)",textAlign:"center",padding:"40px 20px"
        }}>
          {/* Gift box illustration */}
          <div style={{
            fontSize:"5rem",marginBottom:"24px",opacity: hasWritten ? 0.3 : 0.15,
            filter:"grayscale(" + (hasWritten ? 0.5 : 1) + ")",
            transition:"all .8s ease"
          }}>
            {hasWritten ? "✉️" : "📮"}
          </div>

          {hasWritten ? (
            <>
              <h2 className="capsule-text-secondary" style={{fontSize:"1.3rem",color:"rgba(250,246,240,.5)",fontWeight:400,marginBottom:"12px",letterSpacing:"2px"}}>
                暂无待封存的信件
              </h2>
              <p className="capsule-text-muted" style={{fontSize:".85rem",color:"rgba(250,246,240,.25)",maxWidth:"360px",lineHeight:"1.8",marginBottom:"32px"}}>
                上一封信已经沉入时间海。<br />
                如果想再写一封，随时可以。
              </p>
              <button onClick={()=>{setHasWritten(false);setShowModal(true)}} className="btn" style={{
                padding:"14px 36px",borderRadius:"40px",border:"1.5px solid rgba(240,194,127,.2)",
                background:"transparent",color:"rgba(240,194,127,.6)",fontSize:".9rem",
                cursor:"pointer",fontFamily:"inherit",transition:"all .3s"
              }}
                onMouseEnter={e=>{e.target.style.borderColor="rgba(240,194,127,.5)";e.target.style.color="#f0c27f"}}
                onMouseLeave={e=>{e.target.style.borderColor="rgba(240,194,127,.2)";e.target.style.color="rgba(240,194,127,.6)"}}
              >✉️ 再写一封</button>
            </>
          ) : (
            <>
              <h2 className="capsule-text-primary" style={{fontSize:"1.4rem",color:"rgba(250,246,240,.7)",fontWeight:500,marginBottom:"8px",letterSpacing:"1px"}}>
                时间海
              </h2>
              <p className="capsule-text-muted" style={{fontSize:".85rem",color:"rgba(250,246,240,.35)",maxWidth:"440px",lineHeight:"2",marginBottom:"8px",textAlign:"center"}}>
                在这里写下一段话，选一个未来的日子，然后亲手封存。
              </p>
              <p className="capsule-text-muted" style={{fontSize:".82rem",color:"rgba(250,246,240,.18)",maxWidth:"440px",lineHeight:"1.9",marginBottom:"8px",textAlign:"center"}}>
                提交后它会立刻从眼前消失，没有列表、没有记录，真正沉入时间的深海。直到约定的那天，它才会作为一条消息重新出现在消息中心，带着过去的温度与你重适。
              </p>
              <p className="capsule-text-accent" style={{fontSize:".82rem",color:"rgba(240,194,127,.25)",maxWidth:"440px",lineHeight:"1.9",marginBottom:"36px",textAlign:"center",fontStyle:"italic"}}>
                写完即隐，到期方现。这不是备忘录，是跨越时间的拥抱。
              </p>
              <button onClick={()=>setShowModal(true)} className="btn" style={{
                padding:"16px 44px",borderRadius:"40px",border:"none",
                background:"linear-gradient(135deg,#f0c27f,#dba76a)",color:"#1a1a2e",
                fontSize:"1rem",fontWeight:600,cursor:"pointer",fontFamily:"inherit",
                boxShadow:"0 4px 20px rgba(240,194,127,.2)",transition:"all .3s"
              }}
                onMouseEnter={e=>{e.target.style.transform="translateY(-2px)";e.target.style.boxShadow="0 8px 30px rgba(240,194,127,.3)"}}
                onMouseLeave={e=>{e.target.style.transform="";e.target.style.boxShadow="0 4px 20px rgba(240,194,127,.2)"}}
              >📮 写一封给未来的信</button>
            </>
          )}
        </div>

        {/* Write modal */}
        {showModal && (
          <div style={{
            position:"fixed",inset:0,zIndex:500,
            display:"flex",alignItems:"center",justifyContent:"center",
            background:"rgba(10,22,40,.7)",backdropFilter:"blur(6px)",
            padding:"20px"
          }} onClick={()=>{if(!sealing)setShowModal(false)}}>
            <div style={{
              maxWidth:"520px",width:"100%",
              background:"#f5ede3",
              borderRadius:"20px",padding:"32px 28px",
              boxShadow:"0 20px 60px rgba(0,0,0,.3)",
              position:"relative",overflow:"hidden"
            }} onClick={e=>e.stopPropagation()}>
              {/* Seal decoration */}
              <div style={{
                position:"absolute",top:"-30px",right:"-30px",
                width:"80px",height:"80px",borderRadius:"50%",
                background:"linear-gradient(135deg,#f0c27f,#dba76a)",
                opacity:0.15
              }} />
              
              <div style={{textAlign:"center",marginBottom:"24px"}}>
                <p style={{fontSize:"2rem",marginBottom:"4px",opacity:sealing?0.3:0.6}}>
                  {sealing ? "🔏" : "📮"}
                </p>
                <h3 style={{fontSize:"1.1rem",color:"#3d2e1e",fontWeight:600,marginBottom:"4px"}}>
                  {sealing ? "正在封缄…" : "写一封给未来的信"}
                </h3>
                <p style={{fontSize:".8rem",color:"#8a7a6e"}}>
                  信件封存后，没有人能读到它，直到送达之日
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                <input style={{width:"100%",padding:"12px 16px",borderRadius:"12px",border:"1.5px solid rgba(200,180,160,.3)",fontSize:".9rem",fontFamily:"inherit",background:"#fff",color:"#1a1a1a",outline:"none",boxSizing:"border-box"}} placeholder="主题（选填）" value={subject} onChange={e=>setSubject(e.target.value)}
                  disabled={sealing} />
                
                <div style={{position:"relative"}}>
                  <textarea style={{minHeight:"150px",resize:"vertical",fontFamily:"Georgia,\"Noto Serif SC\",serif",lineHeight:"2",fontSize:".95rem",padding:"16px",width:"100%",borderRadius:"12px",border:"1.5px solid rgba(200,180,160,.3)",background:"#fff",color:"#1a1a1a",outline:"none",boxSizing:"border-box",caretColor:"#dba76a"}}
                    placeholder={typewriterText}
                    value={content} onChange={e=>setContent(e.target.value)}
                    required disabled={sealing} />
                  {typewriterText && typewriterText.length < fullPlaceholder.length && !content && (
                    <span style={{
                      position:"absolute",bottom:"16px",right:"16px",
                      fontSize:".7rem",color:"rgba(138,122,110,.3)"
                    }}>
                      <span style={{animation:"blink 1s step-end infinite"}}>|</span>
                    </span>
                  )}
                </div>

                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{flex:1,position:"relative"}}>
                    <input type="date" style={{width:"100%",padding:"12px 16px",borderRadius:"12px",border:"1.5px solid rgba(200,180,160,.3)",fontSize:".9rem",fontFamily:"inherit",background:"#fff",color:"#1a1a1a",outline:"none",boxSizing:"border-box"}} value={deliverDate} onChange={e=>setDeliverDate(e.target.value)}
                      min={getMinDate()} required disabled={sealing}
                      style={{width:"100%",padding:"12px 16px",borderRadius:"12px",border:"1.5px solid rgba(200,180,160,.3)",fontSize:".9rem",fontFamily:"inherit",background:"#fff",color:"#1a1a1a",outline:"none",boxSizing:"border-box"}} />
                    {deliverDate && (
                      <span style={{
                        position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",
                        fontSize:"1.1rem",pointerEvents:"none"
                      }}>⏳</span>
                    )}
                  </div>
                </div>

                {deliverDate && (
                  <div style={{
                    background:"rgba(240,194,127,.1)",borderRadius:"10px",padding:"10px 14px",
                    textAlign:"center",border:"1px solid rgba(240,194,127,.15)"
                  }}>
                    <p style={{fontSize:".82rem",color:"#8a7a6e"}}>
                      🌊 这封信将于 <strong style={{color:"#dba76a"}}>{deliverDate}</strong> 送达
                    </p>
                  </div>
                )}

                {sealing && (
                  <div style={{textAlign:"center",padding:"10px 0"}}>
                    <div style={{
                      display:"inline-block",width:"60px",height:"60px",borderRadius:"50%",
                      border:"3px solid rgba(240,194,127,.3)",borderTopColor:"#f0c27f",
                      animation:"spin 1s linear infinite"
                    }} />
                    <p style={{fontSize:".8rem",color:"#8a7a6e",marginTop:"8px"}}>正在为信件盖上火漆封印…</p>
                  </div>
                )}

                <button type="submit" disabled={sealing||submitting} className="btn" style={{
                  padding:"14px",borderRadius:"40px",border:"none",
                  background: sealing ? "rgba(200,180,160,.3)" : "linear-gradient(135deg,#f0c27f,#dba76a)",
                  color: sealing ? "#8a7a6e" : "#1a1a2e",
                  fontSize:".95rem",fontWeight:600,cursor:sealing?"not-allowed":"pointer",
                  fontFamily:"inherit",transition:"all .3s",
                  transform: sealing ? "scale(0.98)" : ""
                }}>
                  {sealing ? "🔏 封缄中…" : "🔏 封入胶囊"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Online indicator */}
        <div style={{position:"fixed",bottom:"24px",right:"24px",zIndex:999,display:"flex",alignItems:"center",gap:"8px",background:"rgba(26,26,46,.85)",backdropFilter:"blur(12px)",padding:"10px 18px",borderRadius:"40px",border:"1px solid rgba(240,194,127,.12)",boxShadow:"0 4px 20px rgba(0,0,0,.2)",transition:"all .3s ease"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 8px 30px rgba(0,0,0,.3)"}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.2)"}}>
          <span className="online-dot" style={{width:"10px",height:"10px"}} />
          <span style={{fontSize:".82rem",color:"rgba(250,246,240,.6)"}}>在线 <strong style={{color:"var(--warm-glow)",fontWeight:700}}>{onlineCount}</strong> 人</span>
        </div>

        <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } } @keyframes spin { to { transform:rotate(360deg); } } @keyframes blink { 50% { opacity:0; } }`}</style>
      </div>
    </div>
  );
}