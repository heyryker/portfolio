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
# Meta: private concept.
s = re.sub(r'<title>.*?</title>', '<title>Charta Health homepage concept</title>', s, flags=re.S)
s = re.sub(r'<meta[^>]+(name="description"|property="og:|name="twitter:)[^>]*>', '', s)
head_add = '''<meta name="robots" content="noindex, nofollow, noarchive">
<link href="/chartahealth/concept.css" rel="stylesheet" type="text/css">'''
s = s.replace('</head>', head_add + '\n</head>', 1)
note = '''<a class="concept-note" href="https://heyryker.com">Unofficial concept by Ryker Marble &middot; not affiliated with Charta Health</a>'''
s = re.sub(r'</body>', note + '\n</body>', s, count=1)
open(out, 'w', encoding='utf8').write(s)
print(len(s))
