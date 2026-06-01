"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    if (!token || !email) {
      setStatus("error");
      setMessage("无效的验证链接");
      return;
    }
    fetch("/api/auth/verify?token=" + encodeURIComponent(token) + "&email=" + encodeURIComponent(email))
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStatus("error"); setMessage(data.error); }
        else { setStatus("success"); setMessage(data.message); }
      })
      .catch(() => { setStatus("error"); setMessage("验证请求失败"); });
  }, [searchParams]);

  return (
    <>
      {status === "loading" && (
        <>
          <div style={{fontSize:"3rem",marginBottom:"16px"}}>⏳</div>
          <p style={{color:"rgba(250,246,240,.6)",fontSize:"1rem"}}>正在验证你的邮箱...</p>
        </>
      )}
      {status === "success" && (
        <>
          <div style={{fontSize:"3rem",marginBottom:"16px"}}>✅</div>
          <h1 style={{fontSize:"1.3rem",fontWeight:700,color:"#faf6f0",marginBottom:"12px"}}>邮箱验证成功！</h1>
          <p style={{color:"rgba(250,246,240,.6)",fontSize:".93rem",lineHeight:"1.8",marginBottom:"24px"}}>
            你的账号已通过验证。<br/>现在可以正常使用低谷渡口的所有功能了。
          </p>
          <a href="/login" style={{
            display:"inline-block",padding:"14px 36px",
            background:"linear-gradient(135deg,#f0c27f,#dba76a)",
            color:"#1a1a2e",borderRadius:"40px",fontWeight:600,
            textDecoration:"none",fontSize:".95rem"
          }}>🌿 进入低谷渡口</a>
        </>
      )}
      {status === "error" && (
        <>
          <div style={{fontSize:"3rem",marginBottom:"16px"}}>😔</div>
          <h1 style={{fontSize:"1.3rem",fontWeight:700,color:"#faf6f0",marginBottom:"12px"}}>{message}</h1>
          <p style={{color:"rgba(250,246,240,.5)",fontSize:".85rem",marginBottom:"24px"}}>
            链接可能已过期，请尝试重新发送验证邮件。
          </p>
          <Link href="/login" style={{
            color:"rgba(240,194,127,.7)",fontSize:".9rem",textDecoration:"none"
          }}>← 返回登录</Link>
        </>
      )}
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <div style={{
      minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:"linear-gradient(160deg,#16213e,#1a1a2e 30%,#2d2d44 60%,#1a1a2e)",
      padding:"40px 24px"
    }}>
      <div style={{
        maxWidth:"420px",width:"100%",textAlign:"center",
        background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)",
        borderRadius:"24px",padding:"48px 36px",backdropFilter:"blur(20px)"
      }}>
        <Suspense fallback={<div><div style={{fontSize:"3rem",marginBottom:"16px"}}>⏳</div><p style={{color:"rgba(250,246,240,.6)"}}>正在验证...</p></div>}>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
