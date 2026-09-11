/* ============================================================
 * admin.js —— 友链宇宙数据管理台（增删改查）
 * 配合 admin.html 使用。纯前端：读取 data/links.json，
 * 可保存到 localStorage 供主站预览，或导出文件回写。
 * ============================================================ */
(function(){
var DEFAULT_DATA = JSON.parse('{"title":"我的友链宇宙","subtitle":"每一位朋友，都是一颗恒星","defaultLayout":"spiral","galaxy":{"radius":115,"arms":4,"diskRadius":430,"dust":16000,"startZoom":420,"maxZoom":8000000,"centerClear":24,"seed":20260830},"threeBody":{"enabled":true,"name":"关键用户","radii":[6,8.5,11],"G":1,"centerMass":300,"cageRadius":15,"minDist":0.5,"bodies":[{"starIndex":0,"mass":1},{"starIndex":1,"mass":1},{"starIndex":2,"mass":1}]},"tags":["博客","设计","工具","开源","摄影","音乐","天文","游戏"],"stars":[{"name":"关键用户·一","url":"https://key-one.example.com","avatar":"https://ui-avatars.com/api/?name=K1&background=FF6B6B&color=fff&size=128","desc":"第一位关键用户（占位）。三体中的红色恒星，与你一同绕行银河中心。","color":"#ff6b6b","tags":["关键"],"planets":[{"name":"占位项目·甲","url":"https://key-one.example.com/a","desc":"后续替换为 TA 的真实项目"}]},{"name":"关键用户·二","url":"https://key-two.example.com","avatar":"https://ui-avatars.com/api/?name=K2&background=51CF66&color=fff&size=128","desc":"第二位关键用户（占位）。三体中的绿色恒星。","color":"#51cf66","tags":["关键"],"planets":[{"name":"占位项目·乙","url":"https://key-two.example.com/b","desc":"后续替换为 TA 的真实项目"}]},{"name":"关键用户·三","url":"https://key-three.example.com","avatar":"https://ui-avatars.com/api/?name=K3&background=4DABF7&color=fff&size=128","desc":"第三位关键用户（占位）。三体中的蓝色恒星。","color":"#4dabf7","tags":["关键"],"planets":[{"name":"占位项目·丙","url":"https://key-three.example.com/c","desc":"后续替换为 TA 的真实项目"}]},{"name":"我的博客","url":"https://myblog.example.com","avatar":"https://ui-avatars.com/api/?name=MY&background=FFB35C&color=000&size=128","desc":"这里是宇宙的中心——我的个人主页。欢迎换链。","color":"#ffb35c","tags":["博客"],"planets":[{"name":"GitHub","url":"https://github.com/example","desc":"我开源的项目仓库"},{"name":"摄影集","url":"https://myblog.example.com/photos","desc":"走过的路与拍过的光"},{"name":"在线工具箱","url":"https://myblog.example.com/tools","desc":"自用的一些小工具"},{"name":"RSS 订阅","url":"https://myblog.example.com/feed.xml","desc":"用 RSS 第一时间订阅更新"}]},{"name":"小林手记","url":"https://xiao-lin.blog","avatar":"https://ui-avatars.com/api/?name=XL&background=5BC0EB&color=fff&size=128","desc":"关于前端、写作与生活的随手记。","color":"#5bc0eb","tags":["博客"],"planets":[{"name":"CSS 学习笔记","url":"https://xiao-lin.blog/css","desc":"常更的 CSS 知识点"},{"name":"每周书单","url":"https://xiao-lin.blog/books","desc":"最近在读的书"}]},{"name":"阿岚画室","url":"https://alan-studio.design","avatar":"https://ui-avatars.com/api/?name=AL&background=F77F00&color=fff&size=128","desc":"插画、UI 与品牌设计的练习场。","color":"#f77f00","tags":["设计"],"planets":[{"name":"Dribbble","url":"https://dribbble.com/example","desc":"作品展示"},{"name":"配色灵感","url":"https://alan-studio.design/palette","desc":"收集的好看的配色"}]},{"name":"拾光摄影","url":"https://shiguang.photo","avatar":"https://ui-avatars.com/api/?name=SG&background=FB3640&color=fff&size=128","desc":"街头与人像，用光影记录日常。","color":"#fb3640","tags":["摄影"],"planets":[{"name":"街头日记","url":"https://shiguang.photo/street","desc":"城市街头随拍"},{"name":"相机参数笔记","url":"https://shiguang.photo/gear","desc":"常用参数与心得"}]},{"name":"午夜电台","url":"https://midnight-radio.fm","avatar":"https://ui-avatars.com/api/?name=MR&background=5F0F40&color=fff&size=128","desc":"深夜编曲、混音与歌单分享。","color":"#b56576","tags":["音乐"],"planets":[{"name":"新歌单","url":"https://midnight-radio.fm/playlist","desc":"每月更新的歌单"},{"name":"编曲教程","url":"https://midnight-radio.fm/tutorial","desc":"入门编曲系列"}]},{"name":"代码菜园","url":"https://code-garden.dev","avatar":"https://ui-avatars.com/api/?name=CG&background=386641&color=fff&size=128","desc":"种点好用的开源代码，欢迎一起浇水。","color":"#6a994e","tags":["博客","开源"],"planets":[{"name":"CLI 工具集","url":"https://code-garden.dev/cli","desc":"命令行小工具"},{"name":"npm 包","url":"https://www.npmjs.com/~example","desc":"已发布的包"}]},{"name":"羽落工坊","url":"https://yuluo.works","avatar":"https://ui-avatars.com/api/?name=YL&background=7B2CBF&color=fff&size=128","desc":"手作、木工与迷你机械的图文记录。","color":"#9d4edd","tags":["设计"],"planets":[{"name":"木工图鉴","url":"https://yuluo.works/wood","desc":"作品与过程图"}]},{"name":"星野观测站","url":"https://starryfield.astro","avatar":"https://ui-avatars.com/api/?name=SF&background=003049&color=fff&size=128","desc":"深空摄影与天文观测记录。","color":"#457b9d","tags":["天文","摄影"],"planets":[{"name":"深空图库","url":"https://starryfield.astro/gallery","desc":"星云与星系作品"},{"name":"观测笔记","url":"https://starryfield.astro/log","desc":"每次出摊的记录"},{"name":"设备清单","url":"https://starryfield.astro/gear","desc":"望远镜与赤道仪"}]},{"name":"碎纸机","url":"https://shredder.blog","avatar":"https://ui-avatars.com/api/?name=SD&background=343A40&color=fff&size=128","desc":"杂七杂八的随笔与吐槽，不定期更新。","color":"#6c757d","tags":["博客"],"planets":[]},{"name":"像素农夫","url":"https://pixel-farmer.game","avatar":"https://ui-avatars.com/api/?name=PF&background=3A5A40&color=fff&size=128","desc":"独立游戏开发 + 像素画。","color":"#588157","tags":["游戏","设计"],"planets":[{"name":"开发日志","url":"https://pixel-farmer.game/devlog","desc":"新作开发进度"},{"name":"itch.io","url":"https://example.itch.io","desc":"试玩页"},{"name":"像素素材包","url":"https://pixel-farmer.game/assets","desc":"免费素材"}]},{"name":"键盘侠客","url":"https://keyboard-hero.dev","avatar":"https://ui-avatars.com/api/?name=KH&background=14213D&color=fff&size=128","desc":"机械键盘、Vim 与效率工具控。","color":"#2f6690","tags":["工具","开源"],"planets":[{"name":"配列工具","url":"https://keyboard-hero.dev/layout","desc":"在线配列配置"},{"name":"Vim 配置","url":"https://github.com/example/vimrc","desc":"我的 vimrc"}]},{"name":"喵喵开源","url":"https://meow-open.org","avatar":"https://ui-avatars.com/api/?name=MO&background=495867&color=fff&size=128","desc":"一个专注喵系命名开源项目的组织。","color":"#577399","tags":["开源"],"planets":[{"name":"组织主页","url":"https://github.com/meow-open","desc":"所有仓库"},{"name":"贡献指南","url":"https://meow-open.org/CONTRIBUTING","desc":"如何参与"}]},{"name":"云上书房","url":"https://cloud-book.club","avatar":"https://ui-avatars.com/api/?name=CB&background=6B4E71&color=fff&size=128","desc":"读书笔记与电子书收藏夹。","color":"#b08bbb","tags":["博客"],"planets":[{"name":"书单","url":"https://cloud-book.club/bookshelf","desc":"年度书单"},{"name":"笔记索引","url":"https://cloud-book.club/notes","desc":"全部笔记"}]},{"name":"极客工具箱","url":"https://geek-tools.app","avatar":"https://ui-avatars.com/api/?name=GT&background=0F4C5C&color=fff&size=128","desc":"在线小工具集合：编码、格式化、图片处理。","color":"#23b5d3","tags":["工具"],"planets":[{"name":"JSON 工具","url":"https://geek-tools.app/json","desc":"格式化/校验"},{"name":"正则测试","url":"https://geek-tools.app/regex","desc":"正则在线测试"},{"name":"图片压缩","url":"https://geek-tools.app/img","desc":"本地压缩不走网络"}]},{"name":"白噪","url":"https://whitenoise.audio","avatar":"https://ui-avatars.com/api/?name=WN&background=1B2A41&color=fff&size=128","desc":"环境音与氛围音乐的实验田。","color":"#7798ab","tags":["音乐","设计"],"planets":[{"name":"在线合成器","url":"https://whitenoise.audio/synth","desc":"浏览器里玩合成"}]},{"name":"逆光","url":"https://backlight.photo","avatar":"https://ui-avatars.com/api/?name=BL&background=BC6C25&color=fff&size=128","desc":"自然光人像与胶片色调研究。","color":"#dda15e","tags":["摄影","设计"],"planets":[{"name":"胶片预设","url":"https://backlight.photo/presets","desc":"可下载的 LR 预设"}]},{"name":"老树根","url":"https://oldroot.life","avatar":"https://ui-avatars.com/api/?name=OR&background=6B705C&color=fff&size=128","desc":"一个老人家的生活博客：菜园、爬山、旧书。","color":"#a5a58d","tags":["博客"],"planets":[{"name":"菜园日志","url":"https://oldroot.life/garden","desc":"今年种了啥"},{"name":"旧书摊","url":"https://oldroot.life/books","desc":"淘到的旧书"}]},{"name":"九号实验室","url":"https://lab9.dev","avatar":"https://ui-avatars.com/api/?name=L9&background=22333B&color=fff&size=128","desc":"电子 DIY、树莓派与自动化的折腾记录。","color":"#5e503f","tags":["开源","工具"],"planets":[{"name":"项目文档","url":"https://lab9.dev/projects","desc":"全部开源硬件"},{"name":"接线图库","url":"https://lab9.dev/schematics","desc":"整理好的接线图"},{"name":"固件下载","url":"https://lab9.dev/firmware","desc":"编译好的固件"}]},{"name":"风语者","url":"https://windtalker.blog","avatar":"https://ui-avatars.com/api/?name=WT&background=4361EE&color=fff&size=128","desc":"旅行随笔与风光摄影，风很大但风景很好。","color":"#4cc9f0","tags":["博客","摄影"],"planets":[{"name":"旅行地图","url":"https://windtalker.blog/map","desc":"足迹可视化"}]},{"name":"青柠少女","url":"https://lime-girl.design","avatar":"https://ui-avatars.com/api/?name=LG&background=80B918&color=fff&size=128","desc":"清新系插画与可爱风 UI 设计。","color":"#aacc00","tags":["设计","音乐"],"planets":[{"name":"插画集","url":"https://lime-girl.design/art","desc":"日常涂鸦"},{"name":"模板下载","url":"https://lime-girl.design/templates","desc":"免费 PPT/壁纸"}]},{"name":"银河之心","url":"https://galaxy-core.example.com","avatar":"https://ui-avatars.com/api/?name=GC&background=FFD27F&color=000&size=128","desc":"银河系的中心——三体系统绕着这颗恒星公转。这里也可以是一位朋友的友链（占位）。","color":"#ffd27f","tags":["关键"],"center":true,"planets":[{"name":"银心档案","url":"https://galaxy-core.example.com/archive","desc":"三体公转的轨道记录"},{"name":"换链登记","url":"https://galaxy-core.example.com/link","desc":"想成为银河中心的朋友？"}]}]}');
'use strict';

var LS_KEY = 'friend-universe-links';

var state = null;          // 当前编辑的数据（含内部 _id）
var nextId = 1;
var dirty = false;
var currentTab = 'basic';
var lastSource = '';
var starsSearchEl = null, starsListEl = null;

/* ---------------- 工具 ---------------- */
function $(sel){ return document.querySelector(sel); }
function $$(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }
function div(cls, text){ var el = document.createElement('div'); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; }
function span(cls, text){ var el = document.createElement('span'); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; }
function labelEl(txt){ var el = document.createElement('label'); el.textContent = txt; return el; }
function inputEl(cls, val, ph){ var el = document.createElement('input'); if (cls) el.className = cls; if (ph) el.placeholder = ph; el.value = (val == null ? '' : val); return el; }
function buttonEl(txt, fn, cls){ var el = document.createElement('button'); el.type = 'button'; el.textContent = txt; if (cls) el.className = cls; if (fn) el.addEventListener('click', fn); return el; }
function clone(o){ return JSON.parse(JSON.stringify(o)); }

function toast(msg, ok){
  var t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show' + (ok === false ? ' err' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.className = 'toast'; }, 2600);
}

function setSource(src){ lastSource = src; updateDirtyUI(); }
function markDirty(){ if (!dirty){ dirty = true; updateDirtyUI(); } }
function updateDirtyUI(){
  $('#status').textContent = dirty
    ? lastSource + ' · 有未保存修改（Ctrl+S 保存到浏览器）'
    : lastSource;
}

function download(name, content, mime){
  var blob = new Blob([content], { type: mime || 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
}

/* ---------------- 数据 ---------------- */
function exportData(){
  var d = clone(state);
  d.stars = (d.stars || []).map(function(s){
    delete s._id;
    s.tags = s.tags || [];
    s.planets = s.planets || [];
    return s;
  });
  if (d.threeBody && Array.isArray(d.threeBody.bodies)){
    var bodies = [];
    state.threeBody.bodies.forEach(function(b){
      if (!b || !b._id) return;
      var idx = state.stars.findIndex(function(s){ return s._id === b._id; });
      if (idx === -1) return;
      bodies.push({ starIndex: idx, mass: Number(b.mass) || 1 });
    });
    d.threeBody.bodies = bodies;
  }
  return d;
}

function setData(raw, source){
  var d = clone(raw || {});
  d.title = d.title || '我的友链宇宙';
  d.subtitle = d.subtitle || '';
  d.defaultLayout = (d.defaultLayout === 'random') ? 'random' : 'spiral';
  d.galaxy = Object.assign({
    radius:115, arms:4, diskRadius:430, dust:16000,
    startZoom:420, maxZoom:8000000, centerClear:24, seed:20260830
  }, d.galaxy || {});
  d.threeBody = Object.assign({
    enabled:true, name:'关键用户', radii:[6,8.5,11], G:1,
    centerMass:300, cageRadius:15, minDist:0.5, bodies:[]
  }, d.threeBody || {});
  d.tags = d.tags || [];
  d.stars = (d.stars || []).map(function(s){
    s._id = 's' + (nextId++);
    s.tags = s.tags || [];
    s.planets = s.planets || [];
    s.planets.forEach(function(p){ p.name = p.name || ''; p.url = p.url || ''; p.desc = p.desc || ''; });
    return s;
  });
  if (Array.isArray(d.threeBody.bodies)){
    d.threeBody.bodies = d.threeBody.bodies.map(function(b){
      var target = d.stars[Number(b.starIndex)];
      return { _id: target ? target._id : null, mass: Number(b.mass) || 1 };
    }).filter(function(b){ return !!b._id; });
  } else d.threeBody.bodies = [];
  state = d;
  dirty = false;
  renderAll();
  setSource(source);
}

function loadData(){
  fetch('data/links.json?t=' + Date.now())
    .then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(d){ setData(d, '来源：data/links.json（文件）'); })
    .catch(function(){
      setData(DEFAULT_DATA, '来源：内置默认数据（未找到 data/links.json）');
    });
}

function checkSaved(){
  var has = false;
  try { has = !!localStorage.getItem(LS_KEY); } catch(e){}
  var b = $('#banner');
  if (has){
    b.style.display = '';
    b.textContent = '提示：浏览器里已保存有一份友链数据，主站会优先使用它（覆盖 data/links.json）。如需恢复使用文件数据，请点右上「清除浏览器数据」。';
  } else b.style.display = 'none';
}

function saveToBrowser(){
  try { localStorage.setItem(LS_KEY, JSON.stringify(exportData())); }
  catch(e){ toast('保存失败：' + e.message, false); return; }
  dirty = false;
  setSource('已保存到浏览器（主站将优先使用，刷新主站即可预览）');
  checkSaved();
  toast('已保存到浏览器 ✓');
}

function clearBrowser(){
  try { localStorage.removeItem(LS_KEY); } catch(e){}
  checkSaved();
  setSource('已清除浏览器数据，主站恢复读取 data/links.json');
  toast('已清除浏览器数据');
}

/* ---------------- 通用表单项 ---------------- */
function rowInput(key, labelText, obj, isNum, step, min){
  var row = div('frow');
  row.appendChild(labelEl(labelText));
  var inp = document.createElement('input');
  if (isNum){
    inp.type = 'number'; inp.step = step || 1;
    if (min != null) inp.min = min;
    inp.value = obj[key];
  } else {
    inp.type = 'text';
    inp.value = obj[key] == null ? '' : obj[key];
  }
  inp.addEventListener('input', function(){
    var v = isNum ? parseFloat(inp.value) : inp.value;
    if (isNum && isNaN(v)) v = 0;
    obj[key] = v;
    markDirty();
  });
  row.appendChild(inp);
  return row;
}

/* ---------------- 面板：基础设置 ---------------- */
function renderBasic(){
  var p = $('#panel-basic'); p.innerHTML = '';
  var card = div('card');
  card.appendChild(div('card-title', '基础设置'));
  card.appendChild(rowInput('title', '网站标题', state, false));
  card.appendChild(rowInput('subtitle', '副标题', state, false));
  var drow = div('frow');
  drow.appendChild(labelEl('默认布局'));
  var sel = document.createElement('select');
  [['spiral', '旋臂银河（spiral）'], ['random', '随机散点（random）']].forEach(function(o){
    var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; sel.appendChild(op);
  });
  sel.value = state.defaultLayout;
  sel.addEventListener('change', function(){ state.defaultLayout = sel.value; markDirty(); });
  drow.appendChild(sel);
  card.appendChild(drow);
  p.appendChild(card);
}

/* ---------------- 面板：银河 / 三体 ---------------- */
function renderGalaxy(){
  var p = $('#panel-galaxy'); p.innerHTML = '';

  var g = div('card');
  g.appendChild(div('card-title', '银河布局'));
  g.appendChild(rowInput('radius', '恒星分布半径', state.galaxy, true, 1, 1));
  g.appendChild(rowInput('arms', '旋臂数', state.galaxy, true, 1, 1));
  g.appendChild(rowInput('diskRadius', '星尘范围', state.galaxy, true, 1, 1));
  g.appendChild(rowInput('dust', '星尘粒子数', state.galaxy, true, 1, 0));
  g.appendChild(rowInput('startZoom', '初始缩放', state.galaxy, true, 1, 1));
  g.appendChild(rowInput('maxZoom', '最大缩放（彩蛋阈值）', state.galaxy, true, 1, 1));
  g.appendChild(rowInput('centerClear', '银心留白', state.galaxy, true, 1, 0));
  g.appendChild(rowInput('seed', '随机种子', state.galaxy, true, 1, 0));
  p.appendChild(g);

  var t = div('card');
  t.appendChild(div('card-title', '三体系统（4 体模拟）'));
  var erow = div('frow');
  var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!state.threeBody.enabled;
  cb.addEventListener('change', function(){ state.threeBody.enabled = cb.checked; markDirty(); });
  erow.appendChild(labelEl('启用三体系统')); erow.appendChild(cb);
  t.appendChild(erow);
  t.appendChild(rowInput('name', '三体名称', state.threeBody, false));
  var rrow = div('frow');
  rrow.appendChild(labelEl('轨道半径（逗号分隔）'));
  var rinp = inputEl(null, (state.threeBody.radii || []).join(', '));
  rinp.addEventListener('input', function(){
    state.threeBody.radii = rinp.value.split(/[,，]/).map(function(x){ return parseFloat(x); }).filter(function(x){ return !isNaN(x); });
    markDirty();
  });
  rrow.appendChild(rinp);
  t.appendChild(rrow);
  t.appendChild(rowInput('G', '引力常数 G', state.threeBody, true, 0.1, 0));
  t.appendChild(rowInput('centerMass', '银心质量', state.threeBody, true, 1, 1));
  t.appendChild(rowInput('cageRadius', '球壳约束半径', state.threeBody, true, 1, 1));
  t.appendChild(rowInput('minDist', '最小距离', state.threeBody, true, 0.1, 0.1));

  var bwrap = div('tbody');
  bwrap.appendChild(div('b-title', '绕行恒星（引力体）'));
  state.threeBody.bodies.forEach(function(b, i){ renderBodyRow(bwrap, b, i); });
  bwrap.appendChild(buttonEl('＋ 添加一个绕行恒星', function(){
    if (!state.stars.length){ toast('请先在「友链管理」中添加恒星', false); return; }
    state.threeBody.bodies.push({ _id: state.stars[0]._id, mass: 1 });
    renderGalaxy();
  }));
  t.appendChild(bwrap);
  t.appendChild(div('note', '说明：这里的「引力体」引用的是「友链管理」里的恒星；恒星被删除后，引用它的引力体会自动调整或移除。'));
  p.appendChild(t);
}

function renderBodyRow(wrap, b, i){
  if (!state.stars.some(function(s){ return s._id === b._id; })){
    b._id = state.stars[0] ? state.stars[0]._id : null;
    markDirty();
  }
  if (!b._id) return;
  var row = div('tbody-row');
  row.appendChild(labelEl('恒星'));
  var sel = document.createElement('select');
  state.stars.forEach(function(s){
    var op = document.createElement('option');
    op.value = s._id;
    op.textContent = s.name + '（' + (s.url || '无链接') + '）';
    sel.appendChild(op);
  });
  sel.value = b._id;
  sel.addEventListener('change', function(){ b._id = sel.value; markDirty(); });
  row.appendChild(sel);
  row.appendChild(labelEl('质量'));
  var m = document.createElement('input'); m.type = 'number'; m.step = '0.1'; m.min = '0.1'; m.value = b.mass;
  m.addEventListener('input', function(){ b.mass = parseFloat(m.value) || 1; markDirty(); });
  row.appendChild(m);
  row.appendChild(buttonEl('✕', function(){ state.threeBody.bodies.splice(i, 1); renderGalaxy(); }));
  wrap.appendChild(row);
}

/* ---------------- 面板：标签 ---------------- */
function renderTags(){
  var p = $('#panel-tags'); p.innerHTML = '';
  var card = div('card');
  card.appendChild(div('card-title', '标签管理（全局分类页签）'));
  var addRow = div('frow');
  var inp = inputEl(null, '', '输入标签，回车 / 逗号添加（可一次输入多个）');
  function add(){
    var v = inp.value, added = false;
    v.split(/[,，\n]+/).forEach(function(t){
      t = t.trim();
      if (t && state.tags.indexOf(t) === -1){ state.tags.push(t); added = true; }
    });
    if (added){ markDirty(); renderTags(); }
  }
  inp.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ',' || e.key === '，'){ e.preventDefault(); add(); }
  });
  addRow.appendChild(inp);
  addRow.appendChild(buttonEl('添加', add));
  card.appendChild(addRow);
  var chips = div('tag-chips');
  state.tags.forEach(function(t, i){
    var c = span('chip', t);
    var x = span('chip-x', '×');
    x.addEventListener('click', function(){ state.tags.splice(i, 1); renderTags(); });
    c.appendChild(x);
    chips.appendChild(c);
  });
  card.appendChild(chips);
  card.appendChild(div('note', '说明：这里的标签作为分类页签显示在网站顶部。每颗恒星自己的标签请在「友链管理」里编辑（可自由填写，不受此列表限制）。'));
  p.appendChild(card);
}

/* ---------------- 面板：友链管理 ---------------- */
function renderStars(){
  var p = $('#panel-stars'); p.innerHTML = '';
  var toolbar = div('toolbar');
  starsSearchEl = inputEl('search', '', '搜索站名 / 简介 / 行星…');
  starsSearchEl.addEventListener('input', renderStarsList);
  toolbar.appendChild(starsSearchEl);
  toolbar.appendChild(buttonEl('＋ 添加恒星', addStar, 'primary'));
  p.appendChild(toolbar);
  starsListEl = div('star-list');
  p.appendChild(starsListEl);
  renderStarsList();
}

function renderStarsList(){
  starsListEl.innerHTML = '';
  var q = (starsSearchEl.value || '').trim().toLowerCase();
  state.stars.forEach(function(s, i){
    if (q && !matchStar(s, q)) return;
    starsListEl.appendChild(starCard(s, i));
  });
  if (!starsListEl.children.length) starsListEl.appendChild(div('empty', '没有匹配的恒星'));
}

function matchStar(s, q){
  return (s.name + ' ' + (s.desc || '') + ' ' + (s.url || '')).toLowerCase().indexOf(q) !== -1
    || (s.planets || []).some(function(p){
      return ((p.name || '') + ' ' + (p.desc || '') + ' ' + (p.url || '')).toLowerCase().indexOf(q) !== -1;
    });
}

function starCard(s, i){
  var card = div('star-card' + (s.center ? ' center' : ''));

  var head = div('star-head');
  var av = document.createElement('img');
  av.className = 'avatar';
  av.src = s.avatar || '';
  av.addEventListener('error', function(){ av.style.display = 'none'; });
  head.appendChild(av);

  var info = div('star-info');
  var nameRow = div('frow');
  var nameInp = inputEl('s-name', s.name, '站名');
  nameInp.addEventListener('input', function(){ s.name = nameInp.value; markDirty(); });
  nameRow.appendChild(nameInp);
  info.appendChild(nameRow);

  var meta = div('meta-row');
  meta.appendChild(span('idx', '#' + i));
  var cc = document.createElement('input'); cc.type = 'checkbox'; cc.checked = !!s.center;
  cc.addEventListener('change', function(){ s.center = cc.checked; renderAll(); markDirty(); });
  meta.appendChild(labelEl('设为银心')); meta.appendChild(cc);
  info.appendChild(meta);
  head.appendChild(info);
  card.appendChild(head);

  card.appendChild(avatarRow(s, av));
  card.appendChild(urlRow(s));
  card.appendChild(descRow(s));
  card.appendChild(colorRow(s));
  card.appendChild(tagsRow(s));
  card.appendChild(planetsEditor(s));

  var act = div('star-actions');
  act.appendChild(buttonEl('↑ 上移', function(){ moveStar(i, -1); }));
  act.appendChild(buttonEl('↓ 下移', function(){ moveStar(i, 1); }));
  act.appendChild(buttonEl('⧉ 克隆', function(){ duplicateStar(i); }));
  act.appendChild(buttonEl('🗑 删除', function(){ deleteStar(i); }, 'danger'));
  card.appendChild(act);

  return card;
}

function avatarRow(s, av){
  var row = div('frow');
  row.appendChild(labelEl('头像'));
  var inp = inputEl(null, s.avatar || '', 'https://… 头像图片地址');
  inp.addEventListener('input', function(){
    s.avatar = inp.value;
    av.src = inp.value || '';
    av.style.display = inp.value ? '' : 'none';
    markDirty();
  });
  row.appendChild(inp);
  return row;
}

function urlRow(s){
  var row = div('frow');
  row.appendChild(labelEl('链接'));
  var inp = inputEl(null, s.url || '', 'https://…');
  inp.addEventListener('input', function(){ s.url = inp.value; markDirty(); });
  row.appendChild(inp);
  row.appendChild(buttonEl('↗', function(){ if (s.url) window.open(s.url); }, 'icon'));
  return row;
}

function descRow(s){
  var row = div('frow v');
  row.appendChild(labelEl('简介'));
  var ta = document.createElement('textarea'); ta.rows = 2; ta.value = s.desc || ''; ta.placeholder = '一句话简介';
  ta.addEventListener('input', function(){ s.desc = ta.value; markDirty(); });
  row.appendChild(ta);
  return row;
}

function colorRow(s){
  var row = div('frow');
  row.appendChild(labelEl('颜色'));
  var c = document.createElement('input'); c.type = 'color'; c.value = s.color || '#ffffff';
  c.addEventListener('input', function(){ s.color = c.value; markDirty(); });
  var t = inputEl('color-text', s.color || '#ffffff');
  t.addEventListener('input', function(){
    var v = t.value.trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(v)){ s.color = v; c.value = v; markDirty(); }
  });
  row.appendChild(c); row.appendChild(t);
  return row;
}

function tagsRow(s){
  var box = div('tags-box');
  var lab = labelEl('标签'); lab.className = 'vlabel'; lab.textContent = '标签';
  box.appendChild(lab);
  var chips = div('tag-chips');
  (s.tags || []).forEach(function(t, j){
    var chip = span('chip', t);
    var x = span('chip-x', '×');
    x.addEventListener('click', function(){ s.tags.splice(j, 1); renderAll(); });
    chip.appendChild(x);
    chips.appendChild(chip);
  });
  var add = inputEl('tag-add', '', '＋ 输入标签，回车添加');
  add.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ',' || e.key === '，'){
      e.preventDefault();
      var v = add.value.trim();
      if (v && s.tags.indexOf(v) === -1){ s.tags.push(v); markDirty(); renderAll(); }
      else add.value = '';
    }
  });
  chips.appendChild(add);
  box.appendChild(chips);
  return box;
}

function planetsEditor(s){
  var box = div('planets-box');
  var head = div('p-title');
  head.appendChild(labelEl('行星（子项目）'));
  box.appendChild(head);
  var rows = div('planet-rows');
  (s.planets || []).forEach(function(p, k){ rows.appendChild(planetRow(s, p, k)); });
  box.appendChild(rows);
  box.appendChild(buttonEl('＋ 添加行星', function(){
    if (!s.planets) s.planets = [];
    s.planets.push({ name: '', url: '', desc: '' });
    renderAll();
  }));
  return box;
}

function planetRow(s, p, k){
  var row = div('planet-row');
  var n = inputEl('p-name', p.name, '项目名');
  n.addEventListener('input', function(){ p.name = n.value; markDirty(); });
  var u = inputEl(null, p.url, 'https://…');
  u.addEventListener('input', function(){ p.url = u.value; markDirty(); });
  var d = inputEl(null, p.desc, '说明');
  d.addEventListener('input', function(){ p.desc = d.value; markDirty(); });
  var del = buttonEl('✕', function(){ s.planets.splice(k, 1); renderAll(); });
  row.appendChild(n); row.appendChild(u); row.appendChild(d); row.appendChild(del);
  return row;
}

function addStar(){
  state.stars.push({ name: '新恒星', url: '', avatar: '', desc: '', color: '#ffffff', tags: [], center: false, planets: [], _id: 's' + (nextId++) });
  markDirty();
  renderAll();
  switchTab('stars');
  toast('已添加恒星，请在列表中填写');
}
function duplicateStar(i){
  var c = clone(state.stars[i]);
  c._id = 's' + (nextId++);
  c.name = c.name + '（副本）';
  state.stars.splice(i + 1, 0, c);
  markDirty();
  renderAll();
}
function moveStar(i, dir){
  var j = i + dir;
  if (j < 0 || j >= state.stars.length) return;
  var t = state.stars[i]; state.stars[i] = state.stars[j]; state.stars[j] = t;
  markDirty();
  renderAll();
}
function deleteStar(i){
  var s = state.stars[i];
  if (!confirm('确定删除恒星「' + (s.name || '未命名') + '」吗？')) return;
  state.stars.splice(i, 1);
  markDirty();
  renderAll();
}

/* ---------------- 标签页切换 ---------------- */
function switchTab(name){
  currentTab = name;
  $$('#tabs .tab').forEach(function(b){ b.classList.toggle('active', b.dataset.tab === name); });
  $$('.panel').forEach(function(p){ p.style.display = (p.id === 'panel-' + name) ? '' : 'none'; });
}

function renderAll(){
  renderBasic();
  renderGalaxy();
  renderTags();
  renderStars();
  switchTab(currentTab);
}

/* ---------------- 生成 data.js（含内置数据） ---------------- */
var DATAJS_TEMPLATE = [
'/* ============================================================',
' * data.js —— 数据层：优先加载 data/links.json，失败时回退到内置示例数据',
' *',
' * 附加：若浏览器 localStorage 中保存了「友链宇宙数据管理台」',
' * 的数据（键 friend-universe-links），将优先使用它便于本地预览；',
' * 在管理台点击「清除浏览器数据」后恢复读取 data/links.json。',
' * ============================================================ */',
'',
'var DEFAULT_LINKS = __LINKS__;',
'',
'var LS_LINKS_KEY = \'friend-universe-links\';',
'',
'function readSavedLinks(){',
'  try {',
'    var saved = localStorage.getItem(LS_LINKS_KEY);',
'    if (!saved) return null;',
'    var d = JSON.parse(saved);',
'    if (d && d.stars && d.stars.length) {',
'      console.info(\'[友链宇宙] 使用 localStorage 中的友链数据（由数据管理台保存）\');',
'      return d;',
'    }',
'  } catch (e) {}',
'  return null;',
'}',
'',
'function loadLinks(callback){',
'  var saved = readSavedLinks();',
'  if (saved) { callback(saved); return; }',
'  setLoadMessage(\'读取星图\');',
'  var xhr = new XMLHttpRequest();',
'  xhr.open(\'GET\', \'data/links.json\', true);',
'  xhr.onload = function(){',
'    try {',
'      var d = JSON.parse(xhr.responseText);',
'      if (d && d.stars && d.stars.length) { callback(d); return; }',
'    } catch(e) {}',
'    callback(DEFAULT_LINKS);',
'  };',
'  xhr.onerror = function(){ callback(DEFAULT_LINKS); };',
'  xhr.send();',
'}',
''
].join('\n');

/* ---------------- 初始化 ---------------- */
function init(){
  $('#tabs').addEventListener('click', function(e){
    var t = e.target.closest('.tab');
    if (t) switchTab(t.dataset.tab);
  });
  $('#btn-reload').addEventListener('click', function(){ loadData(); });
  $('#btn-save').addEventListener('click', saveToBrowser);
  $('#btn-clear').addEventListener('click', clearBrowser);
  $('#btn-export').addEventListener('click', function(){
    download('links.json', JSON.stringify(exportData(), null, 2));
    toast('已导出 links.json（覆盖 data/links.json 即可生效）');
  });
  $('#btn-export-js').addEventListener('click', function(){
    var js = DATAJS_TEMPLATE.replace('__LINKS__', JSON.stringify(exportData(), null, 2));
    download('data.js', js, 'application/javascript');
    toast('已生成 data.js（覆盖 js/data.js 即可作为回退数据）');
  });
  $('#btn-copy').addEventListener('click', function(){
    navigator.clipboard.writeText(JSON.stringify(exportData(), null, 2))
      .then(function(){ toast('已复制完整 JSON'); })
      .catch(function(){ toast('复制失败', false); });
  });
  $('#import-file').addEventListener('change', function(ev){
    var f = ev.target.files && ev.target.files[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function(){
      try { setData(JSON.parse(rd.result), '来源：导入文件 ' + f.name); toast('导入成功'); }
      catch(e){ toast('导入失败：不是有效的 JSON', false); }
    };
    rd.readAsText(f);
    ev.target.value = '';
  });
  document.addEventListener('keydown', function(e){
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's'){ e.preventDefault(); saveToBrowser(); }
  });
  window.addEventListener('beforeunload', function(e){
    if (dirty){ e.preventDefault(); e.returnValue = ''; }
  });
  loadData();
  checkSaved();
}

init();

})();
