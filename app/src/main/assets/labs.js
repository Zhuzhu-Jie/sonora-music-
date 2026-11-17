var Labs = (function () {
  "use strict";
  var A = App,
    $ = A.$,
    esc = A.esc,
    icon = A.icon,
    btn = A.btn,
    attr = A.attr;
  var fret = { root: 0, scale: "major", labels: "names", picked: null },
    fq = null,
    chordFilter = "all",
    chordSearch = "",
    prog = { id: 0, key: 0, bpm: 72, loop: false },
    pattern = { id: "r2", chord: "C", bpm: 72, loop: false },
    studio = { playing: false, layer: "read" },
    change = { a: "C", b: "G", bpm: 60, beats: 4, playing: false, start: 0 },
    metro = { bpm: 72, meter: 4, sub: 1, playing: false, taps: [] },
    pianoOctave = 4;
  function chordSVG(c) {
    var ns = c.shape.split(""),
      svg =
        '<svg class="chord-svg" viewBox="0 0 150 178" role="img" aria-label="' +
        esc(c.name + " 指法，从左到右六弦至一弦") +
        '">';
    for (var f = 0; f <= 4; f++)
      svg +=
        '<path d="M24 ' +
        (32 + f * 29) +
        'h100" stroke="#c0c9da" stroke-width="' +
        (f === 0 ? 4 : 1) +
        '"/>';
    for (var s = 0; s < 6; s++) {
      var x = 24 + s * 20;
      svg +=
        '<path d="M' +
        x +
        ' 32v116" stroke="#9da9bf" stroke-width="' +
        (s < 2 ? 1.5 : 1) +
        '"/>';
      if (ns[s] === "x")
        svg +=
          '<text x="' +
          x +
          '" y="20" text-anchor="middle" font-size="14" fill="#a68b7d">×</text>';
      else if (ns[s] === "0")
        svg +=
          '<circle cx="' + x + '" cy="15" r="5" stroke="#4d69cc" fill="none"/>';
      else
        svg +=
          '<circle cx="' +
          x +
          '" cy="' +
          (32 + (Number(ns[s]) - 0.5) * 29) +
          '" r="8" fill="#4d69cc"/>';
      svg +=
        '<text x="' +
        x +
        '" y="169" text-anchor="middle" font-size="10" fill="#8b96aa">' +
        (6 - s) +
        "</text>";
    }
    return svg + "</svg>";
  }
  A.drawChord = chordSVG;
  function fretHTML(quiz) {
    var valid = Music.scales[fret.scale].notes.map(function (n) {
      return Music.mod(fret.root + n);
    });
    var out = '<div class="fret-scroll"><div class="fretboard">';
    Music.strings.forEach(function (open, s) {
      out +=
        '<div class="fret-row ' +
        (s > 3 ? "bass" : "") +
        '"><span class="string-label">' +
        (s + 1) +
        "弦 " +
        Music.pcNames[Music.mod(open)] +
        "</span>";
      for (var f = 0; f <= 12; f++) {
        var n = open + f,
          pc = Music.mod(n),
          good = valid.includes(pc),
          picked = fret.picked === s + "-" + f;
        var cls = quiz
          ? fq && fq.answered && pc === fq.target && s === fq.string
            ? "scale"
            : ""
          : (good ? "scale" : "") + (pc === fret.root ? " root" : "");
        if (picked) cls += " picked";
        var label =
          quiz && !fq.answered
            ? "·"
            : fret.labels === "degrees" && good
              ? String(
                  Music.scales[fret.scale].notes
                    .map(Music.mod)
                    .indexOf(Music.mod(pc - fret.root)) + 1,
                )
              : Music.pcNames[pc];
        out +=
          '<button class="fret-cell ' +
          cls +
          '" ' +
          attr(quiz ? "fret-answer" : "fret-note", s + "-" + f) +
          ' aria-label="第' +
          (s + 1) +
          "弦第" +
          f +
          "品" +
          (quiz ? "" : Music.name(n)) +
          '"><span>' +
          esc(label) +
          "</span></button>";
      }
      out += "</div>";
    });
    out +=
      '<div class="fret-numbers"><span>品位</span>' +
      Array.from({ length: 13 }, function (_, i) {
        return "<span>" + i + "</span>";
      }).join("") +
      "</div></div></div>";
    return out;
  }
  A.modals.fret = function () {
    return (
      A.title(
        "ONE FRET, ONE SEMITONE",
        "把指板，变成一张地图",
        "上方为第1弦（细弦），下方为第6弦（粗弦）。横向滑动查看0–12品。",
      ) +
      '<div class="form-grid">' +
      A.field(
        "主音",
        "fret-root",
        Music.pcNames.map(function (n, i) {
          return [i, n];
        }),
        fret.root,
      ) +
      A.field(
        "音阶",
        "fret-scale",
        Object.keys(Music.scales).map(function (k) {
          return [k, Music.scales[k].name];
        }),
        fret.scale,
      ) +
      A.field(
        "显示方式",
        "fret-labels",
        [
          ["names", "显示音名"],
          ["degrees", "显示音阶内顺序"],
        ],
        fret.labels,
      ) +
      '</div><div class="badge-list"><span class="pill orange">橙色 = 主音</span><span class="pill blue">蓝色 = 音阶内音</span></div><div id="fret-board">' +
      fretHTML(false) +
      '</div><div class="keyboard-note" id="fret-note-name">点击任意品位，听它的音</div><div class="tip">' +
      esc(Music.scaleNames(fret.root, fret.scale).join(" · ")) +
      "<br>同名音在不同琴弦和品位会重复出现。相邻品差一个半音，12品比空弦高一个八度。</div>" +
      btn("fret-play", "", icon("play") + " 听这个音阶", "soft wide") +
      btn("fretquiz", "", icon("grid") + " 试试指板找音", "outline wide")
    );
  };
  A.changes["fret-root"] = function (e) {
    fret.root = +e.target.value;
    $("#dialog-body").innerHTML = A.modals.fret();
  };
  A.changes["fret-scale"] = function (e) {
    fret.scale = e.target.value;
    $("#dialog-body").innerHTML = A.modals.fret();
  };
  A.changes["fret-labels"] = function (e) {
    fret.labels = e.target.value;
    $("#fret-board").innerHTML = fretHTML(false);
  };
  A.actions["fret-note"] = function (id) {
    var a = id.split("-").map(Number),
      n = Music.strings[a[0]] + a[1];
    fret.picked = id;
    $("#fret-board").innerHTML = fretHTML(false);
    $("#fret-note-name").textContent =
      Music.name(n) + " · " + Music.freq(n).toFixed(1) + " Hz";
    Sound.sequence([{ at: 0, note: n, duration: 1 }], {});
  };
  A.actions["fret-play"] = function () {
    Sound.sequence(
      Music.scales[fret.scale].notes.map(function (n, i) {
        return { at: i * 0.4, note: 48 + fret.root + n, duration: 0.37 };
      }),
      {},
    );
  };
  function newFret() {
    fq.string = Math.floor(Math.random() * 6);
    fq.target = Math.floor(Math.random() * 12);
    fq.answered = false;
    fq.right = false;
    fret.picked = null;
    fq.q = {
      mode: "theory",
      root: 60,
      difficulty: "medium",
      presentation: "up",
      options: Music.pcNames.map(function (x, i) {
        return [String(i), x];
      }),
      answer: String(fq.target),
      notes: [],
      tag: "第" + (fq.string + 1) + "弦音名",
      title: Music.pcNames[fq.target],
      prompt:
        "标准调弦第" +
        (fq.string + 1) +
        "弦0–12品范围，找到 " +
        Music.pcNames[fq.target] +
        "（同名音均可）。",
      key: "fret:" + fq.string + ":" + fq.target,
      explain:
        "标准空弦音 " +
        Music.name(Music.strings[fq.string]) +
        "，每升1品增加1个半音。请对照指板标记。",
    };
  }
  A.actions.fretquiz = function () {
    fq = { round: 0, total: 10, correct: 0, begin: Date.now() };
    newFret();
    A.open("fretquiz");
  };
  A.modals.fretquiz = function () {
    if (fq.round >= fq.total)
      return (
        A.title(
          "KNOW YOUR FRETBOARD",
          "这一组指板定位完成了",
          "之后可以换一根弦，继续巩固同名音的位置。",
        ) +
        '<div class="result-hero"><div class="big">' +
        fq.correct +
        " / " +
        fq.total +
        "</div><p>首答正确数 · 错题已收录到乐理复练。</p></div>" +
        btn("fretquiz", "", "再练一组", "accent wide")
      );
    return (
      A.title(
        "FIND IT ON THE NECK",
        "在第 " + (fq.string + 1) + " 弦找到 " + Music.pcNames[fq.target],
        "0–12 品范围；同名音均可。这里不提前显示每个品位的答案。",
      ) +
      '<span class="pill blue">第 ' +
      (fq.round + 1) +
      " / " +
      fq.total +
      " 题</span>" +
      fretHTML(true) +
      (fq.answered
        ? '<div class="feedback ' +
          (fq.right ? "" : "wrong") +
          '"><h3>' +
          (fq.right ? "✓ 找到了" : "这次没有点到目标位置") +
          "</h3><p>" +
          esc(fq.q.explain) +
          "正确位置已用蓝色标出。</p></div>" +
          btn("fret-next", "", "下一题 " + icon("arrow"), "wide")
        : '<p class="feedback-note">只统计第一次选择，答错后可以对照图寻找规律。</p>')
    );
  };
  A.actions["fret-answer"] = function (id) {
    if (!fq || fq.answered) return;
    var a = id.split("-").map(Number),
      n = Music.strings[a[0]] + a[1];
    fq.right = a[0] === fq.string && Music.mod(n) === fq.target;
    fq.answered = true;
    if (fq.right) fq.correct++;
    fret.picked = id;
    State.answer(fq.q, fq.right, false);
    $("#dialog-body").innerHTML = A.modals.fretquiz();
    Sound.sequence([{ at: 0, note: n, duration: 0.6 }], {});
  };
  A.actions["fret-next"] = function () {
    if (!fq.answered) return;
    fq.round++;
    if (fq.round === fq.total)
      State.session(
        "fret",
        "指板找音",
        (Date.now() - fq.begin) / 1000,
        (fq.correct / fq.total) * 100,
        fq.correct + "/" + fq.total + " 首答正确",
      );
    else newFret();
    $("#dialog-body").innerHTML = A.modals.fretquiz();
    $("#modal").scrollTop = 0;
  };
  function chordList() {
    var list = REFERENCE.chordData.filter(function (c, i) {
      return (
        (chordFilter === "all" ||
          (chordFilter === "basic" && i < 10) ||
          (chordFilter === "seventh" && /7/.test(c.name)) ||
          (chordFilter === "sus" && /sus|add/.test(c.name)) ||
          (chordFilter === "slash" && c.name.includes("/"))) &&
        (!chordSearch ||
          c.name.toLowerCase().includes(chordSearch.toLowerCase()))
      );
    });
    return (
      '<div class="chord-grid">' +
      list
        .map(function (c) {
          return (
            '<button class="chord-tile" ' +
            attr("chord-detail", c.name) +
            "><h3>" +
            esc(c.name) +
            "</h3>" +
            chordSVG(c) +
            "<small>" +
            esc(c.notes) +
            "</small><small>" +
            esc(c.tip) +
            "</small></button>"
          );
        })
        .join("") +
      "</div>" +
      (list.length ? "" : '<div class="empty">没有匹配的内置指法。</div>')
    );
  }
  A.modals.chords = function () {
    return (
      A.title(
        "THIRTY USEFUL SHAPES",
        "看懂一个和弦，也听懂它",
        "图中从左到右为6弦到1弦。×不弹、○空弦、圆点为按弦位置。",
      ) +
      '<label class="search">' +
      icon("search") +
      '<input id="chord-search" type="text" value="' +
      esc(chordSearch) +
      '" placeholder="搜索 C、Am7、G/B…" aria-label="搜索和弦"></label><div class="tabs">' +
      [
        ["all", "全部30种"],
        ["basic", "基础10种"],
        ["seventh", "七和弦"],
        ["sus", "挂留 / 加音"],
        ["slash", "转位 / 指定低音"],
      ]
        .map(function (t) {
          return (
            '<button class="tab ' +
            (chordFilter === t[0] ? "active" : "") +
            '" ' +
            attr("chord-filter", t[0]) +
            ">" +
            t[1] +
            "</button>"
          );
        })
        .join("") +
      '</div><div id="chord-list">' +
      chordList() +
      "</div>"
    );
  };
  A.inputs["chord-search"] = function (e) {
    chordSearch = e.target.value;
    $("#chord-list").innerHTML = chordList();
  };
  A.actions["chord-filter"] = function (id) {
    chordFilter = id;
    $("#dialog-body").innerHTML = A.modals.chords();
  };
  A.actions["chord-detail"] = function (id) {
    A.open("chord-detail", id);
  };
  A.modals["chord-detail"] = function (id) {
    var c = REFERENCE.chordData.filter(function (c) {
      return c.name === id;
    })[0];
    return (
      A.title("CHORD VOICING", c.name, c.tip) +
      '<div class="card"><div class="chord-solo">' +
      chordSVG(c) +
      '</div><p style="text-align:center">' +
      esc(c.notes) +
      '</p><p class="small" style="text-align:center;margin-top:7px">6弦 → 1弦：' +
      esc(c.shape) +
      "</p></div>" +
      btn("chord-play", id, icon("play") + " 听合成扫弦", "accent wide") +
      btn("chord-arp", id, icon("note") + " 逐弦听组成音", "soft wide") +
      '<div class="tip">' +
      Music.shapeNotes(c.shape)
        .filter(function (n) {
          return n !== null;
        })
        .map(Music.name)
        .join(" · ") +
      "<br>同一个和弦可以有多种指法；例如这里的 C7 按法省略五音 G。上方列的是理论组成，音列与试听使用当前指法的实际发声音高，不据此判断你的手指是否按对。</div>"
    );
  };
  A.actions["chord-play"] = function (id) {
    var c = REFERENCE.chordData.filter(function (c) {
      return c.name === id;
    })[0];
    Sound.sequence(
      [{ at: 0, notes: Music.shapeNotes(c.shape), strum: 0.025, duration: 2 }],
      {},
    );
  };
  A.actions["chord-arp"] = function (id) {
    var c = REFERENCE.chordData.filter(function (c) {
      return c.name === id;
    })[0];
    Sound.sequence(
      Music.shapeNotes(c.shape)
        .filter(function (n) {
          return n !== null;
        })
        .map(function (n, i) {
          return { at: i * 0.45, note: n, duration: 0.9 };
        }),
      {},
    );
  };
  A.modals.progressions = function () {
    return (
      A.title(
        "A PATH THROUGH HARMONY",
        "19 套和弦进行，换调再听",
        "和弦进行不是固定的情绪按钮。速度、旋律、节奏与动态会共同改变听感。",
      ) +
      REFERENCE.progressionData
        .map(function (p, i) {
          return (
            '<button class="library-row" ' +
            attr("progression-detail", i) +
            '><div class="grow"><strong>' +
            esc(p.degree) +
            "</strong><small>" +
            esc(p.name) +
            " · " +
            esc(p.genres) +
            "</small></div>" +
            icon("chevron") +
            "</button>"
          );
        })
        .join("")
    );
  };
  A.actions["progression-detail"] = function (id) {
    prog.id = +id;
    prog.loop = false;
    A.open("progression-detail", prog.id);
  };
  A.modals["progression-detail"] = function (id) {
    prog.id = +id;
    var p = REFERENCE.progressionData[prog.id],
      chs = Music.progression(p, prog.key);
    return (
      A.title(p.degree, p.name, p.explain) +
      '<div class="form-grid">' +
      A.field(
        "主调（大调框架）",
        "prog-key",
        Music.pcNames.map(function (n, i) {
          return [i, n + " 大调"];
        }),
        prog.key,
      ) +
      '<label class="field"><span>速度 BPM（每和弦一小节）</span><input id="prog-bpm" type="number" min="40" max="140" value="' +
      prog.bpm +
      '"></label></div><div class="chord-line" id="prog-chords">' +
      chs
        .map(function (c, i) {
          return (
            '<span class="chord-badge" data-prog="' +
            i +
            '">' +
            esc(c) +
            "</span>"
          );
        })
        .join("") +
      '</div><div class="tip">' +
      esc(p.genres) +
      " · " +
      esc(p.level) +
      "<br>每个和弦按4/4一小节演示。借用和弦与次属和弦不会被错误地全部改成顺阶和弦。</div>" +
      btn("prog-toggle", "", icon("play") + " 循环试听", "accent wide") +
      btn("prog-studio", "", icon("note") + " 用这套进行练弹唱", "soft wide")
    );
  };
  A.changes["prog-key"] = function (e) {
    Sound.stop();
    prog.loop = false;
    prog.key = +e.target.value;
    $("#dialog-body").innerHTML = A.modals["progression-detail"](prog.id);
  };
  A.inputs["prog-bpm"] = function (e) {
    prog.bpm = Math.max(40, Math.min(140, +e.target.value || 72));
    if (prog.loop) {
      Sound.stop();
      prog.loop = false;
      A.toast("速度已改，重新点击循环试听。");
    }
  };
  A.actions["prog-toggle"] = async function (_, b) {
    if (prog.loop) {
      Sound.stop();
      prog.loop = false;
      b.innerHTML = icon("play") + " 循环试听";
      return;
    }
    prog.loop = true;
    b.innerHTML = icon("pause") + " 停止循环";
    var chs = Music.progression(REFERENCE.progressionData[prog.id], prog.key),
      duration = (4 * 60) / prog.bpm;
    await Sound.loop(
      function (cycle) {
        var idx = cycle % chs.length;
        return {
          duration: duration,
          events: [
            {
              at: 0,
              notes: Music.voiced(chs[idx]),
              duration: duration * 0.85,
              strum: 0.02,
              visual: { index: idx },
            },
          ],
        };
      },
      function (v) {
        A.$$(".chord-badge").forEach(function (c) {
          c.classList.toggle("hot", +c.dataset.prog === v.index);
        });
      },
    );
  };
  A.cleanups["progression-detail"] = function () {
    prog.loop = false;
  };
  A.actions["prog-studio"] = function () {
    Sound.stop();
    State.data.song.chords = Music.progression(
      REFERENCE.progressionData[prog.id],
      prog.key,
    );
    State.data.song.title =
      REFERENCE.progressionData[prog.id].name +
      " · " +
      Music.pcNames[prog.key] +
      "调";
    State.data.song.lyrics = State.data.song.chords.map(function () {
      return "";
    });
    State.data.song.id = "";
    State.save();
    A.open("studio");
  };
  A.modals.patterns = function () {
    return (
      A.title(
        "TWENTY WAYS TO MOVE THROUGH TIME",
        "扫弦与分解节奏实验室",
        "箭头表示触弦，·表示不触弦，×为闷音，B为低音，数字为琴弦号。",
      ) +
      REFERENCE.rhythmData
        .map(function (p) {
          return (
            '<button class="library-row" ' +
            attr("pattern-detail", p.id) +
            '><div class="grow"><strong>' +
            esc(p.title) +
            "</strong><small>" +
            p.meter +
            " · " +
            esc(p.level) +
            " · " +
            esc(p.context) +
            "</small></div>" +
            icon("chevron") +
            "</button>"
          );
        })
        .join("")
    );
  };
  A.actions["pattern-detail"] = function (id) {
    pattern.id = id;
    pattern.loop = false;
    A.open("pattern-detail", id);
  };
  A.modals["pattern-detail"] = function (id) {
    pattern.id = id;
    var p = REFERENCE.rhythmData.filter(function (p) {
      return p.id === id;
    })[0];
    return (
      A.title(p.meter + " · " + p.level, p.title, p.desc) +
      Training.patternGrid(p) +
      '<div class="form-grid">' +
      A.field(
        "示范和弦",
        "pattern-chord",
        REFERENCE.chordData.map(function (c) {
          return [c.name, c.name];
        }),
        pattern.chord,
      ) +
      '<label class="field"><span>BPM' +
      (p.meter === "6/8" ? "（两大拍）" : "（四分音符）") +
      '</span><input id="pattern-bpm" type="number" min="40" max="160" value="' +
      pattern.bpm +
      '"></label></div>' +
      btn("pattern-toggle", "", icon("play") + " 循环示范", "accent wide") +
      btn(
        "pattern-tap",
        "",
        icon("clock") + " 用这个节奏做屏幕敲击",
        "soft wide",
      ) +
      '<div class="tip">先数网格 → 用左手消音练右手 → 加一个和弦 → 最后再加歌词。3/4是三拍，6/8这里按两个附点四分音符大拍计速，不把两者混为同一种律动。</div>'
    );
  };
  A.changes["pattern-chord"] = function (e) {
    pattern.chord = e.target.value;
    Sound.stop();
    pattern.loop = false;
    $("#dialog-body").innerHTML = A.modals["pattern-detail"](pattern.id);
  };
  A.inputs["pattern-bpm"] = function (e) {
    pattern.bpm = Math.max(40, Math.min(160, +e.target.value || 72));
    if (pattern.loop) {
      Sound.stop();
      pattern.loop = false;
      A.toast("速度改变后，请重新开始。");
    }
  };
  A.actions["pattern-toggle"] = async function (_, b) {
    if (pattern.loop) {
      Sound.stop();
      pattern.loop = false;
      b.innerHTML = icon("play") + " 循环示范";
      return;
    }
    var p = REFERENCE.rhythmData.filter(function (p) {
      return p.id === pattern.id;
    })[0];
    pattern.loop = true;
    b.innerHTML = icon("pause") + " 停止示范";
    await Sound.loop(
      function () {
        var batch = Sound.rhythmEvents(p, pattern.chord, pattern.bpm, 1, 0);
        return { duration: batch.barTime, events: batch.events };
      },
      function (v) {
        A.$$(".beat-cell").forEach(function (c) {
          c.classList.toggle("hot", +c.dataset.slot === v.slot);
        });
      },
    );
  };
  A.cleanups["pattern-detail"] = function () {
    pattern.loop = false;
  };
  A.actions["pattern-tap"] = function () {
    Tap = {
      pattern: REFERENCE.rhythmData.filter(function (p) {
        return p.id === pattern.id;
      })[0],
      bpm: Math.min(140, pattern.bpm),
      mode: "follow",
      tolerance: 0.16,
      phase: "setup",
      taps: [],
      expected: [],
    };
    A.open("rhythm", Tap);
  };
  function actualChord(label, capo) {
    var c = Music.chord(label);
    if (!c) return label;
    var suffix = /^[A-Ga-g][#♯b♭]?([^/]*)(?:\/.+)?$/.exec(label)[1];
    return (
      Music.pcNames[Music.mod(c.root + capo)] +
      suffix +
      (c.bass !== c.root ? "/" + Music.pcNames[Music.mod(c.bass + capo)] : "")
    );
  }
  A.modals.studio = function () {
    var s = State.data.song;
    return (
      A.title("PLAY · READ · SING", "把一段弹唱，分层练顺", s.title) +
      '<div class="hrow between"><span class="pill orange">' +
      s.bpm +
      " BPM · 4/4 · 变调夹 " +
      s.capo +
      ' 品</span><button class="link" ' +
      attr("song-edit") +
      '>编辑编配 ↗</button></div><div class="tabs">' +
      [
        ["count", "只数拍"],
        ["chords", "只弹和弦"],
        ["read", "弹＋读词"],
        ["sing", "弹＋唱"],
      ]
        .map(function (x) {
          return (
            '<button class="tab ' +
            (studio.layer === x[0] ? "active" : "") +
            '" ' +
            attr("studio-layer", x[0]) +
            ">" +
            x[1] +
            "</button>"
          );
        })
        .join("") +
      '</div><div class="measure-grid">' +
      s.chords
        .map(function (ch, i) {
          var words = (s.lyrics[i] || "").split("/").slice(0, 4);
          return (
            '<div class="measure" data-measure="' +
            i +
            '"><div class="measure-num">第 ' +
            (i + 1) +
            " 小节 · 4 拍</div><h3>" +
            esc(ch) +
            "</h3>" +
            (s.capo
              ? "<small>实际发声 " + esc(actualChord(ch, s.capo)) + "</small>"
              : "") +
            '<div class="words">' +
            Array.from({ length: 4 }, function (_, j) {
              return (
                '<span data-word="' +
                j +
                '">' +
                esc(words[j] || String(j + 1)) +
                "</span>"
              );
            }).join("") +
            "</div></div>"
          );
        })
        .join("") +
      "</div>" +
      btn("studio-toggle", "", icon("play") + " 开始循环跟练", "accent wide") +
      '<div class="plan-actions" style="margin-top:12px">' +
      btn("song-save", "", icon("check") + " 保存为我的曲卡", "soft") +
      btn(
        "songs",
        "",
        "我的曲卡 " + (State.data.songs || []).length,
        "outline",
      ) +
      '</div><div class="tip">' +
      (studio.layer === "count"
        ? "先不弹也不唱，只跟着节拍数拍。"
        : studio.layer === "chords"
          ? "自己跟着合成和弦循环弹奏，先稳住换和弦点。"
          : studio.layer === "read"
            ? "请你自己按歌词拍点朗读。应用只播放伴奏与节拍，不代替人声。"
            : "请你自己演唱。应用只播放伴奏，不会把伴奏当作你的演唱评分。") +
      ' 默认文字是原创节奏朗读示例，并非完整旋律谱。</div><div class="tip warm">当前弹唱室采用4/4。拍号3/4与6/8的跟练可在节奏实验室中使用。未收录具体指法的和弦按组成音合成，不推断它在真实吉他上的可按指法。</div>'
    );
  };
  A.actions["studio-layer"] = function (id) {
    Sound.stop();
    studio.playing = false;
    studio.layer = id;
    $("#dialog-body").innerHTML = A.modals.studio();
  };
  A.actions["studio-toggle"] = async function (_, b) {
    if (studio.playing) {
      Sound.stop();
      studio.playing = false;
      State.session(
        "studio",
        "弹唱分层跟练",
        (Date.now() - studio.start) / 1000,
        null,
        "过程记录，不评估未经采集的演奏",
      );
      b.innerHTML = icon("play") + " 开始循环跟练";
      return;
    }
    studio.playing = true;
    studio.start = Date.now();
    b.innerHTML = icon("pause") + " 停止并记录";
    var song = JSON.parse(JSON.stringify(State.data.song));
    var p =
      REFERENCE.rhythmData.filter(function (p) {
        return p.id === song.pattern && p.meter === "4/4";
      })[0] || REFERENCE.rhythmData[0];
    await Sound.loop(
      function (cycle) {
        var index = cycle % song.chords.length,
          beat = 60 / song.bpm,
          batch = Sound.rhythmEvents(
            p,
            song.chords[index],
            song.bpm,
            1,
            0,
            song.capo,
          );
        if (studio.layer === "count")
          batch.events = batch.events.filter(function (e) {
            return e.click;
          });
        else if (studio.layer === "chords")
          batch.events = batch.events.filter(function (e) {
            return !e.click;
          });
        batch.events.forEach(function (e) {
          if (e.visual) e.visual.measure = index;
        });
        for (var j = 0; j < 4; j++)
          batch.events.push({
            at: j * beat,
            click: false,
            note: 0,
            gain: 0,
            duration: 0.001,
            visual: { measure: index, word: j, silent: true },
          });
        return { duration: batch.barTime, events: batch.events };
      },
      function (v) {
        A.$$(".measure").forEach(function (el) {
          el.classList.toggle("hot", +el.dataset.measure === v.measure);
          Array.from(el.querySelectorAll(".words span")).forEach(function (w) {
            w.classList.toggle(
              "hot",
              +el.dataset.measure === v.measure && +w.dataset.word === v.word,
            );
          });
        });
      },
    );
  };
  A.cleanups.studio = function () {
    if (studio.playing) {
      State.session(
        "studio",
        "弹唱分层跟练",
        (Date.now() - studio.start) / 1000,
        null,
        "离开页面时结束；不对演奏打分",
      );
      studio.playing = false;
    }
  };
  A.actions["song-edit"] = function () {
    A.open("song-edit");
  };
  A.modals["song-edit"] = function () {
    var s = State.data.song;
    return (
      A.title(
        "YOUR ARRANGEMENT CARD",
        "写下自己的编配",
        "和弦以空格或小节线分开；每行歌词对应一小节，用 / 分隔四个拍点。",
      ) +
      '<label class="field"><span>歌曲 / 练习名称</span><input id="song-title" type="text" maxlength="60" value="' +
      esc(s.title) +
      '"></label><label class="field" style="margin-top:14px"><span>和弦序列（最多16小节）</span><textarea id="song-chords" maxlength="500">' +
      esc(s.chords.join(" | ")) +
      '</textarea></label><label class="field"><span>每小节一行歌词 / 提示</span><textarea id="song-lyrics" maxlength="4000" style="min-height:160px">' +
      esc(s.lyrics.join("\n")) +
      '</textarea></label><div class="form-grid"><label class="field"><span>BPM</span><input id="song-bpm" type="number" min="40" max="180" value="' +
      s.bpm +
      '"></label><label class="field"><span>变调夹品位 0–12</span><input id="song-capo" type="number" min="0" max="12" value="' +
      s.capo +
      '"></label>' +
      A.field(
        "4/4伴奏型",
        "song-pattern",
        REFERENCE.rhythmData
          .filter(function (p) {
            return p.meter === "4/4";
          })
          .map(function (p) {
            return [p.id, p.title];
          }),
        s.pattern,
      ) +
      "</div>" +
      btn("song-apply", "", "应用这张编配", "accent wide") +
      '<p class="feedback-note">可识别大/小、7、maj7、m7、dim、aug、sus2/4、add9、6/9以及斜杠低音和弦。</p>'
    );
  };
  A.actions["song-apply"] = function () {
    var ch = $("#song-chords")
      .value.split(/[\s|,，]+/)
      .filter(Boolean);
    if (!ch.length || ch.length > 16) {
      A.toast("请输入1–16个和弦。");
      return;
    }
    var bad = ch.filter(function (c) {
      return !Music.chord(c);
    });
    if (bad.length) {
      A.toast("暂不识别和弦：" + bad.join("、"));
      return;
    }
    State.data.song = Object.assign({}, State.data.song, {
      title: $("#song-title").value.trim().slice(0, 60) || "我的练习",
      chords: ch,
      lyrics: $("#song-lyrics")
        .value.split("\n")
        .slice(0, 16)
        .map(function (t) {
          return t.slice(0, 200);
        }),
      bpm: Math.max(40, Math.min(180, +$("#song-bpm").value || 72)),
      capo: Math.round(Math.max(0, Math.min(12, +$("#song-capo").value || 0))),
      pattern: $("#song-pattern").value,
    });
    State.save();
    A.back();
  };
  A.actions["song-save"] = function () {
    if (!State.data.songs) State.data.songs = [];
    var song = State.data.song;
    if (!song.id) song.id = "song-" + Date.now();
    var old = State.data.songs.findIndex(function (s) {
      return s.id === song.id;
    });
    var copy = JSON.parse(JSON.stringify(song));
    if (old >= 0) State.data.songs[old] = copy;
    else State.data.songs.push(copy);
    State.data.songs = State.data.songs.slice(-30);
    State.save();
    A.toast("已保存到我的曲卡。");
  };
  A.actions.songs = function () {
    A.open("songs");
  };
  A.modals.songs = function () {
    var list = State.data.songs || [];
    return (
      A.title(
        "YOUR SONGBOOK",
        "我的编配曲卡",
        "最多保留30张曲卡，随学习备份一起导出。",
      ) +
      (list.length
        ? list
            .map(function (s, i) {
              return (
                '<div class="library-row"><button class="grow" style="text-align:left" ' +
                attr("song-load", i) +
                "><strong>" +
                esc(s.title) +
                "</strong><small>" +
                esc(s.chords.join(" – ")) +
                " · " +
                s.bpm +
                ' BPM</small></button><button class="circle-btn" ' +
                attr("song-delete", i) +
                ' aria-label="删除曲卡">' +
                icon("trash") +
                "</button></div>"
              );
            })
            .join("")
        : '<div class="empty">在弹唱室点击“保存为我的曲卡”，就能留下自己的编配。</div>')
    );
  };
  A.actions["song-load"] = function (id) {
    var s = (State.data.songs || [])[+id];
    if (s) {
      State.data.song = JSON.parse(JSON.stringify(s));
      State.save();
      A.open("studio");
    }
  };
  A.actions["song-delete"] = function (id) {
    A.open("song-delete", +id);
  };
  A.modals["song-delete"] = function (i) {
    return (
      A.title(
        "REMOVE THIS CARD",
        "删除这张编配曲卡？",
        (State.data.songs[i] || {}).title || "",
      ) +
      btn("song-delete-confirm", i, "确认删除这张曲卡", "red wide") +
      btn("back", "", "保留曲卡，返回", "outline wide")
    );
  };
  A.actions["song-delete-confirm"] = function (id) {
    State.data.songs.splice(+id, 1);
    State.save();
    A.back();
  };
  A.modals.changes = function () {
    return (
      A.title(
        "KEEP YOUR RIGHT HAND MOVING",
        "两和弦转换跟练",
        "跟随节拍和高亮提示换位。应用不使用麦克风判断你是否按对，只记录练习过程。",
      ) +
      '<div class="form-grid">' +
      A.field(
        "和弦 A",
        "change-a",
        REFERENCE.chordData.map(function (c) {
          return [c.name, c.name];
        }),
        change.a,
      ) +
      A.field(
        "和弦 B",
        "change-b",
        REFERENCE.chordData.map(function (c) {
          return [c.name, c.name];
        }),
        change.b,
      ) +
      A.field(
        "每几拍换一次",
        "change-beats",
        [
          [2, "2 拍"],
          [4, "4 拍"],
          [8, "8 拍"],
        ],
        change.beats,
      ) +
      '<label class="field"><span>BPM</span><input id="change-bpm" type="number" min="40" max="140" value="' +
      change.bpm +
      '"></label></div><div class="chord-line" style="justify-content:center"><span class="chord-badge" id="change-chord-a">' +
      esc(change.a) +
      '</span><span class="chord-badge" id="change-chord-b">' +
      esc(change.b) +
      '</span></div><p class="timer-caption" id="change-status">右手不停止，先把每一次第一拍弹稳。</p>' +
      btn("change-toggle", "", icon("play") + " 开始跟练", "accent wide") +
      '<div class="tip">来不及时先把速度降低。可以只在换和弦的第一拍扫一次，再逐渐增加右手节奏。停止后只保存时长，不生成未经检测的准确率。</div>'
    );
  };
  ["a", "b", "beats", "bpm"].forEach(function (k) {
    var fn = function (e) {
      Sound.stop();
      if (change.playing) {
        State.session(
          "changes",
          "和弦转换跟练",
          (Date.now() - change.start) / 1000,
          null,
          "过程记录",
        );
        change.playing = false;
      }
      change[k] = ["beats", "bpm"].includes(k)
        ? Math.max(
            k === "bpm" ? 40 : 2,
            Math.min(k === "bpm" ? 140 : 8, +e.target.value),
          )
        : e.target.value;
      $("#dialog-body").innerHTML = A.modals.changes();
    };
    if (k === "bpm") A.changes["change-" + k] = fn;
    else A.changes["change-" + k] = fn;
  });
  A.actions["change-toggle"] = async function (_, b) {
    if (change.playing) {
      Sound.stop();
      change.playing = false;
      State.session(
        "changes",
        "和弦转换 " + change.a + " ↔ " + change.b,
        (Date.now() - change.start) / 1000,
        null,
        "每" + change.beats + "拍换位；未经演奏识别",
      );
      b.innerHTML = icon("play") + " 再练一轮";
      return;
    }
    if (change.a === change.b) {
      A.toast("请选择两个不同的和弦。");
      return;
    }
    change.playing = true;
    change.start = Date.now();
    b.innerHTML = icon("pause") + " 停止并记录";
    var beat = 60 / change.bpm;
    await Sound.loop(
      function (cycle) {
        var ch = cycle % 2 ? change.b : change.a;
        var shape = REFERENCE.chordData.filter(function (c) {
          return c.name === ch;
        })[0].shape;
        var events = [
          {
            at: 0,
            notes: Music.shapeNotes(shape),
            duration: beat * change.beats * 0.8,
            strum: 0.02,
            visual: { which: cycle % 2, beat: 0 },
          },
        ];
        for (var i = 0; i < change.beats; i++)
          events.push({
            at: i * beat,
            click: true,
            accent: i % 4 === 0,
            duration: 0.045,
            visual: { which: cycle % 2, beat: i, cycle: cycle },
          });
        return { duration: beat * change.beats, events: events };
      },
      function (v) {
        if ($("#change-chord-a"))
          $("#change-chord-a").classList.toggle("hot", v.which === 0);
        if ($("#change-chord-b"))
          $("#change-chord-b").classList.toggle("hot", v.which === 1);
        if ($("#change-status"))
          $("#change-status").textContent =
            "第 " + (v.cycle + 1) + " 组 · 第 " + (v.beat + 1) + " 拍";
      },
    );
  };
  A.cleanups.changes = function () {
    if (change.playing) {
      State.session(
        "changes",
        "和弦转换跟练",
        (Date.now() - change.start) / 1000,
        null,
        "离开页面时结束",
      );
      change.playing = false;
    }
  };
  A.modals.metro = function () {
    return (
      A.title(
        "STAY WITH THE PULSE",
        "节拍器",
        "先稳，再快。6/8的BPM以两个大拍中的附点四分音符计。",
      ) +
      '<div class="timer-display" id="metro-bpm-display">' +
      metro.bpm +
      '</div><div class="timer-caption">BEATS PER MINUTE</div><div class="figure-bars" id="metro-dots" style="grid-template-columns:repeat(' +
      metro.meter +
      ',1fr)">' +
      Array.from({ length: metro.meter }, function (_, i) {
        return (
          '<div class="beat-cell" data-metro="' + i + '">' + (i + 1) + "</div>"
        );
      }).join("") +
      '</div><div class="mini-controls"><button class="circle-btn" ' +
      attr("metro-bpm", -1) +
      ' aria-label="减慢速度">' +
      icon("minus") +
      '</button><input id="metro-bpm" type="range" min="40" max="180" value="' +
      metro.bpm +
      '" aria-label="速度"><button class="circle-btn" ' +
      attr("metro-bpm", 1) +
      ' aria-label="加快速度">' +
      icon("plus") +
      '</button></div><div class="form-grid">' +
      A.field(
        "拍号",
        "metro-meter",
        [
          [2, "2/4"],
          [3, "3/4"],
          [4, "4/4"],
          [6, "6/8 · 两大拍"],
        ],
        metro.meter,
      ) +
      A.field(
        "每拍细分",
        "metro-sub",
        [
          [1, "只打拍点"],
          [2, "二等分"],
          [3, "三等分"],
        ],
        metro.sub,
      ) +
      "</div>" +
      btn("metro-toggle", "", icon("play") + " 开始节拍", "accent wide") +
      btn("metro-tap", "", "点按测速（至少3次）", "soft wide")
    );
  };
  function redrawMetro() {
    Sound.stop();
    metro.playing = false;
    $("#dialog-body").innerHTML = A.modals.metro();
  }
  A.inputs["metro-bpm"] = function (e) {
    metro.bpm = +e.target.value;
    $("#metro-bpm-display").textContent = metro.bpm;
    if (metro.playing) {
      Sound.stop();
      metro.playing = false;
      var b = document.querySelector('[data-act="metro-toggle"]');
      b.innerHTML = icon("play") + " 开始节拍";
    }
  };
  A.actions["metro-bpm"] = function (id) {
    metro.bpm = Math.max(40, Math.min(180, metro.bpm + +id));
    redrawMetro();
  };
  A.changes["metro-meter"] = function (e) {
    metro.meter = +e.target.value;
    if (metro.meter === 6) metro.sub = 3;
    redrawMetro();
  };
  A.changes["metro-sub"] = function (e) {
    metro.sub = +e.target.value;
    redrawMetro();
  };
  A.actions["metro-toggle"] = async function (_, b) {
    if (metro.playing) {
      Sound.stop();
      metro.playing = false;
      b.innerHTML = icon("play") + " 开始节拍";
      return;
    }
    metro.playing = true;
    b.innerHTML = icon("pause") + " 停止节拍";
    var beat = 60 / metro.bpm,
      beats = metro.meter === 6 ? 2 : metro.meter,
      sub = metro.meter === 6 ? 3 : metro.sub;
    await Sound.loop(
      function () {
        var events = [];
        for (var i = 0; i < beats * sub; i++)
          events.push({
            at: (i * beat) / sub,
            click: true,
            accent: i === 0,
            duration: 0.045,
            visual: { beat: metro.meter === 6 ? i : Math.floor(i / sub) },
          });
        return { duration: beats * beat, events: events };
      },
      function (v) {
        A.$$(".beat-cell").forEach(function (d) {
          d.classList.toggle("hot", +d.dataset.metro === v.beat);
        });
      },
    );
  };
  A.actions["metro-tap"] = function () {
    var now = performance.now();
    if (metro.taps.length && now - metro.taps[metro.taps.length - 1] > 2500)
      metro.taps = [];
    metro.taps.push(now);
    metro.taps = metro.taps.slice(-6);
    if (metro.taps.length >= 3) {
      var durations = metro.taps
        .slice(1)
        .map(function (t, i) {
          return t - metro.taps[i];
        })
        .sort(function (a, b) {
          return a - b;
        });
      metro.bpm = Math.max(
        40,
        Math.min(
          180,
          Math.round(60000 / durations[Math.floor(durations.length / 2)]),
        ),
      );
      redrawMetro();
      A.toast("已设置 " + metro.bpm + " BPM");
    } else A.toast("继续均匀点按…");
  };
  A.cleanups.metro = function () {
    metro.playing = false;
  };
  A.modals.piano = function () {
    var base = (pianoOctave + 1) * 12;
    return (
      A.title(
        "A KEYBOARD IN YOUR POCKET",
        "用琴键，试一个音程",
        "点击琴键发声。这里为合成示范键盘，逐音触发，不采集你的声音。",
      ) +
      A.field(
        "音区",
        "piano-octave",
        [
          [3, "C3–C4"],
          [4, "C4–C5"],
          [5, "C5–C6"],
        ],
        pianoOctave,
      ) +
      '<div class="keyboard-note" id="piano-note">' +
      Music.name(base) +
      " — " +
      Music.name(base + 12) +
      '</div><div class="mini-piano">' +
      [0, 2, 4, 5, 7, 9, 11, 12]
        .map(function (n) {
          return (
            '<button class="piano-key" ' +
            attr("piano-note", base + n) +
            ' aria-label="' +
            Music.name(base + n) +
            '">' +
            Music.name(base + n) +
            "</button>"
          );
        })
        .join("") +
      [
        [1, 8.5],
        [3, 21],
        [6, 46],
        [8, 58.5],
        [10, 71],
      ]
        .map(function (a) {
          return (
            '<button class="piano-key black" style="left:' +
            a[1] +
            '%" ' +
            attr("piano-note", base + a[0]) +
            ' aria-label="' +
            Music.name(base + a[0]) +
            '">' +
            Music.name(base + a[0]) +
            "</button>"
          );
        })
        .join("") +
      '</div><div class="tip">试试 C–E–G 与 C–E♭–G，听两种三和弦的区别。可到和弦图鉴听同时发声与逐弦演示。</div>'
    );
  };
  A.actions["piano-note"] = function (id, b) {
    var n = +id;
    $("#piano-note").textContent =
      Music.name(n) + " · " + Music.freq(n).toFixed(1) + " Hz";
    b.classList.add("pressed");
    Sound.sequence([{ at: 0, note: n, duration: 1 }], {}).then(function () {
      b.classList.remove("pressed");
    });
  };
  A.changes["piano-octave"] = function (e) {
    pianoOctave = +e.target.value;
    $("#dialog-body").innerHTML = A.modals.piano();
  };
  var sampleAudio = new Audio();
  sampleAudio.preload = "metadata";
  var sampleId = null;
  var sounds = [
    ["scale_major", "C大调音阶"],
    ["scale_minor", "A自然小调"],
    ["pentatonic", "C大调五声"],
    ["interval_semitone", "小二度"],
    ["interval_second", "大二度"],
    ["interval_minor3", "小三度"],
    ["interval_major3", "大三度"],
    ["interval_fourth", "纯四度"],
    ["interval_fifth", "纯五度"],
    ["interval_sixth", "大六度"],
    ["interval_octave", "纯八度"],
    ["chord_major", "C大三和弦"],
    ["chord_minor", "C小三和弦"],
    ["chord_dim", "C减三和弦"],
    ["chord_sus4", "C挂四"],
    ["progression", "I–IV–V–I进行"],
    ["pulse", "四拍脉搏"],
    ["rests", "音符与休止"],
    ["waltz", "三拍子律动"],
    ["syncopation", "切分节奏"],
    ["melody_steps", "级进短句"],
    ["melody_dictation", "旋律听写示例"],
    ["warmup", "哼鸣参考音列"],
    ["timbre", "纯音与琴音音色"],
  ];
  A.modals.sounds = function () {
    return (
      A.title(
        "SOUNDS TO STUDY WITH",
        "24组离线合成示范",
        "和新训练中的实时合成声音一起使用，不依赖网络。",
      ) +
      '<div class="tip">音频为原创合成示范。新训练中可以实时换调、换音色；这里保留固定音高的基础例子便于比较。</div>' +
      sounds
        .map(function (a) {
          return (
            '<div class="library-row"><strong class="grow">' +
            a[1] +
            '</strong><button class="circle-btn" ' +
            attr("sample", a[0]) +
            ' aria-label="播放' +
            a[1] +
            '">' +
            icon(a[0] === sampleId && !sampleAudio.paused ? "pause" : "play") +
            "</button></div>"
          );
        })
        .join("") +
      '<p id="sample-status" class="feedback-note">点击试听</p>'
    );
  };
  A.actions.sample = async function (id) {
    if (sampleId === id && !sampleAudio.paused) {
      sampleAudio.pause();
      sampleId = null;
    } else {
      Sound.stop();
      sampleAudio.pause();
      sampleAudio.src = "audio/" + id + ".wav";
      sampleId = id;
      try {
        await sampleAudio.play();
      } catch (e) {
        sampleId = null;
        A.toast("音频播放失败。");
      }
    }
    if (A.modal && A.modal.kind === "sounds") {
      $("#dialog-body").innerHTML = A.modals.sounds();
      if ($("#sample-status"))
        $("#sample-status").textContent = sampleId
          ? "正在播放：" +
            sounds.filter(function (a) {
              return a[0] === sampleId;
            })[0][1]
          : "已停止";
    }
  };
  sampleAudio.addEventListener("ended", function () {
    sampleId = null;
    if (A.modal && A.modal.kind === "sounds")
      $("#dialog-body").innerHTML = A.modals.sounds();
  });
  A.cleanups.sounds = function () {
    sampleAudio.pause();
    sampleAudio.currentTime = 0;
    sampleId = null;
  };
  return {
    actualChord: actualChord,
    fretHTML: fretHTML,
    get studio() {
      return studio;
    },
    get progression() {
      return prog;
    },
    get pattern() {
      return pattern;
    },
    get metro() {
      return metro;
    },
    get change() {
      return change;
    },
    get sample() {
      return sampleAudio;
    },
  };
})();
