// Concept: draw the yellow underline on a testimonial's key phrase when it
// comes into view (scrolling down, or sliding in from the carousel).
(function () {
  if (!('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('hl-ready');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && e.intersectionRatio > 0.6) { e.target.classList.add('is-drawn'); io.unobserve(e.target); }
    });
  }, { threshold: [0, 0.6, 1] });
  document.querySelectorAll('mark.hl').forEach(function (m) { io.observe(m); });
})();
