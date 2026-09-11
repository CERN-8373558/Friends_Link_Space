/* ============================================================
 * mousekeyboard.js —— 鼠标 / 键盘 / 触屏控制 (对应原站 mousekeyboard.js)
 * ============================================================ */

var mouseX = 0, mouseY = 0, pmouseX = 0, pmouseY = 0;
var pressX = 0, pressY = 0;

var dragging = false;
var scrollbaring = false;
var mouseOverUI = false;

var rotateX = 0, rotateY = 0;
var rotateVX = 0, rotateVY = 0;
var rotateXMax = 90 * Math.PI / 180;

var initialAutoRotate = true;

var TOUCHMODES = { NONE: 0, SINGLE: 1, DOUBLE: 2 };
var touchMode = TOUCHMODES.NONE;
var previousTouchDelta = 0;
var touchDelta = 0;

/* 极简键盘状态记录 */
var keys = {};
document.addEventListener('keydown', function (e) {
  keys[e.key.toLowerCase()] = true;
}, false);
document.addEventListener('keyup', function (e) {
  keys[e.key.toLowerCase()] = false;
}, false);

function onDocumentMouseMove(event) {
  if (touchMode != TOUCHMODES.NONE) {
    event.preventDefault();
    return;
  }
  pmouseX = mouseX;
  pmouseY = mouseY;
  mouseX = event.clientX - window.innerWidth * 0.5;
  mouseY = event.clientY - window.innerHeight * 0.5;
  mouseOverUI = isUIElement(event.target);
  if (dragging) {
    doCameraRotationFromInteraction();
    if (window.setMinimap) window.setMinimap(dragging);
  }
}

/* 判断点击是否落在 UI 面板上 (不应触发视角旋转) */
function isUIElement(t) {
  if (!t || t.nodeType !== 1) return false;
  var ids = ['detailContainer', 'minimap', 'topbar', 'gui-panel', 'theater', 'star-name', 'meta', 'loader', 'search-results'];
  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i]);
    if (el && el.contains(t)) return true;
  }
  if (t.closest && t.closest('.marker')) return true;
  return false;
}

function onDocumentMouseDown(event) {
  if (isUIElement(event.target)) return;
  dragging = true;
  pressX = mouseX;
  pressY = mouseY;
  rotateTargetX = undefined;
  rotateTargetY = undefined;
  if (initialAutoRotate) initialAutoRotate = false;
  followTarget = null;
}

function onDocumentMouseUp(event) {
  dragging = false;
}

function onClick(event) {
  /* 若是拖动而不是点击，则忽略 */
  if (Math.abs(pressX - mouseX) > 3 || Math.abs(pressY - mouseY) > 3)
    return;
  /* 点击标记标签 / 顶部 UI 时交给它们自身处理 */
  if (event.target && event.target.closest &&
      (event.target.closest('.marker') || event.target.closest('#topbar'))) return;
  /* 拾取恒星 / 三体天体 */
  if (window.pickStarAt) {
    var hit = pickStarAt(event);
    if (hit) {
      if (hit.type === 'star') {
        enterStar(hit.entry);
      } else if (hit.type === 'body') {
        enterBody(hit.body);
      }
      return;
    }
  }
  /* 交给 minimap.js 的全局点击处理 */
  if (window.__globalClick) window.__globalClick(event);
}

function onKeyDown(event) {
  var key = event.key.toLowerCase();
  var ROT = 0.004;
  if (key === 'arrowleft') { rotateY += ROT; initialAutoRotate = false; }
  else if (key === 'arrowright') { rotateY -= ROT; initialAutoRotate = false; }
  else if (key === 'arrowup') { rotateX += ROT; initialAutoRotate = false; }
  else if (key === 'arrowdown') { rotateX -= ROT; initialAutoRotate = false; }
  else if (key === '+' || key === '=') { handleMWheel(1); }
  else if (key === '-' || key === '_') { handleMWheel(-1); }
  else if (key === 'h') { if (window.centerOnSun) window.centerOnSun(); }
  else if (key === 't') { if (window.tour) window.tour.start(); }
  else if (key === 'g') { if (window.toggleGUI) window.toggleGUI(); }
}

/* 滚轮缩放 (对应原站 handleMWheel) */
function handleMWheel(delta) {
  lastInteractionTime = Date.now();
  camera.position.target.z += delta * camera.position.target.z * 0.06;
  camera.position.target.z = constrain(camera.position.target.z, cameraZoomMin, cameraZoomMax);
  camera.position.target.pz = camera.position.target.z;
  /* 聚焦关键用户时保持跟随，滚轮缩放不会让镜头与其走散 */
  if (!currentBody) followTarget = null;
  if (window.updateMinimap) window.updateMinimap();
  if (initialAutoRotate) initialAutoRotate = false;
}

function onMouseWheel(event) {
  var delta = 0;
  if (event.wheelDelta) {
    delta = event.wheelDelta / 120;
  } else if (event.detail) {
    delta = -event.detail / 3;
  } else if (event.deltaY) {
    delta = -event.deltaY / 120;
  }
  if (delta) handleMWheel(delta);
  event.preventDefault();
  event.returnValue = false;
}

/* ---------- 触屏 ---------- */

function determineTouchMode(event) {
  if (event.touches.length <= 0 || event.touches.length > 2) {
    touchMode = TOUCHMODES.NONE;
    return;
  }
  touchMode = (event.touches.length == 1) ? TOUCHMODES.SINGLE : TOUCHMODES.DOUBLE;
}

function calculateTouchDistance(touchA, touchB) {
  var dx = touchB.pageX - touchA.pageX;
  var dy = touchB.pageY - touchA.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

function touchStart(event) {
  onDocumentMouseDown(event);
  determineTouchMode(event);
  if (event.touches.length >= 1) {
    mouseX = event.touches[0].pageX - window.innerWidth * 0.5;
    mouseY = event.touches[0].pageY - window.innerHeight * 0.5;
  }
  event.preventDefault();
}

function touchEnd(event) {
  scrollbaring = false;
  onDocumentMouseUp(event);
  determineTouchMode(event);
}

function touchMove(event) {
  determineTouchMode(event);

  if (touchMode == TOUCHMODES.SINGLE) {
    pmouseX = mouseX;
    pmouseY = mouseY;
    var touch = event.touches[0];
    mouseX = touch.pageX - window.innerWidth * 0.5;
    mouseY = touch.pageY - window.innerHeight * 0.5;
    if (dragging) {
      doCameraRotationFromInteraction();
      if (window.setMinimap) window.setMinimap(dragging);
    }
  } else if (touchMode == TOUCHMODES.DOUBLE) {
    var touchA = event.touches[0];
    var touchB = event.touches[1];
    previousTouchDelta = touchDelta;
    touchDelta = calculateTouchDistance(touchA, touchB);
    var pinchAmount = touchDelta - previousTouchDelta;
    handleMWheel(-pinchAmount * 0.06);
  }
  event.preventDefault();
}

/* 拖动旋转 (对应原站 doCameraRotationFromInteraction) */
function doCameraRotationFromInteraction() {
  lastInteractionTime = Date.now();
  rotateVY += (mouseX - pmouseX) / 2 * Math.PI / 180 * 0.2;
  rotateVX += (mouseY - pmouseY) / 2 * Math.PI / 180 * 0.2;
}
