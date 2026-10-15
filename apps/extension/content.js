// Content Script & Claude Code Mod Injector: 掛載 `🌌 iG` 膠囊按鈕至狀態列
(function mountIntentGalaxyPill() {
  if (document.getElementById("intent-galaxy-mod-pill")) return;
  const btn = document.createElement("button");
  btn.id = "intent-galaxy-mod-pill";
  btn.textContent = "🌌 iG";
  btn.title = "Open Intent Engineering Galaxy (Cmd+Shift+G)";
  btn.style.cssText = "position:fixed; bottom:18px; right:18px; z-index:99999; background:#111723; color:#38bdf8; border:1px solid #38bdf8; border-radius:6px; padding:4px 10px; font-size:12px; font-weight:700; cursor:pointer; box-shadow:0 0 12px rgba(56,189,248,0.3);";
  document.body.appendChild(btn);
})();
