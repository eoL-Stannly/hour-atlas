/* ------------------------------------------------------------------
   Stannly
   Photographs first: everything here exists to get an image on screen
   without a layout jump, then to move it as little as the design needs.
------------------------------------------------------------------- */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) document.body.classList.add("reduced");

  /* ---------------------------------------------------- image blur-up */

  function markLoaded(img) {
    img.classList.add("is-loaded");
    var box = img.parentElement;
    if (box) box.style.backgroundImage = "none";
  }

  var images = Array.prototype.slice.call(document.querySelectorAll(".frame__img"));
  images.forEach(function (img) {
    if (img.complete && img.naturalWidth) markLoaded(img);
    else img.addEventListener("load", function () { markLoaded(img); }, { once: true });
    img.addEventListener("error", function () { markLoaded(img); }, { once: true });
  });

  /* ------------------------------------------------------- lightbox */

  var order = images
    .map(function (img) { return img.getAttribute("data-ref"); })
    .filter(function (ref, i, arr) { return ref && arr.indexOf(ref) === i; });

  var data = window.FRAMES || {};
  var box = document.getElementById("lightbox");

  if (box && order.length) {
    var lbImg = box.querySelector(".lightbox__img");
    var lbCap = box.querySelector(".lightbox__cap");
    var index = 0;
    var lastFocus = null;

    function render(i) {
      index = (i + order.length) % order.length;
      var f = data[order[index]];
      if (!f) return;
      lbImg.src = f.fallback;
      lbImg.alt = f.alt || "";
      var exif = f.exif
        ? f.exif.focal + " · " + f.exif.aperture + " · " + f.exif.shutter + " · ISO " + f.exif.iso
        : "Plate";
      lbCap.innerHTML =
        '<span class="rebate__ref"></span><span class="rebate__exif"></span><span class="rebate__note"></span>';
      lbCap.children[0].textContent = f.ref;
      lbCap.children[1].textContent = exif;
      lbCap.children[2].textContent = f.caption || "";
    }

    function open(ref, trigger) {
      var at = order.indexOf(ref);
      if (at < 0) return;
      lastFocus = trigger || null;
      render(at);
      box.hidden = false;
      requestAnimationFrame(function () { box.classList.add("is-open"); });
      document.body.style.overflow = "hidden";
      box.querySelector(".lightbox__close").focus();
    }

    function close() {
      box.classList.remove("is-open");
      document.body.style.overflow = "";
      window.setTimeout(function () { box.hidden = true; }, 200);
      if (lastFocus) lastFocus.focus();
    }

    document.addEventListener("click", function (e) {
      var hit = e.target.closest && e.target.closest("[data-ref]");
      if (!hit || box.contains(hit)) return;
      if (hit.closest("a")) return;
      e.preventDefault();
      open(hit.getAttribute("data-ref"), hit);
    });

    box.querySelector(".lightbox__close").addEventListener("click", close);
    box.querySelector(".lightbox__nav--prev").addEventListener("click", function () { render(index - 1); });
    box.querySelector(".lightbox__nav--next").addEventListener("click", function () { render(index + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });

    document.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") render(index - 1);
      if (e.key === "ArrowRight") render(index + 1);
    });
  }

  /* -------------------------------------------------- motion, if wanted */

  function showEverything() {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-reveal], [data-reveal-group] > *"),
      function (el) { el.style.opacity = 1; }
    );
  }

  if (reduced) { showEverything(); return; }

  window.addEventListener("load", function () {
    if (typeof window.gsap === "undefined") { showEverything(); return; }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    var lenis = null;
    if (typeof window.Lenis !== "undefined") {
      lenis = new window.Lenis({
        duration: 1.1,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true,
      });
      lenis.on("scroll", window.ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    document.addEventListener("click", function (e) {
      var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link || link.getAttribute("href") === "#") return;
      var target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -60 });
      else target.scrollIntoView({ behavior: "smooth" });
    });

    /* Opening: the lead photo settles out of a slow push-in while the
       title rises a line at a time. */
    var heroImg = document.querySelector(".opening__photo .frame__img");
    var heroLines = document.querySelectorAll(".opening__title .line > span");

    if (heroLines.length) {
      gsap.set(heroLines, { yPercent: 106 });
      gsap.set(".opening__eyebrow, .opening__cue", { opacity: 0 });
      var intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      if (heroImg) intro.fromTo(heroImg, { scale: 1.12 }, { scale: 1, duration: 2.4, ease: "power2.out" }, 0);
      intro
        .to(".opening__eyebrow", { opacity: 1, duration: 1, ease: "power2.out" }, 0.2)
        .to(heroLines, { yPercent: 0, duration: 1.4, stagger: 0.09 }, 0.35)
        .to(".opening__cue", { opacity: 1, duration: 1 }, 1.1);
    }

    if (heroImg) {
      gsap.to(heroImg, {
        yPercent: 14,
        ease: "none",
        scrollTrigger: { trigger: ".opening", start: "top top", end: "bottom top", scrub: true },
      });
    }

    /* Text reveals */
    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 26 }, {
        opacity: 1, y: 0, duration: 1.05, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    });

    gsap.utils.toArray("[data-reveal-group]").forEach(function (group) {
      gsap.fromTo(group.children, { opacity: 0, y: 32 }, {
        opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.1,
        scrollTrigger: { trigger: group, start: "top 88%", once: true },
      });
    });

    /* Frames wipe up into place, then drift inside their own crop as the
       page moves. The crop is what makes it read as depth rather than
       a photo sliding around. */
    gsap.utils.toArray(".card__lead .frame__box, .card__strip .frame__box, .post__frames .frame__box")
      .forEach(function (frameBox) {
        var img = frameBox.querySelector(".frame__img");

        gsap.fromTo(frameBox,
          { clipPath: "inset(14% 0% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.3,
            ease: "expo.out",
            scrollTrigger: { trigger: frameBox, start: "top 90%", once: true },
          }
        );

        if (img) {
          gsap.fromTo(img, { scale: 1.16, yPercent: -4 }, {
            scale: 1.04, yPercent: 4, ease: "none",
            scrollTrigger: { trigger: frameBox, start: "top bottom", end: "bottom top", scrub: 0.5 },
          });
        }
      });

    window.ScrollTrigger.refresh();
  });
})();
