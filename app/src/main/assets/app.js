"use strict";
var App = (function () {
  var $ = function (s) {
      return document.querySelector(s);
    },
    $$ = function (s) {
      return Array.from(document.querySelectorAll(s));
    };
  var paths = {
    wave: "M3 10v4m4-8v12m5-16v20m5-17v14m4-10v6",
    home: "m3 10 9-7 9 7v11h-6v-7H9v7H3z",
    book: "M3 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H3zm18 0h-6a3 3 0 0 0-3 3v14a4 4 0 0 1 4-2h5z",
    ear: "M4 13v-2a8 8 0 0 1 16 0v2M4 12h3v8H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2m16 0h-3v8h3a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2",
    guitar:
      "m16 3 5 5m-3-6-8 8M6 8c-2 0-4 2-4 5 0 4 4 8 8 8 3 0 5-2 5-4 0-1-1-2-2-3l2-3-2-2-3 2C9 9 8 8 6 8m1 6 3 3",
    user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 22v-3a8 8 0 0 1 16 0v3",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    back: "M19 12H5m6-6-6 6 6 6",
    chevron: "m9 5 7 7-7 7",
    play: "m9 5 11 7-11 7z",
    pause: "M8 5v14M16 5v14",
    check: "m5 12 4 4 10-10",
    clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 6v6l4 2",
    mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0zM5 10v2a7 7 0 0 0 14 0v-2M12 19v4m-4 0h8",
    layers: "m3 7 9-5 9 5-9 5zm0 5 9 5 9-5M3 17l9 5 9-5",
    repeat:
      "m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3",
    search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0m-2 5 6 6",
    shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6",
    download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
    upload: "M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5",
    sliders: "M5 3v18M12 3v18M19 3v18M2 8h6M9 15h6M16 7h6",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    note: "M9 18V5l12-2v13M9 9l12-2M9 18c0 2-6 4-6 1s6-4 6-1m12-2c0 2-6 4-6 1s6-4 6-1",
    pulse: "M2 12h5l3-8 4 16 3-8h5",
    flag: "M5 22V3m0 0c4-4 9 4 14 0v10c-5 4-10-4-14 0",
    trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
    piano: "M3 4h18v16H3zM7 4v8h2V4m6 0v8h2V4M9 12v8m6-8v8",
    star: "m12 3 3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L3 10l6-1z",
    close: "m6 6 12 12M6 18 18 6",
    plus: "M5 12h14M12 5v14",
    minus: "M5 12h14",
  };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }
  function icon(n) {
    return (
      '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="' +
      (paths[n] || paths.note) +
      '"/></svg>'
    );
  }
  function attr(a, id) {
    return (
      'data-act="' + a + '" data-id="' + esc(id === undefined ? "" : id) + '"'
    );
  }
  function btn(a, id, label, cls) {
    return (
      '<button class="btn ' +
      (cls || "") +
      '" ' +
      attr(a, id) +
      ">" +
      label +
      "</button>"
    );
  }
  function title(k, h, p) {
    return (
      '<div class="dialog-title"><div class="eyebrow muted">' +
      esc(k) +
      "</div><h1>" +
      esc(h) +
      "</h1>" +
      (p ? "<p>" + esc(p) + "</p>" : "") +
      "</div>"
    );
  }
  function options(values, value) {
    return values
      .map(function (a) {
        return (
          '<option value="' +
          esc(a[0]) +
          '" ' +
          (String(value) === String(a[0]) ? "selected" : "") +
          ">" +
          esc(a[1]) +
          "</option>"
        );
      })
      .join("");
  }
  function field(label, id, values, value) {
    return (
      '<label class="field"><span>' +
      esc(label) +
      '</span><select id="' +
      id +
      '">' +
      options(values, value) +
      "</select></label>"
    );
  }
  function brand() {
    return (
      '<div class="brand"><span class="logo">' +
      icon("wave") +
      '</span><div><div class="brand-name">听见<span style="font-size:10px;letter-spacing:0;margin-left:5px;color:#9da5b6">2.0</span></div><div class="brand-sub">GUITAR & EAR STUDIO</div></div></div>'
    );
  }
  var app = {
    actions: {},
    changes: {},
    inputs: {},
    modals: {},
    cleanups: {},
    tab: "home",
    learning: "courses",
    group: "全部",
    search: "",
    planType: "g",
    week: 0,
    modal: null,
    history: [],
    pendingImport: null,
  };
  var toastTimer,
    lastActivity = Date.now();
  function toast(s) {
    $("#toast").textContent = s;
    $("#toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      $("#toast").classList.remove("show");
    }, 3400);
  }
  function stop() {
    Sound.stop();
    if (window.Mic) Mic.stop();
    if (window.Training) Training.cancel();
    if (app.modal && app.cleanups[app.modal.kind])
      app.cleanups[app.modal.kind]();
  }
  function open(kind, arg, push) {
    if (!app.modals[kind]) return;
    stop();
    if (app.modal && push !== false) app.history.push(app.modal);
    app.modal = { kind: kind, arg: arg };
    renderModal();
    lastActivity = Date.now();
  }
  function renderModal() {
    var m = app.modal;
    $("#modal").hidden = false;
    $("#shell").setAttribute("aria-hidden", "true");
    $("#modal").innerHTML =
      '<article class="dialog"><div class="dialog-top"><button class="circle-btn" ' +
      attr("back") +
      ' aria-label="返回">' +
      icon("back") +
      '</button><span class="dialog-label">' +
      esc(
        {
          lesson: "知识与实操",
          day: "每日任务",
          ear: "听音练习",
          rhythm: "节奏敲击",
          pitch: "音准与调音",
          fret: "指板实验室",
          chords: "和弦图鉴",
          progressions: "和弦进行",
          patterns: "节奏实验室",
          studio: "弹唱练习室",
          settings: "练习设置",
          review: "错题复练",
          backup: "导入备份",
          privacy: "隐私与权限",
        }[m.kind] || "听见练习室",
      ) +
      '</span><span class="eyebrow muted">SONORA</span></div><div id="dialog-body">' +
      app.modals[m.kind](m.arg) +
      "</div></article>";
    document.body.classList.add("no-scroll");
    $("#modal").scrollTop = 0;
  }
  function back() {
    if (app.modal) {
      stop();
      if (app.history.length) {
        app.modal = app.history.pop();
        renderModal();
      } else {
        app.modal = null;
        $("#modal").hidden = true;
        $("#modal").innerHTML = "";
        $("#shell").removeAttribute("aria-hidden");
        document.body.classList.remove("no-scroll");
        render();
      }
    } else if (app.tab !== "home") {
      navigate("home");
    } else if (window.Sonora && Sonora.close) Sonora.close();
  }
  function navigate(tab) {
    stop();
    app.history = [];
    app.modal = null;
    $("#modal").hidden = true;
    $("#modal").innerHTML = "";
    document.body.classList.remove("no-scroll");
    $("#shell").removeAttribute("aria-hidden");
    app.tab = tab;
    render();
    window.scrollTo(0, 0);
    lastActivity = Date.now();
  }
  var tabs = [
    ["home", "home", "今日"],
    ["learn", "book", "学堂"],
    ["train", "ear", "训练"],
    ["lab", "guitar", "实验室"],
    ["me", "user", "我的"],
  ];
  function nav() {
    return tabs
      .map(function (t) {
        return (
          '<button class="navitem ' +
          (app.tab === t[0] ? "active" : "") +
          '" ' +
          attr("nav", t[0]) +
          " " +
          (app.tab === t[0] ? 'aria-current="page"' : "") +
          ">" +
          icon(t[1]) +
          "<span>" +
          t[2] +
          "</span></button>"
        );
      })
      .join("");
  }
  function render() {
    Sound.configure(State.data.settings);
    $("#header").innerHTML =
      brand() +
      '<span class="pill">' +
      icon("shield") +
      "离线练习 · 本机保存</span>";
    $("#nav").innerHTML = nav();
    $("#rail").innerHTML =
      brand() +
      '<div style="margin-top:40px">' +
      nav() +
      '</div><div class="rail-foot">一点理解，一点练习。<br>把声音与指尖连接起来。<br><span class="pill orange" style="margin-top:13px">重写版 · 2.0.0</span></div>';
    $("#main").innerHTML = {
      home: home,
      learn: learn,
      train: training,
      lab: lab,
      me: profile,
    }[app.tab]();
  }
  function planDays(type) {
    if (type === "g")
      return REFERENCE.guitarWeeks.reduce(function (a, w) {
        return a.concat(w.days);
      }, []);
    if (type === "e")
      return REFERENCE.WEEKS.reduce(function (a, w, wi) {
        return a.concat(
          w.days.map(function (d, j) {
            return {
              title: d[0],
              task: d[1],
              evidence: d[4],
              mode: d[2],
              difficulty: d[3],
              week: wi + 1,
              day: wi * 7 + j,
            };
          }),
        );
      }, []);
    return REFERENCE.plan.map(function (d, i) {
      return {
        title: d.title,
        task: d.aim,
        evidence: d.pass,
        tasks: d.tasks,
        week: Math.floor(i / 7) + 1,
      };
    });
  }
  function completedDays(type) {
    return planDays(type).filter(function (_, i) {
      return (
        State.data.days[type + "-" + i] && State.data.days[type + "-" + i].done
      );
    }).length;
  }
  function nextDay(type) {
    var a = planDays(type);
    var i = a.findIndex(function (_, j) {
      return (
        !State.data.days[type + "-" + j] ||
        !State.data.days[type + "-" + j].done
      );
    });
    return i < 0 ? 0 : i;
  }
  function dateAt(i) {
    var a = State.data.start.split("-").map(Number),
      d = new Date(a[0], a[1] - 1, a[2] + i);
    return d.getMonth() + 1 + "月" + d.getDate() + "日";
  }
  function heroArt() {
    return (
      '<svg class="hero-art" viewBox="0 0 230 270" aria-hidden="true"><circle cx="151" cy="150" r="94" fill="#263452"/><circle cx="151" cy="150" r="73" fill="none" stroke="#4b5e82"/><g transform="translate(100 20) rotate(23 30 110)"><path d="M23 13h22v133H23z" fill="#d8a588"/><path d="M22 15h24v-20H22z" fill="#f0b18c"/><path d="M15 124C-25 113-35 151-10 173c-31 31-15 72 20 73 48 4 59-38 37-65 25-27 8-62-22-57z" fill="#eb9f78"/><ellipse cx="18" cy="177" rx="15" ry="18" fill="#263452"/><path d="M4 216h29v7H4z" fill="#754b3b"/><g stroke="#fff0db" stroke-width=".5">' +
      [28, 31, 34, 37, 40, 43]
        .map(function (x) {
          return '<path d="M' + x + " 0 " + (x - 13) + ' 220"/>';
        })
        .join("") +
      '</g><g stroke="#b77f63">' +
      [25, 38, 51, 64, 77, 90, 103, 116]
        .map(function (y) {
          return '<path d="M23 ' + y + 'h22"/>';
        })
        .join("") +
      '</g></g><circle cx="55" cy="58" r="4" fill="#f2bc93"/><path d="m202 238 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#ecaa81"/></svg>'
    );
  }
  function home() {
    var day = nextDay("g"),
      d = planDays("g")[day],
      done = completedDays("g"),
      errors = State.data.mistakes.filter(function (m) {
        return !m.mastered;
      }).length;
    return (
      '<div class="welcome"><div class="eyebrow muted">' +
      new Date().toLocaleDateString("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long",
      }) +
      '</div><h1 style="margin-top:8px">今天，也离音乐近一点。</h1><p>你的吉他与听觉练习室 · 每天 ' +
      State.data.daily +
      ' 分钟</p></div><section class="hero">' +
      heroArt() +
      '<div class="eyebrow">ONE SMALL PRACTICE AT A TIME</div><h1>让每一次练习<br>都有方向。</h1><p>从指板与和弦出发，把乐理听懂，再把音乐弹出来。</p>' +
      btn("day", "g-" + day, "开始今天的任务 " + icon("arrow"), "") +
      '</section><div class="stats"><div class="stat"><strong>' +
      done +
      '</strong><span class="unit">/ 84</span><small>完成学习日</small></div><div class="stat"><strong>' +
      State.data.events.length +
      '</strong><span class="unit">题</span><small>近千题听辨与自测</small></div><div class="stat"><strong>' +
      Math.floor(State.data.seconds / 60) +
      '</strong><span class="unit">分钟</span><small>应用内学习</small></div></div><div class="home-columns"><section><div class="section-head"><h2>今日学习路线</h2><button class="link" ' +
      attr("learning", "g") +
      '>查看 12 周计划 ↗</button></div><button class="plan-preview" ' +
      attr("day", "g-" + day) +
      '><div class="hrow"><span class="week-square"><small>WEEK</small><strong>' +
      String(Math.floor(day / 7) + 1).padStart(2, "0") +
      '</strong></span><div class="grow"><span class="eyebrow muted">DAY ' +
      String(day + 1).padStart(2, "0") +
      " · 逐日任务</span><h3>" +
      esc(d.title) +
      "</h3><p>" +
      esc(d.evidence) +
      "</p></div>" +
      icon("chevron") +
      '</div><div class="progress" style="margin-top:17px"><i style="width:' +
      (done / 84) * 100 +
      '%"></i></div></button><div class="mini-step"><span class="step-dot">01</span><div><strong>读懂一个概念</strong><p>57 章课程与图解，读完就去验证。</p></div></div><div class="mini-step"><span class="step-dot">02</span><div><strong>把耳朵练起来</strong><p>方向、音程、音级、音阶与和弦。</p></div></div><div class="mini-step"><span class="step-dot">03</span><div><strong>带到指尖和声音里</strong><p>节奏、指板、跟唱与歌曲分层练习。</p></div></div></section><section><div class="section-head"><h2>直接开始练习</h2><button class="link" ' +
      attr("nav", "train") +
      '>全部训练 ↗</button></div><div class="two-grid"><button class="quick-card" ' +
      attr("ear", "interval") +
      ">" +
      icon("ear") +
      '<span class="corner">↗</span><strong>听见音与音的距离</strong><small>随机换调 · 13 种音程</small></button><button class="quick-card" ' +
      attr("pitch", "single") +
      ">" +
      icon("mic") +
      '<span class="corner">↗</span><strong>让声音唱得更准</strong><small>单音 · 分段跟唱 · 吉他调音</small></button></div><div class="card" style="margin-top:13px"><div class="hrow between"><div><span class="pill orange">复习，比刷题更重要</span><h3 style="margin-top:10px">' +
      (errors
        ? "还有 " + errors + " 道题值得再听一次"
        : "为耳朵建立自己的记忆") +
      '</h3><p class="small" style="margin-top:7px">答错后能看见音高关系，并加入错题复练。</p></div></div>' +
      btn("review", "", "打开错题本 " + icon("arrow"), "soft wide") +
      '</div></section></div><div class="section-head"><h2>三条可以反复走的路径</h2></div><div class="plan-summary">' +
      [
        ["g", "12 周吉他乐理", "84 天，从音名到小作品"],
        ["e", "6 周听音专项", "42 天，从高低到旋律"],
        ["s", "14 天弹唱路线", "把一首歌分层练顺"],
      ]
        .map(function (a) {
          return (
            '<button class="card" style="text-align:left" ' +
            attr("learning", a[0]) +
            '><span class="pill blue">' +
            completedDays(a[0]) +
            " / " +
            planDays(a[0]).length +
            " 天</span><strong>" +
            a[1] +
            "</strong><p>" +
            a[2] +
            "</p></button>"
          );
        })
        .join("") +
      "</div>"
    );
  }
  function learningTabs() {
    return (
      '<div class="tabs">' +
      [
        ["courses", "57章知识"],
        ["g", "12周吉他"],
        ["e", "42天听音"],
        ["s", "14天弹唱"],
      ]
        .map(function (t) {
          return (
            '<button class="tab ' +
            (app.learning === t[0] ? "active" : "") +
            '" ' +
            attr("learn-tab", t[0]) +
            ">" +
            t[1] +
            "</button>"
          );
        })
        .join("") +
      "</div>"
    );
  }
  function learn() {
    return (
      '<div class="intro"><div class="eyebrow muted">LEARN IT · HEAR IT · USE IT</div><h1>从理解，到真正会用</h1><p>把你提供的三份参考，整理成可查、可练、可记录的学习路径。</p></div>' +
      learningTabs() +
      (app.learning === "courses"
        ? '<label class="search">' +
          icon("search") +
          '<input id="course-search" type="text" value="' +
          esc(app.search) +
          '" placeholder="搜索知识，例如：CAGED、切分、变调夹" aria-label="搜索课程"></label><div class="tabs">' +
          ["全部", "12周核心手册"]
            .concat(
              Array.from(
                new Set(
                  REFERENCE.knowledgeData.map(function (l) {
                    return l.group;
                  }),
                ),
              ),
            )
            .map(function (g) {
              return (
                '<button class="tab ' +
                (app.group === g ? "active" : "") +
                '" ' +
                attr("course-group", g) +
                ">" +
                esc(g) +
                "</button>"
              );
            })
            .join("") +
          '</div><div id="course-list">' +
          courseList() +
          "</div>"
        : planList(app.learning))
    );
  }
  function courseList() {
    var list = REFERENCE.lessons.filter(function (l) {
      return (
        (app.group === "全部" || l.group === app.group) &&
        (!app.search ||
          [l.title, l.summary, l.group]
            .join(" ")
            .toLowerCase()
            .indexOf(app.search.toLowerCase()) >= 0)
      );
    });
    return list.length
      ? '<div class="lesson-columns">' +
          list
            .map(function (l, i) {
              return (
                '<button class="lesson-row" ' +
                attr("lesson", l.id) +
                '><span class="lesson-number">' +
                (State.data.completed.includes(l.id)
                  ? "✓"
                  : String(i + 1).padStart(2, "0")) +
                '</span><div class="grow"><h3>' +
                esc(l.title) +
                "</h3><p>" +
                esc(l.group) +
                " · 讲解 / 例子 / 实操</p></div>" +
                icon("chevron") +
                "</button>"
              );
            })
            .join("") +
          "</div>"
      : '<div class="empty">没有找到这项内容，试试“音阶”或“和弦”。</div>';
  }
  function planList(type) {
    var days = planDays(type),
      weeks =
        type === "g"
          ? REFERENCE.guitarWeeks
          : type === "e"
            ? REFERENCE.WEEKS
            : [
                { title: "先把弹、唱分开练稳" },
                { title: "从分层，到完整弹唱" },
              ];
    return (
      '<div class="card" style="margin-bottom:16px"><div class="hrow between"><div><span class="eyebrow muted">YOUR OWN PACE</span><h3 style="margin-top:6px">已完成 ' +
      completedDays(type) +
      " / " +
      days.length +
      ' 天</h3></div><label class="field" style="max-width:150px"><span>计划开始日期</span><input id="start-date" type="date" value="' +
      esc(State.data.start) +
      '"></label></div><div class="progress" style="margin-top:16px"><i style="width:' +
      (completedDays(type) / days.length) * 100 +
      '%"></i></div></div>' +
      weeks
        .map(function (w, wi) {
          var weekDays = days.slice(wi * 7, wi * 7 + 7);
          return (
            '<section class="week-card"><button class="week-head" ' +
            attr("week", wi) +
            ' aria-expanded="' +
            (app.week === wi) +
            '"><span class="wk-no">' +
            String(wi + 1).padStart(2, "0") +
            '</span><div class="grow"><h3>' +
            esc(w.title) +
            "</h3><small>" +
            dateAt(wi * 7) +
            " — " +
            dateAt(wi * 7 + 6) +
            '</small></div><span class="wk-count">' +
            weekDays.filter(function (_, j) {
              return (
                State.data.days[type + "-" + (wi * 7 + j)] &&
                State.data.days[type + "-" + (wi * 7 + j)].done
              );
            }).length +
            "/7　" +
            (app.week === wi ? "−" : "+") +
            "</span></button>" +
            (app.week === wi
              ? weekDays
                  .map(function (d, j) {
                    var i = wi * 7 + j,
                      done =
                        State.data.days[type + "-" + i] &&
                        State.data.days[type + "-" + i].done;
                    return (
                      '<button class="day-row ' +
                      (done ? "done" : "") +
                      '" ' +
                      attr("day", type + "-" + i) +
                      '><span class="day-check">' +
                      (done ? "✓" : i + 1) +
                      '</span><div class="grow"><strong>' +
                      esc(d.title) +
                      "</strong><small>" +
                      esc(d.task) +
                      "</small></div>" +
                      icon("chevron") +
                      "</button>"
                    );
                  })
                  .join("")
              : "") +
            "</section>"
          );
        })
        .join("") +
      '<div class="tip">这是一条可反复练习的路线，不是必须赶完的日历。没有达到验收标准，可以停留几天再继续。</div>'
    );
  }
  var earModes = [
    ["direction", "pulse", "音高方向", "辨别升高、降低与同音"],
    ["interval", "ear", "音程辨认", "13种音程 · 三种听法"],
    ["degree", "note", "音级听辨", "先建立主音，再辨级数"],
    ["scale", "layers", "音阶与调式", "大、小调与五声等8种类型"],
    ["chord", "guitar", "和弦性质", "三和弦、七和弦与挂留"],
    ["progression", "repeat", "和声进行", "19套进行，换调再听"],
    ["melody", "piano", "短句听写", "3–6个音，听出音级序列"],
    ["theory", "book", "乐理应用自测", "概念问答与随机指板题"],
  ];
  function training() {
    var e = State.data.mistakes.filter(function (m) {
      return !m.mastered;
    }).length;
    return (
      '<div class="intro"><div class="eyebrow muted">A PRACTICE FOR EVERY PART OF YOU</div><h1>让练习，多一点变化</h1><p>每项可选难度、调性与音色。先听再答，答错再看图复听。</p></div><div class="feature-card"><span class="eyebrow muted">YOUR VOICE, IN FOCUS</span><h2>不只听得懂，也要唱得准</h2><p>单音匹配、三音／五音模唱、吉他标准调音。</p>' +
      btn("pitch", "single", icon("mic") + " 进入音准练习", "accent") +
      '</div><div class="section-head"><h2>听觉与乐理训练</h2><button class="link" ' +
      attr("review") +
      ">错题 " +
      e +
      ' 道 ↗</button></div><div class="practice-grid">' +
      earModes
        .map(function (m) {
          return (
            '<button class="practice-card" ' +
            attr("ear", m[0]) +
            ">" +
            icon(m[1]) +
            '<span class="corner">↗</span><h3>' +
            m[2] +
            "</h3><p>" +
            m[3] +
            '</p><span class="tiny-label">' +
            (State.accuracy(m[0]) === null
              ? "还没有答题记录"
              : "近题正确率 " + State.accuracy(m[0]) + "%") +
            "</span></button>"
          );
        })
        .join("") +
      '</div><div class="section-head"><h2>把节奏与指板练熟</h2></div><div class="two-grid"><button class="practice-card orange" ' +
      attr("rhythm") +
      ">" +
      icon("clock") +
      '<h3>屏幕节奏敲击</h3><p>跟拍或模仿节奏，查看时间偏差。</p></button><button class="practice-card orange" ' +
      attr("fretquiz") +
      ">" +
      icon("grid") +
      '<h3>指板找音</h3><p>在六根琴弦上找到指定音名。</p></button></div><div class="tip">跟唱只检测单音；屏幕敲击只评估点击时间。应用不把这些结果当作完整弹唱水平或真实吉他演奏评分。</div>'
    );
  }
  function lab() {
    return (
      '<div class="intro"><div class="eyebrow muted">TURN KNOWLEDGE INTO SOUND</div><h1>一间随手可用的实验室</h1><p>改一个参数，听一次变化。把理论放回吉他里。</p></div><div class="practice-grid">' +
      [
        ["fret", "grid", "指板与音阶地图", "6根弦 · 0–12品 · 任意主音"],
        ["chords", "guitar", "30种和弦图鉴", "看指法、看组成音、试听拨弦"],
        ["patterns", "clock", "20种节奏型", "扫弦、分解、3/4与6/8"],
        ["progressions", "layers", "19套和弦进行", "换调、循环、送入弹唱室"],
        ["studio", "note", "弹唱练习室", "和弦＋歌词拍点，分层循环"],
        ["changes", "repeat", "和弦转换跟练", "两和弦切换，稳定右手"],
        ["metro", "clock", "节拍器", "40–180 BPM · 拍号与细分"],
        ["piano", "piano", "随身键盘", "点音、听关系、找起唱音"],
        ["sounds", "ear", "离线示范库", "24组内置合成音频"],
      ]
        .map(function (m) {
          return (
            '<button class="practice-card" ' +
            attr("lab-open", m[0]) +
            ">" +
            icon(m[1]) +
            '<span class="corner">↗</span><h3>' +
            m[2] +
            "</h3><p>" +
            m[3] +
            "</p></button>"
          );
        })
        .join("") +
      '</div><div class="tip warm">音色均为本机合成或应用内置的合成示范，不是真实教师演奏或人声录音。自定义歌词与编配只保存在本机。</div>'
    );
  }
  function profile() {
    var data = State.data,
      accuracy = State.accuracy();
    return (
      '<div class="profile-head"><span class="avatar">' +
      icon("user") +
      '</span><div><h1>听见自己的进步</h1><p>记录真实的练习，也留下一点思考。</p></div></div><div class="stats"><div class="stat"><strong>' +
      data.completed.length +
      '</strong><span class="unit">/ 57</span><small>标记已学章节</small></div><div class="stat"><strong>' +
      (accuracy === null ? "—" : accuracy) +
      '</strong><span class="unit">' +
      (accuracy === null ? "" : "%") +
      '</span><small>近千题正确率</small></div><div class="stat"><strong>' +
      data.sessions.length +
      '</strong><span class="unit">次</span><small>保留的练习摘要</small></div></div><div class="section-head"><h2>最近练习</h2><span class="small">最多保留 200 次摘要</span></div>' +
      (data.sessions.length
        ? data.sessions
            .slice(-8)
            .reverse()
            .map(function (s) {
              return (
                '<div class="record-row"><div><strong>' +
                esc(s.label) +
                "</strong><small>" +
                new Date(s.time).toLocaleString("zh-CN", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) +
                " · " +
                Math.round(s.seconds) +
                ' 秒</small></div><span class="record-score">' +
                (s.score === null ? "已练" : Math.round(s.score) + "%") +
                "</span></div>"
              );
            })
            .join("")
        : '<div class="empty">完成一组听辨、节奏或音准练习后，会在这里看到摘要。</div>') +
      '<div class="section-head"><h2>薄弱项，值得再听一次</h2></div>' +
      weaknesses() +
      [
        "settings",
        "notes",
        "backup-export",
        "backup-import",
        "legacy",
        "privacy",
        "about",
        "reset",
      ]
        .map(function (k) {
          var labels = {
            settings: ["sliders", "练习偏好与每日时长"],
            notes: ["book", "课堂笔记"],
            "backup-export": ["download", "导出本机学习备份"],
            "backup-import": ["upload", "导入 JSON 学习备份"],
            legacy: ["repeat", "查看 1.0 旧版记录"],
            privacy: ["shield", "隐私与权限说明"],
            about: ["flag", "版本与内容来源"],
            reset: ["trash", "清除 2.0 本机记录"],
          };
          return (
            '<button class="setting-row" ' +
            attr(k) +
            '><span class="hrow">' +
            icon(labels[k][0]) +
            "<span>" +
            labels[k][1] +
            "</span></span>" +
            icon("chevron") +
            "</button>"
          );
        })
        .join("") +
      '<div class="fineprint">听见 2.0.0 · 无账户 · 无广告 · 无联网权限<br>仅在你开始音准训练时使用麦克风</div>'
    );
  }
  function weaknesses() {
    var groups = {};
    State.data.events.forEach(function (e) {
      var k = e.tag;
      if (!groups[k]) groups[k] = { n: 0, right: 0 };
      groups[k].n++;
      if (e.correct) groups[k].right++;
    });
    var a = Object.keys(groups)
      .filter(function (k) {
        return groups[k].n >= 3 && groups[k].right / groups[k].n < 0.75;
      })
      .sort(function (a, b) {
        return groups[a].right / groups[a].n - groups[b].right / groups[b].n;
      })
      .slice(0, 4);
    return a.length
      ? a
          .map(function (k) {
            var v = groups[k];
            return (
              '<div class="rank-row"><div class="hrow between"><strong>' +
              esc(k) +
              '</strong><span class="small">' +
              v.right +
              "/" +
              v.n +
              ' 题答对</span></div><div class="progress" style="margin-top:9px"><i style="width:' +
              (v.right / v.n) * 100 +
              '%"></i></div></div>'
            );
          })
          .join("")
      : '<div class="empty">某个知识点至少练过 3 题后，才会据实显示需要复习的项目。</div>';
  }
  function figure(kind) {
    if (
      [
        "triad",
        "diatonic",
        "function",
        "bass",
        "bars",
        "timeline",
        "emotion",
        "dynamics",
      ].includes(kind)
    )
      return (
        '<div class="figure-bars">' +
        [
          ["C", "Ⅰ"],
          ["G", "Ⅴ"],
          ["Am", "Ⅵm"],
          ["F", "Ⅳ"],
        ]
          .map(function (x) {
            return (
              "<div>和声示例<strong>" + x[0] + "</strong>" + x[1] + "</div>"
            );
          })
          .join("") +
        btn(
          "lab-open",
          "progressions",
          icon("layers") + " 去和弦进行实验室",
          "soft",
        )
      );
    if (["rhythm", "meter", "arpeggio", "hands"].includes(kind))
      return (
        '<div class="bar-grid">' +
        REFERENCE.rhythmData[2].labels
          .map(function (l, i) {
            return (
              '<div class="beat-cell"><span>' +
              l +
              "</span><b>" +
              { D: "↓", U: "↑", ".": "·" }[REFERENCE.rhythmData[2].slots[i]] +
              "</b></div>"
            );
          })
          .join("") +
        btn("lab-open", "patterns", icon("clock") + " 去节奏实验室验证", "soft")
      );
    if (kind === "capo")
      return '<div class="tip">按 C 形 + 变调夹 2 品 → 实际发声 D；按 G 形 + 变调夹 2 品 → 实际发声 A。</div>';
    if (["lyrics", "layers"].includes(kind))
      return (
        '<div class="figure-bars">' +
        ["只数拍", "只弹琴", "弹＋读", "弹＋唱"]
          .map(function (s, i) {
            return (
              "<div>步骤 " +
              (i + 1) +
              '<strong style="font:14px sans-serif">' +
              s +
              "</strong></div>"
            );
          })
          .join("") +
        btn("lab-open", "studio", icon("note") + " 打开弹唱练习室", "soft")
      );
    if (kind === "pitch")
      return btn("pitch", "single", icon("mic") + " 去练起唱音", "soft");
    return "";
  }
  app.modals.lesson = function (id) {
    var l = REFERENCE.lessons.filter(function (l) {
      return l.id === id;
    })[0];
    if (!l) return '<div class="empty">没有找到课程。</div>';
    return (
      title(l.group, l.title, l.summary) +
      '<article class="article-content">' +
      l.html +
      "</article>" +
      figure(l.figure) +
      (l.example
        ? '<div class="tip"><b>实际例子</b><br>' + esc(l.example) + "</div>"
        : "") +
      (l.drills.length
        ? '<div class="section-head"><h2>现在，跟着做一遍</h2></div><ol class="validation-list">' +
          l.drills
            .map(function (s) {
              return "<li>" + esc(s) + "</li>";
            })
            .join("")
        : "") +
      '<div class="tip success"><b>验收标准</b><br>' +
      esc(l.goal) +
      "</div>" +
      (l.pitfall
        ? '<div class="tip warm"><b>容易误解的地方</b><br>' +
          esc(l.pitfall) +
          "</div>"
        : "") +
      btn(
        "lesson-done",
        id,
        State.data.completed.includes(id)
          ? "✓ 已标记学过 · 点击撤销"
          : "我已阅读并完成实操",
        "wide",
      ) +
      '<p class="feedback-note">这是学习自评，不代表应用已测出你的演奏水平。</p><h2 style="font-size:16px;margin:26px 0 12px">留一句自己的理解</h2><textarea id="lesson-note" data-lesson="' +
      esc(id) +
      '" maxlength="4000" placeholder="哪里想通了？下次要练哪一步？">' +
      esc(State.data.notes[id] || "") +
      '</textarea><p class="small" style="margin-top:7px">输入后自动保存 · 本机笔记</p>'
    );
  };
  app.modals.day = function (key) {
    var type = key[0],
      i = Number(key.slice(2)),
      d = planDays(type)[i],
      v = State.recordDay(key);
    var tasks =
      type === "e"
        ? [
            "阅读相关知识，确认今天要听哪一种关系。",
            d.task,
            d.evidence,
            "复听错题，写下最容易混淆的一处。",
          ]
        : d.tasks || [
            d.task,
            "在吉他或声音中验证，不急着提高速度。",
            "按验收标准检查，再记录需要复习的地方。",
          ];
    return (
      title(
        "DAY " + String(i + 1).padStart(2, "0") + " · " + dateAt(i),
        d.title,
        d.task,
      ) +
      '<div class="card"><h3>把今天拆成小步骤</h3>' +
      tasks
        .map(function (t, j) {
          return (
            '<label class="check-row"><input type="checkbox" data-day-check="' +
            j +
            '" data-day="' +
            key +
            '" ' +
            (v.checks[j] ? "checked" : "") +
            "><span>" +
            esc(t) +
            "</span></label>"
          );
        })
        .join("") +
      '</div><div class="tip success"><b>完成证据</b><br>' +
      esc(d.evidence) +
      '</div><div class="plan-actions">' +
      (type === "g"
        ? btn("lesson", d.lesson, "读本周核心知识", "soft")
        : type === "e"
          ? btn("ear-day", i, "开始今天的听音题", "accent")
          : btn("lab-open", "studio", "打开弹唱练习室", "accent")) +
      btn("fret-open", "", "去指板验证", "outline") +
      '</div><div class="form-grid"><label class="field"><span>今天练习了几分钟（自行记录）</span><input id="day-minutes" data-day="' +
      key +
      '" type="number" min="0" max="360" value="' +
      v.minutes +
      '"></label><label class="check-row" style="align-items:center"><input type="checkbox" id="day-done" data-day="' +
      key +
      '" ' +
      (v.done ? "checked" : "") +
      '><span>我已达到本日验收标准</span></label></div><textarea id="day-note" data-day="' +
      key +
      '" maxlength="3000" placeholder="今天最值得记住的一处，或下次的具体目标。">' +
      esc(v.note) +
      '</textarea><p class="feedback-note">任务、自评和笔记会自动保存。</p>' +
      (i < planDays(type).length - 1
        ? btn(
            "day",
            type + "-" + (i + 1),
            "下一天的任务 " + icon("arrow"),
            "wide outline",
          )
        : "")
    );
  };
  app.modals.settings = function () {
    var s = State.data.settings;
    return (
      title(
        "MAKE IT YOUR OWN",
        "给自己合适的练习量",
        "这些偏好会用于新一组练习，正在进行的题目保持不变。",
      ) +
      '<div class="form-grid">' +
      field(
        "每日建议时长",
        "daily-time",
        [
          [15, "15 分钟"],
          [30, "30 分钟"],
          [45, "45 分钟"],
        ],
        State.data.daily,
      ) +
      field(
        "合成音色",
        "global-voice",
        [
          ["guitar", "合成拨弦"],
          ["piano", "合成琴音"],
          ["pure", "纯音"],
        ],
        s.voice,
      ) +
      '</div><label class="field"><span>示范音量</span><input id="global-volume" type="range" min="0" max="80" value="' +
      s.volume * 100 +
      '"></label><div class="tip">耳朵训练可以选择不同音色，但音色不应成为猜答案的线索。先慢、先少量，正确理解再加难度。</div>'
    );
  };
  app.modals.notes = function () {
    var ids = Object.keys(State.data.notes).filter(function (id) {
      return State.data.notes[id].trim();
    });
    return (
      title("YOUR OWN WORDS", "课堂笔记", "你的理解，比重复抄写更有价值。") +
      (ids.length
        ? ids
            .map(function (id) {
              var l = REFERENCE.lessons.filter(function (l) {
                return l.id === id;
              })[0];
              return (
                '<article class="note-preview"><h3>' +
                esc(l ? l.title : id) +
                "</h3><p>" +
                esc(State.data.notes[id]) +
                '</p><button class="link" ' +
                attr("lesson", id) +
                ">回到这节课 ↗</button></article>"
              );
            })
            .join("")
        : '<div class="empty">在任意知识章节末尾写下笔记，就会出现在这里。</div>')
    );
  };
  app.modals.legacy = function () {
    var d = State.data.legacy;
    return (
      title(
        "KEEP YOUR EARLIER STEPS",
        "1.0 旧版学习记录",
        "旧版数据原样留在本机，以下内容从旧版学习存储中读取。",
      ) +
      (d
        ? '<div class="tip">旧版完成 ' +
          d.completed.length +
          " 节课程；音准摘要 " +
          d.pitchCount +
          " 条、听辨摘要 " +
          d.earCount +
          " 条。新版任务与课程另外记录，不将旧版数字算作新版学习成果。</div>" +
          Object.keys(d.notes)
            .filter(function (k) {
              return d.notes[k];
            })
            .map(function (k) {
              return (
                '<div class="note-preview"><h3>旧版第 ' +
                (+k + 1) +
                " 课笔记</h3><p>" +
                esc(d.notes[k]) +
                "</p></div>"
              );
            })
            .join("")
        : '<div class="empty">这台设备没有找到 1.0 的学习数据。使用相同签名直接更新时，旧版存储才会保留；卸载后无法自动恢复。</div>')
    );
  };
  app.modals.about = function () {
    return (
      title(
        "REBUILT AROUND YOUR REFERENCES",
        "听见 2.0 · 吉他与听觉练习室",
        "这一版围绕你提供的三个学习网页重写。",
      ) +
      '<div class="legal"><h2>整合的学习内容</h2><p>57 章知识内容、84 天吉他乐理任务、42 天听音专项任务、14 天弹唱路线、30 种和弦指法、20 种节奏型、19 套和弦进行及 25 道基础乐理自测。指板题、听觉题按配置随机生成。</p><h2>训练怎样计分</h2><p>听辨先播放再作答；查看答案按错题记录。错题在复练中连续答对两次后标为已掌握。统计仅基于本机实际作答，最多保留 1000 条题目结果、200 条错题与200次练习摘要。</p><h2>声音和判断的边界</h2><p>所有声音为离线合成或内置合成 WAV，不是真实演奏、人声或商业歌曲。单音音高不等于整曲评分；屏幕点击时间不等于真实扫弦水平；和弦转换与弹唱跟练只记录练习过程和自评，不对未经检测的演奏给分。</p><h2>记录与备份</h2><p>课程笔记和计划进度自动保存在本机。前台最近一分钟有操作时，以5秒为间隔近似累计应用内时长。可通过系统文件选择器导出/导入 JSON 备份，不需要文件存储权限。卸载或系统清除应用存储后，本机数据会丢失。</p><h2>兼容与使用</h2><p>最低 Android 8.0，建议更新系统 WebView。麦克风需要用户主动授权；其他训练和资料不需要麦克风。学习计划开始日由你自己设置。</p><h2>参考来源</h2><p>《Guitar Theory 12 Week Interactive》《音阶辨别能力》《吉他弹唱知识百科·图解课程·节奏和弦实验室》。只采用参考中的知识与练习数据，不执行上传网页里的脚本，也不加载外部链接。</p></div>'
    );
  };
  app.modals.privacy = function () {
    return (
      title(
        "PRIVATE BY DESIGN",
        "让你的声音，留在你身边",
        "无联网权限 · 本地分析 · 录音不落盘",
      ) +
      '<div class="legal"><h2>麦克风</h2><p>只有点击“开始训练/开始调音”才请求 RECORD_AUDIO。原始声音只在内存中实时估计单音音高，不保存录音，也不上传。结束、返回、切换页面或进入后台立即停止。单次最长60秒，返回应用需再次开始。</p><h2>使用系统文件选择器</h2><p>备份导出与导入由你主动启动，应用只读写你选择的文件 URI。不扫描手机文件，不申请相册、联系人、位置、联网或通用存储权限。导入前会显示备份摘要，确认后才替换2.0记录。</p><h2>本机数据</h2><p>保存计划、笔记、作答与训练数字摘要，自定义歌词和编配也仅保存在本机。系统自动备份关闭。JSON备份包含这些文字记录，存放位置由你选择。应用没有广告、账号、分析或遥测SDK。</p><h2>安全措施</h2><p>只加载安装包本地资源，禁止外部导航、网络与网页文件访问。参考内容使用白名单清理，用户笔记始终作为文字呈现，备份有格式和大小校验。源码可审阅，但本版本未经独立安全审计，不能承诺绝对安全或所有设备精度。</p></div>'
    );
  };
  app.modals.reset = function () {
    return (
      title(
        "START OVER, IF YOU WANT",
        "清除 2.0 本机学习记录？",
        "会删除新版任务、课程笔记、自定义编配、错题和练习摘要。这个操作不能撤销，建议先导出备份。",
      ) +
      btn("backup-export", "", icon("download") + " 先导出备份", "soft wide") +
      btn("reset-confirm", "", "确认清除 2.0 记录", "red wide") +
      '<p class="small" style="margin-top:15px">1.0 独立存储不会被本操作清除。</p>'
    );
  };
  app.modals.backup = function () {
    var d = app.pendingImport;
    return (
      title(
        "CHECK BEFORE RESTORING",
        "导入这份学习备份？",
        "确认后将替换当前的 2.0 学习记录。",
      ) +
      '<div class="card"><p>已学章节：' +
      d.completed.length +
      "</p><p>计划记录：" +
      Object.keys(d.days).length +
      "</p><p>作答记录：" +
      d.events.length +
      "</p><p>错题：" +
      d.mistakes.length +
      "</p><p>练习摘要：" +
      d.sessions.length +
      '</p></div><div class="tip warm">如果希望保留当前记录，请返回后先导出一份备份。</div>' +
      btn("import-confirm", "", "确认替换记录", "wide") +
      btn("back", "", "取消导入", "outline wide")
    );
  };
  function importText(s) {
    try {
      app.pendingImport = State.parseBackup(s);
      open("backup");
    } catch (e) {
      toast("导入失败：" + e.message);
    }
  }
  function exportBackup() {
    var s = State.backup();
    if (window.Sonora && Sonora.exportData) {
      Sonora.exportData(s);
    } else {
      var blob = new Blob([s], { type: "application/json" }),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "sonora-backup-" + State.today() + ".json";
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 2000);
    }
  }
  app.actions.nav = function (id) {
    navigate(id);
  };
  app.actions.back = back;
  app.actions.lesson = function (id) {
    open("lesson", id);
  };
  app.actions.day = function (id) {
    open("day", id);
  };
  app.actions["learn-tab"] = function (id) {
    app.learning = id;
    app.week = Math.floor(nextDay(id === "courses" ? "g" : id) / 7);
    render();
  };
  app.actions.learning = function (id) {
    app.learning = id;
    app.week = Math.floor(nextDay(id) / 7);
    navigate("learn");
  };
  app.actions.week = function (id) {
    app.week = app.week === +id ? -1 : +id;
    render();
  };
  app.actions["course-group"] = function (id) {
    app.group = id;
    render();
  };
  app.actions["lesson-done"] = function (id) {
    var i = State.data.completed.indexOf(id);
    if (i < 0) State.data.completed.push(id);
    else State.data.completed.splice(i, 1);
    State.save();
    renderModal();
    toast(i < 0 ? "已标记这节课学过。" : "已撤销标记。");
  };
  ["settings", "notes", "legacy", "privacy", "about", "reset"].forEach(
    function (k) {
      app.actions[k] = function () {
        open(k);
      };
    },
  );
  app.actions["reset-confirm"] = function () {
    localStorage.removeItem("sonora-v2");
    var legacy = State.data.legacy;
    var d = State.clean({ schema: 2, legacy: legacy });
    State.replace(d);
    app.history = [];
    back();
    toast("2.0 学习记录已清除。");
  };
  app.actions["backup-export"] = exportBackup;
  app.actions["backup-import"] = function () {
    if (window.Sonora && Sonora.importData) Sonora.importData();
    else $("#backup-file").click();
  };
  app.actions["import-confirm"] = function () {
    if (!app.pendingImport) return;
    State.replace(app.pendingImport);
    app.pendingImport = null;
    app.history = [];
    back();
    toast("备份已导入。");
  };
  app.actions["lab-open"] = function (id) {
    open(id);
  };
  app.actions["fret-open"] = function () {
    open("fret");
  };
  app.changes["start-date"] = function (e) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) {
      var candidate = Object.assign({}, State.data, { start: e.target.value });
      State.replace(candidate);
      render();
    }
  };
  app.changes["daily-time"] = function (e) {
    State.data.daily = +e.target.value;
    State.save();
  };
  app.changes["global-voice"] = function (e) {
    State.data.settings.voice = e.target.value;
    State.save();
    Sound.configure(State.data.settings);
  };
  app.inputs["global-volume"] = function (e) {
    State.data.settings.volume = +e.target.value / 100;
    State.save();
    Sound.configure(State.data.settings);
  };
  app.inputs["course-search"] = function (e) {
    app.search = e.target.value;
    $("#course-list").innerHTML = courseList();
  };
  app.inputs["lesson-note"] = function (e) {
    State.data.notes[e.target.dataset.lesson] = e.target.value;
    State.save();
  };
  app.inputs["day-minutes"] = function (e) {
    State.recordDay(e.target.dataset.day).minutes = Math.max(
      0,
      Math.min(360, +e.target.value || 0),
    );
    State.save();
  };
  app.inputs["day-note"] = function (e) {
    State.recordDay(e.target.dataset.day).note = e.target.value;
    State.save();
  };
  app.changes["day-done"] = function (e) {
    State.recordDay(e.target.dataset.day).done = e.target.checked;
    State.save();
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (b && !b.disabled && app.actions[b.dataset.act]) {
      lastActivity = Date.now();
      app.actions[b.dataset.act](b.dataset.id, b, e);
    }
  });
  document.addEventListener("input", function (e) {
    lastActivity = Date.now();
    if (app.inputs[e.target.id]) app.inputs[e.target.id](e);
  });
  document.addEventListener("change", function (e) {
    if (app.changes[e.target.id]) app.changes[e.target.id](e);
    if (e.target.dataset.dayCheck !== undefined) {
      State.recordDay(e.target.dataset.day).checks[+e.target.dataset.dayCheck] =
        e.target.checked;
      State.save();
    }
  });
  document.addEventListener(
    "pointerdown",
    function () {
      lastActivity = Date.now();
    },
    { passive: true },
  );
  setInterval(function () {
    if (!document.hidden && Date.now() - lastActivity < 60000) {
      State.data.seconds += 5;
      State.save();
    }
  }, 5000);
  $("#backup-file").addEventListener("change", function (e) {
    var f = e.target.files[0];
    if (!f) return;
    if (f.size > 4194304) {
      toast("备份超过4 MiB，无法导入。");
      return;
    }
    var r = new FileReader();
    r.onload = function () {
      importText(String(r.result));
    };
    r.readAsText(f, "UTF-8");
    e.target.value = "";
  });
  window.nativeBackup = function (s) {
    importText(s);
  };
  window.nativeNotice = function (s) {
    toast(s);
  };
  window.appBack = back;
  window.appPause = function () {
    stop();
  };
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (window.Mic && Mic.pending) {
        Sound.stop();
      } else stop();
    }
  });
  Object.assign(app, {
    $: $,
    $$: $$,
    esc: esc,
    icon: icon,
    attr: attr,
    btn: btn,
    title: title,
    options: options,
    field: field,
    toast: toast,
    open: open,
    back: back,
    navigate: navigate,
    render: render,
    stop: stop,
    planDays: planDays,
    nextDay: nextDay,
    importText: importText,
  });
  return app;
})();
