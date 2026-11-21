// Ahmad Raza — Portfolio 3D tour (v6.2)
// The whole site as a walk-through gallery, like the "Websites in 2026" video:
// hero first, then every section is a room. Frames hang on the walls — click a
// frame to open that section's full details. Scroll / drag / arrow keys walk
// you through the rooms. The classic 2D site stays in the DOM as the data
// source (and as the fallback + "Classic view" toggle).
// v5: side frames are angled toward the walkway so they face the camera;
// a hanging poster floats over each room with the section name (the hero
// room gets a big sparkling "AHMAD RAZA — PORTFOLIO" entrance poster);
// frame text is fitted so nothing runs past its box; the portrait shows
// the full photo, never cropped.
// v6: a guide robot runs on the track line and announces each section;
// the portrait moves to the right wall; every room has frames on all
// three sides; stats add 10+ completed / 5 pending / 4.5 rating / 90%
// trust (read from data-target, so the tour never shows 0s); the stack
// matches the GitHub profile (TypeScript, Vite, Python, VS Code added).
// v6.1: stats labels fixed (the label span was read as the count span,
// so every label showed "0"); the robot now faces the camera with its
// glowing eyes toward you, stands farther ahead so it is fully in view,
// and carries its own little lime light.
// v6.2: stats board second row was drawn off-canvas (its y was scaled
// twice), so only one row showed; rows re-laid out in design units and
// the bottom "CLICK TO OPEN" line removed from this dense board.
// v7: every room gets a table + chairs; the Resume room is a study (desk,
// bookshelf, lamp, laptop); the Work room is a TV lounge (screen cycling
// the projects + sofa); the Stack room is a kitchen (shelves of labelled
// boxes, one per tool); the robot's speech bubble is gone — robot only;
// the hero poster is smaller, cleaner and lower so the walk hint no
// longer crosses it; the stats board is narrower with inner padding so
// its first column is never clipped. tour.js is loaded with ?v=9 so
// browsers fetch the new file, not a cached copy.
// v8: the portfolio is a working company — 3–4 people in every room
// (owner in a meeting in hero, two discussing every project, cooks in
// the kitchen, customer service / email / WhatsApp in contact); the
// theme dock moves from the bottom bar to a side palette icon that
// opens the themes on tap. tour.js is loaded with ?v=10 so browsers
// fetch the new file, not a cached copy.
// v8.1: the hero end-wall box was too wide and too far left — its left
// edge hung past the wall corner and slid off-screen as you walked in,
// cutting the text ("MAD RAZA", "CLICK TO OPE"). It is now 3.8 wide at
// x=-2.9, fully inside the wall and fully visible from the start and
// while walking. tour.js is loaded with ?v=11.
// v8.2: v8.1 moved the box right onto the doorway pilaster (x -1.84..-1.56,
// its front face sits 0.09 in front of the frame plane), so the pilaster
// cut the box's right edge ("that", "customers"). The box now sits fully
// on the left wall segment: 3.6 wide at x=-3.85 (spans -5.65..-2.05).
// v9: classic view's Selected Work is a 3D curved gallery (video-style):
// the 9 project cards sit on a curved wall in CSS 3D — drag, arrows or
// click to bring a project forward; the centre card faces you straight.
// tour.js is loaded with ?v=12.
// v10 (responsive + hero poster fix): the hanging hero poster covered the
// hero box's top-right corner at the starting view, so it is now smaller
// (3.2 x 1.0) and hung higher (y 3.0), clear of the box. The tour camera
// widens its FOV on narrow/portrait screens (78 below aspect 0.6, 72
// below 0.85, 64 below 1.2, else 55) so rooms no longer feel like a tube
// on phones. Classic view's 3D gallery re-metrics itself from the stage
// width on small screens. tour.js is loaded with ?v=13.
(function () {
  "use strict";

  var body = document.body;
  var wrap = document.getElementById("tour3d");
  var canvas = document.getElementById("tourCanvas");
  var enterBtn = document.getElementById("tourEnter");
  if (!wrap || !canvas) return;
  if (!window.THREE) { if (enterBtn) enterBtn.style.display = "none"; return; }
  var THREE = window.THREE;

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function txt(sel, root) { var el = q(sel, root); return el ? (el.innerText || el.textContent || "").trim() : ""; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ---------- read all content from the classic site ----------
  var GRADS = {
    teal: ["#0d9488", "#0f766e", "#134e4a"], blue: ["#2563eb", "#1e40af", "#172554"],
    violet: ["#7c3aed", "#5b21b6", "#2e1065"], amber: ["#d97706", "#92400e", "#451a03"],
    rose: ["#e11d48", "#9f1239", "#4c0519"], green: ["#16a34a", "#166534", "#052e16"],
    slate: ["#475569", "#1e293b", "#0f172a"], lime: ["#65a30d", "#3f6212", "#1a2e05"]
  };
  var hero = {
    h1: txt(".hero-copy h1").replace(/\s+/g, " "),
    lede: txt(".hero-copy .lede"),
    badge: txt(".hero-copy .badge"),
    roles: ["React Developer", "Front-End Developer", "WordPress Developer"],
    term: qa(".term-body p").map(function (p) { return (p.innerText || p.textContent || "").trim(); }),
    github: "https://github.com/Ahmad-devcode",
    photo: q(".portrait-card img")
  };
  var about = {
    paras: qa("#about .about-grid > div:first-child p").map(function (p) { return (p.innerText || p.textContent || "").trim(); }),
    pills: qa("#about .pills span").map(function (s) { return s.textContent.trim(); }),
    facts: qa("#about .facts div").map(function (d) {
      return { k: txt("span", d), v: txt("strong", d) };
    })
  };
  var work = qa("#work .work-card").map(function (card) {
    var visual = q(".work-visual", card), grad = "slate";
    if (visual) { var m = /grad-(\w+)/.exec(visual.className); if (m && GRADS[m[1]]) grad = m[1]; }
    return {
      title: txt(".work-body h3", card), tag: txt(".wv-tag", card), url: txt(".wv-chrome em", card),
      desc: txt(".work-body p", card),
      tags: qa(".work-body .tags span", card).map(function (s) { return s.textContent.trim(); }),
      links: qa(".work-links a", card).map(function (a) {
        return { text: a.textContent.replace(/\s*\u2197\s*$/, "").trim(), href: a.getAttribute("href") };
      }),
      note: txt(".work-links .muted", card), grad: grad
    };
  });
  var services = qa("#services .service-card").map(function (c) {
    return { title: txt("h3", c), desc: txt("p", c) };
  });
  var stack = qa("#stack .stack-col").map(function (c) {
    return { head: txt(".stack-head", c), tags: qa(".tags span", c).map(function (s) { return s.textContent.trim(); }) };
  });
  var process = qa("#process .process-card").map(function (c) {
    return { num: txt(".p-num", c), title: txt("h3", c), desc: txt("p", c) };
  });
  var stats = qa("#stats .stat, .stats-band .stat").map(function (s) {
    // read the real number from data-target: the count-up text still shows
    // "0" when the tour loads, so reading the text would draw 0s.
    var strong = q("strong", s), cnt = q(".count", s);
    var target = cnt ? cnt.getAttribute("data-target") : null;
    var full = strong ? (strong.innerText || strong.textContent || "").replace(/\s+/g, "") : "";
    var cur = cnt ? (cnt.innerText || cnt.textContent || "").trim() : "";
    var suffix = cur ? full.replace(cur, "") : full;
    return { num: (target || cur) + suffix, label: txt("span:not(.count)", s) };
  });
  function findStat(label) {
    for (var i = 0; i < stats.length; i++) if (stats[i].label === label) return stats[i];
    return null;
  }
  var resumeCols = qa("#resume .resume-grid > div").map(function (col) {
    return {
      head: txt(".resume-head", col),
      items: qa(".timeline-item", col).map(function (it) {
        return {
          date: txt(".t-date", it), title: txt("h4", it), org: txt(".t-org", it),
          points: qa("ul li", it).map(function (li) { return li.textContent.trim(); }),
          tags: qa(".tags span", it).map(function (s) { return s.textContent.trim(); })
        };
      })
    };
  });
  var contact = {
    heading: txt(".cta-box h2"), text: txt(".cta-box > p"),
    rows: qa(".contact-rows > a, .contact-rows > span").map(function (r) {
      return { label: txt("span", r), value: txt("strong", r), href: r.getAttribute("href") || "" };
    }),
    wa: "https://wa.me/923240790546", email: "razasardar722212@gmail.com"
  };

  // ---------- rooms & frames ----------
  var Z_MAX = 5, Z_MIN = -121;
  var ROOMS = [
    { id: "hero", name: "Hero", center: 0 },
    { id: "about", name: "About", center: -16 },
    { id: "work", name: "Selected Work", center: -34 },
    { id: "services", name: "Services", center: -52 },
    { id: "stack", name: "My Stack", center: -66 },
    { id: "process", name: "Process", center: -80 },
    { id: "stats", name: "Stats", center: -92 },
    { id: "resume", name: "Experience", center: -104 },
    { id: "contact", name: "Contact", center: -118 }
  ];
  var WALL_X = 6, WALL_H = 4.2, HALL_Z0 = 8, HALL_Z1 = -124;
  // frame spec: x, z, rotY (0 = end wall facing camera, ANG = left wall angled
  // toward the walkway, -ANG = right wall angled toward the walkway)
  var frames = [];
  function F(x, z, rotY, w, h, kind, data) {
    frames.push({ x: x, z: z, rotY: rotY, w: w, h: h, kind: kind, data: data, title: data.title || data.name || kind });
  }
  var ANG = Math.PI / 2 - 0.6; // side frames angled toward the walkway so they face the camera
// hero room (end wall z=-8); portrait now on the right wall, full photo
  F(-3.85, -7.92, 0, 3.6, 2.6, "hero", { title: "Ahmad Raza — Web Developer" });
  F(5.15, -4, -ANG, 2.6, 3.7, "portrait", { title: "Ahmad Raza" });
  F(-5.15, -2, ANG, 2.9, 1.8, "terminal", { title: "$ whoami" });
  // about room — frames on all three sides (left, right, front wall)
  F(-5.15, -16, ANG, 2.9, 1.8, "about", { title: "About — Design eye. Developer hands." });
  F(5.15, -16, -ANG, 2.9, 1.8, "facts", { title: "Quick facts" });
  F(4.0, -23.92, 0, 4.0, 2.6, "about-more", { title: "What I care about" });
  // work room (9 projects)
  var workZ = { left: [-27, -31, -35, -39, -42.5], right: [-29, -33, -37, -41] };
  work.forEach(function (pj, i) {
    var side = i % 2 === 0 ? "left" : "right";
    var list = side === "left" ? workZ.left : workZ.right;
    var idx = Math.floor(i / 2);
    F(side === "left" ? -5.15 : 5.15, list[idx], side === "left" ? ANG : -ANG, 2.9, 1.8, "project", pj);
  });
  F(4.0, -43.92, 0, 4.0, 2.6, "work-more", { title: "Selected Work" });
  // services room
  services.forEach(function (s, i) {
    var side = i % 2 === 0 ? "left" : "right";
    var z = side === "left" ? [-47, -51, -55][Math.floor(i / 2)] : [-49, -53, -57][Math.floor(i / 2)];
    F(side === "left" ? -5.15 : 5.15, z, side === "left" ? ANG : -ANG, 2.9, 1.8, "service", s);
  });
  F(4.0, -59.92, 0, 4.0, 2.6, "services-more", { title: "What I can build for you" });
  // stack room
  var totalTech = 0;
  stack.forEach(function (g) { totalTech += g.tags.length; });
  stack.forEach(function (g, i) {
    var side = i % 2 === 0 ? "left" : "right";
    var z = side === "left" ? [-63, -67][Math.floor(i / 2)] : -65;
    F(side === "left" ? -5.15 : 5.15, z, side === "left" ? ANG : -ANG, 2.9, 1.8, "stack", g);
  });
  F(4.0, -71.92, 0, 4.0, 2.6, "stack-more", { title: "My stack" });
  // process room
  process.forEach(function (st, i) {
    var side = i % 2 === 0 ? "left" : "right";
    var z = side === "left" ? [-75, -79][Math.floor(i / 2)] : [-77, -81][Math.floor(i / 2)];
    F(side === "left" ? -5.15 : 5.15, z, side === "left" ? ANG : -ANG, 2.9, 1.8, "step", st);
  });
  F(4.0, -87.92, 0, 4.0, 2.6, "process-more", { title: "From idea to launch" });
  // stats room (end wall z=-96) — new stats as side frames too
  F(-3.4, -95.15, 0, 4.2, 2.3, "stats", { title: "By the numbers" });
  F(3.9, -95.15, 0, 2.6, 1.8, "badge", { title: hero.badge });
  F(-5.15, -92, ANG, 2.9, 1.8, "stat-side", { title: "Projects", side: "left" });
  F(5.15, -92, -ANG, 2.9, 1.8, "stat-side", { title: "Rating & Trust", side: "right" });
  // resume room
  resumeCols.forEach(function (col, i) {
    F(i === 0 ? -5.15 : 5.15, -104, i === 0 ? ANG : -ANG, 2.9, 1.8, "resume", col);
  });
  F(4.0, -111.92, 0, 4.0, 2.6, "resume-more", { title: "Freelance Web Developer" });
  // contact room (end wall z=-124)
  F(-5.15, -117, ANG, 2.9, 1.8, "contact-wa", { title: "WhatsApp" });
  F(5.15, -117, -ANG, 2.9, 1.8, "contact-email", { title: "Email" });
  F(0, -123.92, 0, 5.4, 3.0, "contact", { title: contact.heading });

  // ---------- three.js scene ----------
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  } catch (e) {
    if (enterBtn) enterBtn.style.display = "none";
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  scene.fog = new THREE.Fog(0x050505, 26, 60);
  var camera = new THREE.PerspectiveCamera(55, 2, 0.1, 200);
  camera.position.set(0, 1.7, Z_MAX);

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  var dir = new THREE.DirectionalLight(0xffffff, 0.7);
  dir.position.set(3, 8, 10);
  scene.add(dir);

  function accentColor() {
    var c = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#a3e635";
    return new THREE.Color(c);
  }
  var accent = accentColor();
  var runnerMat = new THREE.MeshBasicMaterial({ color: accent });
  [[-10, 3.4], [-45, 3.4], [-80, 3.4], [-115, 3.4]].forEach(function (p) {
    var pl = new THREE.PointLight(accent, 1.1, 26, 2);
    pl.position.set(0, p[1], p[0]);
    scene.add(pl);
  });

  // ---------- hall: floor, ceiling, side walls, doorways ----------
  var wallMat = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
  var floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9, metalness: 0 });
  function plane(w, h, mat, x, y, z, rotY) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    m.rotation.y = rotY || 0;
    scene.add(m);
    return m;
  }
  var hallLen = HALL_Z0 - HALL_Z1, hallCZ = (HALL_Z0 + HALL_Z1) / 2;
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(12, hallLen), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, hallCZ); scene.add(floor);
  var ceil = new THREE.Mesh(new THREE.PlaneGeometry(12, hallLen), new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 1 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, WALL_H, hallCZ); scene.add(ceil);
  plane(12, WALL_H, wallMat, 0, WALL_H / 2, HALL_Z0, Math.PI);          // back wall
  plane(12, WALL_H, wallMat, 0, WALL_H / 2, HALL_Z1, 0);                // end wall (contact)
  var sideL = plane(hallLen, WALL_H, wallMat, -WALL_X, WALL_H / 2, hallCZ, Math.PI / 2);
  var sideR = plane(hallLen, WALL_H, wallMat, WALL_X, WALL_H / 2, hallCZ, -Math.PI / 2);
  void sideL; void sideR;
  // lime runner strip down the middle of the floor
  var runner = new THREE.Mesh(new THREE.PlaneGeometry(0.45, hallLen - 4), runnerMat);
  runner.rotation.x = -Math.PI / 2; runner.position.set(0, 0.012, hallCZ); scene.add(runner);
  // doorways at room boundaries
  var pilasterMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  [-8, -24, -44, -60, -72, -88, -96, -112].forEach(function (zb) {
    plane(4.3, WALL_H, wallMat, -3.85, WALL_H / 2, zb, 0);
    plane(4.3, WALL_H, wallMat, 3.85, WALL_H / 2, zb, 0);
    plane(3.4, 1.5, wallMat, 0, 3.45, zb, 0);
    var glow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.09), runnerMat);
    glow.position.set(0, 2.72, zb + 0.02); scene.add(glow);
    [-1.7, 1.7].forEach(function (px) {
      var pil = new THREE.Mesh(new THREE.BoxGeometry(0.28, WALL_H, 0.34), pilasterMat);
      pil.position.set(px, WALL_H / 2, zb); scene.add(pil);
    });
  });

  // ---------- canvas textures ----------
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function wrapText(ctx, text, maxW) {
    var words = String(text).split(/\s+/), lines = [], line = "";
    words.forEach(function (w) {
      var t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    });
    if (line) lines.push(line);
    return lines;
  }
  function baseCanvas(W, H, gradKey) {
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var ctx = c.getContext("2d");
    var g = GRADS[gradKey] || GRADS.slate;
    var grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, g[0]); grad.addColorStop(0.55, g[1]); grad.addColorStop(1, g[2]);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    return { c: c, ctx: ctx };
  }
  function toTexture(c) {
    var tex = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
  }
  // generic text frame: tag on top, big title, up to 4 small lines, "click to open" footer.
  // Every string is measured and shrunk / wrapped / dropped so nothing ever
  // runs past the frame's edges.
  function fitFont(ctx, text, maxW, start, min, weight, family) {
    var size = start;
    ctx.font = weight + " " + size + "px " + family;
    while (ctx.measureText(text).width > maxW && size > min) {
      size -= 1;
      ctx.font = weight + " " + size + "px " + family;
    }
    return size;
  }
  function textTexture(o) {
    var W = o.W || 640, H = o.H || 400, s = W / 640;
    var b = baseCanvas(W, H, o.grad || "slate"), ctx = b.ctx;
    if (o.chrome) {
      ctx.fillStyle = "rgba(0,0,0,0.30)"; ctx.fillRect(0, 0, W, 44 * s);
      ["#ff5f57", "#febc2e", "#28c840"].forEach(function (col, i) {
        ctx.beginPath(); ctx.arc((30 + i * 24) * s, 22 * s, 7 * s, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      });
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      var chromeSize = fitFont(ctx, o.chrome, W - 148 * s, 17 * s, 11 * s, "", "'JetBrains Mono', monospace");
      ctx.font = chromeSize + "px 'JetBrains Mono', monospace";
      ctx.fillText(o.chrome, 108 * s, 28 * s);
    }
    var y = (o.chrome ? 84 : 56) * s;
    if (o.tag) {
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      var tagSize = fitFont(ctx, o.tag.toUpperCase(), W - 80 * s, 19 * s, 13 * s, "700", "Inter, system-ui, sans-serif");
      ctx.font = "700 " + tagSize + "px Inter, system-ui, sans-serif";
      ctx.fillText(o.tag.toUpperCase(), 40 * s, y); y += 30 * s;
    }
    var size = (o.big ? 54 : 40) * s;
    ctx.font = "800 " + size + "px Inter, system-ui, sans-serif";
    var lines = wrapText(ctx, o.title, W - 80 * s);
    while (lines.length > 2 && size > 30 * s) {
      size -= 5 * s;
      ctx.font = "800 " + size + "px Inter, system-ui, sans-serif";
      lines = wrapText(ctx, o.title, W - 80 * s);
    }
    ctx.fillStyle = "#ffffff";
    lines.slice(0, 2).forEach(function (ln) { ctx.fillText(ln, 40 * s, y + size * 0.9); y += size + 10 * s; });
    if (o.lines) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = 20 * s + "px Inter, system-ui, sans-serif";
      o.lines.slice(0, 3).forEach(function (ln) {
        wrapText(ctx, ln, W - 80 * s).slice(0, 2).forEach(function (l2) {
          if (y + 24 * s > H - 66 * s) return;
          ctx.fillText(l2, 40 * s, y + 24 * s); y += 30 * s;
        });
      });
    }
    if (o.pills) {
      var px = 40 * s, py = H - 62 * s;
      ctx.font = "600 " + 17 * s + "px Inter, system-ui, sans-serif";
      o.pills.slice(0, 3).forEach(function (t) {
        var w = ctx.measureText(t).width + 24 * s;
        if (px + w > W - 40 * s) return; // skip pills that would run past the edge
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        roundRect(ctx, px, py, w, 34 * s, 17 * s); ctx.fill();
        ctx.fillStyle = "#ffffff"; ctx.fillText(t, px + 12 * s, py + 23 * s);
        px += w + 10 * s;
      });
    }
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = 17 * s + "px 'JetBrains Mono', monospace";
    ctx.fillText("CLICK TO OPEN \u2197", W - 40 * s - ctx.measureText("CLICK TO OPEN \u2197").width, H - 26 * s);
    return toTexture(b.c);
  }
  // Portrait frame: tall canvas matching the photo (812x1152), drawn with
  // "contain" fit so the whole photo shows — never cropped.
  function portraitTexture() {
    var W = 720, H = 1024;
    var b = baseCanvas(W, H, "slate"), ctx = b.ctx;
    ctx.fillStyle = "#0b0b0b"; ctx.fillRect(0, 0, W, H);
    var img = hero.photo;
    if (img && img.naturalWidth) {
      var iw = img.naturalWidth, ih = img.naturalHeight;
      var sc = Math.min(W / iw, H / ih), dw = iw * sc, dh = ih * sc;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = "#ffffff"; ctx.font = "800 64px Inter, sans-serif";
      ctx.fillText("Ahmad Raza", 60, H / 2);
    }
    ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(0, H - 130, W, 130);
    ctx.fillStyle = "#ffffff"; ctx.font = "700 36px Inter, sans-serif";
    ctx.fillText("Ahmad Raza", 40, H - 74);
    ctx.font = "26px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fillText("React & Front-End Developer", 40, H - 34);
    return toTexture(b.c);
  }
  function statsTexture() {
    var W = 1024, H = 560, s = W / 640;
    var b = baseCanvas(W, H, "lime"), ctx = b.ctx;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "700 " + 19 * s + "px Inter, system-ui, sans-serif";
    ctx.fillText("BY THE NUMBERS", 64 * s, 64 * s);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 " + 34 * s + "px Inter, system-ui, sans-serif";
    ctx.fillText("Things I've built & shipped.", 64 * s, 116 * s);
    var colW = (W - 128 * s) / 4, perRow = 4;
    stats.forEach(function (st, i) {
      var row = Math.floor(i / perRow), col = i % perRow;
      var x = 64 * s + col * colW;
      var numY = (row === 0 ? 172 : 272) * s, labY = (row === 0 ? 200 : 300) * s;
      ctx.fillStyle = "#ffffff";
      var ns = fitFont(ctx, st.num, colW - 16 * s, 64 * s, 34 * s, "800", "Inter, system-ui, sans-serif");
      ctx.font = "800 " + ns + "px Inter, system-ui, sans-serif";
      ctx.fillText(st.num, x, numY);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = 20 * s + "px Inter, system-ui, sans-serif";
      wrapText(ctx, st.label, colW - 16 * s).slice(0, 2).forEach(function (ln, j) {
        ctx.fillText(ln, x, labY + j * 24 * s);
      });
    });
    return toTexture(b.c);
  }
  function frameTexture(f) {
    var d = f.data;
    switch (f.kind) {
      case "hero":
        return textTexture({
          W: 1024, H: 640, grad: "lime", tag: "Ahmad Raza — Portfolio",
          title: hero.h1, lines: [hero.lede], big: true
        });
      case "portrait": return portraitTexture();
      case "terminal":
        return textTexture({ grad: "slate", tag: "Terminal", title: "$ whoami", lines: hero.term.slice(0, 3) });
      case "about":
        return textTexture({ grad: "blue", tag: "About", title: "Design eye. Developer hands.", lines: about.paras.slice(0, 1) });
      case "facts":
        return textTexture({ grad: "violet", tag: "Quick facts", title: "Bahawalnagar, Pakistan", lines: about.facts.map(function (x) { return x.k + ": " + x.v; }) });
      case "project":
        return textTexture({ W: 896, H: 560, grad: d.grad, chrome: d.url || "ahmad-raza — portfolio", tag: d.tag, title: d.title, pills: d.tags });
      case "service":
        return textTexture({ grad: "teal", tag: "Service", title: d.title, lines: [d.desc] });
      case "stack":
        return textTexture({ grad: "green", tag: "My stack", title: d.head.replace(/^\/\/\s*/, ""), pills: d.tags });
      case "step":
        return textTexture({ grad: "amber", tag: "Step " + d.num, title: d.title, lines: [d.desc] });
      case "stats": return statsTexture();
      case "badge":
        return textTexture({ grad: "lime", tag: "Status", title: "Open to Work", lines: [hero.badge] });
      case "resume":
        return textTexture({ grad: "rose", tag: d.head, title: d.items[0] ? d.items[0].title : d.head, lines: d.items.map(function (it) { return it.date + " — " + it.title; }) });
      case "contact-wa":
        return textTexture({ grad: "green", tag: "WhatsApp", title: "+92 324 0790546", lines: ["Chat on WhatsApp"] });
      case "contact-email":
        return textTexture({ grad: "blue", tag: "Email", title: "razasardar722212@gmail.com", lines: ["Email me"] });
      case "about-more":
        return textTexture({ grad: "blue", tag: "About", title: "What I care about", lines: about.paras.slice(1) });
      case "work-more":
        return textTexture({ grad: "slate", tag: "Selected Work", title: work.length + " projects shipped", lines: ["React, Tailwind & Supabase", "Click any frame to open it"] });
      case "services-more":
        return textTexture({ grad: "teal", tag: "Services", title: services.length + " services", lines: ["Business, portfolio & e-commerce", "Click any frame to open it"] });
      case "stack-more":
        return textTexture({ grad: "green", tag: "My stack", title: totalTech + " tools in my kit", lines: ["Front-end, backend & WordPress", "Click a frame for the full list"] });
      case "process-more":
        return textTexture({ grad: "amber", tag: "Process", title: "From idea to launch", lines: ["4 clear steps — no surprises", "Click any frame to open it"] });
      case "stat-side": {
        var leftS = d.side === "left";
        var sa = findStat(leftS ? "Projects Completed" : "Client Rating");
        var sb = findStat(leftS ? "Pending Projects" : "Client Trust");
        return textTexture({
          grad: leftS ? "green" : "lime",
          tag: leftS ? "Projects" : "Rating & Trust",
          title: sa ? sa.num + " " + sa.label : (leftS ? "10+ Projects" : "4.5 Rating"),
          lines: sb ? [sb.num + " " + sb.label] : []
        });
      }
      case "resume-more": {
        var job = resumeCols[0] && resumeCols[0].items[0];
        var edu = resumeCols[1] && resumeCols[1].items[0];
        return textTexture({
          grad: "rose", tag: "Experience", title: job ? job.title : "Experience",
          lines: [(job ? job.org + " — " + job.date : ""), (edu ? edu.title + " — " + edu.date : "")].filter(function (x) { return x; })
        });
      }
      case "contact":
        return textTexture({ W: 1024, H: 640, grad: "lime", tag: "Let's Work Together", title: contact.heading, lines: [contact.text], big: true });
      default:
        return textTexture({ title: f.title });
    }
  }

  // ---------- build frames ----------
  var frameMeshes = [];
  var group = new THREE.Group();
  scene.add(group);
  function buildFrames() {
    frames.forEach(function (f) {
      var holder = new THREE.Group();
      holder.position.set(f.x, 1.9, f.z);
      holder.rotation.y = f.rotY;
      var border = new THREE.Mesh(
        new THREE.PlaneGeometry(f.w + 0.14, f.h + 0.14),
        new THREE.MeshBasicMaterial({ color: 0x262626 })
      );
      border.position.z = -0.02;
      holder.add(border);
      var panel = new THREE.Mesh(
        new THREE.PlaneGeometry(f.w, f.h),
        new THREE.MeshBasicMaterial({ map: frameTexture(f) })
      );
      panel.userData.frame = f;
      holder.add(panel);
      group.add(holder);
      f.holder = holder; f.border = border; f.panel = panel;
      f.scale = 1; f.borderColor = new THREE.Color(0x262626);
      frameMeshes.push(panel);
    });
  }

  // ---------- hanging posters (v5) ----------
  // One poster floats over every room, hanging from the ceiling and swaying
  // gently in the air, with that section's name on it. The hero room gets
  // the big sparkling "AHMAD RAZA — PORTFOLIO" entrance poster.
  var posters = [];
  var sparkles = null, sparkleSpeed = null;
  function posterTexture(title, sub, heroMode) {
    var W = heroMode ? 1280 : 1024, H = heroMode ? 420 : 300;
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var ctx = c.getContext("2d");
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#101010"); g.addColorStop(1, "#050505");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = heroMode ? 6 : 8;
    roundRect(ctx, 12, 12, W - 24, H - 24, 26); ctx.stroke();
    ctx.textAlign = "center";
    if (heroMode) {
      var sz = fitFont(ctx, "AHMAD RAZA", W - 140, 132, 60, "800", "Inter, system-ui, sans-serif");
      ctx.font = "800 " + sz + "px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#a3e635";
      ctx.fillText("AHMAD RAZA", W / 2, H / 2 - 34);
      ctx.fillStyle = "#ffffff";
      ctx.font = "500 40px 'JetBrains Mono', monospace";
      ctx.fillText("P  O  R  T  F  O  L  I  O", W / 2, H / 2 + 44);
      ctx.fillStyle = "#a3e635";
      var sub = fitFont(ctx, "REACT  &  FRONT-END  DEVELOPER", W - 200, 26, 14, "500", "'JetBrains Mono', monospace");
      ctx.font = "500 " + sub + "px 'JetBrains Mono', monospace";
      ctx.fillText("REACT  &  FRONT-END  DEVELOPER", W / 2, H / 2 + 108);
    } else {
      var sz2 = fitFont(ctx, title, W - 100, 96, 44, "800", "Inter, system-ui, sans-serif");
      ctx.font = "800 " + sz2 + "px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(title, W / 2, H / 2 + 6);
      ctx.fillStyle = "#a3e635";
      ctx.font = "500 30px 'JetBrains Mono', monospace";
      ctx.fillText(sub, W / 2, H - 52);
    }
    ctx.textAlign = "left";
    return toTexture(c);
  }
  function buildPosters() {
    var stringMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    ROOMS.forEach(function (r, i) {
      var isHero = r.id === "hero";
      var w = isHero ? 3.2 : 3.4, h = 1.0;
      var y = isHero ? 3.0 : 3.02;
      var grp = new THREE.Group();
      grp.position.set(0, y, r.center);
      var back = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.1, h + 0.1),
        new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide }));
      back.position.z = -0.03;
      grp.add(back);
      var panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({
          map: posterTexture(isHero ? "AHMAD RAZA" : r.name.toUpperCase(),
            isHero ? "" : "ROOM " + (i + 1) + " / " + ROOMS.length, isHero),
          side: THREE.DoubleSide
        }));
      grp.add(panel);
      var strLen = WALL_H - (y + h / 2);
      [-1, 1].forEach(function (sx) {
        var str = new THREE.Mesh(new THREE.BoxGeometry(0.025, strLen, 0.025), stringMat);
        str.position.set(sx * (w / 2 - 0.35), h / 2 + strLen / 2, 0);
        grp.add(str);
      });
      scene.add(grp);
      posters.push({ grp: grp, baseY: y, phase: i * 1.3 });
    });
    // sparkles drifting around the hero entrance poster
    var N = 48, pos = new Float32Array(N * 3);
    sparkleSpeed = new Float32Array(N);
    for (var k = 0; k < N; k++) {
      pos[k * 3] = (Math.random() * 2 - 1) * 1.6;
      pos[k * 3 + 1] = 2.5 + Math.random() * 1.0;
      pos[k * 3 + 2] = (Math.random() * 2 - 1) * 0.7;
      sparkleSpeed[k] = 0.15 + Math.random() * 0.35;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    sparkles = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xd9f99d, size: 0.06, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    }));
    scene.add(sparkles);
  }

  // ---------- furniture (v7) ----------
  // Every room gets a table + chairs, tucked against a side wall below
  // the frames so nothing is hidden. The Resume room is a study (desk,
  // bookshelf, lamp, laptop); the Work room is a TV lounge (big screen
  // cycling the projects + sofa); the Stack room is a kitchen (shelves
  // of labelled boxes, one box per tool — like jars in a cupboard).
  var woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3220, roughness: 0.8, metalness: 0 });
  var woodDark = new THREE.MeshStandardMaterial({ color: 0x241a12, roughness: 0.85, metalness: 0 });
  var fabricMat = new THREE.MeshStandardMaterial({ color: 0x1e1e26, roughness: 1, metalness: 0 });
  var cushionMat = new THREE.MeshStandardMaterial({ color: 0x2e2e3a, roughness: 1, metalness: 0 });
  var shelfMat = new THREE.MeshStandardMaterial({ color: 0x191919, roughness: 0.9, metalness: 0.1 });
  var limeTrimMat = new THREE.MeshBasicMaterial({ color: 0xa3e635 });
  var limeDouble = new THREE.MeshBasicMaterial({ color: 0xa3e635, side: THREE.DoubleSide });
  var BOOK_COLORS = [0xa3e635, 0x2563eb, 0xd97706, 0xe11d48, 0x0d9488, 0x7c3aed, 0xf5f5f5, 0x65a30d];

  function boxMesh(w, h, d, mat, x, y, z, parent) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || scene).add(m);
    return m;
  }
  function makeTable(x, z, ry, w, d, h) {
    w = w || 0.85; d = d || 1.35; h = h || 0.75;
    var g = new THREE.Group();
    g.position.set(x, 0, z); g.rotation.y = ry || 0;
    var top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, d), woodMat);
    top.position.y = h - 0.035; g.add(top);
    var edge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, d), limeTrimMat);
    edge.position.y = h - 0.08; g.add(edge);
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(function (s) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, h - 0.07, 0.07), woodDark);
      leg.position.set(s[0] * (w / 2 - 0.06), (h - 0.07) / 2, s[1] * (d / 2 - 0.06));
      g.add(leg);
    });
    scene.add(g);
    return g;
  }
  function makeChair(x, z, ry) {
    var g = new THREE.Group();
    g.position.set(x, 0, z); g.rotation.y = ry || 0;
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.46), fabricMat);
    seat.position.y = 0.45; g.add(seat);
    var back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.55, 0.05), fabricMat);
    back.position.set(0, 0.74, -0.205); g.add(back);
    var strip = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.055), limeTrimMat);
    strip.position.set(0, 1.0, -0.205); g.add(strip);
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(function (s) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.05), woodDark);
      leg.position.set(s[0] * 0.19, 0.225, s[1] * 0.19);
      g.add(leg);
    });
    scene.add(g);
    return g;
  }
  function tableSet(x, z, side) {
    // side -1 = table on the left wall (chairs face -x), +1 = right wall
    makeTable(x, z, 0);
    var cx = x - side * 0.78;
    makeChair(cx, z - 0.55, side > 0 ? Math.PI / 2 : -Math.PI / 2);
    makeChair(cx, z + 0.55, side > 0 ? Math.PI / 2 : -Math.PI / 2);
  }
  function makeSofa(x, z) {
    var g = new THREE.Group();
    g.position.set(x, 0, z);
    var base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.38, 0.9), fabricMat);
    base.position.y = 0.26; g.add(base);
    var back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.72, 0.24), fabricMat);
    back.position.set(0, 0.62, 0.33); g.add(back);
    [-1, 1].forEach(function (s) {
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.5, 0.9), fabricMat);
      arm.position.set(s * 0.88, 0.5, 0); g.add(arm);
      var cu = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.78), cushionMat);
      cu.position.set(s * 0.42, 0.5, -0.02); g.add(cu);
    });
    var pillow = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.12), limeTrimMat);
    pillow.position.set(-0.55, 0.62, 0.18); pillow.rotation.z = 0.15; g.add(pillow);
    scene.add(g);
    return g;
  }
  // TV screen cycling through the projects (Work room = TV lounge)
  var tvCanvas = null, tvCtx = null, tvTex = null, tvIdx = 0;
  function drawTV() {
    if (!tvCtx || !work.length) return;
    var W = 1024, H = 576, ctx = tvCtx;
    ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#a3e635";
    ctx.font = "700 30px 'JetBrains Mono', monospace";
    ctx.fillText("SELECTED WORK", 48, 64);
    var pj = work[tvIdx % work.length];
    ctx.fillStyle = "#ffffff";
    var sz = fitFont(ctx, pj.title, W - 96, 84, 34, "800", "Inter, system-ui, sans-serif");
    ctx.font = "800 " + sz + "px Inter, system-ui, sans-serif";
    ctx.fillText(pj.title, 48, 170);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "28px Inter, system-ui, sans-serif";
    wrapText(ctx, pj.desc, W - 96).slice(0, 2).forEach(function (ln, i) {
      ctx.fillText(ln, 48, 230 + i * 40);
    });
    ctx.fillStyle = "#a3e635";
    ctx.font = "600 26px 'JetBrains Mono', monospace";
    ctx.fillText((pj.tags || []).slice(0, 4).join("  ·  "), 48, 340);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "24px 'JetBrains Mono', monospace";
    ctx.fillText(((tvIdx % work.length) + 1) + " / " + work.length + "  —  click a frame to open", 48, H - 48);
    tvTex.needsUpdate = true;
  }
  function buildTV() {
    var frame = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.0, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.4 }));
    frame.position.set(-4.0, 1.9, -43.92);
    scene.add(frame);
    tvCanvas = document.createElement("canvas");
    tvCanvas.width = 1024; tvCanvas.height = 576;
    tvCtx = tvCanvas.getContext("2d");
    tvTex = new THREE.CanvasTexture(tvCanvas);
    if (THREE.SRGBColorSpace) tvTex.colorSpace = THREE.SRGBColorSpace;
    var screen = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8),
      new THREE.MeshBasicMaterial({ map: tvTex }));
    screen.position.set(-4.0, 1.9, -43.86);
    scene.add(screen);
    boxMesh(2.4, 0.38, 0.5, woodDark, -4.0, 0.19, -43.6);
    drawTV();
    setInterval(function () { tvIdx++; drawTV(); }, 3000);
  }
  // Study room (Resume room): desk, laptop, books, lamp, bookshelf
  function buildStudy() {
    var rz = -104;
    makeTable(4.6, rz, 0, 0.8, 1.9, 0.78);
    boxMesh(0.6, 0.4, 0.7, woodDark, 4.6, 0.5, rz - 0.55);
    makeChair(3.9, rz, Math.PI / 2);
    var lap = new THREE.Group();
    lap.position.set(4.6, 0.79, rz - 0.3);
    var lbase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.6 }));
    lap.add(lbase);
    var lscr = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.26), limeDouble);
    lscr.position.set(0, 0.14, -0.14);
    lscr.rotation.y = -Math.PI / 2; lscr.rotation.x = -0.2;
    lap.add(lscr);
    scene.add(lap);
    [[0, 0xa3e635, 0], [1, 0x2563eb, 0.12], [2, 0xd97706, -0.08]].forEach(function (b) {
      var bk = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.045, 0.24),
        new THREE.MeshStandardMaterial({ color: b[1], roughness: 0.8 }));
      bk.position.set(4.6, 0.8 + b[0] * 0.05, rz + 0.55);
      bk.rotation.y = b[2];
      scene.add(bk);
    });
    var lamp = new THREE.Group();
    lamp.position.set(4.6, 0.79, rz + 0.25);
    var lbase2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.03, 12), woodDark);
    lamp.add(lbase2);
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8), woodDark);
    stem.position.y = 0.16; lamp.add(stem);
    var shade = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.15, 12, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xa3e635, roughness: 0.6, side: THREE.DoubleSide }));
    shade.position.y = 0.36; lamp.add(shade);
    scene.add(lamp);
    var warm = new THREE.PointLight(0xffd9a0, 0.5, 3.5, 2);
    warm.position.set(4.6, 1.35, rz + 0.25);
    scene.add(warm);
    // open-front bookshelf on the end wall, left side
    var sh = new THREE.Group();
    sh.position.set(-4.0, 0, -111.5);
    var bk1 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.3, 0.05), shelfMat);
    bk1.position.set(0, 1.15, -0.125); sh.add(bk1);
    [-1, 1].forEach(function (s) {
      var side = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.3, 0.3), shelfMat);
      side.position.set(s * 0.825, 1.15, 0); sh.add(side);
    });
    var bot = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.3), shelfMat);
    bot.position.set(0, 0.025, 0); sh.add(bot);
    var top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.3), shelfMat);
    top.position.set(0, 2.275, 0); sh.add(top);
    var shelfYs = [0.45, 1.0, 1.55];
    shelfYs.forEach(function (sy) {
      var s2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.26), woodDark);
      s2.position.set(0, sy, 0); sh.add(s2);
    });
    for (var s = 0; s < 3; s++) {
      for (var k = 0; k < 8; k++) {
        var hh = 0.34 + ((s * 8 + k) % 3) * 0.04;
        var bk2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, hh, 0.2),
          new THREE.MeshStandardMaterial({ color: BOOK_COLORS[(s * 8 + k) % BOOK_COLORS.length], roughness: 0.85 }));
        bk2.position.set(-0.62 + k * 0.17, shelfYs[s] + hh / 2 + 0.02, 0.02);
        sh.add(bk2);
      }
    }
    scene.add(sh);
  }
  // Kitchen (Stack room): shelves of labelled boxes, one box per tool
  function boxLabel(text, color) {
    var c = document.createElement("canvas");
    c.width = 256; c.height = 128;
    var ctx = c.getContext("2d");
    ctx.fillStyle = color; ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    var sz = fitFont(ctx, text, 220, 44, 18, "800", "Inter, system-ui, sans-serif");
    ctx.font = "800 " + sz + "px Inter, system-ui, sans-serif";
    ctx.fillText(text, 128, 74);
    ctx.textAlign = "left";
    var t = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function buildKitchen() {
    var items = [];
    stack.forEach(function (g, gi) {
      var color = ["#65a30d", "#2563eb", "#0d9488"][gi % 3];
      g.tags.forEach(function (t) { items.push({ name: t, color: color, head: g.head }); });
    });
    var stackFrames = frames.filter(function (f) { return f.kind === "stack"; });
    function frameFor(head) {
      for (var i = 0; i < stackFrames.length; i++) {
        if (stackFrames[i].data.head === head) return stackFrames[i];
      }
      return stackFrames[0];
    }
    [-1, 1].forEach(function (side) {
      var rx = side * 4.7, rz = -66.3;
      [-2.5, 2.5].forEach(function (dz) {
        boxMesh(0.55, 2.15, 0.06, shelfMat, rx, 1.075, rz + dz);
      });
      [0.5, 1.05, 1.6].forEach(function (sy) {
        boxMesh(0.55, 0.05, 5.0, shelfMat, rx, sy, rz);
      });
      boxMesh(0.55, 0.05, 5.0, shelfMat, rx, 2.15, rz);
      for (var s = 0; s < 3; s++) {
        for (var k = 0; k < 4; k++) {
          var idx = (side < 0 ? 0 : 12) + s * 4 + k;
          var item = items[idx];
          if (!item) break;
          var bz = rz - 1.8 + k * 1.2;
          var by = [0.5, 1.05, 1.6][s] + 0.26;
          var bmat = new THREE.MeshStandardMaterial({ color: new THREE.Color(item.color), roughness: 0.7, metalness: 0.1 });
          var b = boxMesh(0.45, 0.46, 0.85, bmat, rx, by, bz);
          var lab = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4),
            new THREE.MeshBasicMaterial({ map: boxLabel(item.name, item.color) }));
          lab.position.set(rx - side * 0.24, by, bz);
          lab.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
          scene.add(lab);
          var fr = frameFor(item.head);
          if (fr) {
            b.userData.frame = fr; frameMeshes.push(b);
            lab.userData.frame = fr; frameMeshes.push(lab);
          }
        }
      }
    });
  }
  function buildFurniture() {
    tableSet(4.7, 1.5, 1);       // hero
    tableSet(-4.7, -16, -1);     // about
    tableSet(4.7, -26, 1);       // work entry table (TV lounge adds sofa + screen)
    tableSet(-4.7, -52, -1);     // services
    tableSet(-4.7, -62.6, -1);   // stack (kitchen adds the shelves)
    tableSet(4.7, -80, 1);       // process
    tableSet(-4.7, -92, -1);     // stats
    tableSet(4.7, -118, 1);      // contact
    buildStudy();                // resume room = study room
    buildTV();                   // work room = TV lounge
    makeSofa(-3.4, -40.2);
    makeTable(-3.4, -42.2, 0, 0.6, 1.1, 0.45); // coffee table
    buildKitchen();              // stack room = kitchen
  }

  // ---------- people (v8) ----------
  // The portfolio as a working company: 3–4 people in every room.
  // The owner meets two colleagues in the hero room; every project has
  // two people discussing it; the kitchen has cooks at the shelves; the
  // contact room has customer service, email and WhatsApp handlers.
  var people = [];
  var SKIN = [0xd9a986, 0xc9a186, 0x8d5a3b, 0xe8b98a];
  var SHIRTS = [0x2f6fed, 0x16a34a, 0xd97706, 0x7c3aed, 0xe11d48, 0x0d9488, 0x334155, 0x65a30d];
  function makePerson(o) {
    var g = new THREE.Group();
    var shirt = new THREE.MeshStandardMaterial({ color: o.shirt != null ? o.shirt : SHIRTS[Math.floor(Math.random() * SHIRTS.length)], roughness: 0.9 });
    var skin = new THREE.MeshStandardMaterial({ color: o.skin != null ? o.skin : SKIN[Math.floor(Math.random() * SKIN.length)], roughness: 0.8 });
    var pants = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.95 });
    var hairM = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
    if (o.seated) {
      var thigh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.13, 0.42), pants);
      thigh.position.set(0, 0.42, 0.14); g.add(thigh);
      var torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.26), shirt);
      torso.position.set(0, 0.74, 0); g.add(torso);
      var head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, 0.26), skin);
      head.position.set(0, 1.14, 0); g.add(head);
      var hair = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.28), hairM);
      hair.position.set(0, 1.31, 0); g.add(hair);
      if (o.headset) {
        var band = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.28), hairM);
        band.position.set(0, 1.32, 0); g.add(band);
        var mic = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.16), hairM);
        mic.position.set(0.14, 1.04, 0.14); g.add(mic);
      }
      [-1, 1].forEach(function (sx) {
        var arm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.38, 0.09), shirt);
        arm.position.set(sx * 0.25, 0.72, 0.16);
        arm.rotation.x = -0.8;
        g.add(arm);
      });
      if (o.laptop) {
        var lb = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.26),
          new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.5 }));
        lb.position.set(0, 0.52, 0.3); g.add(lb);
        var ls = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.22), limeDouble);
        ls.position.set(0, 0.62, 0.2); ls.rotation.x = -0.35;
        g.add(ls);
      }
    } else {
      var legs = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.78, 0.2), pants);
      legs.position.set(0, 0.39, 0); g.add(legs);
      var torso2 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.6, 0.28), shirt);
      torso2.position.set(0, 1.08, 0); g.add(torso2);
      var head2 = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.3, 0.27), skin);
      head2.position.set(0, 1.53, 0); g.add(head2);
      var hair2 = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.09, 0.29), hairM);
      hair2.position.set(0, 1.71, 0); g.add(hair2);
      [-1, 1].forEach(function (sx) {
        var arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.5, 0.09), shirt);
        arm2.position.set(sx * 0.27, 1.08, 0);
        arm2.rotation.z = sx * 0.08;
        if (o.point && sx === 1) { arm2.position.set(0.27, 1.25, 0.18); arm2.rotation.x = -1.1; }
        g.add(arm2);
      });
      if (o.phone) {
        var ph = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.03),
          new THREE.MeshStandardMaterial({ color: 0x25d366, roughness: 0.5 }));
        ph.position.set(0.3, 1.15, 0.22); ph.rotation.x = -0.3;
        g.add(ph);
      }
    }
    g.scale.setScalar(o.scale || 1);
    g.position.set(o.x, 0, o.z);
    g.rotation.y = o.ry || 0;
    g.userData.phase = Math.random() * Math.PI * 2;
    scene.add(g);
    people.push(g);
    return g;
  }
  function roleLabel(text, x, y, z) {
    var c = document.createElement("canvas");
    c.width = 512; c.height = 96;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(10,10,10,0.85)";
    roundRect(ctx, 4, 4, 504, 88, 40); ctx.fill();
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 4;
    roundRect(ctx, 4, 4, 504, 88, 40); ctx.stroke();
    ctx.fillStyle = "#a3e635";
    ctx.textAlign = "center";
    var sz = fitFont(ctx, text, 460, 40, 18, "700", "Inter, system-ui, sans-serif");
    ctx.font = "700 " + sz + "px Inter, system-ui, sans-serif";
    ctx.fillText(text, 256, 60);
    ctx.textAlign = "left";
    var t = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    var m = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.22),
      new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  }
  function buildPeople() {
    // hero: the owner (black shirt, taller) in a meeting with two colleagues
    makePerson({ x: 4.7, z: 2.9, ry: Math.PI, shirt: 0x111111, scale: 1.08 });
    makePerson({ x: 3.92, z: 0.95, ry: Math.PI / 2, seated: true, laptop: true });
    makePerson({ x: 3.92, z: 2.05, ry: Math.PI / 2, seated: true });
    // about: two working at the table, one standing by the frames
    makePerson({ x: -3.92, z: -16.55, ry: -Math.PI / 2, seated: true, laptop: true });
    makePerson({ x: -3.92, z: -15.45, ry: -Math.PI / 2, seated: true });
    makePerson({ x: -4.3, z: -14.6, ry: -Math.PI / 2, point: true });
    // work: two people discussing in front of every project frame
    frames.forEach(function (f) {
      if (f.kind !== "project") return;
      var side = f.x < 0 ? -1 : 1;
      var px = f.x - side * 0.85;
      makePerson({ x: px, z: f.z - 0.85, ry: side > 0 ? Math.PI / 2 : -Math.PI / 2, point: true });
      makePerson({ x: px, z: f.z + 0.85, ry: side > 0 ? Math.PI / 2 : -Math.PI / 2 });
    });
    // services: two at the table, one standing
    makePerson({ x: -3.92, z: -52.55, ry: -Math.PI / 2, seated: true, laptop: true });
    makePerson({ x: -3.92, z: -51.45, ry: -Math.PI / 2, seated: true });
    makePerson({ x: -4.3, z: -50.6, ry: -Math.PI / 2, point: true });
    // stack / kitchen: cooks at the shelves + one at the kitchen table
    makePerson({ x: -4.05, z: -65, ry: -Math.PI / 2, point: true });
    makePerson({ x: 4.05, z: -67.5, ry: Math.PI / 2 });
    makePerson({ x: -3.92, z: -62.05, ry: -Math.PI / 2, seated: true });
    // process: two at the table, one standing
    makePerson({ x: 3.92, z: -80.55, ry: Math.PI / 2, seated: true, laptop: true });
    makePerson({ x: 3.92, z: -79.45, ry: Math.PI / 2, seated: true });
    makePerson({ x: 4.3, z: -78.6, ry: Math.PI / 2, point: true });
    // stats: two at the table, one facing the board
    makePerson({ x: -3.92, z: -92.55, ry: -Math.PI / 2, seated: true, laptop: true });
    makePerson({ x: -3.92, z: -91.45, ry: -Math.PI / 2, seated: true });
    makePerson({ x: -3.5, z: -90.5, ry: Math.PI });
    // resume / study: one at the desk, one at the bookshelf, one discussing
    makePerson({ x: 3.9, z: -104, ry: Math.PI / 2, seated: true, laptop: true });
    makePerson({ x: -3.3, z: -111, ry: Math.PI, point: true });
    makePerson({ x: 3.6, z: -105.8, ry: 0 });
    // contact: customer service (headset), email, WhatsApp (phone)
    makePerson({ x: 3.92, z: -118.55, ry: Math.PI / 2, seated: true, laptop: true, headset: true });
    roleLabel("Customer Service", 3.92, 1.85, -118.55);
    makePerson({ x: 3.92, z: -117.45, ry: Math.PI / 2, seated: true, laptop: true });
    roleLabel("Email", 3.92, 1.85, -117.45);
    makePerson({ x: -1.2, z: -121, ry: 0, phone: true });
    roleLabel("WhatsApp", -1.2, 2.0, -121);
  }

  // ---------- guide robot (v6; v7: no speech bubble — robot only) ----------
  // A small robot runs on the lime track line ahead of the camera.
  var robot = null, robotRun = 0, robotZ = Z_MAX - 3.5;
  function buildRobot() {
    robot = new THREE.Group();
    // the face is on the +z side: the camera follows behind the robot, so
    // the glowing eyes must look back at you, not away from you
    var dark = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.4 });
    var lime = new THREE.MeshBasicMaterial({ color: 0xa3e635 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.4, 0.24), dark);
    body.position.y = 0.36; robot.add(body);
    var chest = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), lime);
    chest.position.set(0, 0.38, 0.125); robot.add(chest);
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.24), dark);
    head.position.y = 0.68; robot.add(head);
    [-0.07, 0.07].forEach(function (ex) {
      var eye = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.09), lime);
      eye.position.set(ex, 0.7, 0.125); robot.add(eye);
    });
    var glow = new THREE.PointLight(0xa3e635, 0.6, 3.5, 2);
    glow.position.set(0, 0.85, 0.3); robot.add(glow);
    var ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 6), dark);
    ant.position.y = 0.88; robot.add(ant);
    var tip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), lime);
    tip.position.y = 0.97; robot.add(tip);
    [-1, 1].forEach(function (sx) {
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.28, 0.07), dark);
      arm.position.set(sx * 0.22, 0.38, 0); arm.rotation.z = -sx * 0.25; robot.add(arm);
      var foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.2), dark);
      foot.position.set(sx * 0.09, 0.035, 0); robot.add(foot);
    });
    robot.scale.setScalar(0.8);
    robot.position.set(0, 0, robotZ);
    scene.add(robot);
  }

  // ---------- overlay / chips / modal ----------
  var roomEl = document.getElementById("tourRoom");
  var titleEl = document.getElementById("tourTitle");
  var countEl = document.getElementById("tourCount");
  var progEl = document.getElementById("tourProgress");
  var chipsBox = document.getElementById("tourChips");
  var modal = document.getElementById("tourModal");
  var chipBtns = [];
  ROOMS.forEach(function (r) {
    var b = document.createElement("button");
    b.className = "tour-chip";
    b.textContent = r.name;
    b.addEventListener("click", function () { jumpTo(r); });
    chipsBox.appendChild(b);
    chipBtns.push(b);
  });

  function modalOpen(html) {
    document.getElementById("tourModalBody").innerHTML = html;
    modal.hidden = false;
  }
  function modalClose() { modal.hidden = true; }
  document.getElementById("tourClose").addEventListener("click", modalClose);
  document.getElementById("tourBackdrop").addEventListener("click", modalClose);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") modalClose();
  });

  function linksHtml(links, note) {
    var out = "";
    (links || []).forEach(function (l) {
      out += '<a class="t-link" href="' + esc(l.href) + '" target="_blank" rel="noopener">' + esc(l.text) + ' \u2197</a>';
    });
    if (!out && note) out = '<span class="muted">' + esc(note) + "</span>";
    return out ? '<div class="work-links">' + out + "</div>" : "";
  }
  function tagsHtml(tags) {
    if (!tags || !tags.length) return "";
    return '<div class="tags">' + tags.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>";
  }
  function openFrame(f) {
    var d = f.data, html = "";
    if (f.kind === "hero") {
      html = '<p class="g3d-tag mono">' + esc("Ahmad Raza — Portfolio") + "</p><h3>" + esc(hero.h1) + "</h3>" +
        "<p>" + esc(hero.lede) + "</p><p class=\"muted\">" + esc(hero.roles.join("  ·  ")) + "</p>" +
        '<div class="work-links"><a class="t-link" href="#" data-jump="work">View my work \u2192</a>' +
        '<a class="t-link" href="' + esc(hero.github) + '" target="_blank" rel="noopener">GitHub \u2197</a></div>';
    } else if (f.kind === "portrait") {
      html = '<p class="g3d-tag mono">About</p><h3>Ahmad Raza</h3><p>' + esc(about.paras.join(" ")) + "</p>" + tagsHtml(about.pills);
    } else if (f.kind === "terminal") {
      html = '<p class="g3d-tag mono">Terminal</p><h3>$ whoami</h3>' +
        hero.term.map(function (l) { return "<p class=\"mono\">" + esc(l) + "</p>"; }).join("");
    } else if (f.kind === "about") {
      html = '<p class="g3d-tag mono">About</p><h3>Design eye. <span class="accent">Developer hands.</span></h3>' +
        about.paras.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + tagsHtml(about.pills);
    } else if (f.kind === "facts") {
      html = '<p class="g3d-tag mono">Quick facts</p><h3>Ahmad Raza</h3>' +
        about.facts.map(function (x) { return "<p><strong>" + esc(x.k) + ":</strong> " + esc(x.v) + "</p>"; }).join("");
    } else if (f.kind === "project") {
      html = '<p class="g3d-tag mono">' + esc(d.tag) + "</p><h3>" + esc(d.title) + "</h3><p>" + esc(d.desc) + "</p>" +
        tagsHtml(d.tags) + linksHtml(d.links, d.note);
    } else if (f.kind === "service") {
      html = '<p class="g3d-tag mono">Service</p><h3>' + esc(d.title) + "</h3><p>" + esc(d.desc) + "</p>" +
        '<div class="work-links"><a class="t-link" href="' + esc(contact.wa) + '" target="_blank" rel="noopener">Discuss this on WhatsApp \u2197</a></div>';
    } else if (f.kind === "stack") {
      html = '<p class="g3d-tag mono">My stack</p><h3>' + esc(d.head) + "</h3>" + tagsHtml(d.tags);
    } else if (f.kind === "step") {
      html = '<p class="g3d-tag mono">Step ' + esc(d.num) + '</p><h3>' + esc(d.title) + "</h3><p>" + esc(d.desc) + "</p>";
    } else if (f.kind === "stats") {
      html = '<p class="g3d-tag mono">By the numbers</p><h3>Things I\u2019ve built &amp; shipped.</h3>' +
        stats.map(function (st) { return "<p><strong>" + esc(st.num) + "</strong> — " + esc(st.label) + "</p>"; }).join("");
    } else if (f.kind === "badge") {
      html = '<p class="g3d-tag mono">Status</p><h3>Open to Work</h3><p>' + esc(hero.badge) + "</p>" +
        '<div class="work-links"><a class="t-link" href="' + esc(contact.wa) + '" target="_blank" rel="noopener">Hire me \u2197</a></div>';
    } else if (f.kind === "resume") {
      html = '<p class="g3d-tag mono">' + esc(d.head) + "</p><h3>" + esc(d.head) + "</h3>" +
        d.items.map(function (it) {
          var s = "<p><strong>" + esc(it.title) + "</strong><br><span class=\"muted\">" + esc(it.date) + " — " + esc(it.org) + "</span></p>";
          if (it.points.length) s += "<ul class=\"t-list\">" + it.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>";
          return s + tagsHtml(it.tags);
        }).join("");
    } else if (f.kind === "contact-wa") {
      html = '<p class="g3d-tag mono">WhatsApp</p><h3>+92 324 0790546</h3><p>Fastest way to reach me — tap below to start a chat.</p>' +
        '<div class="work-links"><a class="t-link" href="' + esc(contact.wa) + '" target="_blank" rel="noopener">Chat on WhatsApp \u2197</a></div>';
    } else if (f.kind === "contact-email") {
      html = '<p class="g3d-tag mono">Email</p><h3>razasardar722212@gmail.com</h3><p>For project enquiries, collaborations and quotes.</p>' +
        '<div class="work-links"><a class="t-link" href="mailto:' + esc(contact.email) + '">Email me \u2197</a></div>';
    } else if (f.kind === "contact") {
      html = '<p class="g3d-tag mono">Let\u2019s Work Together</p><h3>' + esc(contact.heading) + "</h3><p>" + esc(contact.text) + "</p>" +
        '<div class="work-links"><a class="t-link" href="' + esc(contact.wa) + '" target="_blank" rel="noopener">WhatsApp \u2197</a>' +
        '<a class="t-link" href="mailto:' + esc(contact.email) + '">Email \u2197</a></div>' +
        '<form class="t-form" id="tourContactForm"><input type="text" id="tcfName" placeholder="Your name" required>' +
        '<input type="email" id="tcfEmail" placeholder="Your email" required>' +
        '<textarea id="tcfMsg" rows="3" placeholder="Write your message here..." required></textarea>' +
        '<button class="btn btn-accent" type="submit">Send Message</button></form>';
    } else if (f.kind === "about-more") {
      html = '<p class="g3d-tag mono">About</p><h3>What I care about</h3>' +
        about.paras.slice(1).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + tagsHtml(about.pills);
    } else if (f.kind === "work-more") {
      html = '<p class="g3d-tag mono">Selected Work</p><h3>' + work.length + ' projects shipped</h3><p>Real products and client websites, built with React, Tailwind &amp; Supabase. Click any frame on the walls to open a project.</p>';
    } else if (f.kind === "services-more") {
      html = '<p class="g3d-tag mono">Services</p><h3>' + services.length + ' services</h3>' +
        services.map(function (s) { return "<p><strong>" + esc(s.title) + "</strong> — " + esc(s.desc) + "</p>"; }).join("");
    } else if (f.kind === "stack-more") {
      html = '<p class="g3d-tag mono">My stack</p><h3>' + totalTech + ' tools in my kit</h3>' +
        stack.map(function (g) { return "<p><strong>" + esc(g.head) + "</strong></p>" + tagsHtml(g.tags); }).join("");
    } else if (f.kind === "process-more") {
      html = '<p class="g3d-tag mono">Process</p><h3>From idea to launch</h3>' +
        process.map(function (st) { return "<p><strong>" + esc(st.num) + ". " + esc(st.title) + "</strong> — " + esc(st.desc) + "</p>"; }).join("");
    } else if (f.kind === "stat-side") {
      var leftM = d.side === "left";
      var ma = findStat(leftM ? "Projects Completed" : "Client Rating");
      var mb = findStat(leftM ? "Pending Projects" : "Client Trust");
      html = '<p class="g3d-tag mono">' + (leftM ? "Projects" : "Rating & Trust") + "</p><h3>By the numbers</h3>" +
        [ma, mb].filter(function (x) { return x; }).map(function (st) { return "<p><strong>" + esc(st.num) + "</strong> — " + esc(st.label) + "</p>"; }).join("");
    } else if (f.kind === "resume-more") {
      var jobM = resumeCols[0] && resumeCols[0].items[0];
      var eduM = resumeCols[1] && resumeCols[1].items[0];
      html = '<p class="g3d-tag mono">Experience</p><h3>Freelance Web Developer</h3>' +
        (jobM ? "<p><strong>" + esc(jobM.title) + "</strong><br><span class=\"muted\">" + esc(jobM.date) + " — " + esc(jobM.org) + "</span></p>" : "") +
        (eduM ? "<p><strong>" + esc(eduM.title) + "</strong><br><span class=\"muted\">" + esc(eduM.date) + " — " + esc(eduM.org) + "</span></p>" : "");
    }
    modalOpen(html);
    var jump = document.querySelector('#tourModalBody [data-jump]');
    if (jump) jump.addEventListener("click", function (e) {
      e.preventDefault();
      modalClose();
      var room = ROOMS.filter(function (r) { return r.id === jump.getAttribute("data-jump"); })[0];
      if (room) jumpTo(room);
    });
    var cf = document.getElementById("tourContactForm");
    if (cf) cf.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("tcfName").value.trim();
      var email = document.getElementById("tcfEmail").value.trim();
      var msg = document.getElementById("tcfMsg").value.trim();
      window.location.href = "mailto:" + contact.email + "?subject=" + encodeURIComponent("Project inquiry") +
        "&body=" + encodeURIComponent("Hi Ahmad,\n\n" + msg + "\n\n— " + name + " (" + email + ")");
    });
  }

  // ---------- camera + controls ----------
  var z = Z_MAX, targetZ = Z_MAX, yaw = 0, targetYaw = 0, lastDragAt = 0;
  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  var frameDim = new THREE.Color(0x262626);
  var nearestFrame = null, nearestRoom = ROOMS[0];

  function jumpTo(room) {
    targetZ = room.center;
    targetYaw = 0;
  }
  function roomAt(zz) {
    var best = ROOMS[0], bd = 1e9;
    ROOMS.forEach(function (r) {
      var d = Math.abs(r.center - zz);
      if (d < bd) { bd = d; best = r; }
    });
    return best;
  }
  function stepRoom(dir) {
    var cur = roomAt(targetZ);
    var i = clamp(ROOMS.indexOf(cur) + dir, 0, ROOMS.length - 1);
    jumpTo(ROOMS[i]);
  }

  canvas.addEventListener("wheel", function (e) {
    e.preventDefault();
    targetZ = clamp(targetZ - e.deltaY * 0.05, Z_MIN, Z_MAX);
  }, { passive: false });

  var dragging = false, moved = false, lastX = 0, lastY = 0, downX = 0, downY = 0;
  canvas.addEventListener("pointerdown", function (e) {
    dragging = true; moved = false;
    lastX = downX = e.clientX; lastY = downY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 8) moved = true;
    targetYaw = clamp(targetYaw + dx * 0.0035, -0.6, 0.6);
    targetZ = clamp(targetZ + dy * 0.04, Z_MIN, Z_MAX);
    lastX = e.clientX; lastY = e.clientY;
    lastDragAt = Date.now();
  });
  canvas.addEventListener("pointerup", function (e) {
    dragging = false;
    canvas.style.cursor = "grab";
    if (moved) return;
    var r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(frameMeshes);
    if (hits.length) openFrame(hits[0].object.userData.frame);
  });
  canvas.addEventListener("pointercancel", function () { dragging = false; canvas.style.cursor = "grab"; });

  document.getElementById("tourPrev").addEventListener("click", function () { stepRoom(-1); });
  document.getElementById("tourNext").addEventListener("click", function () { stepRoom(1); });
  document.addEventListener("keydown", function (e) {
    if (!body.classList.contains("tour-on") || !modal.hidden) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown") { targetZ = clamp(targetZ - 6, Z_MIN, Z_MAX); e.preventDefault(); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") { targetZ = clamp(targetZ + 6, Z_MIN, Z_MAX); e.preventDefault(); }
    else if (e.key === "Home") { targetZ = Z_MAX; }
    else if (e.key === "End") { targetZ = Z_MIN; }
  });

  // ---------- mode switching ----------
  var started = false, visible = true;
  function enterTour() {
    body.classList.add("tour-on");
    body.style.overflow = "hidden";
    wrap.hidden = false;
    if (!started) { started = true; start(); }
    resize();
  }
  function exitTour() {
    body.classList.remove("tour-on");
    body.style.overflow = "";
    wrap.hidden = true;
    modalClose();
  }
  if (enterBtn) enterBtn.addEventListener("click", enterTour);
  document.getElementById("tourExit").addEventListener("click", exitTour);

  // nav links + hero CTA jump the camera when the tour is on
  qa('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (!body.classList.contains("tour-on")) return;
      var map = { "#top": "hero", "#about": "about", "#work": "work", "#services": "services", "#stack": "stack", "#process": "process", "#resume": "resume", "#contact": "contact" };
      var room = ROOMS.filter(function (r) { return r.id === map[a.getAttribute("href")]; })[0];
      if (room) { e.preventDefault(); jumpTo(room); }
    });
  });

  // theme accent sync
  function refreshAccent() {
    accent = accentColor();
    runnerMat.color.copy(accent);
  }
  if (window.MutationObserver) {
    new MutationObserver(refreshAccent).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  // ---------- sizing + loop ----------
  function resize() {
    var w = canvas.clientWidth || wrap.clientWidth, h = canvas.clientHeight || wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // portrait phones see a much narrower slice of the room at a fixed
    // vertical FOV, so widen the FOV as the screen gets narrower
    var a = camera.aspect;
    camera.fov = a < 0.6 ? 78 : a < 0.85 ? 72 : a < 1.2 ? 64 : 55;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0.02 }).observe(wrap);
  }

  function updateOverlay() {
    var viewZ = z - 7;
    var best = null, bs = 1e9;
    frames.forEach(function (f) {
      var s = Math.abs(f.z - viewZ) + Math.abs(f.x) * 0.6;
      if (s < bs) { bs = s; best = f; }
    });
    nearestFrame = (best && bs < 7) ? best : null;
    nearestRoom = roomAt(z);
    roomEl.textContent = "Room " + (ROOMS.indexOf(nearestRoom) + 1) + " / " + ROOMS.length + " — " + nearestRoom.name;
    titleEl.textContent = nearestFrame ? nearestFrame.title : "";
    countEl.textContent = nearestFrame ? "" : "Scroll / drag to walk through";
    chipBtns.forEach(function (b, i) { b.classList.toggle("active", ROOMS[i] === nearestRoom); });
    var p = (Z_MAX - z) / (Z_MAX - Z_MIN);
    if (progEl) progEl.style.width = (p * 100).toFixed(1) + "%";
  }

  var bobPhase = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (!visible || wrap.hidden) return;
    z += (targetZ - z) * 0.09;
    if (Math.abs(targetZ - z) < 0.005) z = targetZ;
    if (Date.now() - lastDragAt > 1400) targetYaw *= 0.94;
    yaw += (targetYaw - yaw) * 0.1;
    var speed = Math.abs(targetZ - z);
    bobPhase += 0.12 + speed * 0.05;
    var bob = speed > 0.05 ? Math.sin(bobPhase) * 0.02 : 0;
    camera.position.set(0, 1.7 + bob, z);
    camera.lookAt(Math.sin(yaw) * 8, 1.45, z - Math.cos(yaw) * 8);
    // hanging posters sway gently in the air; sparkles drift and twinkle
    var now = performance.now() / 1000;
    posters.forEach(function (p) {
      p.grp.position.y = p.baseY + Math.sin(now * 1.1 + p.phase) * 0.07;
      p.grp.rotation.z = Math.sin(now * 0.8 + p.phase) * 0.025;
      p.grp.rotation.y = Math.sin(now * 0.5 + p.phase) * 0.06;
    });
    if (sparkles) {
      var arr = sparkles.geometry.attributes.position.array;
      for (var si = 0; si < sparkleSpeed.length; si++) {
        arr[si * 3 + 1] += sparkleSpeed[si] * 0.016;
        if (arr[si * 3 + 1] > 3.95) arr[si * 3 + 1] = 2.1;
      }
      sparkles.geometry.attributes.position.needsUpdate = true;
      sparkles.material.opacity = 0.6 + 0.3 * Math.sin(now * 2.2);
    }
    updateOverlay();
    // guide robot runs on the track line ahead of the camera, bobbing as it goes
    if (robot) {
      var wantZ = clamp(z - 3.5, Z_MIN + 0.5, Z_MAX - 0.5);
      var dz = wantZ - robotZ;
      robotZ += dz * 0.08;
      var moving = Math.abs(dz) > 0.02;
      robotRun += moving ? 0.35 : 0.06;
      // the robot always faces you (the camera) like a tour guide
      robot.rotation.y = 0;
      robot.position.z = robotZ;
      robot.position.y = moving ? Math.abs(Math.sin(robotRun)) * 0.06 : Math.sin(now * 2) * 0.015;
    }
    // people idle: a gentle bob so the office feels alive
    people.forEach(function (p) {
      p.position.y = Math.sin(now * 1.6 + p.userData.phase) * 0.012;
    });
    frames.forEach(function (f) {
      var want = (f === nearestFrame) ? 1.14 : 1;
      f.scale += (want - f.scale) * 0.12;
      f.holder.scale.setScalar(f.scale);
      var wantColor = (f === nearestFrame) ? accent : frameDim;
      f.borderColor.lerp(wantColor, 0.12);
      f.border.material.color.copy(f.borderColor);
    });
    renderer.render(scene, camera);
  }

  // ---------- start ----------
  function start() {
    buildFrames();
    buildPosters();
    buildRobot();
    buildFurniture();
    buildPeople();
    resize();
    animate();
  }
  function ready() {
    var done = false;
    var go = function () { if (!done) { done = true; enterTour(); } };
    var waits = [];
    if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);
    if (hero.photo && !hero.photo.complete) {
      waits.push(new Promise(function (res) {
        hero.photo.addEventListener("load", res, { once: true });
        hero.photo.addEventListener("error", res, { once: true });
        setTimeout(res, 1500);
      }));
    }
    if (waits.length) Promise.all(waits).then(go);
    setTimeout(go, 1500);
  }
  ready();
})();
