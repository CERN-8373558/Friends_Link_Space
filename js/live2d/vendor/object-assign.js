/* esm.sh - object-assign@4.1.1 */
var p=Object.create;var u=Object.defineProperty;var j=Object.getOwnPropertyDescriptor;var O=Object.getOwnPropertyNames;var m=Object.getPrototypeOf,g=Object.prototype.hasOwnProperty;var v=(r,e)=>()=>(e||r((e={exports:{}}).exports,e),e.exports);var y=(r,e,t,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of O(e))!g.call(r,n)&&n!==t&&u(r,n,{get:()=>e[n],enumerable:!(o=j(e,n))||o.enumerable});return r};var d=(r,e,t)=>(t=r!=null?p(m(r)):{},y(e||!r||!r.__esModule?u(t,"default",{value:r,enumerable:!0}):t,r));var b=v((N,i)=>{"use strict";var l=Object.getOwnPropertySymbols,h=Object.prototype.hasOwnProperty,w=Object.prototype.propertyIsEnumerable;function P(r){if(r==null)throw new TypeError("Object.assign cannot be called with null or undefined");return Object(r)}function E(){try{if(!Object.assign)return!1;var r=new String("abc");if(r[5]="de",Object.getOwnPropertyNames(r)[0]==="5")return!1;for(var e={},t=0;t<10;t++)e["_"+String.fromCharCode(t)]=t;var o=Object.getOwnPropertyNames(e).map(function(a){return e[a]});if(o.join("")!=="0123456789")return!1;var n={};return"abcdefghijklmnopqrst".split("").forEach(function(a){n[a]=a}),Object.keys(Object.assign({},n)).join("")==="abcdefghijklmnopqrst"}catch{return!1}}i.exports=E()?Object.assign:function(r,e){for(var t,o=P(r),n,a=1;a<arguments.length;a++){t=Object(arguments[a]);for(var f in t)h.call(t,f)&&(o[f]=t[f]);if(l){n=l(t);for(var c=0;c<n.length;c++)w.call(t,n[c])&&(o[n[c]]=t[n[c]])}}return o}});var s=d(b()),q=s.default??s;export{q as default};
/*! Bundled license information:

object-assign/index.js:
  (*
  object-assign
  (c) Sindre Sorhus
  @license MIT
  *)
*/
//# sourceMappingURL=object-assign.mjs.map