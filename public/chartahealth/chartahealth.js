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

// 3. Resources + webinars: yellow hand-drawn marks, one at a time, like a
//    doctor scribbling notes on a chart. Each mark is tied to a card or button:
//    an arrow pointing at it, a little celebration burst coming off a corner or
//    edge, or a zigzag across its border. A mark draws in, holds a few seconds,
//    fades, and then the next one starts.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hosts = [].slice.call(document.querySelectorAll('.section_featured-resources'));
  if (reduce || !hosts.length || !document.body.animate) return;

  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#fdff72';
  hosts.forEach(function (host) {
    var layer = document.createElement('div');
    layer.className = 'doodles';
    layer.setAttribute('aria-hidden', 'true');
    host.appendChild(layer);
    host._doodles = layer;
  });

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function j(n) { return n + rnd(-2, 2); } // hand wobble
  function pt(x, y) { return j(x).toFixed(1) + ' ' + j(y).toFixed(1); }
  function rad(d) { return d * Math.PI / 180; }

  // Shapes in their own units. `tip` is where an arrow points; `base` is where
  // a burst starts (its rays point up, -90deg).
  var SHAPES = {
    arrow: function () {
      var bend = rnd(-20, 20);
      return { w: 100, h: 100, tip: [88, 14], paths: [
        'M' + pt(8, 86) + ' C' + pt(30 + bend, 60) + ' ' + pt(50 - bend, 34) + ' ' + pt(88, 14),
        'M' + pt(68, 12) + ' L' + pt(89, 13) + ' L' + pt(85, 34)
      ] };
    },
    loopArrow: function () {
      return { w: 120, h: 90, tip: [112, 18], paths: [
        'M' + pt(6, 74) + ' C' + pt(30, 70) + ' ' + pt(50, 20) + ' ' + pt(38, 22) + ' S' + pt(30, 58) + ' ' + pt(58, 52) + ' S' + pt(96, 28) + ' ' + pt(112, 18),
        'M' + pt(93, 12) + ' L' + pt(113, 17) + ' L' + pt(105, 36)
      ] };
    },
    burst: function () {
      var p = [], n = Math.round(rnd(3, 5)), spread = n * 26;
      for (var i = 0; i < n; i++) {
        var a = rad(-90 - spread / 2 + i * (spread / (n - 1))), r0 = 12, r1 = rnd(34, 46);
        p.push('M' + pt(50 + Math.cos(a) * r0, 54 + Math.sin(a) * r0) + ' L' + pt(50 + Math.cos(a) * r1, 54 + Math.sin(a) * r1));
      }
      return { w: 100, h: 60, base: [50, 54], paths: p };
    },
    sparkle: function () {
      return { w: 60, h: 60, center: true, paths: [
        'M' + pt(30, 4) + ' L' + pt(30, 22), 'M' + pt(30, 38) + ' L' + pt(30, 56),
        'M' + pt(4, 30) + ' L' + pt(22, 30), 'M' + pt(38, 30) + ' L' + pt(56, 30)
      ] };
    },
    zigzag: function () {
      var d = 'M' + pt(4, 14), n = Math.round(rnd(6, 9));
      for (var i = 1; i <= n; i++) d += ' L' + pt(4 + i * (132 / n), i % 2 ? 2 : 26);
      return { w: 140, h: 28, paths: [d] };
    }
  };

  function rel(r, box, m) { return { l: r.left - box.left - m, t: r.top - box.top - m, r: r.right - box.left + m, b: r.bottom - box.top + m }; }
  function hits(a, list) {
    for (var i = 0; i < list.length; i++) { var o = list[i]; if (a.l < o.r && a.r > o.l && a.t < o.b && a.b > o.t) return true; }
    return false;
  }
  // copy and buttons stay clear; headings and paragraphs by their words, not their full-width boxes
  function copy(host, box) {
    var list = [];
    host.querySelectorAll('h2, h3, p, .button, .tag').forEach(function (el) {
      var rects = [el.getBoundingClientRect()];
      if (/^(H2|H3|P)$/.test(el.tagName)) { var rg = document.createRange(); rg.selectNodeContents(el); rects = [].slice.call(rg.getClientRects()); }
      rects.forEach(function (r) { if (r.width && r.height) list.push(rel(r, box, 12)); });
    });
    return list;
  }

  // Work out a mark: which shape, where its centre goes, its size and rotation.
  function plan(host) {
    var box = host.getBoundingClientRect();
    var view = { l: 4, r: box.width - 4, t: Math.max(4, -box.top + 72), b: Math.min(box.height - 4, window.innerHeight - box.top - 4) };
    var inView = function (r) { return r.t >= view.t && r.b <= view.b && r.l >= view.l && r.r <= view.r; };
    var cards = [].slice.call(host.querySelectorAll('.resources-index_item')).map(function (el) { return rel(el.getBoundingClientRect(), box, 0); })
      .filter(function (r) { return r.b > view.t + 40 && r.t < view.b - 40; });
    var buttons = [].slice.call(host.querySelectorAll('.button:not(.is-link)')).map(function (el) { return rel(el.getBoundingClientRect(), box, 0); })
      .filter(function (r) { return r.t > view.t && r.b < view.b; });
    if (!cards.length && !buttons.length) return null;
    var avoid = copy(host, box);
    var cardsPad = cards.map(function (c) { return { l: c.l - 6, t: c.t - 6, r: c.r + 6, b: c.b + 6 }; });
    var kind = pick(['arrow', 'arrow', 'arrow', 'celebrate', 'celebrate', 'celebrate', 'zigzag']);

    for (var tries = 0; tries < 50; tries++) {
      var s, scale, rot, cx, cy, over = false;
      if (kind === 'arrow') {
        var target = pick(buttons.length && Math.random() < .4 ? buttons : (cards.length ? cards : buttons));
        s = SHAPES[pick(['arrow', 'arrow', 'loopArrow'])]();
        scale = rnd(1, 1.6);
        // aim at a point on one side of the target, coming in from outside
        var side = pick(['top', 'left', 'right', 'bottom']), tx, ty, n;
        if (side === 'top') { tx = rnd(target.l + 20, target.r - 20); ty = target.t; n = -90; }
        if (side === 'bottom') { tx = rnd(target.l + 20, target.r - 20); ty = target.b; n = 90; }
        if (side === 'left') { tx = target.l; ty = rnd(target.t + 10, Math.min(target.b - 10, target.t + 120)); n = 180; }
        if (side === 'right') { tx = target.r; ty = rnd(target.t + 10, Math.min(target.b - 10, target.t + 120)); n = 0; }
        var theta = n + 180 + rnd(-40, 40); // direction of travel, into the target
        var ox = (s.tip[0] - s.w / 2) * scale, oy = (s.tip[1] - s.h / 2) * scale;
        rot = theta - Math.atan2(oy, ox) * 180 / Math.PI;
        var L = Math.hypot(ox, oy) + 10;
        cx = tx - L * Math.cos(rad(theta)); cy = ty - L * Math.sin(rad(theta));
      } else if (kind === 'celebrate') {
        var card = pick(cards.length ? cards : buttons);
        // corners and edges, with the direction the marks fly off in
        var spots = [
          [card.l, card.t, -135], [card.r, card.t, -45], [card.l, card.b, 135], [card.r, card.b, 45],
          [(card.l + card.r) / 2 + rnd(-60, 60), card.t, -90], [card.r, card.t + rnd(30, 140), 0], [card.l, card.t + rnd(30, 140), 180]
        ];
        var sp = pick(spots), phi = sp[2] + rnd(-12, 12);
        s = SHAPES[Math.random() < .7 ? 'burst' : 'sparkle']();
        scale = rnd(.95, 1.45);
        if (s.base) {
          rot = phi + 90;
          var bx = (s.base[0] - s.w / 2) * scale, by = (s.base[1] - s.h / 2) * scale;
          var cr = Math.cos(rad(rot)), sr = Math.sin(rad(rot));
          var ax = sp[0] + 8 * Math.cos(rad(phi)), ay = sp[1] + 8 * Math.sin(rad(phi));
          cx = ax - (bx * cr - by * sr); cy = ay - (bx * sr + by * cr);
        } else {
          rot = rnd(-15, 15);
          var dist = s.w / 2 * scale + 10;
          cx = sp[0] + dist * Math.cos(rad(phi)); cy = sp[1] + dist * Math.sin(rad(phi));
        }
      } else {
        var c = pick(cards.length ? cards : buttons);
        s = SHAPES.zigzag();
        var horiz = Math.random() < .7;
        var len = Math.min(220, (horiz ? c.r - c.l : c.b - c.t) * rnd(.3, .55));
        scale = len / s.w; over = true;
        if (horiz) { cx = rnd(c.l + len / 2 + 10, c.r - len / 2 - 10); cy = Math.random() < .5 ? c.t : c.b; rot = rnd(-4, 4); }
        else { cy = rnd(c.t + len / 2 + 10, c.b - len / 2 - 10); cx = Math.random() < .5 ? c.l : c.r; rot = 90 + rnd(-4, 4); }
      }
      var w = s.w * scale, h = s.h * scale, half = Math.max(w, h) / 2;
      var bb = { l: cx - half, t: cy - half, r: cx + half, b: cy + half };
      var tight = { l: cx - half * .75, t: cy - half * .75, r: cx + half * .75, b: cy + half * .75 };
      if (!inView(bb) || hits(tight, avoid)) continue;
      if (kind !== 'zigzag' && hits(tight, cardsPad)) continue;
      return { host: host, s: s, w: w, h: h, x: cx - w / 2, y: cy - h / 2, rot: rot, scale: scale, over: over };
    }
    return null;
  }

  function draw(p, done) {
    var s = p.s, svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + s.w + ' ' + s.h);
    svg.setAttribute('width', p.w.toFixed(0));
    svg.setAttribute('height', p.h.toFixed(0));
    svg.style.left = p.x.toFixed(0) + 'px';
    svg.style.top = p.y.toFixed(0) + 'px';
    svg.style.transform = 'rotate(' + p.rot.toFixed(1) + 'deg)';
    if (p.over) svg.classList.add('is-over');
    var stroke = rnd(5.5, 7.5) * Math.min(1.2, Math.max(.9, p.scale));
    var speed = rnd(650, 1100) * Math.max(.8, Math.min(1.4, p.scale)); // a quick, sure hand
    var many = s.paths.length > 2, at = 0;
    s.paths.forEach(function (d, i) {
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', INK);
      path.setAttribute('stroke-width', stroke.toFixed(1));
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      path.setAttribute('pathLength', '1');
      path.setAttribute('stroke-dasharray', '1 1');
      svg.appendChild(path);
      var dur = many ? speed * .32 : (i === 0 ? speed : speed * .35);
      path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
        { duration: dur, delay: at, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both' });
      at += many ? dur * .7 : dur + 60;
    });
    p.host._doodles.appendChild(svg);
    var fade = svg.animate([{ opacity: 1 }, { opacity: 0 }],
      { duration: 700, delay: at + rnd(2500, 3500), easing: 'ease-in', fill: 'forwards' });
    fade.onfinish = function () { svg.remove(); done(); };
  }

  // One mark at a time across both sections.
  var visible = new Set(), busy = false, timer = null;
  function next() {
    timer = null;
    if (busy || document.hidden || !visible.size) return;
    var list = Array.from(visible), p = null;
    for (var i = 0; i < 4 && !p; i++) p = plan(pick(list));
    if (!p) { timer = setTimeout(next, 600); return; }
    busy = true;
    draw(p, function () { busy = false; timer = setTimeout(next, rnd(350, 900)); });
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
    if (!busy && !timer) timer = setTimeout(next, 500);
  }, { threshold: 0.15 });
  hosts.forEach(function (h) { io.observe(h); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !busy && !timer) next(); });
})();
