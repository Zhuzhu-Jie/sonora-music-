/* Offline audio transport: every oscillator, source and UI timer is owned and cancellable. */
var Sound = (function () {
  "use strict";
  var ctx = null,
    master = null,
    compressor = null,
    nodes = [],
    timers = [],
    generation = 0,
    finish = null,
    playing = false,
    voice = "guitar",
    volume = 0.35;
  function context() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = volume;
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -15;
      compressor.knee.value = 12;
      compressor.ratio.value = 5;
      master.connect(compressor);
      compressor.connect(ctx.destination);
    }
    return ctx;
  }
  async function ready() {
    var c = context();
    if (c.state === "suspended") await c.resume();
    return c;
  }
  function setVolume(v) {
    volume = Math.max(0, Math.min(0.8, Number(v)));
    if (master) master.gain.setValueAtTime(volume, ctx.currentTime);
  }
  function stop() {
    generation++;
    playing = false;
    timers.forEach(clearTimeout);
    timers = [];
    nodes.forEach(function (n) {
      try {
        n.stop();
      } catch (e) {}
    });
    nodes = [];
    if (finish) {
      finish(false);
      finish = null;
    }
  }
  function later(fn, at, gen) {
    var timer = setTimeout(
      function () {
        if (gen === generation) fn();
      },
      Math.max(0, (at - context().currentTime) * 1000),
    );
    timers.push(timer);
    return timer;
  }
  function note(midi, time, duration, gain, chosenVoice) {
    var c = context();
    var o = c.createOscillator(),
      g = c.createGain();
    var style = chosenVoice || voice;
    if (style === "pure") o.type = "sine";
    else {
      var r = new Float32Array(9),
        im = new Float32Array(9);
      var h =
        style === "piano"
          ? [0, 1, 0.42, 0.18, 0.08, 0.03, 0.015]
          : [0, 1, 0.62, 0.28, 0.15, 0.08, 0.035, 0.02, 0.01];
      h.forEach(function (x, i) {
        im[i] = x;
      });
      o.setPeriodicWave(c.createPeriodicWave(r, im));
    }
    o.frequency.value = Music.freq(midi);
    var peak = Math.max(0.0001, gain === undefined ? 0.24 : gain);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(peak, time + 0.008);
    g.gain.exponentialRampToValueAtTime(
      Math.max(0.00011, peak * 0.28),
      time + Math.max(0.02, duration * 0.35),
    );
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    o.connect(g);
    g.connect(master);
    o.start(time);
    o.stop(time + duration + 0.025);
    nodes.push(o);
    return o;
  }
  function click(time, accent) {
    var c = context(),
      o = c.createOscillator(),
      g = c.createGain();
    o.frequency.value = accent ? 1400 : 950;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(accent ? 0.26 : 0.16, time + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    o.connect(g);
    g.connect(master);
    o.start(time);
    o.stop(time + 0.045);
    nodes.push(o);
  }
  function chord(notes, time, duration, strum) {
    notes
      .filter(function (n) {
        return n !== null;
      })
      .forEach(function (n, i, a) {
        note(n, time + (strum || 0) * i, duration, 0.26 / Math.sqrt(a.length));
      });
  }
  async function sequence(events, options) {
    stopLoop();
    var gen = generation,
      c = await ready();
    if (gen !== generation) return false;
    var start = c.currentTime + 0.07;
    playing = true;
    var max = (options && options.duration) || 0;
    if (options && options.onStart) options.onStart(start);
    events.forEach(function (e) {
      var t = start + e.at,
        d = e.duration || 0.45;
      max = Math.max(max, e.at + d);
      if (e.visual && e.visual.silent) {
      } else if (e.click) click(t, e.accent);
      else if (e.notes) chord(e.notes, t, d, e.strum);
      else note(e.note, t, d, e.gain, e.voice);
      if (e.visual && options && options.onStep)
        later(
          function () {
            options.onStep(e.visual);
          },
          t,
          gen,
        );
    });
    return new Promise(function (resolve) {
      finish = resolve;
      later(
        function () {
          playing = false;
          finish = null;
          resolve(true);
        },
        start + max + 0.08,
        gen,
      );
    });
  }
  function question(q, opts) {
    if (q.voice) voice = q.voice;
    var speed = Math.max(
        0.25,
        Math.min(1.2, Number(q.speed || opts.speed) || 0.6),
      ),
      events = [];
    if (
      q.mode === "degree" ||
      q.mode === "melody" ||
      q.mode === "progression"
    ) {
      chordPreface();
    }
    function chordPreface() {
      var ints = Music.scales[q.scale || "major"].notes;
      events.push({
        at: 0,
        notes: [q.root, q.root + ints[2], q.root + 7],
        duration: 0.6,
      });
      events.push({ at: 0.8, note: q.root, duration: 0.4 });
    }
    if (q.mode === "direction" || q.mode === "interval") {
      if (q.presentation === "harmonic")
        events.push({ at: 0, notes: q.notes, duration: 1.2 });
      else
        q.notes.forEach(function (n, i) {
          events.push({ at: i * (speed + 0.15), note: n, duration: speed });
        });
    } else if (q.mode === "scale") {
      var ns = q.notes.concat(q.notes.slice(0, -1).reverse());
      ns.forEach(function (n, i) {
        events.push({ at: i * speed * 0.65, note: n, duration: speed * 0.6 });
      });
    } else if (q.mode === "chord") {
      if ((q.chordStyle || opts.chordStyle) === "arp")
        q.notes.forEach(function (n, i) {
          events.push({ at: i * 0.35, note: n, duration: 0.8 });
        });
      else events.push({ at: 0, notes: q.notes, duration: 1.5 });
    } else if (q.mode === "progression") {
      q.chords.forEach(function (ch, i) {
        events.push({
          at: 1.6 + i * 1.05,
          notes: Music.voiced(ch),
          duration: 0.95,
          strum: 0.016,
        });
      });
    } else if (q.mode === "degree")
      events.push({ at: 1.6, note: q.notes[0], duration: 1 });
    else if (q.mode === "melody")
      q.notes.forEach(function (n, i) {
        events.push({ at: 1.6 + i * speed, note: n, duration: speed * 0.85 });
      });
    return sequence(events, {});
  }
  function rhythmEvents(pattern, chordLabel, bpm, bars, countIn, capo) {
    var events = [],
      barTime =
        ((pattern.meter === "6/8" ? 2 : pattern.meter === "3/4" ? 3 : 4) * 60) /
        bpm;
    var beats = pattern.meter === "6/8" ? 2 : pattern.meter === "3/4" ? 3 : 4;
    var shape = REFERENCE.chordData.filter(function (c) {
        return c.name === chordLabel;
      })[0],
      co = Music.chord(chordLabel);
    if (!co) throw Error("Unknown chord");
    var cn = shape
      ? Music.shapeNotes(shape.shape)
      : [
          36 + co.bass,
          48 + co.root,
          48 + co.root + co.offsets[1],
          48 + co.root + co.offsets[2],
          60 + co.root,
          60 + co.root + co.offsets[1],
        ];
    cn = cn.map(function (n) {
      return n === null ? null : n + (capo || 0);
    });
    var ns = cn.filter(function (n) {
      return n !== null;
    });
    var total = bars + (countIn || 0);
    for (var b = 0; b < total; b++) {
      for (var beat = 0; beat < beats; beat++)
        events.push({
          at: b * barTime + (beat * 60) / bpm,
          click: true,
          accent: beat === 0,
          duration: 0.05,
          visual: {
            bar: b - (countIn || 0),
            slot: (beat * pattern.slots.length) / beats,
            beat: beat,
            counting: b < (countIn || 0),
          },
        });
      if (b < (countIn || 0)) continue;
      pattern.slots.forEach(function (s, i) {
        if (s === ".") return;
        var at = b * barTime + (i * barTime) / pattern.slots.length;
        var e = {
          at: at,
          duration: Math.min(0.6, (barTime / pattern.slots.length) * 0.95),
          visual: { bar: b - (countIn || 0), slot: i, counting: false },
        };
        if (s === "X") {
          e.click = true;
          e.accent = true;
        } else if (s === "B") e.note = ns[0];
        else if (/^[123]$/.test(s))
          e.note = cn[6 - Number(s)] || ns[ns.length - 1];
        else {
          e.notes = s === "U" ? ns.slice().reverse() : ns;
          e.strum = 0.012;
        }
        events.push(e);
      });
    }
    return {
      events: events,
      barTime: barTime,
      beats: beats,
      countIn: countIn || 0,
    };
  }
  var loopTimer = null,
    loopState = null;
  async function loop(factory, onStep) {
    stopLoop();
    var gen = generation,
      c = await ready();
    if (gen !== generation) return false;
    playing = true;
    loopState = { cycle: 0, next: c.currentTime + 0.09, gen: gen };
    function schedule() {
      if (!loopState || gen !== generation) return;
      nodes = nodes.filter(function (n) {
        return n.playbackState !== 3;
      });
      if (nodes.length > 500) nodes = nodes.slice(-250);
      timers = timers.filter(function (t) {
        return t;
      });
      if (timers.length > 600) timers = timers.slice(-300);
      while (loopState.next < c.currentTime + 0.15) {
        var batch = factory(loopState.cycle);
        var start = loopState.next;
        batch.events.forEach(function (e) {
          var t = start + e.at;
          if (e.visual && e.visual.silent) {
          } else if (e.click) click(t, e.accent);
          else if (e.notes) chord(e.notes, t, e.duration || 0.5, e.strum);
          else note(e.note, t, e.duration || 0.5);
          if (e.visual && onStep)
            later(
              function () {
                onStep(e.visual, loopState ? loopState.cycle : 0);
              },
              t,
              gen,
            );
        });
        loopState.next += batch.duration;
        loopState.cycle++;
      }
    }
    schedule();
    loopTimer = setInterval(schedule, 30);
    return true;
  }
  function stopLoop() {
    clearInterval(loopTimer);
    loopTimer = null;
    loopState = null;
    stop();
  }
  function now() {
    return context().currentTime;
  }
  function configure(c) {
    voice = c.voice || voice;
    setVolume(c.volume === undefined ? volume : c.volume);
  }
  return {
    ready: ready,
    note: note,
    chord: chord,
    click: click,
    sequence: sequence,
    question: question,
    rhythmEvents: rhythmEvents,
    loop: loop,
    stop: stopLoop,
    now: now,
    configure: configure,
    get playing() {
      return playing;
    },
  };
})();
