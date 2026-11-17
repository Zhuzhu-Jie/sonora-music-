/* Musical domain logic. No DOM, audio, network or storage dependencies. */
var Music = (function () {
  "use strict";
  var pcNames = [
    "C",
    "C♯",
    "D",
    "E♭",
    "E",
    "F",
    "F♯",
    "G",
    "A♭",
    "A",
    "B♭",
    "B",
  ];
  var intervals = [
    "纯一度",
    "小二度",
    "大二度",
    "小三度",
    "大三度",
    "纯四度",
    "三全音",
    "纯五度",
    "小六度",
    "大六度",
    "小七度",
    "大七度",
    "纯八度",
  ];
  var scales = {
    major: { name: "自然大调", notes: [0, 2, 4, 5, 7, 9, 11, 12] },
    minor: { name: "自然小调", notes: [0, 2, 3, 5, 7, 8, 10, 12] },
    majorPent: { name: "大调五声", notes: [0, 2, 4, 7, 9, 12] },
    minorPent: { name: "小调五声", notes: [0, 3, 5, 7, 10, 12] },
    harmonicMinor: { name: "和声小调", notes: [0, 2, 3, 5, 7, 8, 11, 12] },
    dorian: { name: "多利亚调式", notes: [0, 2, 3, 5, 7, 9, 10, 12] },
    mixolydian: { name: "混合利底亚", notes: [0, 2, 4, 5, 7, 9, 10, 12] },
    blues: { name: "小调布鲁斯", notes: [0, 3, 5, 6, 7, 10, 12] },
  };
  var chordTypes = [
    { id: "", name: "大三和弦", notes: [0, 4, 7] },
    { id: "m", name: "小三和弦", notes: [0, 3, 7] },
    { id: "dim", name: "减三和弦", notes: [0, 3, 6] },
    { id: "aug", name: "增三和弦", notes: [0, 4, 8] },
    { id: "7", name: "属七和弦", notes: [0, 4, 7, 10] },
    { id: "maj7", name: "大七和弦", notes: [0, 4, 7, 11] },
    { id: "m7", name: "小七和弦", notes: [0, 3, 7, 10] },
    { id: "sus2", name: "挂二和弦", notes: [0, 2, 7] },
    { id: "sus4", name: "挂四和弦", notes: [0, 5, 7] },
  ];
  var strings = [64, 59, 55, 50, 45, 40];
  function mod(n) {
    return ((n % 12) + 12) % 12;
  }
  function freq(n) {
    return 440 * Math.pow(2, (n - 69) / 12);
  }
  function name(n) {
    return pcNames[mod(n)] + (Math.floor(n / 12) - 1);
  }
  function pc(s) {
    var m = /^([A-Ga-g])([#♯b♭]{0,2})$/.exec(s);
    if (!m) return null;
    var n = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1].toUpperCase()];
    return mod(
      n +
        (m[2].match(/[#♯]/g) || []).length -
        (m[2].match(/[b♭]/g) || []).length,
    );
  }
  function spelled(root, offset, letterStep) {
    var r = pcNames[mod(root)],
      letters = "CDEFGAB",
      nat = [0, 2, 4, 5, 7, 9, 11];
    var idx = (letters.indexOf(r[0]) + letterStep) % 7;
    var d = mod(root + offset - nat[idx]);
    if (d > 6) d -= 12;
    return letters[idx] + (d > 0 ? "♯".repeat(d) : "♭".repeat(-d));
  }
  function scaleNames(root, scale) {
    var a = scales[scale].notes;
    var steps =
      scale === "majorPent"
        ? [0, 1, 2, 4, 5, 7]
        : scale === "minorPent"
          ? [0, 2, 3, 4, 6, 7]
          : scale === "blues"
            ? [0, 2, 3, 4, 4, 6, 7]
            : null;
    return a.map(function (n, i) {
      return spelled(root, n, steps ? steps[i] : i);
    });
  }
  function chord(label) {
    var m =
      /^([A-Ga-g][#♯b♭]?)(maj7|m7|dim|aug|sus2|sus4|add9|m6|m9|m|7|6|9|)(?:\/([A-Ga-g][#♯b♭]?))?$/.exec(
        String(label),
      );
    if (!m) return null;
    var root = pc(m[1]);
    var suffix = m[2];
    var t = chordTypes.filter(function (x) {
      return x.id === suffix;
    })[0];
    var ns = t
      ? t.notes
      : {
          add9: [0, 4, 7, 14],
          m6: [0, 3, 7, 9],
          m9: [0, 3, 7, 10, 14],
          6: [0, 4, 7, 9],
          9: [0, 4, 7, 10, 14],
        }[suffix];
    if (!ns) return null;
    return {
      name: label,
      root: root,
      offsets: ns.slice(),
      bass: m[3] ? pc(m[3]) : root,
    };
  }
  function voiced(label, capo) {
    var c = chord(label);
    if (!c) return null;
    var n = [36 + c.bass + (capo || 0)];
    c.offsets.forEach(function (x) {
      n.push(48 + c.root + x + (capo || 0));
    });
    return n;
  }
  function shapeNotes(shape) {
    if (!/^[x0-9]{6}$/.test(shape)) return [];
    var opens = [40, 45, 50, 55, 59, 64];
    return shape.split("").map(function (f, i) {
      return f === "x" ? null : opens[i] + Number(f);
    });
  }
  function progression(p, root) {
    var steps = [0, 2, 4, 5, 7, 9, 11],
      qualities = ["", "m", "m", "", "", "m", "dim"];
    var map = {
      I: [0, "", 0],
      IV: [5, "", 3],
      iv: [5, "m", 3],
      bVII: [10, "", 6],
      Vofvi: [4, "7", 2],
      vi: [9, "m", 5],
      Imaj7: [0, "maj7", 0],
      I7: [0, "7", 0],
    };
    return p.seq.map(function (x) {
      if (typeof x === "number")
        return spelled(root, steps[x], x) + qualities[x];
      var a = map[x];
      if (!a) throw Error("Unsupported degree " + x);
      return spelled(root, a[0], a[2]) + a[1];
    });
  }
  function shuffled(a, rng) {
    var b = a.slice();
    for (var i = b.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1)),
        t = b[i];
      b[i] = b[j];
      b[j] = t;
    }
    return b;
  }
  function pick(a, rng) {
    return a[Math.floor(rng() * a.length)];
  }
  function rootNote(c, rng) {
    return c.key === "random"
      ? 48 + Math.floor(rng() * 12)
      : 48 + mod(Number(c.key) || 0);
  }
  function question(mode, c, ref, rng) {
    rng = rng || Math.random;
    var level = c.difficulty || "easy",
      root = rootNote(c, rng),
      q = {
        mode: mode,
        voice: c.voice || "guitar",
        speed: c.speed || 0.55,
        chordStyle: c.chordStyle || "block",
        root: root,
        difficulty: level,
        presentation: c.presentation || "up",
        options: [],
        answer: "",
        notes: [],
        scale: c.scale || "major",
      };
    var pool, v, sign;
    if (mode === "direction") {
      pool =
        c.focus && c.focus.length
          ? c.focus
          : level === "easy"
            ? [0, 5, 7, 12, -5, -7, -12]
            : level === "medium"
              ? [0, 2, 3, 4, 5, 7, -2, -3, -4, -5, -7]
              : [0, 1, 2, 3, 4, 5, 7, 12, -1, -2, -3, -4, -5, -7, -12];
      v = pick(pool, rng);
      q.semi = v;
      q.notes = [root, root + v];
      q.answer = v === 0 ? "same" : v > 0 ? "up" : "down";
      q.options = [
        ["up", "第二音更高"],
        ["down", "第二音更低"],
        ["same", "两音相同"],
      ];
      q.tag = v === 0 ? "同音" : Math.abs(v) + "半音方向";
      q.explain =
        name(root) +
        " → " +
        name(root + v) +
        "，" +
        (v === 0
          ? "音高相同。"
          : (v > 0 ? "上行" : "下行") + " " + Math.abs(v) + " 个半音。");
    } else if (mode === "interval") {
      pool =
        c.focus && c.focus.length
          ? c.focus
          : level === "easy"
            ? [3, 4, 5, 7, 12]
            : level === "medium"
              ? [1, 2, 3, 4, 5, 7, 12]
              : Array.from({ length: 13 }, function (_, i) {
                  return i;
                });
      v = pick(pool, rng);
      q.semi = v;
      if (q.presentation === "mixed")
        q.presentation = pick(["up", "down", "harmonic"], rng);
      sign = q.presentation === "down" ? -1 : 1;
      if (sign < 0) q.root += 12;
      q.notes = [q.root, q.root + sign * v];
      q.answer = String(v);
      q.options = pool.map(function (n) {
        return [String(n), intervals[n]];
      });
      q.tag = intervals[v] + " · " + q.presentation;
      q.explain =
        name(q.notes[0]) +
        " 与 " +
        name(q.notes[1]) +
        " 相距 " +
        v +
        " 个半音，按听觉距离归为" +
        intervals[v] +
        "。";
    } else if (mode === "degree") {
      pool =
        c.focus && c.focus.length
          ? c.focus
          : level === "easy"
            ? [1, 3, 5]
            : level === "medium"
              ? [1, 2, 3, 4, 5, 6]
              : [1, 2, 3, 4, 5, 6, 7];
      v = pick(pool, rng);
      if (!["major", "minor"].includes(q.scale)) q.scale = "major";
      q.degree = v;
      q.notes = [root + scales[q.scale].notes[v - 1]];
      q.answer = String(v);
      q.options = pool.map(function (n) {
        return [String(n), "第 " + n + " 级"];
      });
      q.tag = scales[q.scale].name + " · 第" + v + "级";
      q.explain =
        "主音 " +
        name(root) +
        "；目标 " +
        name(q.notes[0]) +
        " 是" +
        scales[q.scale].name +
        "第 " +
        v +
        " 级，相对主音 " +
        scales[q.scale].notes[v - 1] +
        " 个半音。";
    } else if (mode === "scale") {
      pool =
        c.scalePool && c.scalePool.length
          ? c.scalePool
          : level === "easy"
            ? ["major", "minor"]
            : level === "medium"
              ? ["major", "minor", "majorPent", "minorPent"]
              : Object.keys(scales);
      v = pick(pool, rng);
      q.scale = v;
      q.notes = scales[v].notes.map(function (n) {
        return root + n;
      });
      q.answer = v;
      q.options = pool.map(function (n) {
        return [n, scales[n].name];
      });
      q.tag = scales[v].name;
      q.explain =
        pcNames[mod(root)] +
        " " +
        scales[v].name +
        "：" +
        scales[v].notes.join("–") +
        "（相对主音半音数）。注意声音的音级关系，而不只数音符。";
    } else if (mode === "chord") {
      pool =
        level === "easy"
          ? [0, 1]
          : level === "medium"
            ? [0, 1, 2, 4, 5, 6]
            : [0, 1, 2, 3, 4, 5, 6, 7, 8];
      v = pick(pool, rng);
      var ct = chordTypes[v];
      q.chordType = ct.id;
      q.notes = ct.notes.map(function (n) {
        return root + n;
      });
      q.inversion =
        level === "hard" && c.inversions
          ? Math.floor(rng() * q.notes.length)
          : 0;
      for (var k = 0; k < q.inversion; k++) q.notes.push(q.notes.shift() + 12);
      q.answer = ct.id || "major";
      q.options = pool.map(function (n) {
        return [chordTypes[n].id || "major", chordTypes[n].name];
      });
      q.tag = ct.name;
      q.explain =
        ct.name +
        "的半音结构：" +
        ct.notes.join("–") +
        "。" +
        (q.inversion ? "本题使用转位，最低音不一定是根音。" : "本题使用原位。");
    } else if (mode === "progression") {
      q.scale = "major";
      pool =
        level === "easy"
          ? [0, 2, 3]
          : level === "medium"
            ? [0, 1, 2, 3, 4, 6, 7, 10]
            : ref.progressionData.map(function (_, i) {
                return i;
              });
      v = pick(pool, rng);
      q.progression = v;
      q.chords = progression(ref.progressionData[v], mod(root));
      q.notes = [];
      q.answer = String(v);
      var choices = shuffled(
        pool.filter(function (n) {
          return n !== v;
        }),
        rng,
      ).slice(0, level === "easy" ? 2 : 3);
      choices.push(v);
      q.options = shuffled(choices, rng).map(function (n) {
        return [String(n), ref.progressionData[n].degree];
      });
      q.tag = ref.progressionData[v].degree;
      q.explain =
        "实际和弦：" +
        q.chords.join(" – ") +
        "。" +
        ref.progressionData[v].explain;
    } else if (mode === "melody") {
      q.scale = c.scale === "minor" ? "minor" : "major";
      pool = level === "easy" ? [1, 2, 3, 5] : [1, 2, 3, 4, 5, 6, 7];
      var length = Math.max(3, Math.min(6, Number(c.length) || 3));
      q.degrees = Array.from({ length: length }, function () {
        return pick(pool, rng);
      });
      q.notes = q.degrees.map(function (n) {
        return root + scales[q.scale].notes[n - 1];
      });
      q.answer = q.degrees.join("-");
      q.options = pool.map(function (n) {
        return [String(n), String(n)];
      });
      q.tag = length + "音短句 · " + scales[q.scale].name;
      q.explain =
        "正确音级：" +
        q.degrees.join(" · ") +
        "。实际音高：" +
        q.notes.map(name).join(" – ") +
        "。";
    } else if (mode === "theory") {
      v = Math.floor(rng() * (ref.questionData.length + 20));
      if (v < ref.questionData.length) {
        var t = ref.questionData[v];
        q.prompt = t[0];
        q.options = t[1].map(function (x, i) {
          return [String(i), x];
        });
        q.answer = String(t[2]);
        q.explain = t[3];
        q.tag = "基础乐理";
      } else {
        var string = Math.floor(rng() * 6),
          fret = Math.floor(rng() * 13),
          actual = mod(strings[string] + fret);
        q.prompt =
          "标准调弦第 " + (string + 1) + " 弦第 " + fret + " 品，音名是什么？";
        q.options = pcNames.map(function (x, i) {
          return [String(i), x];
        });
        q.answer = String(actual);
        q.explain =
          "空弦 " +
          name(strings[string]) +
          "，升高 " +
          fret +
          " 个半音得到 " +
          name(strings[string] + fret) +
          "。";
        q.tag = "指板音名";
      }
      q.notes = [];
    } else throw Error("Unsupported mode");
    q.title =
      q.options
        .filter(function (x) {
          return x[0] === q.answer;
        })
        .map(function (x) {
          return x[1];
        })[0] || q.tag;
    q.key = [
      mode,
      root,
      q.semi,
      q.scale,
      q.degree,
      q.chordType,
      q.progression,
      q.answer,
      q.presentation,
    ].join(":");
    return q;
  }
  function cents(hz, midi) {
    return 1200 * Math.log2(hz / freq(midi));
  }
  function tapScore(expected, taps, tolerance) {
    var used = {},
      errors = [],
      hits = 0;
    expected.forEach(function (e) {
      var best = -1,
        d = Infinity;
      taps.forEach(function (t, i) {
        if (!used[i] && Math.abs(t - e) < d) {
          d = Math.abs(t - e);
          best = i;
        }
      });
      if (best >= 0 && d <= tolerance) {
        used[best] = true;
        hits++;
        errors.push(d);
      }
    });
    return {
      hits: hits,
      total: expected.length,
      extra: taps.length - hits,
      accuracy: expected.length
        ? Math.round((hits / Math.max(expected.length, taps.length)) * 100)
        : 0,
      mean: errors.length
        ? errors.reduce(function (a, b) {
            return a + b;
          }, 0) / errors.length
        : null,
    };
  }
  return {
    pcNames: pcNames,
    intervals: intervals,
    scales: scales,
    chordTypes: chordTypes,
    strings: strings,
    mod: mod,
    freq: freq,
    name: name,
    pc: pc,
    spelled: spelled,
    scaleNames: scaleNames,
    chord: chord,
    voiced: voiced,
    shapeNotes: shapeNotes,
    progression: progression,
    question: question,
    cents: cents,
    tapScore: tapScore,
    shuffle: shuffled,
  };
})();
if (typeof module !== "undefined" && module.exports) module.exports = Music;
