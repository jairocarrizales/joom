'use strict';

const cam = document.getElementById('cam');
const bubble = document.querySelector('.bubble');
const handle = document.getElementById('resize');
const cc = document.getElementById('cc');
const ccx = cc.getContext('2d');

let currentCameraId = null;
let stream = null;

// --- Vista previa en canvas (mismo render que la grabación) -------------------
// Las formas "personalizadas" se dibujan en canvas con el módulo compartido para
// que coincidan con el grabado y el borde (color+grosor) funcione en todas.
const CANVAS_SHAPES = ['card', 'pebble', 'shield', 'shield2', 'arch'];
let canvasOn = false, curShape = 'circle', curZoom = 1, canvasRaf = null;
let curBorder = true, curBorderColor = '#ffffff', curBorderPct = 3;

function isCanvasShape(s) { return s.indexOf('corner-') === 0 || CANVAS_SHAPES.includes(s); }

function sizeShapeCanvas() {
  const r = window.devicePixelRatio || 1;
  cc.width = Math.max(2, Math.round(window.innerWidth * r));
  cc.height = Math.max(2, Math.round(window.innerHeight * r));
}

function drawShapeCanvas() {
  if (!canvasOn) { canvasRaf = null; return; }
  const W = cc.width, H = cc.height, vw = cam.videoWidth, vh = cam.videoHeight;
  ccx.clearRect(0, 0, W, H);
  if (vw && vh) {
    const lw = Math.max(1, (curBorderPct / 100) * Math.min(W, H));
    if (curShape.indexOf('corner-') === 0) {
      // Esquina: anclar al borde, centroide + factor de relleno 1.3, borde en la curva.
      const a = window.JoomShapes.cornerArc(curShape, 0, 0, W, H);
      ccx.save();
      ccx.beginPath(); ccx.moveTo(a.ccx, a.ccy); ccx.ellipse(a.ccx, a.ccy, W, H, 0, a.a0, a.a1, false); ccx.closePath();
      ccx.clip();
      const cs = Math.max(W / vw, H / vh) * (curZoom || 1) * 1.3;
      const ox = a.isLeft ? 0.42 * W : 0.58 * W;
      const oy = a.isTop ? 0.42 * H : 0.58 * H;
      ccx.translate(ox, oy); ccx.scale(-1, 1);
      ccx.drawImage(cam, -vw * cs / 2, -vh * cs / 2, vw * cs, vh * cs);
      ccx.restore();
      if (curBorder) {
        ccx.beginPath(); ccx.ellipse(a.ccx, a.ccy, W, H, 0, a.a0, a.a1, false);
        ccx.lineWidth = lw; ccx.strokeStyle = curBorderColor; ccx.stroke();
      }
    } else {
      ccx.save();
      window.JoomShapes.trace(ccx, curShape, 0, 0, W, H);
      ccx.clip();
      const cs = Math.max(W / vw, H / vh) * (curZoom || 1);
      ccx.translate(W / 2, H / 2); ccx.scale(-1, 1);
      ccx.drawImage(cam, -vw * cs / 2, -vh * cs / 2, vw * cs, vh * cs);
      ccx.restore();
      if (curBorder) {
        window.JoomShapes.trace(ccx, curShape, lw / 2, lw / 2, W - lw, H - lw);
        ccx.lineWidth = lw; ccx.strokeStyle = curBorderColor; ccx.lineJoin = 'round'; ccx.stroke();
      }
    }
  }
  canvasRaf = requestAnimationFrame(drawShapeCanvas);
}

function startShapeCanvas() {
  canvasOn = true; sizeShapeCanvas();
  if (!canvasRaf) canvasRaf = requestAnimationFrame(drawShapeCanvas);
}
function stopShapeCanvas() {
  canvasOn = false;
  if (canvasRaf) { cancelAnimationFrame(canvasRaf); canvasRaf = null; }
}
window.addEventListener('resize', () => { if (canvasOn) sizeShapeCanvas(); });

// Abrir/cambiar la webcam.
async function startCamera(id) {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  const res = { width: { ideal: 1920 }, height: { ideal: 1080 } };
  const constraints = {
    audio: false,
    video: id ? { deviceId: { exact: id }, ...res } : res,
  };
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    cam.srcObject = stream;
    currentCameraId = id;
  } catch (e) {
    bubble.innerHTML =
      '<div style="color:#fff;padding:20px;text-align:center;font:13px -apple-system">No se pudo abrir la cámara</div>';
  }
}

// Configuración (forma + borde + cámara) desde el proceso principal.
window.loom.onOverlayConfig(({ cameraId, shape, border, zoom, borderColor, borderWidth }) => {
  curShape = shape;
  curZoom = zoom || 1;
  curBorder = border !== false;
  if (typeof borderColor === 'string') curBorderColor = borderColor;
  if (typeof borderWidth === 'number') curBorderPct = borderWidth;
  const onCanvas = isCanvasShape(shape);
  const feather = shape === 'feather';
  // Clases CSS solo para las formas simples (las personalizadas van por canvas).
  bubble.classList.toggle('vertical', shape === 'vertical');
  bubble.classList.toggle('wide', shape === 'wide');
  bubble.classList.toggle('feather', feather);
  bubble.classList.toggle('circle', shape === 'circle');
  bubble.classList.toggle('canvasmode', onCanvas);
  cam.style.transform = `scaleX(-1) scale(${zoom || 1})`;
  // Borde: en canvas lo dibuja el propio canvas; en formas simples, borde CSS.
  if (onCanvas) {
    bubble.style.border = '';
  } else if (curBorder && !feather) {
    const bw = Math.max(1, (curBorderPct / 100) * Math.min(window.innerWidth, window.innerHeight));
    bubble.style.border = `${bw}px solid ${curBorderColor}`;
  } else {
    bubble.style.border = 'none';
  }
  if (onCanvas) startShapeCanvas(); else stopShapeCanvas();
  if (cameraId !== currentCameraId) startCamera(cameraId);
});

// --- Redimensionado con el asa ----------------------------------------------

let resizing = false;
let startScreenX = 0;
let startSize = 0;
let pending = null;

handle.addEventListener('mousedown', (e) => {
  e.preventDefault();
  resizing = true;
  startScreenX = e.screenX;
  startSize = window.innerWidth;
});

window.addEventListener('mousemove', (e) => {
  if (!resizing) return;
  const newSize = startSize + (e.screenX - startScreenX);
  if (pending) return;
  pending = requestAnimationFrame(() => {
    pending = null;
    window.loom.resizeOverlay(newSize);
  });
});

window.addEventListener('mouseup', () => {
  resizing = false;
});
