/*
 * Spike raster for the home page hero.
 * Each row is a simulated neuron; each tick is a spike. Rows share
 * occasional bursts of synchronised activity, as in population recordings.
 */
(function () {
  var canvas = document.getElementById("raster");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ROWS = 32;
  var BIN = 7; // px per time bin
  var SPEED = 38; // px per second
  var COLOR_BASE = "rgba(207, 227, 220, 0.5)";
  var COLOR_BURST = "#8fa0ff";

  var rowBase = [];
  var rowGain = [];
  for (var r = 0; r < ROWS; r++) {
    rowBase.push(0.015 + Math.random() * 0.05);
    rowGain.push(0.3 + Math.random() * 0.7);
  }

  var bins = [];
  var t = 0;
  var offset = 0;
  var width = 0;
  var height = 0;
  var last = 0;
  var running = false;

  function burstLevel(time) {
    var a = Math.max(0, Math.sin(time * 0.045));
    var b = Math.max(0, Math.sin(time * 0.017 + 1.3));
    return Math.pow(a, 6) + 0.6 * Math.pow(b, 10);
  }

  function makeBin(time) {
    var burst = burstLevel(time);
    var col = new Uint8Array(ROWS);
    for (var r = 0; r < ROWS; r++) {
      var p = rowBase[r] + burst * 0.45 * rowGain[r];
      if (Math.random() < p) col[r] = burst > 0.3 ? 2 : 1;
    }
    return col;
  }

  function fill() {
    var needed = Math.ceil(width / BIN) + 2;
    bins = [];
    t = 0;
    for (var i = 0; i < needed; i++) bins.push(makeBin(t++));
  }

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fill();
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    var rowH = height / ROWS;
    var tick = Math.max(6, rowH * 0.62);
    for (var i = 0; i < bins.length; i++) {
      var x = i * BIN - offset;
      var col = bins[i];
      for (var r = 0; r < ROWS; r++) {
        if (!col[r]) continue;
        ctx.fillStyle = col[r] === 2 ? COLOR_BURST : COLOR_BASE;
        ctx.fillRect(x, r * rowH + (rowH - tick) / 2, 2, tick);
      }
    }
  }

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    offset += SPEED * dt;
    while (offset >= BIN) {
      offset -= BIN;
      bins.shift();
      bins.push(makeBin(t++));
    }
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
