import importedSettings from './settings.json';

type ExportSettings = {
  menuSettingsIOS: any[];
  menuSettingsIOSadv: any[];
  menuSettingsAndroid: any[];
  menuSettingsAndroidAdv: any[];
  menuSettingsWeb: any[];
};

const settings: ExportSettings = importedSettings as ExportSettings;

const { command } = figma;
const menuTrigger = command;

// Replace these lines with the updated code snippet
const {
  menuSettingsIOS,
  menuSettingsIOSadv: settingsIOSadv, // Rename the variable here
  menuSettingsAndroid,
  menuSettingsAndroidAdv: settingsAndroidAdv, // Rename the variable here
  menuSettingsWeb,
} = settings;
// End of the updated code snippet

console.log('Firing ' + menuTrigger + ' from menu');

if (menuTrigger !== 'openPlugin') {
  let menuSettings = [];
  const { selection } = figma.currentPage;

  function hasValidSelectionMenu(nodes) {
    return nodes && nodes.length > 0;
  }

  let closingType = '';

  switch (menuTrigger) {
    case 'applyIOS':
      menuSettings = menuSettingsIOS;
      console.log('2 Fire Menu IOS Settings');
      closingType = 'IOS';
      break;
    case 'applyAndroid':
      menuSettings = menuSettingsAndroid;
      console.log('2 Fire Menu Android Settings');
      closingType = 'Android';
      break;
    case 'applyWeb':
      menuSettings = menuSettingsWeb;
      console.log('2 Fire Menu Web Settings');
      closingType = 'Web';
      break;
    case 'clearExport':
      menuSettings = [];
      console.log('2 Clear Settings');
      closingType = 'Cleared';
      break;
  }

  async function applySettingsToElements(
    nodes,
    menuSettings
  ): Promise<string> {
    if (!hasValidSelectionMenu(nodes)) {
      return Promise.resolve('No valid selection');
    }

    for (let node of nodes) {
      node.exportSettings = menuSettings;
    }

    return Promise.resolve('Done!');
  }

  function hasValidSelection(nodes) {
    return nodes && nodes.length > 0;
  }

  applySettingsToElements(selection, menuSettings).then((result) => {
    let closingMsg =
      menuTrigger === 'clearExport'
        ? 'Export Settings'
        : 'Settings Applied';

    figma.closePlugin(closingType + ' ' + closingMsg);
  });
}

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 200, height: 396 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'applySettings') {
    const { selection } = figma.currentPage;

    function hasValidSelection(nodes) {
      return nodes && nodes.length > 0;
    }
    let settings = [];
    let UserEnteredString = msg.name;
    if (UserEnteredString === null) {
      UserEnteredString = 'default-asset';
    }

    function applyUserEnteredStringToSettings(
      userString,
      settingsList
    ) {
      if (!settingsList) {
        console.error('Settings list is undefined');
        return [];
      }

      return settingsList.map((setting) => {
        if (setting.suffix.includes('<UserEnteredString>')) {
          setting.suffix = setting.suffix.replace(
            '<UserEnteredString>',
            userString
          );
        }
        return setting;
      });
    }

    // Use destructured properties directly
    const baseSettingsIOS = menuSettingsIOS;
    const baseSettingsIOSadv = settingsIOSadv; // Corrected variable name
    const baseSettingsAndroid = menuSettingsAndroid;
    const baseSettingsAndroidAdv = settingsAndroidAdv; // Corrected variable name
    const baseSettingsWeb = menuSettingsWeb;

    // Apply the UserEnteredString to the settings
    const settingsIOS = applyUserEnteredStringToSettings(
      UserEnteredString,
      baseSettingsIOS
    );
    const settingsIOSadv = applyUserEnteredStringToSettings(
      UserEnteredString,
      baseSettingsIOSadv
    );
    const settingsAndroid = applyUserEnteredStringToSettings(
      UserEnteredString,
      baseSettingsAndroid
    );
    const settingsAndroidAdv = applyUserEnteredStringToSettings(
      UserEnteredString,
      baseSettingsAndroidAdv
    );
    const settingsWeb = applyUserEnteredStringToSettings(
      UserEnteredString,
      baseSettingsWeb
    );

    // if statments to apply export settings ===========
    // Sets IOS Export
    if (msg.platform === 'IOS' && msg.isAdvanced === false) {
      settings = settingsIOS;
      console.log(`2 Fire IOS Settings`);
    }
    if (msg.platform === 'IOS' && msg.isAdvanced === true) {
      settings = settingsIOSadv;
      console.log(`2 Fire IOS Adv Settings`);
    }
    // Sets Android Export
    if (msg.platform === 'Android' && msg.isAdvanced === false) {
      settings = settingsAndroid;
      console.log(`2 Fire Android Settings`);
    }
    if (msg.platform === 'Android' && msg.isAdvanced === true) {
      settings = settingsAndroidAdv;
      console.log(`2 Fire Android Adv Settings`);
    }
    // Sets Web Export
    if (msg.platform === 'Web') {
      settings = settingsWeb;
      console.log(`2 Fire Web Settings`);
    }

    // Applies Settings to Figma Element =================
    async function main(nodes): Promise<string> {
      if (!hasValidSelection(nodes))
        return Promise.resolve('No valid selection');

      for (let node of nodes) {
        node.exportSettings = settings;
      }

      return Promise.resolve('Done!');
    }

    main(selection);
  } // Clear Logic
  else if (msg.type === 'clearSettings') {
    // Applies Settings to Figma Element =================
    // TODO componitize this with the function above. ++++++++
    const { selection } = figma.currentPage;

    function hasValidSelectionClear(nodes) {
      return nodes || nodes.length === 0;
    }

    const settings = [];

    async function mainClear(nodes): Promise<string> {
      if (!hasValidSelectionClear(nodes))
        return Promise.resolve('No valid selection');

      for (let node of nodes) {
        node.exportSettings = settings;
      }

      return Promise.resolve('Done!');
    }
    console.log(`2 Fire Clear Settings`);
    mainClear(selection);
  } // Cancel == Close Plugin
  else if (msg.type === 'cancel') {
    figma.closePlugin();
  }

  if (msg.platform === undefined) {
    figma.notify('Cleared Export Settings');
  } else {
    figma.notify(msg.platform + ' Export Settings Applied');
  }
};
