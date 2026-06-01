"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/dashboard", icon: "🚢", label: "登船口" },
  { href: "/checkin", icon: "⚓", label: "航海日志" },
  { href: "/community", icon: "🍃", label: "低语台" },
  { href: "/treehole", icon: "🍾", label: "漂流瓶" },
  { href: "/skills", icon: "🏮", label: "互助港湾" },
  { href: "/capsule", icon: "🌊", label: "时间海" },
  { href: "/buddy", icon: "👥", label: "觅舟友" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      {/* Hamburger button (mobile only) */}
      <button
        className="mobile-nav-toggle"
        onClick={() => setOpen(true)}
        aria-label="打开导航"
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="mobile-nav-overlay" onClick={() => setOpen(false)} />
      )}

      {/* Drawer */}
      <div className={`mobile-nav-drawer ${open ? "open" : ""}`}>
        <div className="mobile-nav-header">
          <span className="mobile-nav-title">低谷渡口</span>
          <button
            className="mobile-nav-close"
            onClick={() => setOpen(false)}
            aria-label="关闭导航"
          >
            ✕
          </button>
        </div>
        <nav className="mobile-nav-links">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`mobile-nav-link ${isActive ? "active" : ""}`}
              >
                <span className="mobile-nav-icon">{link.icon}</span>
                <span className="mobile-nav-label">{link.label}</span>
                {isActive && <span className="mobile-nav-indicator" />}
              </a>
            );
          })}
        </nav>
        <div className="mobile-nav-footer">
          <a href="/notifications" className="mobile-nav-footer-link">
            <span>🔔</span> 消息
          </a>
          <a href="/profile" className="mobile-nav-footer-link">
            <span>👤</span> 个人资料
          </a>
          <button
            className="mobile-nav-footer-link"
            onClick={() => { if (window.__toggleTheme) window.__toggleTheme(); }}
          >
            <span>🌓</span> 切换主题
          </button>
          <button
            className="mobile-nav-footer-link"
            onClick={() => { localStorage.removeItem("token"); window.location.href = "/"; }}
          >
            <span>🚪</span> 退出登录
          </button>
        </div>
      </div>
    </>
  );
}
