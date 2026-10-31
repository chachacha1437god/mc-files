/* beautify.js —— MC 文件库 · 独立 UI 层
   不内嵌进 index.html，靠 <script src="beautify.js"> 引入。
   只做三件事：鉴权闸门 / 渲染与交互美化 / 拖拽+分卷+下载。
   任何写操作（上传/删除）都过 gate()，访客永远进不来。
   无外部依赖、无背景图、无外部字体。
*/
(function () {
  'use strict';

  /* ===================== 样式 ===================== */
  const CSS = `
  :root{--mg:#62c427;--mgd:#4fa31f;--glass:rgba(18,22,28,.68);--line:rgba(255,255,255,.16);--txt:#eaf3ff;}
  .mcf-panel{background:var(--glass);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    border:1px solid var(--line);border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 8px 26px rgba(0,0,0,.45);padding:14px;margin:10px 0}
  .mcf-server{position:relative;overflow:hidden;background:linear-gradient(180deg,rgba(22,28,36,.85),rgba(13,17,23,.92));
    border:1px solid var(--line);border-radius:16px;box-shadow:0 10px 34px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.12)}
  .mcf-server::before{content:"";position:absolute;left:0;top:14%;bottom:14%;width:4px;background:var(--mg);border-radius:0 4px 4px 0;box-shadow:0 0 12px var(--mg)}
  .mcf-addr{color:#fff!important;letter-spacing:1px;text-shadow:0 2px 6px rgba(0,0,0,.6)}
  /* 拖拽区 */
  .mcf-drop{border:2px dashed var(--line);border-radius:16px;padding:34px 18px;text-align:center;cursor:pointer;transition:.18s;
    background:linear-gradient(180deg,rgba(98,196,39,.04),transparent)}
  .mcf-drop:hover{border-color:var(--mg);background:rgba(98,196,39,.08)}
  .mcf-drop.drag{border-color:var(--mg);border-style:solid;background:rgba(98,196,39,.16);box-shadow:0 0 0 4px rgba(98,196,39,.12)}
  .mcf-drop.hide{display:none}
  .mcf-drop-icon{font-size:42px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5));margin-bottom:8px}
  .mcf-drop-title{color:#fff;font:600 16px "Segoe UI",system-ui,sans-serif}
  .mcf-drop-sub{color:rgba(234,243,255,.6);font:13px "Segoe UI",system-ui,sans-serif;margin-top:6px}
  /* 开关 */
  .mcf-row{display:flex;align-items:center;margin:10px 0 4px}
  .mcf-row.hide{display:none}
  .mcf-switch{display:flex;align-items:center;gap:10px;cursor:pointer;color:var(--txt);font:14px "Segoe UI",system-ui,sans-serif}
  .mcf-switch input{display:none}
  .mcf-slider{width:42px;height:24px;border-radius:99px;background:rgba(255,255,255,.15);position:relative;transition:.18s;border:1px solid var(--line)}
  .mcf-slider::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.18s}
  .mcf-switch input:checked+.mcf-slider{background:var(--mg);border-color:rgba(0,0,0,.2)}
  .mcf-switch input:checked+.mcf-slider::after{transform:translateX(18px)}
  /* 按钮 */
  .mcf-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 16px;border-radius:10px;
    font:600 14px/1 "Segoe UI",system-ui,sans-serif;cursor:pointer;border:1px solid var(--line);background:rgba(255,255,255,.06);color:#eee;transition:.15s;user-select:none}
  .mcf-btn:hover{background:rgba(255,255,255,.12)}
  .mcf-btn:active{transform:translateY(2px)}
  .mcf-btn.primary{background:linear-gradient(180deg,var(--mg),var(--mgd));border-color:rgba(0,0,0,.3);color:#fff;text-shadow:0 1px 1px rgba(0,0,0,.35);
    box-shadow:0 4px 12px rgba(98,196,39,.25),inset 0 1px 0 rgba(255,255,255,.25)}
  .mcf-btn.primary:hover{filter:brightness(1.08)}
  .mcf-btn.danger{color:#ffd6d6;background:rgba(224,108,108,.12)}
  .mcf-btn.danger:hover{background:rgba(224,108,108,.25)}
  .mcf-btn:disabled{opacity:.35;cursor:not-allowed;filter:grayscale(.6)}
  .mcf-copy{min-width:132px}
  .mcf-copy .def{display:inline}.mcf-copy .hov{display:none}
  .mcf-copy:hover .def{display:none}.mcf-copy:hover .hov{display:inline}
  .mcf-copy.ok{background:#2f7d22!important}
  /* 列表 + 复选 */
  .mcf-item{display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.08);margin:8px 0;transition:.15s}
  .mcf-item:hover{border-color:rgba(255,255,255,.22);background:rgba(255,255,255,.07)}
  .mcf-item.sel{border-color:var(--mg);background:rgba(98,196,39,.11);box-shadow:inset 0 0 0 1px rgba(98,196,39,.4)}
  .mcf-chk{width:18px;height:18px;accent-color:var(--mg);cursor:pointer;flex:0 0 auto}
  .mcf-name{font-weight:600;color:#fff}.mcf-name.long{max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;vertical-align:bottom}
  .mcf-tag{font-size:11px;padding:2px 7px;border-radius:6px;background:rgba(98,196,39,.16);color:var(--mg);border:1px solid rgba(98,196,39,.3);margin-left:6px}
  .mcf-tag.vol{background:rgba(240,180,41,.14);color:#f0b429;border-color:rgba(240,180,41,.35)}
  .mcf-del{display:none !important}                    /* 删除功能已彻底移除，永不复活 */
  .mcf-acts{margin-left:auto;display:flex;gap:9px;align-items:center;flex-wrap:wrap}
  /* ===== 直链 / 镜像：绿色玻璃胶囊 ===== */
  .mcf-link{
    display:inline-flex;align-items:center;gap:7px;
    padding:7px 16px;border-radius:99px;                /* 胶囊 */
    font:600 13px "Segoe UI","PingFang SC",system-ui,sans-serif;
    letter-spacing:.3px;cursor:pointer;white-space:nowrap;
    color:var(--mg);text-decoration:none;
    background:rgba(98,196,39,.11);
    border:1px solid rgba(98,196,39,.42);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.12);
    transition:background .16s ease, border-color .16s ease, box-shadow .16s ease, transform .1s ease;
  }
  .mcf-link .lbl-def{display:inline}
  .mcf-link .lbl-hover{display:none}
  .mcf-link:hover{
    background:rgba(98,196,39,.26);
    border-color:var(--mg);
    box-shadow:0 0 14px rgba(98,196,39,.42), inset 0 1px 0 rgba(255,255,255,.2);
    transform:translateY(-1px);
  }
  .mcf-link:hover .lbl-def{display:none}
  .mcf-link:hover .lbl-hover{display:inline}
  .mcf-link:active{transform:translateY(2px); box-shadow:inset 0 2px 7px rgba(0,0,0,.32)}
  .mcf-link.mirror{                                    /* 镜像：白描边，不抢戏 */
    color:#e8e8e8;background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.3);font-weight:600}
  .mcf-link.mirror:hover{background:rgba(255,255,255,.18);border-color:#fff;box-shadow:0 0 12px rgba(255,255,255,.28)}
  .mcf-link.mirror:active{box-shadow:inset 0 2px 7px rgba(0,0,0,.34)}
  .mcf-empty{color:var(--txt);opacity:.65;padding:16px 4px;font:14px "Segoe UI",system-ui,sans-serif}
  .mcf-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .mcf-bar-txt{color:#fff;font:14px "Segoe UI",system-ui,sans-serif}
  /* 进度 */
  .mcf-progress{height:8px;border-radius:99px;background:rgba(0,0,0,.45);border:1px solid var(--line);overflow:hidden;margin-top:10px;display:none}
  .mcf-progress.show{display:block}
  .mcf-progress>i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--mg),#7bed3a);box-shadow:0 0 10px rgba(123,237,58,.5);transition:width .2s ease}
  .mcf-pct{color:var(--txt);opacity:.75;font-size:11px;text-align:right;margin-top:4px}
  /* Toast */
  #mcf-toast{position:fixed;right:18px;bottom:18px;z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:flex-end;pointer-events:none}
  .mcf-t{background:rgba(20,26,20,.92);backdrop-filter:blur(8px);border:1px solid var(--line);border-left:4px solid var(--mg);
    border-radius:10px;padding:10px 15px;color:#fff;font:14px "Segoe UI",system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.5);
    animation:mcfIn .18s ease;max-width:340px;pointer-events:auto}
  .mcf-t.err{border-left-color:#ff6b6b}.mcf-t.warn{border-left-color:#f0b429}
  .mcf-t input{width:200px;padding:7px 9px;border-radius:7px;border:1px solid var(--line);background:rgba(0,0,0,.45);color:#fff;font:13px inherit;margin-top:8px;outline:none}
  .mcf-t input:focus{border-color:var(--mg)}
  .mcf-mini{margin-top:8px;display:flex;gap:8px}
  @keyframes mcfIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  @media(max-width:560px){.mcf-name.long{max-width:110px}}
  `;
  const s = document.createElement('style');
  s.textContent = CSS;
  document.head.appendChild(s);

  /* ===================== 工具 ===================== */
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);
  const catIcon = c => ({启动器:'🟩',整合包:'🧳',模组:'🔧',地图:'🗺️',材质:'🎨',其他:'📦'}[c] || '📦');
  const PROT = ['index.html', 'beautify.js', '.meta.json', 'README.md', 'LICENSE'];
  const MB = 1024 * 1024, SPLIT_VOL = 90;

  /* ===================== 管理员鉴权（PBKDF2，可改密） ===================== */
  const SALT = 'mc-files-salt-v1', ITER = 100000, LEN = 64;
  let ADMIN_ON = false;
  const store = { get hash(){ return localStorage.getItem('mcf_admin_hash'); },
                  set hash(v){ localStorage.setItem('mcf_admin_hash', v); } };
  const TRY_K = 'mcf_admin_tries', LOCK_K = 'mcf_admin_lock';

  async function hashPW(pw){
    const enc = new TextEncoder();
    const buf = await crypto.subtle.importKey('raw', enc.encode(pw + SALT), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt:enc.encode(SALT), iterations:ITER, hash:'SHA-256' }, buf, LEN * 8);
    return [...new Uint8Array(bits)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  const hasPW = () => !!store.hash;
  function triesOk(){
    const lock = +(localStorage.getItem(LOCK_K) || 0);
    if (lock && Date.now() < lock){ return false; }
    if (lock && Date.now() >= lock){ localStorage.removeItem(LOCK_K); localStorage.setItem(TRY_K, '0'); }
    return true;
  }
  function bumpFail(){
    let t = Math.min((+(localStorage.getItem(TRY_K) || 0)) + 1, 3);
    localStorage.setItem(TRY_K, String(t));
    if (t >= 3) localStorage.setItem(LOCK_K, String(Date.now() + 30000));
  }
  function resetTries(){ localStorage.setItem(TRY_K, '0'); localStorage.removeItem(LOCK_K); }

  async function verify(pw){
    if (!triesOk()) return false;
    if (!pw) return false;
    const h = await hashPW(pw);
    if (h !== store.hash){ bumpFail(); return false; }
    resetTries(); return true;
  }
  async function setPassword(newPw, oldPw){
    if (!newPw || newPw.length < 6) throw new Error('密码至少 6 位');
    if (hasPW()){
      if (!oldPw) throw new Error('需先输入当前密码');
      if (!(await verify(oldPw))) throw new Error('当前密码错误');
    }
    store.hash = await hashPW(newPw);
    resetTries(); ADMIN_ON = true;
    return true;
  }

  /* Toast（右下角，替代 alert / confirm） */
  let tbox = null;
  function box(){ if (tbox) return tbox; tbox = document.createElement('div'); tbox.id = 'mcf-toast'; document.body.appendChild(tbox); return tbox; }
  function toast(msg, kind = 'ok', ttl = 2400){
    const el = document.createElement('div'); el.className = 'mcf-t' + (kind !== 'ok' ? ' ' + kind : '');
    el.textContent = msg; box().appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.2s'; setTimeout(() => el.remove(), 200); }, ttl);
  }
  // 密码输入框弹层；返回输入值或 null
  function promptPw(title, placeholder){
    return new Promise(resolve => {
      const el = document.createElement('div'); el.className = 'mcf-t warn';
      el.innerHTML = `<div>${title}</div><input type="password" placeholder="${placeholder}">`;
      const mini = document.createElement('div'); mini.className = 'mcf-mini';
      const ok = document.createElement('button'); ok.className = 'mcf-btn primary'; ok.textContent = '确定';
      const no = document.createElement('button'); no.className = 'mcf-btn'; no.textContent = '取消';
      mini.append(ok, no); el.appendChild(mini); box().appendChild(el);
      const close = (v) => { el.style.opacity = '0'; setTimeout(() => el.remove(), 200); resolve(v); };
      ok.onclick = () => close(el.querySelector('input').value);
      no.onclick = () => close(null);
    });
  }

  /* 闸门：管理员才放行，否则弹密码解锁 */
  function gate(action){
    if (ADMIN_ON) return action();
    (async () => {
      const lock = +(localStorage.getItem(LOCK_K) || 0);
      if (lock && Date.now() < lock){ toast('🔒 已锁定，' + Math.ceil((lock - Date.now()) / 1000) + ' 秒后重试', 'err', 3000); return; }
      const pw = await promptPw('🔒 管理员密码', '输入密码解锁');
      if (pw === null) return;
      if (await verify(pw)){ ADMIN_ON = true; toast('🛡️ 管理员模式已开启', 'ok'); paint(); action(); }
      else { const left = 3 - +(localStorage.getItem(TRY_K) || '0'); toast('❌ 密码错误（' + Math.max(left, 0) + '/3）', 'err', 2200); }
    })();
  }

  /* ===================== 进度 ===================== */
  let _bt;
  function busy(p, label){
    let bar = $('#mcf-bar'), pct = $('#mcf-pct');
    if (!bar){
      bar = document.createElement('div'); bar.id = 'mcf-bar'; bar.className = 'mcf-progress'; bar.innerHTML = '<i></i>';
      pct = document.createElement('div'); pct.id = 'mcf-pct'; pct.className = 'mcf-pct';
      const h = $('.mcf-drop') || document.querySelector('.mcf-panel');
      h.parentNode.insertBefore(bar, h.nextSibling); h.parentNode.insertBefore(pct, bar.nextSibling);
    }
    clearInterval(_bt);
    if (p <= 0){ bar.classList.remove('show'); pct.textContent = ''; return; }
    bar.classList.add('show'); bar.firstElementChild.style.width = Math.min(100, p) + '%';
    pct.textContent = (label || '上传中') + ' · ' + Math.min(100, Math.round(p)) + '%';
  }
  window.busy = busy;

  /* ===================== 复制 ===================== */
  async function copyIp(btn){
    const ip = (window.SERVER_IP || $('#svr-addr')?.textContent.trim() || location.host);
    try{
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(ip);
      else { const t = document.createElement('textarea'); t.value = ip; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
      btn.classList.add('ok'); btn.innerHTML = '<span class="def">✓ 地址复制成功</span>';
      toast('✓ 已复制：' + ip, 'ok');
      setTimeout(() => { btn.classList.remove('ok'); btn.innerHTML = '<span class="def">📋 复制地址</span><span class="hov">点击复制</span>'; }, 2000);
    } catch (e){ toast('复制失败，请手动复制', 'err'); }
  }

  /* ===================== 分卷切割 ===================== */
  function splitFile(file, volMb){
    return new Promise(res => {
      const vol = volMb * MB, total = Math.ceil(file.size / vol), parts = [];
      let i = 0; const reader = new FileReader();
      reader.onload = e => {
        parts.push(new Blob([e.target.result])); i++;
        busy(Math.min(99, i / total * 100), '分卷中 ' + i + '/' + total);
        if (i < total){ reader.readAsArrayBuffer(file.slice(i * vol, Math.min(file.size, (i + 1) * vol))); }
        else { busy(100, '分卷完成'); setTimeout(() => busy(0), 400); res(parts); }
      };
      reader.readAsArrayBuffer(file.slice(0, Math.min(file.size, vol)));
    });
  }

  /* ===================== 上传一条 ===================== */
  async function putFile(name, blob, cat, desc){
    const t = (typeof pat === 'function' ? pat() : '') || '';
    if (!t) throw new Error('请先填 Token');
    const b64 = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(blob); });
    let sha = null;
    try{ const rr = await fetch(`${API}/${encodeURIComponent(name)}?ref=${BRANCH}`, { headers: { 'Authorization': `token ${t}`, 'Accept': 'application/vnd.github+json' } }); if (rr.ok) sha = (await rr.json()).sha; } catch (e) {}
    const up = await fetch(`${API}/${encodeURIComponent(name)}`, {
      method: 'PUT', headers: { 'Authorization': `token ${t}`, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github+json' },
      body: JSON.stringify({ message: `上传 ${name}`, content: b64, branch: BRANCH, sha }) });
    if (!up.ok){ const e = await up.json().catch(() => ({ message: up.status })); throw new Error(e.message || '上传失败'); }
    // 写 meta
    try{
      let m = {}, ms = null;
      const mr = await fetch(`${API}/.meta.json?ref=${BRANCH}`, { headers: { 'Authorization': `token ${t}`, 'Accept': 'application/vnd.github+json' } });
      if (mr.ok){ const j = await mr.json(); m = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(j.content), c => c.charCodeAt(0)))); ms = j.sha; }
      m[name] = { cat, desc, time: Date.now(), split: blob.__split || 0 };
      await fetch(`${API}/.meta.json`, { method: 'PUT', headers: { 'Authorization': `token ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'meta', content: btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(m, null, 2)))), sha: ms, branch: BRANCH }) });
    } catch (e) {}
  }

  /* ===================== 上传入口 ===================== */
  async function handleFile(file){
    if (!ADMIN_ON) return gate(() => handleFile(file));
    const split = $('#splitMode').checked || file.size > SPLIT_VOL * MB;
    const cat = $('#cat').value || '其他', desc = $('#desc').value || '';
    if (PROT.includes(file.name)) return toast('🚫 系统文件名，禁止上传', 'err');
    if (!split && file.size > 100 * MB) return toast('❌ 超 100MB：请开启「分卷上传」', 'warn');
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    if (!split || file.size <= SPLIT_VOL * MB){
      try{ busy(20, '读取'); await putFile(safe, file, cat, desc); busy(100); toast('✓ 已上传 ' + safe, 'ok');
        setTimeout(() => busy(0), 500); safeRender(); }
      catch (e){ busy(0); toast('❌ ' + e.message, 'err'); }
      return;
    }
    // 分卷
    toast('🧩 分卷：' + file.name + '（' + Math.ceil(file.size / SPLIT_VOL / MB) + ' 卷）', 'warn', 4000);
    const parts = await splitFile(file, SPLIT_VOL); const n = parts.length;
    const base = safe.replace(/\.[^.]+$/, ''); let done = 0;
    for (let i = 0; i < n; i++){
      const pn = base + '.part' + String(i + 1).padStart(2, '0') + '.zip';
      try{ await putFile(pn, parts[i], cat, desc + ' [卷 ' + (i + 1) + '/' + n + ']'); done++;
        busy(Math.min(99, done / n * 100), '传卷 ' + done + '/' + n); }
      catch (e){ busy(0); toast('❌ 第' + (i + 1) + '卷失败：' + e.message, 'err'); return; }
    }
    // 主条目记成分卷组
    try{
      const t = (typeof pat === 'function' ? pat() : '') || '';
      let m = {}, ms = null;
      const mr = await fetch(`${API}/.meta.json?ref=${BRANCH}`, { headers: { 'Authorization': `token ${t}`, 'Accept': 'application/vnd.github+json' } });
      if (mr.ok){ const j = await mr.json(); m = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(j.content), c => c.charCodeAt(0)))); ms = j.sha; }
      m[safe] = { cat, desc, time: Date.now(), split: n };
      await fetch(`${API}/.meta.json`, { method: 'PUT', headers: { 'Authorization': `token ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'meta', content: btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(m, null, 2)))), sha: ms, branch: BRANCH }) });
    } catch (e) {}
    busy(100); toast('✓ 分卷完成：' + safe + '（' + n + ' 卷）', 'ok', 4000);
    setTimeout(() => busy(0), 600); safeRender();
  }

  /* ===================== 渲染装饰 ===================== */
  let _rendering = false;
  async function safeRender(){
    if (_rendering) return;
    _rendering = true;
    try{ if (typeof render === 'function') await render(); } finally { _rendering = false; }
  }
  const _render = window.render;
  if (typeof _render === 'function'){
    window.render = async function (){
      const list = document.getElementById('list');
      let res;
      try{ res = await _render.apply(this, arguments); }
      catch (e){ if (list) list.innerHTML = '<div class="mcf-empty" style="color:#ff9a9a">❌ ' + (e.message || e) + '</div>'; throw e; }
      if (list) decorate(list);
      paint();
      return res;
    };
  }
  function metaOf(el){
    const m = (el.querySelector('.file-meta') || {}).textContent || '';
    return m;
  }
  function baseName(raw){ return raw.replace(/\.part\d{2}\.zip$/i, ''); }

  function decorate(list){
    const items = $$('.file-item', list);
    if (!items.length){
      if (!list.querySelector('.mcf-empty')) list.innerHTML = '<div class="mcf-empty">🎒 这里空空的，丢个整合包进来吧</div>';
      return;
    }
    items.forEach(it => {
      if (it.classList.contains('mcf-item-done')) return;
      it.classList.add('mcf-item', 'mcf-item-done');
      const n = it.querySelector('.file-name') || it.querySelector('b'); if (!n) return;
      const raw = n.textContent.replace(/^[📦 ]+/, '');
      const m = metaOf(it);
      const cat = (m.match(/(启动器|整合包|模组|地图|材质|其他)/) || ['其他'])[0];
      const isVol = /\.part\d{2}\.zip$/i.test(raw);
      n.className = 'mcf-name' + (raw.length > 30 ? ' long' : '');
      n.title = raw;
      n.innerHTML = '<span style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))">' + catIcon(cat) + '</span> ' + baseName(raw)
        + (isVol ? '<span class="mcf-tag vol">分卷</span>' : '');
      // 复选框（下载用，访客也能选）
      if (!it.querySelector('.mcf-chk')){
        const c = document.createElement('input'); c.type = 'checkbox'; c.className = 'mcf-chk'; c.dataset.name = raw;
        c.addEventListener('change', () => { it.classList.toggle('sel', c.checked); syncSel(); });
        it.insertBefore(c, it.firstChild);
      }
      const acts = it.querySelector('.file-actions'); if (acts) acts.className = 'mcf-acts';
      // 删除按钮已彻底移除：这里只渲染 直链 / 镜像 两个胶囊，不再查 button / del
      const lnk = it.querySelector('a.mcf-raw-link');
      if (lnk && !it.querySelector('.mcf-link')){
        lnk.className = 'mcf-link';
        lnk.innerHTML = '<span class="lbl-def">⬇ 直链</span><span class="lbl-hover">点击下载</span>';
        const mm = document.createElement('a');
        mm.className = 'mcf-link mirror';
        mm.innerHTML = '<span class="lbl-def">🪞 镜像</span><span class="lbl-hover">加速下载</span>';
        mm.href = 'https://ghproxy.com/' + lnk.href.replace(/^https?:\/\//, '');
        mm.target = '_blank'; mm.rel = 'noopener';
        lnk.parentNode.insertBefore(mm, lnk.nextSibling);
      }
    });
    syncSel();
  }

  /* 选择下载 */
  function selectedNames(){
    return $$('.mcf-chk:checked').map(c => c.dataset.name).filter(Boolean);
  }
  function syncSel(){
    const n = selectedNames().length;
    const cnt = $('#selCnt'); if (cnt) cnt.textContent = String(n);
    const dl = $('#batchDl'); if (dl) dl.disabled = n === 0;
    const bar = $('#dlBar'); if (bar) bar.style.display = n ? 'flex' : 'none';
  }
  function rawUrl(name){ return RAW + '/' + name; }
  function downloadOne(name){
    const a = document.createElement('a'); a.href = rawUrl(name); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  function batchDownload(){
    const all = selectedNames();
    if (!all.length) return;
    // 若选中的是分卷组主条目，则把它的卷也一并下
    const todo = new Set();
    all.forEach(nm => {
      const el = $$('.mcf-chk').find(c => c.dataset.name === nm);
      const meta = el ? metaOf(el.closest('.mcf-item')) : '';
      const m = meta.match(/\[卷\s*(\d+)\/(\d+)\s*\]/);
      if (m){ const base = nm.replace(/\.[^.]+$/i, ''); const tot = +m[2];
        for (let i = 1; i <= tot; i++) todo.add(base + '.part' + String(i).padStart(2, '0') + '.zip'); }
      else todo.add(nm);
    });
    const list = [...todo];
    toast('📥 开始下载 ' + list.length + ' 个文件', 'ok', 2600);
    // 串行触发，避免浏览器一次性拦
    let i = 0; const tick = () => { if (i >= list.length) return; downloadOne(list[i++]); setTimeout(tick, 500); };
    tick();
  }

  /* ===================== 管理员面板 ===================== */
  function paint(){
    const drop = $('#dropZone'); if (drop) drop.classList.toggle('hide', !ADMIN_ON);
    const spl = $('#splitRow'); if (spl) spl.classList.toggle('hide', !ADMIN_ON);
    const upBtn = $('#uploadBtn'); if (upBtn) upBtn.classList.toggle('hide', !ADMIN_ON);
    // 删除功能已移除，无 mcf-del 需要处理
    buildAdmin();
  }

  function buildAdmin(){
    let box = $('#adminBox'); if (box) box.remove();
    box = document.createElement('div'); box.id = 'adminBox'; box.className = 'mcf-panel';
    box.innerHTML = `
      <div id="mcfLocked" style="display:${ADMIN_ON ? 'none' : 'block'}">
        <div style="color:#fff;margin-bottom:10px">🔒 ${hasPW() ? '管理员登录' : '首次设置管理员密码'}</div>
        <input id="mcfPw" type="password" placeholder="${hasPW() ? '输入密码' : '设密码（≥6位）'}" style="width:100%;padding:9px 11px;border-radius:9px;border:1px solid var(--line);background:rgba(0,0,0,.4);color:#fff;font:14px inherit;margin-bottom:8px;outline:none">
        <button class="mcf-btn primary" id="mcfEnter">${hasPW() ? '解锁' : '设好并解锁'}</button>
      </div>
      <div id="mcfOn" style="display:${ADMIN_ON ? 'block' : 'none'}">
        <div style="color:var(--mg);font-weight:600;margin-bottom:10px">🛡️ 管理员模式 · 上传已开启</div>
        <input id="mcfOld" type="password" placeholder="当前密码" style="width:100%;padding:9px 11px;border-radius:9px;border:1px solid var(--line);background:rgba(0,0,0,.4);color:#fff;font:14px inherit;margin-bottom:8px;outline:none">
        <input id="mcfNew" type="password" placeholder="新密码（≥6位，留空不改）" style="width:100%;padding:9px 11px;border-radius:9px;border:1px solid var(--line);background:rgba(0,0,0,.4);color:#fff;font:14px inherit;margin-bottom:10px;outline:none">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="mcf-btn primary" id="mcfChg">🔑 修改密码</button>
          <button class="mcf-btn danger" id="mcfExit">退出管理员</button>
        </div>
      </div>`;
    const anchor = $('#list') || document.body;
    anchor.parentNode.insertBefore(box, anchor.nextSibling);

    $('#mcfEnter').onclick = async () => {
      const v = $('#mcfPw').value; if (!v) return toast('请输入密码', 'err');
      try{
        if (hasPW()){
          if (await verify(v)){ ADMIN_ON = true; toast('🛡️ 已解锁', 'ok'); } else { toast('❌ 密码错误', 'err'); }
        } else {
          await setPassword(v); toast('✓ 密码已设定并解锁', 'ok');
        }
        $('#mcfPw').value = '';
      } catch (e){ toast(e.message, 'err'); }
      paint();
    };
    $('#mcfChg').onclick = async () => {
      const o = $('#mcfOld').value, n = $('#mcfNew').value;
      if (!n){ ADMIN_ON = false; toast('🔒 已退出管理员', 'warn'); }
      else { try{ await setPassword(n, o); $('#mcfOld').value = ''; $('#mcfNew').value = ''; toast('✓ 密码已修改，请重新解锁', 'ok'); ADMIN_ON = false; } catch (e){ toast(e.message, 'err'); } }
      paint();
    };
    $('#mcfExit').onclick = () => { ADMIN_ON = false; toast('🔒 已退出管理员', 'warn'); paint(); };
  }

  /* ===================== 删除功能：已彻底移除 =====================
     不再有删除按钮、删除请求、确认弹窗、delFile 全局。
     想删仓库里的文件，请用本地一键部署：
       python3 sync.py     （网页面板「🚀 一键换血」）
       ./sync.sh --yes     （或命令行）
     这样删除走的是 git rm，不暴露任何写接口到网页端。 */

  /* ===================== 拖拽 + 绑定 ===================== */
  function bindDrop(){
    const dz = $('#dropZone'), fi = $('#file');
    if (!dz) return;
    dz.addEventListener('click', e => { if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') fi.click(); });
    fi.addEventListener('change', e => { const f = e.target.files[0]; if (f) handleFile(f); fi.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); if (ADMIN_ON) dz.classList.add('drag'); }, false));
    ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag'); }, false));
    dz.addEventListener('drop', e => {
      if (!ADMIN_ON){ toast('🔒 访客模式，解锁管理员才能上传', 'warn'); return; }
      const f = e.dataTransfer.files[0]; if (f) handleFile(f);
    }, false);
    // 原上传按钮接管
    const ub = $('#uploadBtn') || $$('button').find(b => /上传|⛏️/.test(b.textContent) && !b.dataset.mcf);
    if (ub && !ub.dataset.mcf){ ub.dataset.mcf = '1'; ub.classList.add('mcf-btn', 'primary');
      ub.innerHTML = '<span class="def">⬆ 上传</span><span class="hov">点击上传</span>';
      ub.addEventListener('click', e => { if (!ADMIN_ON){ e.preventDefault(); gate(() => {}); } });
    }
    // 下载栏
    const selAll = $('#selAll'), clr = $('#selClear'), dl = $('#batchDl');
    if (selAll) selAll.onclick = () => { $$('.mcf-chk').forEach(c => { c.checked = true; c.closest('.mcf-item').classList.add('sel'); }); syncSel(); };
    if (clr) clr.onclick = () => { $$('.mcf-chk').forEach(c => { c.checked = false; c.closest('.mcf-item').classList.remove('sel'); }); syncSel(); };
    if (dl) dl.onclick = batchDownload;
    const q = $('#q');
    if (q){ let t = null; q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(safeRender, 200); }); }
  }

  /* ===================== 启动 ===================== */
  function upgrade(){
    document.querySelectorAll('.server-block, [class*="server"]').forEach(v => {
      if (v.classList.contains('mcf-server')) return;
      v.classList.add('mcf-server', 'mcf-panel');
      const b = v.querySelector('button');
      if (b && !b.dataset.copySvr){ b.classList.add('mcf-btn', 'primary', 'mcf-copy'); b.dataset.copySvr = '1';
        b.innerHTML = '<span class="def">📋 复制地址</span><span class="hov">点击复制</span>'; b.onclick = () => copyIp(b); }
    });
    document.querySelectorAll('.panel').forEach(p => p.classList.add('mcf-panel'));
    bindDrop(); paint();
  }
  upgrade();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', upgrade);
  else paint();
  // 补刀：若 index.html 的首次 render() 在我们接管前就跑过了（同步脚本时序问题），
  // 这里再装饰一次已存在的条目，保证胶囊按钮/分卷标一定挂上。
  (function fixBoot(){
    const list = document.getElementById('list');
    if (list && list.children.length && !list.querySelector('.mcf-link')) decorate(list);
  })();
})();
