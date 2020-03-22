'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
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

// This plugin will open a modal to prompt the user to enter a number, and
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser enviroment (see documentation).
// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 200, height: 408 });
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
        // IOS Settings ======
        const settingsIOS = [
            {
                format: "PNG",
                suffix: "@3x",
                constraint: { type: "SCALE", value: 3 }
            },
            {
                format: "PNG",
                suffix: "@2x",
                constraint: { type: "SCALE", value: 2 }
            },
            {
                format: "PNG",
                suffix: "@1x",
                constraint: { type: "SCALE", value: 1 }
            }
        ];
        // Android Settings ======
        const settingsAndroid = [
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
        // Sets Android Export
        if (msg.platform === "Android") {
            settings = settingsAndroid;
            console.log(`2 Fire Android Settings`);
        }
        // Sets Web Export
        if (msg.platform === "Web") {
            settings = settingsWeb;
            console.log(`2 Fire Web Settings`);
        }
        // Applies Settings to Figma Element =================
        function main(nodes) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!hasValidSelection(nodes))
                    return Promise.resolve("No valid selection");
                for (let node of nodes) {
                    node.exportSettings = settings;
                }
                return Promise.resolve("Done!");
            });
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
        function mainClear(nodes) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!hasValidSelectionClear(nodes))
                    return Promise.resolve("No valid selection");
                for (let node of nodes) {
                    node.exportSettings = settings;
                }
                return Promise.resolve("Done!");
            });
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
};
// Make sure to close the plugin when you're done. Otherwise the plugin will
// keep running, which shows the cancel button at the bottom of the screen.
//   figma.closePlugin();
