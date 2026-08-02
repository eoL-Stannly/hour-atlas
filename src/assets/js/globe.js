/* ------------------------------------------------------------------
   Dot-matrix globe.

   Land is drawn as a scatter of points rather than filled polygons.
   That is a deliberate choice, not a stylistic accident: an orthographic
   projection has to clip every shape at the horizon, and closing a
   half-clipped polygon draws a chord straight across the sphere. Points
   have no edges to close, so the horizon handles itself.

   Country marks stay as real <a> elements that this script only
   repositions, so they remain keyboard-reachable and readable to a
   screen reader. No WebGL, no library, no third-party requests.
------------------------------------------------------------------- */

(function () {
  "use strict";

  var container = document.getElementById("globe");
  if (!container) return;

  var canvas = container.querySelector(".globe__canvas");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var dots = window.WORLD_DOTS || [];
  if (!dots.length) return;

  var marks = Array.prototype.slice
    .call(container.querySelectorAll(".globe__mark"))
    .map(function (a) {
      return {
        el: a,
        lat: parseFloat(a.getAttribute("data-lat")),
        lng: parseFloat(a.getAttribute("data-lng")),
      };
    });

  // Precompute the trig that never changes as the globe turns. The data
  // arrives flat as [lon, lat, lon, lat, ...] to save transfer bytes.
  var land = [];
  for (var di = 0; di < dots.length; di += 2) {
    var lonR = (dots[di] * Math.PI) / 180;
    var latR = (dots[di + 1] * Math.PI) / 180;
    land.push({ lon: lonR, sinLat: Math.sin(latR), cosLat: Math.cos(latR) });
  }

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var size = 0, R = 0, cx = 0, cy = 0;
  var lambda = -0.4;
  var phi = 18 * (Math.PI / 180);
  var autoSpeed = 0.0016;
  var dragging = false, lastX = 0, lastY = 0;
  var paused = reduced;
  var idleTimer = null;

  var BUCKETS = 5;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    size = rect.width;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = size * 0.45;
    cx = size / 2;
    cy = size / 2;
  }

  function pointOrNull(lonDeg, latDeg, sinPhi, cosPhi) {
    var lam = (lonDeg * Math.PI) / 180 + lambda;
    var ph = (latDeg * Math.PI) / 180;
    var sinLat = Math.sin(ph), cosLat = Math.cos(ph);
    var cosc = sinPhi * sinLat + cosPhi * cosLat * Math.cos(lam);
    if (cosc <= 0.01) return null;
    var x = R * cosLat * Math.sin(lam);
    var y = R * (cosPhi * sinLat - sinPhi * cosLat * Math.cos(lam));
    return [cx + x, cy - y];
  }

  function drawGraticule(sinPhi, cosPhi) {
    ctx.strokeStyle = "rgba(110, 231, 168, 0.16)";
    ctx.lineWidth = 1;

    function stroke(points) {
      var started = false;
      ctx.beginPath();
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        if (p === null) { started = false; continue; }
        if (!started) { ctx.moveTo(p[0], p[1]); started = true; }
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.stroke();
    }

    var lon, lat, pts;
    for (lon = -180; lon < 180; lon += 30) {
      pts = [];
      for (lat = -90; lat <= 90; lat += 3) pts.push(pointOrNull(lon, lat, sinPhi, cosPhi));
      stroke(pts);
    }
    for (lat = -60; lat <= 60; lat += 30) {
      pts = [];
      for (lon = -180; lon <= 180; lon += 3) pts.push(pointOrNull(lon, lat, sinPhi, cosPhi));
      stroke(pts);
    }
  }

  function draw() {
    if (!size) return;
    ctx.clearRect(0, 0, size, size);

    var sinPhi = Math.sin(phi), cosPhi = Math.cos(phi);

    var body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R);
    body.addColorStop(0, "#123425");
    body.addColorStop(1, "#08150f");
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    drawGraticule(sinPhi, cosPhi);

    var i, b;
    var buckets = [];
    for (b = 0; b < BUCKETS; b++) buckets.push([]);

    for (i = 0; i < land.length; i++) {
      var d = land[i];
      var lam = d.lon + lambda;
      var cosLam = Math.cos(lam);
      var cosc = sinPhi * d.sinLat + cosPhi * d.cosLat * cosLam;
      if (cosc <= 0.02) continue;
      var x = cx + R * d.cosLat * Math.sin(lam);
      var y = cy - R * (cosPhi * d.sinLat - sinPhi * d.cosLat * cosLam);
      var idx = Math.min(BUCKETS - 1, Math.floor(cosc * BUCKETS));
      buckets[idx].push(x, y);
    }

    for (b = 0; b < BUCKETS; b++) {
      var list = buckets[b];
      if (!list.length) continue;
      var t = (b + 0.5) / BUCKETS;
      var r = 0.9 + 1.5 * t;
      ctx.fillStyle = "rgba(110, 231, 168, " + (0.3 + 0.7 * t).toFixed(3) + ")";
      ctx.beginPath();
      for (i = 0; i < list.length; i += 2) {
        ctx.moveTo(list[i] + r, list[i + 1]);
        ctx.arc(list[i], list[i + 1], r, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    ctx.restore();

    var rim = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
    rim.addColorStop(0, "rgba(5, 12, 8, 0)");
    rim.addColorStop(1, "rgba(5, 12, 8, 0.55)");
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = rim;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.004, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(110, 231, 168, 0.5)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    positionMarks(sinPhi, cosPhi);
  }

  function positionMarks(sinPhi, cosPhi) {
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      var lam = (m.lng * Math.PI) / 180 + lambda;
      var ph = (m.lat * Math.PI) / 180;
      var sinLat = Math.sin(ph), cosLat = Math.cos(ph);
      var cosc = sinPhi * sinLat + cosPhi * cosLat * Math.cos(lam);

      if (cosc <= 0.06) {
        // Explicitly hidden, and explicitly shown again below. Setting
        // display to "" here would fall back to the stylesheet, which
        // hides it, and the mark would never reappear. That was the bug.
        m.el.style.display = "none";
        continue;
      }
      var x = cx + R * cosLat * Math.sin(lam);
      var y = cy - R * (cosPhi * sinLat - sinPhi * cosLat * Math.cos(lam));
      m.el.style.display = "block";
      m.el.style.left = (x / size) * 100 + "%";
      m.el.style.top = (y / size) * 100 + "%";
      m.el.style.opacity = Math.min(1, 0.4 + cosc * 1.4).toFixed(2);
      m.el.style.zIndex = String(100 + Math.round(cosc * 100));
    }
  }

  function tick() {
    if (!paused) lambda += autoSpeed;
    draw();
    requestAnimationFrame(tick);
  }

  function scheduleResume() {
    clearTimeout(idleTimer);
    if (reduced) return;
    idleTimer = setTimeout(function () { paused = false; }, 3000);
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
    phi = Math.max(-1.1, Math.min(1.1, phi - (y - lastY) * 0.004));
    lastX = x;
    lastY = y;
    if (reduced) draw();
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove("is-grabbing");
    scheduleResume();
  }

  canvas.addEventListener("mousedown", function (e) {
    e.preventDefault();
    down(e.clientX, e.clientY);
  });
  window.addEventListener("mousemove", function (e) { move(e.clientX, e.clientY); });
  window.addEventListener("mouseup", up);

  canvas.addEventListener("touchstart", function (e) {
    var t = e.touches[0]; down(t.clientX, t.clientY);
  }, { passive: true });
  canvas.addEventListener("touchmove", function (e) {
    var t = e.touches[0]; move(t.clientX, t.clientY);
  }, { passive: true });
  canvas.addEventListener("touchend", up);
  canvas.addEventListener("touchcancel", up);

  // Hold still while a mark is hovered or focused, so it can be clicked.
  container.addEventListener("mouseover", function (e) {
    if (e.target && e.target.closest && e.target.closest(".globe__mark")) paused = true;
  });
  container.addEventListener("mouseout", function (e) {
    if (e.target && e.target.closest && e.target.closest(".globe__mark")) scheduleResume();
  });
  container.addEventListener("focusin", function () { paused = true; });
  container.addEventListener("focusout", function () { scheduleResume(); });

  window.addEventListener("resize", function () { resize(); draw(); });

  resize();
  container.classList.add("is-ready");

  if (reduced) draw();
  else requestAnimationFrame(tick);
})();
