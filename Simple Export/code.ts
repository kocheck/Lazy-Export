figma.showUI(__html__);

figma.ui.onmessage = msg => {
  // IOS Export ==========================
  if (msg.type === "set-ios") {
    const { selection } = figma.currentPage;

    function hasValidSelection(nodes) {
      return nodes || nodes.length === 0;
    }

    const settings = [
      { format: "PNG", suffix: "@3x", constraint: { type: "SCALE", value: 3 } },
      { format: "PNG", suffix: "@2x", constraint: { type: "SCALE", value: 2 } },
      { format: "PNG", suffix: "@1x", constraint: { type: "SCALE", value: 1 } }
    ];

    async function main(nodes): Promise<string> {
      if (!hasValidSelection(nodes))
        return Promise.resolve("No valid selection");

      for (let node of nodes) {
        node.exportSettings = settings;
      }

      return Promise.resolve("Done!");
    }

    main(selection);
  }
  // Android Export ==========================
  else if (msg.type === "set-android") {
    const { selection } = figma.currentPage;

    function hasValidSelectionAndroid(nodes) {
      return nodes || nodes.length === 0;
    }

    const settings = [
      {
        format: "PNG",
        suffix: "/XXXHDPI",
        constraint: { type: "SCALE", value: 4 }
      },
      {
        format: "PNG",
        suffix: "/XXHDPI",
        constraint: { type: "SCALE", value: 3 }
      },
      {
        format: "PNG",
        suffix: "/XHDPI",
        constraint: { type: "SCALE", value: 2 }
      },
      {
        format: "PNG",
        suffix: "/HDPI",
        constraint: { type: "SCALE", value: 1.5 }
      },
      {
        format: "PNG",
        suffix: "/LDPI",
        constraint: { type: "SCALE", value: 0.75 }
      },
      {
        format: "PNG",
        suffix: "/MDPI",
        constraint: { type: "SCALE", value: 1 }
      }
    ];

    async function mainAndroid(nodes): Promise<string> {
      if (!hasValidSelectionAndroid(nodes))
        return Promise.resolve("No valid selection");

      for (let node of nodes) {
        node.exportSettings = settings;
      }

      return Promise.resolve("Done!");
    }

    mainAndroid(selection);
  }
  // Icon Export ==========================
  else if (msg.type === "set-SVG") {
    const { selection } = figma.currentPage;

    function hasValidSelectionIcon(nodes) {
      return nodes || nodes.length === 0;
    }

    const settings = [
      {
        format: "SVG",
        suffix: "",
        svgOutlineText: true,
        svgIdAttribute: false,
        svgSimplifyStroke: true
      },
      { format: "PNG", suffix: "@3x", constraint: { type: "SCALE", value: 3 } },
      { format: "PNG", suffix: "@2x", constraint: { type: "SCALE", value: 2 } },
      { format: "PNG", suffix: "@1x", constraint: { type: "SCALE", value: 1 } }
    ];

    async function mainIcon(nodes): Promise<string> {
      if (!hasValidSelectionIcon(nodes))
        return Promise.resolve("No valid selection");

      for (let node of nodes) {
        node.exportSettings = settings;
      }

      return Promise.resolve("Done!");
    }

    mainIcon(selection);
  }
  // Export Clear ==========================
  else if (msg.type === "set-clear") {
    const { selection } = figma.currentPage;

    function hasValidSelectionClear(nodes) {
      return nodes || nodes.length === 0;
    }

    const settings = [];

    async function mainClear(nodes): Promise<string> {
      if (!hasValidSelectionClear(nodes))
        return Promise.resolve("No valid selection");

      for (let node of nodes) {
        node.exportSettings = settings;
      }

      return Promise.resolve("Done!");
    }

    mainClear(selection);
  }

  // figma.closePlugin();
};

// Special Thanks to https://github.com/brianlovin for letting me tear apart his `figma-ios-export-settings` plugin. I was able to learn how to undersrtand how these functions work.
