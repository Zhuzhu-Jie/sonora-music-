var Ear = null,
  Tap = null;
var Training = (function () {
  "use strict";
  var A = App,
    $ = A.$,
    esc = A.esc,
    btn = A.btn,
    icon = A.icon,
    attr = A.attr;
  var canceled = false;
  var names = {
    direction: "音高方向",
    interval: "音程辨认",
    degree: "音级听辨",
    scale: "音阶与调式",
    chord: "和弦性质",
    progression: "和声进行",
    melody: "短句听写",
    theory: "乐理应用自测",
  };
  var descriptions = {
    direction: "先后播放两个音，听第二个是升高、降低，还是同音。",
    interval: "在随机起音上建立距离感。上行、下行、同时发声都值得练。",
    degree: "先给主和弦与主音，再听目标音属于第几级。",
    scale: "完整听上行与下行，辨认音阶的结构与主音关系。",
    chord: "听三音、五音与七音的关系，练习辨认和弦性质。",
    progression: "听一个完整的和声循环，在调内级数中找到它的路径。",
    melody: "先给主音，再听3–6个音，用音级顺序重建这句旋律。",
    theory: "把概念用在问题里。也会生成不同琴弦与品位的音名题。",
  };
  function earConfig(mode) {
    return {
      mode: mode,
      config: Object.assign({}, State.data.settings, {
        speed: 0.55,
        chordStyle: "block",
        inversions: false,
      }),
      focus: null,
      started: false,
      round: 0,
      correct: 0,
      total: State.data.settings.rounds,
      question: null,
      heard: mode === "theory",
      answered: false,
      busy: false,
      choices: [],
      review: null,
      begin: Date.now(),
    };
  }
  A.actions.ear = function (mode) {
    Ear = earConfig(mode);
    A.open("ear", Ear);
  };
  var dayFocus = {
    0: [12, -12],
    1: [7, -7],
    2: [5, -5],
    3: [3, -3, 4, -4],
    4: [2, -2],
    5: [1, -1],
    7: [7, 12],
    8: [5, 7],
    9: [3, 4],
    10: [1, 2],
    11: [3, 4, 5],
    12: [1, 2, 3, 4, 5, 7, 12],
    14: [3, 4],
    16: [8, 9],
    17: [10, 11],
    18: [5, 6, 7],
    21: [1, 3, 5],
    22: [1, 2, 3],
    23: [1, 3, 4, 5],
    24: [1, 2, 3, 4, 5, 6],
    25: [1, 3, 5, 7],
  };
  A.actions["ear-day"] = function (id) {
    var i = +id,
      d = A.planDays("e")[i];
    Ear = earConfig(d.mode);
    Ear.config.difficulty = d.difficulty;
    Ear.focus = dayFocus[i] || null;
    if (i === 14) Ear.config.presentation = "down";
    if (i === 15) Ear.config.presentation = "harmonic";
    if (i === 19) Ear.config.presentation = "mixed";
    if (i >= 21 && i <= 25) Ear.config.key = "0";
    if (i === 26) Ear.config.key = "random";
    Ear.dailyLabel = "第 " + (i + 1) + " 天 · " + d.title;
    A.open("ear", Ear);
  };
  function configHTML(s) {
    var c = s.config,
      mode = s.mode;
    return (
      A.title(
        "EAR TRAINING · " + (s.review ? "REVIEW" : mode.toUpperCase()),
        names[mode],
        descriptions[mode],
      ) +
      (s.dailyLabel
        ? '<div class="tip">' +
          esc(s.dailyLabel) +
          "<br>本组已带入今日的难度和重点。</div>"
        : "") +
      '<div class="form-grid">' +
      A.field(
        "难度",
        "ear-difficulty",
        [
          ["easy", "入门 · 少量对比"],
          ["medium", "进阶 · 扩大范围"],
          ["hard", "挑战 · 混合辨认"],
        ],
        c.difficulty,
      ) +
      A.field(
        "每组题数",
        "ear-count",
        [
          [5, "5 题"],
          [10, "10 题"],
          [20, "20 题"],
        ],
        c.rounds,
      ) +
      A.field(
        "参考调 / 起音",
        "ear-key",
        [["random", "随机换调"]].concat(
          Music.pcNames.map(function (n, i) {
            return [String(i), n + " 调"];
          }),
        ),
        c.key,
      ) +
      A.field(
        "音色",
        "ear-voice",
        [
          ["guitar", "合成拨弦"],
          ["piano", "合成琴音"],
          ["pure", "纯音"],
        ],
        c.voice,
      ) +
      (mode === "interval"
        ? A.field(
            "呈现方式",
            "ear-presentation",
            [
              ["up", "旋律上行"],
              ["down", "旋律下行"],
              ["harmonic", "两音同时"],
              ["mixed", "三种方式随机"],
            ],
            c.presentation,
          )
        : "") +
      (["degree", "melody"].includes(mode)
        ? A.field(
            "参考音阶",
            "ear-scale",
            [
              ["major", "自然大调"],
              ["minor", "自然小调"],
            ],
            c.scale,
          )
        : "") +
      (mode === "melody"
        ? A.field(
            "短句长度",
            "ear-length",
            [
              [3, "3 个音"],
              [4, "4 个音"],
              [5, "5 个音"],
              [6, "6 个音"],
            ],
            c.length,
          )
        : "") +
      (mode === "chord"
        ? A.field(
            "和弦发声",
            "ear-chord-style",
            [
              ["block", "同时发声"],
              ["arp", "逐音琶音"],
            ],
            c.chordStyle,
          )
        : "") +
      "</div>" +
      (mode === "chord"
        ? '<label class="check-row"><input id="ear-inversions" type="checkbox" ' +
          (c.inversions ? "checked" : "") +
          "><span>挑战难度加入和弦转位</span></label>"
        : "") +
      (["direction", "interval", "degree", "scale", "melody"].includes(mode)
        ? '<label class="field"><span>单音时长（慢一点，听完整）</span><select id="ear-speed">' +
          A.options(
            [
              [0.4, "较快 · 0.4 秒"],
              [0.55, "标准 · 0.55 秒"],
              [0.8, "慢速 · 0.8 秒"],
            ],
            c.speed,
          ) +
          "</select></label>"
        : "") +
      '<div class="tip">' +
      (mode === "theory"
        ? "此项是文字应用题，不需要播放声音。"
        : "开始后，先完整听题，再作答。题目不会在作答前暴露实际音名或答案。") +
      " 每题都可以复听，答错后会进入错题本。</div>" +
      btn(
        "ear-start",
        "",
        icon(mode === "theory" ? "book" : "play") + " 开始这一组",
        "accent wide",
      )
    );
  }
  function getConfig() {
    var c = Ear.config;
    [
      "difficulty",
      "key",
      "voice",
      "presentation",
      "scale",
      "length",
      "speed",
      "chord-style",
    ].forEach(function (k) {
      var e = $("#ear-" + k);
      if (e)
        c[k === "chord-style" ? "chordStyle" : k] = [
          "length",
          "speed",
        ].includes(k)
          ? +e.value
          : e.value;
    });
    if ($("#ear-inversions")) c.inversions = $("#ear-inversions").checked;
    var count = $("#ear-count");
    if (count) c.rounds = +count.value;
    if (Ear.focus) c.focus = Ear.focus;
    State.data.settings = Object.assign({}, State.data.settings, {
      difficulty: c.difficulty,
      key: c.key,
      voice: c.voice,
      presentation: c.presentation,
      scale: c.scale,
      length: c.length,
      rounds: c.rounds,
    });
    State.save();
    Sound.configure(c);
    Ear.total = Ear.review ? Ear.review.length : c.rounds;
  }
  function nextQuestion() {
    Sound.stop();
    Ear.question = Ear.review
      ? Ear.review[Ear.round]
      : Music.question(Ear.mode, Ear.config, REFERENCE);
    Ear.mode = Ear.question.mode;
    Ear.heard = Ear.mode === "theory";
    Ear.answered = false;
    Ear.busy = false;
    Ear.choices = [];
    drawEar();
  }
  function drawEar() {
    if (A.modal && A.modal.kind === "ear") {
      $("#dialog-body").innerHTML = A.modals.ear(Ear);
      $("#modal").scrollTop = 0;
    }
  }
  function answerVisual(q) {
    var values = q.mode === "progression" ? q.chords : q.notes.map(Music.name);
    if (!values.length) return "";
    return (
      '<div class="chord-line">' +
      values
        .map(function (x) {
          return (
            '<span class="chord-badge" style="font-size:16px">' +
            esc(x) +
            "</span>"
          );
        })
        .join("") +
      "</div>"
    );
  }
  A.modals.ear = function (s) {
    Ear = s;
    if (!s.started) return configHTML(s);
    if (s.finished) {
      var rate = Math.round((s.correct / s.total) * 100);
      return (
        A.title(
          "ONE STEP FOR YOUR EARS",
          "这一组，认真听完了",
          "复习刚才容易混淆的地方，会比马上加难更有帮助。",
        ) +
        '<div class="result-hero"><div class="big">' +
        s.correct +
        '<span style="font-size:26px"> / ' +
        s.total +
        "</span></div><h2>" +
        rate +
        "% 答对</h2><p>" +
        Math.round((Date.now() - s.begin) / 1000) +
        " 秒 · " +
        (s.review ? "错题复练" : "随机训练") +
        "<br>作答结果与本组摘要已保存在本机。</p></div>" +
        btn("ear-restart", "", "再练一组", "accent wide") +
        btn("review", "", "打开错题本", "soft wide")
      );
    }
    var q = s.question;
    return (
      A.title(
        "LISTEN · THINK · ANSWER",
        names[s.mode],
        s.mode === "theory"
          ? "想清楚关系，再选择答案。"
          : ["degree", "melody", "progression"].includes(s.mode)
            ? "参考主音 " +
              Music.name(q.root) +
              " · " +
              Music.scales[q.scale].name
            : "先听，不看答案。你可以反复播放。",
      ) +
      '<div class="round-head"><span class="pill blue">第 ' +
      (s.round + 1) +
      " / " +
      s.total +
      ' 题</span><span class="small">已答对 ' +
      s.correct +
      ' 题</span></div><div class="progress"><i style="width:' +
      (s.round / s.total) * 100 +
      '%"></i></div>' +
      (s.mode === "theory"
        ? '<div class="card" style="margin-top:24px"><h2 style="font-size:18px">' +
          esc(q.prompt) +
          "</h2></div>"
        : '<div class="practice-stage"><div class="eyebrow muted">' +
          esc(
            s.mode === "interval"
              ? { up: "旋律上行", down: "旋律下行", harmonic: "两音同时发声" }[
                  q.presentation
                ]
              : s.mode === "scale"
                ? "完整音阶上行 / 下行"
                : "先听声音，再判断",
          ) +
          '</div><div class="listen-orb ' +
          (s.busy ? "playing" : "") +
          '">' +
          icon("ear") +
          "</div>" +
          btn(
            "ear-play",
            "",
            icon(s.busy ? "pause" : "play") +
              (s.busy ? "停止播放" : s.heard ? "再听一遍" : "播放题目"),
            "accent",
          ) +
          '<p class="small" style="margin-top:12px">' +
          (s.heard ? "已经完整播放，可以作答。" : "完整播放后，解锁选项。") +
          "</p></div>") +
      (s.mode === "melody"
        ? '<div class="answer-line">' +
          q.degrees
            .map(function (_, i) {
              return (
                '<span class="' +
                (i === s.choices.length ? "current" : "") +
                '">' +
                (s.choices[i] || "·") +
                "</span>"
              );
            })
            .join("") +
          "</div>"
        : "") +
      '<div class="answers" ' +
      (s.mode === "melody"
        ? 'style="grid-template-columns:repeat(4,1fr)"'
        : "") +
      ">" +
      q.options
        .map(function (o) {
          var cls = s.answered
            ? o[0] === q.answer
              ? " correct"
              : o[0] === s.chosen
                ? " wrong"
                : ""
            : "";
          return (
            '<button class="answer' +
            cls +
            '" ' +
            attr("ear-answer", o[0]) +
            " " +
            (!s.heard || s.answered ? "disabled" : "") +
            ">" +
            esc(o[1]) +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      (s.mode === "melody" && !s.answered
        ? '<div class="plan-actions">' +
          btn("melody-back", "", "撤销一个", "outline") +
          btn("melody-submit", "", "检查这句旋律", "soft") +
          "</div>"
        : "") +
      (s.answered
        ? '<div class="feedback ' +
          (s.wasCorrect ? "" : "wrong") +
          '"><h3>' +
          (s.wasCorrect
            ? "✓ 这题听对了"
            : "正确答案：" +
              esc(s.mode === "melody" ? q.degrees.join(" · ") : q.title)) +
          "</h3><p>" +
          esc(q.explain) +
          "</p>" +
          answerVisual(q) +
          (s.review
            ? '<p class="small">错题复练连续答对两次后，会标为已掌握。</p>'
            : "") +
          "</div>" +
          btn(
            "ear-next",
            "",
            s.round + 1 === s.total
              ? "查看本组结果"
              : "下一题 " + icon("arrow"),
            "wide",
          )
        : '<button class="link" ' +
          attr("ear-reveal") +
          " " +
          (!s.heard ? "disabled" : "") +
          ">查看答案（本题记为未答对）</button>")
    );
  };
  A.actions["ear-start"] = function () {
    getConfig();
    Ear.started = true;
    Ear.finished = false;
    Ear.round = 0;
    Ear.correct = 0;
    Ear.begin = Date.now();
    nextQuestion();
  };
  A.actions["ear-play"] = async function () {
    if (!Ear || !Ear.question) return;
    if (Ear.busy) {
      Sound.stop();
      Ear.busy = false;
      drawEar();
      return;
    }
    var session = Ear,
      q = Ear.question;
    Ear.busy = true;
    drawEar();
    try {
      var completed = await Sound.question(q, Ear.config);
      if (Ear !== session || !A.modal || A.modal.kind !== "ear") return;
      Ear.busy = false;
      if (completed) Ear.heard = true;
      drawEar();
    } catch (e) {
      Ear.busy = false;
      drawEar();
      A.toast("音频未启动，请再次点击播放。");
    }
  };
  function finishAnswer(value, reveal) {
    if (!Ear || Ear.answered || !Ear.heard) return;
    Sound.stop();
    Ear.busy = false;
    Ear.answered = true;
    Ear.chosen = value;
    Ear.wasCorrect = !reveal && value === Ear.question.answer;
    if (Ear.wasCorrect) Ear.correct++;
    State.answer(Ear.question, Ear.wasCorrect, !!Ear.review);
    drawEar();
    var feedback = $("#dialog-body .feedback");
    if (feedback) feedback.scrollIntoView({ block: "nearest" });
  }
  A.actions["ear-answer"] = function (id) {
    if (Ear.mode === "melody") {
      if (Ear.choices.length < Ear.question.degrees.length)
        Ear.choices.push(id);
      drawEar();
    } else finishAnswer(id, false);
  };
  A.actions["melody-back"] = function () {
    if (Ear && !Ear.answered) {
      Ear.choices.pop();
      drawEar();
    }
  };
  A.actions["melody-submit"] = function () {
    if (Ear.choices.length !== Ear.question.degrees.length) {
      A.toast("请先填满 " + Ear.question.degrees.length + " 个音。");
      return;
    }
    finishAnswer(Ear.choices.join("-"), false);
  };
  A.actions["ear-reveal"] = function () {
    finishAnswer("", true);
  };
  A.actions["ear-next"] = function () {
    if (!Ear.answered) return;
    Ear.round++;
    if (Ear.round >= Ear.total) {
      Ear.finished = true;
      State.session(
        "ear",
        Ear.review ? "错题复练" : names[Ear.mode],
        (Date.now() - Ear.begin) / 1000,
        (Ear.correct / Ear.total) * 100,
        Ear.correct + "/" + Ear.total + " 题答对",
      );
      drawEar();
    } else nextQuestion();
  };
  A.actions["ear-restart"] = function () {
    var m = Ear.mode,
      focus = Ear.focus,
      label = Ear.dailyLabel;
    Ear = earConfig(m);
    Ear.focus = focus;
    Ear.dailyLabel = label;
    $("#dialog-body").innerHTML = A.modals.ear(Ear);
    $("#modal").scrollTop = 0;
  };
  A.cleanups.ear = function () {
    if (Ear) Ear.busy = false;
  };
  A.modals.review = function () {
    var rows = State.data.mistakes
      .map(function (m, i) {
        return { m: m, i: i };
      })
      .filter(function (x) {
        return !x.m.mastered;
      });
    return (
      A.title(
        "GIVE DIFFICULT SOUNDS ANOTHER CHANCE",
        "错题，不用怕",
        "保留实际题目与发声条件，复听同一题，再建立正确关系。",
      ) +
      (rows.length
        ? btn(
            "review-all",
            "",
            "复练这 " + Math.min(20, rows.length) + " 道题",
            "accent wide",
          ) +
          rows
            .map(function (x) {
              return (
                '<div class="rank-row"><div class="hrow between"><div class="grow"><strong>' +
                esc(names[x.m.question.mode] || "练习") +
                " · " +
                esc(x.m.question.tag) +
                "</strong><small>答错 " +
                x.m.wrong +
                " 次 · 连续复练答对 " +
                x.m.streak +
                '/2</small></div><button class="circle-btn" ' +
                attr("review-one", x.i) +
                ' aria-label="复练这道题">' +
                icon("play") +
                "</button></div></div>"
              );
            })
            .join("")
        : '<div class="empty">当前没有待复练的错题。练习中答错或查看答案后，会自动收录。</div>') +
      '<div class="tip">已掌握的错题仍留在备份中。两次复练答对只是学习标记，不代表永久记住；换调再听也很重要。</div>'
    );
  };
  A.actions.review = function () {
    A.open("review");
  };
  function startReview(list) {
    Ear = earConfig(list[0].mode);
    Ear.review = list;
    Ear.total = list.length;
    Ear.started = true;
    Ear.begin = Date.now();
    Ear.question = list[0];
    Ear.heard = Ear.mode === "theory";
    A.open("ear", Ear);
  }
  A.actions["review-all"] = function () {
    var list = State.data.mistakes
      .filter(function (m) {
        return !m.mastered;
      })
      .slice(-20)
      .map(function (m) {
        return m.question;
      });
    if (list.length) startReview(list);
  };
  A.actions["review-one"] = function (id) {
    var m = State.data.mistakes[+id];
    if (m) startReview([m.question]);
  };
  function rhythmSetup() {
    return (
      A.title(
        "HEAR A RHYTHM · TAP IT BACK",
        "把节奏，落在手指上",
        "这是屏幕敲击训练，不评估真实吉他扫弦。",
      ) +
      '<div class="form-grid">' +
      A.field(
        "节奏型",
        "tap-pattern",
        REFERENCE.rhythmData.map(function (p) {
          return [p.id, p.title + " · " + p.meter];
        }),
        Tap.pattern.id,
      ) +
      A.field(
        "练习方式",
        "tap-mode",
        [
          ["follow", "跟拍 · 保留节奏提示"],
          ["memory", "模仿 · 听后隐藏节奏"],
        ],
        Tap.mode,
      ) +
      A.field(
        "容差",
        "tap-tolerance",
        [
          [0.16, "入门 · ±160毫秒"],
          [0.11, "标准 · ±110毫秒"],
          [0.075, "挑战 · ±75毫秒"],
        ],
        Tap.tolerance,
      ) +
      '<label class="field"><span>速度 BPM</span><input id="tap-bpm" type="number" min="40" max="140" value="' +
      Tap.bpm +
      '"></label></div><div id="tap-pattern-preview">' +
      patternGrid(Tap.pattern) +
      '</div><div class="tip">' +
      esc(Tap.pattern.desc) +
      "<br>先数一小节，再完成两小节。6/8 的 BPM 按附点四分音符（两大拍）计。点击“开始”后使用下方大按钮，测量值包含触屏和系统延迟。</div>" +
      btn(
        "tap-start",
        "",
        icon("play") +
          " " +
          (Tap.mode === "memory" ? "先听两小节示范" : "开始敲击训练"),
        "accent wide",
      )
    );
  }
  function patternGrid(p, hidden) {
    return (
      '<div class="bar-grid" style="grid-template-columns:repeat(' +
      Math.min(8, p.slots.length) +
      ',1fr)">' +
      p.slots
        .map(function (s, i) {
          return (
            '<div class="beat-cell ' +
            (s === "." ? "rest" : "") +
            '" data-slot="' +
            i +
            '"><span>' +
            esc(p.labels[i]) +
            "</span><b>" +
            (hidden
              ? "·"
              : { D: "↓", U: "↑", X: "×", B: "低音", ".": "·" }[s] || esc(s)) +
            "</b></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }
  A.modals.rhythm = function (s) {
    Tap = s || {
      pattern: REFERENCE.rhythmData[0],
      bpm: 72,
      mode: "follow",
      tolerance: 0.16,
      phase: "setup",
      taps: [],
      expected: [],
      timer: null,
      pointer: 0,
    };
    if (Tap.phase === "setup") return rhythmSetup();
    if (Tap.phase === "result") {
      var r = Tap.result;
      return (
        A.title(
          "LISTEN TO YOUR TIMING",
          "这两小节的时间感",
          "命中与额外点击都计入结果，快点乱敲不会获得高分。",
        ) +
        '<div class="result-hero"><div class="big">' +
        r.accuracy +
        '<span style="font-size:25px">%</span></div><h2>节奏完成分</h2><p>命中 ' +
        r.hits +
        " / " +
        r.total +
        " 个位置 · 额外点击 " +
        r.extra +
        " 次<br>命中平均绝对偏差 " +
        (r.mean === null ? "—" : Math.round(r.mean * 1000)) +
        " 毫秒<br>触屏延迟会影响结果，适合作为个人练习参考。</p></div>" +
        btn("tap-again", "", "再练一次", "accent wide") +
        btn("tap-settings", "", "换节奏与速度", "outline wide")
      );
    }
    return (
      A.title(
        "STAY WITH THE PULSE",
        Tap.pattern.title,
        Tap.phase === "demo"
          ? "先完整听两小节，然后准备自己复现。"
          : Tap.phase === "ready"
            ? "听完了，准备好再开始复现。"
            : "先数一小节，然后跟着你听到的节奏敲击。",
      ) +
      '<div class="card"><div class="hrow between"><span class="pill blue">' +
      Tap.pattern.meter +
      " · " +
      Tap.bpm +
      ' BPM</span><span id="tap-status" class="small">' +
      (Tap.phase === "ready" ? "准备复现" : "正在准备…") +
      "</span></div>" +
      patternGrid(Tap.pattern, Tap.mode === "memory" && Tap.phase !== "demo") +
      '</div><button class="tap-pad" id="tap-pad" ' +
      attr("tap-now") +
      " " +
      (!["running", "counting"].includes(Tap.phase) ? "disabled" : "") +
      '><strong>轻点这里</strong><small id="tap-count">' +
      Tap.taps.length +
      " 次点击</small></button>" +
      (Tap.phase === "ready"
        ? btn("tap-perform", "", "开始复现 " + icon("play"), "accent wide")
        : btn("tap-cancel", "", "停止本轮", "outline wide")) +
      '<p class="feedback-note">' +
      (Tap.mode === "memory"
        ? "示范后只保留节拍器，节奏动作隐藏。"
        : "跟拍中保留合成节奏与节拍器。") +
      " 输入仅来自屏幕点击。</p>"
    );
  };
  A.actions.rhythm = function () {
    A.open("rhythm");
  };
  function redrawTap() {
    if (A.modal && A.modal.kind === "rhythm")
      $("#dialog-body").innerHTML = A.modals.rhythm(Tap);
  }
  A.changes["tap-pattern"] = function (e) {
    Tap.pattern = REFERENCE.rhythmData.filter(function (p) {
      return p.id === e.target.value;
    })[0];
    $("#tap-pattern-preview").innerHTML = patternGrid(Tap.pattern);
  };
  A.changes["tap-bpm"] = function (e) {
    Tap.bpm = Math.max(40, Math.min(140, +e.target.value || 72));
  };
  A.changes["tap-tolerance"] = function (e) {
    Tap.tolerance = +e.target.value;
  };
  A.changes["tap-mode"] = function (e) {
    Tap.mode = e.target.value;
    $("#dialog-body").innerHTML = rhythmSetup();
  };
  A.actions["tap-start"] = async function () {
    Tap.pattern = REFERENCE.rhythmData.filter(function (p) {
      return p.id === $("#tap-pattern").value;
    })[0];
    Tap.bpm = Math.max(40, Math.min(140, +$("#tap-bpm").value || 72));
    Tap.tolerance = +$("#tap-tolerance").value;
    Tap.mode = $("#tap-mode").value;
    if (Tap.mode === "memory") {
      Tap.phase = "demo";
      redrawTap();
      var demo = Sound.rhythmEvents(Tap.pattern, "C", Tap.bpm, 2, 0);
      var done = await Sound.sequence(demo.events, {
        duration: demo.barTime * 2,
        onStep: function (v) {
          showTapBeat(v);
        },
      });
      if (done && A.modal && A.modal.kind === "rhythm") {
        Tap.phase = "ready";
        redrawTap();
      }
    } else performTap();
  };
  function showTapBeat(v) {
    App.$$(".beat-cell").forEach(function (b) {
      b.classList.toggle("hot", +b.dataset.slot === v.slot && !v.counting);
    });
    var status = $("#tap-status");
    if (status)
      status.textContent = v.counting
        ? "预备 · 数一小节"
        : "第 " + (v.bar + 1) + " / 2 小节";
  }
  async function performTap() {
    var session = Tap;
    Tap.phase = "counting";
    Tap.taps = [];
    Tap.expected = [];
    redrawTap();
    var batch = Sound.rhythmEvents(Tap.pattern, "C", Tap.bpm, 2, 1);
    if (Tap.mode === "memory")
      batch.events = batch.events.filter(function (e) {
        return e.click;
      });
    var onStart = function (t) {
      Tap.start = t;
      for (var b = 0; b < 2; b++)
        Tap.pattern.slots.forEach(function (s, i) {
          if (s !== ".")
            Tap.expected.push(
              batch.barTime * (b + 1) +
                (i * batch.barTime) / Tap.pattern.slots.length,
            );
        });
      Tap.timer = setInterval(function () {
        if (Tap !== session) return;
        var x = Sound.now() - Tap.start;
        if (x >= batch.barTime && Tap.phase === "counting")
          Tap.phase = "running";
      }, 30);
    };
    try {
      var done = await Sound.sequence(batch.events, {
        duration: batch.barTime * 3,
        onStart: onStart,
        onStep: showTapBeat,
      });
      if (Tap !== session || !done || !A.modal || A.modal.kind !== "rhythm")
        return;
      clearInterval(Tap.timer);
      Tap.result = Music.tapScore(Tap.expected, Tap.taps, Tap.tolerance);
      Tap.phase = "result";
      State.session(
        "rhythm",
        "节奏敲击 · " + Tap.pattern.title,
        batch.barTime * 3,
        Tap.result.accuracy,
        Tap.result.hits +
          "/" +
          Tap.result.total +
          " 命中，额外 " +
          Tap.result.extra +
          " 次",
      );
      redrawTap();
    } catch (e) {
      clearInterval(Tap.timer);
      Tap.phase = "setup";
      redrawTap();
      A.toast("声音无法启动，请重新开始。");
    }
  }
  A.actions["tap-perform"] = performTap;
  A.actions["tap-again"] = performTap;
  A.actions["tap-settings"] = function () {
    Tap.phase = "setup";
    redrawTap();
  };
  A.actions["tap-cancel"] = function () {
    cancel();
    Tap.phase = "setup";
    Sound.stop();
    redrawTap();
    A.toast("本轮已停止，没有生成成绩。");
  };
  function tapNow() {
    if (!Tap || !["running", "counting"].includes(Tap.phase)) return;
    var time = Sound.now() - Tap.start;
    var bar =
      ((Tap.pattern.meter === "6/8" ? 2 : Tap.pattern.meter === "3/4" ? 3 : 4) *
        60) /
      Tap.bpm;
    if (time < bar) {
      A.toast("先数预备拍，下一小节再开始。");
      return;
    }
    if (time > bar * 3 + 0.1) return;
    Tap.taps.push(time);
    Sound.click(Sound.now() + 0.002, false);
    if ($("#tap-count"))
      $("#tap-count").textContent = Tap.taps.length + " 次点击";
  }
  document.addEventListener("pointerdown", function (e) {
    if (
      e.target.closest("#tap-pad") &&
      !e.target.closest("#tap-pad").disabled
    ) {
      e.preventDefault();
      Tap.pointer = Date.now();
      tapNow();
    }
  });
  A.actions["tap-now"] = function () {
    if (Tap && Date.now() - (Tap.pointer || 0) > 500) tapNow();
  };
  function cancel() {
    if (Tap) {
      clearInterval(Tap.timer);
      if (["running", "counting", "demo"].includes(Tap.phase))
        Tap.phase = "setup";
    }
  }
  A.cleanups.rhythm = cancel;
  return { cancel: cancel, patternGrid: patternGrid, names: names };
})();

var Mic = (function () {
  "use strict";
  var A = App,
    $ = A.$,
    esc = A.esc,
    btn = A.btn,
    icon = A.icon;
  var m = {
    active: false,
    pending: false,
    mode: "single",
    target: 60,
    sequence: [60],
    index: 0,
    values: [],
    recent: [],
    history: [],
    frameCount: 0,
    start: 0,
    timer: null,
    stable: 0,
    stableFrames: 0,
    finished: false,
    stepResults: [],
    stepStart: 0,
  };
  function targets() {
    if (m.mode === "tuner") return [m.target];
    if (m.mode === "single") return [m.target];
    var rel =
      m.phrase === "triad"
        ? [0, 4, 7]
        : m.phrase === "five"
          ? [0, 2, 4, 5, 7]
          : [0, 2, 4];
    return rel.map(function (x) {
      return m.target + x;
    });
  }
  function targetName() {
    return Music.name(m.sequence[m.index]);
  }
  function config() {
    return (
      A.title(
        "SING ONE NOTE AT A TIME",
        m.mode === "tuner" ? "把吉他调到标准音" : "让声音，稳稳靠近目标",
        "先听参考音，停止播放，再开始采音。建议使用耳机，避免扬声器被误当成你的声音。",
      ) +
      '<div class="tabs">' +
      [
        ["single", "单音匹配"],
        ["phrase", "分段模唱"],
        ["tuner", "吉他调音"],
      ]
        .map(function (x) {
          return (
            '<button class="tab ' +
            (m.mode === x[0] ? "active" : "") +
            '" ' +
            A.attr("mic-mode", x[0]) +
            ">" +
            x[1] +
            "</button>"
          );
        })
        .join("") +
      '</div><div class="form-grid">' +
      A.field(
        m.mode === "tuner" ? "选择琴弦" : "起音 / 目标音",
        "mic-target",
        m.mode === "tuner"
          ? [
              [40, "⑥弦 E2"],
              [45, "⑤弦 A2"],
              [50, "④弦 D3"],
              [55, "③弦 G3"],
              [59, "②弦 B3"],
              [64, "①弦 E4"],
            ]
          : Array.from(
              { length: m.mode === "phrase" ? 28 : 37 },
              function (_, i) {
                return [
                  45 + i,
                  Music.name(45 + i) +
                    " · " +
                    Music.freq(45 + i).toFixed(1) +
                    "Hz",
                ];
              },
            ),
        m.target,
      ) +
      (m.mode === "phrase"
        ? A.field(
            "模唱小句（大调）",
            "mic-phrase",
            [
              ["steps", "1–2–3 级进"],
              ["triad", "1–3–5 大三和弦"],
              ["five", "1–2–3–4–5 五音"],
            ],
            m.phrase || "steps",
          )
        : A.field(
            "判定容差",
            "mic-tolerance",
            [
              [25, "±25 音分"],
              [15, "±15 音分"],
            ],
            m.tolerance || 25,
          )) +
      '</div><div class="tip">' +
      (m.mode === "phrase"
        ? "每个目标先单独听，再唱。一个音稳定接近目标至少0.8秒后，标记该音完成；点击“下一个音”继续，不会把扬声器示范当作你的得分。"
        : m.mode === "tuner"
          ? "标准调弦从粗到细为 E2 A2 D3 G3 B3 E4。一次只拨一根弦，其他弦尽量消音。"
          : "轻松持续哼唱2–4秒，再休息。不需要用力提高音量。") +
      " 采用 A4=440 Hz、十二平均律。</div>" +
      btn("mic-prepare", "", icon("mic") + " 进入训练面板", "accent wide")
    );
  }
  function panel() {
    return (
      A.title(
        "LISTEN · MATCH · REFINE",
        m.mode === "tuner"
          ? "标准调音 · " + targetName()
          : m.mode === "phrase"
            ? "分段模唱，一次唱准一个音"
            : "匹配 " + targetName(),
        "目标 " +
          Music.freq(m.sequence[m.index]).toFixed(1) +
          " Hz · 容差 ±" +
          m.tolerance +
          " 音分",
      ) +
      (m.mode === "phrase"
        ? '<div class="pitch-targets">' +
          m.sequence
            .map(function (n, i) {
              return (
                '<span class="' +
                (i === m.index ? "current" : i < m.index ? "done" : "") +
                '">' +
                Music.name(n) +
                "</span>"
              );
            })
            .join("")
        : "") +
      '<div class="hrow between">' +
      btn("mic-reference", "", icon("ear") + " 听当前参考音", "soft") +
      btn("mic-config", "", "调整练习", "outline") +
      '</div><div class="practice-stage"><div class="eyebrow muted">检测音高 · 相对于目标 ' +
      esc(targetName()) +
      '</div><div class="tone-note" id="mic-note">—</div><div class="tone-hz" id="mic-hz">等待声音</div><div class="tone-status" id="mic-status">准备好后开始；采音时不会播放示范音。</div><div class="tuner"><i class="needle" id="mic-needle" hidden></i></div><div class="tuner-captions"><span>−100 · 偏低</span><span>0</span><span>偏高 · +100</span></div><svg class="pitch-plot" viewBox="0 0 320 75" preserveAspectRatio="none" role="img" aria-label="音高偏差轨迹"><path class="mid" d="M0 37.5H320"/><polyline id="mic-line" points=""/></svg><div class="session-stats"><div><strong id="mic-time">0s</strong><small>本次时长</small></div><div><strong id="mic-valid">0</strong><small>有效采样</small></div><div><strong id="mic-rate">—</strong><small>落在容差内</small></div></div>' +
      btn(
        "mic-toggle",
        "",
        icon("mic") + " 开始" + (m.mode === "tuner" ? "调音" : "训练"),
        "accent wide",
      ) +
      '<div id="mic-result"></div>' +
      (m.mode === "phrase"
        ? btn("mic-next", "", "完成本音后，继续下一个", "soft wide")
        : "") +
      '</div><div class="tip">只有达到音量和周期性条件的单音采样才会统计。静音、杂音、多人声和和弦不用于打分。指针显示范围±100音分，超出范围看文字数值。进入后台停止，单次最多60秒。原始声音不保存、不上传。</div>'
    );
  }
  A.modals.pitch = function (arg) {
    if (arg && arg.configure) return config();
    return panel();
  };
  A.actions.pitch = function (mode) {
    stop();
    m.mode = mode || "single";
    m.target = m.mode === "tuner" ? 40 : 60;
    m.phrase = "steps";
    m.tolerance = 25;
    m.sequence = targets();
    m.index = 0;
    m.stepResults = [];
    A.open("pitch", { configure: true });
  };
  A.actions["mic-mode"] = function (mode) {
    stop();
    m.mode = mode;
    m.target = mode === "tuner" ? 40 : 60;
    $("#dialog-body").innerHTML = config();
  };
  A.actions["mic-prepare"] = function () {
    m.target = +$("#mic-target").value;
    m.tolerance = $("#mic-tolerance") ? +$("#mic-tolerance").value : 25;
    m.phrase = $("#mic-phrase") ? $("#mic-phrase").value : "steps";
    m.sequence = targets();
    m.index = 0;
    m.stepResults = [];
    m.finished = false;
    A.modal.arg = { configure: false };
    $("#dialog-body").innerHTML = panel();
    $("#modal").scrollTop = 0;
  };
  A.actions["mic-config"] = function () {
    stop();
    A.modal.arg = { configure: true };
    $("#dialog-body").innerHTML = config();
    $("#modal").scrollTop = 0;
  };
  A.actions["mic-reference"] = async function () {
    if (m.active || m.pending) {
      A.toast("先结束采音，再听参考音。");
      return;
    }
    await Sound.sequence(
      [{ at: 0, note: m.sequence[m.index], duration: 1.2 }],
      {},
    );
  };
  function renderButton(label) {
    var b = document.querySelector('[data-act="mic-toggle"]');
    if (b) {
      b.disabled = false;
      b.innerHTML = icon(m.active ? "pause" : "mic") + " " + label;
    }
  }
  function start() {
    if (!window.Sonora) {
      A.toast("此页面为预览；实时麦克风需要安装安卓 APK。");
      return;
    }
    Sound.stop();
    m.pending = true;
    var b = document.querySelector('[data-act="mic-toggle"]');
    b.disabled = true;
    b.textContent = "正在申请麦克风…";
    Sonora.start();
  }
  function stop() {
    var was = m.active || m.pending;
    m.pending = false;
    if (was && window.Sonora) Sonora.stop();
    finish();
  }
  function finish() {
    clearInterval(m.timer);
    if (!m.active) {
      renderButton("开始" + (m.mode === "tuner" ? "调音" : "训练"));
      return;
    }
    m.active = false;
    var duration = (Date.now() - m.start) / 1000;
    renderButton("再练一次");
    var result = $("#mic-result");
    if (m.values.length >= 10) {
      var rate =
          (m.values.filter(function (c) {
            return Math.abs(c) <= m.tolerance;
          }).length /
            m.values.length) *
          100,
        avg =
          m.values.reduce(function (a, b) {
            return a + Math.abs(b);
          }, 0) / m.values.length;
      State.session(
        "pitch",
        (m.mode === "tuner"
          ? "调音"
          : m.mode === "phrase"
            ? "分段模唱"
            : "单音跟唱") +
          " · " +
          targetName(),
        duration,
        rate,
        "平均绝对偏差 " +
          Math.round(avg) +
          " 音分；有效采样 " +
          m.values.length,
      );
      if (result)
        result.innerHTML =
          '<div class="feedback"><h3>' +
          Math.round(rate) +
          "% 有效采样落在容差内</h3><p>平均绝对偏差 " +
          Math.round(avg) +
          " 音分 · " +
          m.values.length +
          " 个有效采样。统计采用原始有效采样，指针使用最近5帧中位数。</p></div>";
    } else if (result)
      result.innerHTML =
        '<div class="tip">有效声音不足，暂不生成成绩。请在安静处持续发一个舒适的单音。</div>';
  }
  window.nativeState = function (state) {
    if (state === "started") {
      if (!A.modal || A.modal.kind !== "pitch") {
        if (window.Sonora) Sonora.stop();
        return;
      }
      m.active = true;
      m.pending = false;
      m.start = Date.now();
      m.values = [];
      m.recent = [];
      m.history = [];
      m.stable = 0;
      m.stableFrames = 0;
      m.finished = false;
      renderButton("结束训练");
      if ($("#mic-result")) $("#mic-result").innerHTML = "";
      m.timer = setInterval(function () {
        if (!m.active) return;
        if ($("#mic-time"))
          $("#mic-time").textContent =
            Math.floor((Date.now() - m.start) / 1000) + "s";
        if (Date.now() - m.start > 60000) stop();
      }, 250);
    } else if (state === "stopped") {
      m.pending = false;
      finish();
    } else {
      m.pending = false;
      finish();
      renderButton("开始训练");
      A.toast(
        state === "denied"
          ? "麦克风未授权。可在系统应用权限中开启，其他功能仍能使用。"
          : state === "busy"
            ? "录音设备正在释放，请稍后重试。"
            : "无法使用麦克风，请检查权限或其他录音应用。",
      );
    }
  };
  window.nativePitch = function (hz, confidence, rms) {
    if (!m.active || !$("#mic-note")) return;
    if (Date.now() - m.start < 600) return;
    var good =
      Number.isFinite(hz) &&
      hz >= 65 &&
      hz <= 1100 &&
      confidence >= 0.85 &&
      rms >= 0.008;
    if (!good) {
      m.recent = [];
      m.stable = 0;
      m.stableFrames = 0;
      $("#mic-note").textContent = "—";
      $("#mic-hz").textContent =
        rms < 0.008 ? "声音较轻，靠近麦克风试试" : "请保持单音，并减少杂音";
      $("#mic-status").textContent = "暂时无法判断音高";
      $("#mic-needle").hidden = true;
      return;
    }
    var target = m.sequence[m.index],
      c = Music.cents(hz, target);
    m.values.push(c);
    m.recent.push(c);
    if (m.recent.length > 5) m.recent.shift();
    var sorted = m.recent.slice().sort(function (a, b) {
        return a - b;
      }),
      v = sorted[Math.floor(sorted.length / 2)],
      n = Math.round(69 + 12 * Math.log2(hz / 440));
    $("#mic-note").textContent = Music.name(n);
    $("#mic-hz").textContent =
      hz.toFixed(1) + " Hz · " + (c >= 0 ? "+" : "") + Math.round(c) + " 音分";
    $("#mic-needle").hidden = false;
    $("#mic-needle").style.left =
      50 + Math.max(-100, Math.min(100, v)) / 2 + "%";
    $("#mic-status").textContent =
      Math.abs(v) <= m.tolerance
        ? "很接近，保持轻松 ✓"
        : v > 0
          ? "当前偏高，稍微低一点"
          : "当前偏低，稍微高一点";
    $("#mic-status").style.color =
      Math.abs(v) <= m.tolerance ? "#2e806c" : "#c1744b";
    m.history.push(v);
    if (m.history.length > 70) m.history.shift();
    $("#mic-line").setAttribute(
      "points",
      m.history
        .map(function (v, i) {
          return (
            (i / 69) * 320 +
            "," +
            (37.5 - Math.max(-100, Math.min(100, v)) * 0.3)
          );
        })
        .join(" "),
    );
    $("#mic-valid").textContent = m.values.length;
    $("#mic-rate").textContent =
      Math.round(
        (m.values.filter(function (v) {
          return Math.abs(v) <= m.tolerance;
        }).length /
          m.values.length) *
          100,
      ) + "%";
    if (m.mode === "phrase") {
      if (Math.abs(c) <= m.tolerance) {
        if (!m.stable) m.stable = Date.now();
        m.stableFrames++;
        if (Date.now() - m.stable >= 800 && m.stableFrames >= 8) {
          m.finished = true;
          $("#mic-status").textContent = "本音已稳定，可以结束后继续下一个 ✓";
        }
      } else {
        m.stable = 0;
        m.stableFrames = 0;
      }
    }
  };
  A.actions["mic-toggle"] = function () {
    if (m.active || m.pending) stop();
    else start();
  };
  A.actions["mic-next"] = function () {
    if (m.active || m.pending) {
      A.toast("先结束本音采集，再进入下一个。");
      return;
    }
    if (!m.finished) {
      A.toast("请先把本音稳定唱在目标附近至少0.8秒。");
      return;
    }
    m.stepResults.push(m.sequence[m.index]);
    if (m.index < m.sequence.length - 1) {
      m.index++;
      m.finished = false;
      $("#dialog-body").innerHTML = panel();
      $("#modal").scrollTop = 0;
    } else {
      $("#mic-result").innerHTML =
        '<div class="feedback"><h3>✓ 这句逐音模唱完成了</h3><p>' +
        m.sequence.map(Music.name).join(" – ") +
        "。这验证的是逐个目标音匹配，不是连续整句或整曲评分。</p></div>";
      A.toast("完成一轮分段模唱。");
    }
  };
  return {
    get active() {
      return m.active;
    },
    get pending() {
      return m.pending;
    },
    stop: stop,
    get state() {
      return m;
    },
  };
})();
