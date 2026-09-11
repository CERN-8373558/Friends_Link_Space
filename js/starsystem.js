/* ============================================================
 * starsystem.js —— 恒星与行星系统 (对应原站 solarsystem.js / marker 组合)
 * 每颗友链 = 一个恒星系统：中心恒星光点 + 若干公转行星
 * ============================================================ */

var stars = [];            // 运行时条目
var interactiveSprites = []; // 可拾取的恒星 Sprite
var currentStar = null;    // 当前聚焦的恒星条目
var currentBody = null;    // 当前聚焦的三体关键用户
var hoverStar = null;      // 鼠标悬停的恒星条目
var hoverBody = null;      // 鼠标悬停的三体天体
var activeTag = null;      // 当前分组标签 (null = 全部)
var currentLayout = 'spiral';

var raycaster = new THREE.Raycaster();

function tagsMatch(entry) {
  if (!activeTag) return true;
  return entry.data.tags.indexOf(activeTag) >= 0;
}

/* 行星轨道环（进入星系视图时显示） */
function makeOrbitLine(r) {
  var group = new THREE.Group();
  var pts = [], N = 96, a;
  for (var i = 0; i < N; i++) {
    a = i / N * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }
  var line = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, depthWrite: false })
  );
  group.add(line);

  var dots = [], M = 48;
  for (i = 0; i < M; i++) {
    a = i / M * Math.PI * 2;
    dots.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }
  var pointCloud = new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(dots),
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 3,
      map: getDotTexture(),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: false
    })
  );
  group.add(pointCloud);

  return group;
}

/* 头像图片 → 圆形纹理（异步回调）。
 * 返回 { texture, gif }：gif 为 true 时由调用方用屏幕空间 DOM 叠加显示动图。
 * 任何失败都回退原图矩形，保证可见。 */
function makeAvatarTexture(src, cb) {
  var isGif = /\.gif($|\?)/i.test(src);
  var img = new Image();
  var s = 128;
  var cv = document.createElement('canvas');
  cv.width = s;
  cv.height = s;
  var c2d = cv.getContext('2d');

  img.onload = function () {
    try {
      c2d.clearRect(0, 0, s, s);
      c2d.beginPath();
      c2d.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
      c2d.closePath();
      c2d.clip();
      c2d.drawImage(img, 0, 0, s, s);
      cv.toDataURL();
    } catch (e) {
      new THREE.TextureLoader().load(src, function (t) {
        cb({ texture: t, gif: false });
      }, undefined, function () { cb(null); });
      return;
    }
    cb({ texture: new THREE.CanvasTexture(cv), gif: isGif });
  };
  img.onerror = function () {
    new THREE.TextureLoader().load(src, function (t) {
      cb({ texture: t, gif: false });
    }, undefined, function () { cb(null); });
  };
  img.src = src;
}

/* 屏幕空间 GIF 动图叠加：浏览器渲染动图，每帧投影到 3D 位置 */
function attachGifOverlay(anchor, src, basePx, visMin, visMax) {
  if (visMin === undefined) visMin = 0;
  if (visMax === undefined) visMax = 100000;
  var el = document.createElement('img');
  el.src = src;
  el.alt = '';
  el.style.cssText = 'position:absolute;pointer-events:none;border-radius:50%;object-fit:cover;';
  labelLayerEl.appendChild(el);
  var worldPos = new THREE.Vector3();
  var ov = {
    el: el,
    update: function () {
      anchor.getWorldPosition(worldPos);
      worldPos.project(camera);
      var sx = (worldPos.x * 0.5 + 0.5) * screenWidth;
      var sy = (-worldPos.y * 0.5 + 0.5) * screenHeight;
      var z = camera.position.z;
      var px = basePx * (420 / Math.max(z, 15));
      px = Math.max(22, Math.min(96, px));
      el.style.width = px + 'px';
      el.style.height = px + 'px';
      el.style.left = (sx - px / 2) + 'px';
      el.style.top = (sy - px / 2) + 'px';
      var show = camera.position.z >= visMin && camera.position.z <= visMax;
      el.style.display = show ? 'block' : 'none';
    }
  };
  gifOverlays.push(ov);
  return ov;
}

function buildStarSystem(starData, pos, noHalo) {
  var g = new THREE.Group();
  g.position.set(pos.x, 0, pos.z);

  var planetCount = starData.planets ? starData.planets.length : 0;
  var maxR = planetCount > 0 ? (0.9 + (planetCount - 1) * 0.8 + 0.7) : 0.4;
  var zoom = Math.max(6, (maxR + 1) * 2.4);

  var entry = {
    data: starData,
    group: g,
    glow: null,
    core: null,
    haloRing: null,
    labelMarker: null,
    planets: [],
    pos: pos,
    zoom: zoom,
    targetOpacity: 1,
    opacity: 1
  };

  var color = new THREE.Color(starData.color || '#ffffff');
  var useAvatar = !!(starData.avatar);
  var avatarUpd = { fn: null };

  /* 恒星光晕：有头像用圆形头像；无头像用中性白色星点（不按 star.color 染色） */
  var glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: getStarGlowTexture(),
    color: new THREE.Color(0xffffff),
    transparent: true,
    blending: useAvatar ? THREE.NormalBlending : THREE.AdditiveBlending,
    depthWrite: false,
    opacity: useAvatar ? 0 : 0.95
  }));
  var baseScale = (useAvatar ? 1.5 : 1.3) + Math.sqrt(planetCount) * 0.35;
  glow.scale.set(baseScale, baseScale, 1);
  g.add(glow);
  glow.userData.entry = entry;

  if (useAvatar) {
    (function (gm, up, spr) {
      makeAvatarTexture(starData.avatar, function (r) {
        if (r) {
          gm.map = r.texture;
          gm.needsUpdate = true;
          gm.opacity = 1;
          if (r.gif) {
            up.overlay = attachGifOverlay(spr, starData.avatar, 30);
          }
        } else {
          /* 头像加载失败：回退中性白色星点 */
          gm.map = getStarGlowTexture();
          gm.color.set('#ffffff');
          gm.blending = THREE.AdditiveBlending;
          gm.needsUpdate = true;
        }
      });
    })(glow.material, avatarUpd, glow);
  }

  /* 无头像恒星：仅保留白色核心星点（不再画彩色光环） */
  var haloRing = null;
  var core = null;
  if (!useAvatar) {
    core = new THREE.Sprite(new THREE.SpriteMaterial({
      map: getDotTexture(),
      color: 0xfff6e0,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 1
    }));
    core.scale.set(baseScale * 0.4, baseScale * 0.4, 1);
    g.add(core);
    core.userData.entry = entry;
  }

  entry.glow = glow;
  entry.core = core;
  entry.haloRing = haloRing;
  entry.avatarUpd = avatarUpd;

  /* 恒星名字标签锚点 */
  var labelAnchor = new THREE.Object3D();
  labelAnchor.name = starData.name;
  g.add(labelAnchor);
  var labelMarker = attachMarker(labelAnchor, 1.0, { min: 3, max: 230 }, { x: 0, y: -26 });
  labelMarker.__target = { type: 'star', entry: entry };
  entry.labelMarker = labelMarker;

  /* 行星 */
  for (var i = 0; i < planetCount; i++) {
    var pd = starData.planets[i];
    var r = 0.9 + i * 0.8;
    var radius = 0.09 + Math.min(0.07, planetCount * 0.012);

    var pcolor = new THREE.Color(pd.color || starData.color || '#ffffff');
    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 12, 8),
      new THREE.MeshBasicMaterial({ color: pcolor })
    );
    var anchor = new THREE.Object3D();
    anchor.name = pd.name;
    g.add(mesh);
    g.add(anchor);

    /* 行星轨道环 */
    var orbit = makeOrbitLine(r);
    g.add(orbit);

    var marker = attachMarker(anchor, 0.6, { min: 2, max: 60 }, { x: 0, y: 12 });
    marker.__target = { type: 'planet', data: pd, entry: entry };

    entry.planets.push({
      data: pd,
      mesh: mesh,
      anchor: anchor,
      orbit: orbit,
      marker: marker,
      r: r,
      angle: random(0, Math.PI * 2),
      speed: (0.5 + Math.random() * 0.7) / (i + 1) * 0.5,
      color: pcolor
    });
  }

  interactiveSprites.push(glow);
  interactiveSprites.push(glow);
  if (haloRing) interactiveSprites.push(haloRing);

  g.update = function (dt) {
    var t = Date.now() * 0.001;

    /* 动图头像逐帧刷新 */
    if (avatarUpd.fn) avatarUpd.fn();

    /* 行星公转 */
    for (var i = 0; i < entry.planets.length; i++) {
      var p = entry.planets[i];
      p.angle += p.speed * dt;
      p.mesh.position.set(Math.cos(p.angle) * p.r, 0, Math.sin(p.angle) * p.r);
      p.anchor.position.copy(p.mesh.position);
    }

    /* 分组过滤淡出 */
    var target = tagsMatch(entry) ? 1 : 0.06;
    entry.opacity += (target - entry.opacity) * 0.1;
    var dim = galaxyDim(camera.position.z);
    if (useAvatar) {
      glow.material.opacity = entry.opacity * dim;
    } else {
      glow.material.opacity = entry.opacity * dim * (0.8 + Math.sin(t * 2 + pos.x) * 0.15);
    }
    if (core) core.material.opacity = entry.opacity * dim;
    if (haloRing) haloRing.material.opacity = entry.opacity * dim * (0.45 + Math.sin(t * 1.4 + pos.z) * 0.18);

    /* 远景放大，保持恒星在银河全景中可见 */
    var screenScale = Math.max(1, camera.position.z / 420);
    var gs = baseScale * screenScale;
    glow.scale.set(gs, gs, 1);
    if (haloRing) haloRing.scale.set(gs * 1.75, gs * 1.75, 1);
    if (core) core.scale.set(gs * 0.4, gs * 0.4, 1);

    /* 星名标签随头像/光点大小上移，避免与图片重叠 */
    var pxPerWorld = screenHeight / (2 * camera.position.z * Math.tan(camera.fov * Math.PI / 360));
    var avPx = 0;
    if (useAvatar) {
      avPx = 30 * (420 / Math.max(camera.position.z, 15));
      avPx = Math.max(22, Math.min(96, avPx));
    }
    entry.labelMarker.__offsetY = -(Math.max(avPx, gs * pxPerWorld) * 0.5 + 22);

    glow.visible = entry.opacity > 0.02;
    if (core) core.visible = glow.visible;
    if (haloRing) haloRing.visible = glow.visible;

    /* 行星显隐：仅聚焦且在该标签时显示（轨道同步） */
    var showPlanets = currentStar === entry && tagsMatch(entry) && camera.position.z < 70;
    for (var j = 0; j < entry.planets.length; j++) {
      var pp = entry.planets[j];
      pp.mesh.visible = showPlanets;
      pp.orbit.visible = showPlanets;
    }
  };

  stars.push(entry);
  return entry;
}

/* 拾取恒星/三体 (返回 {type:'star',entry} / {type:'body',body} / null) */
function pickStarAt(event) {
  var ndc = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(ndc, camera);
  var hits = raycaster.intersectObjects(interactiveSprites, false);
  for (var i = 0; i < hits.length; i++) {
    var u = hits[i].object.userData;
    if (u.entry) return { type: 'star', entry: u.entry };
    if (u.body) return { type: 'body', body: u.body };
  }
  return null;
}

/* 每帧更新悬停检测（用最近一次鼠标位置） */
function updateHover() {
  if (dragging) {
    hoverStar = null;
    hoverBody = null;
    return;
  }
  if (mouseOverUI) {
    hoverStar = null;
    hoverBody = null;
    return;
  }
  var w = window.innerWidth, h = window.innerHeight;
  var ndc = new THREE.Vector2(
    (mouseX / (w / 2)),
    -(mouseY / (h / 2))
  );
  raycaster.setFromCamera(ndc, camera);
  var hits = raycaster.intersectObjects(interactiveSprites, false);
  var foundStar = null, foundBody = null;
  for (var i = 0; i < hits.length; i++) {
    var u = hits[i].object.userData;
    if (u.entry && !foundStar) { foundStar = u.entry; }
    else if (u.body && !foundBody) { foundBody = u.body; }
  }
  hoverStar = foundStar;
  hoverBody = foundBody;
}
