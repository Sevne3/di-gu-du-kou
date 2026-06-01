"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getMe, getPosts, createPost } from "@/lib/api";

const catLabels = { "心情":"💭","深夜陪伴":"🌙","日常":"🌱" };

export default function CommunityPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("心情");
  const [anonymous, setAnonymous] = useState(false);
  const [images, setImages] = useState([]);
  const [previewImgs, setPreviewImgs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("all");
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [reactionTypes] = useState({heart:{label:"我懂你",icon:"❤️"},same:{label:"有同感",icon:"👍"},hug:{label:"抱抱你",icon:"🤗"},cheer:{label:"加油",icon:"💪"}});
  const [expandedPost, setExpandedPost] = useState(null);
  const [commentCounts, setCommentCounts] = useState({});
  const [reactions, setReactions] = useState({});
  const [onlineCount] = useState(() => Math.floor(Math.random() * 15) + 3);
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    getMe().then(d => { if (!d.user) { router.push(''); return; } setUser(d.user); loadPosts(); }).catch(() => router.push(''));
  }, []);

  const loadPosts = async () => {
    try { 
      const { posts: data } = await getPosts(); 
      setPosts(data || []);
      // Preload comment counts
      const token = localStorage.getItem("token");
      if (data) {
        const counts = {};
        await Promise.all(data.map(async (p) => {
          try {
            const res = await fetch("/api/comments?postId=" + p.id, { headers: { "Authorization": "Bearer " + token } });
            const d = await res.json();
            counts[p.id] = (d.comments || []).length;
          } catch {}
        }));
        setCommentCounts(counts);
      }
    } catch {} setLoading(false);
  };

  const loadComments = async (postId) => {
    try { const res = await fetch("/api/comments?postId=" + postId); const d = await res.json(); setComments(prev => ({ ...prev, [postId]: d.comments || [] })); } catch {}
  };

  const loadReactions = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/reactions?postId=" + postId, { headers: { "Authorization": "Bearer " + token } });
      const d = await res.json();
      setReactions(prev => ({ ...prev, [postId]: d }));
    } catch {}
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 3) { alert("最多上传3张图片"); return; }
    files.forEach(file => {
      if (file.size > 1024 * 1024) { alert("单张图片不能超过1MB"); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => [...prev, ev.target.result]);
        setPreviewImgs(prev => [...prev, URL.createObjectURL(file)]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviewImgs(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePost = async (e) => {
    e.preventDefault(); if (!content.trim()) return;
    setSubmitting(true);
    try { await createPost({ title: title.trim(), content: content.trim(), category, isAnonymous: anonymous, images }); setTitle(""); setContent(""); setShowForm(false); setImages([]); setPreviewImgs([]); loadPosts(); } catch { alert("发布失败"); }
    setSubmitting(false);
  };

  const handleComment = async (postId) => {
    const text = commentInputs[postId]?.trim(); if (!text) return;
    try { const token = localStorage.getItem("token"); await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token }, body: JSON.stringify({ postId, content: text }) }); setCommentInputs(prev => ({ ...prev, [postId]: "" })); loadComments(postId); } catch {}
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("确定要删除这条帖子吗？")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/posts", { method: "DELETE", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token }, body: JSON.stringify({ postId }) });
      const d = await res.json();
      if (d.ok) { loadPosts(); }
    } catch { alert("删除失败"); }
  };

  const handleReact = async (postId, type) => {
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token }, body: JSON.stringify({ postId, type }) });
      loadReactions(postId);
    } catch {}
  };

  const toggleExpand = (postId) => {
    if (expandedPost === postId) { setExpandedPost(null); } else { setExpandedPost(postId); if (!comments[postId]) loadComments(postId); if (!reactions[postId]) loadReactions(postId); }
  };

  const filteredPosts = (filter === "all" ? posts.filter(p => p.category !== "技能交换" && p.category !== "工作互助") : posts.filter(p => p.category === filter)).filter(p => p.category !== "技能交换" && p.category !== "工作互助");

  if (loading) return <div className="dashboard"><div className="spinner" /></div>;

  return (
    <div className="dashboard">
      <header className="dh"><div className="dh-in"><a href="/dashboard" className="dh-brand"><Logo size={20} showText={false} /></a><div className="d-nav"><a href="/dashboard" className=""><span>🚢</span><span className="nav-label">登船口</span></a><a href="/checkin" className=""><span>⚓</span><span className="nav-label">航海日志</span></a><a href="/community" className=" active"><span>🍃</span><span className="nav-label">低语台</span></a><a href="/treehole" className=""><span>🍾</span><span className="nav-label">漂流瓶</span></a><a href="/skills" className=""><span>🏮</span><span className="nav-label">互助港湾</span></a><a href="/capsule" className=""><span>🌊</span><span className="nav-label">时间海</span></a><a href="/buddy" className=""><span>👥</span><span className="nav-label">觅舟友</span></a><a href="/notifications" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>🔔</a><a href="/profile" style={{color:"rgba(255,255,255,.35)",fontSize:".85rem",textDecoration:"none",padding:"6px 6px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>
          👤</a><button onClick={()=>{localStorage.removeItem('token');window.location.href="/"}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".75rem",cursor:"pointer",padding:"6px 10px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onmouseenter={e=>e.target.style.color='rgba(255,255,255,.7)'} onmouseleave={e=>e.target.style.color='rgba(255,255,255,.35)'}>退出</button><button id="nav-theme-toggle" onClick={function(){if(window.__toggleTheme)window.__toggleTheme()}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".85rem",cursor:"pointer",padding:"6px 8px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} title="切换主题">🌓</button></div></div></header>
      <div className="db">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px",marginBottom:"20px"}}>
          <h1 className="db-title" style={{marginBottom:0}}>🍃 低语台</h1>
        <p style={{fontSize:".82rem",color:"var(--text-light)",lineHeight:"1.9",marginBottom:"20px",maxWidth:"640px"}}>这里是安放情绪的低语台。你可以写下此刻的心事，或附上一张定格时光的照片，将内心的波澜轻轻投递，也可以驻足停留，在别人的故事里留下温暖的回应与共鸣。在这里，没有评判，只有倾听。每一次发声都会被温柔接住，每一份孤独都能找到回响。</p>
          <button onClick={()=>setShowForm(!showForm)} className="btn btn--primary btn--sm">{showForm ? "收起" : "📝 发帖"}</button>
        </div>
        <div className="tabs">
          {[["all","全部"],["心情","💭 心情"],["深夜陪伴","🌙 深夜"],["日常","🌱 日常"]].map(([k,v]) => (
            <button key={k} className={"tab"+(filter===k?" active":"")} onClick={()=>setFilter(k)}>{v}</button>
          ))}
        </div>
        {showForm && (
          <div className="card" style={{marginBottom:"24px"}}>
            <form onSubmit={handlePost} style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              <input className="input" placeholder="标题（选填）" value={title} onChange={e=>setTitle(e.target.value)} />
              {previewImgs.length > 0 && (
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"10px"}}>
              {previewImgs.map((url,i) => (
                <div key={i} style={{position:"relative",width:"80px",height:"80px",borderRadius:"8px",overflow:"hidden",border:"1px solid #eee",flexShrink:0}}>
                  <img src={url} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  <button onClick={()=>removeImage(i)} style={{position:"absolute",top:"2px",right:"2px",width:"20px",height:"20px",borderRadius:"50%",border:"none",background:"rgba(0,0,0,.5)",color:"#fff",fontSize:"12px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>x</button>
                </div>
              ))}
            </div>
          )}<textarea className="input" style={{minHeight:"120px",resize:"vertical",fontFamily:"inherit",lineHeight:"1.9"}} placeholder="写写你的心情、想法、或者想分享的信息…" value={content} onChange={e=>setContent(e.target.value)} required />
              <div style={{display:"flex",gap:"12px",flexWrap:"wrap",alignItems:"center"}}>
                <select className="input" style={{width:"auto",minWidth:"120px",padding:"10px 14px"}} value={category} onChange={e=>setCategory(e.target.value)}>
                  <option value="心情">💭 心情</option><option value="深夜陪伴">🌙 深夜陪伴</option><option value="日常">🌱 日常</option>
                </select>
                <label style={{display:"flex",alignItems:"center",gap:"6px",fontSize:".88rem",color:"var(--text-light)",cursor:"pointer"}}>
                  <input type="checkbox" checked={anonymous} onChange={e=>setAnonymous(e.target.checked)} style={{accentColor:"var(--warm-glow)"}} /> 匿名发布
                </label>
                <label style={{padding:"8px 14px",borderRadius:"10px",border:"1.5px dashed #ddd",textAlign:"center",cursor:"pointer",fontSize:".82rem",color:"var(--text-muted)",transition:"all .2s",whiteSpace:"nowrap"}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--warm-glow)"} onMouseLeave={e=>e.currentTarget.style.borderColor="#ddd"}>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{display:"none"}} />
                  📷 图片
                </label>
                <button type="submit" className="btn btn--primary btn--sm" disabled={submitting} style={{marginLeft:"auto"}}>{submitting ? "发布中..." : "发布"}</button>
              </div>
            </form>
          </div>
        )}
        {filteredPosts.length === 0 ? (
          <div className="card" style={{textAlign:"center",color:"var(--text-muted)",padding:"48px 24px"}}>
            <p style={{fontSize:"2rem",marginBottom:"12px"}}>💭</p><p>还没有帖子。成为第一个分享的人吧。</p>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            {filteredPosts.map(p => (
              <div key={p.id} className="pc">
                <div className="pc-m">
                  <span className="pc-a">{p.is_anonymous ? "匿名" : (p.username || "渡口居民")}</span><span style={{fontSize:"1rem",marginLeft:"4px",verticalAlign:"middle"}}>{!p.is_anonymous && p.avatar ? (p.avatar.startsWith("data:")||p.avatar.startsWith("http")?<img src={p.avatar} alt="" style={{width:"18px",height:"18px",borderRadius:"50%",objectFit:"cover",display:"inline-block",verticalAlign:"middle"}} />:<span>{p.avatar}</span>):null}</span>
                  <span>{p.created_at?.slice(5,16).replace("T"," ")}</span>
                  <span className="badge badge--ghost">{catLabels[p.category]||p.category} {p.category}</span>
                </div>
                {p.title && <div className="pc-t">{p.title}</div>}
                <div className="pc-c">{p.content}</div>{p.images && p.images.length > 0 && <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginTop:"12px"}}>{p.images.map((img,i) => <img key={i} src={img} style={{maxWidth:"100%",maxHeight:"300px",borderRadius:"12px",objectFit:"contain",cursor:"pointer"}} onClick={()=>setLightboxImg(img)} onError={e=>e.target.style.display="none"} />)}</div>}
                <div className="pc-f">
                  {Object.entries(reactionTypes).map(([key, rt]) => {
                    const reacted = reactions[p.id]?.userReactions?.[key];
                    const count = reactions[p.id]?.counts?.[key] || 0;
                    return (
                      <button key={key} onClick={()=>handleReact(p.id, key)}
                        style={{
                          display:"inline-flex",alignItems:"center",gap:"3px",
                          padding:"4px 10px",borderRadius:"40px",
                          border:"1.5px solid",fontSize:".78rem",
                          fontFamily:"inherit",cursor:"pointer",transition:"all .2s",
                          borderColor: reacted ? "var(--warm-glow)" : "#eee",
                          background: reacted ? "var(--warm-glow-dim)" : "transparent",
                          color: reacted ? "var(--warm-glow)" : "var(--text-muted)"
                        }}
                        onMouseEnter={e=>{if(!reacted){e.target.style.borderColor="var(--warm-glow)";e.target.style.color="var(--warm-glow)"}}}
                        onMouseLeave={e=>{if(!reacted){e.target.style.borderColor="#eee";e.target.style.color="var(--text-muted)"}}}
                      >
                        {rt.icon} {rt.label}{count > 0 ? " "+count : ""}
                      </button>
                    );
                  })}
                  {p.user_id === user?.id && <button onClick={()=>handleDeletePost(p.id)} style={{display:"inline-flex",alignItems:"center",gap:"3px",padding:"4px 10px",borderRadius:"40px",border:"1.5px solid #ffcdd2",fontSize:".78rem",fontFamily:"inherit",cursor:"pointer",transition:"all .2s",background:"transparent",color:"#ef9a9a"}} onMouseEnter={e=>{e.target.style.background="#ffebee";e.target.style.borderColor="#ef9a9a"}} onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.borderColor="#ffcdd2"}}>🗑️ 删除</button>}<button onClick={()=>toggleExpand(p.id)}>
                    🍃 {commentCounts[p.id] ?? comments[p.id]?.length ?? 0} 条回应
                  </button>
                </div>
                {expandedPost === p.id && (
                  <div className="cm-box">
                    {comments[p.id]?.length > 0 && (
                      <div style={{marginBottom:"12px"}}>
                        {comments[p.id].map(c => (
                          <div key={c.id} className="cm-item">
                            <span className="cm-author">{c.username || "渡口居民"}</span>
                            <p className="cm-text">{c.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{display:"flex",gap:"8px"}}>
                      <input className="input" style={{flex:1,fontSize:".85rem",padding:"10px 14px"}} placeholder="写一句回应…" value={commentInputs[p.id]||""} onChange={e=>setCommentInputs(prev=>({...prev,[p.id]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleComment(p.id)}}} />
                      <button onClick={()=>handleComment(p.id)} className="btn btn--primary btn--sm" style={{flexShrink:0}}>发送</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    
        <div style={{position:"fixed",bottom:"24px",right:"24px",zIndex:999,display:"flex",alignItems:"center",gap:"8px",background:"rgba(26,26,46,.85)",backdropFilter:"blur(12px)",padding:"10px 18px",borderRadius:"40px",border:"1px solid rgba(240,194,127,.12)",boxShadow:"0 4px 20px rgba(0,0,0,.2)",cursor:"pointer",transition:"all .3s ease"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 8px 30px rgba(0,0,0,.3)"}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.2)"}}>
          <span className="online-dot" style={{width:"10px",height:"10px"}} />
          <span style={{fontSize:".82rem",color:"rgba(250,246,240,.6)"}}>在线 <strong style={{color:"var(--warm-glow)",fontWeight:700}}>{onlineCount}</strong> 人</span>
        </div>
    
        {lightboxImg && (
          <div className="modal-overlay" onClick={()=>setLightboxImg(null)} style={{zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.7)"}}>
            <div style={{position:"relative",maxWidth:"90vw",maxHeight:"90vh",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.stopPropagation()}>
              <img src={lightboxImg} alt="" style={{maxWidth:"90vw",maxHeight:"85vh",borderRadius:"16px",boxShadow:"0 8px 40px rgba(0,0,0,.3)",objectFit:"contain"}} />
              <button onClick={()=>setLightboxImg(null)} style={{position:"absolute",top:"-44px",right:"-44px",background:"rgba(0,0,0,.5)",border:"none",color:"#fff",fontSize:"1.5rem",width:"36px",height:"36px",borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
            </div>
          </div>
        )}
</div>
  );
}



