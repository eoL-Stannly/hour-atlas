/* ------------------------------------------------------------------
   Minimal, dependency-free lightbox.
   Any <img data-lightbox="group"> becomes clickable. Images sharing a
   group name form one set, navigable with the on-screen arrows, the
   keyboard, or a swipe. No third-party code, nothing loaded from a CDN.
------------------------------------------------------------------- */

(function () {
  "use strict";

  var overlay, stage, img, caption, counter, btnPrev, btnNext, btnClose;
  var group = [];
  var index = 0;
  var lastFocus = null;

  function build() {
    overlay = document.createElement("div");
    overlay.className = "lb";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.hidden = true;
    overlay.innerHTML =
      '<button class="lb__close" type="button" aria-label="Close">&times;</button>' +
      '<button class="lb__nav lb__prev" type="button" aria-label="Previous photograph">&#8249;</button>' +
      '<button class="lb__nav lb__next" type="button" aria-label="Next photograph">&#8250;</button>' +
      '<figure class="lb__stage">' +
        '<img class="lb__img" alt="">' +
        '<figcaption class="lb__cap"></figcaption>' +
      "</figure>" +
      '<p class="lb__count"></p>';
    document.body.appendChild(overlay);

    stage = overlay.querySelector(".lb__img");
    caption = overlay.querySelector(".lb__cap");
    counter = overlay.querySelector(".lb__count");
    btnPrev = overlay.querySelector(".lb__prev");
    btnNext = overlay.querySelector(".lb__next");
    btnClose = overlay.querySelector(".lb__close");

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { show(index - 1); });
    btnNext.addEventListener("click", function () { show(index + 1); });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", function (e) {
      if (overlay.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });

    // Basic touch swipe.
    var startX = null;
    overlay.addEventListener("touchstart", function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });
    overlay.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    });
  }

  function show(i) {
    index = (i + group.length) % group.length;
    var el = group[index];
    stage.src = el.getAttribute("data-full");
    stage.alt = el.getAttribute("alt") || "";
    caption.textContent = el.getAttribute("data-caption") || "";
    counter.textContent = group.length > 1 ? index + 1 + " / " + group.length : "";
    var multi = group.length > 1;
    btnPrev.hidden = !multi;
    btnNext.hidden = !multi;
  }

  function open(el) {
    var name = el.getAttribute("data-lightbox");
    group = Array.prototype.slice.call(
      document.querySelectorAll('[data-lightbox="' + name + '"]')
    );
    if (!group.length) return;
    lastFocus = el;
    show(group.indexOf(el));
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    btnClose.focus();
  }

  function close() {
    overlay.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var targets = document.querySelectorAll("[data-lightbox]");
    if (!targets.length) return;
    build();
    targets.forEach(function (el) {
      el.addEventListener("click", function () { open(el); });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(el);
        }
      });
    });
  });
})();
