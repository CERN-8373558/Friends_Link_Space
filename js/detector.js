/* ============================================================
 * detector.js —— WebGL 检测 (对应原站 Detector.js)
 * ============================================================ */

var Detector = {
  webgl: (function () {
    try {
      var canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  })()
};

Detector.getWebGLErrorMessage = function () {
  var element = document.createElement('div');
  element.id = 'webgl-error-message';
  element.style.fontFamily = 'monospace';
  element.style.fontSize = '13px';
  element.style.background = '#000000';
  element.style.color = '#ffffff';
  element.style.padding = '1.5em';
  element.style.width = '640px';
  element.style.position = 'absolute';
  element.style.top = '50%';
  element.style.left = '50%';
  element.style.marginLeft = '-320px';
  element.style.textAlign = 'center';
  element.style.zIndex = '500000';
  element.innerHTML = '你的浏览器/显卡不支持 WebGL，无法运行本演示。<br>请换用支持 WebGL 的 Chrome / Edge / Firefox 打开。';
  return element;
};

Detector.addGetWebGLMessage = function () {
  var parent = document.body;
  parent.appendChild(Detector.getWebGLErrorMessage());
};
