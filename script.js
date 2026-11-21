// Ahmad Raza — Portfolio interactions
(function () {
  "use strict";

  // Mobile nav
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("siteNav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); });
    });
  }

  // Scroll progress bar + header shadow
  var bar = document.getElementById("progressBar");
  var header = document.getElementById("siteHeader");
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? (h.scrollTop / max) * 100 : 0;
    if (bar) bar.style.width = p + "%";
    if (header) header.style.boxShadow = h.scrollTop > 10 ? "0 8px 30px rgba(0,0,0,.35)" : "none";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Typewriter roles
  var roles = ["React Developer", "Front-End Developer", "WordPress Developer"];
  var el = document.getElementById("typewriter");
  if (el) {
    var ri = 0, ci = 0, deleting = false;
    (function tick() {
      var word = roles[ri];
      if (!deleting) {
        ci++;
        el.textContent = word.slice(0, ci);
        if (ci === word.length) { deleting = true; return setTimeout(tick, 1800); }
        return setTimeout(tick, 70);
      }
      ci--;
      el.textContent = word.slice(0, ci);
      if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length; return setTimeout(tick, 350); }
      return setTimeout(tick, 35);
    })();
  }

  // Scroll reveal
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); ro.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (n) { ro.observe(n); });
  } else {
    revealEls.forEach(function (n) { n.classList.add("visible"); });
  }

  // Count-up stats
  var counters = document.querySelectorAll(".count");
  function animateCount(node) {
    var raw = node.getAttribute("data-target") || "0";
    var target = parseFloat(raw) || 0;
    var decimals = raw.indexOf(".") >= 0 ? 1 : 0;
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      node.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (n) { co.observe(n); });
  } else {
    counters.forEach(animateCount);
  }

  // Live Pakistan clock (footer)
  var clock = document.getElementById("liveClock");
  function tickClock() {
    if (!clock) return;
    var now = new Date();
    var fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    });
    clock.textContent = "Bahawalnagar, PK — " + fmt.format(now);
  }
  tickClock();
  setInterval(tickClock, 1000);

  // Footer year
  var yr = document.getElementById("currentYear");
  if (yr) yr.textContent = new Date().getFullYear();

  // Contact form -> opens the visitor's email app (no backend needed)
  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = document.getElementById("cfName").value.trim();
      var email = document.getElementById("cfEmail").value.trim();
      var subject = document.getElementById("cfSubject").value.trim() || "Project inquiry";
      var msg = document.getElementById("cfMsg").value.trim();
      var body = "Hi Ahmad,\n\n" + msg + "\n\n— " + name + " (" + email + ")";
      window.location.href =
        "mailto:razasardar722212@gmail.com?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    });
  }
})();

// Theme dock, constellation, spotlight, staggered reveals (Ali-style)
(function () {
  "use strict";

  // ---- Theme switcher ----
  var THEMES = { lime: "OLED Lime", violet: "Midnight Violet", ocean: "Ocean Depth", sage: "Forest Sage", ivory: "Ivory Travertine" };
  var dock = document.getElementById("themeDock");
  var nameEl = document.getElementById("themeName");
  function applyTheme(key) {
    if (!THEMES[key]) key = "lime";
    var root = document.documentElement;
    if (key === "lime") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", key);
    if (nameEl) nameEl.textContent = THEMES[key];
    if (dock) dock.querySelectorAll(".swatch").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-theme") === key);
    });
    try { localStorage.setItem("folio-theme", key); } catch (e) {}
  }
  if (dock) {
    dock.querySelectorAll(".swatch").forEach(function (b) {
      b.addEventListener("click", function () { applyTheme(b.getAttribute("data-theme")); });
    });
    var saved = null;
    try { saved = localStorage.getItem("folio-theme"); } catch (e) {}
    if (saved && THEMES[saved]) applyTheme(saved);
  }

  // ---- Constellation canvas behind the hero ----
  var canvas = document.getElementById("constellation");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var dots = [], W = 0, H = 0, raf = null;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function resize() {
      var r = canvas.parentElement.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      dots = [];
      var n = Math.min(70, Math.floor((W * H) / 22000));
      for (var i = 0; i < n; i++) {
        dots.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .8 });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#a3e635";
      for (var i = 0; i < dots.length; i++) {
        var a = dots[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = accent; ctx.globalAlpha = .55; ctx.fill(); ctx.globalAlpha = 1;
        for (var j = i + 1; j < dots.length; j++) {
          var b = dots[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < 130 * 130) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = accent; ctx.globalAlpha = (1 - Math.sqrt(d2) / 130) * .22; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    function start() {
      resize(); seed();
      if (!reduced && !raf) draw();
      else { resize(); seed(); ctx.clearRect(0, 0, W, H); }
    }
    start();
    window.addEventListener("resize", function () { resize(); seed(); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; }
      else if (!reduced && !raf) draw();
    });
  }

  // ---- Spotlight follows the cursor on project cards ----
  document.querySelectorAll(".work-card").forEach(function (card) {
    card.addEventListener("mousemove", function (ev) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (ev.clientX - r.left) + "px");
      card.style.setProperty("--my", (ev.clientY - r.top) + "px");
    });
  });

  // ---- Staggered scroll-reveal inside grids ----
  document.querySelectorAll(".work-grid .reveal, .services-grid .reveal, .process-grid .reveal, .stack-grid .reveal").forEach(function (el, i) {
    el.style.transitionDelay = ((i % 3) * 90) + "ms";
  });
})();
