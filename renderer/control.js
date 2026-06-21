'use strict';

const $ = (id) => document.getElementById(id);

const sourceSel = $('sourceSel');
const cameraSel = $('cameraSel');
const shapeSel = $('shapeSel');
const borderChk = $('borderChk');
const micSel = $('micSel');
const sysAudioChk = $('sysAudioChk');
const qualitySel = $('qualitySel');
const modeSel = $('modeSel');
const normalOpts = $('normalOpts');
const reelOpts = $('reelOpts');
const bandPosSel = $('bandPosSel');
const bandHRange = $('bandHRange');
const bandHLbl = $('bandHLbl');
const zoneBtn = $('zoneBtn');
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

// Alto fijo del panel mientras se configura. En estados compactos (exportando)
// se reduce; al volver al setup se restaura.
const SETUP_HEIGHT = 720;
function fitWindow() {
  requestAnimationFrame(() => {
    const setup = document.getElementById('setup');
    const setupVisible = setup && !setup.classList.contains('hidden');
    if (setupVisible) {
      window.loom.resizeControl(SETUP_HEIGHT);
      return;
    }
    let h = 240;
    const el = document.getElementById('exporting');
    if (el && !el.classList.contains('hidden')) {
      h = el.getBoundingClientRect().height + 80;
    }
    window.loom.resizeControl(Math.ceil(h));
  });
}

// --- Inicialización ----------------------------------------------------------

async function init() {
  await window.loom.checkPermissions();

  // Pedir permiso una vez para poder leer las etiquetas de los dispositivos.
  try {
    const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    tmp.getTracks().forEach((t) => t.stop());
  } catch (e) {
    setStatus('Concede permisos de cámara/micrófono para continuar.', 'rec');
  }

  // Restaurar el modo guardado ANTES de pedirle al main que cree la burbuja.
  const savedMode = localStorage.getItem('modeSel') || 'normal';
  if (modeSel.querySelector(`option[value="${savedMode}"]`)) {
    modeSel.value = savedMode;
  }
  await window.loom.setMode(modeSel.value);
  applyModeVisibility(modeSel.value);
  syncReelTabVisibility(modeSel.value);

  await loadDevices();
  applyCamera(); // mostrar la vista previa de la cámara desde el inicio

  await loadSources();
  setupEl.classList.remove('hidden');
  fitWindow();
}

async function loadSources() {
  try {
    sources = await window.loom.getSources();
  } catch (e) {
    sources = [];
    return false;
  }
  sourceSel.innerHTML = '';
  sources.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    sourceSel.appendChild(opt);
  });
  // Si solo hay una pantalla, no merece la pena enseñar el selector.
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
    opt.value = d.deviceId;
    opt.textContent = d.label || `Cámara ${i + 1}`;
    cameraSel.appendChild(opt);
  });

  micSel.innerHTML = '';
  mics.forEach((d, i) => {
    const opt = document.createElement('option');
    opt.value = d.deviceId;
    opt.textContent = d.label || `Micrófono ${i + 1}`;
    micSel.appendChild(opt);
  });
}

// --- Vista previa / forma de la cámara --------------------------------------

function applyCamera() {
  const shape = shapeSel.value;
  cameraSel.disabled = shape === 'none';
  borderChk.disabled = shape === 'none';
  window.loom.updateCamera({ cameraId: cameraSel.value, shape, border: borderChk.checked });
}

shapeSel.addEventListener('change', applyCamera);
cameraSel.addEventListener('change', applyCamera);
borderChk.addEventListener('change', applyCamera);

zoomRange.addEventListener('input', () => {
  zoomLbl.textContent = zoomRange.value + '%';
  window.loom.setZoom(Number(zoomRange.value) / 100);
});

// --- Banner / texto del reel (colores) --------------------------------------

$('reelHeadlineTxt').value = localStorage.getItem('reelHeadlineTxt') || '';
$('reelHeadlineTxt2').value = localStorage.getItem('reelHeadlineTxt2') || '';
$('reelHeadlineAnim').checked = localStorage.getItem('reelHeadlineAnim') === '1';
$('reelHeadlineFg').value = localStorage.getItem('reelHeadlineFg') || '#ffffff';
$('reelHeadlineBg').value = localStorage.getItem('reelHeadlineBg') || '#000000';

const HL_PALETTE = ['#ffffff', '#000000', '#FFD000', '#ff3b30', '#ff9500', '#34c759', '#0a84ff', '#6c5ce7', '#ff2d92', '#3a3a3a'];
function renderSwatches(rowId, hexId) {
  const row = $(rowId);
  row.innerHTML = '';
  for (const c of HL_PALETTE) {
    const b = document.createElement('button');
    b.className = 'csw';
    b.type = 'button';
    b.style.background = c;
    b.dataset.color = c;
    b.title = c;
    b.addEventListener('click', () => {
      $(hexId).value = c;
      updateSwatchActive(rowId, c);
      onHeadlineColorChange(hexId);
    });
    row.appendChild(b);
  }
  updateSwatchActive(rowId, $(hexId).value);
}
function updateSwatchActive(rowId, value) {
  const v = (value || '').toLowerCase();
  for (const b of $(rowId).querySelectorAll('.csw')) {
    b.classList.toggle('active', b.dataset.color.toLowerCase() === v);
  }
}
function isValidHex(s) { return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s || ''); }
function onHeadlineColorChange(hexId) {
  const key = hexId === 'reelHeadlineFg' ? 'reelHeadlineFg' : 'reelHeadlineBg';
  const v = $(hexId).value;
  if (isValidHex(v)) localStorage.setItem(key, v);
  pushHeadline();
  updateSwatchActive(hexId === 'reelHeadlineFg' ? 'hlFgSwatches' : 'hlBgSwatches', v);
}
renderSwatches('hlFgSwatches', 'reelHeadlineFg');
renderSwatches('hlBgSwatches', 'reelHeadlineBg');
$('reelHeadlineOffset').value = localStorage.getItem('reelHeadlineOffset') || '0';
$('reelHeadlineOffsetLbl').textContent = $('reelHeadlineOffset').value + '%';
$('reelHeadlinePosSel').value = localStorage.getItem('reelHeadlinePos') || 'camera';

function syncOffsetVisibility() {
  // El offset solo aplica si el banner va junto a la cámara
  const cam = $('reelHeadlinePosSel').value === 'camera';
  $('reelHeadlineOffset').style.display = cam ? '' : 'none';
  $('reelHeadlineOffsetLblWrap').style.display = cam ? '' : 'none';
}
function pushHeadline() {
  window.loom.setReel({
    reelHeadline: {
      text: $('reelHeadlineTxt').value, text2: $('reelHeadlineTxt2').value,
      fg: $('reelHeadlineFg').value, bg: $('reelHeadlineBg').value,
      animate: $('reelHeadlineAnim').checked,
    },
    reelHeadlineOffset: Number($('reelHeadlineOffset').value) / 100,
    reelHeadlinePos: $('reelHeadlinePosSel').value,
  });
  syncOffsetVisibility();
}

$('reelHeadlineTxt').addEventListener('input', () => { localStorage.setItem('reelHeadlineTxt', $('reelHeadlineTxt').value); pushHeadline(); });
$('reelHeadlineTxt2').addEventListener('input', () => { localStorage.setItem('reelHeadlineTxt2', $('reelHeadlineTxt2').value); pushHeadline(); });
$('reelHeadlineAnim').addEventListener('change', () => { localStorage.setItem('reelHeadlineAnim', $('reelHeadlineAnim').checked ? '1' : '0'); pushHeadline(); });
$('reelHeadlineFg').addEventListener('input', () => onHeadlineColorChange('reelHeadlineFg'));
$('reelHeadlineBg').addEventListener('input', () => onHeadlineColorChange('reelHeadlineBg'));
$('reelHeadlineOffset').addEventListener('input', () => {
  $('reelHeadlineOffsetLbl').textContent = $('reelHeadlineOffset').value + '%';
  localStorage.setItem('reelHeadlineOffset', $('reelHeadlineOffset').value);
  pushHeadline();
});
$('reelHeadlinePosSel').addEventListener('change', () => {
  localStorage.setItem('reelHeadlinePos', $('reelHeadlinePosSel').value);
  pushHeadline();
});
syncOffsetVisibility();

// Vista previa en vivo durante la grabación (off por defecto)
$('livePreviewChk').checked = localStorage.getItem('livePreview') === '1';
$('livePreviewChk').addEventListener('change', () => localStorage.setItem('livePreview', $('livePreviewChk').checked ? '1' : '0'));

// --- Modo de grabación (normal / reel / podcast) -----------------------------

let zoneOpen = false;

function applyModeVisibility(mode) {
  // normalOpts (forma de cámara) en normal SIEMPRE; en reel solo si bandPos === 'bubble';
  // en podcast NUNCA (la cámara es siempre vertical fija).
  const showShape = (mode === 'normal') || (mode === 'reel' && bandPosSel.value === 'bubble');
  normalOpts.classList.toggle('hidden', !showShape);
  reelOpts.classList.toggle('hidden', mode !== 'reel');
}

function updateZoneBtn() {
  zoneBtn.textContent = zoneOpen ? '✓ Cerrar zona' : '▭ Ajustar zona de pantalla';
  zoneBtn.classList.toggle('btn-rec', zoneOpen);
  zoneBtn.classList.toggle('btn-ghost', !zoneOpen);
}

function pushReel() {
  const v = bandPosSel.value;
  const full = v === 'full';
  const bubble = v === 'bubble';
  $('bandHField').classList.toggle('hidden', full || bubble); // sin alto en full/bubble
  zoneBtn.classList.toggle('hidden', full);                  // bubble SÍ usa zona de pantalla
  if (full) { zoneOpen = false; updateZoneBtn(); }
  // En modo burbuja mostramos el selector de forma de cámara (que vive en normalOpts)
  normalOpts.classList.toggle('hidden', !(bubble));
  $('bubbleSizeField').classList.toggle('hidden', !bubble);
  // En full la cámara ocupa todo (frac=1). En bubble no hay banda (frac=0).
  const frac = full ? 1 : (bubble ? 0 : Number(bandHRange.value) / 100);
  const pos = full ? 'bottom' : v; // 'bottom' | 'top' | 'bubble'
  window.loom.setReel({
    bandPos: pos, bandHeightFrac: frac,
    reelHeadline: {
      text: $('reelHeadlineTxt').value, text2: $('reelHeadlineTxt2').value,
      fg: $('reelHeadlineFg').value, bg: $('reelHeadlineBg').value,
      animate: $('reelHeadlineAnim').checked,
    },
    reelHeadlineOffset: Number($('reelHeadlineOffset').value) / 100,
    reelHeadlinePos: $('reelHeadlinePosSel').value,
    bubbleSizeFrac: Number($('bubbleSizeRange').value) / 100,
  });
}

modeSel.addEventListener('change', async () => {
  const mode = modeSel.value;
  localStorage.setItem('modeSel', mode);
  applyModeVisibility(mode);
  syncReelTabVisibility(mode);
  if (mode === 'reel') setActiveTab('reel');
  await window.loom.setMode(mode);
  if (mode === 'reel') { pushReel(); zoneOpen = true; updateZoneBtn(); }
  fitWindow();
});

bandPosSel.addEventListener('change', () => { pushReel(); fitWindow(); });
bandHRange.addEventListener('input', () => {
  bandHLbl.textContent = bandHRange.value + '%';
  pushReel();
});
// Slider tamaño de burbuja en el video (solo aplica en reel+bubble)
$('bubbleSizeRange').value = localStorage.getItem('bubbleSizeFrac100') || '0';
function updateBubbleSizeLbl() {
  const v = Number($('bubbleSizeRange').value);
  $('bubbleSizeLbl').textContent = v === 0 ? 'automático' : v + '% del ancho';
}
updateBubbleSizeLbl();
$('bubbleSizeRange').addEventListener('input', () => {
  localStorage.setItem('bubbleSizeFrac100', $('bubbleSizeRange').value);
  updateBubbleSizeLbl();
  pushReel();
});
// Bloqueo de posición de la cámara (solo aplica en reel+burbuja)
$('bubbleLockChk').checked = false; // no se persiste; arranca desbloqueada cada sesión
$('bubbleLockChk').addEventListener('change', () => {
  window.loom.setReel({ bubbleLocked: $('bubbleLockChk').checked });
});
zoneBtn.addEventListener('click', () => {
  zoneOpen = !zoneOpen;
  window.loom.zoneToggle(zoneOpen);
  updateZoneBtn();
});

// --- Cuenta regresiva --------------------------------------------------------

function countdown(n) {
  return new Promise((resolve) => {
    countdownEl.classList.remove('hidden');
    countdownEl.textContent = n;
    const tick = () => {
      n -= 1;
      if (n <= 0) {
        countdownEl.classList.add('hidden');
        resolve();
      } else {
        countdownEl.textContent = n;
        setTimeout(tick, 1000);
      }
    };
    setTimeout(tick, 1000);
  });
}

// --- Acciones ----------------------------------------------------------------

// Atajo global de inicio (cuando NO se está grabando): pulsar Grabar.
window.loom.onShortcut((action) => {
  if (action === 'record' && !setupEl.classList.contains('hidden')) startBtn.click();
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
    livePreview: $('livePreviewChk').checked,
    reelHeadline: {
      text: $('reelHeadlineTxt').value.trim(),
      text2: $('reelHeadlineTxt2').value.trim(),
      fg: $('reelHeadlineFg').value,
      bg: $('reelHeadlineBg').value,
      animate: $('reelHeadlineAnim').checked,
    },
    reelHeadlineOffset: Number($('reelHeadlineOffset').value) / 100,
    reelHeadlinePos: $('reelHeadlinePosSel').value,
    bubbleSizeFrac: Number($('bubbleSizeRange').value) / 100,
    bubbleLocked: $('bubbleLockChk').checked,
  });
});

// Al detener, main muestra el panel y avisa que está exportando.
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

// Resultado final del guardado (lo envía main tras rec-stop).
window.loom.onExportDone((result) => {
  exportingEl.classList.add('hidden');
  setupEl.classList.remove('hidden');
  startBtn.disabled = false;
  if (result.ok) {
    setStatus('✓ Guardado correctamente', 'ok');
    window.loom.revealFile(result.filePath);
  } else {
    setStatus('✗ ' + result.error, 'rec');
  }
  fitWindow();
});

// ---------------------------------------------------------------------------
// Pestañas del panel.
// ---------------------------------------------------------------------------
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
tabButtons.forEach((b) => {
  b.addEventListener('click', () => setActiveTab(b.dataset.tab));
});
{
  const saved = localStorage.getItem('activeTab') || 'capture';
  const safe = (saved === 'reel' && modeSel.value !== 'reel') ? 'capture' : saved;
  setActiveTab(safe);
}
syncReelTabVisibility(modeSel.value);

init();
