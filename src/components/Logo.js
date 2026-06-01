// SVG Logo for 低谷渡口
export default function Logo({ size = 32, showText = true }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 船身 */}
        <path d="M8 40 L56 40 L48 52 L16 52 Z" fill="#f0c27f" opacity="0.85" />
        {/* 桅杆 */}
        <rect x="30" y="14" width="4" height="28" rx="1" fill="#dba76a" />
        {/* 帆 */}
        <path d="M34 16 C44 22 44 32 34 38" fill="rgba(240,194,127,.35)" stroke="#f0c27f" strokeWidth="1.5" />
        {/* 水面 */}
        <path d="M2 44 Q16 40 32 44 Q48 48 62 44" stroke="rgba(240,194,127,.25)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M0 48 Q16 44 32 48 Q48 52 64 48" stroke="rgba(240,194,127,.15)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* 星星/希望 */}
        <circle cx="18" cy="22" r="2" fill="#f0c27f" opacity="0.6" />
        <circle cx="48" cy="18" r="1.5" fill="#f0c27f" opacity="0.4" />
        {/* 灯光 */}
        <circle cx="34" cy="36" r="3" fill="#f0c27f" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
      {showText && (
        <span style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "1px", background: "linear-gradient(135deg,#f0c27f,#dba76a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          低谷渡口
        </span>
      )}
    </div>
  );
}
