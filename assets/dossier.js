/* 모든 세계관이 공유하는 기록장 렌더러. 데이터 형식: templates/game-state.schema.json */
(() => {
  "use strict";
  const root = document.body.dataset.root || "../../../";
  const byId = id => document.getElementById(id);
  const sections = [
    ["current", "현재 상황"], ["player", "플레이어"], ["people", "등장인물"],
    ["history", "사건 연대기"], ["tasks", "진행 중인 업무"],
    ["world-state", "세계 상태"], ["relationships", "관계도"],
    ["places", "장소·조직"], ["secrets", "미공개 정보"], ["references", "설정·규칙"]
  ];
  let state, history, detailDialog, focusReturn;
  const text = v => v === null || v === undefined || v === "" ? "미정" : String(v);
  const array = v => Array.isArray(v) ? v : [];
  const el = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = text(content);
    return node;
  };
  const add = (parent, ...children) => { children.filter(Boolean).forEach(x => parent.append(x)); return parent; };
  const empty = message => el("p", "record-empty", message || "아직 기록된 내용이 없습니다.");
  const field = (name, value) => add(el("div", "record-field"), el("span", "record-label", name), el("div", "record-value", value));
  const note = (label, value) => add(el("div", "record-note"), el("strong", null, label), el("p", null, text(value)));
  const section = (id, subtitle) => {
    const s = el("section", "record-section"); s.id = id;
    add(s, el("h2", null, sections.find(x => x[0] === id)[1]));
    if (subtitle) add(s, el("p", "section-intro", subtitle));
    return s;
  };
  const referenceName = id => {
    if (id === "player") return state.player.fullName;
    const p = array(state.people).find(x => x.id === id);
    return p ? p.name : "미정 (" + id + ")";
  };
  const personLink = (id, label) => {
    if (id === "player") return el("span", "inline-reference", label || referenceName(id));
    const button = el("button", "inline-reference", label || referenceName(id));
    button.type = "button";
    button.addEventListener("click", () => openPerson(id));
    return button;
  };
  const linkTask = id => {
    const task = array(state.tasks).find(x => x.id === id);
    if (!task) return el("span", null, "미정");
    const a = el("a", "inline-reference", task.title);
    a.href = "#task-" + task.id;
    a.addEventListener("click", () => { if (detailDialog.open) detailDialog.close(); });
    return a;
  };
  const chips = (items, render) => {
    const box = el("div", "reference-chips");
    array(items).forEach(item => box.append(render(item)));
    return box.childNodes.length ? box : empty();
  };
  const listText = (items, key) => {
    const ul = el("ul", "record-bullets");
    array(items).forEach(item => ul.append(el("li", null, key ? item[key] : item)));
    return ul.children.length ? ul : empty();
  };
  const about = (title, contents) => {
    const block = el("div", "detail-group");
    block.append(el("h3", null, title));
    block.append(contents);
    return block;
  };
  const currentActivity = p => {
    const a = p.currentActivity || {};
    const group = el("div", "detail-stack");
    add(group, note("현재 활동", a.description || "확인되지 않음"));
    const facts = el("div", "mini-facts");
    add(facts, field("마지막 확인", a.confirmedAt || p.lastSeenAt || "기록 없음"),
               field("마지막 확인 장소", a.place || "확인되지 않음"),
               field("정보 기준", a.certainty || "미확정"));
    group.append(facts);
    return group;
  };
  const relationshipCard = rel => {
    const c = el("article", "relationship-card");
    const title = el("div", "relationship-title");
    add(title, personLink(rel.fromId), el("span", "rel-arrow", "→"), personLink(rel.toId));
    c.append(title);
    c.append(el("p", "rel-kind", rel.kind || "관계 성격 미확정"));
    const grid = el("div", "relationship-facts");
    add(grid, field("기존 관계", rel.baseline || "미확정"),
              field("현재 관계", rel.current || "미확정"),
              field("겉으로 보이는 태도", rel.outward || "확인되지 않음"),
              field("마지막 변화", rel.lastChangedAt || "변화 기록 없음"));
    c.append(grid);
    if (rel.evidence) c.append(el("p", "evidence", "기록 근거: " + rel.evidence));
    const changes = array(rel.changes);
    if (changes.length) {
      const box = el("div", "relationship-changes");
      box.append(el("h4", null, "관계 변화 이력"));
      changes.forEach(change => {
        const item = el("div", "change-entry");
        add(item, el("span", "record-label", change.at || "시점 미정"),
          el("strong", null, (change.before || "미확정") + " → " + (change.after || "미확정")),
          el("p", null, change.reason || "원인 미정"));
        box.append(item);
      });
      c.append(box);
    }
    return c;
  };
  const detailedPerson = p => {
    const sheet = el("div", "person-sheet");
    const header = el("header", "person-sheet-header");
    const first = el("div");
    add(first, el("span", "record-eyebrow", "PERSON FILE / " + p.id),
        el("h2", null, p.name), el("p", null, p.role || "역할 미정"));
    const close = el("button", "dialog-close", "닫기 ×");
    close.type = "button";
    close.addEventListener("click", () => detailDialog.close());
    add(header, first, close); sheet.append(header);
    const body = el("div", "person-sheet-body");
    const facts = el("div", "record-fields");
    [
      ["이름", p.name], ["나이", p.age == null ? "미정" : p.age + "세"],
      ["역할·직책", p.role], ["소속", p.affiliation], ["직업", p.occupation],
      ["최근 확인", p.lastSeenAt]
    ].forEach(([k,v]) => facts.append(field(k,v)));
    body.append(about("기본 정보", facts));
    body.append(about("인물 설명", el("p", "detail-prose", p.description || p.note || "추가 설명 없음")));
    const traits = el("div", "detail-stack");
    add(traits, note("외모·복장", p.appearance || "미정"), note("성격·태도", p.personality || "미정"),
      note("배경·이력", p.background || "미정"));
    body.append(about("외모·성격·배경", traits));
    body.append(about("현재 활동 · 마지막 확인", currentActivity(p)));
    const work = el("div", "detail-stack");
    const workList = chips(p.taskIds, linkTask);
    work.append(el("div", "record-label", "지속되는 업무·활동")); work.append(workList);
    work.append(el("div", "record-label", "목표와 관심사")); work.append(listText(p.goals));
    body.append(about("진행 업무와 목표", work));
    const rels = array(state.relationships).filter(r => r.fromId === p.id || r.toId === p.id);
    const relWrap = el("div", "detail-stack");
    if (!rels.length) relWrap.append(empty("이 인물의 관계는 아직 등록되지 않았습니다."));
    else rels.forEach(r => relWrap.append(relationshipCard(r)));
    relWrap.append(el("p", "data-caveat", "관계의 화살표는 감정과 태도를 가진 쪽을 뜻합니다. 반대 방향의 감정은 별도 기록이 없으면 미확정입니다."));
    body.append(about("관계 · 변화 이력", relWrap));
    const know = el("div", "detail-stack");
    const known = array(p.knowledge);
    if (known.length) {
      known.forEach(k => {
        const item = el("article", "knowledge-card");
        add(item, el("strong", null, k.topic || "제목 미정"),
          el("span", "knowledge-type", k.type || "인지 상태 미정"),
          el("p", null, k.detail || "내용 없음"),
          el("small", null, "인지 시점: " + (k.learnedAt || "미정")));
        know.append(item);
      });
    } else know.append(empty("확정적으로 기록된 인지 정보가 없습니다."));
    body.append(about("알고 있는 사실 · 믿음 · 오해", know));
    const events = array(history.events).filter(e => array(e.personIds).includes(p.id));
    const eventBox = el("div", "detail-stack");
    if (!events.length) eventBox.append(empty("연결된 사건이 없습니다."));
    events.forEach(e => add(eventBox, note(e.when + " · " + e.title, e.detail)));
    body.append(about("관련 사건", eventBox));
    const secrets = el("details", "secret-details");
    add(secrets, el("summary", null, "미공개 정보 · 열어보기 (스포일러 가능)"));
    const secretBody = el("div", "secret-body");
    secretBody.append(listText(p.secrets));
    secrets.append(secretBody);
    body.append(about("미공개 정보", secrets));
    sheet.append(body);
    return sheet;
  };
  function openPerson(id) {
    const p = array(state.people).find(x => x.id === id);
    if (!p) return;
    focusReturn = document.activeElement;
    detailDialog.replaceChildren(detailedPerson(p));
    if (!detailDialog.open) detailDialog.showModal();
    detailDialog.scrollTop = 0;
    const close = detailDialog.querySelector(".dialog-close");
    if (close) close.focus();
  }
  function renderNav() {
    const nav = byId("dossier-nav");
    nav.replaceChildren();
    sections.forEach(([id,label]) => {
      const a = el("a", null, label);
      a.href = "#" + id;
      nav.append(a);
    });
  }
  function render() {
    document.body.dataset.theme = state.game.theme || "neutral";
    byId("game-title").textContent = state.game.title;
    document.title = state.game.title + " | Text Game Records";
    byId("game-byline").textContent = [state.player.fullName, state.player.rank, state.player.position].filter(Boolean).join(" · ");
    byId("game-code").textContent = state.game.id.toUpperCase();
    byId("game-clock").textContent = state.clock.dateLabel + " · " + state.clock.time;
    byId("game-place").textContent = state.scene.place;
    byId("updated-note").textContent = "기록 기준 · " + state.clock.dateLabel + " " + state.clock.time;
    renderNav();
    detailDialog = byId("person-dialog");
    detailDialog.addEventListener("click", e => { if (e.target === detailDialog) detailDialog.close(); });
    detailDialog.addEventListener("close", () => { if (focusReturn && focusReturn.isConnected) focusReturn.focus(); });
    const mount = byId("dossier-content"); mount.replaceChildren();
    let s = section("current", "마지막으로 확정된 장면 · 실제 게임 속 시간 기준");
    const scene = el("div", "scene-brief");
    add(scene, el("span", "record-eyebrow", "CURRENT SCENE"),
      el("h3", null, state.scene.title), el("p", null, state.scene.summary));
    s.append(scene); mount.append(s);
    s = section("player", "게임별로 확정된 주인공 설정");
    const facts = el("div", "record-fields");
    [["성명",state.player.fullName],["나이",state.player.age==null?"미정":state.player.age+"세"],
      ["계급·신분",state.player.rank],["직책",state.player.position],
      ["외모·복장",state.player.appearance],["성격·역량",state.player.personality],
      ["출신",state.player.background],["플레이 원칙",state.player.playRule]].forEach(([k,v])=>facts.append(field(k,v)));
    s.append(facts); mount.append(s);
    s = section("people", "인물 카드를 누르면 상세 정보와 관계·업무·사건을 확인할 수 있습니다.");
    const personSearch = el("input", "people-search");
    personSearch.type = "search"; personSearch.placeholder = "인물 이름·역할 검색"; personSearch.setAttribute("aria-label","등장인물 검색");
    const tiles = el("div", "person-tiles");
    const drawPeople = () => {
      tiles.replaceChildren();
      const q=personSearch.value.trim().toLocaleLowerCase("ko-KR");
      const results=array(state.people).filter(p=>[p.name,p.role,p.description].join(" ").toLocaleLowerCase("ko-KR").includes(q));
      if (!results.length) tiles.append(empty("검색된 인물이 없습니다."));
      results.forEach(p => {
        const b=el("button","person-tile");
        b.type="button";
        add(b,el("span","record-eyebrow",p.id.toUpperCase()),
          el("strong",null,p.name),el("small",null,p.role||"역할 미정"),
          el("p",null,p.description||p.note||"기록 없음"),
          el("span","tile-open","상세 기록 보기 →"));
        b.addEventListener("click",()=>openPerson(p.id));
        tiles.append(b);
      });
    };
    personSearch.addEventListener("input",drawPeople); drawPeople();
    add(s,personSearch,tiles);mount.append(s);
    s = section("history","게임 속에서 확정된 주요 사건 · 인물·업무 연결");
    const timeline=el("div","timeline");
    array(history.events).forEach(evt => {
      const entry=el("article","record-entry");
      const body=el("div");
      add(body,el("h3",null,evt.title),el("p",null,evt.detail));
      if (array(evt.personIds).length) {
        const links=el("div","reference-chips");
        evt.personIds.forEach(id=>links.append(personLink(id)));
        body.append(links);
      }
      add(entry,el("time",null,evt.when),body);timeline.append(entry);
    });
    s.append(timeline.children.length?timeline:empty());mount.append(s);
    s=section("tasks","현재 진행 중인 지시·조사·장기 업무");
    const taskStack=el("div","record-stack");
    array(state.tasks).forEach(t => {
      const card=el("article","task-card");card.id="task-"+t.id;
      const head=el("div","task-heading");
      add(head,el("h3",null,t.title),el("span","task-status",t.status||"미정")); card.append(head);
      card.append(el("p",null,t.summary||"미정"));
      const taskFacts=el("div","task-mini");
      add(taskFacts,field("마지막 확인",t.lastKnown),field("다음 단계",t.nextStep));
      card.append(taskFacts);
      const owners=el("div","reference-chips");
      array(t.ownerIds).forEach(id=>owners.append(personLink(id)));
      if (owners.childNodes.length) {card.append(el("div","record-label","담당 인물"));card.append(owners);}
      if (!owners.childNodes.length && t.owner) card.append(el("p","evidence","담당: "+t.owner));
      taskStack.append(card);
    });
    s.append(taskStack.children.length?taskStack:empty());mount.append(s);
    s=section("world-state","주인공이 보지 않는 곳에서도 게임 속 시간에 맞춰 움직이는 일");
    const world=state.worldState||{};const processes=el("div","record-stack");
    array(world.processes).forEach(p=>{
      const c=el("article","task-card");
      add(c,el("h3",null,p.title),el("p",null,p.summary),
        field("현재 단계",p.status),field("마지막 확인",p.lastUpdated),
        field("진행 조건·제약",p.constraints||"미정"));processes.append(c);
    });
    s.append(processes.children.length?processes:empty());
    if (array(world.notes).length) {s.append(el("h3","subheading","운영 메모"));s.append(listText(world.notes));}
    mount.append(s);
    s=section("relationships","서로의 감정은 별개로 기록하며, 변화 원인과 시점을 보존합니다.");
    const relBox=el("div","record-stack");
    array(state.relationships).forEach(r=>relBox.append(relationshipCard(r)));
    s.append(relBox.children.length?relBox:empty());mount.append(s);
    s=section("places","중요한 장소와 조직의 현재 정보");
    for (const [title,items] of [["장소",state.places],["조직",state.organizations]]) {
      s.append(el("h3","subheading",title));
      const g=el("div","record-grid");
      array(items).forEach(p=>{
        const c=el("article","record-card");
        add(c,el("span","record-eyebrow",p.id||"RECORD"),el("h4",null,p.name),el("p",null,p.description||"기록 없음"));
        if (p.lastKnown) c.append(el("small",null,"확인: "+p.lastKnown));
        g.append(c);
      });
      s.append(g.children.length?g:empty());
    }
    mount.append(s);
    s=section("secrets","스포일러가 포함될 수 있습니다. 일부 내용은 확정 전까지 기록하지 않습니다.");
    const disclose=el("details","secret-details");
    const secretBody=el("div","secret-body");
    add(disclose,el("summary",null,"미공개 세계 정보 펼치기"));
    secretBody.append(listText(state.secrets));disclose.append(secretBody);s.append(disclose);mount.append(s);
    s=section("references","공통 규칙과 세계관 자료");
    const refs=el("div","record-grid");
    const worldId=state.game.worldId;
    [
      ["세계관 설정",root+"worlds/"+encodeURIComponent(worldId)+"/world.md"],
      ["범용 게임 규칙",root+"rules/game-rules.md"],
      ["기록장 운영 규칙",root+"rules/record-system.md"],
      ["전체 기록관",root+"index.html"]
    ].forEach(([title,url])=>{
      const a=el("a","reference-card",title+" ↗");a.href=url;refs.append(a);
    });
    s.append(refs);mount.append(s);
    if (window.location.hash.startsWith("#person-")) openPerson(window.location.hash.replace("#person-",""));
  }
  async function start(){
    try{
      const [s,h]=await Promise.all(["state.json","history.json"].map(name=>fetch("./"+name,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error(name+" 파일 오류");return r.json();})));
      if(s.schemaVersion!=="2.0"||h.schemaVersion!=="2.0")throw Error("기록 형식 버전이 맞지 않습니다.");
      state=s;history=h;render();
    }catch(e){byId("dossier-content").replaceChildren(el("div","record-empty","기록을 불러오지 못했습니다: "+e.message));}
  }
  start();
})();
