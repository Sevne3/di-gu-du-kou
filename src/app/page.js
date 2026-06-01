"use client";
import { useEffect, useState, useRef } from "react";
import { getMe } from "@/lib/api";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    getMe().then((data) => setUser(data.user)).catch(() => {});
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.08 });
    document.querySelectorAll(".anim, .anim-scale").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Canvas dust particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const pts = Array.from({length: 30}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.2 - 0.05,
      r: Math.random() * 3 + 1.5,
      o: Math.random() * 0.3 + 0.08,
      phase: Math.random() * Math.PI * 2
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx + Math.sin(Date.now() * 0.001 + p.phase) * 0.15;
        p.y += p.vy;
        p.o = Math.max(0.04, p.o - 0.0003);
        if (p.y < -10 || p.o < 0.04) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
          p.o = Math.random() * 0.25 + 0.1;
          p.vy = -(Math.random() * 0.15 + 0.03);
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(240,194,127," + p.o + ")";
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    const contact = e.target.contact.value.trim();
    if (!contact) { alert("留个联系方式吧"); return; }
    alert(`🌿 谢谢你愿意来到这里。

你的信息我已经收到了。
app正式上线后，我会第一个联系你。

在这之前——
请好好照顾自己。
你不是一个人。`);
    e.target.reset();
  };

  const canvasRef = useRef(null);
  const aboutCards = [
    { icon:"🌊", title:"一个渡口", desc:"不是你永远待的地方。是你路过、休息、被托住，然后继续往前走的地方。" },
    { icon:"👥", title:"一个社群", desc:"不是求职平台，不是课程商城。是一群真实的人，互相说一句「我也是」的地方。" },
    { icon:"🕯️", title:"一盏灯", desc:"在黑的时候，有人为你亮着。等你亮了，也可以为下一个人亮着。" }
  ];
  const whoItems = [
    { emoji:"💳", title:"负债的人", desc:"不是「不会理财」，只是暂时被困住了。这里没人会评判你的账单。" },
    { emoji:"💼", title:"失业的人", desc:"不是「不够努力」，只是风口没吹到你。这里不需要伪装「我很好」。" },
    { emoji:"🏡", title:"在家庭关系里感到疲惫的人", desc:"不是「不孝顺」，只是真的累了。这里有人懂那种「家不是退路」的感受。" },
    { emoji:"🧭", title:"暂时迷茫的人", desc:"不知道下一步往哪走，不知道自己能做什么。没关系，这里不需要你立刻有答案。" }
  ];
      const features = [
    { icon:"⚓", title:"航海日志", desc:"每天一个温柔的提问，看见自己每天都有在走。", color:"#f0c6d6" },
    { icon:"🌙", title:"深夜陪伴", desc:"凌晨三点睡不着的时候——有人在。你不必一个人熬过那些夜晚。", color:"#a8b8d4" },
    { icon:"🤝", title:"互帮互助", desc:"分享一个信息、教一个技能，或者只是听一个人说完他的故事。", color:"#a8d5ba" },
    { icon:"🛡️", title:"没有噪音", desc:"没有广告和炫富帖。累了就安静待着，这里没有社交压力。", color:"#c8d2c0" },
    { icon:"🌳", title:"树洞匿名倾诉", desc:"那些说不出口的话，说给树洞听。有些情绪，说出来就好了一半。", color:"#d4c5a8" },
    { icon:"💡", title:"技能集市", desc:"用你的擅长换别人的擅长，各取所需，互相成长。", color:"#a8d5ba" },
    { icon:"👫", title:"找搭子配对", desc:"配对一位和你同频的搭子，彼此陪伴，互相鼓励。", color:"#f0c6d6" },
    { icon:"⏳", title:"时光胶囊", desc:"写一封信给未来的自己。和未来的自己对话。", color:"#a8b8d4" },
    { icon:"🔥", title:"温暖值系统", desc:"帮别人一次、坚持航海日志——积累温暖值，让温暖被看见。", color:"#f0c27f" }
  ];

  return (
    <>
      <header className="hero">
        <div className="hero__bg">
          <canvas ref={canvasRef} className="dust-canvas" />
        </div>
        <nav className={"h-nav"+(scrolled?" scrolled":"")}>
          <div className="h-nav-in">
            <span className="hl">低谷渡口</span>
            <div className="h-links">
              {user ? <a href="/dashboard" className="h-cta">进入社群</a>
              : <><a href="/login">登船口</a><a href="/login" className="h-cta">加入社群</a></>}
            </div>
          </div>
        </nav>
        <div className="hb">
          <div className="container">
            <div className="ht">
              <div className="h-badge">一个安静的陪伴社群</div>
              <h1 className="h1">低谷渡口<span className="hs">你不是一个人</span></h1>
              <p className="hp">这里没有「你应该振作起来」，没有贩卖焦虑。<br />只有一群懂你的人。</p>
              <div className="ha">
                <a href="#about" className="btn btn--primary">了解我们</a>
                {user ? null : <a href="/login" className="btn btn--ghost">登船口</a>}
                {user ? <a href="/dashboard" className="btn btn--ghost">进入社群 →</a> : <a href="#join" className="btn btn--ghost">加入等候 →</a>}
              </div>
            </div>
          </div>
        </div>
        <div className="hw"><svg viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none"><path d="M0 40Q360 90 720 40T1440 40V100H0V40Z" fill="#faf6f0"/></svg></div>
      </header>

      {/* 低谷渡口是什么 */}
      <section className="sec anim" id="about">
        <div className="container">
          <h2 className="st">低谷渡口是什么</h2>
          <div className="ag">
            {aboutCards.map((c,i) => (
              <div key={i} className="ac anim">
                <span className="ai">{c.icon}</span>
                <h3 className="ac-title">{c.title}</h3>
                <p className="ac-desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 这里适合 */}
      <section className="sec sec--cream anim">
        <div className="container">
          <h2 className="st">这里适合</h2>
          <div className="wl">
            {whoItems.map((item,i) => (
              <div key={i} className="wi anim">
                <span className="we">{item.emoji}</span>
                <div><strong className="wi-title">{item.title}</strong><p className="wi-desc">{item.desc}</p></div>
              </div>
            ))}
          </div>
          <div className="wn">
            <p className="wn-text">如果你不在这些标签里，但也需要一个安静的地方——<br /><strong className="wn-highlight">也欢迎你。这里没有门槛。</strong></p>
          </div>
        </div>
      </section>

      {/* 这里有什么 */}
      <section className="sec anim" id="features">
        <div className="container">
          <h2 className="st">这里有什么</h2>
          <p className="ss">没有复杂的系统，只有几个温暖的小工具</p>
          <div className="fl">
            {features.map((f,i) => (
              <div key={i} className="ft anim" style={{borderLeft:"4px solid "+f.color}}>
                <div className="fi" style={{background:f.color+"22"}}>{f.icon}</div>
                <h3 className="ft-title">{f.title}</h3>
                <p className="ft-desc">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="cv anim-scale">
            <blockquote>
              「这里是低谷渡口。<br />你可以停下来休息，没有人会催你走。<br />等你准备好了——<br />回头看看，我们还在你身后。」
            </blockquote>
            <cite>— 低谷渡口 · 社群公约</cite>
          </div>
        </div>
      </section>

      {/* 加入等候 */}
      <section className="sec sec--join anim" id="join">
        <div className="container">
          <div className="jc">
            <h2 className="jt">加入等候</h2>
            <p className="jd">app开发中，预计首批开放 <strong>200 个名额</strong>。<br />留个联系方式，上线后第一个告诉你。</p>
            <form className="jf" onSubmit={handleJoin}>
              <input name="name" placeholder="怎么称呼你（选填）" className="ji" />
              <input name="contact" placeholder="微信 / 邮箱（以便我们找到你）" className="ji" required />
              <button type="submit" className="btn btn--primary btn--block">🌿 带我一起</button>
            </form>
            <p className="jn">你的信息仅用于上线通知，不会对外公开。</p>
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="bn">
        <div className="container"><p className="bnt">低谷渡口</p><p className="bns">你不是一个人</p></div>
      </section>

      <footer className="ftr">
        <div className="container fti">
          <div><span className="ftb">低谷渡口</span><p className="ftt">一个安静的陪伴社群</p></div>
          <p className="ftc">每个人都在渡自己的河，但我们可以一起渡一段。</p>
        </div>
      </footer>
    </>
  );
}

