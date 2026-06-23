'use strict';

const $ = (id) => document.getElementById(id);

const sourceSel = $('sourceSel');
const cameraSel = $('cameraSel');
const shapeSel = $('shapeSel');
const borderChk = $('borderChk');
const borderHex = $('borderHex');
const borderSwatch = $('borderSwatch');
const borderPresets = $('borderPresets');
const borderWidth = $('borderWidth');
const colorPop = $('colorPop');
const svArea = $('svArea');
const svCur = $('svCur');
const hueBar = $('hueBar');
const hueCur = $('hueCur');

// Color de borde actual (#rrggbb) y estado HSV del selector navegable.
let curBorderColor = '#ffffff';
let hsv = { h: 0, s: 0, v: 1 };

// --- Conversión de color ---
function hsvToRgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function rgbToHex(r, g, b) { return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join(''); }
function hexToRgb(hex) {
  const s = hex.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s: mx ? d / mx : 0, v: mx };
}
// Normaliza "fff"/"#abc"/"ffffff" → "#rrggbb"; null si no es válido.
function normHex(v) {
  let s = String(v || '').trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(s)) s = s.split('').map((c) => c + c).join('');
  if (/^[0-9a-f]{6}$/.test(s)) return '#' + s;
  return null;
}

// Refresca el selector (fondo, cursores, swatch) desde el estado hsv.
function renderPicker() {
  const [r, g, b] = hsvToRgb(hsv.h, hsv.s, hsv.v);
  curBorderColor = rgbToHex(r, g, b);
  borderSwatch.style.background = curBorderColor;
  svArea.style.background =
    `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0)), hsl(${hsv.h} 100% 50%)`;
  svCur.style.left = (hsv.s * 100) + '%';
  svCur.style.top = ((1 - hsv.v) * 100) + '%';
  hueCur.style.left = (hsv.h / 360 * 100) + '%';
}

// Fija el color desde un hex (string). Si updateField, escribe el campo.
function setBorderColor(hex, updateField) {
  const n = normHex(hex);
  if (!n) return false;
  hsv = rgbToHsv(...hexToRgb(n));
  renderPicker();
  if (updateField) borderHex.value = n.replace('#', '');
  borderHex.classList.remove('bad');
  return true;
}

// Arrastre genérico sobre un área (SV o tono).
function makeDraggable(el, fn) {
  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId); fn(e);
    const mv = (ev) => fn(ev);
    const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up);
  });
}
function pickSV(e) {
  const r = svArea.getBoundingClientRect();
  hsv.s = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  hsv.v = Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height));
  renderPicker(); borderHex.value = curBorderColor.replace('#', ''); applyCamera();
}
function pickHue(e) {
  const r = hueBar.getBoundingClientRect();
  hsv.h = Math.min(360, Math.max(0, (e.clientX - r.left) / r.width * 360));
  renderPicker(); borderHex.value = curBorderColor.replace('#', ''); applyCamera();
}
makeDraggable(svArea, pickSV);
makeDraggable(hueBar, pickHue);

// Abrir/cerrar el selector al pulsar la muestra.
borderSwatch.addEventListener('click', (e) => { e.stopPropagation(); colorPop.hidden = !colorPop.hidden; });
colorPop.addEventListener('click', (e) => e.stopPropagation());
document.addEventListener('click', () => { colorPop.hidden = true; });

// Paleta de colores rápidos.
const PRESETS = ['#ffffff', '#000000', '#ff3b6b', '#ff8c00', '#ffd000', '#27d07b',
  '#00c2d1', '#2a7fff', '#7b5bff', '#ff5bd1', '#9b6b3a', '#8a8f98'];
PRESETS.forEach((c) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'preset'; b.style.background = c; b.title = c;
  b.addEventListener('click', () => { setBorderColor(c, true); applyCamera(); });
  borderPresets.appendChild(b);
});
const micSel = $('micSel');
const sysAudioChk = $('sysAudioChk');
const qualitySel = $('qualitySel');
const modeSel = $('modeSel');
const normalOpts = $('normalOpts');
const reelOpts = $('reelOpts');
const bandPosSel = $('bandPosSel');
const zoomRange = $('zoomRange');
const zoomLbl = $('zoomLbl');
const startBtn = $('startBtn');
const statusEl = $('status');
const setupEl = $('setup');
const exportingEl = $('exporting');
const countdownEl = $('countdown');

let sources = [];

function setStatus(text, cls = '') {
  statusEl.textContent = text;
  statusEl.className = 'status ' + cls;
}

const SETUP_HEIGHT = 720;
// Mantener SIEMPRE el mismo alto (la ventana tiene scroll interno): así no
// "salta" encogiéndose al exportar y agrandándose al volver al panel.
function fitWindow() {
  requestAnimationFrame(() => window.loom.resizeControl(SETUP_HEIGHT));
}

// --- Inicialización ----------------------------------------------------------

async function init() {
  await window.loom.checkPermissions();
  try {
    const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    tmp.getTracks().forEach((t) => t.stop());
  } catch (e) {
    setStatus('Concede permisos de cámara/micrófono para continuar.', 'rec');
  }

  const savedMode = localStorage.getItem('modeSel') || 'normal';
  if (modeSel.querySelector(`option[value="${savedMode}"]`)) modeSel.value = savedMode;
  await window.loom.setMode(modeSel.value);
  applyModeVisibility(modeSel.value);
  syncReelTabVisibility(modeSel.value);
  if (modeSel.value === 'reel') pushReel();

  await loadDevices();
  applyCamera();

  await loadSources();
  setupEl.classList.remove('hidden');
  fitWindow();
}

async function loadSources() {
  try { sources = await window.loom.getSources(); }
  catch (e) { sources = []; return false; }
  sourceSel.innerHTML = '';
  sources.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.id; opt.textContent = s.name;
    sourceSel.appendChild(opt);
  });
  sourceSel.parentElement.classList.toggle('hidden', sources.length <= 1);
  return sources.length > 0;
}

async function loadDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cams = devices.filter((d) => d.kind === 'videoinput');
  const mics = devices.filter((d) => d.kind === 'audioinput');
  cameraSel.innerHTML = '';
  cams.forEach((d, i) => {
    const opt = document.createElement('option');
    opt.value = d.deviceId; opt.textContent = d.label || `Cámara ${i + 1}`;
    cameraSel.appendChild(opt);
  });
  micSel.innerHTML = '';
  mics.forEach((d, i) => {
    const opt = document.createElement('option');
    opt.value = d.deviceId; opt.textContent = d.label || `Micrófono ${i + 1}`;
    micSel.appendChild(opt);
  });
}

// --- Cámara / forma / zoom ---------------------------------------------------

function applyCamera() {
  const shape = shapeSel.value;
  cameraSel.disabled = shape === 'none';
  borderChk.disabled = shape === 'none';
  const dis = shape === 'none' || !borderChk.checked;
  borderSwatch.disabled = dis;
  borderWidth.disabled = dis;
  if (dis) colorPop.hidden = true;
  localStorage.setItem('borderColor', curBorderColor);
  localStorage.setItem('borderWidth', borderWidth.value);
  localStorage.setItem('borderOn', borderChk.checked ? '1' : '0');
  window.loom.updateCamera({
    cameraId: cameraSel.value, shape, border: borderChk.checked,
    borderColor: curBorderColor, borderWidth: Number(borderWidth.value),
  });
}
// Restaurar preferencias de borde.
setBorderColor(localStorage.getItem('borderColor') || '#ffffff', true);
borderWidth.value = localStorage.getItem('borderWidth') || '3';
if (localStorage.getItem('borderOn') === '0') borderChk.checked = false;
shapeSel.addEventListener('change', applyCamera);
cameraSel.addEventListener('change', applyCamera);
borderChk.addEventListener('change', applyCamera);
borderWidth.addEventListener('input', applyCamera);
// Campo hexadecimal: valida y aplica al escribir (acepta 3 o 6 dígitos).
borderHex.addEventListener('input', () => {
  if (normHex(borderHex.value)) { setBorderColor(borderHex.value, false); applyCamera(); }
  else borderHex.classList.add('bad');
});
borderHex.addEventListener('blur', () => setBorderColor(curBorderColor, true)); // re-normaliza
borderHex.addEventListener('keydown', (e) => { if (e.key === 'Enter') borderHex.blur(); });

zoomRange.addEventListener('input', () => {
  zoomLbl.textContent = zoomRange.value + '%';
  window.loom.setZoom(Number(zoomRange.value) / 100);
});

// --- Teleprompter ------------------------------------------------------------
const tpBtn = $('tpBtn');
let tpOpen = false;
function setTpBtn(open) {
  tpOpen = open;
  tpBtn.classList.toggle('btn-rec', open);
  tpBtn.classList.toggle('btn-ghost', !open);
  tpBtn.title = open ? 'Cerrar teleprompter' : 'Teleprompter';
}
tpBtn.addEventListener('click', () => window.loom.teleprompterToggle(!tpOpen));
window.loom.onTpState(setTpBtn);

// --- Reel: diseño (100% cámara / Video arriba / Video abajo) -----------------

function applyModeVisibility(mode) {
  normalOpts.classList.toggle('hidden', mode !== 'normal'); // forma de cámara: solo en normal
  reelOpts.classList.toggle('hidden', mode !== 'reel');
}

function pushReel() {
  const v = bandPosSel.value; // 'full' | 'youtube-top' | 'youtube-pie'
  const isYt = v === 'youtube-top' || v === 'youtube-pie';
  $('ytField').style.display = isYt ? '' : 'none';
  window.loom.setReel({ bandPos: v }); // el contenido (video/PDF) lo gestiona main
}

bandPosSel.value = localStorage.getItem('reelBandPos') || 'full';
bandPosSel.addEventListener('change', () => {
  localStorage.setItem('reelBandPos', bandPosSel.value);
  pushReel();
  fitWindow();
});

// --- Contenido del reel: YouTube / video PC / PDF-PowerPoint / Google Slides --
// main es la fuente de verdad del contenido y refresca la vista previa solo.

const ytStatusEl = $('ytStatus');
window.loom.onYtProgress((m) => { ytStatusEl.textContent = m; });

async function loadSource(btn, fn, busyMsg) {
  if (btn) btn.disabled = true;
  ytStatusEl.textContent = busyMsg;
  let r;
  try { r = await fn(); } catch (e) { r = { ok: false, error: String(e) }; }
  if (btn) btn.disabled = false;
  if (r && r.ok) ytStatusEl.textContent = '✓ Listo para el reel';
  else if (r && r.error) ytStatusEl.textContent = '✗ ' + r.error;
  else ytStatusEl.textContent = '';
  fitWindow();
}

$('ytDownloadBtn').addEventListener('click', () => {
  const url = $('ytUrl').value.trim();
  if (!url) { ytStatusEl.textContent = 'Pega la URL de un video de YouTube.'; return; }
  loadSource($('ytDownloadBtn'), () => window.loom.ytDownload(url), 'Descargando de YouTube…');
});
$('ytUploadBtn').addEventListener('click', () => {
  loadSource($('ytUploadBtn'), () => window.loom.pickVideo(), 'Eligiendo video…');
});
$('ytPresBtn').addEventListener('click', () => {
  loadSource($('ytPresBtn'), () => window.loom.pickPresentation(), 'Eligiendo presentación…');
});
$('slidesBtn').addEventListener('click', () => {
  const url = $('slidesUrl').value.trim();
  if (!url) { ytStatusEl.textContent = 'Pega la URL de Google Slides.'; return; }
  loadSource($('slidesBtn'), () => window.loom.slidesDownload(url), 'Cargando Google Slides…');
});

// --- Modo ---------------------------------------------------------------------

modeSel.addEventListener('change', async () => {
  const mode = modeSel.value;
  localStorage.setItem('modeSel', mode);
  applyModeVisibility(mode);
  syncReelTabVisibility(mode);
  if (mode === 'reel') setActiveTab('reel');
  await window.loom.setMode(mode);
  if (mode === 'reel') pushReel();
  fitWindow();
});

// --- Cuenta regresiva --------------------------------------------------------

function countdown(n) {
  return new Promise((resolve) => {
    countdownEl.classList.remove('hidden');
    countdownEl.textContent = n;
    const tick = () => {
      n -= 1;
      if (n <= 0) { countdownEl.classList.add('hidden'); resolve(); }
      else { countdownEl.textContent = n; setTimeout(tick, 1000); }
    };
    setTimeout(tick, 1000);
  });
}

// --- Acciones ----------------------------------------------------------------

window.loom.onShortcut((action) => {
  if (action === 'record' && !setupEl.classList.contains('hidden')) startBtn.click();
});

// Modo captura (Ctrl+Shift+S): avisa cuando Joom queda visible para screenshots.
window.loom.onShotMode((on) => {
  if (on) setStatus('📷 Modo captura ON: ahora puedes tomar pantallazos de Joom. Ctrl+Shift+S para volver a ocultarlo de las grabaciones.', '');
  else setStatus('Protección restaurada: Joom no saldrá en tus grabaciones.', 'ok');
});

startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;
  const sourceId = sourceSel.value;
  const cameraId = cameraSel.value;
  const micId = micSel.value;

  await window.loom.selectSource(sourceId);
  await countdown(3);

  const QUALITY = {
    '720': { maxW: 1280, fps: 30, vbps: 3_000_000 },
    '1080': { maxW: 1920, fps: 30, vbps: 5_000_000 },
    '1080-60': { maxW: 1920, fps: 60, vbps: 8_000_000 },
    '1440': { maxW: 2560, fps: 30, vbps: 10_000_000 },
  };
  const q = QUALITY[qualitySel.value] || QUALITY['1080'];

  await window.loom.startRecording({
    sourceId, cameraId, micId,
    systemAudio: sysAudioChk.checked,
    maxW: q.maxW, fps: q.fps, vbps: q.vbps,
  });
});

window.loom.onExportBusy(() => {
  setupEl.classList.add('hidden');
  exportingEl.classList.remove('hidden');
  setStatus('Procesando…');
  $('exportStatus').textContent = 'Convirtiendo a MP4 con ffmpeg…';
  fitWindow();
});
window.loom.onExportProgress((secs) => {
  $('exportStatus').textContent = `Convirtiendo a MP4… ${secs.toFixed(1)}s procesados`;
});
window.loom.onExportDone((result) => {
  exportingEl.classList.add('hidden');
  setupEl.classList.remove('hidden');
  startBtn.disabled = false;
  if (result.ok) { setStatus('✓ Guardado correctamente', 'ok'); window.loom.revealFile(result.filePath); }
  else { setStatus('✗ ' + result.error, 'rec'); }
  fitWindow();
});

// --- Pestañas ----------------------------------------------------------------
const tabButtons = document.querySelectorAll('.side-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
function setActiveTab(name) {
  tabButtons.forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  tabPanels.forEach((p) => p.classList.toggle('active', p.dataset.panel === name));
  localStorage.setItem('activeTab', name);
  fitWindow();
}
function syncReelTabVisibility(mode) {
  const reelBtn = $('reelTabBtn');
  const isReel = mode === 'reel';
  reelBtn.classList.toggle('hidden', !isReel);
  if (!isReel && reelBtn.classList.contains('active')) setActiveTab('capture');
}
tabButtons.forEach((b) => b.addEventListener('click', () => setActiveTab(b.dataset.tab)));
{
  const saved = localStorage.getItem('activeTab') || 'capture';
  const safe = (saved === 'reel' && modeSel.value !== 'reel') ? 'capture' : saved;
  setActiveTab(safe);
}
syncReelTabVisibility(modeSel.value);

init();
