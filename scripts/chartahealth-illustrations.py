"""Draws the five abstract isometric illustrations that replace the product
screenshots in the /chartahealth solutions tabs. Style follows Charta's own
social graphics, inverted onto a light ground: thin dark-green linework, hex and dot
textures, dashed connectors and a few neon-yellow accents.

Run: python3 scripts/chartahealth-illustrations.py
(writes public/chartahealth/illustrations/*.svg)
"""
import math
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'chartahealth', 'illustrations')
W = 960
IW, IH = 1000, 800
# Centered; concept.css fits the whole canvas beside the tab copy.
CX, SC = 500, 0.8
BG, LINE, CELL, YEL = '#f3f7f5', '#0f2d29', '#cfe0d8', '#fdff72'
C = math.cos(math.radians(30))
OX, OY = 480, 470
NS = 'vector-effect="non-scaling-stroke"'


def iso(x, y, z=0):
    return (OX + (x - y) * C, OY + (x + y) * 0.5 - z)


def pts(*ps):
    return ' '.join(f'{x:.1f},{y:.1f}' for x, y in ps)


def floor(x, y, z, body):
    """Content in local (u, v) coords on a ground plane at height z."""
    tx, ty = iso(x, y, z)
    return f'<g transform="matrix({C:.4f},0.5,{-C:.4f},0.5,{tx:.1f},{ty:.1f})">{body}</g>'


def wall_y(x, y, ztop, body):
    """Content on a vertical plane running along y (u along y, v downwards)."""
    tx, ty = iso(x, y, ztop)
    return f'<g transform="matrix({-C:.4f},0.5,0,1,{tx:.1f},{ty:.1f})">{body}</g>'


def wall_x(x, y, ztop, body):
    """Content on a vertical plane running along x."""
    tx, ty = iso(x, y, ztop)
    return f'<g transform="matrix({C:.4f},0.5,0,1,{tx:.1f},{ty:.1f})">{body}</g>'


def rect(x, y, w, h, fill='none', stroke=LINE, op=0.6, sw=1.5):
    s = f' stroke="{stroke}" stroke-opacity="{op}" stroke-width="{sw}" {NS}' if stroke else ''
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fill}"{s}/>'


def hline(x, y, w, op=.35):
    return f'<line x1="{x}" y1="{y}" x2="{x + w}" y2="{y}" stroke="{LINE}" stroke-opacity="{op}" stroke-width="1" {NS}/>'


def vline(x, y, h, op=.35):
    return f'<line x1="{x}" y1="{y}" x2="{x}" y2="{y + h}" stroke="{LINE}" stroke-opacity="{op}" stroke-width="1" {NS}/>'


def seg(a, b, op=0.5, dash=False):
    d = ' stroke-dasharray="6 6"' if dash else ''
    return (f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{LINE}" '
            f'stroke-opacity="{op}" stroke-width="1.5"{d}/>')


def hexagon(cx, cy, r, fill):
    p = [(cx + r * math.cos(math.radians(60 * i + 30)), cy + r * math.sin(math.radians(60 * i + 30))) for i in range(6)]
    return f'<polygon points="{pts(*p)}" fill="{fill}"/>'


def hexcell(i, j, fill):
    """Fill one cell of the #hex pattern (column i, row j)."""
    return hexagon(17.32 * i + (17.32 if j % 2 == 0 else 0), 20 + 30 * j - (0 if j % 2 == 0 else 0), 13, fill)


DEFS = f'''<defs>
<pattern id="hex" width="34.64" height="60" patternUnits="userSpaceOnUse">
<path d="M17.32 0 L34.64 10 L34.64 30 L17.32 40 L0 30 L0 10 Z M17.32 40 L17.32 60 M0 30 L0 0 M34.64 30 L34.64 0" fill="none" stroke="{LINE}" stroke-opacity=".4" stroke-width="1.2"/>
</pattern>
<pattern id="dots" width="8" height="8" patternUnits="userSpaceOnUse"><rect x="3" y="3" width="1.8" height="1.8" fill="{LINE}" fill-opacity=".5"/></pattern>
<pattern id="diag" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 9 L9 0" stroke="{LINE}" stroke-opacity=".28" stroke-width="1"/></pattern>
<pattern id="flat" width="96" height="48" patternUnits="userSpaceOnUse"><path d="M0 .5 H96 M.5 0 V48" stroke="{LINE}" stroke-opacity=".09" stroke-width="1"/></pattern>
</defs>'''


def svg(body, title, dx=0, dy=0):
    # Same 1000x800 canvas as the product screenshots they replace, so the
    # page's own image sizing applies unchanged; transparent background.
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {IW} {IH}" width="{IW}" height="{IH}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{DEFS}'
            f'<g transform="translate({CX},{IH / 2}) scale({SC}) translate({dx - W / 2},{dy - W / 2})">{body}</g></svg>')


def framed(w, h, inner, op=.75):
    return rect(0, 0, w, h, fill=BG, op=op) + inner + rect(0, 0, w, h, op=op)


# 1. Autonomous coding: note -> structured data -> codes, three panels in a row.
def autonomous():
    w, h = 250, 320
    xs = [-330, -60, 210]
    y0, zt = -125, 330
    b = ''
    for a, c in zip(xs, xs[1:]):
        for yy, zz in [(y0, zt), (y0 + w, zt), (y0, zt - h), (y0 + w, zt - h)]:
            b += seg(iso(a, yy, zz), iso(c, yy, zz), op=.4, dash=True)
    hexes = ''.join(hexcell(i, j, f) for i, j, f in [(3, 2, YEL), (9, 4, CELL), (5, 5, CELL), (11, 7, CELL), (7, 8, YEL), (2, 9, CELL)])
    b += wall_y(xs[0], y0, zt, framed(w, h, rect(0, 0, w, h, fill='url(#hex)', stroke=None) + hexes))
    rows = ''.join(rect(18, 20 + 24 * i, [150, 90, 200, 120][i], 11, fill=CELL, stroke=None) for i in range(4))
    rows += rect(18, 122, 214, 120, fill='url(#dots)', op=.4)
    rows += rect(62, 152, 54, 54, fill=YEL, stroke=None) + rect(54, 144, 70, 70, op=.9)
    rows += ''.join(rect(18, 258 + 20 * i, [180, 120, 150][i], 10, fill=CELL, stroke=None) for i in range(3))
    b += wall_y(xs[1], y0, zt, framed(w, h, rows))
    tbl = rect(0, 0, w, 32, fill=CELL, stroke=None)
    tbl += ''.join(hline(0, 32 * i, w) for i in range(1, 10)) + ''.join(vline(62.5 * i, 0, h) for i in range(1, 4))
    tbl += rect(125, 160, 62.5, 32, fill=YEL, stroke=None)
    b += wall_y(xs[2], y0, zt, framed(w, h, tbl))
    return svg(b, 'Abstract illustration: a clinical note becoming accurate codes', 56, 160)


def disc(z, r, body, cid):
    return floor(0, 0, z, f'<circle r="{r}" fill="{BG}" stroke="{LINE}" stroke-opacity=".7" stroke-width="1.5" {NS}/>'
                 f'<clipPath id="{cid}"><circle r="{r - 16}"/></clipPath><g clip-path="url(#{cid})">{body}</g>'
                 f'<circle r="{r - 16}" fill="none" stroke="{LINE}" stroke-opacity=".35" stroke-width="1" {NS}/>')


# 2. Revenue discovery: stacked layers of encounters, missed revenue surfacing.
def revenue():
    r = 245
    b = ''
    layers = [(-150, [(-150, 40)], 'url(#hex)'), (0, [(40, 100)], 'url(#diag)'), (150, [(-170, -60), (10, 30), (110, -150)], 'url(#hex)')]
    for k, (z, cells, pat) in enumerate(layers):
        body = rect(-r, -r, 2 * r, 2 * r, fill=pat, stroke=None)
        body += ''.join(rect(x, y, 84, 38, fill=CELL, stroke=None) for x, y in [(-70, -190), (100, 90), (-210, 120), (60, -60)])
        body += ''.join(rect(x, y, 84, 38, fill=YEL, stroke=None) for x, y in cells)
        b += disc(z, r, body, f'd{k}')
        if k < 2:
            for ang in (0, 90, 180):
                x, y = r * math.cos(math.radians(ang + 45)), r * math.sin(math.radians(ang + 45))
                b += seg(iso(x, y, z), iso(x, y, z + 150), op=.4, dash=True)
    return svg(b, 'Abstract illustration: layers of records with missed revenue highlighted', 0, 20)


# 3. Payer compliance: a stack of claims checked line by line, one flagged.
def compliance():
    w, h = 380, 300
    x0, y0 = -w / 2, -h / 2
    b = ''
    zs = (-80, 30, 140, 250)
    for k, z in enumerate(zs):
        top = k == len(zs) - 1
        body = rect(0, 0, w, h, fill=BG, op=.75)
        if not top:
            body += rect(0, 0, w, h, fill='url(#diag)', stroke=None)
        for i in range(6):
            yy = 28 + 43 * i
            flag = top and i == 2
            body += rect(24, yy, 22, 22, fill=YEL if flag else 'none', stroke=LINE, op=.8)
            body += rect(64, yy + 5, [220, 160, 250, 190, 140, 230][i], 12, fill=CELL, stroke=None)
        if top:
            body += rect(304, 28, 52, 237, fill='url(#dots)', op=.4)
        b += floor(x0, y0, z, body)
        if not top:
            for cx, cy in [(x0, y0 + h), (x0 + w, y0 + h), (x0 + w, y0)]:
                b += seg(iso(cx, cy, z), iso(cx, cy, zs[k + 1]), op=.4, dash=True)
    return svg(b, 'Abstract illustration: stacked claims checked line by line', 0, 96)


# 4. Clinical quality: a care-gap texture on the ground with a rising trend panel.
def quality():
    b = ''
    gw = 520
    ground = rect(0, 0, gw, gw, fill='url(#hex)', op=.6)
    ground += ''.join(hexcell(i, j, f) for i, j, f in [(4, 4, CELL), (10, 6, YEL), (14, 3, CELL), (7, 11, CELL), (21, 9, YEL), (16, 14, CELL), (5, 15, CELL)])
    b += floor(-260, -260, -40, ground)
    pw, ph = 440, 300
    data = [235, 205, 215, 172, 150, 160, 112, 82, 58]
    step = pw / (len(data) - 1)
    poly = ' '.join(f'{pw - i * step:.1f},{v}' for i, v in enumerate(data))
    inner = f'<polygon points="{pw},{ph} {poly} 0,{ph}" fill="url(#diag)"/>'
    inner += ''.join(hline(0, 60 * i, pw, .3) for i in range(1, 5))
    inner += f'<polyline points="{poly}" fill="none" stroke="{LINE}" stroke-width="2.5" stroke-linejoin="round" {NS}/>'
    inner += ''.join(f'<rect x="{pw - i * step - 7:.1f}" y="{v - 7}" width="14" height="14" fill="{YEL if i in (3, 8) else BG}" '
                     f'stroke="{LINE}" stroke-width="1.5" {NS}/>' for i, v in enumerate(data))
    b += seg(iso(40, 220, 40), iso(40, 220, -40), op=.4, dash=True) + seg(iso(40, -220, 40), iso(40, -220, -40), op=.4, dash=True)
    b += wall_y(40, -220, 340, framed(pw, ph, inner))
    return svg(b, 'Abstract illustration: quality measures trending up', 0, 70)


def box(x, y, w, d, h, accent=False):
    p = iso
    stroke = (f'stroke="{LINE}" stroke-opacity="{.9 if accent else .7}" '
              f'stroke-width="1.5" stroke-linejoin="round"')
    left = pts(p(x, y + d, 0), p(x + w, y + d, 0), p(x + w, y + d, h), p(x, y + d, h))
    right = pts(p(x + w, y, 0), p(x + w, y + d, 0), p(x + w, y + d, h), p(x + w, y, h))
    top = pts(p(x, y, h), p(x + w, y, h), p(x + w, y + d, h), p(x, y + d, h))
    return (f'<polygon points="{left}" fill="{BG}" {stroke}/><polygon points="{left}" fill="url(#diag)"/>'
            f'<polygon points="{right}" fill="{BG}" {stroke}/>'
            f'<polygon points="{right}" fill="{"url(#dots)" if accent else BG}"/>'
            f'<polygon points="{top}" fill="{YEL if accent else BG}" {stroke}/>')


# 5. Risk adjustment: condition columns on a grid, the under-captured one lifted.
def risk():
    b = ''
    g = 560
    ground = rect(0, 0, g, g, op=.5) + ''.join(vline(70 * i, 0, g, .28) for i in range(1, 8)) + ''.join(hline(0, 70 * i, g, .28) for i in range(1, 8))
    ground += rect(420, 70, 70, 70, fill='url(#dots)', stroke=None) + rect(70, 420, 70, 70, fill='url(#dots)', stroke=None)
    b += floor(-280, -280, -60, ground)
    bars = [(-210, -210, 120), (-70, -210, 200), (70, -210, 150), (-210, -70, 90), (-70, -70, 300, True),
            (70, -70, 180), (-210, 70, 140), (-70, 70, 100), (70, 70, 230)]
    global OY
    OY0 = OY
    OY = OY0 + 60  # boxes stand on the lowered ground
    for x, y, h, *acc in sorted(bars, key=lambda t: t[0] + t[1]):
        b += box(x + 8, y + 8, 54, 54, h, accent=bool(acc))
    b += seg(iso(-35, -35, 300), iso(-35, -35, 420), op=.55, dash=True)
    OY = OY0
    return svg(b, 'Abstract illustration: risk scores with an under-captured condition lifted', 0, 30)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, fn in [('autonomous-coding', autonomous), ('revenue-discovery', revenue), ('payer-compliance', compliance),
                     ('clinical-quality', quality), ('risk-adjustment', risk)]:
        with open(os.path.join(OUT, name + '.svg'), 'w') as f:
            f.write(fn())
        print(name)
