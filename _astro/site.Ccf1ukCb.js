import{c}from"./createLucideIcon.BqSU75wd.js";/**
 * @license lucide-react v0.555.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s=[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]],d=c("chevron-right",s);/**
 * @license lucide-react v0.555.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],l=c("x",r),h=["zh-hk","en-gb"],i="zh-hk",u={home:"",portfolio:"portfolio",about:"about",cases:"case-studies",archive:"project-archive",contact:"contact",history:"history"};function a(o){const t=String(o||"").toLowerCase();return h.includes(t)?t:i}function m(o){return a(o)==="en-gb"?"en-GB":"zh-HK"}function g(o,t="home"){const n=a(o),e=u[t]??"";return e?`/${n}/${e}/`:`/${n}/`}export{d as C,u as R,l as X,g,a as n,m as t};
