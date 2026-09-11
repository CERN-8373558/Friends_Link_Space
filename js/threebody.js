/* ============================================================
 * threebody.js —— 银河之心 + 三个关键用户的 4 体引力模拟
 * 银河之心固定在银心原点（大质量引力源），三个关键用户
 * 在它的引力下沿各自半径的轨道公转（半隐式欧拉积分），
 * 三用户之间也有微弱引力（近似真实 4 体）。
 * 保留：最小距离保护、动量平衡、范围限制（cage）。
 * ============================================================ */

var threeBodySystem = null;

function initThreeBody(cfg, starsArr) {
  if (!cfg || !cfg.enabled) return null;

  var group = new THREE.Group();
  var radii = cfg.radii || [6, 8.5, 11];
  var centerMass = cfg.centerMass || 300;
  var g = (cfg.G !== undefined) ? cfg.G : 1;

  var defs = (cfg.bodies && cfg.bodies.length >= 3) ? cfg.bodies : [
    { starIndex: 0 }, { starIndex: 1 }, { starIndex: 2 }
  ];

  var bodies = [];
  for (var i = 0; i < 3; i++) {
    var d = defs[i] || {};
    var star = (starsArr && starsArr[d.starIndex]) || {};
    var color = new THREE.Color(star.color || d.color || ['#ff6b6b', '#ffd93d', '#6bcf7f'][i]);
    var name = star.name || d.name || ('关键用户·' + (i + 1));

    var useAvatar = !!(star.avatar);
    var avatarUpd = { fn: null };
    var glowMat = new THREE.SpriteMaterial({
      map: getDotTexture(),
      color: new THREE.Color(0xffffff),
      transparent: true,
      blending: useAvatar ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 1
    });
    var glow = new THREE.Sprite(glowMat);
    glow.scale.set(2.6, 2.6, 1);
    if (useAvatar) {
      (function (gm, up, spr, avatarSrc) {
        makeAvatarTexture(avatarSrc, function (r) {
          if (r) {
            /* sprite 设为透明，仅作点击/位置层；头像统一由屏幕层 overlay 显示（否则贴近时会变黑） */
            gm.map = r.texture;
            gm.needsUpdate = true;
            gm.opacity = 0;
            up.overlay = attachGifOverlay(spr, avatarSrc, 36);
          } else {
            /* 头像加载失败：回退中性圆形光晕（不用球体） */
            gm.map = getDotTexture();
            gm.blending = THREE.AdditiveBlending;
            gm.needsUpdate = true;
          }
        });
      })(glowMat, avatarUpd, glow, star.avatar);
    }

    var anchor = new THREE.Object3D();
    anchor.name = name;
    group.add(glow);
    group.add(anchor);

    var body = {
      data: d,
      star: star,
      mesh: null,
      glow: glow,
      anchor: anchor,
      marker: null,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      mass: d.mass || 1,
      radius: radii[i],
      angle: i * Math.PI * 2 / 3 + random(0, Math.PI * 2)
    };
    body.avatarUpd = avatarUpd;
    bodies.push(body);

    var marker = attachMarker(anchor, 1.0, { min: 3, max: 220 });
    marker.__target = { type: 'body', name: name, star: star, body: body };
    body.marker = marker;
    glow.userData.body = body;
    interactiveSprites.push(glow);

    /* 该关键用户的项目（行星 + 轨道环）：聚焦时随其一起公转显示 */
    body.planets = [];
    var planetCount = (star.planets && star.planets.length) || 0;
    for (var p = 0; p < planetCount; p++) {
      var pd = star.planets[p];
      var pr = 0.9 + p * 0.8;
      var pradius = 0.09 + Math.min(0.07, planetCount * 0.012);
      var pcolor = new THREE.Color(pd.color || star.color || '#ffffff');
      var pm = new THREE.Mesh(
        new THREE.SphereGeometry(pradius, 12, 8),
        new THREE.MeshBasicMaterial({ color: pcolor })
      );
      pm.name = pd.name || '项目';
      pm.visible = false;
      var porbit = makeOrbitLine(pr);
      porbit.visible = false;
      anchor.add(pm);
      anchor.add(porbit);
      var pmarker = attachMarker(pm, 0.6, { min: 2, max: 60 }, { x: 0, y: 12 });
      pmarker.__target = { type: 'planet', data: pd, entry: { data: star }, body: body };
      body.planets.push({
        data: pd,
        mesh: pm,
        orbit: porbit,
        marker: pmarker,
        r: pr,
        angle: random(0, Math.PI * 2),
        speed: (0.5 + Math.random() * 0.7) / (p + 1) * 0.5
      });
    }
  }

  /* 初始圆轨道（开普勒速度 v = sqrt(G·M/r)） */
  for (var i = 0; i < bodies.length; i++) {
    var b = bodies[i];
    var v = Math.sqrt(g * centerMass / b.radius);
    var a = b.angle;
    b.pos.set(Math.cos(a) * b.radius, 0, Math.sin(a) * b.radius);
    b.vel.set(-Math.sin(a) * v, 0, Math.cos(a) * v);
  }

  var sys = {
    group: group,
    bodies: bodies,
    cfg: cfg,
    g: g,
    centerMass: centerMass,
    minDist: (cfg.minDist !== undefined) ? cfg.minDist : 0.5
  };

  sys.group.update = function (dt) {
    updateThreeBody(dt);
  };

  threeBodySystem = sys;
  return group;
}

/* 引力加速度：银河之心（原点）+ 三用户之间 */
function computeAcc(bodies, M, g, minDist) {
  var acc = bodies.map(function () { return new THREE.Vector3(); });

  /* 银河之心引力 */
  for (var i = 0; i < bodies.length; i++) {
    var dx = -bodies[i].pos.x;
    var dz = -bodies[i].pos.z;
    var r = Math.hypot(dx, dz);
    if (r < minDist) r = minDist;
    var a = g * M / (r * r * r);
    acc[i].x += a * dx;
    acc[i].z += a * dz;
  }

  /* 用户之间引力 */
  for (var i = 0; i < bodies.length; i++) {
    for (var j = i + 1; j < bodies.length; j++) {
      var dx2 = bodies[j].pos.x - bodies[i].pos.x;
      var dz2 = bodies[j].pos.z - bodies[i].pos.z;
      var r2 = Math.hypot(dx2, dz2);
      if (r2 < minDist) r2 = minDist;
      var f = g / (r2 * r2 * r2);
      acc[i].x += f * dx2 * bodies[j].mass;
      acc[i].z += f * dz2 * bodies[j].mass;
      acc[j].x -= f * dx2 * bodies[i].mass;
      acc[j].z -= f * dz2 * bodies[i].mass;
    }
  }
  return acc;
}

/* 动量平衡：三用户质心速度归零 */
function balanceMomentum(bodies) {
  var cvx = 0, cvz = 0, tm = 0;
  bodies.forEach(function (b) { cvx += b.vel.x * b.mass; cvz += b.vel.z * b.mass; tm += b.mass; });
  if (tm <= 0) return;
  cvx /= tm; cvz /= tm;
  bodies.forEach(function (b) { b.vel.x -= cvx; b.vel.z -= cvz; });
}

/* 范围限制：三用户绕银河之心（原点）公转，不得飞出设定半径 */
function cageBodies(bodies, cfg) {
  var maxD = (cfg.cageRadius !== undefined) ? cfg.cageRadius : 15;
  for (var i = 0; i < bodies.length; i++) {
    var b = bodies[i];
    var dist = b.pos.length();
    if (dist > maxD && dist > 0.0001) {
      var dx = b.pos.x, dz = b.pos.z;
      var vdot = (b.vel.x * dx + b.vel.z * dz) / dist;
      if (vdot > 0) {
        b.vel.x -= (dx / dist) * vdot;
        b.vel.z -= (dz / dist) * vdot;
      }
      b.pos.setLength(maxD);
    }
  }
}

function updateThreeBody(dt) {
  var sys = threeBodySystem;
  if (!sys) return;
  var bodies = sys.bodies;
  var cfg = sys.cfg;

  dt = Math.min(dt, 0.25);

  /* 半隐式欧拉积分（子步保证稳定） */
  var steps = 8, h = dt / steps;
  for (var s = 0; s < steps; s++) {
    var acc = computeAcc(bodies, sys.centerMass, sys.g, sys.minDist);
    for (var i = 0; i < bodies.length; i++) {
      bodies[i].vel.x += acc[i].x * h;
      bodies[i].vel.z += acc[i].z * h;
    }
    for (var k = 0; k < bodies.length; k++) {
      bodies[k].pos.x += bodies[k].vel.x * h;
      bodies[k].pos.z += bodies[k].vel.z * h;
    }
  }

  /* 范围限制 */
  cageBodies(bodies, cfg);

  /* 渲染 */
  var camZ = camera.position.z;
  var screenScale = Math.max(1, camZ / 420) * (cfg.scale || 1);
  for (var m = 0; m < bodies.length; m++) {
    var b = bodies[m];
    if (b.avatarUpd && b.avatarUpd.fn) b.avatarUpd.fn();
    b.glow.position.copy(b.pos);
    b.anchor.position.copy(b.pos);
    b.glow.scale.set(2.6 * screenScale, 2.6 * screenScale, 1);

    /* 名字标签随头像上移，避免与图片重叠 */
    if (b.marker) {
      var avPx = 36 * (420 / Math.max(camZ, 15));
      avPx = Math.max(22, Math.min(96, avPx));
      b.marker.__offsetY = -(avPx * 0.5 + 22);
    }

    /* 子项目行星公转（仅聚焦该关键用户且足够近时显示） */
    if (b.planets && b.planets.length) {
      var showP = currentBody === b && camZ < 70;
      for (var pi = 0; pi < b.planets.length; pi++) {
        var pp = b.planets[pi];
        pp.angle += pp.speed * dt;
        pp.mesh.position.set(Math.cos(pp.angle) * pp.r, 0, Math.sin(pp.angle) * pp.r);
        pp.mesh.visible = showP;
        pp.orbit.visible = showP;
      }
    }
  }
}
