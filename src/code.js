var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import settings from './settings.json';
let layerName = '';
const { command } = figma;
const menuTrigger = command;
console.log('Firing ' + menuTrigger + ' from menu');
function applyUserEnteredStringToSettings(userString, settingsList) {
    return settingsList.map((setting) => {
        if (setting.suffix.includes('<UserEnteredString>')) {
            setting.suffix = setting.suffix.replace('<UserEnteredString>', userString);
        }
        return setting;
    });
}
function hasValidSelectionMenu(nodes) {
    return nodes && nodes.length > 0;
}
function applySettingsToElements(nodes, UserEnteredString, menuSettings) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!hasValidSelectionMenu(nodes)) {
            return Promise.resolve('No valid selection');
        }
        for (let node of nodes) {
            layerName = node.name;
            let userString = UserEnteredString;
            if (userString === null) {
                userString = layerName;
            }
            const settingsWithUserString = applyUserEnteredStringToSettings(userString, menuSettings);
            node.exportSettings = settingsWithUserString;
        }
        return Promise.resolve('Done!');
    });
}
if (menuTrigger !== 'openPlugin') {
    let menuSettings = [];
    const menuSettingsIOS = settings.menuSettingsIOS;
    const MenuSettingsAndroid = settings.MenuSettingsAndroid;
    const MenuSettingsWeb = settings.MenuSettingsWeb;
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
            menuSettings = MenuSettingsAndroid;
            console.log('2 Fire Menu Android Settings');
            closingType = 'Android';
            break;
        case 'applyWeb':
            menuSettings = MenuSettingsWeb;
            console.log('2 Fire Menu Web Settings');
            closingType = 'Web';
            break;
        case 'clearExport':
            menuSettings = [];
            console.log('2 Clear Settings');
            closingType = 'Cleared';
            break;
    }
    applySettingsToElements(selection, null, menuSettings).then((result) => {
        let closingMsg = menuTrigger === 'clearExport'
            ? 'Export Settings'
            : 'Settings Applied';
        figma.closePlugin(closingType + ' ' + closingMsg);
    });
}
figma.showUI(__html__, { width: 200, height: 396 });
figma.ui.onmessage = (msg) => {
    if (msg.type === 'applySettings') {
        const { selection } = figma.currentPage;
        function hasValidSelection(nodes) {
            return nodes && nodes.length > 0;
        }
        let exportSettings = [];
        let UserEnteredString = msg.name;
        if (UserEnteredString === null) {
            UserEnteredString = layerName;
        }
        const baseSettingsIOS = settings.menuSettingsIOS;
        const baseSettingsIOSadv = settings.MenuSettingsIOSadv;
        const baseSettingsAndroid = settings.MenuSettingsAndroid;
        const baseSettingsAndroidAdv = settings.MenuSettingsAndroidAdv;
        const baseSettingsWeb = settings.MenuSettingsWeb;
        if (msg.platform === 'IOS' && msg.isAdvanced === false) {
            exportSettings = baseSettingsIOS;
            console.log(`2 Fire IOS Settings`);
            if (msg.platform === 'IOS' && msg.isAdvanced === true) {
                exportSettings = baseSettingsIOSadv;
                console.log(`2 Fire IOS Adv Settings`);
            }
            if (msg.platform === 'Android' && msg.isAdvanced === false) {
                exportSettings = baseSettingsAndroid;
                console.log(`2 Fire Android Settings`);
            }
            if (msg.platform === 'Android' && msg.isAdvanced === true) {
                exportSettings = baseSettingsAndroidAdv;
                console.log(`2 Fire Android Adv Settings`);
            }
            if (msg.platform === 'Web') {
                exportSettings = baseSettingsWeb;
                console.log(`2 Fire Web Settings`);
            }
            applySettingsToElements(selection, UserEnteredString, settings).then((result) => {
                figma.notify(msg.platform + ' Export Settings Applied');
            });
        }
        else if (msg.type === 'clearSettings') {
            const { selection } = figma.currentPage;
            function hasValidSelectionClear(nodes) {
                return nodes || nodes.length === 0;
            }
            const settings = [];
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
        else if (msg.type === 'cancel') {
            figma.closePlugin();
        }
        if (msg.platform === undefined) {
            figma.notify('Cleared Export Settings');
        }
        else {
            figma.notify(msg.platform + ' Export Settings Applied');
        }
    }
};
