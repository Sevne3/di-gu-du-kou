"use client";
import { useState, useEffect, useCallback } from "react";

export default function ThemeToggleBtn() {
  var [theme, setThemeState] = useState("night");
  var [spinning, setSpinning] = useState(false);
  var [mounted, setMounted] = useState(false);

  useEffect(function() {
    setMounted(true);
    var el = document.documentElement;
    var current = el.getAttribute("data-theme") || "night";
    setThemeState(current);
    var observer = new MutationObserver(function() {
      var t = el.getAttribute("data-theme") || "night";
      setThemeState(t);
    });
    observer.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return function() { observer.disconnect(); };
  }, []);

  var handleClick = useCallback(function() {
    setSpinning(true);
    setTimeout(function() { setSpinning(false); }, 300);
    if (typeof window.__toggleTheme === "function") {
      window.__toggleTheme();
    }
  }, []);

  if (!mounted) return null;

  var isNight = theme === "night";
  var icon = isNight ? "☀️" : "🌙";
  var bg = isNight ? "rgba(250,246,240,.08)" : "rgba(26,26,46,.6)";
  var borderColor = isNight ? "rgba(250,246,240,.12)" : "rgba(240,194,127,.2)";
  var rotate = spinning ? "rotate(360deg)" : "rotate(0deg)";
  var label = isNight ? "切换到日间模式" : "切换到夜间模式";

  return (
    <button
      id="theme-toggle-btn"
      onClick={handleClick}
      aria-label={label}
      role="button"
      title={label}
      style={{
        position:"fixed", bottom:"24px", left:"24px", zIndex:9999,
        width:"44px", height:"44px", borderRadius:"50%",
        border:"1px solid " + borderColor,
        background: bg,
        backdropFilter:"blur(12px)",
        color:"#faf6f0", fontSize:"1.2rem",
        cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 4px 16px rgba(0,0,0,.25)",
        fontFamily:"inherit", lineHeight:1, padding:0,
        transition:"all .35s cubic-bezier(.25,.46,.45,.94), transform .25s ease",
        transform: rotate
      }}
      onMouseEnter={function(e){
        e.currentTarget.style.transform="scale(1.15) " + rotate;
        e.currentTarget.style.boxShadow="0 6px 24px rgba(0,0,0,.35)";
      }}
      onMouseLeave={function(e){
        e.currentTarget.style.transform=rotate;
        e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.25)";
      }}
    >{icon}</button>
  );
}
