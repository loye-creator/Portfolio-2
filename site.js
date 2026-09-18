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
    btn.textContent = next === "light" ? "Light" : "Dark";
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

/* ---------- hero lattice ----------
   A node graph rendered in three dimensions: five layers of nodes
   wired forward, the shape of a pipeline. Projected by hand so the
   page carries no third party dependency. */
(function () {
  var cv = document.getElementById("lattice");
  if (!cv) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = cv.getContext("2d");
  var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var nodes = [], edges = [], LAYERS = 5, PER = 4, SPREAD = 190;

  for (var L = 0; L < LAYERS; L++) {
    for (var i = 0; i < PER; i++) {
      var a = (i / PER) * Math.PI * 2 + L * 0.42;
      nodes.push({
        x: Math.cos(a) * SPREAD,
        y: Math.sin(a) * SPREAD * 0.62,
        z: (L - (LAYERS - 1) / 2) * 150,
        layer: L,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }
  for (var n = 0; n < nodes.length; n++) {
    for (var m = 0; m < nodes.length; m++) {
      if (nodes[m].layer === nodes[n].layer + 1 && (m - n) % 3 !== 2) edges.push([n, m]);
    }
  }

  function size() {
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", size);
  size();

  function tone(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  var nodeTone = tone("--node"), edgeTone = tone("--edge");
  new MutationObserver(function () {
    nodeTone = tone("--node");
    edgeTone = tone("--edge");
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  var rot = 0, mx = 0, my = 0, tmx = 0, tmy = 0, t = 0;
  window.addEventListener("pointermove", function (e) {
    tmx = (e.clientX / window.innerWidth - 0.5) * 0.5;
    tmy = (e.clientY / window.innerHeight - 0.5) * 0.35;
  });

  function project(p, ry, rx) {
    var cy = Math.cos(ry), sy = Math.sin(ry);
    var x1 = p.x * cy - p.z * sy, z1 = p.x * sy + p.z * cy;
    var cx = Math.cos(rx), sx = Math.sin(rx);
    var y1 = p.y * cx - z1 * sx, z2 = p.y * sx + z1 * cx;
    var d = 900, s = d / (d + z2 + 520);
    return { x: w * 0.62 + x1 * s, y: h * 0.5 + y1 * s, s: s };
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    mx += (tmx - mx) * 0.05;
    my += (tmy - my) * 0.05;
    if (!reduce) rot += 0.0016;
    t += 0.02;
    var ry = rot + mx, rx = -0.14 + my, k;
    var pts = [];
    for (k = 0; k < nodes.length; k++) pts.push(project(nodes[k], ry, rx));

    for (k = 0; k < edges.length; k++) {
      var A = pts[edges[k][0]], B = pts[edges[k][1]];
      var al = Math.min(A.s, B.s);
      ctx.strokeStyle = "rgba(" + edgeTone + "," + (al * 0.32).toFixed(3) + ")";
      ctx.lineWidth = al * 0.9;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
    }
    for (k = 0; k < pts.length; k++) {
      var P = pts[k];
      var beat = reduce ? 0.5 : (Math.sin(t + nodes[k].pulse) * 0.5 + 0.5);
      var r = 1.6 + P.s * 2.6;
      ctx.fillStyle = "rgba(" + nodeTone + "," + (P.s * (0.26 + beat * 0.40)).toFixed(3) + ")";
      ctx.fillRect(P.x - r, P.y - r, r * 2, r * 2);
    }
    requestAnimationFrame(frame);
  }
  frame();
})();

/* ---------- depth on the schematics ---------- */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(pointer:fine)").matches) return;
  var els = document.querySelectorAll("[data-tilt]");
  for (var i = 0; i < els.length; i++) {
    (function (el) {
      el.addEventListener("pointermove", function (ev) {
        var r = el.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - 0.5;
        var py = (ev.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(1100px) rotateY(" + (px * 4.5).toFixed(2) +
          "deg) rotateX(" + (-py * 3.5).toFixed(2) + "deg) translateZ(6px)";
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

    if (!name.value.trim()) {
      fail(name, "Tell me who you are.");
      ok = false;
    }
    if (!email.value.trim()) {
      fail(email, "I need an address to reply to.");
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      fail(email, "That address is missing something. Check it over.");
      ok = false;
    }
    if (message.value.trim().length < 12) {
      fail(message, "A sentence or two is enough, but I need one.");
      ok = false;
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
