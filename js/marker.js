/* ============================================================
 * marker.js —— 屏幕空间 2D 标签 (billboard)
 * 每帧把天体 3D 坐标投影到屏幕，标签始终正对镜头
 * ============================================================ */

var markers = [];
var markerThreshold = { min: 2, max: 480 };
var gifOverlays = [];

function updateMarkers() {
  for (var i = 0; i < markers.length; i++) {
    markers[i].update();
  }
  for (var j = 0; j < gifOverlays.length; j++) {
    gifOverlays[j].update();
  }
}

function attachMarker(obj, size, visRange, offset) {
  var marker = markerTemplateEl.cloneNode(true);
  marker.style.display = 'block';
  marker.obj = obj;
  marker.size = size !== undefined ? size : 1.0;
  marker.visMin = visRange ? visRange.min : 0;
  marker.visMax = visRange ? visRange.max : 10000000;
  marker.__hover = false;
  marker.__offsetX = offset ? offset.x : 0;
  marker.__offsetY = offset ? offset.y : 0;
  marker.__worldPos = new THREE.Vector3();

  marker.style.fontSize = (10 + size * 3) + 'px';
  marker.style.lineHeight = (10 + size * 3 + 4) + 'px';

  var nameLayer = marker.children[0];
  nameLayer.innerHTML = obj.name || '?';
  marker.nameLayer = nameLayer;

  marker.addEventListener('mouseenter', function () {
    this.__hover = true;
  });
  marker.addEventListener('mouseleave', function () {
    this.__hover = false;
  });

  marker.addEventListener('click', function (e) {
    e.stopPropagation();
    var t = this.__target;
    if (t) {
      if (t.type === 'star' && t.entry) {
        enterStar(t.entry);
      } else if (t.type === 'body' && t.body) {
        enterBody(t.body);
      } else {
        openDetail(t);
      }
      if (window.setMinimap) window.setMinimap(true);
    }
  });

  marker.setVisible = function (vis) {
    if (vis) {
      this.style.opacity = '1';
      this.style.visibility = 'visible';
    } else {
      this.style.opacity = '0';
      this.style.visibility = 'hidden';
    }
    return this;
  };

  marker.setName = function (name) {
    this.nameLayer.innerHTML = name;
  };

  marker.update = function () {
    var z = camera.position.z;

    /* 3D 世界坐标 → 屏幕坐标 */
    var v = this.__worldPos;
    this.obj.getWorldPosition(v);
    v.project(camera);

    var inFront = v.z < 1;
    var sx = (v.x * 0.5 + 0.5) * screenWidth + this.__offsetX;
    var sy = (-v.y * 0.5 + 0.5) * screenHeight + this.__offsetY;
    this.style.left = sx + 'px';
    this.style.top = sy + 'px';

    var inRange = z >= this.visMin && z <= this.visMax;
    var t = this.__target;
    var always = labelsAlways && t && (t.type === 'star' || t.type === 'body');
    var show = false;
    if (t) {
      if (t.type === 'star') {
        show = (always || inRange || this.__hover || (hoverStar === t.entry)) && tagsMatch(t.entry);
      } else if (t.type === 'planet') {
        /* 行星标签：普通恒星仅当前聚焦星系显示；关键用户的子项目仅聚焦该用户时显示 */
        if (t.body) {
          show = inRange && currentBody === t.body;
        } else {
          show = inRange && currentStar === t.entry && tagsMatch(t.entry);
        }
      } else if (t.type === 'body') {
        /* 三体关键用户标签：范围内 / 悬停 / 永久显示时显示 */
        show = always || inRange || this.__hover || hoverBody === t.body;
      } else {
        show = inRange;
      }
    } else {
      show = inRange;
    }

    var visible = inFront && labelsEnabled && show && this.obj.visible;
    if (!always) visible = visible && camera.markersVisible;
    this.setVisible(visible);
  };

  labelLayerEl.appendChild(marker);
  markers.push(marker);

  return marker;
}
