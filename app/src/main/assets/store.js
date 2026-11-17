var State = (function () {
  "use strict";
  var KEY = "sonora-v2",
    legacy = null;
  function today() {
    var d = new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }
  function fresh() {
    return {
      schema: 2,
      start: today(),
      daily: 30,
      seconds: 0,
      days: {},
      completed: [],
      notes: {},
      events: [],
      mistakes: [],
      sessions: [],
      songs: [],
      settings: {
        voice: "guitar",
        volume: 0.35,
        difficulty: "easy",
        key: "0",
        presentation: "up",
        scale: "major",
        length: 3,
        rounds: 10,
        bpm: 72,
      },
      song: {
        title: "晚风沿路 · 原创练习",
        chords: ["C", "G", "Am", "F"],
        lyrics: [
          "晚风 / 轻轻 / 吹过 / 街角",
          "星光 / 慢慢 / 落在 / 肩上",
          "我把 / 心事 / 轻轻 / 哼唱",
          "跟着 / 节拍 / 走向 / 远方",
        ],
        capo: 0,
        pattern: "r2",
        bpm: 72,
      },
      legacy: null,
    };
  }
  function object(x) {
    return x && typeof x === "object" && !Array.isArray(x);
  }
  function number(x, min, max, fallback) {
    return Number.isFinite(Number(x)) && Number(x) >= min && Number(x) <= max
      ? Number(x)
      : fallback;
  }
  function text(x, max) {
    return typeof x === "string" ? x.slice(0, max) : "";
  }
  function validDay(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var a = s.split("-").map(Number),
      d = new Date(a[0], a[1] - 1, a[2]);
    return (
      a[0] >= 2000 &&
      a[0] <= 2100 &&
      d.getFullYear() === a[0] &&
      d.getMonth() === a[1] - 1 &&
      d.getDate() === a[2]
    );
  }
  function cleanQuestion(q) {
    if (
      !object(q) ||
      ![
        "direction",
        "interval",
        "degree",
        "scale",
        "chord",
        "progression",
        "melody",
        "theory",
      ].includes(q.mode) ||
      !Array.isArray(q.options) ||
      q.options.length > 20
    )
      return null;
    var out = {};
    [
      "mode",
      "voice",
      "chordStyle",
      "difficulty",
      "presentation",
      "answer",
      "tag",
      "explain",
      "key",
      "title",
      "prompt",
      "scale",
      "chordType",
    ].forEach(function (k) {
      out[k] = text(q[k], k === "explain" ? 1500 : 350);
    });
    ["root", "semi", "degree", "inversion", "progression", "speed"].forEach(
      function (k) {
        if (Number.isFinite(q[k])) out[k] = number(q[k], -24, 127, 0);
      },
    );
    out.options = q.options
      .filter(function (a) {
        return Array.isArray(a) && a.length === 2;
      })
      .map(function (a) {
        return [text(a[0], 100), text(a[1], 250)];
      });
    out.notes = Array.isArray(q.notes)
      ? q.notes
          .filter(function (x) {
            return Number.isInteger(x) && x >= 24 && x <= 100;
          })
          .slice(0, 16)
      : [];
    if (q.degrees)
      out.degrees = q.degrees
        .filter(function (x) {
          return Number.isInteger(x) && x >= 1 && x <= 7;
        })
        .slice(0, 6);
    if (q.chords)
      out.chords = q.chords
        .filter(function (x) {
          return typeof x === "string" && Music.chord(x);
        })
        .slice(0, 12);
    if (
      ["degree", "melody", "scale", "progression"].includes(out.mode) &&
      !Music.scales[out.scale]
    )
      return null;
    if (!Number.isInteger(out.root) || out.root < 24 || out.root > 100)
      return null;
    if (["direction", "interval"].includes(out.mode) && out.notes.length !== 2)
      return null;
    if (out.mode === "degree" && out.notes.length !== 1) return null;
    if (
      out.mode === "melody" &&
      (!out.degrees ||
        out.degrees.length < 3 ||
        out.degrees.length !== out.notes.length ||
        out.answer !== out.degrees.join("-"))
    )
      return null;
    if (out.mode === "progression" && (!out.chords || out.chords.length < 2))
      return null;
    if (
      !out.options.some(function (a) {
        return a[0] === out.answer;
      }) &&
      out.mode !== "melody"
    )
      return null;
    return out;
  }
  function clean(x) {
    if (!object(x) || x.schema !== 2) throw Error("不是听见 2.0 的有效备份");
    var d = fresh();
    d.start = validDay(x.start) ? x.start : d.start;
    d.daily = [15, 30, 45].includes(x.daily) ? x.daily : 30;
    d.seconds = number(x.seconds, 0, 315360000, 0);
    if (object(x.days))
      Object.keys(x.days)
        .slice(0, 150)
        .forEach(function (k) {
          if (!/^[ges]-\d{1,2}$/.test(k)) return;
          var i = +k.slice(2),
            max = k[0] === "g" ? 84 : k[0] === "e" ? 42 : 14;
          if (i >= max) return;
          var v = x.days[k];
          if (!object(v)) return;
          d.days[k] = {
            done: v.done === true,
            minutes: number(v.minutes, 0, 360, 0),
            note: text(v.note, 3000),
            checks: Array.isArray(v.checks)
              ? v.checks.slice(0, 4).map(function (b) {
                  return b === true;
                })
              : [],
          };
        });
    var ids = REFERENCE.lessons.map(function (l) {
      return l.id;
    });
    if (Array.isArray(x.completed))
      d.completed = x.completed
        .filter(function (id) {
          return ids.includes(id);
        })
        .filter(function (id, i, a) {
          return a.indexOf(id) === i;
        });
    if (object(x.notes))
      ids.forEach(function (id) {
        if (typeof x.notes[id] === "string")
          d.notes[id] = text(x.notes[id], 4000);
      });
    if (Array.isArray(x.events))
      d.events = x.events
        .slice(-1000)
        .filter(function (e) {
          return (
            object(e) &&
            typeof e.correct === "boolean" &&
            Number.isFinite(e.time)
          );
        })
        .map(function (e) {
          return {
            mode: text(e.mode, 40),
            tag: text(e.tag, 100),
            correct: e.correct,
            time: e.time,
          };
        });
    if (Array.isArray(x.sessions))
      d.sessions = x.sessions
        .slice(-200)
        .filter(function (e) {
          return object(e) && Number.isFinite(e.time);
        })
        .map(function (e) {
          return {
            type: text(e.type, 60),
            label: text(e.label, 100),
            time: e.time,
            seconds: number(e.seconds, 0, 3600, 0),
            score: e.score === null ? null : number(e.score, 0, 100, null),
            detail: text(e.detail, 500),
          };
        });
    if (Array.isArray(x.mistakes))
      d.mistakes = x.mistakes
        .slice(-200)
        .map(function (m) {
          if (!object(m)) return null;
          var q = cleanQuestion(m.question);
          return q
            ? {
                key: text(m.key, 500),
                question: q,
                wrong: number(m.wrong, 1, 10000, 1),
                streak: number(m.streak, 0, 2, 0),
                mastered: m.mastered === true,
                time: number(m.time, 0, 1e14, Date.now()),
              }
            : null;
        })
        .filter(Boolean);
    if (object(x.settings)) {
      var s = x.settings;
      d.settings.voice = ["guitar", "piano", "pure"].includes(s.voice)
        ? s.voice
        : "guitar";
      d.settings.volume = number(s.volume, 0, 0.8, 0.35);
      d.settings.difficulty = ["easy", "medium", "hard"].includes(s.difficulty)
        ? s.difficulty
        : "easy";
      d.settings.key =
        s.key === "random" ? "random" : String(number(s.key, 0, 11, 0));
      d.settings.presentation = ["up", "down", "harmonic", "mixed"].includes(
        s.presentation,
      )
        ? s.presentation
        : "up";
      d.settings.scale = ["major", "minor"].includes(s.scale)
        ? s.scale
        : "major";
      d.settings.length = number(s.length, 3, 6, 3);
      d.settings.rounds = [5, 10, 20].includes(s.rounds) ? s.rounds : 10;
      d.settings.bpm = number(s.bpm, 40, 180, 72);
    }
    if (object(x.song)) {
      var a = x.song;
      d.song.id = text(a.id, 80);
      d.song.title = text(a.title, 60) || d.song.title;
      var ch = Array.isArray(a.chords)
        ? a.chords
            .filter(function (n) {
              return Music.chord(n);
            })
            .slice(0, 16)
        : [];
      if (ch.length) d.song.chords = ch;
      d.song.lyrics = Array.isArray(a.lyrics)
        ? a.lyrics.slice(0, 16).map(function (t) {
            return text(t, 200);
          })
        : [];
      d.song.capo = Math.round(number(a.capo, 0, 12, 0));
      d.song.bpm = number(a.bpm, 40, 180, 72);
      d.song.pattern = REFERENCE.rhythmData.some(function (p) {
        return p.id === a.pattern;
      })
        ? a.pattern
        : "r2";
    }
    if (Array.isArray(x.songs))
      d.songs = x.songs
        .filter(object)
        .slice(-30)
        .map(function (s) {
          return clean({ schema: 2, song: s }).song;
        });
    if (object(x.legacy)) {
      d.legacy = {
        completed: Array.isArray(x.legacy.completed)
          ? x.legacy.completed.filter(function (n) {
              return Number.isInteger(n) && n >= 0 && n < 18;
            })
          : [],
        notes: {},
        pitchCount: number(x.legacy.pitchCount, 0, 50, 0),
        earCount: number(x.legacy.earCount, 0, 50, 0),
      };
      if (object(x.legacy.notes))
        Object.keys(x.legacy.notes).forEach(function (k) {
          if (/^\d+$/.test(k) && +k < 18)
            d.legacy.notes[k] = text(x.legacy.notes[k], 1500);
        });
    }
    return d;
  }
  var data = fresh();
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) data = clean(JSON.parse(raw));
    else {
      var v = JSON.parse(localStorage.getItem("sonora-v1") || "null");
      if (v && typeof v === "object") {
        data.legacy = {
          completed: Array.isArray(v.completed) ? v.completed : [],
          notes: object(v.notes) ? v.notes : {},
          pitchCount: Array.isArray(v.pitch) ? v.pitch.length : 0,
          earCount: Array.isArray(v.ear) ? v.ear.length : 0,
        };
        data = clean(data);
      }
    }
  } catch (e) {}
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      if (window.App) App.toast("本机存储不可用，请导出备份。");
      return false;
    }
  }
  function replace(d) {
    var previousLegacy = data.legacy;
    data = clean(d);
    if (!data.legacy && previousLegacy) data.legacy = previousLegacy;
    save();
    return data;
  }
  function answer(q, correct, review) {
    data.events.push({
      mode: q.mode,
      tag: q.tag,
      correct: correct,
      time: Date.now(),
    });
    data.events = data.events.slice(-1000);
    var m = data.mistakes.filter(function (m) {
      return m.key === q.key;
    })[0];
    if (!correct) {
      if (m) {
        m.wrong++;
        m.streak = 0;
        m.mastered = false;
        m.time = Date.now();
      } else
        data.mistakes.push({
          key: q.key,
          question: q,
          wrong: 1,
          streak: 0,
          mastered: false,
          time: Date.now(),
        });
    } else if (review && m) {
      m.streak++;
      m.mastered = m.streak >= 2;
      m.time = Date.now();
    }
    data.mistakes = data.mistakes.slice(-200);
    save();
  }
  function session(type, label, seconds, score, detail) {
    data.sessions.push({
      type: type,
      label: label,
      seconds: seconds,
      score: score,
      time: Date.now(),
      detail: detail || "",
    });
    data.sessions = data.sessions.slice(-200);
    save();
  }
  function recordDay(key) {
    return (
      data.days[key] ||
      (data.days[key] = { done: false, minutes: 0, note: "", checks: [] })
    );
  }
  function accuracy(mode) {
    var events = data.events.filter(function (e) {
      return !mode || e.mode === mode;
    });
    return events.length
      ? Math.round(
          (events.filter(function (e) {
            return e.correct;
          }).length /
            events.length) *
            100,
        )
      : null;
  }
  function backup() {
    return JSON.stringify(
      {
        app: "sonora",
        version: 2,
        exportedAt: new Date().toISOString(),
        data: data,
      },
      null,
      2,
    );
  }
  function parseBackup(s) {
    if (typeof s !== "string" || s.length > 4194304)
      throw Error("备份文件过大");
    var o = JSON.parse(s);
    if (o.app !== "sonora" || o.version !== 2)
      throw Error("请选择听见 2.0 导出的 JSON 备份");
    return clean(o.data);
  }
  save();
  return {
    get data() {
      return data;
    },
    save: save,
    replace: replace,
    clean: clean,
    question: cleanQuestion,
    answer: answer,
    session: session,
    recordDay: recordDay,
    accuracy: accuracy,
    backup: backup,
    parseBackup: parseBackup,
    today: today,
  };
})();
