import fs from "fs";

const sources = [
  ["Reuters", 'site:reuters.com/business/healthcare-pharmaceuticals pharma biotech FDA'],
  ["STAT", 'site:statnews.com biotech pharma FDA'],
  ["Fierce Biotech", 'site:fiercebiotech.com biotech clinical trial FDA'],
  ["Endpoints News", 'site:endpts.com biotech pharma FDA'],
  ["Nature Medicine", 'site:nature.com/nm "Nature Medicine" medicine research']
];

const WINDOWS = ["1d","3d","7d"];
const MAX_HISTORY = 1200;

function readJSON(path, fallback) { try { return JSON.parse(fs.readFileSync(path,"utf8")); } catch { return fallback; } }
function writeJSON(path, obj) { fs.writeFileSync(path, JSON.stringify(obj,null,2)); }
function decode(s=""){return s.replaceAll("&amp;","&").replaceAll("&quot;",'"').replaceAll("&#39;","'").replaceAll("&lt;","<").replaceAll("&gt;",">")}
function tag(xml,n){const m=xml.match(new RegExp(`<${n}>([\\s\\S]*?)<\\/${n}>`,"i"));return m?decode(m[1].replace(/^<!\\[CDATA\\[|\\]\\]>$/g,"")):""}
function normTitle(t){return t.toLowerCase().replace(/\s+/g," ").replace(/[^\p{L}\p{N} ]/gu,"").trim()}
function stripSource(t){return t.replace(/\s+-\s+[^-]{2,80}$/,"").trim()}
function parseItems(xml){return [...xml.matchAll(/<item>[\s\S]*?<\/item>/gi)].map(m=>m[0]).map(item=>({title:stripSource(tag(item,"title")),url:tag(item,"link"),pubDate:tag(item,"pubDate")})).filter(x=>x.title&&x.url)}
function cat(t){t=t.toLowerCase();if(/fda|approval|regulat/.test(t))return"Regulatory / Approval";if(/deal|license|acqui|partnership|merger/.test(t))return"BD / Licensing";if(/trial|phase|data|readout|study/.test(t))return"Clinical / Data";return"Research Frontier"}

function analysisFor(title){
 const x=title.toLowerCase();
 if(/trial|phase|data|readout|study/.test(x))return{
   zh:"专家会重点看试验设计、终点、患者分层、时间线与后续数据，而不是只判断“成功或失败”。对行业学习者来说，要把临床证据与资产价值联系起来。",
   brief:["The update centers on clinical development or trial data.","The key questions are endpoint quality, patient selection and the next readout.","What matters next is whether the signal can be reproduced or translated into development value."],
   briefZh:["这条新闻核心涉及临床开发或试验数据。","关键问题是终点质量、患者选择以及下一次数据公布。","下一步要看该信号能否被重复验证，并真正转化为研发价值。"]
 };
 if(/fda|approval|regulat/.test(x))return{
   zh:"专家会把监管动作放进研发时间线、成本和竞争格局中理解。真正值得关注的是它会改变哪一段流程、哪些公司先受益、是否形成长期趋势。",
   brief:["The story is primarily about a regulatory decision or policy shift.","Regulatory changes can alter development timelines and commercial options.","Watch which companies, trial stages or therapeutic areas are affected first."],
   briefZh:["这条新闻主要涉及监管决定或政策变化。","监管变化可能改变研发时间线和商业选择。","接下来要看哪些公司、试验阶段或治疗领域最先受到影响。"]
 };
 if(/deal|license|acqui|partnership|merger/.test(x))return{
   zh:"专家不会只看交易总额，而会关注首付款、里程碑、权益范围和战略契合度，因为这些更能反映资产质量与双方议价能力。",
   brief:["The update is about licensing, partnership or capital allocation.","Deal structure often reveals more than headline value.","The next question is whether the transaction changes competitive positioning or pipeline priorities."],
   briefZh:["这条新闻涉及授权、合作或资本配置。","交易结构往往比标题中的总金额透露更多信息。","下一步要看这笔交易是否改变竞争位置或管线优先级。"]
 };
 return{
   zh:"专家会继续追问：这项研究能否形成靶点、biomarker 或患者分层工具，以及从机制发现到临床验证之间还差哪些关键步骤。",
   brief:["The update highlights a research or translational finding.","The key issue is whether the mechanism can lead to a target, biomarker or patient-selection strategy.","Translation into clinical value will require additional validation."],
   briefZh:["这条新闻突出了一项基础或转化研究发现。","关键问题是该机制能否进一步形成靶点、biomarker 或患者选择策略。","要真正形成临床价值，还需要更多验证。"]
 };
}

function zhTitle(title){return "今日前沿：" + title}
function vocabFor(title){
 const bank=[
 ["clinical development","临床开发","drug development 高频表达"],
 ["regulatory strategy","监管策略","注册与战略岗位常见"],
 ["readout","数据公布","clinical readout"],
 ["asset value","资产价值","BD / 投资语境"],
 ["translational potential","转化潜力","基础研究到临床"],
 ["competitive landscape","竞争格局","战略与市场分析"],
 ["milestone","里程碑","研发和交易新闻常见"]
 ];
 return bank.slice(0,5).map(([word,zh,note])=>({word,zh,note}));
}

async function searchNews(source, query, historySet){
 for(const win of WINDOWS){
   const q = `${query} when:${win}`;
   const url=`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
   const r=await fetch(url,{headers:{"user-agent":"Mozilla/5.0 BioLinguaDaily/2.0"}});
   const xml=await r.text();
   const candidates=parseItems(xml);
   const fresh=candidates.find(x=>!historySet.has(normTitle(x.title)));
   if(fresh) return fresh;
 }
 return null;
}

function buildLesson(source, raw){
 const a=analysisFor(raw.title);
 return{
   source, category:cat(raw.title), title_en:raw.title, title_zh:zhTitle(raw.title), url:raw.url, published_at:raw.pubDate,
   brief_points:a.brief.map((en,i)=>({en,zh:a.briefZh[i]})),
   summary_en:`Today's update centers on: ${raw.title}`,
   summary_zh:"先理解新闻事实，再从研发、监管、商业与竞争格局判断影响。",
   expert_analysis:a.zh,
   key_sentences:[
     {en:raw.title,zh:zhTitle(raw.title).replace("今日前沿：",""),note:"来自当天真实新闻标题，可直接跟读。"},
     {en:"The key question is what this development could change next.",zh:"关键问题是，这一进展接下来可能改变什么。",note:"行业分析通用句型。"}
   ],
   vocab:vocabFor(raw.title)
 };
}

function dailyEnglish(items){
 const cats=items.map(x=>x.category).join(" ");
 const out=[
   {en:"what this development could change next",zh:"这一进展接下来可能改变什么",use:"每天都可用于行业分析追问。"}
 ];
 if(/Clinical/.test(cats)) out.push({en:"a meaningful clinical signal",zh:"有意义的临床信号",use:"临床数据解读高频。"});
 if(/Regulatory/.test(cats)) out.push({en:"regulatory pathway",zh:"监管路径",use:"审批与开发策略常见。"});
 if(/Licensing/.test(cats)) out.push({en:"strategic fit",zh:"战略契合度",use:"BD 与交易分析高频。"});
 if(out.length<3) out.push({en:"reshape the competitive landscape",zh:"重塑竞争格局",use:"适合监管、交易和产品突破。"});
 return out.slice(0,3);
}

function buildTedLesson(t){
 return{
   ...t,
   summary_en:`This talk helps you practice structured thinking around the theme: ${t.title}.`,
   summary_zh:`今天用这场 TED 训练“听主旨—抓表达—做复述—写感悟”。主题是：${t.zh}。`,
   key_sentences:[
     {en:"Good ideas become more useful when we can explain them clearly.",zh:"当我们能够清楚表达时，好想法才会变得更有用。"},
     {en:"A strong explanation connects the main idea with a concrete example.",zh:"有力的解释会把核心观点与具体例子连接起来。"}
   ],
   shadowing:[
     "Let me summarize the main idea in my own words.",
     "The most useful point for me is the way this idea changes how I think.",
     "I can connect this idea to a real situation in my work or study."
   ],
   reflection:[
     "这场演讲最核心的观点是什么？",
     "哪一个英文表达最值得你复用？",
     "它和今天的医药行业新闻有什么联系？"
   ]
 };
}

(async()=>{
 fs.mkdirSync("data",{recursive:true});
 const date=new Date().toISOString().slice(0,10);

 // NEWS: deduplicate against history
 const history=readJSON("data/news_history.json",{titles:[]});
 const historySet=new Set(history.titles||[]);
 const items=[];
 for(const [source,q] of sources){
   try{
     const raw=await searchNews(source,q,historySet);
     if(raw){
       items.push(buildLesson(source,raw));
       historySet.add(normTitle(raw.title));
     }
   }catch(e){console.error("news",source,e)}
 }
 history.titles=Array.from(historySet).slice(-MAX_HISTORY);
 writeJSON("data/news_history.json",history);

 // TED: choose an unused slug. Never silently repeat.
 const catalog=readJSON("data/ted_catalog.json",[]);
 const tedHist=readJSON("data/ted_history.json",{slugs:[]});
 const used=new Set(tedHist.slugs||[]);
 const chosen=catalog.find(t=>!used.has(t.slug)) || null;
 let ted=null;
 if(chosen){
   ted=buildTedLesson(chosen);
   used.add(chosen.slug);
   tedHist.slugs=Array.from(used);
   writeJSON("data/ted_history.json",tedHist);
 }else{
   console.warn("TED catalog exhausted: no repeated talk will be generated.");
 }

 const data={
   date,
   daily_brief:"今天只使用未出现在历史记录中的新闻；TED 也只选择未学过的演讲。若没有新的内容，系统会留空，而不会把旧内容伪装成今日内容。",
   daily_english:dailyEnglish(items),
   items,
   ted
 };
 writeJSON(`data/${date}.json`,data);

 let manifest=readJSON("data/manifest.json",{dates:[]});
 if(!manifest.dates.includes(date))manifest.dates.push(date);
 manifest.dates=manifest.dates.sort().slice(-3650);
 writeJSON("data/manifest.json",manifest);
 console.log("saved",date,"news:",items.length,"ted:",ted?.title||"NONE");
})();
