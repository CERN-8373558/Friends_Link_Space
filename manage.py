#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
友链宇宙 · 数据管理台（Python 版）
====================================
纯标准库本地 Web 工具，直接读写 data/links.json，增删改查友链数据。
彻底摆脱浏览器对本地文件的限制，无需任何第三方依赖。

用法:
    python manage.py [端口]

启动后自动打开浏览器，访问 http://127.0.0.1:8127/
（支持 --data <路径> / --datajs <路径> 指定数据文件，便于测试）
"""

import http.server
import json
import os
import re
import sys
import uuid
import webbrowser
import email.parser
import html as html_mod
import urllib.parse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LINKS_PATH = os.path.join(BASE_DIR, 'data', 'links.json')
DATAJS_PATH = os.path.join(BASE_DIR, 'js', 'data.js')
AVATAR_DIR = os.path.join(BASE_DIR, 'images', 'avatars')
DEFAULT_PORT = 8127
MAX_PLANETS = 6  # 编辑表单默认提供的行星空行数
MAX_AVATAR_BYTES = 8 * 1024 * 1024  # 头像最大 8MB
AVATAR_EXTS = ('.png', '.jpg', '.jpeg', '.gif', '.webp')
MIME = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp',
}

DATAJS_TEMPLATE = '''/* ============================================================
 * data.js —— 数据层：优先加载 data/links.json，失败时回退到内置示例数据
 * ============================================================ */

var DEFAULT_LINKS = __LINKS__;

function loadLinks(callback){
  setLoadMessage('读取星图');
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'data/links.json', true);
  xhr.onload = function(){
    try {
      var d = JSON.parse(xhr.responseText);
      if (d && d.stars && d.stars.length) { callback(d); return; }
    } catch(e) {}
    callback(DEFAULT_LINKS);
  };
  xhr.onerror = function(){ callback(DEFAULT_LINKS); };
  xhr.send();
}
'''

# ---------------- 数据读写 ----------------

def load_data(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_data(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def sync_datajs(datajs_path, data):
    compact = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    content = DATAJS_TEMPLATE.replace('__LINKS__', compact)
    with open(datajs_path, 'w', encoding='utf-8') as f:
        f.write(content)


def fix_bodies(data):
    """删除恒星后，剔除指向越界 starIndex 的引力体。"""
    n = len(data.get('stars', []))
    tb = data.get('threeBody')
    if isinstance(tb, dict) and isinstance(tb.get('bodies'), list):
        tb['bodies'] = [b for b in tb['bodies']
                        if isinstance(b, dict)
                        and isinstance(b.get('starIndex'), int)
                        and 0 <= b['starIndex'] < n]
    return data


# ---------------- HTTP 服务 ----------------

class Handler(http.server.BaseHTTPRequestHandler):

    server_version = 'FriendUniverseAdmin/1.0'

    def log_message(self, fmt, *args):
        pass  # 保持安静

    # ---- 基础响应 ----

    def _send(self, code, body, ctype='text/html; charset=utf-8'):
        if isinstance(body, str):
            body = body.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _redirect(self, path):
        self.send_response(302)
        self.send_header('Location', path)
        self.end_headers()

    def _qs(self):
        return urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)

    def _form(self):
        length = int(self.headers.get('Content-Length', 0) or 0)
        raw = self.rfile.read(length).decode('utf-8')
        return urllib.parse.parse_qs(raw, keep_blank_values=True)

    def _f(self, form, key, default=''):
        v = form.get(key)
        return v[0] if v else default

    # ---- 路由 ----

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        try:
            if path in ('/', '/index'):
                self.page_list()
            elif path == '/new':
                self.page_edit(None)
            elif path == '/edit':
                self.page_edit(self._int_qs('i'))
            elif path == '/delete':
                self.page_delete_confirm(self._int_qs('i'))
            elif path == '/settings':
                self.page_settings()
            elif path == '/export':
                self.page_export()
            elif path.startswith('/images/'):
                self._serve_static(path)
            elif path == '/favicon.ico':
                self._send(204, '')
            else:
                self._send(404, 'Not Found')
        except Exception as e:  # pragma: no cover
            self._send(500, '<h1>500</h1><pre>' + html_mod.escape(repr(e)) + '</pre>')

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        try:
            if path == '/save':
                self.post_save()
            elif path == '/delete':
                self.post_delete()
            elif path == '/settings':
                self.post_settings()
            elif path == '/sync':
                self.post_sync()
            elif path == '/upload_avatar':
                self.post_upload_avatar()
            else:
                self._send(404, 'Not Found')
        except Exception as e:  # pragma: no cover
            self._send(500, '<h1>500</h1><pre>' + html_mod.escape(repr(e)) + '</pre>')

    def _int_qs(self, key, default=-1):
        try:
            return int(self._qs().get(key, [str(default)])[0])
        except (TypeError, ValueError):
            return default

    def _msg(self):
        return self._qs().get('msg', [''])[0]

    # ---- 页面：列表 ----

    def page_list(self):
        data = load_data(self.server.links_path)
        stars = data.get('stars', [])
        q = self._qs().get('q', [''])[0].strip().lower()
        msg = self._msg()

        filtered = []
        for i, s in enumerate(stars):
            if not q:
                filtered.append((i, s))
                continue
            hay = ' '.join([
                s.get('name', ''), s.get('desc', ''), s.get('url', ''),
                ' '.join(s.get('tags', [])),
                ' '.join(p.get('name', '') + p.get('desc', '') + p.get('url', '')
                         for p in s.get('planets', []))
            ]).lower()
            if q in hay:
                filtered.append((i, s))

        rows = []
        for i, s in filtered:
            tags = ''.join('<span class="chip">%s</span>' % e(t)
                           for t in s.get('tags', []))
            planets = s.get('planets', [])
            rows.append(
                '<tr class="%s">'
                '<td><img class="avatar" src="%s" onerror="this.style.display=\'none\'"></td>'
                '<td class="nm">%s%s</td>'
                '<td class="url"><a href="%s" target="_blank">%s</a></td>'
                '<td class="desc">%s</td>'
                '<td class="tags">%s</td>'
                '<td class="cnt">%d</td>'
                '<td class="ops">'
                '<a class="btn" href="/edit?i=%d">编辑</a> '
                '<a class="btn danger" href="/delete?i=%d">删除</a>'
                '</td></tr>'
                % ('center' if s.get('center') else '',
                   e(s.get('avatar', '')), e(s.get('name', '')),
                   ' <span class="core">银心</span>' if s.get('center') else '',
                   e(s.get('url', '')), e(s.get('url', '') or '—'),
                   e(s.get('desc', '')), tags, len(planets), i, i))

        search = ('<input type="text" name="q" value="%s" placeholder="搜索站名 / 简介 / 行星…">'
                  % e(q))
        content = (
            '<div class="toolbar">'
            '<form method="get" action="/" class="search-form">%s'
            '<button type="submit" class="btn">搜索</button></form>'
            '<a class="btn primary" href="/new">＋ 新增恒星</a>'
            '<a class="btn" href="/settings">⚙ 全局设置</a>'
            '<a class="btn" href="/export">⬇ 导出 links.json</a>'
            '<form method="post" action="/sync" class="inline-form">'
            '<button type="submit" class="btn" onclick="return confirm(\'用当前数据重新生成 js/data.js？\')">'
            '⚡ 同步生成 data.js</button></form>'
            '</div>'
            '<div class="stats">共 %d 位朋友%s</div>'
            '<table class="stars"><thead><tr>'
            '<th></th><th>名称</th><th>链接</th><th>简介</th><th>标签</th>'
            '<th>行星</th><th>操作</th></tr></thead><tbody>%s</tbody></table>'
            % (search, len(stars), '，当前显示 %d' % len(filtered) if q else '',
               ''.join(rows) or '<tr><td colspan="7" class="empty">没有匹配的恒星</td></tr>'))
        self._send(200, self.page('友链列表', msg, content))

    # ---- 页面：新增 / 编辑 ----

    AVATAR_JS = '''
<script>
(function () {
  var drop = document.getElementById('avatar-drop');
  var fi = document.getElementById('avatar-file');
  var pv = document.getElementById('avatar-preview');
  var url = document.getElementById('avatar-url');
  if (!drop || !fi || !pv || !url) return;
  var cur = url.value;
  if (cur) { pv.src = cur; pv.style.display = ''; }
  url.addEventListener('input', function () {
    if (url.value) { pv.src = url.value; pv.style.display = ''; }
    else { pv.style.display = 'none'; }
  });
  drop.addEventListener('click', function () { fi.click(); });
  ['dragover', 'dragenter'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); });
  });
  drop.addEventListener('drop', function (e) {
    if (e.dataTransfer.files.length) handle(e.dataTransfer.files[0]);
  });
  fi.addEventListener('change', function () {
    if (fi.files.length) handle(fi.files[0]);
    fi.value = '';
  });
  function handle(file) {
    if (!file || file.type.indexOf('image/') !== 0) { alert('请选择图片文件'); return; }
    var rd = new FileReader();
    rd.onload = function () { pv.src = rd.result; pv.style.display = ''; };
    rd.readAsDataURL(file);
    var fd = new FormData();
    fd.append('avatar_file', file);
    fetch('/upload_avatar', { method: 'POST', body: fd })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok) { url.value = j.path; }
        else { alert('上传失败：' + (j.error || '未知错误')); }
      })
      .catch(function () { alert('上传失败，请重试'); });
  }
})();
</script>
'''

    def page_edit(self, idx):
        data = load_data(self.server.links_path)
        stars = data.get('stars', [])
        gtags = data.get('tags', [])

        if idx is not None and 0 <= idx < len(stars):
            s = stars[idx]
            title = '编辑恒星 #%d' % idx
        else:
            s = {'name': '', 'url': '', 'avatar': '', 'desc': '',
                 'color': '#ffffff', 'tags': [], 'center': False, 'planets': []}
            idx = -1
            title = '新增恒星'

        stags = s.get('tags', []) or []
        checkbox_tags = []
        for t in gtags:
            checked = ' checked' if t in stags else ''
            checkbox_tags.append(
                '<label class="tag-check"><input type="checkbox" name="tag" value="%s"%s> %s</label>'
                % (e(t), checked, e(t)))
        custom = [t for t in stags if t not in gtags]

        planet_rows = []
        planets = s.get('planets', []) or []
        for p in planets:
            planet_rows.append(self.planet_row(
                p.get('name', ''), p.get('url', ''), p.get('desc', '')))
        for _ in range(max(0, MAX_PLANETS - len(planets))):
            planet_rows.append(self.planet_row('', '', ''))
        planet_block = ''.join(planet_rows)

        content = (
            '<div class="card"><h2>%s</h2>'
            '<form method="post" action="/save">'
            '<input type="hidden" name="index" value="%d">'
            '<div class="frow"><label>名称 *</label>'
            '<input type="text" name="name" required value="%s"></div>'
            '<div class="frow"><label>链接</label>'
            '<input type="text" name="url" value="%s" placeholder="https://…"></div>'
            '<div class="frow v"><label>头像</label>'
            '<div class="avatar-ui">'
            '<div class="avatar-drop" id="avatar-drop">拖拽图片到此处<br><span class="dim">或点击选择文件</span></div>'
            '<input type="file" id="avatar-file" accept="image/*" hidden>'
            '<div class="avatar-preview-box"><img id="avatar-preview" class="avatar-preview" alt=""></div>'
            '<input type="text" name="avatar" id="avatar-url" value="%s" placeholder="图片地址（外链 URL 或 images/avatars/… 本地路径）">'
            '<p class="hint">拖拽或选择本地图片后自动上传到 images/avatars/，以本地相对路径保存（主站直接显示）</p>'
            '</div></div>'
            '<div class="frow"><label>简介</label>'
            '<textarea name="desc" rows="2">%s</textarea></div>'
            '<div class="frow"><label>颜色</label>'
            '<input type="color" name="color" value="%s"></div>'
            '<div class="frow"><label>银心</label>'
            '<label class="switch"><input type="checkbox" name="center" value="1"%s> 设为银河中心</label></div>'
            '<div class="frow v"><label>标签</label>'
            '<div class="tag-pool">%s</div>'
            '<input type="text" name="newtags" value="%s" placeholder="或在此输入自定义标签，逗号分隔"></div>'
            '<div class="planets"><h3>行星（子项目）</h3>%s</div>'
            '<div class="act"><button type="submit" class="btn primary">保存</button> '
            '<a class="btn" href="/">取消</a></div>'
             '</form></div>'
            % (title, idx, e(s.get('name', '')), e(s.get('url', '')),
               e(s.get('avatar', '')), e(s.get('desc', '')),
               e(s.get('color', '#ffffff')),
               ' checked' if s.get('center') else '',
               ''.join(checkbox_tags), e(', '.join(custom)), planet_block))
        content += self.AVATAR_JS
        self._send(200, self.page(title, '', content))

    @staticmethod
    def planet_row(name, url, desc):
        return (
            '<div class="planet-row">'
            '<input type="text" name="pname" value="%s" placeholder="项目名">'
            '<input type="text" name="purl" value="%s" placeholder="https://…">'
            '<input type="text" name="pdesc" value="%s" placeholder="说明">'
            '</div>'
            % (e(name), e(url), e(desc)))

    # ---- 页面：删除确认 ----

    def page_delete_confirm(self, idx):
        data = load_data(self.server.links_path)
        stars = data.get('stars', [])
        if 0 <= idx < len(stars):
            name = stars[idx].get('name', '未命名')
            content = (
                '<div class="card"><h2>删除确认</h2>'
                '<p class="warn">确定要删除恒星「%s」吗？'
                '其下的行星和三体引用也会一并处理（引用该星的引力体会被移除）。</p>'
                '<form method="post" action="/delete">'
                '<input type="hidden" name="i" value="%d">'
                '<button type="submit" class="btn danger">确认删除</button> '
                '<a class="btn" href="/">取消</a>'
                '</form></div>' % (e(name), idx))
            self._send(200, self.page('删除确认', '', content))
        else:
            self._redirect('/')

    # ---- 页面：全局设置 ----

    def page_settings(self):
        data = load_data(self.server.links_path)
        g = data.get('galaxy', {})
        tb = data.get('threeBody', {})
        stars = data.get('stars', [])
        msg = self._msg()

        star_opts = ''.join(
            '<option value="%d">#%d %s</option>' % (i, i, e(s.get('name', '')))
            for i, s in enumerate(stars))

        body_rows = []
        for b in tb.get('bodies', []):
            body_rows.append(
                '<div class="body-row">'
                '<label>恒星</label><select name="body_index">'
                '<option value="-1">（移除）</option>%s</select>'
                '<label>质量</label><input type="number" name="body_mass" step="0.1" min="0.1" value="%s">'
                '</div>'
                % (star_opts.replace(
                    'value="%d"' % b.get('starIndex'),
                    'value="%d" selected' % b.get('starIndex')) if b.get('starIndex') is not None else star_opts,
                   e(str(b.get('mass', 1)))))
        body_block = ''.join(body_rows)

        def num_field(name, label, value, step='1'):
            return ('<div class="frow"><label>%s</label>'
                    '<input type="number" name="%s" step="%s" value="%s"></div>'
                    % (e(label), name, step, e(str(value))))

        content_tpl = (
            '<div class="card"><h2>基础设置</h2>'
            '<form method="post" action="/settings">'
            '<div class="frow"><label>网站标题</label><input type="text" name="title" value="%s"></div>'
            '<div class="frow"><label>副标题</label><input type="text" name="subtitle" value="%s"></div>'
            '<div class="frow"><label>默认布局</label><select name="layout">'
            '<option value="spiral"%s>旋臂银河（spiral）</option>'
            '<option value="random"%s>随机散点（random）</option>'
            '</select></div></div>'
            '<div class="card"><h2>银河布局</h2>'
            + num_field('radius', '恒星分布半径', g.get('radius', 115))
            + num_field('arms', '旋臂数', g.get('arms', 4))
            + num_field('diskRadius', '星尘范围', g.get('diskRadius', 430))
            + num_field('dust', '星尘粒子数', g.get('dust', 16000))
            + num_field('startZoom', '初始缩放', g.get('startZoom', 420))
            + num_field('maxZoom', '最大缩放（彩蛋阈值）', g.get('maxZoom', 8000000))
            + num_field('centerClear', '银心留白', g.get('centerClear', 24))
            + num_field('seed', '随机种子', g.get('seed', 20260830))
            + '</div>'
            '<div class="card"><h2>三体系统（4 体模拟）</h2>'
            '<div class="frow"><label>启用</label><label class="switch">'
            '<input type="checkbox" name="tb_enabled" value="1"%s> 启用三体系统</label></div>'
            '<div class="frow"><label>三体名称</label><input type="text" name="tb_name" value="%s"></div>'
            '<div class="frow"><label>轨道半径</label>'
            '<input type="text" name="tb_radii" value="%s" placeholder="逗号分隔"></div>'
            + num_field('tb_G', '引力常数 G', tb.get('G', 1), '0.1')
            + num_field('tb_centerMass', '银心质量', tb.get('centerMass', 300))
            + num_field('tb_cageRadius', '球壳约束半径', tb.get('cageRadius', 15))
            + num_field('tb_minDist', '最小距离', tb.get('minDist', 0.5), '0.1')
            + '<div class="bodies"><h3>绕行恒星（引力体）</h3>%s</div>'
            '<div class="body-row add"><label>新增引力体</label>'
            '<select name="add_body_index"><option value="-1">（不添加）</option>%s</select>'
            '<label>质量</label><input type="number" name="add_body_mass" step="0.1" min="0.1" value="1">'
            '</div></div>'
            '<div class="card"><h2>标签（全局分类页签）</h2>'
            '<div class="frow v"><label>标签列表</label>'
            '<input type="text" name="tags_list" value="%s" placeholder="逗号分隔"></div>'
            '<p class="hint">这里的标签显示为网站顶部页签；每颗恒星的标签在编辑页单独勾选。</p></div>'
            '<div class="act"><button type="submit" class="btn primary">保存设置</button> '
            '<a class="btn" href="/">返回列表</a></div></form>'
            )
        content_args = (
            e(data.get('title', '')), e(data.get('subtitle', '')),
            ' selected' if data.get('defaultLayout') == 'spiral' else '',
            ' selected' if data.get('defaultLayout') == 'random' else '',
            ' checked' if tb.get('enabled') else '',
            e(tb.get('name', '关键用户')),
            e(', '.join(str(x) for x in tb.get('radii', []))),
            body_block, star_opts, e(', '.join(data.get('tags', []))),
        )
        content = content_tpl % content_args
        self._send(200, self.page('全局设置', msg, content))

    # ---- 页面：导出 ----

    def page_export(self):
        data = load_data(self.server.links_path)
        raw = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
        body = raw.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Disposition', 'attachment; filename="links.json"')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # ---- 静态图片（images/avatars 本地头像） ----

    def _serve_static(self, path):
        rel = path.lstrip('/')
        fp = os.path.normpath(os.path.join(BASE_DIR, rel))
        if not fp.startswith(BASE_DIR) or not os.path.isfile(fp):
            self._send(404, 'Not Found')
            return
        ext = os.path.splitext(fp)[1].lower()
        ctype = MIME.get(ext, 'application/octet-stream')
        with open(fp, 'rb') as f:
            data = f.read()
        self._send(200, data, ctype)

    # ---- 头像上传 ----

    def _raw_body(self):
        length = int(self.headers.get('Content-Length', 0) or 0)
        return self.rfile.read(length)

    def _parse_multipart(self, raw):
        ct = self.headers.get('Content-Type', '')
        header = ('Content-Type: %s\r\n\r\n' % ct).encode('utf-8')
        msg = email.parser.BytesParser().parsebytes(header + raw)
        out = {}
        payloads = msg.get_payload()
        if not isinstance(payloads, list):
            return out
        for part in payloads:
            if not isinstance(part, email.message.Message):
                continue
            name = part.get_param('name', header='content-disposition')
            if not name:
                continue
            filename = part.get_filename()
            if filename:
                out[name] = (filename, part.get_payload(decode=True) or b'')
            else:
                out[name] = part.get_payload(decode=True) or part.get_payload()
        return out

    def _save_avatar(self, filename, data):
        os.makedirs(AVATAR_DIR, exist_ok=True)
        ext = os.path.splitext(filename)[1].lower()
        if ext not in AVATAR_EXTS:
            ext = '.png'
        name = 'avatar_%s%s' % (uuid.uuid4().hex[:12], ext)
        with open(os.path.join(AVATAR_DIR, name), 'wb') as f:
            f.write(data)
        return 'images/avatars/' + name

    def _send_json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def post_upload_avatar(self):
        raw = self._raw_body()
        if not raw:
            self._send_json(400, {'ok': False, 'error': '未收到文件'})
            return
        try:
            fields = self._parse_multipart(raw)
        except Exception as e:
            self._send_json(400, {'ok': False, 'error': '解析失败：%s' % e})
            return
        f = fields.get('avatar_file')
        if not f or not isinstance(f, tuple) or not f[1]:
            self._send_json(400, {'ok': False, 'error': '未收到图片文件'})
            return
        filename, data = f
        if len(data) > MAX_AVATAR_BYTES:
            self._send_json(400, {'ok': False, 'error': '图片过大（上限 8MB）'})
            return
        path = self._save_avatar(filename, data)
        self._send_json(200, {'ok': True, 'path': path})

    # ---- POST：保存恒星 ----

    def post_save(self):
        form = self._form()
        data = load_data(self.server.links_path)
        stars = data.setdefault('stars', [])
        idx = int(self._f(form, 'index', '-1') or '-1')
        name = self._f(form, 'name').strip() or '未命名'

        star = {
            'name': name,
            'url': self._f(form, 'url').strip(),
            'avatar': self._f(form, 'avatar').strip(),
            'desc': self._f(form, 'desc').strip(),
            'color': self._f(form, 'color') or '#ffffff',
            'tags': self.collect_tags(form, data),
            'center': self._f(form, 'center') == '1',
            'planets': self.collect_planets(form),
        }

        if 0 <= idx < len(stars):
            stars[idx] = star
            msg = '已更新：' + name
        else:
            stars.append(star)
            msg = '已新增：' + name

        fix_bodies(data)
        save_data(self.server.links_path, data)
        self._redirect('/?msg=' + urllib.parse.quote(msg))

    @staticmethod
    def collect_planets(form):
        names = form.get('pname', [])
        urls = form.get('purl', [])
        descs = form.get('pdesc', [])
        n = max(len(names), len(urls), len(descs))
        planets = []
        for i in range(n):
            nm = (names[i] if i < len(names) else '').strip()
            ur = (urls[i] if i < len(urls) else '').strip()
            de = (descs[i] if i < len(descs) else '').strip()
            if nm or ur:
                planets.append({'name': nm, 'url': ur, 'desc': de})
        return planets

    @staticmethod
    def collect_tags(form, data):
        tags = list(form.get('tag', []))
        extra = form.get('newtags', [''])[0]
        for t in re.split(r'[,，;；]+', extra):
            t = t.strip()
            if t and t not in tags:
                tags.append(t)
        gtags = data.setdefault('tags', [])
        for t in tags:
            if t not in gtags:
                gtags.append(t)
        return tags

    # ---- POST：删除恒星 ----

    def post_delete(self):
        form = self._form()
        idx = int(self._f(form, 'i', '-1') or '-1')
        data = load_data(self.server.links_path)
        stars = data.get('stars', [])
        if 0 <= idx < len(stars):
            name = stars[idx].get('name', '未命名')
            del stars[idx]
            fix_bodies(data)
            save_data(self.server.links_path, data)
            self._redirect('/?msg=' + urllib.parse.quote('已删除：' + name))
        else:
            self._redirect('/')

    # ---- POST：保存设置 ----

    def post_settings(self):
        form = self._form()
        data = load_data(self.server.links_path)

        data['title'] = self._f(form, 'title', data.get('title', ''))
        data['subtitle'] = self._f(form, 'subtitle', data.get('subtitle', ''))
        data['defaultLayout'] = self._f(form, 'layout', 'spiral')

        g = data.setdefault('galaxy', {})
        for k in ('radius', 'arms', 'diskRadius', 'dust',
                  'startZoom', 'maxZoom', 'centerClear', 'seed'):
            g[k] = self._num(form, k, g.get(k, 0), int)

        tb = data.setdefault('threeBody', {})
        tb['enabled'] = self._f(form, 'tb_enabled') == '1'
        tb['name'] = self._f(form, 'tb_name', tb.get('name', '关键用户'))
        radii = [float(x) for x in re.split(r'[,，\s]+', self._f(form, 'tb_radii'))
                 if x.strip() != '']
        if radii:
            tb['radii'] = radii
        tb['G'] = self._num(form, 'tb_G', tb.get('G', 1))
        tb['centerMass'] = self._num(form, 'tb_centerMass', tb.get('centerMass', 300))
        tb['cageRadius'] = self._num(form, 'tb_cageRadius', tb.get('cageRadius', 15))
        tb['minDist'] = self._num(form, 'tb_minDist', tb.get('minDist', 0.5))

        bodies = []
        for si, m in zip(form.get('body_index', []), form.get('body_mass', [])):
            try:
                iv = int(si)
            except (TypeError, ValueError):
                iv = -1
            if iv >= 0:
                bodies.append({'starIndex': iv, 'mass': self._float_or(m, 1.0)})
        try:
            av = int(self._f(form, 'add_body_index', '-1'))
        except (TypeError, ValueError):
            av = -1
        if av >= 0 and not any(b['starIndex'] == av for b in bodies):
            bodies.append({'starIndex': av, 'mass': self._float_or(
                self._f(form, 'add_body_mass', '1'), 1.0)})
        tb['bodies'] = bodies

        tags = [t.strip() for t in re.split(r'[,，;；]+', self._f(form, 'tags_list'))
                if t.strip() != '']
        data['tags'] = tags

        save_data(self.server.links_path, data)
        self._redirect('/settings?msg=' + urllib.parse.quote('设置已保存'))

    @staticmethod
    def _num(form, key, default, cast=float):
        try:
            return cast(form.get(key, [''])[0])
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _float_or(v, default):
        try:
            return float(v)
        except (TypeError, ValueError):
            return default

    # ---- POST：同步 data.js ----

    def post_sync(self):
        data = load_data(self.server.links_path)
        sync_datajs(self.server.datajs_path, data)
        self._redirect('/?msg=' + urllib.parse.quote(
            '已用当前数据重新生成 js/data.js（主站回退数据已同步）'))

    # ---- 页面骨架 ----

    def page(self, title, msg, content):
        nav = (
            '<a class="nav" href="/">友链列表</a>'
            '<a class="nav" href="/new">＋ 新增</a>'
            '<a class="nav" href="/settings">全局设置</a>'
            '<a class="nav" href="/export">导出 JSON</a>')
        msg_html = ('<div class="msg">%s</div>' % e(msg)) if msg else ''
        return (
            '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width, initial-scale=1">'
            '<title>%s · 友链宇宙管理台</title><style>%s</style></head><body>'
            '<header><div class="brand"><span class="star">✦</span> '
            '友链宇宙 · 数据管理台 <span class="ver">Py</span></div>'
            '<nav>%s</nav></header>'
            '<main>%s%s</main>'
            '<footer>Python 管理台 · 直接读写 data/links.json · '
            '保存后刷新主站即可生效（正式发布时点「同步生成 data.js」更新回退数据）</footer>'
            '</body></html>'
            % (e(title), CSS, nav, msg_html, content))


def e(s):
    return html_mod.escape(str(s if s is not None else ''), quote=True)


CSS = '''
*{box-sizing:border-box}
:root{--bg:#070b14;--panel:#0e1524;--card:#121b2e;--border:#1f2c45;--txt:#cfe0ff;--dim:#7d90b8;--accent:#ffb35c;--accent2:#4cc9f0;--danger:#ff6b6b}
html,body{margin:0;padding:0}
body{font-family:"Segoe UI","Microsoft YaHei",system-ui,sans-serif;background:var(--bg);color:var(--txt);font-size:14px;padding-bottom:60px}
header{position:sticky;top:0;z-index:10;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;padding:12px 20px;background:linear-gradient(180deg,#0b1222,#0e1524);border-bottom:1px solid var(--border)}
.brand{font-size:16px;font-weight:700;letter-spacing:1px}
.brand .star{color:var(--accent)}
.brand .ver{font-size:11px;font-weight:700;color:#10221a;background:var(--accent2);border-radius:4px;padding:1px 6px;margin-left:8px;vertical-align:2px}
nav{display:flex;gap:6px;flex-wrap:wrap}
.nav{color:var(--dim);text-decoration:none;font-size:13px;padding:6px 12px;border:1px solid var(--border);border-radius:999px}
.nav:hover{color:#fff;border-color:var(--accent2)}
main{max-width:1100px;margin:0 auto;padding:20px}
.msg{background:#3a2c12;border:1px solid #5b4518;color:#ffe8b8;padding:10px 14px;border-radius:8px;margin-bottom:16px}
.toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.toolbar form{display:flex;gap:8px;align-items:center}
.toolbar .search-form{flex:1 1 260px}
.toolbar input[type=text]{flex:1;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--txt);padding:9px 14px;font-size:13px;min-width:180px}
.stats{color:var(--dim);font-size:13px;margin-bottom:10px}
table.stars{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--border);border-radius:10px;overflow:hidden}
table.stars th,table.stars td{padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;vertical-align:middle}
table.stars th{color:var(--dim);font-size:12px;font-weight:600}
table.stars tr:last-child td{border-bottom:none}
table.stars tr:hover td{background:#16213a}
table.stars tr.center td{border-left:3px solid var(--accent)}
.avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;background:var(--bg)}
td.nm{font-weight:600}
.core{font-size:11px;color:#201500;background:var(--accent);border-radius:4px;padding:1px 5px;margin-left:6px}
td.url a{color:var(--accent2);text-decoration:none;word-break:break-all}
td.desc{color:var(--dim);max-width:260px}
td.tags{max-width:180px}
.chip{display:inline-block;background:#1d2a45;border:1px solid #2c3f66;border-radius:999px;padding:1px 8px;font-size:11px;margin:1px 2px;color:#cfe0ff}
td.cnt{text-align:center;color:var(--dim)}
td.ops{white-space:nowrap}
.btn{display:inline-block;background:var(--card);color:var(--txt);border:1px solid var(--border);border-radius:6px;padding:7px 14px;font-size:13px;cursor:pointer;text-decoration:none}
.btn:hover{border-color:var(--accent2);color:#fff}
.btn.primary{background:var(--accent);color:#201500;border-color:var(--accent);font-weight:600}
.btn.primary:hover{color:#000}
.btn.danger{color:var(--danger)}
.btn.danger:hover{border-color:var(--danger);color:#ffb3b3}
.empty{text-align:center;color:var(--dim);padding:26px}
.card{background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:18px;margin-bottom:18px}
.card h2{font-size:16px;color:var(--accent);margin:0 0 14px}
.card h3{font-size:13px;color:var(--accent2);margin:14px 0 8px}
.frow{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}
.frow.v{align-items:flex-start}
.frow label{width:150px;flex:0 0 150px;color:var(--dim);font-size:13px}
.frow input[type=text],.frow input:not([type]),.frow textarea,.frow input[type=number],.frow select{flex:1 1 220px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--txt);padding:7px 10px;font-size:13px}
.frow textarea{resize:vertical;min-width:220px}
input[type=color]{width:40px;height:34px;padding:2px;background:var(--bg);border:1px solid var(--border);border-radius:6px}
.tag-pool{flex:1 1 100%;display:flex;flex-wrap:wrap;gap:8px}
.avatar-ui{flex:1 1 100%;display:flex;flex-direction:column;gap:8px}
.avatar-drop{border:2px dashed var(--border);border-radius:10px;padding:22px;text-align:center;color:var(--dim);cursor:pointer;transition:border-color .2s,color .2s,background .2s}
.avatar-drop:hover,.avatar-drop.over{border-color:var(--accent2);color:var(--txt);background:#16213a}
.avatar-drop .dim{font-size:12px}
.avatar-preview{max-width:100px;max-height:100px;border-radius:10px;border:1px solid var(--border);display:none;background:var(--bg);object-fit:cover}
.avatar-preview-box{min-height:8px}
.avatar-ui input[type=text]{background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--txt);padding:7px 10px;font-size:13px}
.tag-check{display:inline-flex;align-items:center;gap:5px;background:#1d2a45;border:1px solid #2c3f66;border-radius:999px;padding:3px 10px;font-size:12px}
.tag-check input{width:auto}
.planets{border-top:1px dashed var(--border);margin-top:14px;padding-top:6px}
.planet-row{display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.planet-row input{flex:1 1 200px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--txt);padding:7px 10px;font-size:13px}
.planet-row input:first-child{flex:0 1 150px}
.bodies{border-top:1px dashed var(--border);margin-top:14px;padding-top:6px}
.body-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.body-row select{flex:1 1 260px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--txt);padding:6px 8px;font-size:13px}
.body-row input[type=number]{width:80px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--txt);padding:6px 8px;font-size:13px}
.body-row label{color:var(--dim);font-size:12px}
.warn{color:#ffd27f;line-height:1.7}
.hint{color:var(--dim);font-size:12px;line-height:1.6}
.act{margin-top:16px;display:flex;gap:10px}
.switch{display:inline-flex;align-items:center;gap:6px;color:var(--txt)}
footer{position:fixed;bottom:0;left:0;right:0;background:#0b1222;border-top:1px solid var(--border);color:var(--dim);font-size:12px;padding:8px 20px;text-align:center}
'''


# ---------------- 入口 ----------------

def parse_args(argv):
    port = DEFAULT_PORT
    links_path = LINKS_PATH
    datajs_path = DATAJS_PATH
    args = list(argv)
    if args and re.fullmatch(r'\d+', args[0]):
        port = int(args.pop(0))
    while args:
        a = args.pop(0)
        if a == '--data' and args:
            links_path = os.path.abspath(args.pop(0))
        elif a == '--datajs' and args:
            datajs_path = os.path.abspath(args.pop(0))
        else:
            print('未知参数: %s' % a)
    return port, links_path, datajs_path


def main():
    port, links_path, datajs_path = parse_args(sys.argv[1:])
    url = 'http://127.0.0.1:%d/' % port
    try:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler)
    except OSError:
        print('端口 %d 已被占用（可能已在运行），直接打开浏览器…' % port)
        try:
            webbrowser.open(url)
        except Exception:
            pass
        return
    server.links_path = links_path
    server.datajs_path = datajs_path
    print('友链宇宙 · 数据管理台')
    print('数据文件: %s' % links_path)
    print('访问地址: %s' % url)
    print('按 Ctrl+C 退出（或直接关闭本窗口）')
    try:
        webbrowser.open(url)
    except Exception:
        pass
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n已退出')


if __name__ == '__main__':
    main()
