/* 규칙서 원문 Markdown을 외부 라이브러리 없이 안전한 DOM으로 표시 */
(() => {
"use strict";
const titles={"complete-rulebook":"완전 통합 규칙서","game-rules":"범용 게임 마스터 규칙서","npc-interaction":"NPC 대사·행동 세부 규칙","record-system":"기록장·세계 상태 규칙"};
const requested=new URLSearchParams(location.search).get("doc")||"game-rules";
const doc=Object.prototype.hasOwnProperty.call(titles,requested)?requested:"game-rules";
const article=document.getElementById("reader-content"),toc=document.getElementById("reader-toc");
document.getElementById("reader-title").textContent=titles[doc];
document.title=titles[doc]+" | Text Game Records";
document.querySelectorAll("[data-doc]").forEach(a=>{if(a.dataset.doc===doc)a.classList.add("current")});
const el=(name,value)=>{const n=document.createElement(name);if(value!==undefined)n.textContent=value;return n};
function resolvedUrl(path){
  if(/^https?:\/\//i.test(path))return path;
  const local=path.match(/^\.\/(complete-rulebook|game-rules|npc-interaction|record-system)\.md(?:#(.*))?$/);
  if(local)return "./reader.html?doc="+local[1]+(local[2]?"#"+local[2]:"");
  if(path.startsWith("../worlds/")&&path.endsWith(".md"))return "https://github.com/tutle0123/text-game-records/blob/main/"+path.slice(3);
  if(/^(\.\/|\.\.\/|#)[^\s]*$/.test(path))return path;
  return "#";
}
function inline(parent,input){
  const pattern=/(\*\*[^*]+\*\*|\x60[^\x60]+\x60|\[[^\]]+\]\([^)]+\))/g;
  let at=0,found;
  while((found=pattern.exec(input))!==null){
    if(found.index>at)parent.append(document.createTextNode(input.slice(at,found.index)));
    const token=found[0];
    if(token.startsWith("**"))parent.append(el("strong",token.slice(2,-2)));
    else if(token.charCodeAt(0)===96)parent.append(el("code",token.slice(1,-1)));
    else {
      const k=token.indexOf("]("),a=el("a",token.slice(1,k));
      a.href=resolvedUrl(token.slice(k+2,-1));
      if(a.href.startsWith("http")){a.target="_blank";a.rel="noopener noreferrer";}
      parent.append(a);
    }
    at=found.index+token.length;
  }
  if(at<input.length)parent.append(document.createTextNode(input.slice(at)));
}
// 장·편으로 묶인 접이식 목차: 통합본에서는 "제N편/부록"만 대분류로 사용
let currentGroup=null;
const headingLinks=[];
function group(label){
  const details=el("details");
  details.className="toc-chapter";
  const summary=el("summary",label);
  const items=el("div"); items.className="toc-chapter-items";
  details.append(summary,items);
  toc.append(details);
  currentGroup={details,items};
  if(toc.children.length===1)details.open=true;
}
function appendToc(label,id,level){
  if(!currentGroup)group("시작 안내");
  const a=el("a",label);
  a.href="#"+id;
  a.className="toc-item level-"+level;
  currentGroup.items.append(a);
  headingLinks.push({id,a,group:currentGroup.details});
}
function heading(level,label,index){
  const h=el("h"+level);inline(h,label);h.id="rule-"+index;article.append(h);
  const isFull=doc==="complete-rulebook";
  if(level===1){
    const isPart=label.startsWith("부록") || /^제[0-9]+편/.test(label);
    if(!isFull || isPart){group(label);appendToc("편 시작",h.id,1);}
    else if(!currentGroup){group("시작 안내");appendToc("규칙서 첫머리",h.id,1);}
  }else if(level===2){
    appendToc(label,h.id,2);
  }
}
function setupToc(){
  const count=document.getElementById("toc-count");
  if(count)count.textContent=toc.querySelectorAll(".toc-chapter").length+"개 묶음";
  const target=decodeURIComponent(location.hash.slice(1));
  const match=headingLinks.find(x=>x.id===target);
  if(match){
    toc.querySelectorAll(".toc-chapter").forEach(x=>x.open=false);
    match.group.open=true;
    requestAnimationFrame(()=>document.getElementById(match.id)?.scrollIntoView({block:"start"}));
  }
  let scheduled=false;
  const highlight=()=>{
    scheduled=false;
    let chosen=headingLinks[0];
    for(const item of headingLinks){
      const node=document.getElementById(item.id);
      if(node && node.getBoundingClientRect().top<180)chosen=item;
    }
    for(const item of headingLinks){
      item.a.classList.toggle("is-current",item===chosen);
      if(item===chosen)item.a.setAttribute("aria-current","location");
      else item.a.removeAttribute("aria-current");
    }
    if(chosen && window.innerWidth>850 && !chosen.group.open){
      toc.querySelectorAll(".toc-chapter").forEach(g=>g.open=g===chosen.group);
    }
  };
  window.addEventListener("scroll",()=>{
    if(!scheduled){scheduled=true;requestAnimationFrame(highlight);}
  },{passive:true});
  window.addEventListener("hashchange",()=>{
    const id=decodeURIComponent(location.hash.slice(1));
    const item=headingLinks.find(x=>x.id===id);
    if(item){item.group.open=true;document.getElementById(id)?.scrollIntoView({block:"start"});}
  });
  highlight();
}
function table(lines){
  const t=el("table");
  lines.forEach((line,i)=>{
    if(i===1&&/^\|?[\s:\-|]+\|?$/.test(line))return;
    const tr=el("tr");
    line.replace(/^\||\|$/g,"").split("|").forEach(cell=>{const n=el(i===0?"th":"td");inline(n,cell.trim());tr.append(n);});
    t.append(tr);
  });
  article.append(t);
}
const fence=String.fromCharCode(96).repeat(3);
function render(content){
  article.replaceChildren();toc.replaceChildren();
  const lines=content.replace(/\r\n/g,"\n").split("\n");
  let i=0,n=0;
  while(i<lines.length){
    const line=lines[i].trim();
    if(!line){i++;continue;}
    if(line.startsWith(fence)){
      const code=[];i++;
      while(i<lines.length&&!lines[i].trim().startsWith(fence))code.push(lines[i++]);
      if(i<lines.length)i++;
      const pre=el("pre");pre.append(el("code",code.join("\n")));article.append(pre);continue;
    }
    const h=line.match(/^(#{1,4})\s+(.+)$/);
    if(h){heading(h[1].length,h[2],++n);i++;continue;}
    if(/^---+$/.test(line)){article.append(el("hr"));i++;continue;}
    if(line.startsWith("|")){
      const rows=[];while(i<lines.length&&lines[i].trim().startsWith("|"))rows.push(lines[i++].trim());
      table(rows);continue;
    }
    if(line.startsWith(">")){
      const block=el("blockquote");
      while(i<lines.length&&lines[i].trim().startsWith(">")){
        const p=el("p");inline(p,lines[i++].trim().replace(/^>\s?/,""));block.append(p);
      }
      article.append(block);continue;
    }
    const match=line.match(/^([-*]|\d+\.)\s+(.+)$/);
    if(match){
      const ordered=/^\d/.test(match[1]),list=el(ordered?"ol":"ul");
      while(i<lines.length){
        const m=lines[i].match(/^\s*([-*]|\d+\.)\s+(.+)$/);
        if(!m||/^\d/.test(m[1])!==ordered)break;
        const li=el("li");inline(li,m[2]);list.append(li);i++;
        if(i<lines.length&&/^\s{2,}[-*]\s/.test(lines[i])){
          const nested=el("ul");
          while(i<lines.length&&/^\s{2,}[-*]\s/.test(lines[i])){const item=el("li");inline(item,lines[i].trim().slice(2));nested.append(item);i++;}
          li.append(nested);
        }
      }
      article.append(list);continue;
    }
    const para=[line];i++;
    while(i<lines.length){
      const next=lines[i].trim();
      if(!next||/^(#{1,4}\s|[-*]\s|\d+\.\s|>\s|---+\s*$|\|)/.test(next)||next.startsWith(fence))break;
      para.push(next);i++;
    }
    const p=el("p");inline(p,para.join(" "));article.append(p);
  }
  setupToc();
}
fetch("./"+doc+".md",{cache:"no-store"})
  .then(res=>{if(!res.ok)throw Error("HTTP "+res.status);return res.text()})
  .then(render)
  .catch(error=>{
    article.replaceChildren();
    const box=el("div","문서를 불러올 수 없습니다 ("+error.message+"). ");
    box.className="reader-error";
    const a=el("a","GitHub에서 원문 열기");
    a.href="https://github.com/tutle0123/text-game-records/blob/main/rules/"+doc+".md";
    a.target="_blank";a.rel="noopener noreferrer";box.append(a);article.append(box);
  });
})();