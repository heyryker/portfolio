// Concept behaviour for /chartahealth.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Draw the yellow underline on a testimonial's key phrase when it comes
  //    into view (scrolling down, or sliding in from the carousel).
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('hl-ready');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio > 0.6) { e.target.classList.add('is-drawn'); io.unobserve(e.target); }
      });
    }, { threshold: [0, 0.6, 1] });
    document.querySelectorAll('mark.hl').forEach(function (m) { io.observe(m); });
  }

  // 2. Solutions tabs: the isometric illustrations are inlined so they can be
  //    drawn in line by line every time their tab is shown. Every drawing
  //    starts from the same point (bottom centre of the frame) and spreads
  //    outward. Charta's Finsweet tabs script rebuilds the panes from a CMS
  //    list after load, so this works on whatever images exist when a pane
  //    becomes active rather than on the initial markup.
  var cache = {}, uid = 0;
  var SHAPES = 'line,rect,polygon,polyline,circle,path';

  function inline(img) {
    var url = img.getAttribute('src');
    var load = cache[url] || (cache[url] = fetch(url).then(function (r) { return r.text(); }));
    return load.then(function (text) {
      if (!img.parentNode) return null;
      var n = ++uid;
      // ids must stay unique once several drawings live in one document
      text = text.replace(/id="([^"]+)"/g, 'id="$1-' + n + '"').replace(/url\(#([^)]+)\)/g, 'url(#$1-' + n + ')');
      var box = document.createElement('div');
      box.className = img.className + ' illo';
      box.setAttribute('role', 'img');
      box.setAttribute('aria-label', img.getAttribute('alt') || '');
      box.innerHTML = text;
      var svg = box.querySelector('svg');
      svg.removeAttribute('width'); svg.removeAttribute('height');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      img.replaceWith(box);
      return box;
    });
  }

  function draw(box) {
    var svg = box && box.querySelector('svg');
    if (!svg || reduce || !svg.animate) return;
    var vb = svg.viewBox.baseVal, root = svg.getBoundingClientRect();
    if (!root.width) return;
    var k = root.width / vb.width;
    // shared origin: bottom centre of the canvas
    var ox = root.left + root.width / 2, oy = root.top + root.height;
    var items = [], far = 0, near = Infinity;
    svg.querySelectorAll(SHAPES).forEach(function (el) {
      if (el.closest('defs')) return;
      var r = el.getBoundingClientRect();
      var d = Math.hypot(r.left + r.width / 2 - ox, r.top + r.height / 2 - oy) / k;
      far = Math.max(far, d); near = Math.min(near, d);
      items.push([el, d]);
    });
    items.forEach(function (it) {
      var el = it[0], delay = 120 + 1700 * ((it[1] - near) / Math.max(1, far - near));
      var cs = getComputedStyle(el);
      var stroked = cs.stroke && cs.stroke !== 'none';
      var dashed = cs.strokeDasharray && cs.strokeDasharray !== 'none' && !el.hasAttribute('data-drawn');
      var fo = cs.fillOpacity, so = cs.strokeOpacity;
      if (stroked && !dashed) {
        el.setAttribute('pathLength', '1');
        el.setAttribute('stroke-dasharray', '1 1');
        el.setAttribute('data-drawn', '');
        el.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
          { duration: 1400, delay: delay, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'backwards' });
      } else if (stroked) {
        el.animate([{ strokeOpacity: 0 }, { strokeOpacity: so }], { duration: 1000, delay: delay, fill: 'backwards' });
      }
      if (cs.fill && cs.fill !== 'none') {
        el.animate([{ fillOpacity: 0 }, { fillOpacity: fo }],
          { duration: 1000, delay: delay + 600, easing: 'ease-out', fill: 'backwards' });
      }
    });
  }

  function activate(pane) {
    var box = pane.querySelector('.illo');
    if (box) { requestAnimationFrame(function () { draw(box); }); return; }
    var img = pane.querySelector('img[src*="/illustrations/"]');
    if (img) inline(img).then(function (b) { if (b && pane.classList.contains('w--tab-active')) requestAnimationFrame(function () { draw(b); }); });
  }

  var section = document.querySelector('.section_solutions-tabs');
  if (!section || !window.fetch) return;
  // inline every drawing up front (they are small) so tab switches are instant
  section.querySelectorAll('img[src*="/illustrations/"]').forEach(function (img) { inline(img); });
  new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      var el = m.target;
      if (m.type === 'attributes' && el.classList && el.classList.contains('w-tab-pane') && el.classList.contains('w--tab-active') &&
          (m.oldValue || '').indexOf('w--tab-active') < 0) activate(el);
      if (m.type === 'childList') m.addedNodes.forEach(function (nd) {
        if (nd.querySelectorAll) nd.querySelectorAll('img[src*="/illustrations/"]').forEach(function (img) { inline(img); });
      });
    });
  }).observe(section, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true, childList: true });
  // first draw when the section scrolls into view
  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) {
        seen.disconnect();
        var p = section.querySelector('.w-tab-pane.w--tab-active');
        if (p) activate(p);
      }
    }, { threshold: 0.4 });
    seen.observe(section.querySelector('.w-tabs') || section);
  }
})();
