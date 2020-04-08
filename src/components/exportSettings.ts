

// ================================
// Export Data Objects
// ================================
// These objects are constants to be used anywhere

// ================
// Default Settings
// ================

// IOS Settings ======
  const defaultSettingsIOS = [
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
  const defaultSettingsAndroid = [
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
  const defaultSettingsWeb = [
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
  
// ================
// Custom Label Settings
// ================

    // Custom Label IOS Settings ======
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
    
    // Custom Label Android Settings ======
    const settingsAndroid = [
      {
        format: "PNG",
        suffix: "drawable-xxxhdpi" + UserEnteredString,
        constraint: { type: "SCALE", value: 4 }
      },
      {
        format: "PNG",
        suffix: "drawable-xxhdpi"  + UserEnteredString,
        constraint: { type: "SCALE", value: 3 }
      },
      {
        format: "PNG",
        suffix: "drawable-xhdpi"  + UserEnteredString,
        constraint: { type: "SCALE", value: 2 }
      },
      {
        format: "PNG",
        suffix: "drawable-hdpi"  + UserEnteredString,
        constraint: { type: "SCALE", value: 1.5 }
      },
      {
        format: "PNG",
        suffix: "drawable-ldpi"  + UserEnteredString,
        constraint: { type: "SCALE", value: 0.75 }
      },
      {
        format: "PNG",
        suffix: "drawable-mdpi"  + UserEnteredString,
        constraint: { type: "SCALE", value: 1 }
      }
    ];
    // Custom Label Web Settings ======
    const settingsWeb = [
      {
        format: "SVG",
        suffix: UserEnteredString,
        svgOutlineText: true,
        svgIdAttribute: false,
        svgSimplifyStroke: true
      },
      { format: "PNG", suffix: "@3x" + UserEnteredString, constraint: { type: "SCALE", value: 3 } },
      { format: "PNG", suffix: "@2x" + UserEnteredString, constraint: { type: "SCALE", value: 2 } },
      { format: "PNG", suffix: "@1x" + UserEnteredString, constraint: { type: "SCALE", value: 1 } }
    ];

// ================
// Advanced Custom Label Settings
// ================

// Adv IOS Settings ======
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
    // Adv Android Settings ======
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