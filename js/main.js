/* ============================================================
 * main.js —— 友链宇宙主程序
 * ============================================================ */

var scene, camera, renderer;
var rotating, galacticCentering, translating, starsGroup;
var backgroundStars;

var linksData = null;
var firstTime = localStorage ? (localStorage.getItem('first') == null) : true;
var labelsEnabled = true;
var labelsAlways = false; /* 名字永久显示 */

var startTime = Date.now();
var clock = new THREE.Clock();

cameraZoomMax = GConfig.maxZoom; /* 适配银河远景 */

/* ---------- 彩蛋：空间站（到阈值时只显示那张图片） ---------- */
/* 连续拉远：银河缩成点后 3D 场景淡出，空间站图片从"窗户特写"缩小呈现整张图；
   到达最大缩放并停留 3 秒后，佩丽卡 Live2D 从底部滑入 */
var easterOn = false;
var EASTER_FADE_START = 4000000;
var EASTER_FADE_END = 6800000;
var l2dTimer = null;
var l2dShown = false;

function initEasterWindow() {
  /* 无额外内容，仅空间站图片 */
}

function updateEasterWindow() {
  if (!easterWindowEl) return;
  var z = camera.position.z;

  /* 舷窗透明度随缩放连续渐变 */
  var t = clamp01(cmap(z, EASTER_FADE_START, EASTER_FADE_END, 0, 1));
  if (t > 0.01 && easterWindowEl.style.display !== 'block') {
    easterWindowEl.style.display = 'block';
  } else if (t <= 0.01 && easterWindowEl.style.display !== 'none') {
    easterWindowEl.style.display = 'none';
  }
  easterOn = t > 0.5;
  easterWindowEl.style.opacity = t;

  /* 到阈值时只有图片：3D 场景与标签随渐现同步淡出 */
  if (glContainerEl) glContainerEl.style.opacity = (1 - t).toFixed(3);
  if (labelLayerEl) labelLayerEl.style.opacity = (1 - t).toFixed(3);

  /* 空间站图片入场：先放大到窗户特写，再缩小呈现整张图 */
  if (winBgEl) {
    var scale = 3.0 - t * 2.0; /* t:0 → 3.0(窗户特写)  t:1 → 1.0(完整图) */
    winBgEl.style.transform = 'scale(' + scale.toFixed(3) + ')';
  }

  /* 到达最大缩放并停留 3 秒 → 佩丽卡从底部滑入；回退则隐藏 */
  var atMax = z >= cameraZoomMax * 0.995;
  if (atMax && !l2dShown) {
    if (!l2dTimer) {
      l2dTimer = setTimeout(function () {
        l2dTimer = null;
        l2dShown = true;
        if (window.__live2d) window.__live2d.show();
      }, 3000);
    }
  } else if (!atMax) {
    if (l2dTimer) { clearTimeout(l2dTimer); l2dTimer = null; }
    if (l2dShown) {
      l2dShown = false;
      if (window.__live2d) window.__live2d.hide();
    }
  }
}

/* ---------- 音频 ---------- */
var audioCtx = null;
var masterGain = null;
var soundStarted = false;
var muted = localStorage ? localStorage.getItem('sound') === '0' : false;

function buildAmbientAudio() {
  try {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioCtx.destination);

    var filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.connect(masterGain);

    var lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.06;
    var lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 40;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    [55, 55.3, 110.2].forEach(function (f) {
      var o = audioCtx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(filter);
      o.start();
    });

    if (muted) volumeEl.classList.add('muted');
  } catch (e) { }
}

function startAmbient() {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  soundStarted = true;
  if (!muted) masterGain.gain.value = 0.5;
  document.removeEventListener('pointerdown', startAmbient);
  document.removeEventListener('keydown', startAmbient);
}

function muteSound() {
  muted = true;
  if (localStorage) localStorage.setItem('sound', '0');
  if (masterGain) masterGain.gain.value = 0;
  if (volumeEl) volumeEl.classList.add('muted');
}

function unmuteSound() {
  muted = false;
  if (localStorage) localStorage.setItem('sound', '1');
  if (masterGain && soundStarted) masterGain.gain.value = 0.5;
  if (volumeEl) volumeEl.classList.remove('muted');
}

/* ---------- 特性开关 ---------- */

function setFeature(name, val) {
  if (name === 'labels') {
    labelsEnabled = val;
  } else if (name === 'alwaysLabels') {
    labelsAlways = val;
  } else if (name === 'dust') {
    /* 星尘显隐由 galaxyDust.update 依据 controllers.dust 处理 */
  } else if (name === 'layout') {
    switchLayout(val);
  }
}

/* ---------- 启动 ---------- */

function start() {
  if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
    return;
  }

  initDOM();

  loadLinks(function (data) {
    linksData = data || DEFAULT_LINKS;
    applyGalaxyConfig(linksData.galaxy);
    cameraZoomMax = GConfig.maxZoom;
    cameraZoomMin = GConfig.startZoom / MAX_ZOOM_RATIO; /* 最大放大 10.0× */
    initScene();
    initDebug();
    animate();

    document.addEventListener('pointerdown', startAmbient, false);
    document.addEventListener('keydown', startAmbient, false);
  });
}

function initScene() {

  /* 场景层级：scene → rotating → galacticCentering → translating */
  scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0x404052, 1.0));

  rotating = new THREE.Group();
  galacticCentering = new THREE.Group();
  translating = new THREE.Group();
  starsGroup = new THREE.Group();

  galacticCentering.add(translating);
  rotating.add(galacticCentering);
  scene.add(rotating);

  translating.targetPosition = new THREE.Vector3();
  translating.update = function () {
    if (this.easePanning) return;
    this.position.lerp(this.targetPosition, 0.1);
    if (this.position.distanceTo(this.targetPosition) < 0.01) {
      this.position.copy(this.targetPosition);
    }
  };

  /* 渲染器 */
  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;
  screenWhalf = screenWidth / 2;
  screenHhalf = screenHeight / 2;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(screenWidth, screenHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 1);
  renderer.autoClear = false;
  renderer.sortObjects = false;
  glContainerEl.appendChild(renderer.domElement);

  /* 相机（near=5 与 cameraZoomMin 一致） */
  camera = new THREE.PerspectiveCamera(40, screenWidth / screenHeight, 5, 16000000);
  var startZ = urlArgs.getInt('z', GConfig.startZoom);
  camera.position.z = startZ;
  camera.position.target = { x: 0, z: startZ, pz: startZ };

  camera.update = function () {
    if (this.__tour) return;
    if (this.easeZooming) return;
    this.position.z += (this.position.target.z - this.position.z) * 0.125;
  };

  scene.add(camera);

  /* 初始视角 */
  rotateX = 0.6;
  rotateY = 0.9;

  /* 事件 */
  window.addEventListener('mousemove', onDocumentMouseMove, true);
  window.addEventListener('mousedown', onDocumentMouseDown, true);
  window.addEventListener('mouseup', onDocumentMouseUp, false);
  window.addEventListener('click', onClick, true);
  window.addEventListener('wheel', onMouseWheel, { passive: false });
  window.addEventListener('keydown', onKeyDown, false);
  window.addEventListener('touchstart', touchStart, { passive: false });
  window.addEventListener('touchend', touchEnd, false);
  window.addEventListener('touchmove', touchMove, { passive: false });
  window.addEventListener('resize', onWindowResize, false);

  /* UI */
  buildGUI();
  buildTopbar();
  sceneSetup();
  initCSS3D();
  initEasterWindow();

  detailCloseEl.addEventListener('click', function (e) {
    e.stopPropagation();
    closeDetail();
    followTarget = null;
  });

  /* 加载动画 */
  setLoadMessage('读取星图');
  setTimeout(function () { setLoadMessage('点亮恒星'); }, 420);
  setTimeout(function () { setLoadMessage('行星入轨'); }, 840);
  setTimeout(function () { setLoadMessage('撒下星尘'); }, 1260);
  setTimeout(function () { setLoadMessage('校准镜头'); }, 1680);
  setTimeout(function () {
    layoutEl.classList.add('ready');
    fadeOut(loaderEl, 500, function () {
      topbarEl.style.display = 'block';
      if (firstTime && urlArgs.getBoolean('intro', true)) {
        displayIntroMessage();
        if (localStorage) localStorage.setItem('first', '0');
      }
    });
  }, 2100);
}

function sceneSetup() {
  currentLayout = (urlArgs.layout && (urlArgs.layout === 'random' || urlArgs.layout === 'spiral'))
    ? urlArgs.layout : (linksData.defaultLayout || 'spiral');
  controllers.layout = currentLayout;

  /* 三个关键用户进入三体系统、银心友链固定于原点，都不参与普通银河布局 */
  var skip = {};
  var tbCfg = linksData.threeBody;
  if (tbCfg && tbCfg.enabled && tbCfg.bodies) {
    for (var s = 0; s < tbCfg.bodies.length; s++) skip[tbCfg.bodies[s].starIndex] = true;
  }
  var centerStar = null;
  for (var c = 0; c < linksData.stars.length; c++) {
    if (linksData.stars[c].center) { centerStar = linksData.stars[c]; skip[c] = true; }
  }
  var normalStars = [];
  for (var i = 0; i < linksData.stars.length; i++) {
    if (!skip[i]) normalStars.push(linksData.stars[i]);
  }

  var positions = computeLayout(normalStars, currentLayout);
  translating.add(starsGroup);
  for (var i = 0; i < normalStars.length; i++) {
    var entry = buildStarSystem(normalStars[i], positions[i]);
    starsGroup.add(entry.group);
  }

  /* 银河中心：固定的「银河之心」友链（不画圆环光圈，避免"圆圈"） */
  if (centerStar) {
    var centerEntry = buildStarSystem(centerStar, { x: 0, z: 0 }, true);
    starsGroup.add(centerEntry.group);
  }

  /* 银河星尘 + 银心辉光 + 远景星空（去掉银河盘圆盘，避免"圆圈包住银河"） */
  var dust = generateGalaxyDust(currentLayout);
  translating.add(dust);
  var core = makeGalaxyCore();
  translating.add(core);
  backgroundStars = makeBackgroundStars();
  rotating.add(backgroundStars);

  /* 三体系统：三个关键用户在银河之心引力下沿各自轨道公转 */
  var threeBodyGroup = initThreeBody(tbCfg, linksData.stars);
  if (threeBodyGroup) translating.add(threeBodyGroup);

  /* 巡游站点 */
  tour.states = buildTourStops();
}

/* ---------- 视图控制 ---------- */

/* 10.0× 缩放限制只在银河全景生效，进入某个友链星系后解除，可自由贴近观察 */
function setZoomLimited(limited) {
  cameraZoomMin = limited ? (GConfig.startZoom / MAX_ZOOM_RATIO) : ZOOM_MIN_ABSOLUTE;
}

/* 拉远回到银河全景距离时自动恢复 10.0× 限制（无需手动重置） */
function updateZoomLimit() {
  var cap = GConfig.startZoom / MAX_ZOOM_RATIO;
  if (!camera.easeZooming && !followTarget &&
      cameraZoomMin < cap && camera.position.z >= cap) {
    cameraZoomMin = cap;
  }
}

var BODY_ENTRY_ZOOM = 14; /* 点击关键用户时拉近的距离 */

function enterStar(entry) {
  if (!entry) return;
  currentStar = entry;
  currentBody = null;
  setZoomLimited(false);
  followTarget = entry.group;
  centerOn(entry.group.position.clone());
  zoomIn(entry.zoom);
  starNameTextEl.innerHTML = entry.data.name;
  openDetail({ type: 'star', entry: entry });
}

/* 点击三个「关键用户」：像普通恒星一样拉近聚焦（跟随其公转） */
function enterBody(body) {
  if (!body) return;
  currentStar = null;
  currentBody = body;
  setZoomLimited(false);
  followTarget = body.anchor;
  centerOn(body.pos.clone());
  zoomIn(BODY_ENTRY_ZOOM);
  starNameTextEl.innerHTML = body.anchor.name;
  openDetail({ type: 'body', name: body.anchor.name, star: body.star, body: body });
}

function resetToGalaxy() {
  currentStar = null;
  currentBody = null;
  followTarget = null;
  setZoomLimited(true);
  closeDetail();
  centerOn(new THREE.Vector3(0, 0, 0));
  zoomOut(GConfig.startZoom);
  starNameTextEl.innerHTML = '';
}

function jumpRandomStar() {
  var pool = [];
  for (var i = 0; i < stars.length; i++) {
    if (tagsMatch(stars[i])) pool.push(stars[i]);
  }
  if (!pool.length) pool = stars.slice();
  var pick = pool[(Math.random() * pool.length) | 0];
  enterStar(pick);
}

function switchLayout(layout) {
  if (layout === currentLayout) return;
  currentLayout = layout;

  var positions = computeLayout(linksData.stars, layout);
  for (var i = 0; i < stars.length; i++) {
    (function (entry, p) {
      new TWEEN.Tween(entry.group.position)
        .to({ x: p.x, z: p.z }, 1200)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .start();
      entry.pos = p;
    })(stars[i], positions[i]);
  }

  /* 重建星尘（update 会按相机距离自动调整显隐） */
  if (galaxyDust) {
    translating.remove(galaxyDust);
    galaxyDust.geometry.dispose();
  }
  var dust = generateGalaxyDust(layout);
  translating.add(dust);
}

function centerOnSun() {
  resetToGalaxy();
}

/* ---------- 详情面板 ---------- */

function esc(s) {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function avatarHtml(d) {
  var initial = (d.name || '?').charAt(0);
  var bg = d.color || '#ffcc55';
  return '<div class="detail-avatar"><img src="' + esc(d.avatar) +
    '" onerror="this.style.display=\'none\';var n=this.nextSibling;if(n)n.style.display=\'block\'">' +
    '<span class="fallback" style="background:' + esc(bg) + '">' + esc(initial) + '</span></div>';
}

function openDetail(target) {
  if (!target) return;
  var html = '';

  if (target.type === 'about') {
    detailTitleEl.innerHTML = linksData.title || '友链宇宙';
    html += '<p>这是一个「星空宇宙」风格的友链展示页：每一位朋友都是一颗<b>恒星</b>，TA 的子项目/链接是围绕恒星公转的<b>行星</b>。</p>';
    html += '<p>· 拖动旋转视角，滚轮缩放；<br>· 点击一颗恒星，进入它的星系并查看资料；<br>· 点击行星，可跳转到对应项目；<br>· 顶部可搜索、按标签筛选，或随机看一颗星；<br>· 右上角「控制面板」可切换「旋臂 / 随机」两种银河布局。</p>';
    html += '<p>当前共有 <b>' + stars.length + '</b> 颗恒星、<b>' + countPlanets() + '</b> 颗行星。</p>';
  } else if (target.type === 'star') {
    var d = target.entry.data;
    detailTitleEl.innerHTML = d.name;
    html += starDetailHtml(d);
  } else if (target.type === 'planet') {
    var d2 = target.data;
    var sd = target.entry ? target.entry.data : null;
    detailTitleEl.innerHTML = d2.name;
    html += '<p>' + (sd ? '这是 <b>' + esc(sd.name) + '</b> 的一个子项目。' : '') + '</p>';
    html += '<p>' + esc(d2.desc || '') + '</p>';
    html += '<a class="detail-link" href="' + esc(d2.url) + '" target="_blank" rel="noopener">前往项目 →</a>';
  } else if (target.type === 'body') {
    /* 三个关键用户之一（也是友链用户） */
    var sd = target.star;
    if (sd) {
      detailTitleEl.innerHTML = sd.name;
      html += starDetailHtml(sd);
      html += '<p style="margin-top:14px;opacity:0.7;font-size:13px">★ 这是一位关键用户：在银河之心的引力下，与另外两位一起沿各自的轨道公转。</p>';
    } else {
      detailTitleEl.innerHTML = target.name || '关键用户';
      html += '<p>这是一位<b>关键用户</b>，与另外两位一起绕着银河中心（银河之心）公转。</p>';
      html += '<p>三颗恒星在银河之心的引力下沿各自轨道运行（4 体引力模拟，含最小距离保护与范围限制）。</p>';
    }
  }

  detailBodyEl.innerHTML = html;
  detailContainer.classList.remove('about');
  fadeIn(detailContainer, 300);
  /* 关键用户及其子项目依赖屏幕层显示头像，打开详情时不要隐藏标签层（否则头像会消失/变黑） */
  var keepLabels = (target.type === 'body') || (target.type === 'planet' && target.body);
  if (!keepLabels) labelLayerEl.style.display = 'none';
}

/* 渲染一位友链（恒星）的完整详情 HTML */
function starDetailHtml(d) {
  var h = '';
  h += '<div class="detail-head">' + avatarHtml(d) + '<div class="detail-text">';
  h += '<p>' + esc(d.desc || '') + '</p>';
  if (d.tags && d.tags.length) {
    h += '<div class="detail-tags">';
    for (var i = 0; i < d.tags.length; i++) h += '<span class="tag">' + esc(d.tags[i]) + '</span>';
    h += '</div>';
  }
  h += '</div></div>';
  h += '<a class="detail-link" href="' + esc(d.url) + '" target="_blank" rel="noopener">访问主站 →</a>';
  if (d.planets && d.planets.length) {
    h += '<p style="margin-top:6px;opacity:0.7">— 行星 · 它的项目 —</p><ul>';
    for (var j = 0; j < d.planets.length; j++) {
      var pd = d.planets[j];
      h += '<li><a class="planet-name" href="' + esc(pd.url) + '" target="_blank" rel="noopener">● ' + esc(pd.name) + '</a>' +
        '<span class="planet-desc">' + esc(pd.desc || '') + '</span></li>';
    }
    h += '</ul>';
  }
  return h;
}

function countPlanets() {
  var n = 0;
  for (var i = 0; i < stars.length; i++) n += (stars[i].data.planets ? stars[i].data.planets.length : 0);
  return n;
}

function closeDetail() {
  fadeOut(detailContainer, 250);
  labelLayerEl.style.display = 'block';
}

/* ---------- 顶部栏：搜索 / 标签 / 随机 ---------- */

var searchResultsList = [];

function buildTopbar() {
  if (siteTitleEl) siteTitleEl.innerHTML = linksData.title || '友链宇宙';

  /* 折叠开关 */
  var toggleBtn = document.getElementById('topbar-toggle');
  toggleBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    topbarEl.classList.toggle('collapsed');
    if (localStorage) localStorage.setItem('topbar', topbarEl.classList.contains('collapsed') ? '0' : '1');
  });
  var saved = localStorage ? localStorage.getItem('topbar') : null;
  if (saved === '0') topbarEl.classList.add('collapsed');

  /* 标签页签 */
  tagTabsEl.innerHTML = '';
  addTagTab(null, '全部');
  (linksData.tags || []).forEach(function (t) {
    addTagTab(t, t);
  });

  /* 随机按钮 */
  randomBtnEl.addEventListener('click', function (e) {
    e.stopPropagation();
    jumpRandomStar();
  });

  /* 搜索 */
  searchboxEl.addEventListener('input', onSearchInput);
  searchboxEl.addEventListener('focus', onSearchInput);
  searchboxEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      if (searchResultsList.length) {
        var first = searchResultsList[0];
        enterStar(first.entry);
        if (first.type === 'planet') {
          openDetail({ type: 'planet', data: first.planet, entry: first.entry });
        }
        hideSearchResults();
        searchboxEl.blur();
      }
    } else if (e.key === 'Escape') {
      hideSearchResults();
      searchboxEl.blur();
    }
    e.stopPropagation();
  });
}

function addTagTab(tag, label) {
  var tab = document.createElement('span');
  tab.className = 'tab' + (tag === activeTag ? ' active' : '');
  tab.textContent = label;
  tab.addEventListener('click', function (e) {
    e.stopPropagation();
    activeTag = tag;
    var tabs = tagTabsEl.children;
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
    tab.classList.add('active');
    if (!activeTag) {
      /* 全部时若当前聚焦恒星不属于该标签也保留 */
    }
  });
  tagTabsEl.appendChild(tab);
}

function onSearchInput() {
  var q = searchboxEl.value.trim().toLowerCase();
  if (!q) {
    hideSearchResults();
    return;
  }
  searchResultsList = [];
  for (var i = 0; i < stars.length; i++) {
    var entry = stars[i];
    var d = entry.data;
    var hitStar = (d.name || '').toLowerCase().indexOf(q) >= 0 ||
      (d.desc || '').toLowerCase().indexOf(q) >= 0;
    if (hitStar) {
      searchResultsList.push({ type: 'star', entry: entry });
      continue;
    }
    if (d.planets) {
      for (var j = 0; j < d.planets.length; j++) {
        if ((d.planets[j].name || '').toLowerCase().indexOf(q) >= 0) {
          searchResultsList.push({ type: 'planet', entry: entry, planet: d.planets[j] });
          break;
        }
      }
    }
  }
  renderSearchResults();
}

function renderSearchResults() {
  searchResultsEl.innerHTML = '';
  if (!searchResultsList.length) {
    var empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = '没有找到匹配的恒星…';
    searchResultsEl.appendChild(empty);
  } else {
    searchResultsList.slice(0, 12).forEach(function (r) {
      var item = document.createElement('div');
      item.className = 'item';
      var name = r.type === 'star' ? r.entry.data.name : r.planet.name;
      var desc = r.type === 'star' ? r.entry.data.desc : (r.entry.data.name + ' · 行星');
      item.innerHTML = '<div class="r-name">' + esc(name) + '</div><div class="r-desc">' + esc(desc || '') + '</div>';
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        if (r.type === 'star') {
          enterStar(r.entry);
        } else {
          enterStar(r.entry);
          openDetail({ type: 'planet', data: r.planet, entry: r.entry });
        }
        hideSearchResults();
        searchboxEl.blur();
      });
      searchResultsEl.appendChild(item);
    });
  }
  searchResultsEl.style.display = 'block';
}

function hideSearchResults() {
  searchResultsEl.style.display = 'none';
}

/* ---------- 左下角缩放倍率 ---------- */
var lastZoomText = '';

/* 相对初始视图的放大倍率：startZoom / 当前 z（>1 放大，<1 缩小；上限随视角限制变化） */
function formatZoom(z) {
  var cap = (GConfig.startZoom || 420) / cameraZoomMin;
  var r = Math.min((GConfig.startZoom || 420) / z, cap);
  var txt;
  if (r >= 10000) txt = Math.round(r / 1000) + 'k';
  else if (r >= 1000) txt = (r / 1000).toFixed(1) + 'k';
  else if (r >= 100) txt = Math.round(r);
  else if (r >= 10) txt = r.toFixed(1);
  else if (r >= 1) txt = r.toFixed(2);
  else if (r >= 0.01) txt = r.toFixed(2);
  else txt = r.toExponential(1);
  return txt + '×';
}

function updateZoomHud() {
  if (!zoomValueEl) return;
  var txt = formatZoom(camera.position.z);
  if (txt !== lastZoomText) {
    zoomValueEl.textContent = txt;
    lastZoomText = txt;
  }
}

/* ---------- 主循环 ---------- */

function animate() {
  requestAnimationFrame(animate);

  var dt = clock.getDelta() * controllers.speed;

  camera.update();
  camera.markersVisible =
    camera.position.z >= markerThreshold.min &&
    camera.position.z <= markerThreshold.max;

  if (followTarget) {
    translating.targetPosition.copy(followTarget.position.clone().negate());
  }

  if (!camera.__tour) {
    rotateX += rotateVX;
    rotateY += rotateVY;
    rotateVX *= 0.9;
    rotateVY *= 0.9;
    if (dragging) {
      rotateVX *= 0.6;
      rotateVY *= 0.6;
    }
    if (controllers.autoRotate && !dragging &&
        Date.now() - lastInteractionTime > 2500) {
      rotateVY = 0.0016;
    }
    rotating.rotation.x = rotateX;
    rotating.rotation.y = rotateY;
  }

  /* 星名栏显示逻辑 */
  var zoomedIn = camera.position.z < markerThreshold.min;
  if (zoomedIn && detailContainer.style.display === 'none' &&
      starNameEl.style.display === 'none') {
    fadeIn(starNameEl, 300);
  } else if (!zoomedIn && starNameEl.style.display !== 'none') {
    fadeOut(starNameEl, 300);
  }

  updateHover();

  rotating.traverse(function (m) {
    if (m.update) m.update(dt);
  });

  render();

  fovValue = 0.5 / Math.tan(camera.fov * Math.PI / 360) * screenHeight;
  setCSSWorld();
  setCSSCamera(camera, fovValue);

  updateMarkers();

  updateEasterWindow();

  updateZoomLimit();
  updateZoomHud();

  if (tour.touring || camera.easeZooming || translating.easePanning) {
    updateMinimap();
  }
  TWEEN.update();

  if (window.__debugTick) window.__debugTick();
}

function render() {
  renderer.clear();
  renderer.render(scene, camera);
}

function onWindowResize() {
  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;
  screenWhalf = screenWidth / 2;
  screenHhalf = screenHeight / 2;
  camera.aspect = screenWidth / screenHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(screenWidth, screenHeight);
  initCSS3D();
}

/* ---------- 巡游站点 ---------- */

function buildTourStops() {
  var stops = [];
  stops.push({
    rx: 0.6, ry: 0.2, z: 900, travelTime: 3500, restTime: 4000,
    center: { x: 0, y: 0, z: 0 },
    message: '欢迎来到友链宇宙——每一位朋友，都是一颗恒星。'
  });

  var visited = 0;
  for (var i = 0; i < stars.length && visited < 5; i++) {
    var e = stars[i];
    if (e.planets.length < 2) continue;
    var ang = Math.atan2(e.pos.z, e.pos.x);
    stops.push({
      rx: 0.35, ry: ang + Math.PI / 2, z: e.zoom,
      travelTime: 3000, restTime: 4500, followIndex: i,
      message: esc(e.data.name) + ' —— ' + (e.data.desc || '一颗安静的恒星')
    });
    visited++;
  }

  stops.push({
    rx: 0.7, ry: 0, z: GConfig.maxZoom, travelTime: 5000, restTime: 5000,
    center: { x: 0, y: 0, z: 0 },
    message: '拉远视角——这，就是我们所在的银河系。'
  });
  stops.push({
    rx: 0.6, ry: 0, z: 700, travelTime: 4000, restTime: 5000,
    center: { x: 0, y: 0, z: 0 },
    message: '这就是我们的友链银河。点击任意一颗恒星，去看看它的星系吧。'
  });
  stops.push({
    rx: 0.5, ry: 0.6, z: 380, travelTime: 3000, restTime: 6000,
    center: { x: 0, y: 0, z: 0 },
    message: 'Go explore. 拖动旋转 · 滚轮缩放 · 点击恒星。'
  });

  return stops;
}

/* ---------- 首次访问消息 ---------- */

function displayIntroMessage() {
  fadeIn(Tour.meta, 300);
  tour.showMessage('欢迎来到友链宇宙。', 4500)
    .showMessage('每一位朋友都是一颗恒星，TA 的项目是绕行的行星。', 4500)
    .showMessage('拖动旋转视角 · 滚轮缩放 · 点击恒星进入它的星系。', 4500, function () {
      firstTime = false;
    })
    .endMessages();
}

/* ---------- 调试信息 ---------- */

function initDebug() {
  if (!urlArgs.getBoolean('debug', false)) return;
  var div = document.createElement('div');
  div.id = 'debug-info';
  div.style.cssText = 'position:fixed;left:8px;bottom:8px;color:#0f0;font:11px monospace;z-index:99999;white-space:pre;';
  document.body.appendChild(div);
  var last = 0;
  window.__debugTick = function () {
    if (Date.now() - last < 800) return;
    last = Date.now();
    div.textContent =
      'z=' + camera.position.z.toFixed(1) +
      ' targetZ=' + camera.position.target.z.toFixed(1) +
      ' rot=(' + rotateX.toFixed(2) + ',' + rotateY.toFixed(2) + ')' +
      ' tour=' + tour.touring +
      ' layout=' + currentLayout +
      ' stars=' + stars.length +
      ' current=' + (currentStar ? currentStar.data.name : '-') +
      ' follow=' + (followTarget ? 'yes' : '-');
  };
}
