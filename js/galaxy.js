/* ============================================================
 * galaxy.js —— 银河布局与星尘粒子 (对应原站 galaxy.js 的旋臂算法)
 * 支持两种布局：spiral（旋臂）/ random（随机散点）
 * 参数由 data/links.json 的 galaxy 配置驱动
 * ============================================================ */

var GALAXY_RADIUS = 115;

/* 银河全局配置（默认值，会被 links.json 的 galaxy 覆盖） */
var GConfig = {
  radius: 115,      /* 友链恒星分布半径 */
  arms: 4,          /* 旋臂数量 */
  diskRadius: 430,  /* 银河盘（星尘/光晕）半径 */
  dust: 16000,      /* 星尘粒子数 */
  startZoom: 420,   /* 初始缩放距离 */
  maxZoom: 1600,    /* 最大缩放距离（拉到最远看整个银河） */
  centerClear: 24,  /* 银河中心留白半径（三体区域，恒星不进入） */
  seed: 20260830    /* 布局随机种子（固定则恒星位置可复现） */
};

function applyGalaxyConfig(cfg) {
  if (!cfg) return;
  for (var k in GConfig) {
    if (cfg[k] !== undefined) GConfig[k] = cfg[k];
  }
  GALAXY_RADIUS = GConfig.radius;
}

/* 若落入中心留白区，把点径向推到留白半径外（确定性） */
function pushOutOfCenter(x, z, rMin) {
  if (rMin <= 0) return { x: x, z: z };
  var rr = Math.sqrt(x * x + z * z);
  if (rr < rMin && rr > 0.0001) {
    x = x / rr * rMin;
    z = z / rr * rMin;
  }
  return { x: x, z: z };
}

/* 计算每颗恒星在银河平面上的坐标，返回 [{x, z}]
 * 使用固定种子 → 每次刷新 / 切换布局位置稳定可复现 */
function computeLayout(stars, layout) {
  var N = stars.length;
  var positions = [];
  var rMin = GConfig.centerClear || 0;
  var R = GConfig.radius;
  var seed = (GConfig.seed !== undefined) ? GConfig.seed : 20260830;
  /* 两种布局使用不同种子，避免分布相同 */
  var rand = mulberry32(seed + (layout === 'random' ? 0x3C6EF35F : 0));

  if (layout === 'spiral') {
    var numArms = GConfig.arms;
    for (var i = 0; i < N; i++) {
      var arm = i % numArms;
      var dist = rMin + Math.pow(rand(), 0.45) * (R - rMin);
      var angle = rand() * Math.PI * 2 + arm * (Math.PI * 2 / numArms) + (dist / R) * Math.PI * 2 * 1.6;
      var scatter = 2.5 + dist * 0.13;
      var x = Math.cos(angle) * dist + (rand() * 2 - 1) * scatter;
      var z = Math.sin(angle) * dist + (rand() * 2 - 1) * scatter;
      positions.push(pushOutOfCenter(x, z, rMin));
    }
  } else {
    for (var i = 0; i < N; i++) {
      var dist = rMin + Math.pow(rand(), 0.55) * (R - rMin);
      var angle = rand() * Math.PI * 2;
      var x = Math.cos(angle) * dist;
      var z = Math.sin(angle) * dist;
      positions.push(pushOutOfCenter(x, z, rMin));
    }
  }
  return positions;
}

/* 银河星尘粒子（背景，随布局重生成；远景呈现旋臂盘） */
var galaxyDust = null;

function generateGalaxyDust(layout) {
  var count = GConfig.dust;
  var R = GConfig.diskRadius;
  var positions = new Float32Array(count * 3);
  var colors = new Float32Array(count * 3);
  var numArms = GConfig.arms;

  for (var i = 0; i < count; i++) {
    var x, z;
    if (layout === 'spiral') {
      var arm = i % numArms;
      var dist = Math.pow(Math.random(), 0.5) * R * 0.95;
      var angle = arm * (Math.PI * 2 / numArms) + (dist / R) * Math.PI * 2 * 1.5;
      var scatter = (1.5 + dist * 0.05);
      if (Math.random() > 0.3) scatter *= (1 + Math.random()) * 1.5;
      x = Math.cos(angle) * dist + random(-scatter, scatter);
      z = Math.sin(angle) * dist + random(-scatter, scatter);
    } else {
      var dist2 = Math.pow(Math.random(), 0.6) * R * 0.95;
      var ang2 = random(0, Math.PI * 2);
      x = Math.cos(ang2) * dist2;
      z = Math.sin(ang2) * dist2;
    }

    /* 盘越往外越薄 */
    var rr = Math.min(1, Math.sqrt(x * x + z * z) / R);
    var y = random(-8, 8) * (1 - Math.sqrt(rr));

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    var bright = 0.4 + Math.random() * 0.6;
    var c = new THREE.Color();
    c.setHSL(0.58 + random(-0.06, 0.06), 0.7, bright * 0.9);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  galaxyDust = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 2.2,
    map: getDotTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: false
  }));

  /* 近景变淡，远景（拉远看银河）更清晰，极远景则整体变暗 */
  galaxyDust.update = function () {
    var z = camera.position.z;
    if (!controllers.dust) {
      this.material.opacity = 0;
      this.visible = false;
      return;
    }
    var near = z < 150 ? 0.28 : cmap(z, 150, 600, 0.28, 0.62);
    this.material.opacity = near * galaxyDim(z);
    this.visible = this.material.opacity > 0.01;
  };

  return galaxyDust;
}

/* 银河盘基座（远景看到的椭圆盘面） */
function getGalaxyDiskTexture() {
  var c = makeCanvas(256, 256, function (ctx, w, h) {
    var cx = w / 2, cy = h / 2;
    var g = ctx.createRadialGradient(cx, cy, w * 0.03, cx, cy, w * 0.5);
    g.addColorStop(0, 'rgba(255,244,214,0.9)');
    g.addColorStop(0.12, 'rgba(255,224,160,0.6)');
    g.addColorStop(0.3, 'rgba(185,185,255,0.35)');
    g.addColorStop(0.55, 'rgba(120,140,255,0.18)');
    g.addColorStop(0.85, 'rgba(80,100,220,0.06)');
    g.addColorStop(1, 'rgba(60,80,200,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  return canvasToTexture(c);
}

function makeGalaxyDisk() {
  var disk = new THREE.Mesh(
    new THREE.CircleGeometry(GConfig.diskRadius, 96),
    new THREE.MeshBasicMaterial({
      map: getGalaxyDiskTexture(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })
  );
  disk.rotation.x = -Math.PI / 2;

  disk.update = function () {
    var z = camera.position.z;
    if (z > 150) {
      this.visible = true;
      this.material.opacity = cmap(z, 150, 800, 0.05, 0.22);
    } else {
      this.visible = false;
      this.material.opacity = 0;
    }
  };
  return disk;
}

/* 银心辉光（远景的明亮核心） */
function makeGalaxyCore() {
  var core = new THREE.Sprite(new THREE.SpriteMaterial({
    map: getStarGlowTexture(),
    color: 0xffe6b0,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0
  }));
  core.scale.set(120, 120, 1);

  core.update = function () {
    var z = camera.position.z;
    var t = Date.now() * 0.001;
    if (z > 150) {
      this.visible = true;
      this.material.opacity = cmap(z, 150, 800, 0.05, 0.32) * galaxyDim(z) * (0.85 + Math.sin(t * 0.8) * 0.15);
    } else {
      this.visible = false;
      this.material.opacity = 0;
    }
  };
  return core;
}

/* 远景背景星野（球壳上的稀疏星点，固定于天空） */
function makeBackgroundStars() {
  var group = new THREE.Group();
  var dot = getDotTexture();

  var layers = [
    { count: 2400, size: 2.2 },
    { count: 700, size: 3.4 },
    { count: 200, size: 6 }
  ];

  for (var l = 0; l < layers.length; l++) {
    var cfg = layers[l];
    var positions = new Float32Array(cfg.count * 3);
    var colors = new Float32Array(cfg.count * 3);
    var palette = [0xffffff, 0xffffff, 0xdde4ff, 0xffe0b0, 0xbfcfff];

    for (var i = 0; i < cfg.count; i++) {
      var theta = random(0, Math.PI * 2);
      var phi = Math.acos(random(-1, 1));
      var r = random(900, 1600);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      var c = new THREE.Color(palette[(Math.random() * palette.length) | 0]);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    group.add(new THREE.Points(geo, new THREE.PointsMaterial({
      size: cfg.size,
      map: dot,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: false
    })));
  }
  return group;
}
