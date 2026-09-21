import fs from "fs";
import path from "path";

const sources = [
  ["Reuters", 'site:reuters.com/business/healthcare-pharmaceuticals pharma biotech FDA'],
  ["STAT", 'site:statnews.com biotech pharma FDA'],
  ["Fierce Biotech", 'site:fiercebiotech.com biotech clinical trial FDA'],
  ["Endpoints News", 'site:endpts.com biotech pharma FDA'],
  ["Nature Medicine", 'site:nature.com/nm "Nature Medicine"']
];

const vocabPool = [
  ["clinical trial","临床试验","drug development 高频"],
  ["regulatory","监管的","regulatory review / approval"],
  ["readout","数据公布","trial readout"],
  ["pipeline","研发管线","R&D pipeline"],
  ["efficacy","疗效","efficacy and safety"],
  ["endpoint","试验终点","primary endpoint"],
  ["licensing deal","授权交易","business development 高频"]
];

function decode(s=""){return s.replaceAll("&amp;","&").replaceAll("&quot;",'"').replaceAll("&#39;","'").replaceAll("&lt;","<").replaceAll("&gt;",">")}
function stripSource(title){return title.replace(/\s+-\s+[^-]{2,80}$/,"").trim()}
function tag(xml, name){
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, "i"));
  return m ? decode(m[1].replace(/^<!\[CDATA\[|\]\]>$/g,"")) : "";
}
async function one(source,q){
  const u=`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
  const r=await fetch(u,{headers:{"user-agent":"Mozilla/5.0 BioLinguaDaily/1.0"}});
  const xml=await r.text();
  const block=(xml.match(/<item>[\s\S]*?<\/item>/i)||[""])[0];
  const title=stripSource(tag(block,"title"));
  const url=tag(block,"link");
  const lower=title.toLowerCase();
  let focus="这条报道关注一项医药行业动态";
  if(/trial|phase/.test(lower))focus="这条报道核心是临床试验进展或结果";
  else if(/fda|approval|regulat/.test(lower))focus="这条报道核心是监管审批";
  else if(/deal|license|acqui/.test(lower))focus="这条报道核心是授权、并购或商业合作";
  else if(/gene|cell|crispr/.test(lower))focus="这条报道核心是前沿生物技术与新型疗法";
  return {
    source,title,url,
    zh_summary:`${focus}。先找主语和核心动词，再用英文回答：What happened? Why does it matter? What should we watch next?`,
    vocab:vocabPool.slice(0,5).map(([word,zh,note])=>({word,zh,note}))
  }
}

const now=new Date();
const date=now.toISOString().slice(0,10);
const items=[];
for(const [source,q] of sources){
  try{items.push(await one(source,q))}catch(e){console.error(source,e)}
}
if(!items.length) process.exit(1);
fs.mkdirSync("data",{recursive:true});
fs.writeFileSync(`data/${date}.json`,JSON.stringify({date,items},null,2));
let manifest={dates:[]};
try{manifest=JSON.parse(fs.readFileSync("data/manifest.json","utf8"))}catch{}
if(!manifest.dates.includes(date)) manifest.dates.push(date);
manifest.dates=manifest.dates.sort().slice(-3650);
fs.writeFileSync("data/manifest.json",JSON.stringify(manifest,null,2));
console.log(`Saved ${date}: ${items.length} items`);
