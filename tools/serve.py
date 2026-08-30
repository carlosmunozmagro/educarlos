#!/usr/bin/env python3
"""Dev server for the course app.

    python3 tools/serve.py [port]        # default 8080

Serves the repository root. Content JSON and SVGs are fetched at runtime, so
they must not be cached between edits - hence the no-store header.
"""
import functools
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".js": "text/javascript", ".json": "application/json",
                      ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if not str(args[1] if len(args) > 1 else "").startswith("2"):
            super().log_message(fmt, *args)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    handler = functools.partial(Handler, directory=ROOT)
    print(f"serving {ROOT} on http://localhost:{port}  (view at 375x812)")
    http.server.ThreadingHTTPServer(("", port), handler).serve_forever()


if __name__ == "__main__":
    main()
