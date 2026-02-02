import{r as n,j as e}from"./charts-FoNSDMOs.js";import"./react-BzrpNAyj.js";/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=s=>s.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),j=s=>s.replace(/^([A-Z])|[\s-_]+(\w)/g,(a,t,r)=>r?r.toUpperCase():t.toLowerCase()),d=s=>{const a=j(s);return a.charAt(0).toUpperCase()+a.slice(1)},h=(...s)=>s.filter((a,t,r)=>!!a&&a.trim()!==""&&r.indexOf(a)===t).join(" ").trim(),f=s=>{for(const a in s)if(a.startsWith("aria-")||a==="role"||a==="title")return!0};/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var g={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=n.forwardRef(({color:s="currentColor",size:a=24,strokeWidth:t=2,absoluteStrokeWidth:r,className:c="",children:i,iconNode:m,...l},u)=>n.createElement("svg",{ref:u,...g,width:a,height:a,stroke:s,strokeWidth:r?Number(t)*24/Number(a):t,className:h("lucide",c),...!i&&!f(l)&&{"aria-hidden":"true"},...l},[...m.map(([p,y])=>n.createElement(p,y)),...Array.isArray(i)?i:[i]]));/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=(s,a)=>{const t=n.forwardRef(({className:r,...c},i)=>n.createElement(b,{ref:i,iconNode:a,className:h(`lucide-${x(d(s))}`,`lucide-${s}`,r),...c}));return t.displayName=d(s),t};/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],k=o("shield-check",v);/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744",key:"16gr8j"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]],w=o("users",N);/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],A=o("zap",C);function z(){return e.jsx("section",{id:"about",className:"about-section",children:e.jsxs("div",{className:"about-container",children:[e.jsxs("div",{className:"about-header",children:[e.jsx("h2",{children:"About Smart Police Complaint System"}),e.jsx("p",{children:"Empowering citizens and police through transparency, speed, and technology."})]}),e.jsxs("div",{className:"about-cards",children:[e.jsxs("div",{className:"about-card",children:[e.jsx("div",{className:"icon",children:e.jsx(k,{className:"icon-style"})}),e.jsx("h3",{children:"Transparency"}),e.jsx("p",{children:"Every complaint is tracked in real-time, ensuring citizens can follow the progress of their reports with full visibility and trust."})]}),e.jsxs("div",{className:"about-card",children:[e.jsx("div",{className:"icon",children:e.jsx(w,{className:"icon-style cyan"})}),e.jsx("h3",{children:"Community"}),e.jsx("p",{children:"Bridging citizens and law enforcement to work collaboratively in maintaining public safety and mutual accountability."})]}),e.jsxs("div",{className:"about-card",children:[e.jsx("div",{className:"icon",children:e.jsx(A,{className:"icon-style blue"})}),e.jsx("h3",{children:"Efficiency"}),e.jsx("p",{children:"Smart automation speeds up complaint handling and reduces manual errors, making justice faster and more efficient."})]})]}),e.jsx("div",{className:"about-mission",children:e.jsxs("p",{children:[e.jsx("span",{className:"highlight",children:"Our mission"})," is to redefine the way complaints are registered, managed, and resolved — ensuring fairness, transparency, and accountability at every step."]})})]})})}export{z as default};
