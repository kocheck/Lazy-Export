'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const { command } = figma;
const menuTrigger = command;
console.log('Firing ' + menuTrigger + ' from menu');
//Everywhere in the ap launchUrl is 'foo'
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).
if (menuTrigger !== 'openPlugin') {
    let menuSettings = [];
    // IOS Settings ======
    const menuSettingsIOS = [
        {
            format: 'PNG',
            suffix: ' @3x',
            constraint: { type: 'SCALE', value: 3 },
        },
        {
            format: 'PNG',
            suffix: ' @2x',
            constraint: { type: 'SCALE', value: 2 },
        },
        {
            format: 'PNG',
            suffix: ' @1x',
            constraint: { type: 'SCALE', value: 1 },
        },
    ];
    // Android Settings ======
    const MenuSettingsAndroid = [
        {
            format: 'PNG',
            suffix: ' drawable-xxxhdpi',
            constraint: { type: 'SCALE', value: 4 },
        },
        {
            format: 'PNG',
            suffix: ' drawable-xxhdpi',
            constraint: { type: 'SCALE', value: 3 },
        },
        {
            format: 'PNG',
            suffix: ' drawable-xhdpi',
            constraint: { type: 'SCALE', value: 2 },
        },
        {
            format: 'PNG',
            suffix: ' drawable-hdpi',
            constraint: { type: 'SCALE', value: 1.5 },
        },
        {
            format: 'PNG',
            suffix: ' drawable-ldpi',
            constraint: { type: 'SCALE', value: 0.75 },
        },
        {
            format: 'PNG',
            suffix: ' drawable-mdpi',
            constraint: { type: 'SCALE', value: 1 },
        },
    ];
    // Web Settings ======
    const MenuSettingsWeb = [
        {
            format: 'SVG',
            suffix: '',
            svgOutlineText: true,
            svgIdAttribute: false,
            svgSimplifyStroke: true,
        },
        {
            format: 'PNG',
            suffix: ' @3x',
            constraint: { type: 'SCALE', value: 3 },
        },
        {
            format: 'PNG',
            suffix: ' @2x',
            constraint: { type: 'SCALE', value: 2 },
        },
        {
            format: 'PNG',
            suffix: ' @1x',
            constraint: { type: 'SCALE', value: 1 },
        },
    ];
    // Get the current selection on the Figma page
    const { selection } = figma.currentPage;
    // Function to check if the selection is valid
    function hasValidSelectionMenu(nodes) {
        return nodes || nodes.length === 0;
    }
    let closingType = '';
    // Assign the appropriate settings based on the menuTrigger
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
    // Applies Settings to Figma Element =================
    function main(nodes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!hasValidSelectionMenu(nodes))
                return Promise.resolve('No valid selection');
            for (let node of nodes) {
                node.exportSettings = menuSettings;
            }
            return Promise.resolve('Done!');
        });
    }
    main(selection);
    let closingMsg = 'Settings Applied';
    if (menuTrigger === 'clearExport') {
        closingMsg = ' Export Settings';
    }
    figma.closePlugin(closingType + ' ' + closingMsg);
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
            return nodes || nodes.length === 0;
        }
        let settings = [];
        // Importing the User entered string and biding a default value to null
        let UserEnteredString = msg.name;
        if (UserEnteredString === null) {
            UserEnteredString = 'default-asset';
        }
        // console.log(msg);
        // IOS Settings ======
        const settingsIOS = [
            {
                format: 'PNG',
                suffix: '/' + UserEnteredString + '@3x',
                constraint: { type: 'SCALE', value: 3 },
            },
            {
                format: 'PNG',
                suffix: '/' + UserEnteredString + '@2x',
                constraint: { type: 'SCALE', value: 2 },
            },
            {
                format: 'PNG',
                suffix: '/' + UserEnteredString + '@1x',
                constraint: { type: 'SCALE', value: 1 },
            },
        ];
        const settingsIOSadv = [
            {
                format: 'PNG',
                suffix: '/' +
                    UserEnteredString +
                    '.imageset/' +
                    UserEnteredString +
                    '@3x',
                constraint: { type: 'SCALE', value: 3 },
            },
            {
                format: 'PNG',
                suffix: '/' +
                    UserEnteredString +
                    '.imageset/' +
                    UserEnteredString +
                    '@2x',
                constraint: { type: 'SCALE', value: 2 },
            },
            {
                format: 'PNG',
                suffix: '/' +
                    UserEnteredString +
                    '.imageset/' +
                    UserEnteredString +
                    '@1x',
                constraint: { type: 'SCALE', value: 1 },
            },
        ];
        // Android Settings ======
        const settingsAndroidAdv = [
            {
                format: 'PNG',
                suffix: '/drawable-xxxhdpi/' + UserEnteredString,
                constraint: { type: 'SCALE', value: 4 },
            },
            {
                format: 'PNG',
                suffix: '/drawable-xxhdpi/' + UserEnteredString,
                constraint: { type: 'SCALE', value: 3 },
            },
            {
                format: 'PNG',
                suffix: '/drawable-xhdpi/' + UserEnteredString,
                constraint: { type: 'SCALE', value: 2 },
            },
            {
                format: 'PNG',
                suffix: '/drawable-hdpi/' + UserEnteredString,
                constraint: { type: 'SCALE', value: 1.5 },
            },
            {
                format: 'PNG',
                suffix: '/drawable-ldpi/' + UserEnteredString,
                constraint: { type: 'SCALE', value: 0.75 },
            },
            {
                format: 'PNG',
                suffix: '/drawable-mdpi/' + UserEnteredString,
                constraint: { type: 'SCALE', value: 1 },
            },
        ];
        const settingsAndroid = [
            {
                format: 'PNG',
                suffix: 'drawable-xxxhdpi' + UserEnteredString,
                constraint: { type: 'SCALE', value: 4 },
            },
            {
                format: 'PNG',
                suffix: 'drawable-xxhdpi',
                constraint: { type: 'SCALE', value: 3 },
            },
            {
                format: 'PNG',
                suffix: 'drawable-xhdpi',
                constraint: { type: 'SCALE', value: 2 },
            },
            {
                format: 'PNG',
                suffix: 'drawable-hdpi',
                constraint: { type: 'SCALE', value: 1.5 },
            },
            {
                format: 'PNG',
                suffix: 'drawable-ldpi',
                constraint: { type: 'SCALE', value: 0.75 },
            },
            {
                format: 'PNG',
                suffix: 'drawable-mdpi',
                constraint: { type: 'SCALE', value: 1 },
            },
        ];
        // Web Settings ======
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
                suffix: '/' + UserEnteredString + '@3x',
                constraint: { type: 'SCALE', value: 3 },
            },
            {
                format: 'PNG',
                suffix: '/' + UserEnteredString + '@2x',
                constraint: { type: 'SCALE', value: 2 },
            },
            {
                format: 'PNG',
                suffix: '/' + UserEnteredString + '@1x',
                constraint: { type: 'SCALE', value: 1 },
            },
        ];
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
        function main(nodes) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!hasValidSelection(nodes))
                    return Promise.resolve('No valid selection');
                for (let node of nodes) {
                    node.exportSettings = settings;
                }
                return Promise.resolve('Done!');
            });
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
        function mainClear(nodes) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!hasValidSelectionClear(nodes))
                    return Promise.resolve('No valid selection');
                for (let node of nodes) {
                    node.exportSettings = settings;
                }
                return Promise.resolve('Done!');
            });
        }
        console.log(`2 Fire Clear Settings`);
        mainClear(selection);
    } // Cancel == Close Plugin
    else if (msg.type === 'cancel') {
        figma.closePlugin();
    }
    if (msg.platform === undefined) {
        figma.notify('Cleared Export Settings');
    }
    else {
        figma.notify(msg.platform + ' Export Settings Applied');
    }
};
//# sourceMappingURL=code.js.map
