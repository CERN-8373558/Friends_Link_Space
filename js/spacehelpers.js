/* ============================================================
 * spacehelpers.js —— 相机辅助 (对应原站 spacehelpers.js)
 * ============================================================ */

function centerOn(vec3) {
  var target = vec3.clone().negate();
  translating.easePanning = new TWEEN.Tween(translating.position)
    .to({ x: target.x, y: target.y, z: target.z }, 2200)
    .easing(Tour.Easing)
    .start()
    .onComplete(function () {
      translating.easePanning = undefined;
    });
  translating.targetPosition.copy(target);
  if (window.updateMinimap) updateMinimap();
}

function snapTo(vec3) {
  translating.targetPosition.copy(vec3.clone().negate());
  translating.position.copy(vec3.clone().negate());
  if (window.updateMinimap) updateMinimap();
}

function zoomIn(v) {
  v = Math.max(v, cameraZoomMin); /* 不越过最大放大倍率 */
  camera.easeZooming = new TWEEN.Tween(camera.position)
    .to({ z: v }, 2500)
    .easing(Tour.Easing)
    .start()
    .onComplete(function () {
      camera.easeZooming = undefined;
    });
  camera.position.target.pz = camera.position.z;
  camera.position.target.z = v;
  if (window.updateMinimap) updateMinimap();
}

function zoomOut(v) {
  camera.position.target.z = v || camera.position.target.pz;
  if (window.updateMinimap) updateMinimap();
}

function centerOnSun() {
  followTarget = sun ? sun.anchor : null;
  centerOn(new THREE.Vector3(0, 0, 0));
  zoomOut(cameraZoomMax * 0.5);
  if (window.hideSunButton) hideSunButton();
}
