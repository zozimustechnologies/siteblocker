const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const STORE_ASSETS = path.join(__dirname, 'store-assets');
const SCREENSHOT_WIDTH = 1280;
const SCREENSHOT_HEIGHT = 800;
const SIDE_PANEL_WIDTH = 400;
const SIDE_PANEL_HEIGHT = 720;

// Earthy blue palette
const BLUE_1 = '#3d7ea6';
const BLUE_2 = '#1a4a6e';
const GRADIENT = `linear-gradient(135deg, ${BLUE_1} 0%, ${BLUE_2} 100%)`;

// Shared CSS for side panel mockups
const panelCSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:${GRADIENT}; color:#333; width:${SIDE_PANEL_WIDTH}px; height:${SIDE_PANEL_HEIGHT}px; overflow:hidden; }
  .container { padding:16px; display:flex; flex-direction:column; height:100%; }
  .header { background:#fff; border-radius:16px; padding:16px; margin-bottom:16px; box-shadow:0 4px 20px rgba(0,0,0,0.15); position:relative; }
  .donate-link { position:absolute; top:12px; right:12px; font-size:11px; font-weight:600; text-decoration:none; color:#fff; background:#c0392b; padding:4px 8px; border-radius:6px; }
  .settings-link { position:absolute; top:12px; right:72px; font-size:18px; text-decoration:none; cursor:pointer; }
  .header-top { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
  .logo { width:40px; height:40px; background:${GRADIENT}; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:20px; font-weight:bold; }
  h1 { font-size:20px; font-weight:600; color:#1a2e3d; }
  .subtitle { font-size:13px; color:#666; margin-top:2px; }
  .master-toggle-container { display:flex; align-items:center; justify-content:center; gap:8px; padding:12px 16px; background:linear-gradient(135deg,#f5f7fa 0%,#e4e8ec 100%); border-radius:12px; }
  .master-label { font-weight:600; color:#444; font-size:14px; }
  .master-status { font-weight:700; font-size:14px; }
  .master-status.on { color:#10b981; }
  .toggle-switch { position:relative; display:inline-block; width:56px; height:30px; }
  .toggle-switch input { opacity:0; width:0; height:0; }
  .toggle-slider { position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#ccc; border-radius:30px; transition:0.3s; }
  .toggle-slider:before { position:absolute; content:""; height:24px; width:24px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:0.3s; box-shadow:0 2px 4px rgba(0,0,0,0.2); }
  .toggle-switch input:checked + .toggle-slider { background:${GRADIENT}; }
  .toggle-switch input:checked + .toggle-slider:before { transform:translateX(26px); }
  .add-site-section { background:#fff; border-radius:12px; padding:14px; margin-bottom:12px; box-shadow:0 2px 12px rgba(0,0,0,0.1); }
  .input-group { display:flex; gap:8px; }
  .input-group input { flex:1; padding:10px 12px; border:2px solid #e0e0e0; border-radius:8px; font-size:14px; outline:none; }
  .btn-add { display:flex; align-items:center; gap:4px; padding:10px 12px; background:${GRADIENT}; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; }
  .counter-section { text-align:center; margin-bottom:12px; }
  .site-counter { font-size:13px; color:rgba(255,255,255,0.9); font-weight:500; }
  .sites-list-container { flex:1; background:#fff; border-radius:12px; padding:14px; box-shadow:0 2px 12px rgba(0,0,0,0.1); overflow:hidden; }
  .empty-state { text-align:center; padding:32px 16px; color:#888; }
  .empty-icon { font-size:40px; margin-bottom:12px; display:flex; justify-content:center; align-items:center; }
  .empty-icon svg { filter:drop-shadow(0 2px 6px rgba(26,74,110,0.25)); }
  .empty-hint { font-size:13px; color:#aaa; }
  .site-item { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:#f8f9fa; border-radius:8px; margin-bottom:8px; }
  .site-domain { font-size:14px; font-weight:500; color:#333; }
  .site-actions { display:flex; align-items:center; gap:6px; }
  .site-toggle { width:36px; height:20px; }
  .site-toggle .toggle-slider:before { height:14px; width:14px; }
  .site-toggle input:checked + .toggle-slider:before { transform:translateX(16px); }
  .btn-delete { width:24px; height:24px; display:flex; align-items:center; justify-content:center; background:transparent; border:none; border-radius:6px; font-size:18px; color:#999; cursor:pointer; }
  .footer { text-align:center; padding:12px 0 8px; color:rgba(255,255,255,0.8); font-size:12px; }
  .footer .divider { margin:0 8px; }
  .copyright { margin-top:6px; font-size:11px; opacity:0.7; }
  .copyright a { color:inherit; text-decoration:none; }
`;

// Screenshot 1: Overview - empty state
const screenshot1HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${panelCSS}</style></head><body>
<div class="container">
  <header class="header">
    <a class="donate-link">Donate</a>
    <a class="settings-link">⚙️</a>
    <div class="header-top">
      <div class="logo">🛡️</div>
      <div><h1>Site Blocker</h1><p class="subtitle">Block distracting websites</p></div>
    </div>
    <div class="master-toggle-container">
      <span class="master-label">Blocking</span>
      <label class="toggle-switch"><input type="checkbox" checked><span class="toggle-slider"></span></label>
      <span class="master-status on">ON</span>
    </div>
  </header>
  <div class="add-site-section">
    <div class="input-group">
      <input type="text" placeholder="Enter URL (e.g., x.com)">
      <button class="btn-add"><span style="font-size:16px;font-weight:700">+</span> Add</button>
    </div>
  </div>
  <div class="counter-section"><span class="site-counter">0/100 sites</span></div>
  <div class="sites-list-container">
    <div class="empty-state">
      <div class="empty-icon"><svg width="64" height="72" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32 4L6 16v20c0 16 11 28 26 32V40l-4-6 3-8-5-7 4-9V4z" fill="url(#sL)" opacity="0.85"/><path d="M32 4l26 12v20c0 16-11 28-26 32V40l4-6-3-8 5-7-4-9V4z" fill="url(#sR)" opacity="0.65" transform="translate(1.5,2)"/><path d="M32 6L30 15L35 22L29 30L34 38L32 48L31 58" stroke="#1a2e3d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.7"/><path d="M33 18L28 28L33 27L29 37" stroke="#5ba3c9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><defs><linearGradient id="sL" x1="6" y1="4" x2="32" y2="68" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#3d7ea6"/><stop offset="100%" stop-color="#1a4a6e"/></linearGradient><linearGradient id="sR" x1="32" y1="4" x2="58" y2="68" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#5ba3c9"/><stop offset="100%" stop-color="#2b5a7e"/></linearGradient></defs></svg></div>
      <p>No sites blocked yet</p>
      <p class="empty-hint">Add a domain above to start blocking</p>
    </div>
  </div>
  <footer class="footer"><span>v1.1.0</span><span class="divider">•</span><span>Stay focused! 🎯</span><div class="copyright">© Zozimus Technologies</div></footer>
</div>
</body></html>`;

// Screenshot 2: Add sites - showing input with a typed domain
const screenshot2HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${panelCSS}
  .input-group input.filled { border-color:${BLUE_1}; box-shadow:0 0 0 3px rgba(61,126,166,0.2); }
</style></head><body>
<div class="container">
  <header class="header">
    <a class="donate-link">Donate</a>
    <a class="settings-link">⚙️</a>
    <div class="header-top">
      <div class="logo">🛡️</div>
      <div><h1>Site Blocker</h1><p class="subtitle">Block distracting websites</p></div>
    </div>
    <div class="master-toggle-container">
      <span class="master-label">Blocking</span>
      <label class="toggle-switch"><input type="checkbox" checked><span class="toggle-slider"></span></label>
      <span class="master-status on">ON</span>
    </div>
  </header>
  <div class="add-site-section">
    <div class="input-group">
      <input type="text" value="tiktok.com" class="filled">
      <button class="btn-add"><span style="font-size:16px;font-weight:700">+</span> Add</button>
    </div>
  </div>
  <div class="counter-section"><span class="site-counter">3/100 sites</span></div>
  <div style="text-align:center;padding:8px 16px;border-radius:8px;margin-bottom:12px;font-size:13px;font-weight:500;background:#d1fae5;color:#065f46;">reddit.com added to blocklist</div>
  <div class="sites-list-container">
    <div class="site-item"><span class="site-domain">facebook.com</span><div class="site-actions"><label class="toggle-switch site-toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label><button class="btn-delete">×</button></div></div>
    <div class="site-item"><span class="site-domain">x.com</span><div class="site-actions"><label class="toggle-switch site-toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label><button class="btn-delete">×</button></div></div>
    <div class="site-item"><span class="site-domain">reddit.com</span><div class="site-actions"><label class="toggle-switch site-toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label><button class="btn-delete">×</button></div></div>
  </div>
  <footer class="footer"><span>v1.1.0</span><span class="divider">•</span><span>Stay focused! 🎯</span><div class="copyright">© Zozimus Technologies</div></footer>
</div>
</body></html>`;

// Screenshot 3: Toggles - mixed enabled/disabled states
const screenshot3HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${panelCSS}
  .site-item.disabled { opacity:0.5; }
</style></head><body>
<div class="container">
  <header class="header">
    <a class="donate-link">Donate</a>
    <a class="settings-link">⚙️</a>
    <div class="header-top">
      <div class="logo">🛡️</div>
      <div><h1>Site Blocker</h1><p class="subtitle">Block distracting websites</p></div>
    </div>
    <div class="master-toggle-container">
      <span class="master-label">Blocking</span>
      <label class="toggle-switch"><input type="checkbox" checked><span class="toggle-slider"></span></label>
      <span class="master-status on">ON</span>
    </div>
  </header>
  <div class="add-site-section">
    <div class="input-group">
      <input type="text" placeholder="Enter URL (e.g., x.com)">
      <button class="btn-add"><span style="font-size:16px;font-weight:700">+</span> Add</button>
    </div>
  </div>
  <div class="counter-section"><span class="site-counter">5/100 sites</span></div>
  <div class="sites-list-container">
    <div class="site-item"><span class="site-domain">facebook.com</span><div class="site-actions"><label class="toggle-switch site-toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label><button class="btn-delete">×</button></div></div>
    <div class="site-item disabled"><span class="site-domain">x.com</span><div class="site-actions"><label class="toggle-switch site-toggle"><input type="checkbox"><span class="toggle-slider"></span></label><button class="btn-delete">×</button></div></div>
    <div class="site-item"><span class="site-domain">reddit.com</span><div class="site-actions"><label class="toggle-switch site-toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label><button class="btn-delete">×</button></div></div>
    <div class="site-item"><span class="site-domain">tiktok.com</span><div class="site-actions"><label class="toggle-switch site-toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label><button class="btn-delete">×</button></div></div>
    <div class="site-item disabled"><span class="site-domain">youtube.com</span><div class="site-actions"><label class="toggle-switch site-toggle"><input type="checkbox"><span class="toggle-slider"></span></label><button class="btn-delete">×</button></div></div>
  </div>
  <footer class="footer"><span>v1.1.0</span><span class="divider">•</span><span>Stay focused! 🎯</span><div class="copyright">© Zozimus Technologies</div></footer>
</div>
</body></html>`;

// Screenshot 4: Blocked page
const screenshot4HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:${GRADIENT}; min-height:${SCREENSHOT_HEIGHT}px; width:${SCREENSHOT_WIDTH}px; display:flex; align-items:center; justify-content:center; color:#fff; }
  .container { text-align:center; padding:20px; }
  .block-icon { font-size:80px; margin-bottom:20px; }
  h1 { font-size:48px; margin-bottom:16px; text-shadow:2px 2px 4px rgba(0,0,0,0.3); }
  .message { font-size:20px; margin-bottom:12px; opacity:0.95; }
  .submessage { font-size:16px; opacity:0.8; margin-bottom:40px; }
  .go-back-btn { display:inline-block; padding:16px 40px; background:#fff; color:${BLUE_1}; border-radius:50px; font-size:18px; font-weight:600; box-shadow:0 8px 30px rgba(0,0,0,0.2); border:none; }
  .productivity { margin-top:30px; font-size:14px; opacity:0.7; }
  .productivity span { font-weight:bold; color:#ffd700; }
</style></head><body>
<div class="container">
  <div class="block-icon">🚫</div>
  <h1>Site Blocked!</h1>
  <p class="message">This website has been blocked</p>
  <p class="submessage">Your productivity thanks you! 🎯</p>
  <button class="go-back-btn">✕ Close Tab</button>
  <p class="productivity">Stay focused! Every blocked visit is a win. <span>🏆</span></p>
</div>
</body></html>`;

// Screenshot 5: Math challenge
const screenshot5HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:${GRADIENT}; width:${SIDE_PANEL_WIDTH}px; height:${SIDE_PANEL_HEIGHT}px; display:flex; align-items:center; justify-content:center; padding:16px; }
  .challenge-card { background:#fff; border-radius:16px; padding:24px; width:100%; max-width:352px; text-align:center; box-shadow:0 8px 30px rgba(0,0,0,0.2); }
  .challenge-icon { font-size:40px; margin-bottom:8px; }
  .challenge-title { font-size:18px; font-weight:700; color:#1a2e3d; margin-bottom:4px; }
  .challenge-subtitle { font-size:12px; color:#888; margin-bottom:16px; }
  .challenge-question { font-size:16px; font-weight:600; color:${BLUE_2}; background:#f0f6fa; padding:12px; border-radius:8px; margin-bottom:16px; }
  .challenge-input-group { display:flex; gap:8px; margin-bottom:12px; }
  .challenge-input-group input { flex:1; padding:10px 12px; border:2px solid #e0e0e0; border-radius:8px; font-size:16px; text-align:center; outline:none; }
  .btn-challenge { padding:10px 16px; background:${GRADIENT}; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; white-space:nowrap; }
  .btn-new-question { background:none; border:none; color:${BLUE_1}; font-size:12px; cursor:pointer; text-decoration:underline; }
</style></head><body>
<div class="challenge-card">
  <div class="challenge-icon">🔒</div>
  <h2 class="challenge-title">Solve to Access</h2>
  <p class="challenge-subtitle">Answer the question to manage your blocklist</p>
  <p class="challenge-question">What is 7 × 8?</p>
  <div class="challenge-input-group">
    <input type="text" placeholder="Your answer">
    <button class="btn-challenge">Unlock</button>
  </div>
  <button class="btn-new-question">Different question</button>
</div>
</body></html>`;

// Screenshot 6: Settings page
const screenshot6HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:#f0f4f8; color:#333; width:${SCREENSHOT_WIDTH}px; height:${SCREENSHOT_HEIGHT}px; display:flex; justify-content:center; padding-top:60px; }
  .settings-container { max-width:480px; width:100%; padding:0 16px; }
  .settings-header { display:flex; align-items:center; gap:12px; margin-bottom:24px; }
  .settings-logo { width:40px; height:40px; background:${GRADIENT}; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:20px; }
  .settings-header h1 { font-size:20px; font-weight:700; color:#1a2e3d; }
  .settings-subtitle { font-size:13px; color:#888; }
  .settings-section { background:#fff; border-radius:12px; padding:16px; box-shadow:0 2px 12px rgba(0,0,0,0.08); margin-bottom:16px; }
  .section-title { font-size:14px; font-weight:700; color:${BLUE_2}; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:12px; }
  .setting-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:8px 0; }
  .setting-label { display:block; font-size:15px; font-weight:500; color:#333; margin-bottom:2px; }
  .setting-description { display:block; font-size:12px; color:#888; }
  .toggle-switch { position:relative; display:inline-block; width:48px; height:26px; flex-shrink:0; }
  .toggle-switch input { opacity:0; width:0; height:0; }
  .toggle-slider { position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#ccc; border-radius:26px; transition:0.3s; }
  .toggle-slider:before { position:absolute; content:""; height:20px; width:20px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:0.3s; box-shadow:0 2px 4px rgba(0,0,0,0.2); }
  .toggle-switch input:checked + .toggle-slider { background:linear-gradient(135deg,${BLUE_1} 0%,${BLUE_2} 100%); }
  .toggle-switch input:checked + .toggle-slider:before { transform:translateX(22px); }
  .settings-footer { text-align:center; font-size:11px; color:#aaa; padding-top:8px; }
  .settings-footer a { color:inherit; text-decoration:none; }
</style></head><body>
<div class="settings-container">
  <header class="settings-header">
    <div class="settings-logo">🛡️</div>
    <div><h1>Settings</h1><p class="settings-subtitle">Site Blocker</p></div>
  </header>
  <section class="settings-section">
    <h2 class="section-title">Child Safety</h2>
    <div class="setting-row">
      <div>
        <span class="setting-label">Math challenge on open</span>
        <span class="setting-description">Require solving a math question before accessing the blocklist</span>
      </div>
      <label class="toggle-switch"><input type="checkbox" checked><span class="toggle-slider"></span></label>
    </div>
  </section>
  <footer class="settings-footer"><span>v1.1.0</span> • <span>© <a href="#">Zozimus Technologies</a></span></footer>
</div>
</body></html>`;

// Promo tile 440x280
const promo440HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:${GRADIENT}; width:440px; height:280px; display:flex; align-items:center; justify-content:center; color:#fff; }
  .promo { text-align:center; padding:20px; }
  .icon { font-size:48px; margin-bottom:12px; }
  h1 { font-size:28px; margin-bottom:8px; text-shadow:1px 1px 3px rgba(0,0,0,0.3); }
  p { font-size:14px; opacity:0.9; }
</style></head><body>
<div class="promo">
  <div class="icon">🛡️</div>
  <h1>Site Blocker</h1>
  <p>Block distracting websites. Stay focused.</p>
</div>
</body></html>`;

// Promo tile 1400x560
const promo1400HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:${GRADIENT}; width:1400px; height:560px; display:flex; align-items:center; justify-content:center; color:#fff; }
  .promo { text-align:center; padding:40px; }
  .icon { font-size:72px; margin-bottom:16px; }
  h1 { font-size:48px; margin-bottom:12px; text-shadow:2px 2px 4px rgba(0,0,0,0.3); }
  p { font-size:22px; opacity:0.9; margin-bottom:8px; }
  .features { font-size:16px; opacity:0.75; margin-top:16px; }
</style></head><body>
<div class="promo">
  <div class="icon">🛡️</div>
  <h1>Site Blocker</h1>
  <p>Block distracting websites and boost your productivity</p>
  <p class="features">100 sites • Toggle controls • Child safety • Privacy first</p>
</div>
</body></html>`;

// Icon 300x300
const icon300HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:${GRADIENT}; width:300px; height:300px; display:flex; align-items:center; justify-content:center; color:#fff; }
  .icon { text-align:center; }
  .shield { font-size:96px; margin-bottom:8px; }
  h1 { font-size:22px; letter-spacing:1px; text-shadow:1px 1px 3px rgba(0,0,0,0.3); }
</style></head><body>
<div class="icon">
  <div class="shield">🛡️</div>
  <h1>Site Blocker</h1>
</div>
</body></html>`;

const screenshots = [
  { name: 'screenshot-1-overview.png', html: screenshot1HTML, width: SIDE_PANEL_WIDTH, height: SIDE_PANEL_HEIGHT },
  { name: 'screenshot-2-add-sites.png', html: screenshot2HTML, width: SIDE_PANEL_WIDTH, height: SIDE_PANEL_HEIGHT },
  { name: 'screenshot-3-toggles.png', html: screenshot3HTML, width: SIDE_PANEL_WIDTH, height: SIDE_PANEL_HEIGHT },
  { name: 'screenshot-4-blocked.png', html: screenshot4HTML, width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT },
  { name: 'screenshot-5-features.png', html: screenshot5HTML, width: SIDE_PANEL_WIDTH, height: SIDE_PANEL_HEIGHT },
  { name: 'screenshot-6-privacy.png', html: screenshot6HTML, width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT },
  { name: 'promo-440x280.png', html: promo440HTML, width: 440, height: 280 },
  { name: 'promo-1400x560.png', html: promo1400HTML, width: 1400, height: 560 },
  { name: 'icon-300x300.png', html: icon300HTML, width: 300, height: 300 },
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  for (const shot of screenshots) {
    const page = await browser.newPage();
    await page.setViewport({ width: shot.width, height: shot.height, deviceScaleFactor: 1 });
    await page.setContent(shot.html, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 300));
    const outPath = path.join(STORE_ASSETS, shot.name);
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`✓ ${shot.name} (${shot.width}x${shot.height})`);
    await page.close();
  }

  await browser.close();
  console.log('\nAll screenshots generated!');
})();
