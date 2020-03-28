const { command } = figma;
const menuTrigger = command;
console.log("Firing " + menuTrigger + " from menu");
// This plugin will open a modal to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser enviroment (see documentation).

// TODO This code doesnt work
// figma.showUI(__html__, { visible: false });
// if (figma.command == "applyIOS") {
//   console.log(`1 Fire Apply IOS Menu`);
//   figma.closePlugin("Done!");
// }

if (menuTrigger !== "openPlugin") {
  let menuSettings = [];
  // IOS Settings ======
  const menuSettingsIOS = [
    {
      format: "PNG",
      suffix: " @3x",
      constraint: { type: "SCALE", value: 3 }
    },
    {
      format: "PNG",
      suffix: " @2x",
      constraint: { type: "SCALE", value: 2 }
    },
    {
      format: "PNG",
      suffix: " @1x",
      constraint: { type: "SCALE", value: 1 }
    }
  ];
  // Android Settings ======
  const MenuSettingsAndroid = [
    {
      format: "PNG",
      suffix: " drawable-xxxhdpi",
      constraint: { type: "SCALE", value: 4 }
    },
    {
      format: "PNG",
      suffix: " drawable-xxhdpi",
      constraint: { type: "SCALE", value: 3 }
    },
    {
      format: "PNG",
      suffix: " drawable-xhdpi",
      constraint: { type: "SCALE", value: 2 }
    },
    {
      format: "PNG",
      suffix: " drawable-hdpi",
      constraint: { type: "SCALE", value: 1.5 }
    },
    {
      format: "PNG",
      suffix: " drawable-ldpi",
      constraint: { type: "SCALE", value: 0.75 }
    },
    {
      format: "PNG",
      suffix: " drawable-mdpi",
      constraint: { type: "SCALE", value: 1 }
    }
  ];
  // Web Settings ======
  const MenuSettingsWeb = [
    {
      format: "SVG",
      suffix: "",
      svgOutlineText: true,
      svgIdAttribute: false,
      svgSimplifyStroke: true
    },
    { format: "PNG", suffix: " @3x", constraint: { type: "SCALE", value: 3 } },
    { format: "PNG", suffix: " @2x", constraint: { type: "SCALE", value: 2 } },
    { format: "PNG", suffix: " @1x", constraint: { type: "SCALE", value: 1 } }
  ];
  const { selection } = figma.currentPage;
  function hasValidSelectionMenu(nodes) {
    return nodes || nodes.length === 0;
  }
  let closingType = "";
  if (menuTrigger === "applyIOS") {
    menuSettings = menuSettingsIOS;
    console.log(`2 Fire Menu IOS Settings`);
    closingType = "IOS";
  }
  // Sets Android Export
  if (menuTrigger === "applyAndroid") {
    menuSettings = MenuSettingsAndroid;
    console.log(`2 Fire Menu Android Settings`);
    closingType = "Android";
  }
  // Sets Web Export
  if (menuTrigger === "applyWeb") {
    menuSettings = MenuSettingsWeb;
    console.log(`2 Fire Menu Web Settings`);
    closingType = "Web";
  }
  if (menuTrigger === "clearExport") {
    menuSettings = [];
    console.log(`2 Clear Settings`);
    closingType = "Cleared";
  }

  // Applies Settings to Figma Element =================
  async function main(nodes): Promise<string> {
    if (!hasValidSelectionMenu(nodes))
      return Promise.resolve("No valid selection");

    for (let node of nodes) {
      node.exportSettings = menuSettings;
    }

    return Promise.resolve("Done!");
  }

  main(selection);
  let closingMsg = "Settings Applied";
  if (menuTrigger === "clearExport") {
    closingMsg = " Export Settings";
  }

  figma.closePlugin(closingType + closingMsg);
}

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 200, height: 364 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === "applySettings") {
    const { selection } = figma.currentPage;

    function hasValidSelection(nodes) {
      return nodes || nodes.length === 0;
    }
    let settings = [];
    // Importing the User entered string and biding a default value to null
    let UserEnteredString = msg.name;
    if (UserEnteredString === null) {
      UserEnteredString = "default-asset";
    }
    // console.log(msg);

    // IOS Settings ======
    const settingsIOS = [
      {
        format: "PNG",
        suffix: "/" + UserEnteredString + "@3x",
        constraint: { type: "SCALE", value: 3 }
      },
      {
        format: "PNG",
        suffix: "/" + UserEnteredString + "@2x",
        constraint: { type: "SCALE", value: 2 }
      },
      {
        format: "PNG",
        suffix: "/" + UserEnteredString + "@1x",
        constraint: { type: "SCALE", value: 1 }
      }
    ];
    const settingsIOSadv = [
      {
        format: "PNG",
        suffix:
          "/" + UserEnteredString + ".imageset/" + UserEnteredString + "@3x",
        constraint: { type: "SCALE", value: 3 }
      },
      {
        format: "PNG",
        suffix:
          "/" + UserEnteredString + ".imageset/" + UserEnteredString + "@2x",
        constraint: { type: "SCALE", value: 2 }
      },
      {
        format: "PNG",
        suffix:
          "/" + UserEnteredString + ".imageset/" + UserEnteredString + "@1x",
        constraint: { type: "SCALE", value: 1 }
      }
    ];
    // Android Settings ======
    const settingsAndroidAdv = [
      {
        format: "PNG",
        suffix: "/drawable-xxxhdpi/" + UserEnteredString,
        constraint: { type: "SCALE", value: 4 }
      },
      {
        format: "PNG",
        suffix: "/drawable-xxhdpi/" + UserEnteredString,
        constraint: { type: "SCALE", value: 3 }
      },
      {
        format: "PNG",
        suffix: "/drawable-xhdpi/" + UserEnteredString,
        constraint: { type: "SCALE", value: 2 }
      },
      {
        format: "PNG",
        suffix: "/drawable-hdpi/" + UserEnteredString,
        constraint: { type: "SCALE", value: 1.5 }
      },
      {
        format: "PNG",
        suffix: "/drawable-ldpi/" + UserEnteredString,
        constraint: { type: "SCALE", value: 0.75 }
      },
      {
        format: "PNG",
        suffix: "/drawable-mdpi/" + UserEnteredString,
        constraint: { type: "SCALE", value: 1 }
      }
    ];
    const settingsAndroid = [
      {
        format: "PNG",
        suffix: "drawable-xxxhdpi" + UserEnteredString,
        constraint: { type: "SCALE", value: 4 }
      },
      {
        format: "PNG",
        suffix: "drawable-xxhdpi",
        constraint: { type: "SCALE", value: 3 }
      },
      {
        format: "PNG",
        suffix: "drawable-xhdpi",
        constraint: { type: "SCALE", value: 2 }
      },
      {
        format: "PNG",
        suffix: "drawable-hdpi",
        constraint: { type: "SCALE", value: 1.5 }
      },
      {
        format: "PNG",
        suffix: "drawable-ldpi",
        constraint: { type: "SCALE", value: 0.75 }
      },
      {
        format: "PNG",
        suffix: "drawable-mdpi",
        constraint: { type: "SCALE", value: 1 }
      }
    ];
    // Web Settings ======
    const settingsWeb = [
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

    // if statments to apply export settings ===========
    // Sets IOS Export
    if (msg.platform === "IOS") {
      settings = settingsIOS;
      console.log(`2 Fire IOS Settings`);
    }
    if (msg.platform === "IOSadvance") {
      settings = settingsIOSadv;
      console.log(`2 Fire IOS Adv Settings`);
    }
    // Sets Android Export
    if (msg.platform === "Android") {
      settings = settingsAndroid;
      console.log(`2 Fire Android Settings`);
    }
    if (msg.platform === "AndroidAdvance") {
      settings = settingsAndroidAdv;
      console.log(`2 Fire Android Settings`);
    }
    // Sets Web Export
    if (msg.platform === "Web") {
      settings = settingsWeb;
      console.log(`2 Fire Web Settings`);
    }

    // Applies Settings to Figma Element =================
    async function main(nodes): Promise<string> {
      if (!hasValidSelection(nodes))
        return Promise.resolve("No valid selection");

      for (let node of nodes) {
        node.exportSettings = settings;
      }

      return Promise.resolve("Done!");
    }

    main(selection);
  } // Clear Logic
  else if (msg.type === "clearSettings") {
    // Applies Settings to Figma Element =================
    // TODO componitize this with the function above. ++++++++
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
    console.log(`2 Fire Clear Settings`);
    mainClear(selection);
  } // Cancel == Close Plugin
  else if (msg.type === "cancel") {
    figma.closePlugin();
  }

  // else if (msg.shape === "triangle") {
  //   shape = figma.createPolygon();
  // } else {
  //   shape = figma.createEllipse();
  // }
  if (msg.platform === undefined) {
    figma.notify("Cleared Export Settings");
  } else {
    figma.notify(msg.platform + " Export Settings Applied");
  }
};

// Make sure to close the plugin when you're done. Otherwise the plugin will
// keep running, which shows the cancel button at the bottom of the screen.
//   figma.closePlugin();
