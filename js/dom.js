/* ============================================================
 * dom.js —— DOM 引用与极简动画助手 (替代原站的 jQuery)
 * ============================================================ */

var loaderEl, loadTextEl, layoutEl;
var visualizationEl, glContainerEl, cssWorldEl, cssCameraEl, markerTemplateEl;
var iconNavEl, zoomHudEl, zoomValueEl, starNameEl, starNameTextEl;
var detailContainer, detailTitleEl, detailBodyEl, detailCloseEl, detailFooterEl;
var minimapEl, zoomLevelsEl, zoomCursorEl, zoomBackdropEl, aboutEl, volumeEl;
var metaEl, metaLinkEl, theaterEl, theaterMessageEl, topBarEl, bottomBarEl;
var tourButtonEl, homeButtonEl, gearButtonEl, guiPanelEl, guiBodyEl;
var topbarEl, searchboxEl, searchResultsEl, tagTabsEl, randomBtnEl, siteTitleEl;
var labelLayerEl;
var easterWindowEl, winGalaxyEl, winBgEl;

function initDOM() {
  loaderEl = document.getElementById('loader');
  loadTextEl = document.getElementById('loadtext');
  layoutEl = document.getElementById('layout');
  visualizationEl = document.getElementById('visualization');
  glContainerEl = document.getElementById('glContainer');
  cssWorldEl = document.getElementById('css-world');
  cssCameraEl = document.getElementById('css-camera');
  markerTemplateEl = document.getElementById('marker_template');
  iconNavEl = document.getElementById('icon-nav');
  zoomHudEl = document.getElementById('zoom-hud');
  zoomValueEl = document.getElementById('zoom-value');
  starNameEl = document.getElementById('star-name');
  starNameTextEl = starNameEl.getElementsByTagName('span')[0];
  detailContainer = document.getElementById('detailContainer');
  detailTitleEl = detailContainer.getElementsByTagName('span')[0];
  detailBodyEl = document.getElementById('detailBody');
  detailCloseEl = document.getElementById('detailClose');
  detailFooterEl = document.getElementById('detailFooter');
  minimapEl = document.getElementById('minimap');
  zoomLevelsEl = document.getElementById('zoom-levels');
  zoomCursorEl = document.getElementById('zoom-cursor');
  zoomBackdropEl = document.getElementById('zoom-backdrop');
  aboutEl = document.getElementById('about');
  volumeEl = document.getElementById('volume');
  metaEl = document.getElementById('meta');
  metaLinkEl = metaEl.getElementsByTagName('a')[0];
  theaterEl = document.getElementById('theater');
  theaterMessageEl = theaterEl.getElementsByClassName('message')[0];
  topBarEl = theaterEl.getElementsByClassName('top-bar')[0];
  bottomBarEl = theaterEl.getElementsByClassName('bottom-bar')[0];
  tourButtonEl = document.getElementById('tour-button');
  homeButtonEl = document.getElementById('home-button');
  gearButtonEl = document.getElementById('gear-button');
  guiPanelEl = document.getElementById('gui-panel');
  guiBodyEl = document.getElementById('gui-body');
  topbarEl = document.getElementById('topbar');
  searchboxEl = document.getElementById('searchbox');
  searchResultsEl = document.getElementById('search-results');
  tagTabsEl = document.getElementById('tag-tabs');
  randomBtnEl = document.getElementById('random-btn');
  siteTitleEl = document.getElementById('title-text');
  labelLayerEl = document.getElementById('label-layer');
  easterWindowEl = document.getElementById('easter-window');
  winGalaxyEl = document.getElementById('win-galaxy');
  winBgEl = document.getElementById('win-bg');
}

function setLoadMessage(msg) {
  loadTextEl.innerHTML = msg + '&hellip;';
}

/* 脚本都在 body 末尾，DOM 已就绪，立即初始化引用 */
initDOM();

function on(el, ev, fn, opts) {
  el.addEventListener(ev, fn, opts || false);
}

function find(el, sel) {
  return el.querySelector(sel);
}

function width(el) {
  return el.offsetWidth;
}
function height(el) {
  return el.offsetHeight;
}
function offsetTop(el) {
  var rect = el.getBoundingClientRect();
  return rect.top;
}

var __ftCounter = 0;

function fadeIn(el, ms, cb) {
  ms = ms || 250;
  el.style.display = 'block';
  el.style.opacity = '0';
  el.style.transition = 'none';
  requestAnimationFrame(function () {
    el.style.transition = 'opacity ' + ms + 'ms';
    el.style.opacity = '1';
  });
  clearTimeout(el.__ft);
  el.__ft = setTimeout(function () {
    el.style.transition = '';
    if (cb) cb();
  }, ms);
}

function fadeOut(el, ms, cb) {
  ms = ms || 250;
  el.style.transition = 'opacity ' + ms + 'ms';
  el.style.opacity = '0';
  clearTimeout(el.__ft);
  el.__ft = setTimeout(function () {
    el.style.transition = '';
    el.style.display = 'none';
    if (cb) cb();
  }, ms);
}

/* 平滑改变一个 CSS 数值属性 (用于影院黑边等) */
function slideProp(el, prop, to, ms, cb) {
  ms = ms || 250;
  el.style.transition = prop + ' ' + ms + 'ms ease';
  el.style[prop] = to + 'px';
  clearTimeout(el.__st);
  el.__st = setTimeout(function () {
    el.style.transition = '';
    if (cb) cb();
  }, ms);
}
