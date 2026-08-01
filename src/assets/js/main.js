/* ------------------------------------------------------------------
   Hour Atlas
   The signature: the page background is a sky that keeps time. As you
   scroll, the gradient, the sun's position and the masthead clock are
   interpolated between the six destinations, running 00:14 to 23:52.
------------------------------------------------------------------- */

(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  var places = window.ATLAS || [];

  if (reduced) document.body.classList.add("reduced");

  /* ------------------------------------------------------ colour utils */

  function toRgb(hex) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function mix(a, b, t) {
    return (
      "rgb(" +
      Math.round(a[0] + (b[0] - a[0]) * t) + "," +
      Math.round(a[1] + (b[1] - a[1]) * t) + "," +
      Math.round(a[2] + (b[2] - a[2]) * t) + ")"
    );
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function clockText(mins) {
    var m = Math.round(clamp(mins, 0, 1439));
    var h = Math.floor(m / 60);
    var r = m % 60;
    return (h < 10 ? "0" : "") + h + ":" + (r < 10 ? "0" : "") + r;
  }

  /* -------------------------------------------------------- sky engine */

  var clockEl = document.querySelector("[data-clock]");
  var clockPlaceEl = document.querySelector("[data-clock-place]");

  var DAWN = { top: "#070a14", mid: "#131b33", base: "#2b2e52", ink: "#05070f", sun: "#8fa3d6", sunY: -0.14, minutes: 0, name: "Before light" };
  var NIGHT = { top: "#04060d", mid: "#0a0f20", base: "#161b33", ink: "#04060c", sun: "#7d8bb8", sunY: -0.18, minutes: 1432, name: "After dark" };

  function frameFrom(d) {
    return {
      top: d.sky.top,
      mid: d.sky.mid,
      base: d.sky.base,
      ink: d.ink,
      sun: d.sun.color,
      sunY: d.sun.y,
      minutes: d.minutes,
      name: d.name,
    };
  }

  function paint(a, b, t) {
    root.style.setProperty("--sky-top", mix(toRgb(a.top), toRgb(b.top), t));
    root.style.setProperty("--sky-mid", mix(toRgb(a.mid), toRgb(b.mid), t));
    root.style.setProperty("--sky-base", mix(toRgb(a.base), toRgb(b.base), t));
    root.style.setProperty("--silhouette", mix(toRgb(a.ink), toRgb(b.ink), t));
    root.style.setProperty("--sun-color", mix(toRgb(a.sun), toRgb(b.sun), t));
    root.style.setProperty("--sun-y", (lerp(a.sunY, b.sunY, t) * 74).toFixed(2) + "%");

    if (clockEl) clockEl.textContent = clockText(lerp(a.minutes, b.minutes, t));
    if (clockPlaceEl) clockPlaceEl.textContent = t < 0.5 ? a.name : b.name;
  }

  var stageEls = Array.prototype.slice.call(document.querySelectorAll("[data-stage]"));

  if (stageEls.length) {
    /* ---- Home page: interpolate across all six stages as you scroll ---- */
    var frames = [];

    function measure() {
      frames = [{ pos: 0, f: DAWN }];
      stageEls.forEach(function (el) {
        var slug = el.getAttribute("data-stage");
        var d = places.filter(function (p) { return p.slug === slug; })[0];
        if (!d) return;
        var box = el.getBoundingClientRect();
        var top = box.top + window.scrollY;
        frames.push({ pos: top + box.height * 0.5, f: frameFrom(d) });
      });
      frames.push({
        pos: document.documentElement.scrollHeight - window.innerHeight * 0.35,
        f: NIGHT,
      });
    }

    function tick() {
      var y = window.scrollY + window.innerHeight * 0.5;
      var i = 0;
      while (i < frames.length - 2 && y > frames[i + 1].pos) i++;
      var a = frames[i];
      var b = frames[i + 1];
      var span = Math.max(1, b.pos - a.pos);
      var t = clamp((y - a.pos) / span, 0, 1);
      // ease so each destination holds its own light a little longer
      t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      paint(a.f, b.f, t);
      root.style.setProperty(
        "--sun-x",
        (6 + ((i + t) / (frames.length - 1)) * 88).toFixed(2) + "%"
      );
    }

    measure();
    tick();
    window.addEventListener("resize", function () { measure(); tick(); });
    window.addEventListener("scroll", tick, { passive: true });
    setTimeout(function () { measure(); tick(); }, 400);
  } else if (document.body.getAttribute("data-slug")) {
    /* ------------- Detail page: hold one palette, drift the sun -------- */
    var current = places.filter(function (p) {
      return p.slug === document.body.getAttribute("data-slug");
    })[0];

    if (current) {
      var f = frameFrom(current);
      paint(f, f, 0);
      var drift = function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
        paint(f, NIGHT, p * 0.72);
        root.style.setProperty("--sun-x", (18 + p * 62).toFixed(2) + "%");
      };
      drift();
      window.addEventListener("scroll", drift, { passive: true });
    }
  }

  /* --------------------------------------------------- smooth scrolling */

  var lenis = null;
  if (!reduced && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    if (hasGsap) {
      lenis.on("scroll", function () {
        if (window.ScrollTrigger) window.ScrollTrigger.update();
      });
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!link) return;
    var target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -40 });
    else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  });

  /* ------------------------------------------------------- animation */

  if (!hasGsap || reduced) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-reveal]"), function (el) {
      el.style.opacity = 1;
    });
    return;
  }

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  /* Opening sequence: the title rises line by line, the horizon settles. */
  var heroLines = document.querySelectorAll(".hero .line > span");
  if (heroLines.length) {
    gsap.set(heroLines, { yPercent: 108 });
    gsap.set(".hero__eyebrow", { opacity: 0 });
    gsap.set(".hero__foot", { opacity: 0, y: 24 });

    gsap
      .timeline({ defaults: { ease: "expo.out" } })
      .to(".hero__eyebrow", { opacity: 1, duration: 1, ease: "power2.out" }, 0.15)
      .to(heroLines, { yPercent: 0, duration: 1.5, stagger: 0.11 }, 0.3)
      .to(".hero__foot", { opacity: 1, y: 0, duration: 1.2 }, 0.9);
  }

  /* Scroll reveals */
  gsap.utils.toArray("[data-reveal]").forEach(function (el) {
    gsap.fromTo(
      el,
      { opacity: 0, y: 34 },
      {
        opacity: 1,
        y: 0,
        duration: 1.15,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      }
    );
  });

  gsap.utils.toArray("[data-reveal-group]").forEach(function (group) {
    gsap.fromTo(
      group.children,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.12,
        scrollTrigger: { trigger: group, start: "top 86%", once: true },
      }
    );
  });

  /* Destination names drift against the horizon behind them */
  gsap.utils.toArray("[data-stage]").forEach(function (stage) {
    var name = stage.querySelector(".place__name");
    var far = stage.querySelector(".horizon__far");
    var near = stage.querySelector(".horizon__near");

    var st = { trigger: stage, start: "top bottom", end: "bottom top", scrub: 0.6 };

    if (name) gsap.fromTo(name, { yPercent: 12 }, { yPercent: -12, ease: "none", scrollTrigger: st });
    if (far) gsap.fromTo(far, { yPercent: 14 }, { yPercent: -6, ease: "none", scrollTrigger: st });
    if (near) gsap.fromTo(near, { yPercent: 26 }, { yPercent: -2, ease: "none", scrollTrigger: st });
  });

  window.addEventListener("load", function () {
    window.ScrollTrigger.refresh();
  });
})();
