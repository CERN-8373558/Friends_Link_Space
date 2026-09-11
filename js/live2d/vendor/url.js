/* 浏览器版 url shim（@pixi/utils 引用了 node 的 'url'） */
export function parse(urlStr) {
  try {
    var u = new URL(urlStr, 'http://localhost/');
    return {
      protocol: u.protocol,
      slashes: true,
      auth: '',
      host: u.host,
      port: u.port,
      hostname: u.hostname,
      hash: u.hash,
      search: u.search,
      query: u.search.replace(/^\?/, ''),
      pathname: u.pathname,
      path: u.pathname + u.search,
      href: u.href
    };
  } catch (e) {
    return { pathname: urlStr, href: urlStr, path: urlStr, query: '' };
  }
}

export function format(o) {
  var p = o.protocol || 'http:';
  var h = (o.slashes !== false ? '//' : '') + (o.host || o.hostname + (o.port ? ':' + o.port : ''));
  return p + h + (o.pathname || '') + (o.search || '') + (o.hash || '');
}

export function resolve(from, to) {
  try {
    var base = (typeof location !== 'undefined' && location.origin) || 'http://localhost/';
    return new URL(to, new URL(from, base)).href;
  } catch (e) {
    return to;
  }
}
