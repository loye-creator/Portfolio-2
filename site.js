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
   A Lagos danfo is a Volkswagen T3 Transporter in yellow with two
   black stripes, so that is what this models: raked windscreen, flat
   nose with a black grille band and round lamps, three side windows
   and a rear vent, black bumpers, steel wheels in proper arches.

   It drives into frame on load, its wheels turning by exactly the
   distance it travels, dips its nose as it brakes, then sits idling.
   Scrolling rolls it forward along the road while the camera moves
   through five chapters. Paint and glass reflect a generated studio
   environment, which is most of why it reads as an object rather
   than a drawing.

   If WebGL or three.js is unavailable the vehicle simply does not
   appear; the page and its copy are unaffected.
   ================================================================== */
(function () {
  var cv = document.getElementById("mark");
  var seq = document.querySelector(".seq");
  if (!cv || !seq || typeof THREE === "undefined") return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.toneMappingExposure = 0.86;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

  /* ---------- studio environment ----------
     A sky dome plus three soft boxes, baked into a reflection map.
     Without this, painted metal and glass have nothing to reflect
     and read as flat colour. */
  (function () {
    var pmrem = new THREE.PMREMGenerator(renderer);
    var env = new THREE.Scene();
    var R = 40;
    var dome = new THREE.SphereGeometry(R, 48, 24);
    var top = new THREE.Color(0xdde4ec), hor = new THREE.Color(0xfff3dc), gnd = new THREE.Color(0x3d3830);
    var c = new THREE.Color(), cols = [], p = dome.attributes.position;
    for (var i = 0; i < p.count; i++) {
      var y = p.getY(i) / R;
      if (y >= 0) c.copy(hor).lerp(top, Math.pow(y, 0.6));
      else c.copy(hor).lerp(gnd, Math.min(1, -y * 3));
      cols.push(c.r, c.g, c.b);
    }
    dome.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    env.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    function box(w, h, x, y, z, k) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
      m.material.color.setScalar(k);
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      env.add(m);
    }
    box(20, 6, 5, 24, 9, 3.6);    // overhead key
    box(10, 10, -20, 8, -5, 1.4); // back fill
    box(16, 4, 3, 6, 22, 2.0);    // low front strip, gives the side a long highlight
    scene.environment = pmrem.fromScene(env, 0.035).texture;
    pmrem.dispose();
  })();

  /* ---------- materials ---------- */
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function decal(m) {
    var d = m.clone();
    d.side = THREE.DoubleSide;
    d.polygonOffset = true;
    d.polygonOffsetFactor = -2;
    d.polygonOffsetUnits = -2;
    return d;
  }

  var paint = new THREE.MeshPhysicalMaterial({
    color: 0xE6A200, roughness: 0.36, metalness: 0.0,
    clearcoat: 0.85, clearcoatRoughness: 0.16, envMapIntensity: 0.45
  });
  var paintShade = decal(std({ color: 0x8A6200, roughness: 0.6 }));
  var black      = decal(std({ color: 0x121210, roughness: 0.55, metalness: 0.1 }));
  var slat       = decal(std({ color: 0x2a2a26, roughness: 0.6 }));
  var glass      = decal(std({ color: 0x1a2124, roughness: 0.05, metalness: 0.8 }));
  var lens       = decal(std({ color: 0xF4F1E6, emissive: 0xFFF1CC, emissiveIntensity: 0.25, roughness: 0.12 }));
  var chromeD    = decal(std({ color: 0xC8C6BE, metalness: 0.9, roughness: 0.25 }));
  var amber      = decal(std({ color: 0xE0780E, emissive: 0x7a3300, emissiveIntensity: 0.35, roughness: 0.3 }));
  var red        = decal(std({ color: 0x9C1A12, emissive: 0x5a0e08, emissiveIntensity: 0.35, roughness: 0.3 }));
  var bumper     = std({ color: 0x0c0c0b, roughness: 0.7, metalness: 0.05 });
  var rubber     = std({ color: 0x141413, roughness: 0.92 });
  var steel      = std({ color: 0x2b2b29, roughness: 0.5, metalness: 0.6 });
  var hubcap     = std({ color: 0xD9D7D0, roughness: 0.22, metalness: 0.9 });
  var well       = std({ color: 0x0b0b0a, roughness: 0.95, side: THREE.DoubleSide });

  /* ---------- dimensions, in metres, after the real T3 ---------- */
  var L = 4.57, W = 1.85, H = 1.94, Y0 = 0.34;
  var Lh = L / 2;
  var BV = 0.035;                 // bevel: rounds every edge so it catches light
  var WR = 0.33, AR = 0.43;       // wheel radius, arch radius
  var FX = Lh - 0.98, RX = FX - 2.46; // front and rear axles, 2.46 m wheelbase

  function rakeX(y) { return Lh - 0.05 - 0.45 * (y - 1.10) / 0.70; }

  var bus = new THREE.Group();    // moves along the road
  var body = new THREE.Group();   // sprung mass: pitches when braking, idles
  bus.add(body);
  scene.add(bus);

  /* ---------- body shell ----------
     The side profile, extruded across the width. The wheel arches are
     cut into the profile itself, so the wheels sit in real openings. */
  var s = new THREE.Shape();
  s.moveTo(-Lh, Y0);
  s.lineTo(RX - AR, Y0);
  s.absarc(RX, Y0, AR, Math.PI, 0, true);
  s.lineTo(FX - AR, Y0);
  s.absarc(FX, Y0, AR, Math.PI, 0, true);
  s.lineTo(Lh, Y0);
  s.lineTo(Lh, 0.72);
  s.lineTo(Lh - 0.05, 1.10);                         // nose leans back slightly
  s.lineTo(Lh - 0.50, 1.80);                         // raked windscreen
  s.quadraticCurveTo(Lh - 0.58, H, Lh - 0.80, H);
  s.lineTo(-Lh + 0.12, H);
  s.quadraticCurveTo(-Lh, H, -Lh, H - 0.12);
  s.lineTo(-Lh, Y0);

  var shell = new THREE.Mesh(new THREE.ExtrudeGeometry(s, {
    depth: W - 2 * BV, bevelEnabled: true,
    bevelThickness: BV, bevelSize: BV, bevelSegments: 4, curveSegments: 18
  }), paint);
  shell.position.z = -W / 2 + BV;
  shell.castShadow = true;
  shell.receiveShadow = true;
  body.add(shell);

  // Dark liners inside the arches, so you never see yellow wheel wells.
  [FX, RX].forEach(function (x) {
    var g = new THREE.CylinderGeometry(AR - BV - 0.005, AR - BV - 0.005, W - 0.1, 28, 1, true, Math.PI / 2, Math.PI);
    var m = new THREE.Mesh(g, well);
    m.rotation.x = Math.PI / 2;
    m.position.set(x, Y0, 0);
    body.add(m);
  });

  /* ---------- side decals: glass, stripes, seams ---------- */
  function rr(x0, y0, x1, y1, r) {
    var p = new THREE.Shape();
    p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r);
    p.lineTo(x1, y1 - r); p.quadraticCurveTo(x1, y1, x1 - r, y1);
    p.lineTo(x0 + r, y1); p.quadraticCurveTo(x0, y1, x0, y1 - r);
    p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0);
    return p;
  }
  function poly(pts) {
    var p = new THREE.Shape();
    p.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    return p;
  }
  function side(shape, mat, dz, plusOnly) {
    var g = new THREE.ShapeGeometry(shape, 8);
    (plusOnly ? [1] : [1, -1]).forEach(function (sd) {
      var m = new THREE.Mesh(g, mat);
      m.position.z = sd * (W / 2 + dz);
      body.add(m);
    });
  }

  // Front door window, its leading edge parallel to the windscreen rake.
  var wy0 = 1.20, wy1 = 1.72;
  var dA = rakeX(wy0) - 0.13, dD = rakeX(wy1) - 0.13, dB = Lh - 1.08;
  side(poly([[dA + 0.044, wy0 - 0.025], [dB - 0.025, wy0 - 0.025], [dB - 0.025, wy1 + 0.025], [dD + 0.012, wy1 + 0.025]]), black, 0.002);
  side(poly([[dA, wy0], [dB, wy0], [dB, wy1], [dD, wy1]]), glass, 0.004);

  // Three side windows and the rear vent.
  var wins = [[Lh - 1.18, Lh - 2.30, true], [Lh - 2.40, Lh - 3.48, true], [Lh - 3.58, -Lh + 0.30, false]];
  wins.forEach(function (w) {
    side(rr(w[1] - 0.025, wy0 - 0.025, w[0] + 0.025, wy1 + 0.025, 0.08), black, 0.002);
    side(rr(w[1], wy0, w[0], wy1, 0.06), glass, 0.004);
    if (w[2]) { var mx = (w[0] + w[1]) / 2; side(rr(mx - 0.012, wy0, mx + 0.012, wy1, 0.004), black, 0.005); }
  });
  side(rr(-Lh + 0.08, 1.28, -Lh + 0.22, 1.68, 0.03), black, 0.004);
  for (var vs = 0; vs < 5; vs++) {
    side(rr(-Lh + 0.10, 1.32 + vs * 0.075, -Lh + 0.20, 1.335 + vs * 0.075, 0.004), slat, 0.006);
  }

  // The two stripes. Thin, close together, nose to tail.
  side(rr(-Lh + 0.01, 1.045, Lh - 0.10, 1.085, 0.005), black, 0.004);
  side(rr(-Lh + 0.01, 0.975, Lh - 0.11, 1.015, 0.005), black, 0.004);

  // Panel lines: rain gutter, lower crease, front door shut line.
  side(rr(-Lh + 0.10, H - 0.075, Lh - 0.86, H - 0.065, 0.002), paintShade, 0.003);
  side(rr(-Lh + 0.02, 0.785, Lh - 0.04, 0.795, 0.002), paintShade, 0.003);
  side(rr(dB - 0.06, Y0 + AR + 0.03, dB - 0.05, 1.80, 0.002), paintShade, 0.003);

  // Sliding door on the kerb side, with its handle.
  var sd0 = FX - AR - 1.20, sd1 = FX - AR - 0.05;
  side(rr(sd0, 0.42, sd0 + 0.012, 1.80, 0.002), paintShade, 0.003, true);
  side(rr(sd1 - 0.012, 0.42, sd1, 1.80, 0.002), paintShade, 0.003, true);
  side(rr(sd0, 0.42, sd1, 0.432, 0.002), paintShade, 0.003, true);
  side(rr(sd0 + 0.05, 0.86, sd0 + 0.20, 0.90, 0.015), black, 0.006, true);

  /* ---------- the nose ---------- */
  var LEAN = Math.atan(0.05 / 0.38);
  function nose(geom, y, z, mat, dz) {
    var m = new THREE.Mesh(geom, mat);
    var lean = y > 0.72;
    var x = lean ? Lh - 0.05 * (y - 0.72) / 0.38 : Lh;
    m.position.set(x + BV + dz, y, z);
    m.rotation.order = "ZYX";
    m.rotation.set(0, Math.PI / 2, lean ? LEAN : 0);
    body.add(m);
    return m;
  }
  nose(new THREE.PlaneGeometry(W - 0.28, 0.21), 0.89, 0, black, 0.004);          // grille band
  for (var gs = 0; gs < 5; gs++) {
    nose(new THREE.PlaneGeometry(0.86, 0.012), 0.835 + gs * 0.028, 0, slat, 0.006);
  }
  [-1, 1].forEach(function (sd) {
    nose(new THREE.RingGeometry(0.071, 0.088, 36), 0.89, sd * 0.62, chromeD, 0.006);
    nose(new THREE.CircleGeometry(0.071, 36), 0.89, sd * 0.62, lens, 0.007);
    nose(new THREE.PlaneGeometry(0.09, 0.06), 0.60, sd * 0.79, amber, 0.004);   // indicators
  });
  nose(new THREE.PlaneGeometry(1.12, 0.11), 0.58, 0, black, 0.004);              // lower grille
  for (var ls = 0; ls < 3; ls++) {
    nose(new THREE.PlaneGeometry(1.0, 0.01), 0.55 + ls * 0.028, 0, slat, 0.006);
  }
  nose(new THREE.PlaneGeometry(0.02, 0.09), 1.045, -0.025, black, 0.004);        // the two nose lines
  nose(new THREE.PlaneGeometry(0.02, 0.09), 1.045, 0.025, black, 0.004);

  /* ---------- windscreen and wipers ---------- */
  (function () {
    var cx = Lh - 0.275, cy = 1.45;
    var n = new THREE.Vector3(0.70, 0.45, 0).normalize();
    function onRake(w, h, off, mat) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.position.set(cx + n.x * off, cy + n.y * off, 0);
      m.lookAt(cx + n.x * (off + 1), cy + n.y * (off + 1), 0);
      body.add(m);
      return m;
    }
    onRake(W - 0.14, 0.78, BV + 0.002, black);
    var ws = onRake(W - 0.20, 0.71, BV + 0.004, glass);
    [[-0.32, 0.28], [0.30, 0.22]].forEach(function (wp) {
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.016, 0.012), black);
      arm.position.set(wp[0], -0.28, 0.012);
      arm.rotation.z = wp[1];
      ws.add(arm);
    });
  })();

  /* ---------- the rear ---------- */
  function rear(geom, y, z, mat, dz) {
    var m = new THREE.Mesh(geom, mat);
    m.position.set(-Lh - BV - dz, y, z);
    m.rotation.y = -Math.PI / 2;
    body.add(m);
  }
  rear(new THREE.ShapeGeometry(rr(-0.77, -0.29, 0.77, 0.29, 0.08), 8), 1.48, 0, black, 0.002);
  rear(new THREE.ShapeGeometry(rr(-0.74, -0.26, 0.74, 0.26, 0.06), 8), 1.48, 0, glass, 0.004);
  rear(new THREE.PlaneGeometry(0.11, 0.26), 0.82, 0.76, red, 0.004);
  rear(new THREE.PlaneGeometry(0.11, 0.26), 0.82, -0.76, red, 0.004);
  rear(new THREE.PlaneGeometry(1.0, 0.035), 1.065, 0, black, 0.004);
  rear(new THREE.PlaneGeometry(1.0, 0.035), 0.995, 0, black, 0.004);

  /* ---------- bumpers and mirrors ---------- */
  function solid(geo, mat, x, y, z) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    body.add(m);
    return m;
  }
  solid(new THREE.BoxGeometry(0.16, 0.19, W + 0.06), bumper, Lh + BV + 0.07, 0.44, 0);
  solid(new THREE.BoxGeometry(0.16, 0.19, W + 0.06), bumper, -Lh - BV - 0.07, 0.44, 0);
  [-1, 1].forEach(function (sd) {
    solid(new THREE.BoxGeometry(0.04, 0.03, 0.16), bumper, rakeX(1.30) - 0.06, 1.30, sd * (W / 2 + 0.08));
    solid(new THREE.BoxGeometry(0.035, 0.22, 0.13), bumper, rakeX(1.30) - 0.06, 1.38, sd * (W / 2 + 0.19));
  });

  /* ---------- wheels ----------
     Steel wheels with a chrome hubcap and four holes, so their
     rotation is actually visible. */
  var spins = [];
  function wheel(x, zSide) {
    var g = new THREE.Group();
    var spin = new THREE.Group();
    g.add(spin);

    var tyre = new THREE.Mesh(new THREE.CylinderGeometry(WR, WR, 0.205, 44), rubber);
    tyre.rotation.x = Math.PI / 2;
    tyre.castShadow = true;
    spin.add(tyre);

    var face = zSide * 0.106;
    var rim = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.21, 36), steel);
    rim.rotation.x = Math.PI / 2;
    spin.add(rim);

    var cap = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), hubcap);
    cap.rotation.x = zSide * Math.PI / 2;
    cap.scale.y = 0.45;
    cap.position.z = face;
    spin.add(cap);

    for (var h = 0; h < 4; h++) {
      var a = (h / 4) * Math.PI * 2 + 0.4;
      var hole = new THREE.Mesh(new THREE.CircleGeometry(0.028, 16), black);
      hole.position.set(Math.cos(a) * 0.145, Math.sin(a) * 0.145, face + zSide * 0.002);
      if (zSide < 0) hole.rotation.y = Math.PI;
      spin.add(hole);
    }

    g.position.set(x, WR, zSide * 0.785);
    bus.add(g);
    spins.push(spin);
  }
  wheel(FX, 1); wheel(FX, -1); wheel(RX, 1); wheel(RX, -1);

  /* ---------- ground: shadow only ---------- */
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.24 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.002;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ---------- lights ---------- */
  var hemi = new THREE.HemisphereLight(0xFFF6E4, 0x5d574b, 0.35);
  scene.add(hemi);
  var key = new THREE.DirectionalLight(0xFFF0D8, 1.35);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1; key.shadow.camera.far = 30;
  key.shadow.camera.left = -4.5; key.shadow.camera.right = 4.5;
  key.shadow.camera.top = 4.5; key.shadow.camera.bottom = -4.5;
  key.shadow.bias = -0.0008;
  key.shadow.radius = 4;
  scene.add(key);
  scene.add(key.target);

  function applyTheme() {
    var bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim().toLowerCase();
    var dark = bg.indexOf("#0f") === 0 || bg.indexOf("#0e") === 0;
    ground.material.opacity = dark ? 0.5 : 0.24;
    hemi.intensity = dark ? 0.22 : 0.35;
    lens.emissiveIntensity = dark ? 1.4 : 0.25;
    renderer.toneMappingExposure = dark ? 0.95 : 0.86;
  }
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement,
    { attributes: true, attributeFilter: ["data-theme"] });

  /* ---------- camera chapters ---------- */
  var SHOTS = [
    { p: [ 7.6, 2.40, 6.8], t: [ 0.0, 0.95, 0.0] },  // the whole danfo
    { p: [ 4.6, 1.00, 8.8], t: [-0.4, 1.00, 0.0] },  // low, along the stripes
    { p: [-0.3, 1.30, 11.5], t: [-0.3, 1.05, 0.0] },  // square on, the sliding door
    { p: [ 7.4, 1.30, 2.6], t: [ 1.4, 1.00, 0.0] },  // the nose
    { p: [-6.6, 2.70, 6.6], t: [ 0.0, 0.95, 0.0] }   // back out, rear three quarters
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

  function size() {
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (w > 860) camera.setViewOffset(w, h, -Math.round(w * 0.15), 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", size);
  size();

  var chapters = seq.querySelectorAll(".seq-chapter");
  var current = -1, target = 0, shown = 0, ticking = false, onScreen = true;
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

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; }).observe(seq);
  }

  /* ---------- motion ---------- */
  var DRIVE_FROM = -15, DRIVE_MS = 2600;
  var driveStart = performance.now() + 300;
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function frame(now) {
    shown += (target - shown) * 0.085;
    if (Math.abs(target - shown) < 0.0002) shown = target;

    var d = reduce ? 1 : Math.min(1, Math.max(0, (now - driveStart) / DRIVE_MS));
    var driveX = DRIVE_FROM * (1 - easeOut(d));
    var roll = shown * 1.4;                   // scrolling rolls it forward
    bus.position.x = driveX + roll;

    var ang = -bus.position.x / WR;           // wheels turn by distance travelled
    for (var i = 0; i < spins.length; i++) spins[i].rotation.z = ang;

    // Nose dips as it brakes at the end of the drive-in, then settles.
    var brake = (!reduce && d > 0.55 && d < 1) ? Math.sin((d - 0.55) / 0.45 * Math.PI) : 0;
    body.rotation.z = -brake * 0.016;
    var t = now / 1000;
    body.position.y = reduce ? 0 : Math.sin(t * 2.1) * 0.003 + Math.sin(t * 27) * 0.0006;

    key.position.set(bus.position.x + 5, 9, 6);
    key.target.position.set(bus.position.x, 0, 0);

    camAt(shown);
    camera.position.set(camPos.x + roll, camPos.y, camPos.z);
    camera.lookAt(camTgt.x + roll, camTgt.y, camTgt.z);
    renderer.render(scene, camera);
  }

  function loop(now) {
    if (onScreen) frame(now);
    requestAnimationFrame(loop);
  }

  measure();
  shown = target;
  if (reduce) {
    frame(performance.now());
    window.addEventListener("scroll", function () { measure(); shown = target; frame(performance.now()); }, { passive: true });
    window.addEventListener("resize", function () { frame(performance.now()); });
  } else {
    requestAnimationFrame(loop);
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
