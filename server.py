#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本地静态服务器（禁用浏览器缓存）
用法: python server.py [端口]   （默认 8123）
所有响应带 Cache-Control: no-store，彻底避免浏览器缓存旧 JS/CSS。
"""
import http.server
import os
import sys
import socketserver

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PORT = 8123


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    with socketserver.ThreadingTCPServer(('127.0.0.1', port), NoCacheHandler) as httpd:
        httpd.allow_reuse_address = True
        print('Serving %s on http://127.0.0.1:%d/' % (BASE_DIR, port))
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
