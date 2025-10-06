#!/usr/bin/env python3
import os
import zipfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

EXCLUDE = {'.git', '.DS_Store', 'node_modules', '__pycache__', '.cursorignore'}
TOOLS_DIR = os.path.join(ROOT, 'tools')

def should_include(path: str) -> bool:
    parts = set(path.split(os.sep))
    return EXCLUDE.isdisjoint(parts)

def main():
    out_path = os.path.join(ROOT, 'cover-letter-extension.zip')
    with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as z:
        for base, _, files in os.walk(ROOT):
            for f in files:
                abs_path = os.path.join(base, f)
                rel_path = os.path.relpath(abs_path, ROOT)
                if rel_path.startswith('tools' + os.sep):
                    continue
                if not should_include(rel_path):
                    continue
                z.write(abs_path, rel_path)
    print('Created', out_path)

if __name__ == '__main__':
    main()


