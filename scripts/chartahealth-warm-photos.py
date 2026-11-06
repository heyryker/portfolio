"""Warm grade for the Charta persona photos: warmer white balance, cold
teal/blue surfaces pulled toward a muted sage, a soft amber lift in the
shadows. Skin and whites stay natural so the photos still read clinical.

Usage: python3 scripts/chartahealth-warm-photos.py <dir of original PNGs> <out dir>
(originals are Charta's persona .avif files converted to PNG), then save as
webp into public/chartahealth/personas/."""
import sys, numpy as np
from PIL import Image

def grade(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255
    # 1. cool hues (cyan through blue) lose saturation and drift toward sage
    hsv = np.asarray(im.convert('RGB').convert('HSV')).astype(np.float32)
    h = hsv[..., 0] * 360 / 255; s = hsv[..., 1] / 255
    cool = np.clip(1 - np.abs(h - 200) / 45, 0, 1) * np.clip(s * 2.2, 0, 1)
    lum = (a @ np.array([.299, .587, .114], np.float32))[..., None]
    sage = lum * np.array([1.02, 1.0, .92], np.float32)
    a = a * (1 - .45 * cool[..., None]) + sage * (.45 * cool[..., None])
    # 2. warmer white balance
    a = a * np.array([1.045, .985, .89], np.float32)
    # 3. amber in the shadows, creme in the highlights
    lum = (a @ np.array([.299, .587, .114], np.float32))[..., None]
    sh = np.clip(1 - lum * 1.6, 0, 1)
    a = a + sh * np.array([.045, .022, -.01], np.float32)
    hi = np.clip((lum - .7) / .3, 0, 1)
    a = a * (1 - .25 * hi) + np.array([.99, .96, .9], np.float32) * (.25 * hi) * a.max(-1, keepdims=True)
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))

src, dst = sys.argv[1], sys.argv[2]
for n in ['Revenue-cycle', 'Clinical-leadership', 'Compliance', 'Operations', 'Executive', 'Quality']:
    grade(Image.open(f'{src}/{n}.png')).save(f'{dst}/{n}.png')
