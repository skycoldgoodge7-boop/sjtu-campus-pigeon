// ====== 水彩地形层（简约童趣） ======
// 湖泊有机形状 + 草坪团块
// 极淡半透明 — 轻轻铺在纸张上

export default function TerrainLayer() {
  return (
    <svg
      viewBox="0 0 100 100"
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="wc-blur-sm">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
        <filter id="wc-blur-md">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* ── 思源湖（南侧） ── */}
      <g filter="url(#wc-blur-md)" opacity="0.7">
        <ellipse cx="38" cy="72" rx="13" ry="8"
          fill="rgba(160,210,230,0.35)" />
        <ellipse cx="40" cy="70" rx="10" ry="6.5"
          fill="rgba(168,218,235,0.28)" />
        <ellipse cx="36" cy="74" rx="8" ry="6"
          fill="rgba(155,205,225,0.22)" />
      </g>

      {/* ── 致远湖（北侧） ── */}
      <g filter="url(#wc-blur-sm)" opacity="0.6">
        <ellipse cx="18" cy="25" rx="5" ry="3.5"
          fill="rgba(160,210,230,0.28)" />
        <ellipse cx="19" cy="24" rx="3.5" ry="2.5"
          fill="rgba(168,218,235,0.20)" />
      </g>

      {/* ── 电院大草坪 ── */}
      <g filter="url(#wc-blur-md)" opacity="0.6">
        <ellipse cx="56" cy="47" rx="8" ry="5.5"
          fill="rgba(175,198,160,0.24)" />
        <ellipse cx="54" cy="45" rx="6" ry="4.5"
          fill="rgba(170,192,155,0.18)" />
      </g>

      {/* ── 植物园绿地 ── */}
      <g filter="url(#wc-blur-sm)" opacity="0.5">
        <ellipse cx="88" cy="23" rx="4.5" ry="3"
          fill="rgba(165,188,148,0.18)" />
      </g>

      {/* ── 蔷薇园 ── */}
      <g filter="url(#wc-blur-sm)" opacity="0.45">
        <ellipse cx="74" cy="25" rx="3.5" ry="2.5"
          fill="rgba(215,185,185,0.16)" />
      </g>
    </svg>
  );
}
