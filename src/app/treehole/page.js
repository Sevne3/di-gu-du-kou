"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { getMe } from "@/lib/api";

const moodOptions = [
  { value:"comfort", label:"求安慰", icon:"🫂", color:"#6ab04c" },
  { value:"joy", label:"分享快乐", icon:"🎉", color:"#f0c27f" },
  { value:"rant", label:"单纯吐槽", icon:"💢", color:"#e74c3c" },
  { value:"emo", label:"深夜emo", icon:"🌙", color:"#a8b8d4" }
];

const nicknames = ["远方的航海士A","陌生的海鸥B","孤独的灯塔C","流浪的信天翁D","深海的鲸鱼E","沉默的浮标F"];

export default function TreeholePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("main");
  const [myBottles, setMyBottles] = useState([]);
  const [pickedBottles, setPickedBottles] = useState([]);
  const [repliedBottles, setRepliedBottles] = useState([]);
  const [todayPicks, setTodayPicks] = useState(0);
  const [maxPicks] = useState(5);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Throw bottle modal
  const [showThrowModal, setShowThrowModal] = useState(false);
  const [throwContent, setThrowContent] = useState("");
  const [throwMood, setThrowMood] = useState("comfort");
  const [throwing, setThrowing] = useState(false);

  // Fish state
  const [fishing, setFishing] = useState(false);
  const [caughtBottle, setCaughtBottle] = useState(null);
  const [showFishAnim, setShowFishAnim] = useState(false);

  // Chat state
  const [chatBottle, setChatBottle] = useState(null);
  const [chatReplies, setChatReplies] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [bottleNickname, setBottleNickname] = useState("远方的航海士");
  const [myNickname, setMyNickname] = useState("陌生的航海者");
  const chatEndRef = useRef(null);
  const [onlineCount] = useState(() => Math.floor(Math.random() * 15) + 3);

  useEffect(() => {
    getMe().then(d => { if (!d.user) { router.push(''); return; } setUser(d.user); loadData(); }).catch(() => router.push(''));
  }, []);

  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior:"smooth" }); }, [chatReplies]);

  const showMsg = (msg, type) => { setMessage(msg); setMessageType(type||""); setTimeout(() => setMessage(""), 3000); };

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/treehole", { headers: { "Authorization": "Bearer " + token } });
      const d = await res.json();
      setMyBottles(d.myBottles || []);
      setPickedBottles(d.pickedBottles || []);
      setRepliedBottles(d.repliedBottles || []);
      setTodayPicks(d.todayPicks || 0);
    } catch {}
    setLoading(false);
  };

  const handleThrow = async (e) => {
    e.preventDefault();
    if (!throwContent.trim()) { showMsg("写点什么再丢吧"); return; }
    setThrowing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/treehole", {
        method: "POST", headers: { "Content-Type":"application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ action:"throw", content: throwContent.trim(), mood_tag: throwMood })
      });
      const d = await res.json();
      if (d.error) { showMsg(d.error); }
      else {
        showMsg("瓶子已漂向大海 🌊", "success");
        setShowThrowModal(false);
        setThrowContent("");
        loadData();
      }
    } catch { showMsg("出错了"); }
    setThrowing(false);
  };

  const handleFish = async () => {
    if (todayPicks >= maxPicks) { showMsg("今天体力耗尽了，明天再来吧 🌙"); return; }
    
    setFishing(true);
    setShowFishAnim(true);
    
    // Play animation for 1.5 seconds
    await new Promise(r => setTimeout(r, 1800));
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/treehole", {
        method: "POST", headers: { "Content-Type":"application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ action:"fish" })
      });
      const d = await res.json();
      if (d.error) {
        if (res.status === 429) showMsg("今天体力耗尽了，明天再来吧 🌙");
        else showMsg(d.error);
        setShowFishAnim(false);
        setFishing(false);
        return;
      }
      setCaughtBottle(d.bottle);
      setTodayPicks(prev => prev + 1);
      
      // Set my nickname
      const myIdx = Math.abs((user?.id||"").split("_").pop().charCodeAt(0) || 0) % nicknames.length;
      setMyNickname(nicknames[myIdx]);
      setBottleNickname(d.bottle.sender_nickname);
    } catch { showMsg("打捞失败"); }
    
    setShowFishAnim(false);
    setFishing(false);
  };

  const openChat = async (bottle) => {
    setView('chat');
    setChatBottle(bottle);
    loadReplies(bottle.id);
  };

  const loadReplies = async (bottleId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/treehole", {
        method: "POST", headers: { "Content-Type":"application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ action:"getReplies", bottleId })
      });
      const d = await res.json();
      setChatReplies(d.replies || []);
      setBottleNickname(d.bottle_nickname);
    } catch {}
  };

  const handleSendReply = async () => {
    if (!chatInput.trim() || !chatBottle) return;
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/treehole", {
        method: "POST", headers: { "Content-Type":"application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ action:"reply", bottleId: chatBottle.id, content: chatInput.trim() })
      });
      const d = await res.json();
      if (d.reply) {
        setChatReplies(prev => [...prev, d.reply]);
        setChatInput("");
      }
    } catch { showMsg("发送失败"); }
    setSending(false);
  };

  const moodIcon = (tag) => { const m = moodOptions.find(x => x.value === tag); return m ? m.icon + " " + m.label : ""; };
  const moodColor = (tag) => { const m = moodOptions.find(x => x.value === tag); return m ? m.color : "#a8b5a0"; };

  if (loading) return <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0a1628,#1a1a2e 40%,#16213e 70%,#0d1b2a)",display:"flex",alignItems:"center",justifyContent:"center"}}><div className="spinner" /></div>;

  // MAIN OCEAN VIEW
  if (view === "main") {
    return (
      <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0a1628 0%,#1a1a2e 30%,#16213e 55%,#0d2137 75%,#0a1628 100%)",position:"relative",overflow:"hidden"}}>
        {/* Floating particles/bubbles */}
        <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
          {Array.from({length:20},(_,i) => (
            <div key={i} style={{
              position:"absolute",left:(Math.random()*90+5)+"%",bottom:"-"+(Math.random()*20)+"%",
              width:(Math.random()*6+3)+"px",height:(Math.random()*6+3)+"px",
              borderRadius:"50%",background:"rgba(240,194,127,.08)",
              animation:"floatUp "+(6+Math.random()*8)+"s ease-in-out infinite",
              animationDelay:(Math.random()*5)+"s"
            }} />
          ))}
        </div>

        {/* Header */}
        <header style={{position:"relative",zIndex:10,padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(10,22,40,.6)",backdropFilter:"blur(10px)",borderBottom:"1px solid rgba(240,194,127,.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <Logo size={20} showText={false} />
            <span style={{fontSize:"1rem",fontWeight:600,color:"rgba(250,246,240,.7)",letterSpacing:"1px"}}>🍾 漂流瓶</span>
          </div>
          <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
            <button onClick={()=>{setView("mine");loadData()}} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"40px",padding:"6px 14px",color:"rgba(250,246,240,.5)",fontSize:".78rem",cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.color="rgba(250,246,240,.8)";e.target.style.background="rgba(255,255,255,.1)"}} onMouseLeave={e=>{e.target.style.color="rgba(250,246,240,.5)";e.target.style.background="rgba(255,255,255,.06)"}}>
              🍾 我的瓶子
            </button>
            <a href="/notifications" style={{color:"rgba(250,246,240,.3)",fontSize:".82rem",textDecoration:"none",padding:"4px 8px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",marginRight:"6px"}} onMouseEnter={e=>e.target.style.color="rgba(250,246,240,.6)"} onMouseLeave={e=>e.target.style.color="rgba(250,246,240,.3)"}>🔔</a><a href="/dashboard" style={{color:"rgba(250,246,240,.25)",fontSize:".72rem",textDecoration:"none",padding:"6px 10px",borderRadius:"8px",transition:"all .2s"}} onMouseEnter={e=>e.target.style.color="rgba(250,246,240,.6)"} onMouseLeave={e=>e.target.style.color="rgba(250,246,240,.25)"}>← 返回渡口</a>
          </div>
        </header>

        {/* Message */}
        {message && (
          <div style={{position:"fixed",top:"80px",left:"50%",transform:"translateX(-50%)",zIndex:100,background:messageType==="success"?"rgba(106,176,76,.15)":"rgba(231,76,60,.15)",border:"1px solid "+(messageType==="success"?"rgba(106,176,76,.3)":"rgba(231,76,60,.3)"),borderRadius:"12px",padding:"10px 24px",fontSize:".85rem",color:messageType==="success"?"#6ab04c":"#e74c3c",backdropFilter:"blur(10px)"}}>{message}</div>
        )}

        {/* Main content - ocean */}
        <div style={{position:"relative",zIndex:5,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 60px)",padding:"40px 24px"}}>
          
          {/* Moon */}
          <div style={{position:"absolute",top:"40px",right:"15%",width:"80px",height:"80px",borderRadius:"50%",background:"radial-gradient(circle,rgba(240,194,127,.15),rgba(240,194,127,.05) 60%,transparent)",boxShadow:"0 0 60px rgba(240,194,127,.1)"}} />

          {/* Title */}
          <div style={{textAlign:"center",marginBottom:"48px"}}>
            <h1 style={{fontSize:"2rem",fontWeight:300,color:"rgba(250,246,240,.7)",letterSpacing:"4px",marginBottom:"8px",fontFamily:"inherit"}}>漂 流 瓶</h1>
            <p style={{fontSize:".82rem",color:"rgba(250,246,240,.25)",letterSpacing:"2px"}}>把心事装进瓶子，任它漂向有缘人</p>
          </div>

          {/* Stats */}
          <div style={{display:"flex",gap:"24px",marginBottom:"48px",fontSize:".75rem",color:"rgba(250,246,240,.3)"}}>
            <span>今日打捞 <strong style={{color:"rgba(240,194,127,.6)"}}>{todayPicks}/{maxPicks}</strong></span>
          </div>

          {/* Big action buttons */}
          <div style={{display:"flex",gap:"32px",flexWrap:"wrap",justifyContent:"center"}}>
            <button onClick={()=>setShowThrowModal(true)} style={{
              width:"160px",height:"160px",borderRadius:"50%",border:"2px solid rgba(240,194,127,.2)",
              background:"radial-gradient(circle at 40% 35%, rgba(240,194,127,.08), rgba(240,194,127,.02) 60%, transparent)",
              cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"8px",
              transition:"all .4s ease",fontFamily:"inherit",position:"relative",
              boxShadow:"0 8px 40px rgba(240,194,127,.06)",
              animation:"floatGlow 4s ease-in-out infinite"
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.05)";e.currentTarget.style.borderColor="rgba(240,194,127,.4)";e.currentTarget.style.boxShadow="0 12px 50px rgba(240,194,127,.12)"}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor="rgba(240,194,127,.2)";e.currentTarget.style.boxShadow="0 8px 40px rgba(240,194,127,.06)"}}
            >
              <span style={{fontSize:"2.5rem",lineHeight:1}}>🍾</span>
              <span style={{fontSize:"1rem",color:"rgba(240,194,127,.7)",fontWeight:500}}>丢瓶子</span>
              <span style={{fontSize:".65rem",color:"rgba(250,246,240,.25)"}}>写下心事</span>
            </button>

            <button onClick={handleFish} disabled={fishing} style={{
              width:"160px",height:"160px",borderRadius:"50%",border:"2px solid rgba(106,176,76,.2)",
              background:"radial-gradient(circle at 40% 35%, rgba(106,176,76,.08), rgba(106,176,76,.02) 60%, transparent)",
              cursor:fishing?"wait":"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"8px",
              transition:"all .4s ease",fontFamily:"inherit",
              boxShadow:"0 8px 40px rgba(106,176,76,.06)",
              animation:"floatGlow 4s ease-in-out infinite",
              animationDelay:"2s",opacity:fishing?.6:1
            }}
              onMouseEnter={e=>{if(!fishing){e.currentTarget.style.transform="scale(1.05)";e.currentTarget.style.borderColor="rgba(106,176,76,.4)";e.currentTarget.style.boxShadow="0 12px 50px rgba(106,176,76,.12)"}}}
              onMouseLeave={e=>{if(!fishing){e.currentTarget.style.transform="";e.currentTarget.style.borderColor="rgba(106,176,76,.2)";e.currentTarget.style.boxShadow="0 8px 40px rgba(106,176,76,.06)"}}}
            >
              <span style={{fontSize:"2.5rem",lineHeight:1}}>🎣</span>
              <span style={{fontSize:"1rem",color:"rgba(106,176,76,.7)",fontWeight:500}}>捞瓶子</span>
              <span style={{fontSize:".65rem",color:"rgba(250,246,240,.25)"}}>随机邂逅</span>
            </button>
          </div>

          {/* Fishing animation overlay */}
          {showFishAnim && (
            <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(10,22,40,.8)",backdropFilter:"blur(4px)"}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:"3rem",marginBottom:"16px",animation:"moodFloat 1s ease-in-out infinite"}}>🎣</div>
                <p style={{fontSize:"1rem",color:"rgba(250,246,240,.6)",letterSpacing:"2px"}}>撒网中...</p>
                <p style={{fontSize:".78rem",color:"rgba(250,246,240,.2)",marginTop:"8px"}}>等待鱼儿上钩</p>
              </div>
            </div>
          )}

          {/* Caught bottle display */}
          {caughtBottle && !showFishAnim && (
            <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(10,22,40,.7)",backdropFilter:"blur(6px)",animation:"fadeIn .3s ease"}} onClick={()=>setCaughtBottle(null)}>
              <div className="modal-content" style={{maxWidth:"440px",width:"90%",textAlign:"center",background:"linear-gradient(160deg,#1a1a2e,#2d2d44)",border:"1px solid rgba(240,194,127,.1)"}} onClick={e=>e.stopPropagation()}>
                {/* Bottle top */}
                <div style={{fontSize:"2.5rem",marginBottom:"8px",opacity:.6}}>🍾</div>
                
                {/* Mood tag */}
                <div style={{display:"inline-block",padding:"3px 12px",borderRadius:"40px",fontSize:".7rem",background:moodColor(caughtBottle.mood_tag)+"22",color:moodColor(caughtBottle.mood_tag),border:"1px solid "+moodColor(caughtBottle.mood_tag)+"44",marginBottom:"12px"}}>
                  {moodIcon(caughtBottle.mood_tag)}
                </div>

                {/* Content */}
                <div style={{background:"rgba(255,255,255,.04)",borderRadius:"12px",padding:"20px",margin:"12px 0",position:"relative"}}>
                  <p style={{fontSize:"1.05rem",color:"rgba(250,246,240,.8)",lineHeight:"1.9",whiteSpace:"pre-wrap"}}>{"\u201C"}{caughtBottle.content}{"\u201D"}</p>
                </div>

                {/* From */}
                <p style={{fontSize:".75rem",color:"rgba(250,246,240,.3)",marginBottom:"16px"}}>— 来自 {caughtBottle.sender_nickname}</p>

                {/* Actions */}
                <div style={{display:"flex",gap:"12px",justifyContent:"center"}}>
                  <button onClick={()=>{setCaughtBottle(null)}} className="btn btn--ghost btn--sm" style={{fontSize:".78rem",padding:"8px 20px"}}>
                    🌊 扔回海里
                  </button>
                  <button onClick={()=>{const b=caughtBottle;setCaughtBottle(null);openChat(b)}} className="btn btn--primary btn--sm" style={{fontSize:".78rem",padding:"8px 20px"}}>
                    💌 写回信
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom wave */}
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:"80px",background:"linear-gradient(180deg,transparent,rgba(10,22,40,.8))",pointerEvents:"none"}} />
        </div>

        {/* Throw bottle modal */}
        {showThrowModal && (
          <div className="modal-overlay" onClick={()=>setShowThrowModal(false)}>
            <div className="modal-content" style={{maxWidth:"460px",background:"linear-gradient(160deg,#2d2d44,#1a1a2e)",border:"1px solid rgba(240,194,127,.1)"}} onClick={e=>e.stopPropagation()}>
              <div style={{textAlign:"center",marginBottom:"20px"}}>
                <div style={{fontSize:"2rem",marginBottom:"8px",opacity:.6}}>🍾</div>
                <h3 style={{fontSize:"1.1rem",fontWeight:600,color:"rgba(250,246,240,.8)"}}>把心事装进瓶子</h3>
                <p style={{fontSize:".78rem",color:"rgba(250,246,240,.3)",marginTop:"4px"}}>你的瓶子会漂向大海，被某个有缘人捞起</p>
              </div>
              <form onSubmit={handleThrow} style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                <div>
                  <label style={{fontSize:".78rem",color:"rgba(250,246,240,.4)",display:"block",marginBottom:"6px"}}>心情浮标</label>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                    {moodOptions.map(m => (
                      <button key={m.value} type="button" onClick={()=>setThrowMood(m.value)}
                        style={{
                          padding:"6px 14px",borderRadius:"8px",border:"1.5px solid",cursor:"pointer",fontFamily:"inherit",fontSize:".78rem",
                          borderColor:throwMood===m.value?m.color:"rgba(255,255,255,.08)",
                          background:throwMood===m.value?m.color+"22":"rgba(255,255,255,.04)",
                          color:throwMood===m.value?m.color:"rgba(250,246,240,.4)",
                          transition:"all .2s"
                        }}
                      >{m.icon} {m.label}</button>
                    ))}
                  </div>
                </div>
                <textarea className="input" style={{minHeight:"120px",resize:"vertical",fontFamily:"inherit",lineHeight:"1.8",background:"rgba(255,255,255,.04)",borderColor:"rgba(255,255,255,.08)",color:"rgba(250,246,240,.7)"}} placeholder="写下你想说的话…" value={throwContent} onChange={e=>setThrowContent(e.target.value)} required />
                <button type="submit" className="btn btn--primary btn--sm" disabled={throwing} style={{width:"100%",justifyContent:"center"}}>
                  {throwing ? "漂向大海..." : "🍾 丢出瓶子"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Online count */}
        <div style={{position:"fixed",bottom:"24px",right:"24px",zIndex:999,display:"flex",alignItems:"center",gap:"8px",background:"rgba(26,26,46,.85)",backdropFilter:"blur(12px)",padding:"10px 18px",borderRadius:"40px",border:"1px solid rgba(240,194,127,.12)",boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>
          <span className="online-dot" style={{width:"10px",height:"10px"}} />
          <span style={{fontSize:".82rem",color:"rgba(250,246,240,.6)"}}>在线 <strong style={{color:"var(--warm-glow)",fontWeight:700}}>{onlineCount}</strong> 人</span>
        </div>
      </div>
    );
  }

  // MY BOTTLES VIEW
  if (view === "mine") {
    return (
      <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0a1628,#1a1a2e 40%,#16213e 70%,#0d1b2a)",position:"relative"}}>
        <header style={{padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(10,22,40,.6)",backdropFilter:"blur(10px)",borderBottom:"1px solid rgba(240,194,127,.06)"}}>
          <button onClick={()=>setView("main")} style={{background:"none",border:"none",color:"rgba(250,246,240,.4)",fontSize:".82rem",cursor:"pointer",fontFamily:"inherit"}}>← 返回海洋</button>
          <span style={{fontSize:"1rem",fontWeight:600,color:"rgba(250,246,240,.7)"}}>🍾 我的瓶子</span>
          <div style={{width:"50px"}} />
        </header>

        <div style={{maxWidth:"600px",margin:"0 auto",padding:"24px 16px",paddingBottom:"100px"}}>
          {/* My bottles */}
          {myBottles.length > 0 && (
            <>
              <h3 style={{fontSize:".9rem",fontWeight:600,color:"rgba(250,246,240,.5)",marginBottom:"12px",letterSpacing:"1px"}}>📤 我丢出的瓶子 ({myBottles.length})</h3>
              <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"28px"}}>
                {myBottles.map(b => (
                  <div key={b.id} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"12px",padding:"14px 16px",transition:"all .2s",cursor:"pointer"}} onClick={()=>openChat(b)}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
                      <span style={{fontSize:".7rem",padding:"2px 8px",borderRadius:"40px",background:moodColor(b.mood_tag||"comfort")+"22",color:moodColor(b.mood_tag||"comfort")}}>{moodIcon(b.mood_tag||"comfort")}</span>
                      <span style={{fontSize:".7rem",color:"rgba(250,246,240,.2)"}}>{b.created_at?.slice(0,10)}</span>
                      <span style={{fontSize:".7rem",color:b.is_picked?"rgba(106,176,76,.5)":"rgba(250,246,240,.2)"}}>{b.is_picked ? "✓ 已被捞起" : "⏳ 在海中漂流"}</span>
                    </div>
                    <p style={{fontSize:".85rem",color:"rgba(250,246,240,.6)",lineHeight:"1.6",whiteSpace:"pre-wrap",overflow:"hidden",textOverflow:"ellipsis",maxHeight:"2.8em"}}>{b.content}</p>
                    {b.replyCount > 0 && <p style={{fontSize:".7rem",color:"rgba(240,194,127,.5)",marginTop:"6px"}}>🍃 {b.replyCount} 条回信</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Picked bottles */}
          {pickedBottles.length > 0 && (
            <>
              <h3 style={{fontSize:".9rem",fontWeight:600,color:"rgba(250,246,240,.5)",marginBottom:"12px",letterSpacing:"1px"}}>🎣 我捞起的瓶子 ({pickedBottles.length})</h3>
              <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"28px"}}>
                {pickedBottles.map(b => (
                  <div key={b.id} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"12px",padding:"14px 16px",transition:"all .2s",cursor:"pointer"}} onClick={()=>openChat(b)}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
                      <span style={{fontSize:".7rem",padding:"2px 8px",borderRadius:"40px",background:moodColor(b.mood_tag||"comfort")+"22",color:moodColor(b.mood_tag||"comfort")}}>{moodIcon(b.mood_tag||"comfort")}</span>
                      <span style={{fontSize:".7rem",color:"rgba(250,246,240,.2)"}}>{b.picked_at?.slice(0,10)}</span>
                    </div>
                    <p style={{fontSize:".85rem",color:"rgba(250,246,240,.6)",lineHeight:"1.6",whiteSpace:"pre-wrap",overflow:"hidden",textOverflow:"ellipsis",maxHeight:"2.8em"}}>{b.content}</p>
                    {b.replyCount > 0 && <p style={{fontSize:".7rem",color:"rgba(240,194,127,.5)",marginTop:"6px"}}>🍃 {b.replyCount} 条回信</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {myBottles.length === 0 && pickedBottles.length === 0 && repliedBottles.length === 0 && (
            <div style={{textAlign:"center",padding:"80px 24px",color:"rgba(250,246,240,.2)"}}>
              <p style={{fontSize:"3rem",marginBottom:"16px"}}>🌊</p>
              <p style={{fontSize:".9rem",marginBottom:"8px"}}>还没有瓶子</p>
              <p style={{fontSize:".78rem"}}>去丢一个瓶子，或者捞一个别人的瓶子吧</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // CHAT VIEW
  if (view === "chat" && chatBottle) {
    return (
      <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0a1628,#1a1a2e 40%,#16213e 70%,#0d1b2a)",display:"flex",flexDirection:"column"}}>
        <header style={{padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(10,22,40,.6)",backdropFilter:"blur(10px)",borderBottom:"1px solid rgba(240,194,127,.06)"}}>
          <button onClick={()=>{setChatBottle(null);setView("mine");loadData()}} style={{background:"none",border:"none",color:"rgba(250,246,240,.4)",fontSize:".82rem",cursor:"pointer",fontFamily:"inherit"}}>← 返回</button>
          <span style={{fontSize:".9rem",fontWeight:600,color:"rgba(250,246,240,.6)"}}>🍃 与 {bottleNickname} 对话</span>
          <div style={{width:"50px"}} />
        </header>

        <div style={{flex:1,overflowY:"auto",padding:"16px",maxWidth:"600px",margin:"0 auto",width:"100%"}}>
          {/* The original bottle */}
          <div style={{textAlign:"center",marginBottom:"20px",padding:"16px",background:"rgba(255,255,255,.04)",borderRadius:"12px",border:"1px solid rgba(240,194,127,.08)"}}>
            <p style={{fontSize:".75rem",color:"rgba(250,246,240,.2)",marginBottom:"8px"}}>{bottleNickname} 的漂流瓶</p>
            <p style={{fontSize:".9rem",color:"rgba(250,246,240,.6)",lineHeight:"1.8",whiteSpace:"pre-wrap"}}>{"\u201C"}{chatBottle.content}{"\u201D"}</p>
          </div>

          {/* Replies */}
          {chatReplies.length === 0 ? (
            <div style={{textAlign:"center",padding:"40px 0",color:"rgba(250,246,240,.2)"}}>
              <p style={{fontSize:".85rem"}}>还没有回信，写点什么吧 📝</p>
            </div>
          ) : (
            chatReplies.map(r => {
              const isMe = r.is_me;
              return (
                <div key={r.id} style={{display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start",marginBottom:"14px"}}>
                  <div style={{maxWidth:"80%",padding:"10px 16px",borderRadius:isMe?"16px 16px 4px 16px":"16px 16px 16px 4px",background:isMe?"rgba(240,194,127,.12)":"rgba(255,255,255,.06)",border:"1px solid "+(isMe?"rgba(240,194,127,.15)":"rgba(255,255,255,.08)")}}>
                    <p style={{fontSize:".85rem",color:"rgba(250,246,240,.75)",lineHeight:"1.7",whiteSpace:"pre-wrap"}}>{r.content}</p>
                    <p style={{fontSize:".6rem",color:"rgba(250,246,240,.2)",marginTop:"4px",textAlign:isMe?"right":"left"}}>{r.sender_nickname} · {r.created_at?.slice(11,16)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div style={{padding:"12px 16px",background:"rgba(10,22,40,.8)",backdropFilter:"blur(10px)",borderTop:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{display:"flex",gap:"8px",maxWidth:"600px",margin:"0 auto"}}>
            <input className="input" style={{flex:1,background:"rgba(255,255,255,.06)",borderColor:"rgba(255,255,255,.08)",color:"rgba(250,246,240,.7)",fontSize:".85rem"}} placeholder={"给 "+bottleNickname+" 写回信..."} value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSendReply()}}} />
            <button onClick={handleSendReply} disabled={sending||!chatInput.trim()} className="btn btn--primary btn--sm" style={{flexShrink:0}}>{sending?"...":"发送"}</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}