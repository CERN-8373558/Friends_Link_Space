/* ============================================================
 * urlArgs.js —— 从 URL 读取配置 (对应原站 urlArgs.js)
 * ============================================================ */

(function () {
  var result = {};

  window.location.search.replace(
    new RegExp('([^?=&]+)(=([^&]*))?', 'g'),
    function ($0, $1, $2, $3) {
      result[$1] = $3;
    }
  );

  result.getBoolean = function (name, defaultValue) {
    if (!result.hasOwnProperty(name)) return defaultValue;
    var v = result[name];
    if (v === 'false' || v === '0') return false;
    return true;
  };

  result.getInt = function (name, defaultValue) {
    var r = parseInt(result[name]);
    if (isNaN(r)) return defaultValue || 0;
    return r;
  };

  window.urlArgs = result;
})();
