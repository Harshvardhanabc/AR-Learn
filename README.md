# ⬡ AR Smart Learning Platform
### QR-Based 3D Education — No App Download Required

---

## 🚀 Quick Start

1. **Open `index.html`** in any modern browser (Chrome, Edge, Safari)
2. Browse the pre-loaded demo topics or create your own
3. Click **"🔲 QR Code"** on any topic card to see its QR code
4. **Print or display** the QR code — students scan it with their phone camera
5. The AR viewer opens instantly in their browser

---

## 📁 File Structure

```
/ar-learning-platform
├── index.html      ← Teacher dashboard (create topics, generate QR)
├── viewer.html     ← Student AR viewer (Three.js + WebXR)
├── style.css       ← All styles (glassmorphism dark theme)
├── app.js          ← Dashboard logic, topic CRUD, QR modal
├── qr.js           ← QR code utility functions
└── viewer.js       ← Three.js scene, AR/3D rendering, interactions
```

---

## 🎯 Features

### Teacher Dashboard (index.html)
- ✅ Create topics with title, category, grade level, description
- ✅ Choose from 8 built-in procedural 3D models OR enter external GLB URL
- ✅ Add voice explanation text (Text-to-Speech in viewer)
- ✅ Add quiz questions with correct answers
- ✅ Auto-generates unique AR link + QR code
- ✅ Category filter (Biology, Physics, Chemistry, Engineering, Astronomy)
- ✅ Download QR as PNG
- ✅ Share via WhatsApp
- ✅ All data saved to localStorage (no backend needed)

### AR Viewer (viewer.html)
- ✅ WebXR hit-test for real-world surface detection
- ✅ Tap flat surface to place 3D model in AR
- ✅ Fallback to camera background (getUserMedia) if WebXR unavailable
- ✅ Full 3D mode with OrbitControls for non-AR browsers
- ✅ Pinch-to-zoom, drag-to-rotate touch controls
- ✅ Tap model parts → labeled hotspot info popups
- ✅ 🔊 Voice explanation (Web Speech API)
- ✅ 🧩 Interactive quiz with scoring
- ✅ 📸 Screenshot capture
- ✅ 📤 Share: WhatsApp, copy link, native share, mini QR
- ✅ Animated models (orbiting electrons, rotating planets, etc.)

### Built-in 3D Models
| Model | Category | Key Features |
|-------|----------|--------------|
| ❤️ Human Heart | Biology | 4 chambers, aorta, veins, valves |
| 🧠 Human Brain | Biology | Lobes, cerebellum, brain stem |
| 🧬 DNA Helix | Biology/Chemistry | Double helix, base pairs, backbone |
| ⚛️ Atom | Chemistry | Nucleus, protons, animated electrons |
| 🌍 Planet Earth | Geography | Layers (crust to inner core) |
| ☀️ Solar System | Astronomy | Sun + 8 planets with orbit rings |
| ⚙️ Car Engine | Engineering | Block, cylinders, crankshaft |
| 💎 Crystal Lattice | Chemistry | 3×3×3 atom lattice with bonds |

---

## 📱 AR Compatibility

| Browser | AR Support | Notes |
|---------|-----------|-------|
| Chrome (Android) | ✅ Full WebXR | Best experience |
| Samsung Internet | ✅ WebXR | Good support |
| Safari (iOS 15+) | ⚠️ Camera BG | No WebXR yet; uses camera fallback |
| Edge (Android) | ✅ WebXR | Good support |
| Firefox | ⚠️ 3D only | Limited WebXR |
| Desktop Chrome | ⚠️ 3D only | No mobile camera |

**iOS Note:** Safari doesn't support WebXR's `immersive-ar` yet. The app automatically falls back to camera-background 3D mode which still gives an AR-like experience.

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| 3D Rendering | Three.js r128 |
| AR | WebXR Device API (hit-test) |
| QR Code | QRCode.js |
| Camera | getUserMedia (fallback) |
| Voice | Web Speech API |
| Storage | localStorage |
| Fonts | Syne + DM Sans (Google Fonts) |

---

## 🌐 Hosting

To make QR codes work for students (who scan from their phones), the app needs to be served over **HTTPS**. Options:

1. **GitHub Pages** — free, easy, HTTPS automatic
2. **Netlify** — drag-and-drop deploy, free tier
3. **Vercel** — instant deploy from GitHub
4. **Local network** — use a local HTTPS server for classroom testing

### Deploy to GitHub Pages:
```bash
# 1. Create a GitHub repo
# 2. Upload all 5 files
# 3. Go to Settings → Pages → select main branch
# 4. Your URL: https://username.github.io/repo-name/
```

### Local testing with HTTPS:
```bash
# Using npx serve (Node.js required)
npx serve .

# OR using Python
python -m http.server 8080
# Then open http://localhost:8080
# Note: WebXR requires HTTPS — use ngrok for mobile testing
```

---

## 📝 Adding External 3D Models

1. Host your `.glb` file on a CORS-enabled server (Google Drive, GitHub, S3, etc.)
2. In the dashboard, select **"🔗 External URL"** tab
3. Paste the direct `.glb` URL
4. The viewer will load it via Three.js GLTFLoader

**Free GLB model sources:**
- Sketchfab (many free models)
- Google Poly archive
- Three.js examples repository
- NASA 3D Resources (nasa3d.arc.nasa.gov)

---

## 🏫 Classroom Workflow

```
Teacher                          Students
  │                                 │
  ├─ Open index.html                │
  ├─ Add topic "Mitosis"            │
  ├─ Add description + quiz         │
  ├─ Click "Generate AR Topic + QR" │
  ├─ Download QR image              │
  │                                 │
  ├─ Print QR → paste in worksheet  │
  │                                 │
  │         ← student gets worksheet│
  │                                 ├─ Open camera
  │                                 ├─ Scan QR code
  │                                 ├─ Browser opens viewer.html
  │                                 ├─ Grant camera permission
  │                                 ├─ Point at desk surface
  │                                 ├─ Tap to place 3D model
  │                                 ├─ Explore hotspots
  │                                 ├─ Listen to voice explanation
  │                                 └─ Complete quiz
```

---

## ⚙️ Customization

### Add a new model category:
In `app.js`, add to `CATEGORY_COLORS`:
```js
mycat: 'cat-mycat'
```
In `style.css`, add:
```css
.cat-mycat { background: rgba(255,100,100,0.12); color: #ff8888; }
```

### Add a new built-in model:
In `viewer.js`, add to `MODEL_BUILDERS`:
```js
mycell: (scene) => {
  const group = new THREE.Group();
  // ... add Three.js meshes
  return group;
}
```

### Customize colors/theme:
Edit CSS variables in `style.css`:
```css
:root {
  --accent: #63e8b6;      /* change teal to your color */
  --accent-2: #7c6ff7;    /* secondary accent */
  --bg: #080c14;          /* background color */
}
```

---

## 📄 License

MIT License — free to use, modify, and distribute for educational purposes.

---

*Built with ❤️ using Three.js, WebXR, and vanilla JS — no frameworks, no build tools, no app downloads.*
