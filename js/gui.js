/* ============================================================
 * gui.js —— 控制面板 (dat.gui 风格)
 * ============================================================ */

var controllers = {
  autoRotate: true,
  labels: true,
  alwaysLabels: false,
  dust: true,
  speed: 1.0,
  layout: 'spiral'
};

function guiRow(label, controlHTML, cls) {
  var row = document.createElement('div');
  row.className = 'row ' + (cls || '');
  row.innerHTML = '<span class="label">' + label + '</span>' + controlHTML;
  return row;
}

function guiCheckboxRow(label, key) {
  var row = guiRow(label, '<input type="checkbox" ' + (controllers[key] ? 'checked' : '') + '>', 'boolean');
  var input = row.querySelector('input');
  input.addEventListener('change', function () {
    controllers[key] = input.checked;
    if (window.setFeature) window.setFeature(key, input.checked);
  });
  return row;
}

function guiSliderRow(label, key, min, max, step) {
  var row = guiRow(label,
    '<input type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + controllers[key] + '"><span class="value">' + controllers[key] + '</span>');
  var input = row.querySelector('input');
  var value = row.querySelector('.value');
  input.addEventListener('input', function () {
    controllers[key] = parseFloat(input.value);
    value.innerHTML = roundNumber(controllers[key], 2);
  });
  return row;
}

function guiButtonRow(label, fn) {
  var row = guiRow(label, '', 'function');
  row.addEventListener('click', function (e) {
    e.stopPropagation();
    if (fn) fn();
  });
  return row;
}

function guiSelectRow(label, key, options) {
  var opts = '';
  for (var i = 0; i < options.length; i++) {
    opts += '<option value="' + options[i][0] + '"' +
      (controllers[key] === options[i][0] ? ' selected' : '') + '>' + options[i][1] + '</option>';
  }
  var row = guiRow(label, '<select>' + opts + '</select>');
  var select = row.querySelector('select');
  select.addEventListener('change', function () {
    controllers[key] = select.value;
    if (window.setFeature) window.setFeature(key, select.value);
  });
  return row;
}

function buildGUI() {
  guiBodyEl.innerHTML = '';

  guiBodyEl.appendChild(guiSelectRow('银河布局', 'layout', [
    ['spiral', '旋臂银河'],
    ['random', '随机散点']
  ]));
  guiBodyEl.appendChild(guiCheckboxRow('自动旋转', 'autoRotate'));
  guiBodyEl.appendChild(guiCheckboxRow('标签', 'labels'));
  guiBodyEl.appendChild(guiCheckboxRow('名字永久显示', 'alwaysLabels'));
  guiBodyEl.appendChild(guiCheckboxRow('星尘', 'dust'));
  guiBodyEl.appendChild(guiSliderRow('运行速度', 'speed', 0.1, 5, 0.1));

  guiBodyEl.appendChild(guiButtonRow('回到银河全景', function () {
    resetToGalaxy();
  }));
  guiBodyEl.appendChild(guiButtonRow('随机一颗星', function () {
    jumpRandomStar();
  }));
  guiBodyEl.appendChild(guiButtonRow('开始巡游', function () {
    tour.start();
  }));

  var title = document.getElementById('gui-title');
  title.addEventListener('click', function () {
    guiBodyEl.style.display = guiBodyEl.style.display === 'none' ? 'block' : 'none';
  });

  var toggle = document.getElementById('gui-toggle');
  if (toggle) {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleGUI();
    });
  }
}

function toggleGUI() {
  var show = guiPanelEl.style.display === 'none';
  guiPanelEl.style.display = show ? 'block' : 'none';
  var toggle = document.getElementById('gui-toggle');
  if (toggle) toggle.classList.toggle('active', show);
}
