# 🚀 Lazy Export v2.0

**Modern Figma plugin for lightning-fast export preset management with production-ready batch directory generation.**

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Figma API](https://img.shields.io/badge/Figma%20API-1.0.0-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React](https://img.shields.io/badge/React-18.2-blue)

---

## ✨ What's New in v2.0

This is a **complete rewrite** from the ground up:

- 🎨 **Modern UI3 Design** - Native Figma aesthetic with automatic Dark Mode support
- ⚡ **Faster UX** - Click presets directly, no dropdown menus
- 🗂️ **Smart Directory Generation** - Export with production-ready folder structures
- 📱 **iOS Metadata** - Auto-generates `Contents.json` for `.imageset` folders
- 🖼️ **WebP & PDF Support** - New export formats for modern workflows
- 💾 **Custom Presets** - Save and reuse your own export configurations
- 🔧 **Built with Vite + React + TypeScript** - Modern developer experience

---

## 🎯 What Does It Do?

**Lazy Export** lets you apply export settings to selected Figma layers with a single click. Perfect for:

- Mobile app developers (iOS & Android)
- Web designers needing multi-density assets
- Teams maintaining design systems
- Anyone tired of manually setting export configs

---

## 🚀 Quick Start

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the plugin in watch mode:
```bash
npm run dev
```

Then in Figma:
1. Go to **Plugins → Development → Import plugin from manifest**
2. Select `dist/manifest.json`
3. Run the plugin from **Plugins → Lazy Export**

### Production Build

```bash
npm run build
```

The built files will be in the `dist/` folder.

---

## 📋 Features

### 🎴 Quick Presets

Click any preset card to instantly apply export settings:

| Preset | Formats | Use Case |
|--------|---------|----------|
| **📱 iOS** | PNG @1x, @2x, @3x | iPhone/iPad apps |
| **🤖 Android** | PNG (6 densities) | Android apps with mdpi/hdpi/xhdpi/etc. |
| **🌐 Web** | SVG + PNG @1x, @2x, @3x | Websites & web apps |
| **🖼️ WebP** | WebP @1x, @2x, @3x | Modern web with next-gen format |
| **📄 PDF** | PDF (vector) | Print assets & scalable exports |

### 🔧 Advanced Mode

Enable **Advanced Mode** to generate production-ready folder structures:

**iOS Example:**
```
icon-home.imageset/
├── Contents.json
├── icon-home@1x.png
├── icon-home@2x.png
└── icon-home@3x.png
```

**Android Example:**
```
drawable-mdpi/icon-home.png
drawable-hdpi/icon-home.png
drawable-xhdpi/icon-home.png
drawable-xxhdpi/icon-home.png
drawable-xxxhdpi/icon-home.png
drawable-ldpi/icon-home.png
```

Just export from Figma and drop the folder directly into Xcode/Android Studio!

### 🏷️ Custom Asset Naming

Enter a custom name (e.g., `icon-home`) and it will be applied to all export suffixes:
- Basic Mode: `/icon-home@2x.png`
- Advanced Mode (iOS): `/icon-home.imageset/icon-home@2x.png`

### 💾 Custom Presets

Create, save, and manage your own export presets:

**Features:**
- Click **"+ Create Custom Preset"** to open the preset builder
- Mix and match formats (PNG, JPG, SVG, PDF, WebP)
- Set custom scales and constraints for each format
- Add custom suffixes and naming conventions
- Edit existing custom presets
- Delete presets you no longer need
- Presets persist across Figma sessions

**Example Use Cases:**
- Create a "Retina Web" preset with just @2x PNG + SVG
- Build a "High-Res Print" preset with PDF + PNG @4x
- Make a "Quick WebP" preset for modern web workflows
- Design team-specific presets for your organization

---

## 🎨 Design Philosophy

### UI3 Aesthetic

This plugin uses **Figma's native CSS variables** for seamless integration:

- `--figma-color-bg` - Background colors
- `--figma-color-text` - Text colors
- `--figma-color-border` - Border styles
- Automatic **Light/Dark mode** support

### Speed First

No dropdowns, no nested menus. Just:
1. Select layers
2. Click preset
3. Done

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build Tool | Vite 5 |
| Plugin API | Figma API v1.0.0 |
| Bundler | esbuild (plugin) + Vite (UI) |

---

## 📂 Project Structure

```
lazy-export/
├── src/
│   ├── ui/                # React UI (rendered in iframe)
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── styles/
│   ├── plugin/            # Figma plugin sandbox code
│   │   └── main.ts
│   └── shared/            # Shared types & presets
│       ├── types.ts
│       └── presets.ts
├── dist/                  # Build output
│   ├── code.js           # Compiled plugin
│   ├── index.html        # UI bundle
│   └── manifest.json     # Figma manifest
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🤝 Contributing

Found a bug or have a feature request?

1. **Open an issue** on GitHub
2. **Submit a Pull Request** with your improvements

All contributions welcome! This is a learning project, so questions are encouraged.

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🙏 Acknowledgments

- Built with [Figsvelte](https://github.com/thomas-lowry/figsvelte) (original boilerplate)
- Inspired by Sketch's export presets feature
- Redesigned for the modern Figma workflow

---

## 📚 Learn More

- [Figma Plugin API Documentation](https://www.figma.com/plugin-docs/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)

---

**Made with ❤️ for the Figma community**

*v2.0.0 - December 2025*
