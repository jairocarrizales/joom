'use strict';

const $ = (id) => document.getElementById(id);
const timeEl = $('time');
const pauseBtn = $('pause');
const stopBtn = $('stop');
const annToggle = $('annToggle');
const annTools = $('annTools');
const toolBtns = annTools.querySelectorAll('.atool');
const swatches = annTools.querySelectorAll('.sw');
const thickBtns = annTools.querySelectorAll('.thick');

let seconds = 0;
let paused = false;
let annOpen = false;

function fmt(s) {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
}
setInterval(() => { if (!paused) { seconds += 1; timeEl.textContent = fmt(seconds); } }, 1000);

let activeTool = 'none';

// Ajustar el ancho de la ventana al contenido real (compacta / expandida).
function requestResize() {
  requestAnimationFrame(() => {
    const w = Math.ceil($('inner').getBoundingClientRect().width) + 2;
    window.loom.recbarResize(w);
  });
}

pauseBtn.addEventListener('click', () => {
  paused = !paused;
  if (paused) { window.loom.pauseRecording(); pauseBtn.textContent = '▶'; pauseBtn.classList.add('active'); }
  else { window.loom.resumeRecording(); pauseBtn.textContent = '⏸'; pauseBtn.classList.remove('active'); }
});

stopBtn.addEventListener('click', () => { window.loom.stopRecording(); });

// Traer la burbuja de la cámara al frente (si quedó tapada).
$('raise').addEventListener('click', () => { window.loom.raiseCamera(); });

function setAnn(open) {
  annOpen = open;
  annTools.classList.toggle('hidden', !open);
  annToggle.classList.toggle('active', open);
  window.loom.annotToggle(open); // muestra/oculta la capa de dibujo
  requestResize();
}
annToggle.addEventListener('click', () => setAnn(!annOpen));

// Herramientas alternables: clic para activar, clic de nuevo para desactivar.
toolBtns.forEach((b) => b.addEventListener('click', () => {
  const t = b.dataset.tool;
  if (activeTool === t) {
    activeTool = 'none';
    b.classList.remove('active');
    window.loom.annotTool('none');
  } else {
    activeTool = t;
    toolBtns.forEach((x) => x.classList.toggle('active', x === b));
    window.loom.annotTool(t);
  }
}));
// El color cambia el trazo; con la herramienta Números, cambia el fondo del círculo.
swatches.forEach((b) => b.addEventListener('click', () => {
  swatches.forEach((x) => x.classList.remove('active'));
  b.classList.add('active');
  if (activeTool === 'number') window.loom.annotNumBg(b.dataset.color);
  else window.loom.annotColor(b.dataset.color);
}));
thickBtns.forEach((b) => b.addEventListener('click', () => {
  thickBtns.forEach((x) => x.classList.remove('active'));
  b.classList.add('active');
  window.loom.annotWidth(Number(b.dataset.w));
}));
$('confetti').addEventListener('click', () => window.loom.annotConfetti());
$('clear').addEventListener('click', () => window.loom.annotClearCmd());

// El atajo de láser activa/desactiva la herramienta vía la barra.
window.loom.onSetActiveTool((t) => {
  if (!annOpen) setAnn(true);
  activeTool = t;
  toolBtns.forEach((x) => x.classList.toggle('active', x.dataset.tool === t));
  window.loom.annotTool(t);
});

// Comandos desde atajos globales (main).
window.loom.onRb((cmd) => {
  if (cmd === 'pause') pauseBtn.click();
  else if (cmd === 'stop') stopBtn.click();
  else if (cmd === 'annot') annToggle.click();
});

requestResize();
