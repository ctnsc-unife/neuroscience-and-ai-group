/*
 * Simulated EEG and EMG traces for the home page.
 * Five EEG channels (1/f background plus a slowly waxing and waning alpha rhythm)
 * and two EMG channels (noise-like bursts). Every value is a function of
 * position along the trace, so the animation is just a moving window.
 */
(function () {
  var canvas = document.getElementById("signals");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var BG = "#14182b";
  var EEG_COLOR = "rgba(207, 227, 220, 0.85)";
  var EMG_COLOR = "#8fa0ff";
  var LABEL_COLOR = "rgba(207, 227, 220, 0.6)";
  var PX_PER_S = 150; // display scale: pixels per simulated second
  var SPEED = 60; // scroll speed in px/s
  var LABEL_W = 64;
  var FADE_W = 120;
  var TAU = Math.PI * 2;

  function rng(seed) {
    return function () {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function hash(n) {
    n = Math.imul(n ^ 61, 2654435761);
    n ^= n >>> 15;
    n = Math.imul(n, 2246822519);
    n ^= n >>> 13;
    return ((n >>> 0) / 4294967296) * 2 - 1;
  }

  var EEG_N = 5;
  var EMG_N = 2;
  var eeg = [];
  var emg = [];

  for (var c = 0; c < EEG_N; c++) {
    var r = rng(11 + c * 37);
    var comps = [];
    for (var k = 0; k < 14; k++) {
      var f = 1 + r() * 17; // Hz
      comps.push({ w: (TAU * f) / PX_PER_S, a: 1 / Math.pow(f, 0.85), ph: r() * TAU });
    }
    eeg.push({
      comps: comps,
      alphaPh: r() * TAU,
      modPeriod: PX_PER_S * (5 + r() * 4),
      modPh: r() * TAU,
      gain: 0.8 + r() * 0.4
    });
  }

  for (var m = 0; m < EMG_N; m++) {
    var q = rng(901 + m * 53);
    emg.push({ seed: Math.floor(q() * 100000), period: PX_PER_S * (2.6 + q() * 1.2), ph: q() * TAU });
  }

  function eegValue(ch, p) {
    var v = 0;
    for (var i = 0; i < ch.comps.length; i++) {
      var cp = ch.comps[i];
      v += cp.a * Math.sin(cp.w * p + cp.ph);
    }
    var mod = 0.5 + 0.5 * Math.sin((TAU * p) / ch.modPeriod + ch.modPh);
    v += 1.5 * mod * mod * Math.sin(((TAU * 10) / PX_PER_S) * p + ch.alphaPh);
    return v * ch.gain;
  }

  function emgValue(ch, p) {
    var g = Math.sin((TAU * p) / ch.period + ch.ph);
    var env = g > 0 ? g * g : 0;
    var n = hash(Math.floor(p / 1.5) + ch.seed);
    return (env * 1.0 + 0.04) * n;
  }

  var width = 0;
  var height = 0;
  var offset = 0;
  var last = 0;
  var running = false;

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function trace(valueAt, y, amp, step) {
    ctx.beginPath();
    for (var x = LABEL_W; x <= width; x += step) {
      var py = y - valueAt(offset + x) * amp;
      if (x === LABEL_W) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
  }

  function draw() {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, width, height);

    var top = 22;
    var gap = 0.7; // extra spacing between the EEG and EMG groups, in rows
    var rows = EEG_N + EMG_N - 1 + gap;
    var rowH = (height - top * 2) / rows;
    var amp = rowH * 0.2;

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.strokeStyle = EEG_COLOR;
    ctx.lineWidth = 1.3;
    for (var i = 0; i < EEG_N; i++) {
      (function (ch) {
        trace(function (p) { return eegValue(ch, p); }, top + i * rowH, amp, 2);
      })(eeg[i]);
    }

    ctx.strokeStyle = EMG_COLOR;
    ctx.lineWidth = 1;
    for (var j = 0; j < EMG_N; j++) {
      (function (ch) {
        trace(function (p) { return emgValue(ch, p); }, top + (EEG_N - 1 + gap + j) * rowH, amp * 1.5, 1.5);
      })(emg[j]);
    }

    var grad = ctx.createLinearGradient(LABEL_W, 0, LABEL_W + FADE_W, 0);
    grad.addColorStop(0, BG);
    grad.addColorStop(1, "rgba(20, 24, 43, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(LABEL_W, 0, FADE_W, height);

    ctx.fillStyle = LABEL_COLOR;
    ctx.font = "500 12px 'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("EEG", 24, top + ((EEG_N - 1) / 2) * rowH);
    ctx.fillText("EMG", 24, top + (EEG_N - 1 + gap + (EMG_N - 1) / 2) * rowH);
  }

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    offset += SPEED * dt;
    draw();
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
  }

  offset = 900;
  resize();
  window.addEventListener("resize", resize);

  if (!reduceMotion) {
    start();
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });
  }
})();
