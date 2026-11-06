# Rebuilds public/chartahealth/index.html from a saved copy of chartahealth.com:
#   curl -sSL -o /tmp/charta.html https://www.chartahealth.com/
#   python3 scripts/chartahealth-snapshot.py /tmp/charta.html public/chartahealth/index.html
# Ryker's design changes live in public/chartahealth/concept.css.
import re, sys
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf8').read()

DROP_SCRIPT = ['intellimize', 'gtm.start', 'e.vector', 'cookie-consent', 'UET', 'reb2b', 'ld+json']
def script(m):
    whole = m.group(0)
    return '' if any(k in whole for k in DROP_SCRIPT) else whole
s = re.sub(r'<script\b[^>]*>.*?</script>', script, s, flags=re.S)
s = re.sub(r'<noscript>.*?</noscript>', '', s, flags=re.S)
s = re.sub(r'<link[^>]+(intellimize|rel="canonical")[^>]*>', '', s)
# Strip Subresource Integrity off nothing; keep as is (files are unmodified).
# Links stay inside the concept.
s = re.sub(r'href="(/[^"]*|https://(www\.)?chartahealth\.com[^"]*|https://accounts\.chartahealth\.com[^"]*)"', 'href="#"', s)
# Self-host the open-source libraries (and drop their SRI, which pinned the CDN copy).
def swap(pattern, local):
    global s
    s, n = re.subn(r'<script([^>]*?)src="' + pattern + r'"[^>]*>', lambda m: '<script' + re.sub(r'\s(integrity|crossorigin)="[^"]*"', '', m.group(1)) + 'src="' + local + '">', s)
    assert n == 1, pattern
swap(r'https://d3e54v103j8qbb\.cloudfront\.net/js/jquery-3\.5\.1[^"]*', '/chartahealth/vendor/jquery-3.5.1.min.js')
swap(r'https://cdn\.jsdelivr\.net/npm/swiper@8/swiper-bundle\.min\.js', '/chartahealth/vendor/swiper-8.4.7-bundle.min.js')
swap(r'https://cdn\.jsdelivr\.net/npm/@finsweet/attributes-cmstabs@1/cmstabs\.js', '/chartahealth/vendor/finsweet-cmstabs-1.7.0.js')
# "How Charta works": the three steps in one row, then a ticker of the EHR
# logos from their vertical Lottie scroll (extracted to public/chartahealth/logos,
# recolored black). Replaces the sticky timeline and its step images.
LOGOS = ['wellsky', 'kipu', 'kantime', 'qualifacts-credible', 'netsmart', 'epic', 'healthie', 'cubhub',
         'homecare-homebase', 'chartpath', 'qualifacts-insync', 'athenahealth', 'eclinicalworks', 'altera',
         'elation', 'simplepractice', 'kareo', 'azalea-health', 'greenway-health', 'drchrono', 'charmhealth',
         'prognocis', 'medhost', 'theranest', 'heidi', 'praxis', 'pediatric-care-online', 'cerner']
NAMES = {'qualifacts-credible': 'Qualifacts Credible', 'qualifacts-insync': 'Qualifacts InSync', 'homecare-homebase': 'Homecare Homebase',
         'eclinicalworks': 'eClinicalWorks', 'athenahealth': 'athenahealth', 'drchrono': 'DrChrono', 'charmhealth': 'CharmHealth',
         'prognocis': 'prognoCIS', 'medhost': 'MEDHOST', 'theranest': 'TheraNest', 'simplepractice': 'SimplePractice',
         'pediatric-care-online': 'Pediatric Care Online', 'azalea-health': 'Azalea Health', 'greenway-health': 'Greenway Health',
         'kantime': 'KanTime', 'wellsky': 'WellSky', 'chartpath': 'ChartPath'}
WIDTHS = {}
import os
logo_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'chartahealth', 'logos')
try:
    from PIL import Image
    for n in LOGOS:
        w, h = Image.open(os.path.join(logo_dir, n + '.webp')).size
        # Optically even: give every logo about the same area, within limits.
        ht = max(22, min(44, (4800 * h / w) ** 0.5))
        WIDTHS[n] = (round(w * ht / h), round(ht))
except Exception:
    pass

def block(html, start_marker):
    st = html.index(start_marker)
    depth = 0
    for m in re.finditer(r'<(/?)div\b[^>]*>', html[st:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return st, st + m.end()
    raise ValueError(start_marker)

st, en = block(s, '<div class="timeline_content">')
old = s[st:en]
steps = re.findall(r'<h3[^>]*>(.*?)</h3>.*?<p[^>]*>(.*?)</p>', old, flags=re.S)
assert len(steps) == 3, len(steps)
def step(h, p):
    # Number pulled out big and yellow; only the first paragraph is kept.
    num, title = re.match(r'\s*(\d+)\.\s*(.*)', h, flags=re.S).groups()
    # Headers on two lines.
    breaks = {'Automated chart pull': 'Automated<br/>chart pull',
              'Automated pre-billing chart audits': 'Automated pre-billing<br/>chart audits',
              'Detailed, real-time reporting': 'Detailed,<br/>real-time reporting'}
    title = breaks.get(title.strip(), title)
    first = re.split(r'<br\s*/?>\s*<br\s*/?>', p)[0]
    return (f'<div class="hiw-step"><div class="hiw-step_num" aria-hidden="true">{num}</div>'
            f'<div class="margin-bottom margin-small"><h3 class="heading-style-h3">'
            f'<span class="sr-only">{num}. </span>{title}</h3></div><p class="text-size-regular">{first}</p></div>')
cols = ''.join(step(h, p) for h, p in steps)
def imgs(hidden):
    out = ''
    for n in LOGOS:
        alt = '' if hidden else NAMES.get(n, n.capitalize())
        w, ht = WIDTHS.get(n, (120, 32))
        out += f'<img src="/chartahealth/logos/{n}.webp" alt="{alt}" width="{w}" height="{ht}" style="--h:{ht}" loading="lazy">'
    return out
ticker = (f'<div class="hiw-ticker" role="region" aria-label="EHRs Charta connects to"><div class="hiw-ticker_track">'
          f'<div class="hiw-ticker_set">{imgs(False)}</div><div class="hiw-ticker_set" aria-hidden="true">{imgs(True)}</div></div></div>')
s = s[:st] + f'<div class="hiw-steps">{cols}</div>' + ticker + s[en:]

# Solutions tabs: abstract isometric illustrations instead of product
# screenshots (drawn by scripts/chartahealth-illustrations.py).
ILLOS = {'Autonomous coding': ('autonomous-coding', 'a clinical note becoming accurate codes'),
         'Revenue discovery': ('revenue-discovery', 'layers of records with missed revenue highlighted'),
         'Payer compliance': ('payer-compliance', 'stacked claims checked line by line'),
         'Clinical quality': ('clinical-quality', 'quality measures trending up'),
         'Risk adjustment': ('risk-adjustment', 'risk scores with an under-captured condition lifted')}
def illo(m):
    tab = re.findall(r'data-w-tab="([^"]*)"', s[:m.start()])
    name = tab[-1] if tab else None
    if name not in ILLOS or name in done:
        return m.group(0)
    done.add(name)
    f, alt = ILLOS[name]
    return (f'<img src="/chartahealth/illustrations/{f}.svg" loading="lazy" width="960" height="960" '
            f'alt="Abstract illustration: {alt}" class="solutions-tabs_tab-image"/>')
done = set()
s = re.sub(r'<img[^>]*class="solutions-tabs_tab-image[^"]*"[^>]*>', illo, s)
assert done == set(ILLOS), done

# Hand-drawn yellow highlights on the key phrase of each testimonial.
for phrase in ['changed the entire work capabilities',
               'audit 100% of claims prepayment',
               'increased our internal pre-bill review coverage by 90%']:
    assert phrase in s, phrase
    s = s.replace(phrase, f'<mark class="hl">{phrase}</mark>')

# Meta: private concept.
s = re.sub(r'<title>.*?</title>', '<title>Charta Health homepage concept</title>', s, flags=re.S)
s = re.sub(r'<meta[^>]+(name="description"|property="og:|name="twitter:)[^>]*>', '', s)
head_add = '''<meta name="robots" content="noindex, nofollow, noarchive">
<link href="/chartahealth/concept.css" rel="stylesheet" type="text/css">'''
s = s.replace('</head>', head_add + '\n</head>', 1)
note = '''<a class="concept-note" href="https://heyryker.com">Unofficial concept by Ryker Marble &middot; not affiliated with Charta Health</a>'''
s = re.sub(r'</body>', note + '\n<script src="/chartahealth/chartahealth.js" defer></script>\n</body>', s, count=1)
open(out, 'w', encoding='utf8').write(s)
print(len(s))
