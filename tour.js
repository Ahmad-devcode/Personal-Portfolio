// Ahmad Raza — Portfolio 3D tour (v4)
// The whole site as a walk-through gallery, like the "Websites in 2026" video:
// hero first, then every section is a room. Frames hang on the walls — click a
// frame to open that section's full details. Scroll / drag / arrow keys walk
// you through the rooms. The classic 2D site stays in the DOM as the data
// source (and as the fallback + "Classic view" toggle).
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
    return { num: txt("strong", s).replace(/\s+/g, ""), label: txt("span:last-child", s) };
  });
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
  // frame spec: x, z, rotY (0 = end wall facing camera, +PI/2 = left wall, -PI/2 = right wall)
  var frames = [];
  function F(x, z, rotY, w, h, kind, data) {
    frames.push({ x: x, z: z, rotY: rotY, w: w, h: h, kind: kind, data: data, title: data.title || data.name || kind });
  }
  // hero room (end wall z=-8)
  F(-3.9, -7.92, 0, 4.6, 2.9, "hero", { title: "Ahmad Raza — Web Developer" });
  F(3.9, -7.92, 0, 2.6, 2.6, "portrait", { title: "Ahmad Raza" });
  F(-5.92, -2, Math.PI / 2, 2.9, 1.8, "terminal", { title: "$ whoami" });
  // about room
  F(-5.92, -16, Math.PI / 2, 2.9, 1.8, "about", { title: "About — Design eye. Developer hands." });
  F(5.92, -16, -Math.PI / 2, 2.9, 1.8, "facts", { title: "Quick facts" });
  // work room (9 projects)
  var workZ = { left: [-27, -31, -35, -39, -43], right: [-29, -33, -37, -41] };
  work.forEach(function (pj, i) {
    var side = i % 2 === 0 ? "left" : "right";
    var list = side === "left" ? workZ.left : workZ.right;
    var idx = Math.floor(i / 2);
    F(side === "left" ? -5.92 : 5.92, list[idx], side === "left" ? Math.PI / 2 : -Math.PI / 2, 2.9, 1.8, "project", pj);
  });
  // services room
  services.forEach(function (s, i) {
    var side = i % 2 === 0 ? "left" : "right";
    var z = side === "left" ? [-47, -51, -55][Math.floor(i / 2)] : [-49, -53, -57][Math.floor(i / 2)];
    F(side === "left" ? -5.92 : 5.92, z, side === "left" ? Math.PI / 2 : -Math.PI / 2, 2.9, 1.8, "service", s);
  });
  // stack room
  stack.forEach(function (g, i) {
    var side = i % 2 === 0 ? "left" : "right";
    var z = side === "left" ? [-63, -67][Math.floor(i / 2)] : -65;
    F(side === "left" ? -5.92 : 5.92, z, side === "left" ? Math.PI / 2 : -Math.PI / 2, 2.9, 1.8, "stack", g);
  });
  // process room
  process.forEach(function (st, i) {
    var side = i % 2 === 0 ? "left" : "right";
    var z = side === "left" ? [-75, -79][Math.floor(i / 2)] : [-77, -81][Math.floor(i / 2)];
    F(side === "left" ? -5.92 : 5.92, z, side === "left" ? Math.PI / 2 : -Math.PI / 2, 2.9, 1.8, "step", st);
  });
  // stats room (end wall z=-96)
  F(-3.9, -95.92, 0, 4.6, 2.6, "stats", { title: "By the numbers" });
  F(3.9, -95.92, 0, 2.6, 1.8, "badge", { title: hero.badge });
  // resume room
  resumeCols.forEach(function (col, i) {
    F(i === 0 ? -5.92 : 5.92, -104, i === 0 ? Math.PI / 2 : -Math.PI / 2, 2.9, 1.8, "resume", col);
  });
  // contact room (end wall z=-124)
  F(-5.92, -117, Math.PI / 2, 2.9, 1.8, "contact-wa", { title: "WhatsApp" });
  F(5.92, -117, -Math.PI / 2, 2.9, 1.8, "contact-email", { title: "Email" });
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
  // generic text frame: tag on top, big title, up to 4 small lines, "click to open" footer
  function textTexture(o) {
    var W = o.W || 640, H = o.H || 400, s = W / 640;
    var b = baseCanvas(W, H, o.grad || "slate"), ctx = b.ctx;
    if (o.chrome) {
      ctx.fillStyle = "rgba(0,0,0,0.30)"; ctx.fillRect(0, 0, W, 44 * s);
      ["#ff5f57", "#febc2e", "#28c840"].forEach(function (col, i) {
        ctx.beginPath(); ctx.arc((30 + i * 24) * s, 22 * s, 7 * s, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      });
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.font = 17 * s + "px 'JetBrains Mono', monospace";
      ctx.fillText(o.chrome, 108 * s, 28 * s);
    }
    var y = (o.chrome ? 84 : 56) * s;
    if (o.tag) {
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "700 " + 19 * s + "px Inter, system-ui, sans-serif";
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
        wrapText(ctx, ln, W - 80 * s).slice(0, 1).forEach(function (l2) { ctx.fillText(l2, 40 * s, y + 24 * s); y += 30 * s; });
      });
    }
    if (o.pills) {
      var px = 40 * s, py = H - 62 * s;
      ctx.font = "600 " + 17 * s + "px Inter, system-ui, sans-serif";
      o.pills.slice(0, 3).forEach(function (t) {
        var w = ctx.measureText(t).width + 24 * s;
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
  function portraitTexture() {
    var S = 720;
    var b = baseCanvas(S, S, "slate"), ctx = b.ctx;
    var img = hero.photo;
    if (img && img.naturalWidth) {
      var iw = img.naturalWidth, ih = img.naturalHeight, side = Math.min(iw, ih);
      ctx.drawImage(img, (iw - side) / 2, (ih - side) / 2, side, side, 0, 0, S, S);
    } else {
      ctx.fillStyle = "#ffffff"; ctx.font = "800 64px Inter, sans-serif";
      ctx.fillText("Ahmad Raza", 60, S / 2);
    }
    ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(0, S - 96, S, 96);
    ctx.fillStyle = "#ffffff"; ctx.font = "700 34px Inter, sans-serif";
    ctx.fillText("Ahmad Raza", 40, S - 52);
    ctx.font = "26px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("React & Front-End Developer", 40, S - 18);
    return toTexture(b.c);
  }
  function statsTexture() {
    var W = 1024, H = 560, s = W / 640;
    var b = baseCanvas(W, H, "lime"), ctx = b.ctx;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "700 " + 19 * s + "px Inter, system-ui, sans-serif";
    ctx.fillText("BY THE NUMBERS", 40 * s, 64 * s);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 " + 34 * s + "px Inter, system-ui, sans-serif";
    ctx.fillText("Things I've built & shipped.", 40 * s, 116 * s);
    var colW = (W - 80 * s) / 4;
    stats.forEach(function (st, i) {
      var x = 40 * s + i * colW;
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 " + 64 * s + "px Inter, system-ui, sans-serif";
      ctx.fillText(st.num, x, 300 * s);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = 20 * s + "px Inter, system-ui, sans-serif";
      wrapText(ctx, st.label, colW - 16 * s).slice(0, 2).forEach(function (ln, j) {
        ctx.fillText(ln, x, 350 * s + j * 28 * s);
      });
    });
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = 17 * s + "px 'JetBrains Mono', monospace";
    ctx.fillText("CLICK TO OPEN \u2197", W - 40 * s - ctx.measureText("CLICK TO OPEN \u2197").width, H - 26 * s);
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
    updateOverlay();
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
