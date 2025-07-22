# Lazy Export

Lazy Export is a powerful Figma plugin designed to streamline the export process for different platforms (iOS, Android, Web) by providing preset options and advanced export settings. With Lazy Export, users can easily manage and apply export settings to selected elements on the artboard, saving time and effort during the design-to-development workflow.

## Key Features

*   **Export Type Presets**: Lazy Export allows users to set export type presets for iOS, Android, and Web. By selecting a preset, users can quickly define the export format, resolutions, and other relevant settings tailored to each platform.

*   **Advanced Export**: For iOS and Android exports, Lazy Export includes an advanced export option. When enabled, it automatically generates a nested file path for the export settings prefix. This feature assists in organizing artwork within a folder structure, enhancing overall design asset management for complex projects.

*   **Custom Presets**: Users have the flexibility to create and save their own export presets. These custom presets are conveniently stored and can be easily accessed later, providing a personalized and efficient export experience.

*   **Artboard Element Settings**: Lazy Export simplifies the process of applying export settings to selected elements on the artboard. By specifying the desired presets or custom settings, users can instantly update the export parameters for the selected elements, reducing repetitive actions and improving productivity.

*   **Searchable Preset Path**: All default presets in Lazy Export are labeled with searchable paths within Figma. This unique feature allows users to quickly access presets by using the search functionality. For example, searching for "Lazy Export / iOS" will automatically apply the iOS preset to the selected elements, ensuring effortless and rapid customization.

## How to Use

1.  **Open the Plugin**: Select the elements you want to export, then open the Lazy Export plugin.
2.  **Select a Platform**: Choose between iOS, Android, or Web presets.
3.  **Apply Settings**: Click "Apply Export Settings" to apply the preset to your selection.
4.  **Advanced Export**: Toggle the "Advanced Export" switch to enable nested folder paths for iOS and Android.
5.  **Custom Presets**: Save your current settings as a custom preset by giving it a name and clicking "Save Preset".
6.  **Search Presets**: Quickly find your custom presets using the search bar.

## Development

This plugin is built with Svelte and TypeScript. To get started with development:

```bash
npm install
npm run dev
```

To build the plugin:

```bash
npm run build
```