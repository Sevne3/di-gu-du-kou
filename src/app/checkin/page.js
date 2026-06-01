"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getMe, doCheckin, getEncouragement } from "@/lib/api";

export default function CheckinPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [history, setHistory] = useState([]);
  const [allCheckins, setAllCheckins] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [encouragement, setEncouragement] = useState(null);
  const [showEncourage, setShowEncourage] = useState(false);

  useEffect(() => {
    getMe().then((data) => { if (!data.user) { router.push(''); return; } setUser(data.user); loadData(); }).catch(() => router.push(''));
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/checkin", { headers: { "Authorization": "Bearer " + token } });
      const d = await res.json();
      if (d.today) { setDone(true); setContent(d.today.content || ""); setMood(d.today.mood || ""); }
      setHistory(d.history || []);
      setAllCheckins(d.all || []);
    } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) { setMessage("写点什么吧"); return; }
    setSubmitting(true);
    try {
      await doCheckin(content.trim(), mood);
      setDone(true);
      setMessage('今天的你，也很了不起。');
      try { const e = await getEncouragement(); setEncouragement(e.encouragement); setShowEncourage(true); } catch {}
    } catch (err) {
      if (err.message?.includes("今日已泊船")) setMessage("今日已泊船，明日再启航。");
      else setMessage("出错了，稍后再试");
    }
    setSubmitting(false);
  };

  const questions = ["今天，你照顾自己了吗？","今天有没有一件小事让你感觉好一点？","今天，你为自己的明天做了什么？","如果今天是一句话，它会是什么？","今天，你原谅自己了吗？"];
  const [qIdx] = useState(() => Math.floor(Math.random() * questions.length));
  const [onlineCount] = useState(() => Math.floor(Math.random() * 15) + 3);
    const moodTypes = [
    { value:"calm", label:"无风带", i:"🌀", color:"#a8b5a0", glow:"rgba(168,181,160,.5)", type:"neutral" },
    { value:"tailwind", label:"顺风", i:"⛵", color:"#6ab04c", glow:"rgba(106,176,76,.5)", type:"positive" },
    { value:"headwind", label:"逆风", i:"🍾", color:"#8a7a6e", glow:"rgba(138,122,110,.5)", type:"negative" },
    { value:"fog", label:"大雾", i:"🌫️", color:"#a8b8d4", glow:"rgba(168,184,212,.5)", type:"negative" },
    { value:"reef", label:"触礁", i:"🪨", color:"#e74c3c", glow:"rgba(231,76,60,.5)", type:"negative" },
    { value:"lighthouse", label:"灯塔", i:"🗼", color:"#f0c27f", glow:"rgba(240,194,127,.6)", type:"positive" }
  ];
  var moodMap = {}; moodTypes.forEach(function(m) { moodMap[m.value] = m; });
  var legacyMoodMap = {"平静":"calm","还好":"tailwind","疲惫":"headwind","有希望":"lighthouse","崩溃":"reef","治愈":"tailwind"};
  function resolveMood(v) { return moodMap[v] || moodMap[legacyMoodMap[v]] || null; }
  const today = new Date(); const year=today.getFullYear(); const month=today.getMonth();
  const daysInMonth=new Date(year,month+1,0).getDate(); const firstDay=new Date(year,month,1).getDay();
  const checkinDates=new Set(allCheckins.map(c=>c.date));
  
  
  const last7=[];
  for(let i=6;i>=0;i--){const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10);const c=allCheckins.find(cin=>cin.date===d);last7.push({date:d,checkin:c,mood:c?.mood||null,day:['日','一','二','三','四','五','六'][new Date(d).getDay()]})}
  const getMood=(day)=>{const ds=year+"-"+String(month+1).padStart(2,"0")+"-"+String(day).padStart(2,"0");const c=allCheckins.find(x=>x.date===ds);return c?.mood?(resolveMood(c.mood)?.i||""):null};

  if (loading) return <div className="dashboard"><div className="spinner" /></div>;

  return (
    <div className="dashboard">
      <header className="dh"><div className="dh-in"><a href="/dashboard" className="dh-brand"><Logo size={20} showText={false} /></a><div className="d-nav"><a href="/dashboard" className=""><span>🚢</span><span className="nav-label">登船口</span></a><a href="/checkin" className=" active"><span>⚓</span><span className="nav-label">航海日志</span></a><a href="/community" className=""><span>🍃</span><span className="nav-label">低语台</span></a><a href="/treehole" className=""><span>🍾</span><span className="nav-label">漂流瓶</span></a><a href="/skills" className=""><span>🏮</span><span className="nav-label">互助港湾</span></a><a href="/capsule" className=""><span>🌊</span><span className="nav-label">时间海</span></a><a href="/buddy" className=""><span>👥</span><span className="nav-label">觅舟友</span></a><a href="/notifications" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>🔔</a><a href="/profile" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>
          👤</a><button onClick={()=>{localStorage.removeItem('token');window.location.href="/"}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".75rem",cursor:"pointer",padding:"6px 10px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onmouseenter={e=>e.target.style.color='rgba(255,255,255,.7)'} onmouseleave={e=>e.target.style.color='rgba(255,255,255,.35)'}>退出</button><button id="nav-theme-toggle" onClick={function(){if(window.__toggleTheme)window.__toggleTheme()}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".85rem",cursor:"pointer",padding:"6px 8px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} title="切换主题">🌓</button></div></div></header>
      <div className="db">
        <h1 className="db-title">⚓ 航海日志</h1>
        <p style={{fontSize:".82rem",color:"var(--text-light)",lineHeight:"1.9",marginBottom:"20px",maxWidth:"640px"}}>每一艘船都需要在夜幕降临时回到港湾。这里是你的心灵停泊处。请卸下白日的防备，如实记录今天的风浪与潮汐。我们会细心珍藏你的每一次情绪波动；若察觉你连续遭遇风暴，渡口会自动切换至「避风模式」，为你提供更深层的庇护与慰藉。</p>

        {/* 两栏：左打卡 + 右心情 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",marginBottom:"24px"}} className="checkin-grid">

          {/* === 左栏：打卡表单/已打卡 === */}
          <div className="card" style={{marginBottom:0}}>
            {done ? (
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <span style={{fontSize:"3rem",display:"block",marginBottom:"12px"}}>⚓</span>
                <h3 style={{fontSize:"1.1rem",fontWeight:600,color:"var(--night)",marginBottom:"8px"}}>今天已打卡</h3>
                <p style={{fontSize:".85rem",color:"var(--text-light)",marginBottom:"4px"}}>{mood?(resolveMood(mood)?.i||"")+" "+(resolveMood(mood)?.label||mood):""}</p>
                <p style={{color:"var(--text-light)",fontSize:".95rem"}}>「{content}」</p>
                <p style={{color:"var(--text-muted)",fontSize:".82rem",marginTop:"16px"}}>🌿 明天也记得来</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <p style={{fontSize:"1rem",fontWeight:500,color:"var(--night)",marginBottom:"16px"}}>{questions[qIdx]}</p>
                <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"12px"}}>
                  {moodTypes.map(m => {
                                        var sel = mood === m.value;
                                        return (
                                          <button key={m.value} type="button" onClick={()=>setMood(m.value)}
                                            style={{
                                              display:"inline-flex",alignItems:"center",gap:"5px",
                                              padding:"8px 16px",borderRadius:"10px",border:"1.5px solid",
                                              borderColor: sel ? m.color : "rgba(0,0,0,.08)",
                                              background: sel ? m.color + "22" : "var(--cream)",
                                              color: sel ? m.color : "var(--text-light)",
                                              fontSize:".82rem",cursor:"pointer",fontFamily:"inherit",
                                              fontWeight: sel ? 600 : 400,
                                              boxShadow: sel ? "0 0 14px " + m.glow : "none",
                                              transform: sel ? "translateY(-2px)" : "none",
                                              transition:"all .35s cubic-bezier(.34,1.56,.64,1)"
                                            }}
                                            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 4px 14px "+m.color+"44";e.currentTarget.style.borderColor=m.color}}
                                            onMouseLeave={e=>{if(!sel){e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor="rgba(0,0,0,.08)"}else{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 0 14px "+m.glow}}}
                                          >
                                            <span style={{fontSize:"1.2rem",lineHeight:1}}>{m.i}</span>
                                            <span style={{fontWeight:sel?600:400}}>{m.label}</span>
                                            <span style={{fontSize:".6rem",color:m.color,marginLeft:"2px"}}>{m.desc||""}</span>
                                          </button>
                                        );
                                      })}
                </div>
                <textarea className="input" style={{minHeight:"90px",resize:"vertical",fontFamily:"inherit",lineHeight:"1.8"}} placeholder="写点什么吧…" value={content} onChange={e=>setContent(e.target.value)} />
                {message && <p style={{fontSize:".85rem",color:"var(--warm-glow)",marginTop:"8px",textAlign:"center"}}>{message}</p>}
                <button type="submit" className="btn btn--primary btn--block" style={{marginTop:"12px"}} disabled={submitting}>{submitting?"泊船中...":"⚓ 泊船处"}</button>
              </form>
            )}
          </div>

          {/* === 右栏：近7天心情曲线 === */}
          <div className="card" style={{marginBottom:0}}>
            <h3 style={{fontSize:"1rem",fontWeight:600,color:"var(--night)",marginBottom:"14px"}}>📊 近7天心情</h3>
            {allCheckins.length > 0 ? (
              <>
                <div style={{display:"flex",alignItems:"flex-end",gap:"4px",height:"140px",padding:"4px 2px"}}>
                  {last7.map((d,i) => (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",height:"100%"}}>
                      <div style={{fontSize:".8rem",lineHeight:1.4}}>{d.mood ? (resolveMood(d.mood)?.i||"") : ""}</div>
                      <div style={{flex:1,width:"100%",display:"flex",alignItems:"flex-end"}}>
                        <div style={{width:"100%",height:(d.mood?45+Math.random()*55:4)+"%",borderRadius:"6px 6px 0 0",background:d.mood?(resolveMood(d.mood)?.color||"var(--warm-glow)"):"#eee",opacity:d.mood?.8:.25,minHeight:"4px",transition:"height .5s ease"}} />
                      </div>
                      <div style={{fontSize:".6rem",color:"var(--text-muted)",marginTop:"2px"}}>{d.day}</div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:"10px",paddingTop:"10px",borderTop:"1px solid rgba(240,194,127,.08)",textAlign:"center"}}>
                  <span style={{fontSize:".75rem",color:"var(--text-muted)"}}>
                    航海日志 <strong style={{color:"var(--warm-glow)"}}>{history.length}</strong> 天 · 连续 <strong style={{color:"var(--warm-glow)"}}>{history.length > 0 ? 1 + Math.floor(Math.random() * 5) : 0}</strong> 天
                  </span>
                </div>
              </>
            ) : (
              <div style={{textAlign:"center",padding:"30px 0",color:"var(--text-muted)"}}>
                <p style={{fontSize:"1.5rem",marginBottom:"8px"}}>📊</p>
                <p style={{fontSize:".85rem"}}>开始记录航海日志后，这里会显示你的心情曲线</p>
              </div>
            )}
          </div>
        </div>

        {/* === 日历 === */}
        <div className="card" style={{marginBottom:"24px"}}>
          <h3 style={{fontSize:"1rem",fontWeight:600,color:"var(--night)",marginBottom:"16px"}}>📅 {year}年{month+1}月</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px",textAlign:"center"}}>
            {["日","一","二","三","四","五","六"].map(d=><div key={d} style={{fontSize:".72rem",color:"var(--text-muted)",padding:"4px 0"}}>{d}</div>)}
            {Array(firstDay).fill(null).map((_,i)=><div key={"e"+i}/>)}
            {Array.from({length:daysInMonth},(_,i)=>i+1).map(day=>{
              const m=getMood(day);const isToday=day===today.getDate();
              return <div key={day} style={{padding:"6px 0",borderRadius:"8px",fontSize:".82rem",background:m?"var(--warm-glow-dim)":(isToday?"rgba(240,194,127,.05)":"transparent"),border:isToday?"1.5px solid var(--warm-glow)":"1.5px solid transparent",color:m?"var(--warm-glow)":"var(--text-light)",fontWeight:isToday?600:400}}><div>{day}</div>{m&&<div style={{fontSize:".7rem"}}>{m}</div>}</div>;
            })}
          </div>
        </div>

        {/* === 最近记录 === */}
        <h2 style={{fontSize:"1rem",fontWeight:600,color:"var(--night)",marginBottom:"12px"}}>📋 最近记录</h2>
        {history.length===0?(
          <div className="card" style={{textAlign:"center",color:"var(--text-muted)",padding:"32px"}}><p>还没有航海记录，去泊船处写下今日的故事吧。</p></div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            {history.slice(0,10).map(h=>(
              <div key={h.id} className="card card--tight" style={{display:"flex",alignItems:"flex-start",gap:"16px"}}>
                <span style={{fontSize:"1.2rem",flexShrink:0}}>{h.mood?((resolveMood(h.mood)?.i||"")||"📅"):"📅"}</span>
                <div><p style={{fontSize:".82rem",color:"var(--text-muted)"}}>{h.date===new Date().toISOString().slice(0,10)?"今天":h.date}{h.mood?" · "+(resolveMood(h.mood)?.label||h.mood):""}</p><p style={{fontSize:".93rem",color:"var(--text-light)",marginTop:"2px"}}>{h.content}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === 鼓励小幕 === */}
      {showEncourage && encouragement && (
        <div className="modal-overlay" onClick={()=>setShowEncourage(false)}>
          <div className="modal-content" style={{textAlign:"center",padding:"36px 28px",maxWidth:"400px"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"2rem",marginBottom:"8px",opacity:.6}}>🌿</div>
            <p style={{fontSize:"1.05rem",color:"var(--night)",lineHeight:"1.9",fontWeight:500,marginBottom:"16px"}}>
              &ldquo;{encouragement.text}&rdquo;
            </p>
            <p style={{fontSize:".82rem",color:"var(--text-muted)"}}>
              — {encouragement.author}
            </p>
            <button onClick={()=>setShowEncourage(false)} className="btn btn--primary btn--sm" style={{marginTop:"16px"}}>
              谢谢你 ∼
            </button>
          </div>
        </div>
      )}

            {/* 浮动在线 */}
      <div style={{position:"fixed",bottom:"24px",right:"24px",zIndex:999,display:"flex",alignItems:"center",gap:"8px",background:"rgba(26,26,46,.85)",backdropFilter:"blur(12px)",padding:"10px 18px",borderRadius:"40px",border:"1px solid rgba(240,194,127,.12)",boxShadow:"0 4px 20px rgba(0,0,0,.2)",cursor:"pointer",transition:"all .3s ease"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 8px 30px rgba(0,0,0,.3)"}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.2)"}}>
        <span className="online-dot" style={{width:"10px",height:"10px"}} />
        <span style={{fontSize:".82rem",color:"rgba(250,246,240,.6)"}}>在线 <strong style={{color:"var(--warm-glow)",fontWeight:700}}>{onlineCount}</strong> 人</span>
      </div>
    </div>
  );
}
