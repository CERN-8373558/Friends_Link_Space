/* ============================================================
 * minimap.js —— 迷你地图缩放条 (对应原站 minimap.js)
 * ============================================================ */

var POWER = 3;
var minimapPosition = 0;
var dragged = false;

function curve(t) {
  return Math.pow(t, 1 / POWER);
}
function curve_inverse(t) {
  return Math.pow(t, POWER);
}

function initializeMinimap() {
  updateMinimap();
  minimapEl.classList.add('ready');
}

function updateMinimap() {
  if (!camera) return;
  var normal = cmap(camera.position.target.z, cameraZoomMin, cameraZoomMax, 0, 1);
  minimapPosition = cmap(curve(normal), 0, 1, 0, 100);
  updateCursor(true);
}

function setMinimap(b) {
  dragged = !!b;
}

function updateCursor(silent) {
  zoomCursorEl.style.top = minimapPosition + '%';
  if (!silent) {
    updateCameraPosition();
  }
}

function updateCameraPosition() {
  if (!camera) return;
  var normal = minimapPosition / 100;
  camera.position.target.z = cmap(curve_inverse(normal), 0, 1, cameraZoomMin, cameraZoomMax);
  camera.position.target.pz = camera.position.target.z;
}

/* ---------- 缩放条拖动 ---------- */

function setMinimapPositionFromY(clientY) {
  var rect = zoomLevelsEl.getBoundingClientRect();
  minimapPosition = cmap(clientY - rect.top, 0, rect.height, 0, 100);
  updateCursor();
}

on(zoomLevelsEl, 'mousedown', function (e) {
  setMinimapPositionFromY(e.clientY);
  scrollbaring = true;
  dragged = true;
  window.addEventListener('mousemove', onMinimapDrag, false);
});

function onMinimapDrag(e) {
  setMinimapPositionFromY(e.clientY);
}

window.addEventListener('mouseup', function () {
  window.removeEventListener('mousemove', onMinimapDrag, false);
  scrollbaring = false;
  dragged = false;
}, false);

on(zoomLevelsEl, 'touchstart', function (e) {
  e.preventDefault();
  var t = e.touches[0];
  setMinimapPositionFromY(t.pageY);
  scrollbaring = true;
  dragged = true;
}, { passive: false });

on(zoomLevelsEl, 'touchmove', function (e) {
  e.preventDefault();
  var t = e.touches[0];
  setMinimapPositionFromY(t.pageY);
}, { passive: false });

on(zoomLevelsEl, 'touchend', function () {
  scrollbaring = false;
  dragged = false;
}, false);

/* ---------- 声音开关 ---------- */

on(volumeEl, 'click', function (e) {
  e.stopPropagation();
  if (window.muted) {
    window.unmuteSound();
  } else {
    window.muteSound();
  }
});

/* ---------- 关于 ---------- */

on(aboutEl, 'click', function (e) {
  e.stopPropagation();
  openDetail({ type: 'about' });
});

/* ---------- 全局点击：关闭详情 ---------- */

window.__globalClick = function (event) {
  var t = event.target;
  if (!t || t.nodeType !== 1) return;
  if (detailContainer.contains(t)) return;
  if (minimapEl.contains(t)) return;
  if (topbarEl && topbarEl.contains(t)) return;
  if (guiPanelEl && guiPanelEl.contains(t)) return;
  if (theaterEl && theaterEl.contains(t)) return;
  if (t.closest && t.closest('.marker')) return;
  if (currentBody) {
    /* 正在聚焦某个关键用户：点击别处直接回到银河全景，避免镜头停在移动的天体上丢失 */
    resetToGalaxy();
  } else {
    closeDetail();
    followTarget = null;
  }
  if (window.hideSearchResults) hideSearchResults();
};
