// 面板的保底提示：panel.js（模組）載入失敗或執行時出錯時，畫面不會整片空白，而是顯示錯誤內容，方便回報。
// 一般腳本，不依賴任何模組；panel.js 開始執行時會設定 document.body.dataset.booted。
(() => {
  const show = (text) => {
    const box = document.getElementById("waiting-view");
    if (!box) return;
    box.hidden = false;
    box.querySelector("p").textContent = `Intent Galaxy: ${text}`;
  };
  let last = "";
  document.querySelector('script[type="module"]')?.addEventListener("error", () => { last = "panel.js failed to load"; show(last); });
  window.addEventListener("error", (e) => { last = String(e.message || e.error || "error").slice(0, 300); if (!document.body.dataset.booted) show(last); });
  window.addEventListener("unhandledrejection", (e) => { last = String(e.reason?.message || e.reason || "error").slice(0, 300); if (!document.body.dataset.booted) show(last); });
  setTimeout(() => { if (!document.body.dataset.booted) show(last || "panel did not start (close the panel and try again)"); }, 6000);
})();
