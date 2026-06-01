"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import Globe from "@/components/Globe";
import { getMe, getMessages, sendMessage } from "@/lib/api";
import FloatingChat from "@/components/FloatingChat";

export default function BuddyPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pairs, setPairs] = useState([]);
  const [pendingReqs, setPendingReqs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [msg, setMsg] = useState("");
  const [onlineCount] = useState(function() { return Math.floor(Math.random() * 12) + 8; });
  const [chatPartner, setChatPartner] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  var chatMessagesRef = useRef([]);
  var chatBoxRef = useRef(null);

  useEffect(function() {
    getMe().then(function(d) {
      if (!d.user) { router.push(''); return; }
      setUser(d.user);
      load();
    }).catch(function() { router.push(''); });
  }, []);

  useEffect(function() {
    var withUser = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("with") : null;
    if (withUser && allUsers.length > 0 && user) {
      var partner = allUsers.find(function(u) { return u.id === withUser; });
      if (partner) openChat(partner);
    }
  }, [allUsers, user]);

  var load = function() {
    try {
      var token = localStorage.getItem("token");
      fetch("/api/pair", { headers: { "Authorization": "Bearer " + token } }).then(function(r){return r.json();}).then(function(d) {
        setPairs(d.pairs || []);
        setPendingReqs(d.pendingRequests || []);
        setAllUsers(d.allUsers || []);
      });
    } catch(e) {}
    setLoading(false);
  };

  var showMsg = function(text) { setMsg(text); setTimeout(function() { setMsg(""); }, 3000); };

  var sendPair = function(targetId) {
    try {
      var token = localStorage.getItem("token");
      fetch("/api/pair", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token }, body: JSON.stringify({ targetUserId: targetId, action: "send" }) });
      showMsg("💌 配对请求已发送！");
      load();
    } catch(e) { showMsg("发送失败"); }
  };

  var respondPair = function(fromId, action) {
    try {
      var token = localStorage.getItem("token");
      fetch("/api/pair", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token }, body: JSON.stringify({ targetUserId: fromId, action: action }) });
      showMsg(action === "accept" ? "🤝 配对成功！" : "已拒绝");
      load();
    } catch(e) {}
  };

  var loadChat = function(partnerId) {
    getMessages(partnerId).then(function(d) { setChatMessages(d.messages || []); }).catch(function(){});
  };

  var openChat = function(partner) {
    setChatPartner(partner);
    loadChat(partner.id);
    setTimeout(function() { if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight; }, 100);
  };

  var handleSendMessage = function() {
    if (!chatInput.trim() || !chatPartner) return;
    setSending(true);
    sendMessage(chatPartner.id, chatInput.trim()).then(function() {
      setChatInput("");
      return loadChat(chatPartner.id);
    }).catch(function() { alert("发送失败"); }).then(function() {
      setSending(false);
    });
  };

  useEffect(function() {
    if (!chatPartner) return;
    var interval = setInterval(function() {
      getMessages(chatPartner.id).then(function(msgs) {
        chatMessagesRef.current = msgs.messages || [];
        setChatMessages(msgs.messages || []);
      }).catch(function(){});
    }, 2000);
    return function() { clearInterval(interval); };
  }, [chatPartner]);

  useEffect(function() {
    var el = document.createElement("style");
    el.id = "buddy-pulse";
    el.textContent = "@keyframes buddyPulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.05); } }";
    document.head.appendChild(el);
    return function() { var s = document.getElementById(''); if (s) s.remove(); };
  }, []);

  var refreshUsers = function() {
    setRefreshing(true);
    setTimeout(function() {
      load();
      setRefreshing(false);
    }, 1000);
  };

  var matchedIds = new Set();
  var sentPending = [];
  var receivedPending = pendingReqs;
  var pendingTargetIds = new Set();
  if (user) {
    pairs.forEach(function(p) { if (p.status === "pending" && p.fromId === user.id) sentPending.push(p); });
    pairs.forEach(function(p) { if (p.status === "pending" && p.fromId === user.id) pendingTargetIds.add(p.toId); });
    pendingReqs.forEach(function(p) { pendingTargetIds.add(p.fromId); });
    pairs.forEach(function(p) { if (p.status === "matched" && p.otherUser && p.otherUser.id) matchedIds.add(p.otherUser.id); });
    pairs.forEach(function(p) { if (p.status === "matched" && p.toId === user.id && p.otherUser) matchedIds.add(p.fromId); });
  }

  var displayUsers = allUsers.filter(function(u) { return u.id !== (user ? user.id : null); });
  if (filter === "new") displayUsers = displayUsers.sort(function() { return Math.random() - 0.5; }).slice(0, 5);
  else if (filter === "night") displayUsers = displayUsers.filter(function(_, i) { return i % 3 === 0; });
  displayUsers = displayUsers.slice(0, 30);

  var globeUsers = allUsers.filter(function(u) { return u.id !== (user ? user.id : null); }).slice(0, 20);
  var matchedArr = [];
  pairs.forEach(function(p) { if (p.status === "matched" && p.otherUser && p.otherUser.id) matchedArr.push(p.otherUser.id); });

  if (loading) return (
    <div className="dashboard">
      <div className="spinner" />
    </div>
  );

  var getStatusBadge = function(u, idx) {
    if (idx < 3 && filter !== "night") return { label: "🔥 新上线", cls: "badge-tag-new" };
    if (idx % 3 === 1) return { label: "🌙 夜猫子", cls: "badge-tag-night" };
    return null;
  };

  var getSignature = function(u) {
    return "正在寻找同频的旅人 🌊";
  };

  return (
    <div className="dashboard">
      <header className="dh"><div className="dh-in"><a href="/dashboard" className="dh-brand"><Logo size={20} showText={false} /></a><div className="d-nav"><a href="/dashboard"><span>🚢</span><span className="nav-label">登船口</span></a><a href="/checkin"><span>⚓</span><span className="nav-label">航海日志</span></a><a href="/community"><span>🍃</span><span className="nav-label">低语台</span></a><a href="/treehole"><span>🍾</span><span className="nav-label">漂流瓶</span></a><a href="/skills"><span>🏮</span><span className="nav-label">互助港湾</span></a><a href="/capsule"><span>🌊</span><span className="nav-label">时间海</span></a><a href="/buddy" className="active"><span>👥</span><span className="nav-label">觅舟友</span></a><a href="/notifications" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}}>🔔</a><a href="/profile" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}}>👤</a><button onClick={function() { localStorage.removeItem('token'); window.location.href = ''; }} style={{background:'',border:'',color:'',fontSize:'',cursor:'',padding:'',borderRadius:'',transition:'',fontFamily:'',whiteSpace:''}}>退出</button><button id="nav-theme-toggle" onClick={function(){if(window.__toggleTheme)window.__toggleTheme()}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".85rem",cursor:"pointer",padding:"6px 8px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} title="切换主题">🌓</button></div></div></header>
      <div className="db">
        <div style={{marginBottom:"20px"}}>
          <h1 className="db-title" style={{marginBottom:"8px"}}>👥 同在渡口 · 觅舟友</h1>
          <p style={{fontSize:".82rem",color:"var(--text-light)",marginBottom:0}}>
            🌍 <strong>{onlineCount}</strong> 位正在渡口的旅人 · 实时更新
          </p>
          <p style={{fontSize:".75rem",color:"var(--text-muted)",marginTop:"4px"}}>
            他们此刻可能在咖啡馆、深夜地铁，或正准备出发
          </p>
        </div>
        <div className="globe-wrap" style={{position:"relative",marginBottom:"28px",borderRadius:"var(--radius)",overflow:"hidden",minHeight:"240px"}}>
          <Globe users={globeUsers} onPair={sendPair} pairedIds={matchedArr} />
        </div>
        {msg ? (
          <div style={{padding:"10px 18px",background:"var(--warm-glow-dim)",border:"1px solid var(--warm-glow)",borderRadius:"12px",textAlign:"center",marginBottom:"16px"}}>
            <p style={{fontSize:".85rem",color:"var(--warm-glow)"}}>{msg}</p>
          </div>
        ) : null}
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px",cursor:"pointer"}}
          onClick={function() {
            if (sentPending.length === 0 && receivedPending.length === 0) {
              showMsg('');
            } else {
              setShowPendingModal(true);
            }
          }}>
          {sentPending.length + receivedPending.length > 0 ? (
            <span style={{fontSize:'',color:'',padding:'',background:'',borderRadius:''}}>
              💌 已发送 <strong>{sentPending.length}</strong> 个配对请求 · 等待回应中
            </span>
          ) : (
            <span style={{fontSize:".82rem",color:"var(--text-muted)",padding:"8px 14px",background:"var(--cream)",borderRadius:"40px"}}>
              📬 你还没发出邀请？试试向一位旅人递出第一封信
            </span>
          )}
        </div>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"20px"}}>
          <button onClick={function() { setFilter('all'); }} className="btn btn--sm" style={{fontSize:".78rem",padding:"5px 14px",borderRadius:"40px",background:filter==="all"?"var(--warm-glow)":"var(--cream)",color:filter==="all"?"var(--night)":"var(--text-light)",border:"none",cursor:"pointer",fontFamily:"inherit"}}>🌊 全部</button>
          <button onClick={function() { setFilter('new'); }} className="btn btn--sm" style={{fontSize:".78rem",padding:"5px 14px",borderRadius:"40px",background:filter==="new"?"var(--warm-glow)":"var(--cream)",color:filter==="new"?"var(--night)":"var(--text-light)",border:"none",cursor:"pointer",fontFamily:"inherit"}}>✨ 新上线</button>
          <button onClick={function() { setFilter('night'); }} className="btn btn--sm" style={{fontSize:".78rem",padding:"5px 14px",borderRadius:"40px",background:filter==="night"?"var(--warm-glow)":"var(--cream)",color:filter==="night"?"var(--night)":"var(--text-light)",border:"none",cursor:"pointer",fontFamily:"inherit"}}>🌙 夜间活跃</button>
        </div>
        <div className="card-list" style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          {displayUsers.length === 0 ? (
            <div className="card" style={{textAlign:"center",padding:"40px 24px"}}>
              <p style={{fontSize:"2rem",marginBottom:"8px",opacity:.4}}>🌊</p>
              <p style={{fontSize:".88rem",color:"var(--text-muted)"}}>还没有其他旅人<br/>再等等，会有人来的</p>
            </div>
          ) : (
            displayUsers.map(function(u, idx) {
              var isMatched = matchedIds.has(u.id); if (isMatched) console.log("[配对] " + u.username + " 已匹配");
              var isPending = pendingTargetIds.has(u.id); if (isPending) console.log("[配对] " + u.username + " 等待中");
              var badge = getStatusBadge(u, idx);
              var sig = getSignature(u);
              return (
                <div key={u.id} className="card card--tight buddy-card" style={{display:"flex",alignItems:"center",gap:"12px",padding:"14px 18px",transition:"all .2s"}}>
                  <div style={{width:"38px",height:"38px",borderRadius:"50%",flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#f0c27f,#dba76a)"}}>
                    {u.avatar && (u.avatar.indexOf("data:") === 0 || u.avatar.indexOf("http") === 0) ? (
                      <img src={u.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    ) : (
                      <span style={{fontSize:"1.1rem"}}>{u.avatar || "👤"}</span>
                    )}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px"}}>
                      <span className="buddy-username" style={{fontSize:".9rem",fontWeight:500}}>{u.username || "渡口居民"}</span>
                      {badge ? (
                        <span className={badge.cls} style={{fontSize:".65rem",padding:"1px 8px",borderRadius:"40px"}}>{badge.label}</span>
                      ) : null}
                    </div>
                    <p className="buddy-status" style={{fontSize:".78rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sig}</p>
                  </div>
                  <div style={{flexShrink:0}}>
                    {isMatched ? (
                      <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                        <span style={{fontSize:".75rem",color:"var(--warm-glow)"}}>🤝 已结伴</span>
                        <button onClick={function() { openChat(u); }} className="btn btn--sm" style={{fontSize:".7rem",padding:"3px 10px",background:"var(--cream)",border:"none",borderRadius:"40px",cursor:"pointer",color:"var(--text-light)",fontFamily:"inherit"}}>💬</button>
                      </div>
                    ) : isPending ? (
                      <span style={{fontSize:".75rem",color:"var(--text-muted)"}}>⏳ 等待中</span>
                    ) : (
                      <button onClick={function() { sendPair(u.id); }} className="btn btn--warm btn--sm" style={{fontSize:".75rem",padding:"5px 14px",borderRadius:"40px",transition:"all .2s"}}>💌 配对</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div style={{position:"fixed",bottom:"80px",right:"24px",zIndex:999}}>
          <button onClick={refreshUsers} disabled={refreshing} className="btn" style={{width:"50px",height:"50px",borderRadius:"50%",fontSize:"1.2rem",display:"flex",alignItems:"center",justifyContent:"center",border:"none",cursor:"pointer",background:"var(--warm-glow)",color:"var(--night)",boxShadow:"0 4px 16px rgba(240,194,127,.4)",transition:"all .2s",fontFamily:"inherit"}}>
            {refreshing ? "⏳" : "+"}
          </button>
        </div>
        {showPendingModal ? (
          <div onClick={function() { setShowPendingModal(false); }} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(26,26,46,.5)",backdropFilter:"blur(4px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div onClick={function(e) { e.stopPropagation(); }} className="card" style={{maxWidth:"420px",width:"90%",maxHeight:"70vh",overflowY:"auto",padding:"24px"}}>
              <h3 style={{fontSize:"1rem",margin:"0 0 16px 0",color:"var(--night)"}}>💌 配对请求</h3>
              {sentPending.length === 0 && receivedPending.length === 0 ? (
                <p style={{textAlign:"center",color:"var(--text-muted)",fontSize:".85rem",padding:"24px 0",margin:0}}>暂无请求</p>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  {receivedPending.map(function(p) {
                    return (
                      <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"var(--cream)",borderRadius:"10px"}}>
                        <span style={{fontSize:".85rem",color:"var(--night)"}}>{(p.otherUser && p.otherUser.username) || "渡口居民"}</span>
                        <div style={{display:"flex",gap:"6px"}}>
                          <button onClick={function() { respondPair(p.fromId, 'accept'); }} className="btn btn--primary btn--sm" style={{fontSize:".7rem",padding:"3px 10px"}}>接受</button>
                          <button onClick={function() { respondPair(p.fromId, 'reject'); }} className="btn btn--ghost btn--sm" style={{fontSize:".7rem",padding:"3px 10px"}}>拒绝</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button onClick={function() { setShowPendingModal(false); }} className="btn btn--ghost btn--block" style={{marginTop:"16px",fontSize:".85rem"}}>关闭</button>
            </div>
          </div>
        ) : null}
        
        <FloatingChat
          partner={chatPartner}
          messages={chatMessages}
          input={chatInput}
          onSetInput={setChatInput}
          onSend={handleSendMessage}
          onClose={function() { setChatPartner(null); }}
          sending={sending}
          user={user}
        />

        {/* ===== 浮动在线人数 ===== */}
        <div style={{
          position:"fixed", bottom:"24px", right:"24px", zIndex:999,
          display:"flex", alignItems:"center", gap:"8px",
          background:"rgba(26,26,46,.85)", backdropFilter:"blur(12px)",
          padding:"10px 18px", borderRadius:"40px",
          border:"1px solid rgba(240,194,127,.12)",
          boxShadow:"0 4px 20px rgba(0,0,0,.2)",
          cursor:"pointer",
          transition:"all .3s ease"
        }}
          className="online-badge-hover"
          onClick={function(){window.location.href='/dashboard'}}
        >
          <span className="online-dot" style={{width:"10px",height:"10px"}} />
          <span style={{fontSize:".82rem",color:"rgba(250,246,240,.6)"}}>
            在线 <strong style={{color:"#f0c27f",fontWeight:700}}>{onlineCount + Math.floor(Math.random()*5)}</strong> 人
          </span>
          <span style={{fontSize:".65rem",color:"rgba(250,246,240,.2)",marginLeft:"4px"}}>👥</span>
        </div>


      </div>
    </div>
  );
}

