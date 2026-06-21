# Joom 🎥

Grabador de pantalla + webcam para **Windows**, mínimo y directo. Versión reducida
de Loomcito: solo lo esencial para grabar y presentar, **sin subtítulos, sin
doblaje, sin recorte de silencios y sin ninguna API/clave**.

Construido con **Electron**. La pantalla y la webcam se componen en tiempo real en
un `<canvas>` y se graban con `MediaRecorder`; al detener, `ffmpeg` convierte a MP4
(H.264 + AAC, listo para web).

## Qué hace

- **Tres modos de grabación:**
  - **Pantalla completa** (horizontal) con la webcam como burbuja flotante.
  - **Reel vertical** (9:16, resultado 1080×1920) con la cámara en banda, en
    burbuja o a pantalla completa, y un texto/banner opcional.
  - **Pantalla + cámara vertical** (podcast): la pantalla a la izquierda y la
    cámara vertical a la derecha.
- **Formas de cámara:** círculo, vertical (móvil), horizontal 16:9 o **sin cámara**.
- **Barra de presentación** mientras grabas: puntero **láser**, dibujar
  **rectángulos**, **flechas**, **números** y **confeti** 🎉, con colores y grosor.
- Selector de **calidad** (720p/1080p/1080p60/1440p), **micrófono** y **audio del sistema**.
- Botón para traer la **cámara al frente** y vista previa en vivo opcional.

> Nota: se quitaron a propósito los subtítulos, el doblaje de audio, el recorte de
> silencios, el teleprompter, el banner de nombre, el fondo con márgenes y el
> "cambio de cámara" (cámara a pantalla completa). Tampoco hay ninguna API key.

## Requisitos

- Windows 10 (2004+) o Windows 11
- Node.js 18+
- `ffmpeg` se incluye vía `ffmpeg-static` (con respaldo al `ffmpeg` del PATH)

## Uso

```bash
npm install
npm start
```

La primera vez Windows pedirá permiso para cámara/micrófono.

## Atajos de teclado

| Atajo | Acción |
|---|---|
| `Ctrl+Shift+R` | Grabar / Detener |
| `Ctrl+Shift+P` | Pausar / Reanudar |
| `Ctrl+Shift+A` | Mostrar/ocultar anotaciones |
| `Ctrl+Shift+L` | Activar/desactivar láser |
| `Ctrl+Shift+C` | Confeti 🎉 |

## Compilar un instalador

```bash
npm run dist
```

Genera un instalador NSIS en `dist/` (Windows x64).

## Cómo funciona (arquitectura)

| Ventana | Archivo | Rol |
|---|---|---|
| Panel de control | `renderer/control.*` | Elegir modo/pantalla/cámara/mic, calidad, opciones de reel, botón de grabar |
| Burbuja flotante | `renderer/overlay.*` | Webcam *always-on-top*, arrastrable y redimensionable. `setContentProtection(true)` la excluye de la captura |
| Compositor (oculto) | `renderer/recorder.*` | Compone pantalla + webcam en un canvas, graba con `MediaRecorder`, transmite chunks a disco |
| Barra de grabación | `renderer/recbar.*` | Pausa/detener + herramientas de anotación para presentar |
| Capa de anotaciones | `renderer/annotate.*` | Láser, rectángulos, flechas, números y confeti sobre la pantalla |
| Selector de zona | `renderer/region.*` | Recuadro de pantalla a mostrar en el reel |
| Proceso principal | `main.js` | Ventanas, IPC, fuente de pantalla, transcodificación a MP4 con ffmpeg |

## Salida

Al **Detener** se abre un diálogo para guardar el `.mp4` (por defecto en *Vídeos*).
Audio: micrófono (+ sistema si lo activas). Vídeo: H.264, `yuv420p`, `+faststart`.

## Licencia

MIT — Jairo Carrizales
