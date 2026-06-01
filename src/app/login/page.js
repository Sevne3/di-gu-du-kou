"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, register } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaA, setCaptchaA] = useState(0);
  const [captchaB, setCaptchaB] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  
    useEffect(() => { generateCaptcha(); }, [isSignUp]);

  const generateCaptcha = () => {
    setCaptchaA(Math.floor(Math.random() * 9) + 1);
    setCaptchaB(Math.floor(Math.random() * 9) + 1);
    setCaptchaAnswer("");
    setCaptchaError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      const sum = parseInt(captchaAnswer);
      if (isNaN(sum) || sum !== captchaA + captchaB) {
        setCaptchaError("验证码错误，请重新输入");
        generateCaptcha();
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    setError("");
    try {
      const fn = isSignUp ? register : login;
      const data = await fn(email, password);
      localStorage.setItem("token", data.token);
      if (isSignUp) {
        alert("🎉 注册成功！\n\n一封验证邮件已发送到你的邮箱。\n请查收并点击链接完成验证。");
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight:"100vh",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      background:"linear-gradient(160deg,#16213e,#1a1a2e 30%,#2d2d44 60%,#1a1a2e)",
      padding:"40px 24px",
      position:"relative",
      overflow:"hidden"
    }}>
      {/* Floating particles */}
      <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        {[[15,25,6,0],[35,60,4,2],[55,20,5,4],[75,55,3,1],[85,35,5,3]].map(([l,t,w,d],i) => (
          <div key={i} style={{
            position:"absolute",left:l+"%",top:t+"%",width:w+"px",height:w+"px",
            borderRadius:"50%",background:"rgba(240,194,127,.12)",
            animation:"floatUp 8s ease-in-out infinite",
            animationDelay:d+"s"
          }} />
        ))}
      </div>

      <div style={{
        width:"100%",maxWidth:"420px",
        background:"rgba(255,255,255,.06)",
        border:"1px solid rgba(255,255,255,.08)",
        borderRadius:"24px",padding:"48px 36px",
        backdropFilter:"blur(20px)",
        position:"relative",zIndex:2
      }}>
        {/* Brand */}
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <Link href="/" style={{fontSize:"1.5rem",fontWeight:700,color:"#faf6f0",letterSpacing:"1px",textDecoration:"none"}}>
            低谷渡口
          </Link>
          <p style={{color:"rgba(240,194,127,.6)",fontSize:".85rem",marginTop:"6px",letterSpacing:"2px"}}>
            你不是一个人
          </p>
          <div style={{
            width:"40px",height:"2px",
            background:"linear-gradient(90deg,transparent,var(--warm-glow),transparent)",
            margin:"16px auto 0"
          }} />
        </div>

        {error && (
          <div style={{
            padding:"12px 16px",borderRadius:"12px",
            background:"rgba(231,76,60,.1)",border:"1px solid rgba(231,76,60,.2)",
            color:"#e74c3c",fontSize:".85rem",textAlign:"center",marginBottom:"16px"
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <div>
            <label style={{color:"rgba(250,246,240,.4)",fontSize:".78rem",display:"block",marginBottom:"4px"}}>
              {isSignUp ? "创建账号" : "登录账号"}
            </label>
            <input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              required
              style={{
                width:"100%",padding:"14px 18px",borderRadius:"12px",
                border:"1.5px solid rgba(255,255,255,.1)",
                background:"rgba(255,255,255,.06)",
                color:"#faf6f0",fontSize:".93rem",fontFamily:"inherit",
                outline:"none",transition:"all .3s",boxSizing:"border-box"
              }}
              onFocus={function(e){e.target.style.borderColor="rgba(240,194,127,.4)";e.target.style.background="rgba(255,255,255,.1)"}}
              onBlur={function(e){e.target.style.borderColor="rgba(255,255,255,.1)";e.target.style.background="rgba(255,255,255,.06)"}}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="密码（至少6位）"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              required minLength={6}
              style={{
                width:"100%",padding:"14px 18px",borderRadius:"12px",
                border:"1.5px solid rgba(255,255,255,.1)",
                background:"rgba(255,255,255,.06)",
                color:"#faf6f0",fontSize:".93rem",fontFamily:"inherit",
                outline:"none",transition:"all .3s",boxSizing:"border-box"
              }}
              onFocus={function(e){e.target.style.borderColor="rgba(240,194,127,.4)";e.target.style.background="rgba(255,255,255,.1)"}}
              onBlur={function(e){e.target.style.borderColor="rgba(255,255,255,.1)";e.target.style.background="rgba(255,255,255,.06)"}}
            />
          </div>
{isSignUp && (
            <div>
              <label style={{color:"rgba(250,246,240,.4)",fontSize:".78rem",display:"block",marginBottom:"4px"}}>
                验证码：{captchaA} + {captchaB} = ?
              </label>
              <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                <input
                  type="number"
                  placeholder="输入答案"
                  value={captchaAnswer}
                  onChange={e=>{setCaptchaAnswer(e.target.value);setCaptchaError("")}}
                  style={{
                    flex:1,padding:"14px 18px",borderRadius:"12px",
                    border:"1.5px solid rgba(255,255,255,.1)",
                    background:"rgba(255,255,255,.06)",color:"#faf6f0",
                    fontSize:".93rem",fontFamily:"inherit",outline:"none",boxSizing:"border-box"
                  }}
                />
                <button type="button" onClick={generateCaptcha}
                  style={{padding:"10px 14px",borderRadius:"12px",border:"1px solid rgba(255,255,255,.1)",
                    background:"rgba(255,255,255,.06)",color:"rgba(250,246,240,.5)",cursor:"pointer",fontSize:"1.1rem"}}
                >🔄</button>
              </div>
              {captchaError && <p style={{color:"#e74c3c",fontSize:".78rem",marginTop:"4px"}}>{captchaError}</p>}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width:"100%",padding:"14px",borderRadius:"40px",border:"none",
              background:"linear-gradient(135deg,#f0c27f,#dba76a)",
              color:"#1a1a2e",fontSize:"1rem",fontWeight:600,cursor:"pointer",
              fontFamily:"inherit",transition:"all .3s",marginTop:"4px",
              opacity:loading?0.7:1,
              boxShadow:"0 4px 20px rgba(240,194,127,.2)"
            }}
            onMouseEnter={e=>{e.target.style.transform="translateY(-2px)";e.target.style.boxShadow="0 8px 30px rgba(240,194,127,.35)"}}
            onMouseLeave={e=>{e.target.style.transform="";e.target.style.boxShadow="0 4px 20px rgba(240,194,127,.2)"}}
          >
            {loading ? "请稍候..." : (isSignUp ? "🌿 创建账号，加入社群" : "🌿 进入低谷渡口")}
          </button>
        </form>

        <div style={{textAlign:"center",marginTop:"24px"}}>
          <button
            onClick={()=>{setIsSignUp(!isSignUp);setError("")}}
            style={{
              background:"none",border:"none",
              color:"rgba(240,194,127,.5)",fontSize:".85rem",
              cursor:"pointer",fontFamily:"inherit",
              transition:"color .3s"
            }}
            onMouseEnter={e=>e.target.style.color="rgba(240,194,127,.8)"}
            onMouseLeave={e=>e.target.style.color="rgba(240,194,127,.5)"}
          >
            {isSignUp ? "已有账号？去登录 →" : "没有账号？去注册 →"}
          </button>
        </div>

        <div style={{textAlign:"center",marginTop:"12px"}}>
          <Link href="/" style={{color:"rgba(255,255,255,.15)",fontSize:".78rem",textDecoration:"none"}}>
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
