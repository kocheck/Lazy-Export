# ⚡ Lazy Export v2.0

**For the designer who has better things to do than click "Export" 50 times.**

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Vibe](https://img.shields.io/badge/vibe-impeccable-purple)
![React](https://img.shields.io/badge/built%20with-React-61dafb)

---

## 💅 What is this?

You know that feeling when you have to export assets for iOS, Android, and Web, and you have to manually configure the suffixes, scales, and folders for **every single layer**?

Yeah, we hate that too.

**Lazy Export** does it for you. One click. Boom. Done. Go get a coffee. ☕

---

## ✨ Features (The Good Stuff)

### 🎴 One-Click Presets
Click a card, get your settings. No dropdowns, no "Advanced Settings" modals (unless you want them).

| Preset | Vibe | What it does |
|:-------|:-----|:-------------|
| **📱 iOS** | Clean | @1x, @2x, @3x PNGs. Standard. |
| **🤖 Android** | Thorough | All the drawables (mdpi to xxxhdpi). |
| **🌐 Web** | Sharp | SVG + PNGs. Crisp edges. |
| **📄 PDF** | Vector | For when pixels aren't enough. |

### ⚡ Quick Actions (Speed Mode)
Don't even open the plugin window. Just hit `Cmd + /` (or `Cmd + P`) and type:
- `Lazy Export: Apply iOS`
- `Lazy Export: Apply Android`
- `Lazy Export: Apply Web`
- `Lazy Export: Apply PDF`

It applies the settings instantly. It’s almost *too* fast.

### 🧠 Advanced Mode (Production Ready)
Turn this switch on to generate **actual folder structures** for your developers. They will love you for this.

- **iOS**: Generates `.imageset` folders with `Contents.json` (you can copy the JSON from the success toast!).
- **Android**: Generates `drawable-mdpi`, `drawable-hdpi` folders etc.

### 💾 Custom Presets
Make your own. Save them. usage them.
Create that specific "Marketing Header @2x JPG" preset you always need.

---

## 🛠️ For Developers (The Techy Stuff)

We rebuilt this entire thing in **React 18 + Vite**. No more legacy code. It's fast, modular, and actually pleasant to work on.

### Installation

1. Clone this repo.
2. `npm install`
3. `npm run dev` (watches for changes, hot reloads UI)

### ⚠️ IMPORTANT: Loading the Plugin

When importing into Figma, point to:
👉 **`dist/manifest.json`** 👈

(Not the public folder. We moved it. It's better this way.)

### Architecture

```
src/
 ├── ui/          # React app (The pretty part)
 ├── plugin/      # Figma sandbox (The brain)
 │   ├── main.ts  #   Thin entry shim — registers listeners and calls initPlugin()
 │   └── core.ts  #   All plugin logic: handleUIMessage() and its cases
 └── shared/      # Shared types (The glue)
```

We communicate via `postMessage`. It's classic iframe architecture, but cleaner.

---

## 🤝 Contributing

Found a bug? Want to add a "Smart Watch" preset?
Open a PR. We love PRs.

Check [CONTRIBUTING.md](CONTRIBUTING.md) for the rules of the road.

---

**Made with ❤️ (and caffeine) for the Figma community.**
*v2.0.0 - June 2026*
