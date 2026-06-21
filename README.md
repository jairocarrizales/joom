# Joom 🎥

Grabador de **pantalla + cámara para Windows**, pensado para crear contenido:
grabaciones horizontales, **reels verticales** y modo **podcast**, con barra de
**anotaciones** para presentar, **teleprompter**, inserción de **video o
presentaciones** en los reels y **subtítulos automáticos** con IA.

Construido con **Electron**. La pantalla y la cámara se componen en tiempo real en
un `<canvas>` y se graban con `MediaRecorder`; al detener, `ffmpeg` exporta a **MP4**
(H.264 + AAC, listo para redes/web).

## ✨ Funciones

### Modos de grabación
- **Pantalla completa** (horizontal) con la cámara como **burbuja flotante** (movible y redimensionable).
- **Reel vertical** (9:16, salida 1080×1920) con varios diseños:
  - **Solo cámara** (100%).
  - **Video arriba / abajo + cámara**: inserta un video de **YouTube** (lo descarga), un **video de tu PC**, una **presentación PDF/PowerPoint** o **Google Slides**.
  - **Pantalla arriba / abajo + cámara**: tu pantalla en una banda, con **zoom en vivo** para resaltar detalles.
- **Podcast** (pantalla + cámara vertical): pantalla a alto completo y cámara vertical al lado; la cámara se puede **alejar/acercar** y desplazar.

### Cámara
- Formas: **círculo**, **vertical** (móvil), **horizontal 16:9** o **sin cámara**.
- **Zoom** de cámara (acercar/alejar), borde blanco opcional.

### Barra de presentación (mientras grabas)
- Puntero **láser**, dibujar **rectángulos**, **flechas**, **números** y **confeti** 🎉 (con colores y grosor).
- **Teleprompter** flotante (guion desplazable) que no aparece en el video.

### Video / presentaciones en el reel (controlable mientras grabas)
- **Video** (YouTube o de tu PC): **pausar/reanudar** y **regresar 10 s**, con su audio incluido.
- **Presentaciones** (PDF, PowerPoint o Google Slides): pasar diapositivas con **‹ anterior / siguiente ›** (una a la vez). El PowerPoint se convierte a PDF usando el PowerPoint instalado.
- **Pantalla en banda**: **zoom y desplazamiento** en vivo (rueda/arrastre o botones) para resaltar un detalle.

### Subtítulos automáticos (con IA)
- Transcripción con **Groq** (Whisper `whisper-large-v3`) con **tiempos por palabra**.
- **~32 estilos** (POP/Reel, palabra, caja, manuscrita, DIN colores, disruptivos, clásico…), quemados en el video.
- Opción de **corregir palabras** con un LLM de Groq.
- Solo necesitas tu **API key de Groq** (gratuita) en la pestaña *Subtítulos*; se guarda en tu equipo.

### Otros
- Selector de **calidad** (720p / 1080p / 1080p60 / 1440p), **micrófono** y **audio del sistema**.
- **Modo captura** (`Ctrl+Shift+S`): Joom se oculta de tus grabaciones por defecto; este modo lo hace visible temporalmente para que puedas tomar **capturas de pantalla** de la app.

## 🎬 La barra de grabación

Al grabar aparece una **barra flotante** con los controles (no sale en el video).

**Compacta:**

![Barra compacta](docs/barra-compacta.png)

`⏱` tiempo · **⏸** pausar · **⏹** detener · **⬆️** traer la cámara al frente · **✏️** abrir anotaciones.

**Abierta** (herramientas para presentar):

![Barra abierta](docs/barra-abierta.png)

**⦿** láser · **▭** rectángulo · **→** flecha · **①** números · **✦** confeti · grosor de línea · **colores** · **🗑️** borrar.

En reels con **video / presentación / pantalla** aparecen además sus controles: ◀◀/⏸ del video, **‹ / ›** para pasar diapositivas, o **🔍− / 🔍+** para el zoom de la pantalla.

## ✅ Requisitos

- **Windows 10 (2004+) o Windows 11**
- **Node.js 18+**
- `ffmpeg` incluido vía `ffmpeg-static` (con respaldo al del PATH).
- Para **subtítulos**: una API key gratuita de Groq (console.groq.com).
- Para **PowerPoint → PDF**: tener PowerPoint instalado.
- Para **YouTube**: `yt-dlp` (`pip install yt-dlp`).

## 🚀 Uso

```bash
npm install
npm start
```

La primera vez Windows pedirá permiso para cámara/micrófono.

## ⌨️ Atajos de teclado

| Atajo | Acción |
|---|---|
| `Ctrl+Shift+R` | Grabar / Detener |
| `Ctrl+Shift+P` | Pausar / Reanudar |
| `Ctrl+Shift+A` | Mostrar/ocultar anotaciones |
| `Ctrl+Shift+L` | Activar/desactivar láser |
| `Ctrl+Shift+C` | Confeti 🎉 |
| `Ctrl+Shift+S` | Modo captura (para tomar screenshots de Joom) |

## 📦 Compilar un instalador

```bash
npm run dist
```

Genera un instalador **NSIS** en `dist/` (Windows x64).

## 🧩 Arquitectura

| Ventana | Archivo | Rol |
|---|---|---|
| Panel de control | `renderer/control.*`, `renderer/subs.js` | Modo, pantalla, cámara, mic, calidad, reel, subtítulos |
| Burbuja flotante | `renderer/overlay.*` | Cámara *always-on-top*, arrastrable; excluida de la captura |
| Compositor (oculto) | `renderer/recorder.*` | Compone pantalla/cámara/video/diapositivas y graba con `MediaRecorder` |
| Barra de grabación | `renderer/recbar.*` | Pausar/detener, anotaciones y controles de video/diapositivas/zoom |
| Capa de anotaciones | `renderer/annotate.*` | Láser, rectángulos, flechas, números y confeti |
| Teleprompter | `renderer/teleprompter.*` | Guion desplazable flotante |
| Selector de zona | `renderer/region.*` | Recuadro de pantalla |
| Subtítulos | `subs-ass.js` | Generador de los estilos `.ass` |
| Proceso principal | `main.js` | Ventanas, IPC, ffmpeg, Groq, yt-dlp, servidor local |

## 💾 Salida

Al **Detener** se abre un diálogo para guardar el `.mp4` (por defecto en *Vídeos*).
Vídeo: H.264, `yuv420p`, `+faststart`. Audio: micrófono (+ sistema y/o audio del video si aplica).
Los subtítulos crean una copia `…-subs.mp4`.

## 📬 Contacto

**Jairo Carrizales** — WhatsApp: **+52 8261582103**

## Licencia

MIT — Jairo Carrizales
