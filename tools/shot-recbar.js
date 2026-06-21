'use strict';
// Genera capturas de la barra de grabación (compactada y abierta) usando
// webContents.capturePage (no depende de la captura de pantalla del SO).
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Handlers mínimos para que recbar.js no lance al invocar IPC.
ipcMain.handle('annot-toggle', () => true);
ipcMain.on('recbar-resize', () => {});
ipcMain.on('raise-camera', () => {});

const OUT = path.join(__dirname, '..', 'docs');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  try { fs.mkdirSync(OUT, { recursive: true }); } catch (_) {}
  const win = new BrowserWindow({
    width: 1200, height: 90, x: 50, y: 50,
    frame: false, transparent: true, hasShadow: false, show: false,
    webPreferences: { preload: path.join(__dirname, '..', 'preload.js'), contextIsolation: true, sandbox: true },
  });
  await win.loadFile(path.join(__dirname, '..', 'renderer', 'recbar.html'));
  win.showInactive();
  await sleep(600);

  const rectOf = () => win.webContents.executeJavaScript(
    "(()=>{const r=document.getElementById('inner').getBoundingClientRect();" +
    "return {x:Math.max(0,Math.floor(r.x)),y:Math.max(0,Math.floor(r.y))," +
    "width:Math.ceil(r.width),height:Math.ceil(r.height)};})()"
  );

  // 1) Compactada
  let r = await rectOf();
  let img = await win.webContents.capturePage(r);
  fs.writeFileSync(path.join(OUT, 'barra-compacta.png'), img.toPNG());

  // 2) Abierta (anotaciones desplegadas: láser, rectángulo, flecha, números, confeti…)
  await win.webContents.executeJavaScript("document.getElementById('annToggle').click()");
  await sleep(500);
  r = await rectOf();
  img = await win.webContents.capturePage(r);
  fs.writeFileSync(path.join(OUT, 'barra-abierta.png'), img.toPNG());

  console.log('OK', OUT);
  app.quit();
});
