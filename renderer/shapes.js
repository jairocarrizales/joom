'use strict';
// Trazo de la silueta de la cámara según la forma. Compartido por el grabador
// (recorder.js) y la vista previa (overlay.js) para que coincidan exactamente.
// Dibuja en `ctx` un path (sin fill/stroke) dentro de la caja (x, y, w, h).
(function () {
  function trace(ctx, shape, x, y, w, h) {
    if (shape === 'vertical' || shape === 'wide') {
      const r = Math.min(w, h) * (shape === 'vertical' ? 0.12 : 0.10);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    } else if (shape === 'card') {
      // Squircle / superelipse (n≈4): esquinas continuas tipo iOS/macOS.
      const cx = x + w / 2, cy = y + h / 2, a = w / 2, b = h / 2;
      const N = 120, p = 2 / 4;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * Math.PI * 2;
        const ct = Math.cos(t), st = Math.sin(t);
        const px = cx + a * Math.sign(ct) * Math.pow(Math.abs(ct), p);
        const py = cy + b * Math.sign(st) * Math.pow(Math.abs(st), p);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (shape === 'pebble') {
      const P = [[0.97, 0.5], [0.7466, 0.8522], [0.3202, 0.945], [0.1196, 0.6236], [0.1016, 0.27], [0.4457, 0.1138], [0.8011, 0.1656]];
      const n = P.length;
      ctx.beginPath();
      ctx.moveTo(x + P[0][0] * w, y + P[0][1] * h);
      for (let i = 0; i < n; i++) {
        const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
        const c1x = x + (p1[0] + (p2[0] - p0[0]) / 6) * w, c1y = y + (p1[1] + (p2[1] - p0[1]) / 6) * h;
        const c2x = x + (p2[0] - (p3[0] - p1[0]) / 6) * w, c2y = y + (p2[1] - (p3[1] - p1[1]) / 6) * h;
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, x + p2[0] * w, y + p2[1] * h);
      }
      ctx.closePath();
    } else if (shape === 'shield') {
      const X = (u) => x + u * w, Y = (v) => y + v * h;
      ctx.beginPath();
      ctx.moveTo(X(0.10), Y(0.12));
      ctx.bezierCurveTo(X(0.30), Y(0.07), X(0.70), Y(0.07), X(0.90), Y(0.12));
      ctx.bezierCurveTo(X(0.95), Y(0.42), X(0.82), Y(0.80), X(0.50), Y(0.96));
      ctx.bezierCurveTo(X(0.18), Y(0.80), X(0.05), Y(0.42), X(0.10), Y(0.12));
      ctx.closePath();
    } else if (shape === 'shield2') {
      const X = (u) => x + u * w, Y = (v) => y + v * h;
      ctx.beginPath();
      ctx.moveTo(X(0.06), Y(0.16));
      ctx.bezierCurveTo(X(0.06), Y(0.07), X(0.11), Y(0.03), X(0.20), Y(0.03));
      ctx.lineTo(X(0.80), Y(0.03));
      ctx.bezierCurveTo(X(0.89), Y(0.03), X(0.94), Y(0.07), X(0.94), Y(0.16));
      ctx.lineTo(X(0.94), Y(0.46));
      ctx.bezierCurveTo(X(0.94), Y(0.74), X(0.76), Y(0.93), X(0.50), Y(0.985));
      ctx.bezierCurveTo(X(0.24), Y(0.93), X(0.06), Y(0.74), X(0.06), Y(0.46));
      ctx.closePath();
    } else if (shape === 'arch') {
      const X = (u) => x + u * w, Y = (v) => y + v * h;
      const archY = 0.435;
      ctx.beginPath();
      ctx.moveTo(X(0), Y(1));
      ctx.lineTo(X(0), Y(archY));
      ctx.ellipse(X(0.5), Y(archY), 0.5 * w, archY * h, 0, Math.PI, 2 * Math.PI, false);
      ctx.lineTo(X(1), Y(1));
      ctx.closePath();
    } else if (shape && shape.indexOf('corner-') === 0) {
      const a = cornerArc(shape, x, y, w, h);
      ctx.beginPath();
      ctx.moveTo(a.ccx, a.ccy);
      ctx.ellipse(a.ccx, a.ccy, w, h, 0, a.a0, a.a1, false);
      ctx.closePath();
    } else {
      const r = Math.min(w, h) / 2;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
      ctx.closePath();
    }
  }

  // Parámetros del arco de una esquina (para recortar y para trazar SOLO la curva
  // del borde, sin los lados rectos que van pegados al borde de la pantalla).
  function cornerArc(shape, x, y, w, h) {
    const isLeft = shape === 'corner-bl' || shape === 'corner-tl';
    const isTop = shape === 'corner-tl' || shape === 'corner-tr';
    const ccx = isLeft ? x : x + w;
    const ccy = isTop ? y : y + h;
    let a0, a1;
    if (isLeft && !isTop) { a0 = -Math.PI / 2; a1 = 0; }
    else if (!isLeft && !isTop) { a0 = Math.PI; a1 = 1.5 * Math.PI; }
    else if (isLeft && isTop) { a0 = 0; a1 = Math.PI / 2; }
    else { a0 = Math.PI / 2; a1 = Math.PI; }
    return { ccx, ccy, a0, a1, isLeft, isTop };
  }

  window.JoomShapes = { trace, cornerArc };
})();
