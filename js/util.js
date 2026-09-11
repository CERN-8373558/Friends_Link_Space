/* ============================================================
 * util.js —— 通用工具函数 (对应原站 util.js)
 * ============================================================ */

function constrain(v, min, max) {
  if (v < min) v = min;
  else if (v > max) v = max;
  return v;
}

function clamp01(v) {
  return constrain(v, 0, 1);
}

function random(low, high) {
  if (low >= high) return low;
  return (Math.random() * (high - low)) + low;
}

/* 可复现的伪随机数生成器 (mulberry32)：相同种子 → 相同序列 */
function mulberry32(a) {
  return function () {
    var t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* 远景变暗：银河拉远时整体亮度衰减（避免缩成很亮的一坨） */
function galaxyDim(z) {
  return 1 - 0.99995 * clamp01((z - 5000) / 400000); /* 5000→405000: 1 → 0.00005 */
}

function map(v, istart, istop, ostart, ostop) {
  return ostart + (ostop - ostart) * ((v - istart) / (istop - istart));
}

function cmap(v, i1, i2, o1, o2) {
  return Math.max(Math.min(map(v, i1, i2, o1, o2), o2), o1);
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function roundNumber(num, dec) {
  var pow = Math.pow(10, dec);
  return Math.round(num * pow) / pow;
}

/* 从 URL 取 query 参数 (对应原站 urlArgs / gup) */
function gup(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.href);
  if (results == null) return "";
  return results[1];
}

function toTHREEColor(colorString) {
  return new THREE.Color(parseInt(colorString.substr(1), 16));
}

Math.TWO_PI = Math.PI * 2.0;

/* 相机缩放范围 */
var cameraZoomMin = 5;
var cameraZoomMax = 400;

/* 银河全景下相机的绝对最近距离（进入星系后解除限制可到达） */
var ZOOM_MIN_ABSOLUTE = 5;

/* 最大放大倍率（相对初始视图）：相机最多靠近到 startZoom / MAX_ZOOM_RATIO */
var MAX_ZOOM_RATIO = 10.0;

/* 最近一次交互时间 (用于自动旋转的空闲判定) */
var lastInteractionTime = 0;

/* 当前跟随的天体（用于居中） */
var followTarget = null;

/* 天文单位换算 (对应原站 spacehelpers) */
function KMToLY(kilometers) {
  return kilometers * 1.05702341 * Math.pow(10, -13);
}
function LYToKM(LY) {
  return LY / 1.05702341 * Math.pow(10, -13);
}
function AUToLY(AU) {
  return AU * 1.58128451 * Math.pow(10, -5);
}

/* 生成一张 canvas，供程序化纹理使用 */
function makeCanvas(w, h, draw) {
  var c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  var ctx = c.getContext('2d');
  if (draw) draw(ctx, w, h);
  return c;
}

function canvasToTexture(canvas) {
  var t = new THREE.CanvasTexture(canvas);
  t.anisotropy = 1;
  t.needsUpdate = true;
  return t;
}

/* 柔和光点纹理（恒星、星尘、行星共用） */
var dotTexture = null;
function getDotTexture() {
  if (dotTexture) return dotTexture;
  var c = makeCanvas(64, 64, function (ctx, w, h) {
    var g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  dotTexture = canvasToTexture(c);
  return dotTexture;
}

/* 柔和光晕纹理（恒星） */
var starGlowTexture = null;
function getStarGlowTexture() {
  if (starGlowTexture) return starGlowTexture;
  var c = makeCanvas(128, 128, function (ctx, w, h) {
    var g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.18, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.22)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  starGlowTexture = canvasToTexture(c);
  return starGlowTexture;
}

/* 细圆环光环纹理（恒星周围的小光环，用于与背景区分） */
var haloRingTexture = null;
function getHaloRingTexture() {
  if (haloRingTexture) return haloRingTexture;
  var c = makeCanvas(128, 128, function (ctx, w, h) {
    var g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.35, 'rgba(255,255,255,0)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.63, 'rgba(255,255,255,0.28)');
    g.addColorStop(0.68, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  haloRingTexture = canvasToTexture(c);
  return haloRingTexture;
}
