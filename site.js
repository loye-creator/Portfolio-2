/* ------------------------------------------------------------------
   CONFIGURE THESE TWO LINES. Everything else runs on its own.

   FORM_ENDPOINT  a form service URL that accepts a POST.
                  Formspree, Basin and Web3Forms all work.
                  Leave it empty and the form opens an email
                  instead, so it still works either way.

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
   Lagos runs on danfo: yellow minibus, black stripe, fixed route.
   Built here as a solid from boxes and prisms, rendered with a
   hand-written perspective camera. Scroll drives that camera along
   the stripe, into the doorway, around the front, then back out to
   the whole vehicle. No library, so the page carries no third-party
   weight.
   ================================================================== */
(function () {
  var cv = document.getElementById("mark");
  var seq = document.querySelector(".seq");
  if (!cv || !seq) return;

  var ctx = cv.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var faces = [];

  /* ---- solid builders ---- */
  function box(cx, cy, cz, sx, sy, sz, tone) {
    var x0 = cx - sx / 2, x1 = cx + sx / 2;
    var y0 = cy - sy / 2, y1 = cy + sy / 2;
    var z0 = cz - sz / 2, z1 = cz + sz / 2;
    var v = [
      [x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],
      [x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]
    ];
    var quads = [
      [[0,3,2,1],[ 0, 0,-1]],  // front
      [[4,5,6,7],[ 0, 0, 1]],  // back
      [[0,1,5,4],[ 0,-1, 0]],  // bottom
      [[3,7,6,2],[ 0, 1, 0]],  // top
      [[0,4,7,3],[-1, 0, 0]],  // left
      [[1,2,6,5],[ 1, 0, 0]]   // right
    ];
    for (var i = 0; i < quads.length; i++) {
      faces.push({
        pts: quads[i][0].map(function (k) { return v[k]; }),
        n: quads[i][1], tone: tone
      });
    }
  }

  // A wheel: an n-gon prism lying on the z axis.
  function wheel(cx, cy, cz, r, halfW, tone) {
    var N = 14, ring0 = [], ring1 = [];
    for (var i = 0; i < N; i++) {
      var a = (i / N) * Math.PI * 2;
      var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      ring0.push([x, y, cz - halfW]);
      ring1.push([x, y, cz + halfW]);
    }
    faces.push({ pts: ring0.slice().reverse(), n: [0, 0, -1], tone: tone });
    faces.push({ pts: ring1.slice(), n: [0, 0, 1], tone: tone });
    for (var j = 0; j < N; j++) {
      var k = (j + 1) % N;
      var nx = Math.cos(((j + 0.5) / N) * Math.PI * 2);
      var ny = Math.sin(((j + 0.5) / N) * Math.PI * 2);
      faces.push({ pts: [ring0[j], ring0[k], ring1[k], ring1[j]], n: [nx, ny, 0], tone: tone });
    }
  }

  /* ---- assemble the danfo ----
     Proportions matter here. A danfo is a forward-control minibus:
     tall and blunt rather than long and low, roughly 1.6 long to 1
     high, with a near-vertical front, slab sides, a high window band
     and two black stripes, one at the belt line and one low. */
  box(  0,   0,   0, 130, 62, 50, "body");    // main slab
  box( -1,  32.5, 0, 124,  3, 46, "trim");    // roof edge
  box(  0,  15,   0, 114, 19, 51, "glass");   // window band, proud of the flank
  box(  0,   0.5, 0, 131,  7, 51.4, "stripe");// belt stripe
  box(  0, -19,   0, 131,  6, 51.4, "stripe");// lower stripe
  box( 66,  15,   0,   2, 19, 44, "glass");   // windscreen, near vertical
  box( 66, -25,   0,   3,  9, 44, "trim");    // front bumper
  box(-66, -25,   0,   3,  9, 44, "trim");    // rear bumper
  box(-14,  -6,  25.6, 28, 28, 0.8, "trim");  // side door seam, the way in
  wheel(-42, -28,  25, 11, 4, "tyre");
  wheel(-42, -28, -25, 11, 4, "tyre");
  wheel( 44, -28,  25, 11, 4, "tyre");
  wheel( 44, -28, -25, 11, 4, "tyre");

  /* ---- chapters: where the camera rests ---- */
  var SHOTS = [
    { ry: -0.60, rx: -0.15, dist: 272, px:   0, py:  -2 },  // the whole danfo, three quarters
    { ry: -0.12, rx:  0.00, dist: 120, px:   6, py:  12 },  // grazing along the belt stripe
    { ry: -0.58, rx: -0.05, dist: 128, px:  16, py:  -1 },  // onto the side door, the way in
    { ry: -1.42, rx:  0.10, dist: 152, px: -60, py:  -4 },  // the blunt front
    { ry:  0.50, rx: -0.13, dist: 296, px:   0, py:  -2 }   // back out to the whole
  ];

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function camAt(p) {
    var n = SHOTS.length - 1;
    var scaled = Math.max(0, Math.min(0.9999, p)) * n;
    var i = Math.floor(scaled), local = scaled - i;
    var t = ease(Math.min(1, local / 0.55));
    var A = SHOTS[i], B = SHOTS[i + 1] || SHOTS[i];
    return {
      ry: lerp(A.ry, B.ry, t), rx: lerp(A.rx, B.rx, t),
      dist: lerp(A.dist, B.dist, t),
      px: lerp(A.px, B.px, t), py: lerp(A.py, B.py, t)
    };
  }
  function chapterAt(p) {
    var n = SHOTS.length - 1;
    var scaled = Math.max(0, Math.min(0.9999, p)) * n;
    var i = Math.floor(scaled);
    return (scaled - i) > 0.45 ? i + 1 : i;
  }

  function size() {
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", size);
  size();

  var TONES = {};
  function readTones() {
    var s = getComputedStyle(document.documentElement);
    ["body", "stripe", "glass", "tyre", "trim", "edge"].forEach(function (k) {
      TONES[k] = s.getPropertyValue("--m-" + k).trim();
    });
  }
  readTones();
  new MutationObserver(readTones).observe(document.documentElement,
    { attributes: true, attributeFilter: ["data-theme"] });

  // Shading multiplies the base colour toward black. Using alpha here
  // instead would fade every face toward the page background, which
  // turns the black stripes grey and the yellow pale.
  function shaded(rgb, k) {
    var p = rgb.split(",");
    k = Math.max(0, Math.min(1.35, k));
    return "rgb(" + Math.min(255, Math.round(p[0] * k)) + "," +
                    Math.min(255, Math.round(p[1] * k)) + "," +
                    Math.min(255, Math.round(p[2] * k)) + ")";
  }

  var LIGHT = (function () {
    var v = [-0.38, 0.72, -0.58];
    var m = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    return [v[0]/m, v[1]/m, v[2]/m];
  })();

  function render(p) {
    ctx.clearRect(0, 0, w, h);
    var cam = camAt(p);
    var cy = Math.cos(cam.ry), sy = Math.sin(cam.ry);
    var cx = Math.cos(cam.rx), sx = Math.sin(cam.rx);
    var originX = w > 860 ? w * 0.76 : w * 0.5;
    var originY = h * 0.52;
    var fov = Math.min(w, h) * 1.3;

    function project(pt) {
      var x = pt[0] + cam.px, y = pt[1] + cam.py, z = pt[2];
      var x1 = x * cy - z * sy, z1 = x * sy + z * cy;
      var y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      var depth = z2 + cam.dist;
      if (depth < 1) depth = 1;
      var s = fov / depth;
      return { x: originX + x1 * s, y: originY - y1 * s, z: depth };
    }
    function rotN(n) {
      var x1 = n[0] * cy - n[2] * sy, z1 = n[0] * sy + n[2] * cy;
      var y1 = n[1] * cx - z1 * sx, z2 = n[1] * sx + z1 * cx;
      return [x1, y1, z2];
    }

    var drawn = [];
    for (var f = 0; f < faces.length; f++) {
      var face = faces[f];
      var proj = face.pts.map(project);
      var avg = 0;
      for (var k = 0; k < proj.length; k++) avg += proj[k].z;
      avg /= proj.length;
      var n = rotN(face.n);
      if (n[2] > 0.03) continue;                       // cull faces turned away
      var lamb = Math.max(0, n[0]*LIGHT[0] + n[1]*LIGHT[1] + n[2]*LIGHT[2]);
      drawn.push({ proj: proj, depth: avg, shade: 0.52 + lamb * 0.52, tone: face.tone });
    }
    drawn.sort(function (a, b) { return b.depth - a.depth; });

    for (var d = 0; d < drawn.length; d++) {
      var g = drawn[d];
      ctx.beginPath();
      ctx.moveTo(g.proj[0].x, g.proj[0].y);
      for (var j = 1; j < g.proj.length; j++) ctx.lineTo(g.proj[j].x, g.proj[j].y);
      ctx.closePath();
      // A flat fill per face reads as stacked cardboard. A slight vertical
      // falloff across each face gives the panels some air without
      // pretending to be a real renderer.
      var top = g.proj[0].y, bot = g.proj[0].y;
      for (var q = 1; q < g.proj.length; q++) {
        if (g.proj[q].y < top) top = g.proj[q].y;
        if (g.proj[q].y > bot) bot = g.proj[q].y;
      }
      var base = TONES[g.tone] || TONES.body;
      if (bot - top > 2) {
        var grad = ctx.createLinearGradient(0, top, 0, bot);
        grad.addColorStop(0, shaded(base, g.shade * 1.13));
        grad.addColorStop(1, shaded(base, g.shade * 0.84));
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = shaded(base, g.shade);
      }
      ctx.fill();
      ctx.strokeStyle = "rgba(" + TONES.edge + ",0.10)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /* ---- drive it from scroll ---- */
  var chapters = seq.querySelectorAll(".seq-chapter");
  var current = -1, target = 0, shown = 0, ticking = false;

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
  function loop() {
    shown += (target - shown) * 0.12;
    if (Math.abs(target - shown) < 0.0002) shown = target;
    render(shown);
    requestAnimationFrame(loop);
  }

  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { measure(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", measure);

  measure();
  shown = target;
  if (reduce) {
    render(target);
    window.addEventListener("scroll", function () { render(target); }, { passive: true });
  } else {
    loop();
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

    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name_.value.trim(),
        email: form.email.value.trim(),
        company: form.company.value.trim(),
        message: form.message.value.trim()
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
