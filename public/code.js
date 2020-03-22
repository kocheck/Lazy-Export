"use strict";
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
***************************************************************************** */function t(t,e,n,o){return new(n||(n=Promise))((function(i,r){function f(t){try{a(o.next(t))}catch(t){r(t)}}function s(t){try{a(o.throw(t))}catch(t){r(t)}}function a(t){var e;t.done?i(t.value):(e=t.value,e instanceof n?e:new n((function(t){t(e)}))).then(f,s)}a((o=o.apply(t,e||[])).next())}))}figma.showUI(__html__,{width:200,height:340}),figma.ui.onmessage=e=>{if("applySettings"===e.type){const{selection:n}=figma.currentPage;let o=[];const i=[{format:"PNG",suffix:"@3x",constraint:{type:"SCALE",value:3}},{format:"PNG",suffix:"@2x",constraint:{type:"SCALE",value:2}},{format:"PNG",suffix:"@1x",constraint:{type:"SCALE",value:1}}],r=[{format:"PNG",suffix:"/XXXHDPI",constraint:{type:"SCALE",value:4}},{format:"PNG",suffix:"/XXHDPI",constraint:{type:"SCALE",value:3}},{format:"PNG",suffix:"/XHDPI",constraint:{type:"SCALE",value:2}},{format:"PNG",suffix:"/HDPI",constraint:{type:"SCALE",value:1.5}},{format:"PNG",suffix:"/LDPI",constraint:{type:"SCALE",value:.75}},{format:"PNG",suffix:"/MDPI",constraint:{type:"SCALE",value:1}}],f=[{format:"SVG",suffix:"",svgOutlineText:!0,svgIdAttribute:!1,svgSimplifyStroke:!0},{format:"PNG",suffix:"@3x",constraint:{type:"SCALE",value:3}},{format:"PNG",suffix:"@2x",constraint:{type:"SCALE",value:2}},{format:"PNG",suffix:"@1x",constraint:{type:"SCALE",value:1}}];"IOS"===e.platform&&(o=i,console.log("2 Fire IOS Settings")),"Android"===e.platform&&(o=r,console.log("2 Fire Android Settings")),"Web"===e.platform&&(o=f,console.log("2 Fire Web Settings")),function(e){t(this,void 0,void 0,(function*(){if(!function(t){return t||0===t.length}(e))return Promise.resolve("No valid selection");for(let t of e)t.exportSettings=o;return Promise.resolve("Done!")}))}(n)}else if("clearSettings"===e.type){const{selection:e}=figma.currentPage;const n=[];console.log("2 Fire Clear Settings"),function(e){t(this,void 0,void 0,(function*(){if(!function(t){return t||0===t.length}(e))return Promise.resolve("No valid selection");for(let t of e)t.exportSettings=n;return Promise.resolve("Done!")}))}(e)}else"cancel"===e.type&&figma.closePlugin()};
