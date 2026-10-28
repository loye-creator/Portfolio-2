/* ------------------------------------------------------------------
   CONFIGURE THESE TWO LINES. Everything else runs on its own.

   FORM_ENDPOINT  where contact form submissions are sent.
                  Paste the Google Apps Script web app URL here
                  (see google-apps-script.gs for the five-minute
                  setup). Formspree, Basin and Web3Forms URLs also
                  work if you would rather use one of those.

                  IMPORTANT: while this is empty, the form falls
                  back to opening the visitor's mail app, which on
                  most phones and many desktops does nothing at all.
                  Enquiries are lost. Fill this in.

   GA_ID          your GA4 measurement ID. Only loads after someone
                  agrees to analytics. Leave empty for none.
------------------------------------------------------------------- */
var FORM_ENDPOINT = "";
var GA_ID = "";

/* ---------- theme ---------- */
(function () {
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

  function current() {
    var set = root.getAttribute("data-theme");
    if (set) return set;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  function label(btn) {
    var next = current() === "dark" ? "light" : "dark";
    btn.textContent = next === "light" ? "LIGHT" : "DARK";
    btn.setAttribute("aria-label", "Switch to " + next + " theme");
  }
  var btn = document.getElementById("theme");
  if (!btn) return;
  label(btn);
  btn.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    label(btn);
  });
})();

/* ==================================================================
   THE DANFO
   Lagos runs on danfo: yellow minibus, black stripes, fixed route.
   Built here as a real 3D model in three.js, with painted metal,
   glass, rubber and a contact shadow, lit by a key light and a sky
   fill. Scroll drives a camera along the stripe, into the doorway,
   around the front, then back out to the whole vehicle.

   Falls back silently to no vehicle if three.js cannot load: the
   scrim keeps the copy readable either way.
   ================================================================== */
(function () {
  var cv = document.getElementById("mark");
  var seq = document.querySelector(".seq");
  if (!cv || !seq || typeof THREE === "undefined") return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- renderer ---------- */
  var renderer = new THREE.WebGLRenderer({
    canvas: cv, antialias: true, alpha: true, powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

  /* ---------- materials ----------
     Painted metal needs a little metalness and a mid roughness, or it
     reads as plastic. Glass is dark and smooth. Rubber is neither. */
  var paint = new THREE.MeshStandardMaterial({
    color: 0xE8AE12, metalness: 0.38, roughness: 0.42
  });
  var paintWorn = new THREE.MeshStandardMaterial({
    color: 0xD79F0C, metalness: 0.30, roughness: 0.58
  });
  var black = new THREE.MeshStandardMaterial({
    color: 0x14130F, metalness: 0.26, roughness: 0.52
  });
  var glass = new THREE.MeshStandardMaterial({
    color: 0x2B3230, metalness: 0.65, roughness: 0.12
  });
  var chrome = new THREE.MeshStandardMaterial({
    color: 0xA8A79D, metalness: 0.88, roughness: 0.32
  });
  var rubber = new THREE.MeshStandardMaterial({
    color: 0x161614, metalness: 0.0, roughness: 0.92
  });
  var lamp = new THREE.MeshStandardMaterial({
    color: 0xFFF0C4, emissive: 0xFFD98A, emissiveIntensity: 0.9, roughness: 0.3
  });
  var lampRed = new THREE.MeshStandardMaterial({
    color: 0x8A1B12, emissive: 0xC62A18, emissiveIntensity: 0.55, roughness: 0.35
  });

  var bus = new THREE.Group();
  scene.add(bus);

  var L = 5.4, H = 2.38, W = 2.02;   // length, height, width in metres

  /* ---------- body shell ----------
     A side profile extruded across the width, with a bevel so the
     edges catch light instead of reading as cut card. */
  var s = new THREE.Shape();
  s.moveTo(-L / 2 + 0.10, 0.34);
  s.lineTo(-L / 2 + 0.02, 0.62);
  s.lineTo(-L / 2, H - 0.42);
  s.quadraticCurveTo(-L / 2 + 0.02, H - 0.06, -L / 2 + 0.34, H);   // rear roof corner
  s.lineTo(L / 2 - 0.40, H);
  s.quadraticCurveTo(L / 2 - 0.06, H - 0.02, L / 2 - 0.02, H - 0.46); // front roof corner
  s.lineTo(L / 2, 0.70);
  s.quadraticCurveTo(L / 2, 0.36, L / 2 - 0.22, 0.32);             // front lower
  s.lineTo(-L / 2 + 0.10, 0.34);

  var shell = new THREE.Mesh(
    new THREE.ExtrudeGeometry(s, {
      depth: W, bevelEnabled: true,
      bevelThickness: 0.045, bevelSize: 0.05, bevelSegments: 3, curveSegments: 10
    }), paint);
  shell.position.z = -W / 2;
  shell.castShadow = true;
  shell.receiveShadow = true;
  bus.add(shell);

  function slab(w, h, d, x, y, z, mat, shadow) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
    bus.add(m);
    return m;
  }

  /* ---------- the two stripes ----------
     Proud of the flanks by a couple of centimetres so they read as
     painted bands rather than fighting the body for the same pixels. */
  slab(L + 0.03, 0.235, W + 0.045, 0, 1.30, 0, black);
  slab(L + 0.03, 0.175, W + 0.045, 0, 0.74, 0, black);

  /* ---------- glazing ---------- */
  slab(3.55, 0.70, W + 0.055, -0.55, 1.80, 0, glass);        // side windows
  slab(0.10, 0.74, W - 0.22, L / 2 - 0.04, 1.80, 0, glass);  // windscreen
  slab(0.10, 0.62, W - 0.30, -L / 2 + 0.03, 1.78, 0, glass); // rear window

  // Pillars breaking up the side glass, so it is not one long slot.
  [-2.12, -0.92, 0.30, 1.22].forEach(function (x) {
    slab(0.075, 0.74, W + 0.06, x, 1.80, 0, paintWorn, false);
  });

  /* ---------- door seam, the way in ---------- */
  slab(0.045, 1.26, 0.03, 0.62, 1.30, W / 2 + 0.03, black, false);
  slab(0.045, 1.26, 0.03, -0.62, 1.30, W / 2 + 0.03, black, false);
  slab(1.24, 0.045, 0.03, 0, 0.44, W / 2 + 0.03, black, false);

  /* ---------- bumpers, lamps, trim ---------- */
  slab(0.16, 0.26, W - 0.10, L / 2 - 0.02, 0.44, 0, chrome);     // front bumper
  slab(0.16, 0.24, W - 0.12, -L / 2 + 0.02, 0.44, 0, chrome);    // rear bumper
  slab(0.09, 0.19, 0.42, L / 2 - 0.01, 0.86, W / 2 - 0.34, lamp);   // headlamps
  slab(0.09, 0.19, 0.42, L / 2 - 0.01, 0.86, -W / 2 + 0.34, lamp);
  slab(0.08, 0.15, 0.30, -L / 2 + 0.01, 0.88, W / 2 - 0.30, lampRed); // tail lamps
  slab(0.08, 0.15, 0.30, -L / 2 + 0.01, 0.88, -W / 2 + 0.30, lampRed);
  slab(0.52, 0.11, W - 0.46, L / 2 - 0.28, 0.60, 0, black, false);   // grille

  // Wing mirrors on stalks.
  [1, -1].forEach(function (side) {
    slab(0.07, 0.05, 0.26, L / 2 - 0.30, 1.86, side * (W / 2 + 0.14), chrome, false);
    slab(0.06, 0.26, 0.10, L / 2 - 0.30, 1.76, side * (W / 2 + 0.26), black, false);
  });

  // Roof rack rails, which almost every danfo carries.
  [0.52, -0.52].forEach(function (z) {
    slab(L - 1.3, 0.055, 0.07, -0.1, H + 0.07, z, black, false);
  });
  [-1.9, -0.5, 0.9].forEach(function (x) {
    slab(0.06, 0.055, 1.12, x, H + 0.07, 0, black, false);
  });

  /* ---------- wheels ---------- */
  var wheels = [];
  function wheel(x, z) {
    var g = new THREE.Group();
    var tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.26, 26), rubber);
    tyre.rotation.x = Math.PI / 2;
    tyre.castShadow = true;
    g.add(tyre);

    var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.28, 20), chrome);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);

    // Spokes, so rotation is actually visible.
    for (var i = 0; i < 5; i++) {
      var sp = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.34, 0.06), black);
      sp.rotation.z = (i / 5) * Math.PI * 2;
      sp.position.z = z > 0 ? 0.15 : -0.15;
      g.add(sp);
    }
    g.position.set(x, 0.43, z);
    bus.add(g);
    wheels.push(g);
  }
  wheel(1.74, W / 2 - 0.10); wheel(1.74, -W / 2 + 0.10);
  wheel(-1.68, W / 2 - 0.10); wheel(-1.68, -W / 2 + 0.10);

  // Arches, so the wheels look seated rather than stuck on.
  [1.74, -1.68].forEach(function (x) {
    slab(1.08, 0.10, W + 0.03, x, 0.90, 0, paintWorn, false);
  });

  /* ---------- ground shadow ---------- */
  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ opacity: 0.26 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ---------- lighting ---------- */
  var hemi = new THREE.HemisphereLight(0xFFF6E2, 0x6B6355, 0.85);
  scene.add(hemi);

  var key = new THREE.DirectionalLight(0xFFF1D6, 2.1);
  key.position.set(6.5, 8.5, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 32;
  key.shadow.camera.left = -8; key.shadow.camera.right = 8;
  key.shadow.camera.top = 8; key.shadow.camera.bottom = -8;
  key.shadow.bias = -0.0012;
  scene.add(key);

  var rim = new THREE.DirectionalLight(0xBFD4FF, 0.85);
  rim.position.set(-7, 4, -6);
  scene.add(rim);

  var fill = new THREE.DirectionalLight(0xFFFFFF, 0.35);
  fill.position.set(-2, 2.5, 7);
  scene.add(fill);

  /* ---------- theme ---------- */
  function applyTheme() {
    var dark = getComputedStyle(document.documentElement)
      .getPropertyValue("--bg").trim().toLowerCase().indexOf("#0f") === 0;
    hemi.intensity   = dark ? 0.42 : 0.85;
    key.intensity    = dark ? 1.55 : 2.1;
    rim.intensity    = dark ? 1.15 : 0.85;
    fill.intensity   = dark ? 0.22 : 0.35;
    ground.material.opacity = dark ? 0.42 : 0.26;
    lamp.emissiveIntensity = dark ? 1.5 : 0.9;
    renderer.toneMappingExposure = dark ? 1.18 : 1.05;
  }
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement,
    { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener
    && window.matchMedia("(prefers-color-scheme: dark)")
         .addEventListener("change", applyTheme);

  /* ---------- camera chapters ----------
     Each is a position and a point to look at. The copy beside the
     canvas is keyed to the same indices. */
  var SHOTS = [
    { p: [ 7.4, 2.70,  5.6], t: [ 0.0, 1.15,  0.0] },  // the whole danfo
    { p: [ 1.1, 1.32,  2.9], t: [-2.4, 1.08,  0.2] },  // along the belt stripe
    { p: [ 3.3, 1.45,  2.5], t: [-0.3, 1.15,  0.5] },  // onto the side door
    { p: [ 7.0, 1.60,  1.2], t: [ 1.2, 1.30,  0.0] },  // the blunt front
    { p: [-6.6, 3.20,  6.0], t: [ 0.0, 1.15,  0.0] }   // back out to the whole
  ];

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
  function camAt(p) {
    var n = SHOTS.length - 1;
    var scaled = Math.max(0, Math.min(0.9999, p)) * n;
    var i = Math.floor(scaled), local = scaled - i;
    var t = ease(Math.min(1, local / 0.55));
    var A = SHOTS[i], B = SHOTS[i + 1] || SHOTS[i];
    camPos.set(lerp(A.p[0], B.p[0], t), lerp(A.p[1], B.p[1], t), lerp(A.p[2], B.p[2], t));
    camTgt.set(lerp(A.t[0], B.t[0], t), lerp(A.t[1], B.t[1], t), lerp(A.t[2], B.t[2], t));
  }
  function chapterAt(p) {
    var n = SHOTS.length - 1;
    var scaled = Math.max(0, Math.min(0.9999, p)) * n;
    var i = Math.floor(scaled);
    return (scaled - i) > 0.45 ? i + 1 : i;
  }

  /* ---------- sizing ----------
     On desktop the copy occupies the left half, so the projection is
     shifted to seat the vehicle in the right half instead of dead
     centre. setViewOffset does this without moving the camera. */
  var w = 0, h = 0;
  function size() {
    w = cv.clientWidth; h = cv.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (w > 860) camera.setViewOffset(w, h, -Math.round(w * 0.19), 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", size);
  size();

  /* ---------- drive it from scroll ---------- */
  var chapters = seq.querySelectorAll(".seq-chapter");
  var current = -1, target = 0, shown = 0, ticking = false, clock = 0;

  function setChapter(i) {
    if (i === current) return;
    current = i;
    for (var c = 0; c < chapters.length; c++) {
      chapters[c].setAttribute("data-active", c === i ? "true" : "false");
    }
  }
  function measure() {
    var rect = seq.getBoundingClientRect();
    var total = seq.offsetHeight - window.innerHeight;
    var p = total > 0 ? (-rect.top) / total : 0;
    target = Math.max(0, Math.min(1, p));
    setChapter(chapterAt(target));
  }
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { measure(); ticking = false; });
  }, { passive: true });

  function draw() {
    camAt(shown);
    camera.position.copy(camPos);
    camera.lookAt(camTgt);
    renderer.render(scene, camera);
  }

  function loop() {
    shown += (target - shown) * 0.085;
    if (Math.abs(target - shown) < 0.0002) shown = target;

    if (!reduce) {
      clock += 0.016;
      // Idle: wheels turning over and the body breathing on its springs.
      for (var i = 0; i < wheels.length; i++) wheels[i].rotation.z -= 0.035;
      bus.position.y = Math.sin(clock * 2.3) * 0.012;
      bus.rotation.z = Math.sin(clock * 1.7) * 0.0022;
    }
    draw();
    requestAnimationFrame(loop);
  }

  measure();
  shown = target;
  if (reduce) {
    draw();
    window.addEventListener("scroll", function () { shown = target; draw(); }, { passive: true });
    window.addEventListener("resize", draw);
  } else {
    loop();
  }
})();

/* ==================================================================
   RIPPLE FIELD
   A grid of points sitting behind the whole page. The pointer pulls
   nearby points toward it and lifts them, and every move sheds a
   ring that travels outward and fades. On touch, where there is no
   pointer, rings spawn on tap and the field breathes on its own, so
   phones are not left with a dead background.

   Replaces the blinking node lattice. Nothing here pulses on a timer;
   the motion is a response to something, which is what stops it
   reading as a screensaver.
   ================================================================== */
(function () {
  var cv = document.getElementById("field");
  if (!cv) return;

  var ctx = cv.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer:fine)").matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var w = 0, h = 0, pts = [], ripples = [];
  var GAP = 42;              // grid spacing in CSS pixels
  var PULL = 150;            // how far the pointer reaches
  var mx = -9999, my = -9999, tmx = -9999, tmy = -9999;

  function tone(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  var dotTone = "0,0,0", accentTone = "0,0,0";
  function readTones() {
    // --m-body is the danfo yellow, already defined per theme.
    accentTone = tone("--m-body") || "237,178,0";
    dotTone = tone("--m-edge") || "19,19,9";
  }
  readTones();
  new MutationObserver(readTones).observe(document.documentElement,
    { attributes: true, attributeFilter: ["data-theme"] });

  function build() {
    w = window.innerWidth; h = window.innerHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    cv.style.width = w + "px"; cv.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    pts = [];
    var cols = Math.ceil(w / GAP) + 1;
    var rows = Math.ceil(h / GAP) + 1;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        pts.push({ x: c * GAP, y: r * GAP, ox: c * GAP, oy: r * GAP, e: 0 });
      }
    }
  }
  build();
  window.addEventListener("resize", build);

  function ring(x, y, strength) {
    if (ripples.length > 7) ripples.shift();
    ripples.push({ x: x, y: y, r: 0, max: 460, s: strength || 1 });
  }

  if (fine && !reduce) {
    var lastShed = 0;
    window.addEventListener("pointermove", function (e) {
      tmx = e.clientX; tmy = e.clientY;
      var now = performance.now();
      if (now - lastShed > 140) { ring(e.clientX, e.clientY, 0.5); lastShed = now; }
    }, { passive: true });
    window.addEventListener("pointerleave", function () { tmx = -9999; tmy = -9999; });
  }

  // Taps ripple on every device, including desktop.
  window.addEventListener("pointerdown", function (e) { ring(e.clientX, e.clientY, 1.5); }, { passive: true });

  // Touch devices get an occasional ripple from a random point so the
  // field is alive without a pointer to follow.
  var ambient = 0;
  function maybeAmbient() {
    if (fine || reduce) return;
    ambient--;
    if (ambient <= 0) {
      ring(Math.random() * w, Math.random() * h, 0.8);
      ambient = 150 + Math.random() * 180;
    }
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    mx += (tmx - mx) * 0.12;
    my += (tmy - my) * 0.12;
    maybeAmbient();

    var i, p, d;
    for (i = ripples.length - 1; i >= 0; i--) {
      ripples[i].r += 7.5;
      if (ripples[i].r > ripples[i].max) ripples.splice(i, 1);
    }

    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      var tx = p.ox, ty = p.oy, energy = 0;

      // Pointer pull: nearby points lean toward the cursor.
      if (!reduce) {
        var dx = mx - p.ox, dy = my - p.oy;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < PULL) {
          var f = (1 - d / PULL);
          tx += dx * f * 0.34;
          ty += dy * f * 0.34;
          energy = Math.max(energy, f);
        }

        // Ripple rings: a point lights and lifts as a ring passes it.
        for (var k = 0; k < ripples.length; k++) {
          var R = ripples[k];
          var rd = Math.sqrt((R.x - p.ox) * (R.x - p.ox) + (R.y - p.oy) * (R.y - p.oy));
          var band = Math.abs(rd - R.r);
          if (band < 44) {
            var life = 1 - R.r / R.max;
            var g = (1 - band / 44) * life * R.s;
            energy = Math.max(energy, g);
            if (rd > 0.01) {
              tx += ((p.ox - R.x) / rd) * g * 9;
              ty += ((p.oy - R.y) / rd) * g * 9;
            }
          }
        }
      }

      p.x += (tx - p.x) * 0.16;
      p.y += (ty - p.y) * 0.16;
      p.e += (energy - p.e) * 0.14;

      var size = 1.1 + p.e * 2.4;
      var alpha = 0.16 + p.e * 0.72;
      var col = p.e > 0.12 ? accentTone : dotTone;
      ctx.fillStyle = "rgba(" + col + "," + (alpha * (p.e > 0.12 ? 1 : 0.42)).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }

  if (reduce) {
    // Static grid, no motion at all.
    ctx.clearRect(0, 0, w, h);
    for (var j = 0; j < pts.length; j++) {
      ctx.fillStyle = "rgba(" + dotTone + ",0.07)";
      ctx.beginPath();
      ctx.arc(pts[j].x, pts[j].y, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    frame();
  }
})();

/* ---------- scroll progress ---------- */
(function () {
  var fill = document.getElementById("scroll-fill");
  if (!fill) return;
  function update() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    fill.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

/* ---------- split headline ---------- */
(function () {
  var titles = document.querySelectorAll(".split");
  if (!titles.length) return;
  for (var t = 0; t < titles.length; t++) {
    var words = titles[t].querySelectorAll(".word");
    for (var i = 0; i < words.length; i++) {
      words[i].style.transitionDelay = (i * 0.045) + "s";
    }
  }
  if (!("IntersectionObserver" in window)) {
    for (var a = 0; a < titles.length; a++) titles[a].classList.add("is-visible");
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    });
  }, { threshold: 0.2 });
  for (var b = 0; b < titles.length; b++) io.observe(titles[b]);
})();

/* ---------- scroll reveal ---------- */
(function () {
  var els = document.querySelectorAll("[data-reveal]");
  if (!els.length) return;
  if (!("IntersectionObserver" in window)) {
    for (var i = 0; i < els.length; i++) els[i].classList.add("is-visible");
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  for (var j = 0; j < els.length; j++) io.observe(els[j]);
})();

/* ---------- magnetic buttons ---------- */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(pointer:fine)").matches) return;
  var els = document.querySelectorAll("[data-magnetic]");
  var RANGE = 70, STRENGTH = 0.3;
  for (var i = 0; i < els.length; i++) {
    (function (el) {
      el.addEventListener("pointermove", function (ev) {
        var r = el.getBoundingClientRect();
        var dx = ev.clientX - (r.left + r.width / 2);
        var dy = ev.clientY - (r.top + r.height / 2);
        if (Math.sqrt(dx * dx + dy * dy) > RANGE) { el.style.transform = ""; return; }
        el.style.transform = "translate(" + (dx * STRENGTH).toFixed(1) + "px," + (dy * STRENGTH).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    })(els[i]);
  }
})();

/* ---------- contact form ---------- */
(function () {
  var form = document.getElementById("contact-form");
  if (!form) return;
  var status = document.getElementById("form-status");
  var send = document.getElementById("send");

  function fail(field, message) {
    field.parentNode.classList.add("invalid");
    field.parentNode.querySelector(".err").textContent = message;
    field.setAttribute("aria-invalid", "true");
  }
  function clear(field) {
    field.parentNode.classList.remove("invalid");
    field.parentNode.querySelector(".err").textContent = "";
    field.removeAttribute("aria-invalid");
  }
  function validate() {
    var ok = true;
    var name = form.name_, email = form.email, message = form.message;
    clear(name); clear(email); clear(message);
    if (!name.value.trim()) { fail(name, "Tell me who you are."); ok = false; }
    if (!email.value.trim()) {
      fail(email, "I need an address to reply to."); ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      fail(email, "That address is missing something. Check it over."); ok = false;
    }
    if (message.value.trim().length < 12) {
      fail(message, "A sentence or two is enough, but I need one."); ok = false;
    }
    return ok;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = "";
    if (!validate()) {
      status.textContent = "Some fields need attention before this can send.";
      form.querySelector(".invalid input, .invalid textarea").focus();
      return;
    }
    if (!FORM_ENDPOINT) {
      // Nothing is configured, so fall back to the visitor's mail app.
      // This is unreliable by nature: plenty of devices have no mail
      // client wired up and the click appears to do nothing. Set
      // FORM_ENDPOINT so this branch never runs.
      window.location.href = "mailto:davidakin6@gmail.com" +
        "?subject=" + encodeURIComponent("Project enquiry from " + form.name_.value.trim()) +
        "&body=" + encodeURIComponent(form.message.value.trim() + "\n\n" +
          form.name_.value.trim() +
          (form.company.value.trim() ? "\n" + form.company.value.trim() : "") +
          "\n" + form.email.value.trim());
      return;
    }
    send.setAttribute("aria-busy", "true");
    send.disabled = true;
    send.textContent = "Sending";
    status.textContent = "Sending your message.";

    // Content-Type is text/plain on purpose. Anything else (including
    // application/json) makes the browser fire a CORS preflight, which
    // Google Apps Script does not answer, so the request dies before it
    // is sent. text/plain is CORS-safelisted, so it goes straight
    // through, and the script reads the raw body as JSON anyway.
    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        name: form.name_.value.trim(),
        email: form.email.value.trim(),
        company: form.company.value.trim(),
        message: form.message.value.trim(),
        website: form.website ? form.website.value : "",
        source: window.location.hostname
      })
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      window.location.href = "/thank-you.html";
    }).catch(function () {
      send.removeAttribute("aria-busy");
      send.disabled = false;
      send.textContent = "Send message";
      status.textContent = "That did not go through. Email davidakin6@gmail.com directly and it will reach me.";
    });
  });
})();

/* ---------- analytics consent ---------- */
(function () {
  var bar = document.getElementById("consent");
  if (!bar || !GA_ID) return;
  var choice = null;
  try { choice = localStorage.getItem("analytics"); } catch (e) {}

  function load() {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { anonymize_ip: true });
  }

  if (choice === "yes") { load(); return; }
  if (choice === "no") return;
  bar.setAttribute("data-open", "true");

  document.getElementById("consent-yes").addEventListener("click", function () {
    try { localStorage.setItem("analytics", "yes"); } catch (e) {}
    bar.removeAttribute("data-open");
    load();
  });
  document.getElementById("consent-no").addEventListener("click", function () {
    try { localStorage.setItem("analytics", "no"); } catch (e) {}
    bar.removeAttribute("data-open");
  });
})();
