// This plugin prompts the user to enter a number and creates that many rectangles on the screen.
const __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step(
        (generator = generator.apply(
          thisArg,
          _arguments || []
        )).next()
      );
    });
  };

// Show the HTML page in "ui.html" with the specified width and height.
figma.showUI(__html__, { width: 200, height: 340 });

// Define callback for handling messages from the UI.
// Callback will be passed the "pluginMessage" property of the posted message.
figma.ui.onmessage = (msg) => {
  // Check the message type and apply settings accordingly.
  if (msg.type === 'applySettings') {
    // Get the current selection on the Figma page.
    const { selection } = figma.currentPage;
    // Initialize an empty array for settings.
    let settings = [];

    // Define helper function to check if the selection contains valid nodes.
    function hasValidSelection(nodes) {
      return nodes || nodes.length === 0;
    }

    // Define iOS, Android, and Web settings.
    const settingsIOS = [
      {
        format: 'PNG',
        suffix: '@3x',
        constraint: { type: 'SCALE', value: 3 },
      },
      {
        format: 'PNG',
        suffix: '@2x',
        constraint: { type: 'SCALE', value: 2 },
      },
      {
        format: 'PNG',
        suffix: '@1x',
        constraint: { type: 'SCALE', value: 1 },
      },
    ];
    const settingsAndroid = [
      {
        format: 'PNG',
        suffix: '/XXXHDPI',
        constraint: { type: 'SCALE', value: 4 },
      },
      {
        format: 'PNG',
        suffix: '/XXHDPI',
        constraint: { type: 'SCALE', value: 3 },
      },
      {
        format: 'PNG',
        suffix: '/XHDPI',
        constraint: { type: 'SCALE', value: 2 },
      },
      {
        format: 'PNG',
        suffix: '/HDPI',
        constraint: { type: 'SCALE', value: 1.5 },
      },
      {
        format: 'PNG',
        suffix: '/LDPI',
        constraint: { type: 'SCALE', value: 0.75 },
      },
      {
        format: 'PNG',
        suffix: '/MDPI',
        constraint: { type: 'SCALE', value: 1 },
      },
    ];
    const settingsWeb = [
      {
        format: 'SVG',
        suffix: '',
        svgOutlineText: true,
        svgIdAttribute: false,
        svgSimplifyStroke: true,
      },
      {
        format: 'PNG',
        suffix: '@3x',
        constraint: { type: 'SCALE', value: 3 },
      },
      {
        format: 'PNG',
        suffix: '@2x',
        constraint: { type: 'SCALE', value: 2 },
      },
      {
        format: 'PNG',
        suffix: '@1x',
        constraint: { type: 'SCALE', value: 1 },
      },
    ];

    // Apply platform-specific settings based on the received message.
    if (msg.platform === 'IOS') {
      settings = settingsIOS;
      console.log(`2 Fire IOS Settings`);
    } else if (msg.platform === 'Android') {
      settings = settingsAndroid;
      console.log(`2 Fire Android Settings`);
    } else if (msg.platform === 'Web') {
      settings = settingsWeb;
      console.log(`2 Fire Web Settings`);
    }

    // Function to apply settings to the selected Figma elements.
    function main(nodes) {
      return __awaiter(this, void 0, void 0, function* () {
        if (!hasValidSelection(nodes)) {
          return Promise.resolve('No valid selection');
        }
        for (let node of nodes) {
          node.exportSettings = settings;
        }
        return Promise.resolve('Done!');
      });
    }
    main(selection);
  } // End of applySettings logic
  else if (msg.type === 'clearSettings') {
    // Get the current selection on the Figma page.
    const { selection } = figma.currentPage;

    // Define helper function to check if the selection contains valid nodes.
    function hasValidSelectionClear(nodes) {
      return nodes || nodes.length === 0;
    }

    // Initialize an empty array for settings.
    const settings = [];

    // Function to clear settings of the selected Figma elements.
    function mainClear(nodes) {
      return __awaiter(this, void 0, void 0, function* () {
        if (!hasValidSelectionClear(nodes)) {
          return Promise.resolve('No valid selection');
        }
        for (let node of nodes) {
          node.exportSettings = settings;
        }
        return Promise.resolve('Done!');
      });
    }
    console.log(`2 Fire Clear Settings`);
    mainClear(selection);
  }
  // Close the plugin if the message type is "cancel".
  else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
