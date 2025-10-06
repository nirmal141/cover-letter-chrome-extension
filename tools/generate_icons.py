#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

def make_icon(size: int, out_path: str):
    img = Image.new('RGBA', (size, size), (15, 23, 42, 255))  # slate-900
    draw = ImageDraw.Draw(img)
    # Accent circle
    r = int(size * 0.36)
    cx = cy = size // 2
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(37, 99, 235, 255))
    # Simple monogram "CL"
    try:
        font = ImageFont.truetype("Arial.ttf", int(size * 0.34))
    except Exception:
        font = ImageFont.load_default()
    text = "CL"
    try:
        # Pillow >= 8: use textbbox for accurate sizing
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    except Exception:
        # Fallback if textbbox is unavailable
        tw, th = font.getsize(text)
    draw.text((cx - tw/2, cy - th/2), text, font=font, fill=(255, 255, 255, 255))
    img.save(out_path)

def main():
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'icons')
    os.makedirs(out_dir, exist_ok=True)
    for s in (16, 48, 128):
        make_icon(s, os.path.join(out_dir, f'icon{s}.png'))
    print('Icons generated in icons/')

if __name__ == '__main__':
    main()


