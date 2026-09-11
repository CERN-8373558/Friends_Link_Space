/* ============================================================
 * live2d.js —— 佩丽卡 Live2D 看板娘（Cubism4 / pixi-live2d-display）
 * · showLive2D() 从底部滑入屏幕中间，hideLive2D() 滑出
 * · 键盘 Ctrl+Num1~9 切换表情（对应「按键表情一览」）
 * · 点击佩丽卡随机切换表情
 * 表情通过直接设置模型参数实现（pixi-live2d-display 0.4 的
 * expressionManager blend 流程在部分版本不生效）
 * ============================================================ */

import { Application, Ticker } from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display/cubism4';

/* 注册 Ticker，让模型每帧自动更新（待机/眨眼/鼠标跟踪都依赖它） */
Live2DModel.registerTicker(Ticker);

let app = null;
let model = null;
let ready = false;
let currentExpr = null;

/* 表情参数 ID（模型 moc3 中已内置） */
const EXPR_IDS = ['dai', 'weapon', 'pad', 'sing', 'game', 'cry', 'sad', 'han', 'angry', 'yinan', 'lianhong'];

/* 按键表情映射（来自「按键表情一览List of key expressions.txt」） */
const EXPR_KEYS = {
  '1': 'dai', '2': 'weapon', '3': 'pad', '4': 'sing', '5': 'game',
  '6': 'cry', '7': 'sad', '8': 'han', '9': 'angry', '/': 'yinan', '*': 'pad'
};

function applyExprParams() {
  if (!model) return;
  var cm = model.internalModel.coreModel;
  for (var i = 0; i < EXPR_IDS.length; i++) {
    cm.setParameterValueById(EXPR_IDS[i], EXPR_IDS[i] === currentExpr ? 1 : 0);
  }
}

export function setExpression(name) {
  if (EXPR_IDS.indexOf(name) < 0) return;
  currentExpr = name;
  applyExprParams();
  /* 按钮高亮 */
  var btns = document.querySelectorAll('#expr-buttons button');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('active', btns[i].getAttribute('data-expr') === name);
  }
}

function bindExprButtons() {
  var btns = document.querySelectorAll('#expr-buttons button');
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener('click', function () {
      setExpression(this.getAttribute('data-expr'));
    });
  }
}

export async function initLive2D() {
  if (app) return;
  try {
    var canvas = document.getElementById('live2d-canvas');
    var wrap = document.getElementById('live2d-wrap');
    app = new Application({
      view: canvas,
      transparent: true,
      backgroundAlpha: 0,
      autoStart: true,
      resizeTo: wrap,
      antialias: true
    });
    /* 模型地址用绝对 URL：库内旧版 url.resolve 以 location.origin 为基准，
       相对路径会在 GitHub Pages 子路径下错误地解析到域名根（404） */
    var modelURL = new URL('live2d/peilika/Q扁佩丽卡.model3.json', document.baseURI).href;
    model = await Live2DModel.from(modelURL);
    model.anchor.set(0.5, 0.5);
    app.stage.addChild(model);
    fitModel();
    window.addEventListener('resize', fitModel);
    ready = true;
    window.__l2dDebug = { model: model, app: app };

    /* 每帧应用表情参数（在当前/下一个模型 update 周期生效） */
    app.ticker.add(applyExprParams);

    /* 鼠标跟踪：眼睛/头部跟随鼠标（参考 L2Dwidget 看板娘） */
    window.addEventListener('mousemove', function (e) {
      if (!model) return;
      var fc = model.internalModel.focusController;
      if (fc) {
        var x = (e.clientX / window.innerWidth) * 2 - 1;
        var y = -((e.clientY / window.innerHeight) * 2 - 1);
        fc.focus(x, y, true);
      }
    });

    bindExprButtons();

    /* 点击角色随机表情 */
    canvas.addEventListener('click', function () {
      var i = Math.floor(Math.random() * EXPR_IDS.length);
      setExpression(EXPR_IDS[i]);
    });

    /* 键盘 Ctrl+Num 切换表情 */
    document.addEventListener('keydown', function (e) {
      if (!e.ctrlKey) return;
      var id = EXPR_KEYS[e.key];
      if (id) setExpression(id);
    });
  } catch (e) {
    console.warn('Live2D 加载失败:', e);
  }
}

function fitModel() {
  if (!model || !app) return;
  var wrap = document.getElementById('live2d-wrap');
  var w = wrap.clientWidth || 300;
  var h = wrap.clientHeight || 400;
  var s = Math.min(w / model.width, h / model.height) * 0.92;
  model.scale.set(s);
  model.x = w / 2;
  model.y = h / 2;
}

export function showLive2D() {
  var wrap = document.getElementById('live2d-wrap');
  if (wrap) wrap.classList.add('show');
  var eb = document.getElementById('expr-buttons');
  if (eb) eb.classList.add('show');
}

export function hideLive2D() {
  var wrap = document.getElementById('live2d-wrap');
  if (wrap) wrap.classList.remove('show');
  var eb = document.getElementById('expr-buttons');
  if (eb) eb.classList.remove('show');
}
