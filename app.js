(function() {
  "use strict";
  var app = document.getElementById("app"),
    DATA, INDEX = [],
    lastQuery = "";

  try { DATA = CONTENT }
  catch (e) { app.innerHTML = '<p class="note">فيه خطأ في بيانات الموقع (راجع الفواصل والأقواس وعلامات ` ).</p>'; return }

  function norm(s) { return String(s || "").toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ").trim() }

  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e }

  function linkBtn(href, title, sub) {
    var a = el("a", "btn");
    a.href = href;
    var t = el("span");
    t.appendChild(document.createTextNode(title));
    if (sub) t.appendChild(el("span", "sub", sub));
    a.appendChild(t);
    a.appendChild(el("span", "arrow", "←"));
    return a
  }

  function backBtn(href, label) {
    var a = el("a", "back", "→ " + label);
    a.href = href;
    return a
  }

  function clear() {
    app.innerHTML = "";
    window.scrollTo(0, 0)
  }

  function buildIndex() {
    (DATA.chapters || []).forEach(function(ch, ci) {
      INDEX.push({ kind: "فصل", title: ch.title, sub: "", text: norm(ch.title), href: "#/c/" + ci });
      (ch.sections || []).forEach(function(sec, si) {
        (sec.lessons || []).forEach(function(ls, li) {
          var base = "#/l/" + ci + "/" + si + "/" + li;
          INDEX.push({ kind: "درس", title: ls.title, sub: ch.title + " ‹ " + sec.title, text: norm(ls.title), href: base });
          (ls.questions || []).forEach(function(q, qi) {
            INDEX.push({ kind: "سؤال", title: q.question, sub: ls.title, text: norm(q.question + " " + q.answer), href: base + "/" + qi });
          });
        });
      });
    });
  }

  function renderHome() {
    clear();
    app.appendChild(el("h1", null, DATA.siteTitle || "إجابات المنصة التعليمية"));
    app.appendChild(el("p", "lead", DATA.subtitle || ""));
    var input = el("input", "search");
    input.type = "search";
    input.placeholder = "ابحث عن فصل أو درس أو سؤال";
    input.setAttribute("aria-label", "بحث");
    input.value = lastQuery;
    app.appendChild(input);
    var out = el("div", "list");
    app.appendChild(out);

    function draw() {
      lastQuery = input.value;
      out.innerHTML = "";
      var q = norm(input.value);
      if (!q) {
        (DATA.chapters || []).forEach(function(ch, ci) { out.appendChild(linkBtn("#/c/" + ci, ch.title)) });
        if (!(DATA.chapters || []).length) out.appendChild(el("p", "note", "الإجابات لسه مش متاحة"));
        return;
      }
      var words = q.split(" ");
      var hits = INDEX.filter(function(it) { return words.every(function(w) { return it.text.indexOf(w) !== -1 }) });
      if (!hits.length) { out.appendChild(el("p", "note", "مفيش نتائج، جرّب كلمة تانية")); return }
      hits.slice(0, 60).forEach(function(it) {
        var t = it.title.length > 140 ? it.title.slice(0, 140) + "…" : it.title;
        out.appendChild(linkBtn(it.href, t, it.kind + (it.sub ? " • " + it.sub : "")));
      });
    }
    input.addEventListener("input", draw);
    draw();
  }

  function renderChapter(ci) {
    var ch = (DATA.chapters || [])[ci];
    if (!ch) return renderHome();
    clear();
    app.appendChild(backBtn("#/", "رجوع"));
    app.appendChild(el("h1", null, ch.title));
    var secs = ch.sections || [];
    if (!secs.length) { app.appendChild(el("p", "note", "الإجابات لسه مش متاحة")); return }
    secs.forEach(function(sec, si) {
      app.appendChild(el("h2", null, sec.title));
      var list = el("div", "list");
      (sec.lessons || []).forEach(function(ls, li) { list.appendChild(linkBtn("#/l/" + ci + "/" + si + "/" + li, ls.title)) });
      if (!(sec.lessons || []).length) list.appendChild(el("p", "note", "الإجابات لسه مش متاحة"));
      app.appendChild(list);
    });
  }

  function addImage(p, src, alt) {
    if (!src) return;
    var i = document.createElement("img");
    i.src = src;
    i.alt = alt;
    i.loading = "lazy";
    p.appendChild(i)
  }

  function renderLesson(ci, si, li, target) {
    var ch = (DATA.chapters || [])[ci],
      sec = ch && (ch.sections || [])[si],
      ls = sec && (sec.lessons || [])[li];
    if (!ls) return renderHome();
    clear();
    app.appendChild(backBtn("#/c/" + ci, "رجوع إلى " + ch.title));
    app.appendChild(el("p", "crumb", sec.title));
    app.appendChild(el("h1", null, ls.title));
    var qs = ls.questions || [];
    if (!qs.length) { app.appendChild(el("p", "note", "الإجابات لسه مش متاحة")); return }
    var targetEl = null;
    qs.forEach(function(item, i) {
      var card = el("section", "qcard");
      card.id = "q" + i;
      var q = el("div", "q");
      q.appendChild(el("span", "label", "السؤال " + (i + 1)));
      q.appendChild(el("p", "text", item.question));
      addImage(q, item.questionImage, "صورة السؤال " + (i + 1));
      var a = el("div", "a");
      a.appendChild(el("span", "label", "الإجابة:"));
      a.appendChild(el("p", "text", item.answer));
      addImage(a, item.answerImage, "صورة الإجابة " + (i + 1));
      card.appendChild(q);
      card.appendChild(a);
      app.appendChild(card);
      if (target !== undefined && target === i) {
        card.className += " target";
        targetEl = card
      }
    });
    if (targetEl) targetEl.scrollIntoView({ block: "start" });
  }

  function route() {
    var p = (location.hash || "#/").replace(/^#\/?/, "").split("/");
    var n = function(v) { var x = parseInt(v, 10); return isNaN(x) ? -1 : x };
    if (p[0] === "c") return renderChapter(n(p[1]));
    if (p[0] === "l") return renderLesson(n(p[1]), n(p[2]), n(p[3]), p[4] !== undefined ? n(p[4]) : undefined);
    renderHome();
  }

  if (DATA.siteTitle) {
    document.getElementById("site-title").textContent = DATA.siteTitle;
    document.title = DATA.siteTitle
  }
  buildIndex();
  window.addEventListener("hashchange", route);
  route();
})();
