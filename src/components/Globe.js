"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

export default function Globe({ users = [], size = 300, onPair, pairedIds = [] }) {
  var canvasRef = useRef(null);
  var angleRef = useRef(0);
  var dragRef = useRef({ isDragging: false, startX: 0, rotX: 0 });
  var manualRef = useRef(null);
  var velocityRef = useRef(0);
  var lastTimeRef = useRef(Date.now());
  var zoomRef = useRef(1);
  var dotsRef = useRef([]); // screen positions updated each frame
  var dotDataRef = useRef([]); // user + projected position data
  var hoveredRef = useRef(null);
  var animIdRef = useRef(null);
  var angularRef = useRef(0.002);
  var tooltipRef = useRef(null);

  var [hoveredUser, setHoveredUser] = useState(null);
  var [selectedUser, setSelectedUser] = useState(null);
  var [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  var [rippleAnim, setRippleAnim] = useState(null);
  var [mounted, setMounted] = useState(false);

  useEffect(function() { setMounted(true); }, []);

  // Listen for ESC to close card
  useEffect(function() {
    function handler(e) { if (e.key === "Escape") setSelectedUser(null); }
    window.addEventListener("keydown", handler);
    return function() { window.removeEventListener("keydown", handler); };
  }, []);

  useEffect(function() {
    var canvas = canvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    var isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    function resize() {
      var w = size * dpr, h = size * dpr;
      canvas.width = w;
      canvas.height = h;
      ctx.scale(dpr, dpr);
    }
    resize();

    var cx = size / 2, cy = size / 2, radius = size * 0.38;

    // Stars
    var stars = [];
    for (var si = 0; si < 50; si++) {
      stars.push({ x: Math.random() * size, y: Math.random() * size, r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.4 + 0.2, speed: Math.random() * 0.005 + 0.002 });
    }

    var pairedSet = new Set(pairedIds || []);

    function getAngle() {
      return manualRef.current !== null ? manualRef.current : angleRef.current;
    }

    function render() {
      var zoom = zoomRef.current;
      var angle = getAngle();
      var now = Date.now() / 1000;
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(zoom, zoom);
      ctx.translate(-cx, -cy);

      // Stars
      for (var sii = 0; sii < stars.length; sii++) {
        var s = stars[sii];
        var twinkle = 0.5 + 0.5 * Math.sin(now * s.speed * 3 + s.x);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(250,246,240," + (s.a * twinkle) + ")";
        ctx.fill();
      }

      // Outer glow
      var gg = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.4);
      gg.addColorStop(0, "rgba(240,194,127,.08)");
      gg.addColorStop(0.5, "rgba(240,194,127,.03)");
      gg.addColorStop(1, "rgba(240,194,127,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = gg;
      ctx.fill();

      // Ocean
      var og = ctx.createRadialGradient(cx - radius*0.2, cy - radius*0.3, radius*0.1, cx, cy, radius);
      og.addColorStop(0, "#2d3a5e");
      og.addColorStop(0.5, "#253257");
      og.addColorStop(1, "#16213e");
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = og;
      ctx.fill();

      // Grid lines (longitude)
      ctx.strokeStyle = "rgba(240,194,127,.08)";
      ctx.lineWidth = 0.5;
      for (var li = 0; li < 12; li++) {
        var lon = (li / 12) * Math.PI * 2 + angle;
        ctx.beginPath();
        var started = false;
        for (var lj = 0; lj <= 30; lj++) {
          var lat = (lj / 30 - 0.5) * Math.PI;
          var lx = cx + radius * Math.cos(lat) * Math.sin(lon);
          var ly = cy + radius * Math.sin(lat);
          var lz = radius * Math.cos(lat) * Math.cos(lon);
          if (lz > 0) { if (started) ctx.lineTo(lx, ly); else ctx.moveTo(lx, ly); started = true; }
          else started = false;
        }
        ctx.stroke();
      }

      // Continents
      var continents = [
        { cx2: -0.1, cy2: 0.1, rx: 0.25, ry: 0.35 },
        { cx2: -0.3, cy2: -0.15, rx: 0.2, ry: 0.18 },
        { cx2: 0.35, cy2: -0.1, rx: 0.28, ry: 0.22 },
        { cx2: 0.15, cy2: 0.35, rx: 0.12, ry: 0.1 }
      ];
      for (var ci = 0; ci < continents.length; ci++) {
        var cont = continents[ci];
        ctx.beginPath();
        var started2 = false;
        for (var cj = 0; cj <= 24; cj++) {
          var ca = (cj / 24) * Math.PI * 2;
          var rLat = cont.cy2 + Math.cos(ca) * cont.ry * 0.15;
          var rLon = cont.cx2 + Math.sin(ca) * cont.rx * 0.15;
          var clx = cx + radius * Math.cos(rLat) * Math.sin(rLon + angle);
          var cly = cy + radius * Math.sin(rLat);
          var clz = radius * Math.cos(rLat) * Math.cos(rLon + angle);
          if (clz > 0) { if (started2) ctx.lineTo(clx, cly); else ctx.moveTo(clx, cly); started2 = true; }
          else started2 = false;
        }
        ctx.fillStyle = "rgba(106,176,76,.05)";
        ctx.fill();
      }

      // Current ripple
      var ripple = rippleAnim;
      if (ripple) {
        var progress = (Date.now() - ripple.time) / 1000;
        if (progress < 1) {
          var r = ripple.startR + progress * 20;
          var a = 1 - progress;
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,215,0," + a + ")";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, r * 0.6, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,215,0," + (a * 0.5) + ")";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Project user dots and store positions
      var projectedDots = [];
      var matchedArr = [];
      for (var ui = 0; ui < users.length; ui++) {
        var u = users[ui];
        var lat2 = ((ui * 97 + (u.id ? u.id.charCodeAt(0) : 0) || ui * 73) % 180 - 90) * Math.PI / 180;
        var lng2 = ((ui * 53 + (u.id ? u.id.charCodeAt(1) : 0) || ui * 47) % 360) * Math.PI / 180;
        var dx2 = cx + radius * Math.cos(lat2) * Math.sin(lng2 + angle);
        var dy2 = cy + radius * Math.sin(lat2);
        var dz2 = radius * Math.cos(lat2) * Math.cos(lng2 + angle);
        var visible = dz2 > 0;
        var screenX = cx + (dx2 - cx) * zoom;
        var screenY = cy + (dy2 - cy) * zoom;
        projectedDots.push({ sx: screenX, sy: screenY, z: dz2, visible: visible, user: u, idx: ui });
        var isPaired = pairedSet.has(u.id);
        matchedArr.push(isPaired);
      }
      dotDataRef.current = projectedDots;

      // Render dots
      var hoveredId = hoveredRef.current;
      var selectedId = null;
      // We need selectedUser from state, but can access via closure
      // Use a callback to get it

      for (var vi = 0; vi < projectedDots.length; vi++) {
        var pdot = projectedDots[vi];
        if (!pdot.visible) continue;
        var isPaired2 = pairedSet.has(pdot.user.id);
        var isHovered = hoveredId === pdot.user.id;
        var isSelected = selectedUser && selectedUser.id === pdot.user.id;
        var scale2 = 0.4 + (pdot.z / radius) * 0.6;
        var alpha2 = 0.3 + (pdot.z / radius) * 0.7;
        var pulse2 = 0.7 + 0.3 * Math.sin(now * 2 + (vi * 1.3));

        var baseR = isPaired2 ? 4 : 2.8;
        var dotR = isHovered || isSelected ? baseR * 1.5 : baseR;
        var dotColor = isPaired2 ? "#6ab04c" : (isHovered || isSelected ? "#FFD700" : null);

        // Glow ring
        var glowR = (5 * scale2 * pulse2) * (isHovered || isSelected ? 1.5 : 1);
        ctx.beginPath();
        ctx.arc(pdot.sx, pdot.sy, glowR, 0, Math.PI * 2);
        var glowColor = isPaired2 ? "rgba(106,176,76," : "rgba(240,194,127,";
        ctx.fillStyle = glowColor + (alpha2 * 0.1 * (isHovered || isSelected ? 2 : 1)) + ")";
        ctx.fill();

        // Main dot
        ctx.beginPath();
        ctx.arc(pdot.sx, pdot.sy, dotR * scale2 * pulse2, 0, Math.PI * 2);
        if (dotColor) {
          ctx.fillStyle = dotColor;
        } else {
          ctx.fillStyle = "rgba(240,194,127," + (alpha2 * pulse2) + ")";
        }
        ctx.fill();

        // Bright center
        ctx.beginPath();
        ctx.arc(pdot.sx, pdot.sy, (1.2 * scale2) * (isHovered || isSelected ? 1.5 : 1), 0, Math.PI * 2);
        var centerColor = isPaired2 ? "rgba(106,176,76," : "rgba(250,246,240,";
        ctx.fillStyle = centerColor + (alpha2 * 0.6 * pulse2) + ")";
        ctx.fill();
      }

      // Light reflection
      var rg = ctx.createRadialGradient(cx - radius*0.3, cy - radius*0.35, 5, cx - radius*0.3, cy - radius*0.35, radius*0.4);
      rg.addColorStop(0, "rgba(255,255,255,.04)");
      rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = rg;
      ctx.fill();

      ctx.restore();

      // Auto-rotate with smooth inertia
      var now2 = Date.now();
      var dt = Math.min((now2 - lastTimeRef.current) / 16, 3); // normalize to ~60fps
      lastTimeRef.current = now2;
      if (!dragRef.current.isDragging && manualRef.current === null) {
        if (Math.abs(velocityRef.current) > 0.0001) {
          // Decay velocity
          velocityRef.current *= 0.95;
          angleRef.current += velocityRef.current * dt;
        } else {
          angularRef.current = (angularRef.current || 0.002) * 0.999 + 0.002 * 0.001;
          angleRef.current += (angularRef.current || 0.002) * dt;
        }
      }

      animIdRef.current = requestAnimationFrame(render);
    }

    render();
    return function() { if (animIdRef.current) cancelAnimationFrame(animIdRef.current); };
  }, [users, size, rippleAnim]);

  function findDotAt(e) {
    var rect = canvasRef.current.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var dots = dotDataRef.current;
    if (!dots) return null;
    var closest = null;
    var minDist = 20; // hit radius
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      if (!d.visible) continue;
      var dist = Math.sqrt(Math.pow(mx - d.sx, 2) + Math.pow(my - d.sy, 2));
      if (dist < minDist) {
        minDist = dist;
        closest = d;
      }
    }
    return closest;
  }

  var handleMouseMove = useCallback(function(e) {
    if (dragRef.current.isDragging) {
      var rect = canvasRef.current.getBoundingClientRect();
      var prevManual = manualRef.current !== null ? manualRef.current : angleRef.current;
      var dx = e.clientX - rect.left - dragRef.current.startX;
      manualRef.current = dragRef.current.rotX + dx * 0.01;
      // Track velocity for inertia
      velocityRef.current = (manualRef.current - prevManual) * 0.3;
      // Clamp
      if (velocityRef.current > 0.03) velocityRef.current = 0.03;
      if (velocityRef.current < -0.03) velocityRef.current = -0.03;
      return;
    }
    var hit = findDotAt(e);
    var newId = hit ? hit.user.id : null;
    if (newId !== hoveredRef.current) {
      hoveredRef.current = newId;
      if (hit) {
        setHoveredUser(hit.user);
        var rect = canvasRef.current.getBoundingClientRect();
        setTooltipPos({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 10 });
      } else {
        setHoveredUser(null);
      }
    } else if (hit && tooltipPos) {
      // Update tooltip position
      var rect2 = canvasRef.current.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect2.left + 12, y: e.clientY - rect2.top - 10 });
    }
  }, []);

  var handleMouseDown = useCallback(function(e) {
    var hit = findDotAt(e);
    if (hit) {
      setSelectedUser(hit.user);
      return;
    }
    setSelectedUser(null);
    var rect = canvasRef.current.getBoundingClientRect();
    dragRef.current.isDragging = true;
    dragRef.current.startX = e.clientX - rect.left;
    dragRef.current.rotX = manualRef.current !== null ? manualRef.current : angleRef.current;
  }, []);

  var handleMouseUp = useCallback(function() {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;
    // Add momentum based on last drag velocity
    if (manualRef.current !== null) {
      var dragEnd = manualRef.current;
      var dragStart = dragRef.current.rotX;
      velocityRef.current = (dragEnd - dragStart) * 0.5;
    }
    if (manualRef.current !== null) {
      angleRef.current = manualRef.current;
      manualRef.current = null;
    }
    // Smooth inertia
    velocityRef.current = 0;
  }, []);

  var handleWheel = useCallback(function(e) {
    e.preventDefault();
    var z = zoomRef.current;
    z -= e.deltaY * 0.001;
    z = Math.max(0.8, Math.min(2, z));
    zoomRef.current = z;
  }, []);

  var handleDoubleClick = useCallback(function() {
    zoomRef.current = 1;
  }, []);

  function triggerPairRipple(userId) {
    var dots = dotDataRef.current;
    if (!dots) return;
    var dot = dots.find(function(d) { return d.user && d.user.id === userId; });
    if (dot) {
      setRippleAnim({ x: dot.sx, y: dot.sy, time: Date.now(), startR: 5 });
      setTimeout(function() { setRippleAnim(null); }, 1200);
      setSelectedUser(null);
    }
  }

  // Expose triggerPairRipple to parent
  useEffect(function() {
    if (canvasRef.current) {
      canvasRef.current.__triggerPairRipple = triggerPairRipple;
    }
  }, [users]);

  function getSignature(u) {
    return "正在寻找同频的旅人 🌊";
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"8px" }}>
      <div style={{ position:"relative", width: size, height: size }}>
        <canvas ref={canvasRef} style={{ width: size, height: size, borderRadius:"50%", cursor: dragRef.current.isDragging ? "grabbing" : "grab", touchAction:"none" }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel} onDoubleClick={handleDoubleClick} />

        <div style={{ position:"absolute", bottom:"4px", left:"50%", transform:"translateX(-50%)", fontSize:".68rem", color:"rgba(250,246,240,.3)", background:"rgba(0,0,0,.4)", padding:"2px 10px", borderRadius:"40px", backdropFilter:"blur(4px)", letterSpacing:"1px", whiteSpace:"nowrap", pointerEvents:"none" }}>
          ✦ {users.length} 位在线
        </div>

        {hoveredUser && (
          <div style={{ position:"absolute", left: tooltipPos.x + "px", top: tooltipPos.y + "px", background:"rgba(26,26,46,.9)", backdropFilter:"blur(8px)", padding:"5px 12px", borderRadius:"40px", border:"1px solid rgba(240,194,127,.15)", fontSize:".72rem", color:"rgba(250,246,240,.85)", whiteSpace:"nowrap", pointerEvents:"none", zIndex:10, transition:"opacity .3s" }}>
            @{hoveredUser.username || "渡口居民"} · 刚上线
          </div>
        )}
      </div>

      {mounted && selectedUser && createPortal(
        <div onClick={function() { setSelectedUser(null); }} style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(26,26,46,.3)" }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background:"var(--white,#fff)", borderRadius:"var(--radius,20px)", padding:"28px 24px 20px", maxWidth:"320px", width:"90%", textAlign:"center", boxShadow:"0 12px 48px rgba(0,0,0,.15)" }}>
            <div style={{ width:"56px", height:"56px", borderRadius:"50%", margin:"0 auto 12px", overflow:"hidden", background:"linear-gradient(135deg,#f0c27f,#dba76a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem" }}>
              {selectedUser.avatar && (selectedUser.avatar.indexOf("data:")===0||selectedUser.avatar.indexOf("http")===0) ? (
                <img src={selectedUser.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              ) : (
                <span>{selectedUser.avatar || "👤"}</span>
              )}
            </div>
            <h4 style={{ fontSize:"1rem", fontWeight:600, color:"var(--night,#1a1a2e)", margin:"0 0 4px 0" }}>{selectedUser.username || "渡口居民"}</h4>
            <p style={{ fontSize:".82rem", color:"var(--text-light,#8a7a6e)", margin:"0 0 8px 0" }}>{getSignature(selectedUser)}</p>
            <span style={{ display:"inline-block", fontSize:".7rem", padding:"2px 10px", borderRadius:"40px", background:"rgba(240,194,127,.15)", color:"var(--warm-glow,#f0c27f)", marginBottom:"16px" }}>🌊 同在渡口</span>
            <div style={{ display:"flex", gap:"10px", justifyContent:"center" }}>
              <button onClick={function() { if (onPair) onPair(selectedUser.id); }} className="btn btn--warm btn--sm" style={{ fontSize:".85rem", padding:"8px 20px", borderRadius:"40px", background:"var(--warm-glow,#f0c27f)", border:"none", cursor:"pointer", color:"var(--night,#1a1a2e)", fontFamily:"inherit", fontWeight:500 }}>💌 发起配对</button>
              <button onClick={function() { setSelectedUser(null); }} className="btn btn--ghost btn--sm" style={{ fontSize:".85rem", padding:"8px 20px", borderRadius:"40px", background:"none", border:"1px solid var(--border,rgba(0,0,0,.08))", cursor:"pointer", color:"var(--text-light,#8a7a6e)", fontFamily:"inherit" }}>关闭</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
