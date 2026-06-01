"use client";
import React, { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { createPortal } from "react-dom";
import useDraggable from "@/components/useDraggable";

var CHAT_STORAGE_KEY = "dgdk_chat_state";

function loadSavedState() {
  try {
    var raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return {};
}

function saveState(s) {
  try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(s)); } catch(e) {}
}

export default function FloatingChat(props) {
  var {
    partner: chatPartner,
    messages: chatMessages,
    input: chatInput,
    onSetInput: setChatInput,
    onSend: handleSendMessage,
    onClose: handleClose,
    sending: sending,
    user: user,
    onOpenChat: openChat,
    chatBoxRef: chatBoxRef
  } = props;

  var saved = loadSavedState();
  var [isMinimized, setIsMinimized] = useState(saved.minimized || false);
  var [isVisible, setIsVisible] = useState(!!chatPartner);
  var [mounted, setMounted] = useState(false);
  var [isMobile, setIsMobile] = useState(false);

  useEffect(function() { setMounted(true); }, []);
  useEffect(function() {
    setIsMobile(window.innerWidth < 768);
    function handler() { setIsMobile(window.innerWidth < 768); }
    window.addEventListener("resize", handler);
    return function() { window.removeEventListener("resize", handler); };
  }, []);

  useEffect(function() {
    setIsVisible(!!chatPartner);
  }, [chatPartner]);

  var chatBodyRef = useRef(null);
  var dragHooks = useDraggable({
    initialX: saved.x,
    initialY: saved.y,
    onDragEnd: function(x, y) {
      saveState({ x: x, y: y, minimized: isMinimized });
    }
  });

  var scrollToBottom = useCallback(function() {
    setTimeout(function() {
      if (chatBodyRef.current) {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  useEffect(function() {
    scrollToBottom();
  }, [chatMessages]);

  var handleToggleMin = useCallback(function() {
    setIsMinimized(function(p) {
      var n = !p;
      saveState({ x: saved.x, y: saved.y, minimized: n });
      if (!n) scrollToBottom();
      return n;
    });
  }, []);

  var handleToggleVis = useCallback(function() {
    setIsVisible(function(p) { return !p; });
  }, []);

  if (!mounted) return null;

  // Mobile: bottom sheet
  if (isMobile && isVisible && chatPartner) {
    return createPortal(
      <div style={{ position:"fixed", bottom:0, left:0, right:0, height:"70vh", zIndex:1000, display:"flex", flexDirection:"column", background:"rgba(15,23,42,.92)", backdropFilter:"blur(12px)", borderTopLeftRadius:"16px", borderTopRightRadius:"16px", border:"1px solid rgba(255,255,255,.08)", boxShadow:"0 -4px 24px rgba(0,0,0,.3)" }}>
        <MobileChatHeader partner={chatPartner} onClose={handleClose} />
        <ChatBody ref={chatBodyRef} messages={chatMessages} user={user} />
        <ChatInput input={chatInput} onSetInput={setChatInput} onSend={handleSendMessage} sending={sending} />
      </div>,
      document.body
    );
  }

  // Desktop: floating draggable window
  return createPortal(
    <>
      {/* Floating chat window */}
      {isVisible && chatPartner && (
        <div ref={dragHooks.setEl} style={{ position:"fixed", top:0, left:0, width:"380px", minWidth:"320px", height: isMinimized ? "48px" : "520px", minHeight: isMinimized ? "48px" : "400px", zIndex:1000, display:"flex", flexDirection:"column", background:"rgba(15,23,42,.88)", backdropFilter:"blur(12px)", borderRadius:"16px", border:"1px solid rgba(255,255,255,.08)", boxShadow:"0 8px 32px rgba(0,0,0,.4)", transition:"height 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s", overflow:"hidden", willChange:"transform" }}>
          {/* Title bar - drag handle */}
          <div onMouseDown={dragHooks.handleMouseDown} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"0 16px", height:"48px", minHeight:"48px", cursor:"grab", borderBottom: isMinimized ? "none" : "1px solid rgba(255,255,255,.06)", userSelect:"none", WebkitUserSelect:"none" }}>
            <div style={{ width:"28px", height:"28px", borderRadius:"50%", overflow:"hidden", flexShrink:0, background:"linear-gradient(135deg,#f0c27f,#dba76a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".75rem" }}>
              {chatPartner.avatar && (chatPartner.avatar.indexOf("data:")===0||chatPartner.avatar.indexOf("http")===0) ? (
                <img src={chatPartner.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              ) : (
                <span>{chatPartner.avatar || "👤"}</span>
              )}
            </div>
            <span style={{ flex:1, fontSize:".85rem", fontWeight:500, color:"rgba(250,246,240,.9)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{chatPartner.username || "渡口居民"}</span>
            <button onClick={handleToggleMin} style={{ background:"none", border:"none", color:"rgba(250,246,240,.4)", fontSize:"1rem", cursor:"pointer", padding:"4px", lineHeight:1, fontFamily:"inherit" }}>{isMinimized ? "□" : "—"}</button>
            <button onClick={handleClose} style={{ background:"none", border:"none", color:"rgba(250,246,240,.4)", fontSize:"1rem", cursor:"pointer", padding:"4px", lineHeight:1, fontFamily:"inherit" }}>✕</button>
          </div>
          {!isMinimized && (
            <>
              <ChatBody ref={chatBodyRef} messages={chatMessages} user={user} />
              <ChatInput input={chatInput} onSetInput={setChatInput} onSend={handleSendMessage} sending={sending} />
            </>
          )}
        </div>
      )}
    </>,
    document.body
  );
}

var ChatBody = forwardRef(function(props, ref) {
  var { messages, user } = props;
  return (
    <div ref={ref} style={{ flex:1, overflowY:"auto", padding:"12px 16px", scrollBehavior:"smooth" }}>
      {messages.length === 0 ? (
        <p style={{ textAlign:"center", color:"rgba(250,246,240,.3)", padding:"40px 0", fontSize:".85rem", margin:0 }}>还没有消息，打个招呼吧 🌿</p>
      ) : (
        messages.map(function(m) {
          var isMe = m.fromUserId === (user ? user.id : null);
          return (
            <div key={m.id} style={{ display:"flex", flexDirection:"column", alignItems:isMe ? "flex-end" : "flex-start", marginBottom:"10px" }}>
              <div style={{ maxWidth:"85%", padding:"10px 14px", borderRadius:isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background:isMe ? "rgba(240,194,127,.2)" : "rgba(255,255,255,.06)", color:"rgba(250,246,240,.9)", fontSize:".85rem", lineHeight:"1.6", wordBreak:"break-word" }}>
                <p style={{ margin:0, color:"rgba(250,246,240,.9)" }}>{m.content}</p>
                <p style={{ fontSize:".6rem", opacity:.4, marginTop:"4px", textAlign:isMe ? "right" : "left", marginBottom:0, color:"rgba(250,246,240,.5)" }}>{(m.created_at || "").slice(11,16)}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
});

function MobileChatHeader(props) {
  var { partner, onClose } = props;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"12px 16px", minHeight:"48px", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
      <div style={{ width:"28px", height:"28px", borderRadius:"50%", overflow:"hidden", flexShrink:0, background:"linear-gradient(135deg,#f0c27f,#dba76a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".75rem" }}>
        {partner.avatar && (partner.avatar.indexOf("data:")===0||partner.avatar.indexOf("http")===0) ? (
          <img src={partner.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        ) : (
          <span>{partner.avatar || "👤"}</span>
        )}
      </div>
      <span style={{ flex:1, fontSize:".85rem", fontWeight:500, color:"rgba(250,246,240,.9)" }}>{partner.username || "渡口居民"}</span>
      <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(250,246,240,.4)", fontSize:"1.1rem", cursor:"pointer", padding:"4px", lineHeight:1, fontFamily:"inherit" }}>✕</button>
    </div>
  );
}

function ChatInput(props) {
  var { input, onSetInput, onSend, sending } = props;
  return (
    <div style={{ display:"flex", gap:"8px", padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,.06)" }}>
      <input style={{ flex:1, fontSize:".85rem", padding:"10px 14px", color:"rgba(250,246,240,.9)", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", borderRadius:"10px", fontFamily:"inherit", outline:"none" }} placeholder="输入消息..." value={input} onChange={function(e) { onSetInput(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }}} />
      <button onClick={onSend} disabled={sending || !input.trim()} style={{ flexShrink:0, padding:"10px 18px", fontSize:".85rem", borderRadius:"40px", background:sending || !input.trim() ? "rgba(255,255,255,.08)" : "rgba(240,194,127,.2)", border:"1px solid rgba(240,194,127,.15)", color:sending || !input.trim() ? "rgba(250,246,240,.3)" : "rgba(240,194,127,.9)", cursor:sending || !input.trim() ? "default" : "pointer", fontFamily:"inherit", fontWeight:500 }}>{sending ? "发送中..." : "发送"}</button>
    </div>
  );
}
