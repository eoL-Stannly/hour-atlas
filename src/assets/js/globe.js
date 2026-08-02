/* ------------------------------------------------------------------
   A small rotating globe, drawn on a <canvas> with plain orthographic
   projection maths. No WebGL, no Three.js, no CDN. The landmass data is
   a decimated Natural Earth 110m dataset embedded on this page only.

   The country marks are real <a> elements, not canvas hit-testing, so
   they stay keyboard-reachable and screen-reader visible; the script
   only ever moves them, never creates the links themselves.
------------------------------------------------------------------- */

(function () {
  "use strict";

  var container = document.getElementById("globe");
  if (!container) return;

  var canvas = container.querySelector(".globe__canvas");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var marks = Array.prototype.slice
    .call(container.querySelectorAll(".globe__mark"))
    .map(function (a) {
      return {
        el: a,
        lat: parseFloat(a.getAttribute("data-lat")),
        lng: parseFloat(a.getAttribute("data-lng")),
      };
    });

  var rings = window.WORLD_RINGS || [];

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var size = 0, R = 0, cx = 0, cy = 0;
  var lambda = -0.4;                     // current rotation, radians
  var phi = 20 * (Math.PI / 180);        // tilt, radians
  var autoSpeed = 0.0022;
  var dragging = false, lastX = 0, lastY = 0;
  var paused = reduced;
  var idleTimer = null;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    size = rect.width;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = size * 0.46;
    cx = size / 2;
    cy = size / 2;
  }

  function project(lonDeg, latDeg) {
    var lam = (lonDeg * Math.PI) / 180 + lambda;
    var ph = (latDeg * Math.PI) / 180;
    var cosc = Math.sin(phi) * Math.sin(ph) + Math.cos(phi) * Math.cos(ph) * Math.cos(lam);
    var x = R * Math.cos(ph) * Math.sin(lam);
    var y = R * (Math.cos(phi) * Math.sin(ph) - Math.sin(phi) * Math.cos(ph) * Math.cos(lam));
    return { x: cx + x, y: cy - y, visible: cosc > 0.02 };
  }

  function draw() {
    ctx.clearRect(0, 0, size, size);

    var base = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.36, R * 0.1, cx, cy, R);
    base.addColorStop(0, "#f5f8ee");
    base.addColorStop(1, "#dbe4cb");
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = base;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = "#2f6b4f";
    ctx.strokeStyle = "rgba(18,41,29,0.4)";
    ctx.lineWidth = 0.6;

    for (var i = 0; i < rings.length; i++) {
      var ring = rings[i];
      var run = [];
      for (var j = 0; j < ring.length; j++) {
        var p = project(ring[j][0], ring[j][1]);
        if (p.visible) {
          run.push(p);
        } else if (run.length) {
          fillRun(run);
          run = [];
        }
      }
      fillRun(run);
    }

    function fillRun(run) {
      if (run.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(run[0].x, run[0].y);
      for (var k = 1; k < run.length; k++) ctx.lineTo(run[k].x, run[k].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    var rim = ctx.createRadialGradient(cx, cy, R * 0.74, cx, cy, R);
    rim.addColorStop(0, "rgba(18,41,29,0)");
    rim.addColorStop(1, "rgba(18,41,29,0.3)");
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = rim;
    ctx.fill();

    marks.forEach(function (m) {
      var mp = project(m.lng, m.lat);
      if (mp.visible) {
        m.el.style.display = "";
        m.el.style.left = (mp.x / size) * 100 + "%";
        m.el.style.top = (mp.y / size) * 100 + "%";
      } else {
        m.el.style.display = "none";
      }
    });
  }

  function tick() {
    if (!paused) lambda += autoSpeed;
    draw();
    requestAnimationFrame(tick);
  }

  function scheduleResume() {
    clearTimeout(idleTimer);
    if (reduced) return;
    idleTimer = setTimeout(function () { paused = false; }, 2600);
  }

  function down(x, y) {
    dragging = true;
    paused = true;
    lastX = x;
    lastY = y;
    canvas.classList.add("is-grabbing");
  }
  function move(x, y) {
    if (!dragging) return;
    lambda += (x - lastX) * 0.006;
    phi = Math.max(-1.2, Math.min(1.2, phi - (y - lastY) * 0.004));
    lastX = x;
    lastY = y;
  }
  function up() {
    dragging = false;
    canvas.classList.remove("is-grabbing");
    scheduleResume();
  }

  canvas.addEventListener("mousedown", function (e) { down(e.clientX, e.clientY); });
  window.addEventListener("mousemove", function (e) { move(e.clientX, e.clientY); });
  window.addEventListener("mouseup", up);
  canvas.addEventListener("touchstart", function (e) {
    var t = e.touches[0]; down(t.clientX, t.clientY);
  }, { passive: true });
  canvas.addEventListener("touchmove", function (e) {
    var t = e.touches[0]; move(t.clientX, t.clientY);
  }, { passive: true });
  canvas.addEventListener("touchend", up);

  window.addEventListener("resize", resize);
  resize();

  if (reduced) {
    draw();
  } else {
    requestAnimationFrame(tick);
  }
})();
