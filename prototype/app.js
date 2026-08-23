const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const icons=()=>window.lucide?.createIcons();
const feedData=[
 {city:"大理",title:"苍山洱海 4 天慢游路线",match:98,likes:2684,uses:812,color:"blue",tag:"慢旅行",days:4,places:9,distance:"27 km",start:"2026-10-02"},
 {city:"成都",title:"3 天 2 晚本地吃货路线",match:95,likes:4521,uses:1206,color:"orange",tag:"美食",days:3,places:8,distance:"18 km",start:"2026-10-18"},
 {city:"泉州",title:"古城簪花与闽南烟火",match:92,likes:1830,uses:529,color:"green",tag:"摄影",days:3,places:7,distance:"16 km",start:"2026-11-06"},
 {city:"阿勒泰",title:"北疆环线 7 日自驾攻略",match:96,likes:3210,uses:997,color:"yellow",tag:"自驾",days:7,places:14,distance:"860 km",start:"2026-09-20"},
 {city:"杭州",title:"西湖边的松弛周末",match:89,likes:936,uses:341,color:"green",tag:"周末",days:2,places:6,distance:"12 km",start:"2026-10-24"},
 {city:"青岛",title:"沿海散步与啤酒地图",match:91,likes:1518,uses:472,color:"blue",tag:"海边",days:3,places:8,distance:"22 km",start:"2026-09-25"},
 {city:"长沙",title:"24 小时夜宵特种兵",match:94,likes:2209,uses:615,color:"orange",tag:"美食",days:1,places:6,distance:"11 km",start:"2026-10-01"},
 {city:"景德镇",title:"两天逛窑厂与陶溪川",match:87,likes:764,uses:203,color:"yellow",tag:"手作",days:2,places:6,distance:"15 km",start:"2026-11-14"}
];
const initialPlaces=[
 {name:"大理古城",type:"游",desc:"建议 2.5 小时 · 适合摄影",votes:4,icon:"landmark"},
 {name:"段公子 · 天龙八部店",type:"吃",desc:"午餐 · 人均 ¥86",votes:6,icon:"utensils"},
 {name:"才村码头",type:"游",desc:"日落前抵达 · 门票免费",votes:3,icon:"sunset"}
];
const candidates=[
 {name:"崇圣寺三塔",desc:"大理地标 · 建议 2 小时",type:"游",icon:"landmark"},
 {name:"喜洲古镇",desc:"白族古镇 · 适合半日游",type:"游",icon:"camera"},
 {name:"双廊古镇",desc:"洱海东岸 · 日落热门地",type:"游",icon:"sunset"},
 {name:"云里伴山咖啡",desc:"苍山景观位 · 人均 ¥52",type:"吃",icon:"coffee"}
];
const initialStops=[
 {day:1,time:"09:30",name:"大理古城",desc:"建议 2.5 小时 · 已预约讲解",tag:"游 · 适合摄影",duration:"2.5 小时"},
 {day:1,time:"12:20",name:"段公子 · 天龙八部店",desc:"午餐 1.5 小时 · 人均 ¥86",tag:"吃 · 4人想去",duration:"1.5 小时"},
 {day:1,time:"15:00",name:"才村码头",desc:"日落前抵达 · 门票免费",tag:"游 · 最佳光线 17:40",duration:"2.5 小时"}
];
let guide={name:"大理古城和洱海慢游",province:"云南省",city:"大理市",district:"大理镇",start:"2026-09-12",end:"2026-09-15"};
let places=structuredClone(initialPlaces),stops=structuredClone(initialStops),itineraryGenerated=false;
let expenses=[
 {name:"段公子午餐",payer:"晶晶",split:"4人均分",amount:516,icon:"utensils"},
 {name:"古城讲解",payer:"阿豪",split:"4人均分",amount:186,icon:"landmark"},
 {name:"洱海打车",payer:"小乔",split:"4人均分",amount:296,icon:"car-taxi-front"},
 {name:"咖啡与小吃",payer:"林一",split:"4人均分",amount:270,icon:"coffee"}
];
let settlementGenerated=false,dragIndex=null,loadingTimer=null;
let credits=100,aiUses=0,dailyAiUses=0,currentPlaceDraft=null,selectedPlaceType="游",currentPublishGuideId=null;
let loginFromFirstLaunch=false,publicReturnView="home",currentPublicTrip=null,currentPublicStops=[];
const ownedGuides=[
 {id:"dali-own",city:"大理",title:"苍山洱海 4 天慢游路线",color:"blue",status:"published",members:4,places:9,updated:"昨天更新"},
 {id:"chengdu-own",city:"成都",title:"成都朋友的吃货周末",color:"orange",status:"private",members:5,places:6,updated:"2 小时前"},
 {id:"quanzhou-own",city:"泉州",title:"泉州簪花与古城散步",color:"green",status:"private",members:3,places:4,updated:"周一更新"}
];
const joinedGuides=[
 {id:"altay-join",city:"阿勒泰",title:"北疆公路与夏牧场",color:"yellow",status:"private",members:6,places:12,updated:"阿豪创建"},
 {id:"qingdao-join",city:"青岛",title:"沿海散步与啤酒地图",color:"blue",status:"published",members:4,places:8,updated:"小乔创建"}
];
const extractedPlaces=[
 {name:"老拾烧烤老店",desc:"丰泽区东海街道 · 烧烤",type:"吃",icon:"utensils",confidence:96},
 {name:"西街钟楼",desc:"鲤城区西街 · 城市地标",type:"游",icon:"landmark",confidence:98},
 {name:"莓超疯天台机位",desc:"西街附近 · 日落摄影",type:"游",icon:"camera",confidence:89},
 {name:"泉州木偶剧院",desc:"丰泽区泉山路 · 需预约",type:"游",icon:"theater",confidence:93}
];
const regionCities={
 "北京市":["北京市"],"天津市":["天津市"],"河北省":["石家庄市","秦皇岛市","承德市"],"山西省":["太原市","大同市"],"内蒙古自治区":["呼和浩特市","包头市","呼伦贝尔市"],
 "辽宁省":["沈阳市","大连市"],"吉林省":["长春市","延边州"],"黑龙江省":["哈尔滨市","牡丹江市"],"上海市":["上海市"],"江苏省":["南京市","苏州市","无锡市"],
 "浙江省":["杭州市","宁波市","湖州市"],"安徽省":["合肥市","黄山市"],"福建省":["福州市","厦门市","泉州市"],"江西省":["南昌市","景德镇市","上饶市"],
 "山东省":["济南市","青岛市","烟台市"],"河南省":["郑州市","洛阳市","开封市"],"湖北省":["武汉市","宜昌市"],"湖南省":["长沙市","张家界市"],
 "广东省":["广州市","深圳市","珠海市"],"广西壮族自治区":["南宁市","桂林市","北海市"],"海南省":["海口市","三亚市"],"重庆市":["重庆市"],
 "四川省":["成都市","乐山市","阿坝州"],"贵州省":["贵阳市","黔东南州"],"云南省":["昆明市","大理市","丽江市"],"西藏自治区":["拉萨市","林芝市"],
 "陕西省":["西安市","延安市"],"甘肃省":["兰州市","敦煌市"],"青海省":["西宁市","海西州"],"宁夏回族自治区":["银川市","中卫市"],
 "新疆维吾尔自治区":["乌鲁木齐市","阿勒泰地区","伊犁州"],"香港特别行政区":["香港岛","九龙"],"澳门特别行政区":["澳门半岛","氹仔"],"台湾省":["台北市","高雄市","台中市"]
};
const districtMap={
 "北京市":["朝阳区","海淀区","东城区"],"上海市":["黄浦区","徐汇区","浦东新区"],"重庆市":["渝中区","江北区","沙坪坝区"],"天津市":["和平区","河西区","南开区"],
 "大理市":["大理镇","下关街道","喜洲镇"],"成都市":["锦江区","青羊区","武侯区"],"泉州市":["鲤城区","丰泽区","洛江区"],"阿勒泰地区":["阿勒泰市","布尔津县","哈巴河县"],
 "杭州市":["西湖区","上城区","余杭区"],"厦门市":["思明区","湖里区","集美区"],"青岛市":["市南区","崂山区","黄岛区"],"西安市":["碑林区","雁塔区","莲湖区"]
};
const districts=city=>districtMap[city]||["市中心","近郊","其他区域"];
function parseDate(v){return new Date(v+"T00:00:00")}
function formatDate(v){const d=parseDate(v);return (d.getMonth()+1)+"月"+d.getDate()+"日"}
function tripDayCount(start=guide.start,end=guide.end){return Math.max(1,Math.floor((parseDate(end)-parseDate(start))/86400000)+1)}
function dayDateLabel(start,day){const d=parseDate(start);d.setDate(d.getDate()+day-1);return (d.getMonth()+1)+"月"+d.getDate()+"日"}
function endDateFromDays(start,days){const d=parseDate(start);d.setDate(d.getDate()+days-1);const pad=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function fillStopDayOptions(selected=1){const count=tripDayCount();$("#editStopDay").innerHTML=Array.from({length:count},(_,i)=>'<option value="'+(i+1)+'">Day '+(i+1)+' · '+dayDateLabel(guide.start,i+1)+'</option>').join("");$("#editStopDay").value=Math.min(Math.max(+selected||1,1),count)}
function buildPublicStops(item){
 const names=[item.city+"老城","当地早市","山海观景台","街巷午餐","日落散步线","在地小馆","文化展馆","湖畔咖啡","返程伴手礼","特色村落","夜间市集","自然步道","公路驿站","观景营地"],times=["09:00","11:30","15:30","18:30"];
 return Array.from({length:item.places},(_,i)=>({day:Math.min(item.days,Math.floor(i*item.days/item.places)+1),time:times[i%times.length],name:names[i]||item.city+"推荐地点 "+(i+1),desc:i%3===0?"建议停留 2 小时 · 公开路线节点":i%3===1?"顺路安排 · 步行可达":"适合拍照 · 注意营业时间",tag:i%3===1?"吃 · 当地推荐":"游 · 路线精选",duration:i%3===0?"2.5 小时":"1.5 小时"}))
}
function feedCard(x){return '<button class="feed-card" data-feed-city="'+x.city+'"><span class="feed-cover '+x.color+'"><span class="match">AI 匹配 '+x.match+'%</span><strong>'+x.city+'</strong></span><span class="feed-body"><h3>'+x.title+'</h3><span class="feed-meta"><span><i data-lucide="heart"></i>'+x.likes+'</span><span>'+x.uses+' 人套用 · '+x.tag+'</span></span></span></button>'}
function renderFeed(data,target){target=target||"#feedGrid";$(target).innerHTML=data.length?data.map(feedCard).join(""):'<div class="search-empty"><i data-lucide="map-search"></i><strong>没有找到相关行程</strong><span>换个目的地或玩法试试</span></div>';icons()}
function showView(name){
 $$(".view").forEach(v=>v.classList.toggle("active",v.dataset.view===name));
 $(".bottom-nav").classList.toggle("hidden",["auth","trip","search","settings","publicTrip"].includes(name));
 $$("[data-nav]").forEach(b=>b.classList.toggle("active",b.dataset.nav===name));
 if(name==="trip")renderTrip();if(name==="profile")renderProfile("owned");if(name==="settings")renderCredits();icons()
}
function renderPublicTrip(){
 const item=currentPublicTrip||feedData[0];currentPublicStops=buildPublicStops(item);
 $("#publicHeaderTitle").textContent=item.title;$("#publicCity").textContent=item.city;$("#publicTitle").textContent=item.title;$("#publicMatch").textContent="AI 匹配 "+item.match+"%";$("#publicMeta").textContent=item.uses+" 人套用 · "+item.likes+" 次点赞";
 $("#publicDistance").textContent=item.distance;$("#publicMapDays").textContent=item.days;$("#publicPlaceBadge").textContent=item.places;$("#publicDayBadge").textContent=item.days+"天";$("#publicOverviewDays").textContent=item.days+" 天";$("#publicOverviewPlaces").textContent=item.places+" 处";$("#publicDateRange").textContent=formatDate(item.start)+"起 · 共 "+item.days+" 天";
 $("#publicPlaceOverview").innerHTML=currentPublicStops.map((s,i)=>'<article class="public-place-row"><span><i data-lucide="'+(i%3===1?"utensils":"map-pin")+'"></i></span><div><strong>'+s.name+'</strong><p>Day '+s.day+' · '+s.desc+'</p></div></article>').join("");
 $("#publicTimeline").innerHTML=Array.from({length:item.days},(_,d)=>{const day=d+1,rows=currentPublicStops.map((s,i)=>({...s,index:i})).filter(s=>s.day===day);return '<section class="public-day-group"><header><span>DAY '+day+'</span><div><strong>'+dayDateLabel(item.start,day)+'</strong><small>'+rows.length+' 个地点</small></div></header><div class="public-day-stops">'+rows.map((s,i)=>'<article class="public-stop"><span>'+(i+1)+'</span><div><small>'+s.time+'</small><strong>'+s.name+'</strong><p>'+s.desc+'</p></div></article>').join("")+'</div></section>'}).join("");
 icons()
}
function switchPublicDrawer(name,expand=true){$$("[data-public-drawer-tab]").forEach(b=>b.classList.toggle("active",b.dataset.publicDrawerTab===name));$$("[data-public-drawer-panel]").forEach(p=>p.classList.toggle("active",p.dataset.publicDrawerPanel===name));if(expand)$("#publicMapDrawer").classList.add("expanded");icons()}
function openPublicTrip(city){
 const item=feedData.find(x=>x.city===city)||feedData[0],active=$(".view.active");
 publicReturnView=active&&["home","search","profile"].includes(active.dataset.view)?active.dataset.view:"home";currentPublicTrip=item;renderPublicTrip();$("#publicMapDrawer").classList.remove("expanded");switchPublicDrawer("overview",false);showView("publicTrip")
}
function openSheet(id){$$(".sheet").forEach(s=>s.classList.toggle("active",s.id===id));$("#sheetOverlay").classList.add("visible");icons()}
function closeSheet(){$("#sheetOverlay").classList.remove("visible");$$(".sheet").forEach(s=>s.classList.remove("active"))}
function toast(message){$("#toast span").textContent=message;$("#toast").classList.add("visible");clearTimeout(toast.timer);toast.timer=setTimeout(()=>$("#toast").classList.remove("visible"),1800)}
function renderPlaces(){
 $("#placeList").innerHTML=places.map((p,i)=>'<article class="place-item" data-place-index="'+i+'"><span class="place-icon"><i data-lucide="'+p.icon+'"></i></span><div class="place-copy"><strong>'+p.name+'</strong><p>'+p.desc+'</p><div class="place-tags"><span>'+p.type+'</span><span>'+(p.source||'成员添加')+'</span></div></div><button class="place-vote" data-vote="'+i+'"><i data-lucide="thumbs-up"></i>'+p.votes+'</button></article>').join("");
 $("#placeBadge").textContent=places.length;$("#homePlaceCount").textContent=places.length;
 $$(".pin").forEach((p,i)=>p.hidden=i>=places.length);updatePlanGate();icons()
}
function updatePlanGate(){
 const count=places.length,hasPlaces=count>=3,hasCredits=credits>=20,hasQuota=aiUses<5&&dailyAiUses<3,ok=hasPlaces&&hasCredits&&hasQuota;$("#generate").disabled=!ok;
 $("#gateTitle").textContent=!hasPlaces?"还差 "+(3-count)+" 个地点":!hasCredits?"积分不足，暂不可规划":!hasQuota?"AI 次数已达上限":"已满足规划条件";
 $("#gateHint").textContent="已添加 "+count+" / 3 个地点";
 $("#mapStat strong").textContent=itineraryGenerated?"27km · 预计 1h12m":"待规划";
 $("#mapStat span").textContent=itineraryGenerated?"路线已避开折返":"已收藏 "+count+" 个地点";
}
function stopCardHtml(s,i){return '<article class="stop-card" draggable="true" data-stop-index="'+i+'" data-stop-day="'+s.day+'"><time class="stop-time">'+s.time+'</time><div class="stop-main"><strong>'+s.name+'</strong><p>'+s.desc+'</p><span>'+s.tag+'</span></div><div class="stop-actions"><button data-edit-stop="'+i+'" title="编辑节点"><i data-lucide="pencil"></i></button><button class="drag-handle" title="拖拽排序"><i data-lucide="grip-vertical"></i></button></div></article>'}
function updateTripPublishGate(){
 const btn=$("#tripPublishBtn");if(!btn)return;
 const ok=itineraryGenerated&&stops.length>=3;
 btn.disabled=!ok;
 btn.title=ok?"发布到公开行程广场":(itineraryGenerated?"至少安排 3 个行程节点后可发布":"生成 AI 行程后即可发布");
}
function renderTimeline(){
 const count=tripDayCount();stops=stops.map(s=>({...s,day:Math.min(Math.max(+s.day||1,1),count)}));$("#timeline").className="timeline day-timeline";
 $("#timeline").innerHTML=Array.from({length:count},(_,d)=>{const day=d+1,rows=stops.map((s,i)=>({...s,index:i})).filter(s=>s.day===day);return '<section class="trip-day-group"><header><span>DAY '+day+'</span><div><strong>'+dayDateLabel(guide.start,day)+'</strong><small>'+rows.length+' 个行程节点</small></div><button data-add-stop-day="'+day+'" title="在这一天添加地点"><i data-lucide="plus"></i></button></header><div class="trip-day-stops">'+(rows.length?rows.map(s=>stopCardHtml(s,s.index)).join(""):'<button class="day-empty" data-add-stop-day="'+day+'"><i data-lucide="calendar-plus"></i>这一天还没有安排，手动添加</button>')+'</div></section>'}).join("");
 $("#itineraryBadge").textContent=stops.length;updateTripPublishGate();bindDrag();icons()
}
function renderTrip(){
 const count=tripDayCount();$("#tripGuideName").textContent=guide.name;$("#homeGuideName").textContent=guide.name;
 $("#tripMeta").textContent=formatDate(guide.start)+" - "+formatDate(guide.end)+" · "+guide.city;$("#tripDaySummary").textContent=formatDate(guide.start)+"起 · 共 "+count+" 天";
 $("#itineraryEmpty").style.display=itineraryGenerated?"none":"block";
 $("#itineraryReady").classList.toggle("visible",itineraryGenerated);
 renderPlaces();renderTimeline();renderExpenses();renderSettlement()
}
function openStopEditor(index=-1,day=1){
 const editing=index>=0,s=editing?stops[index]:{day,time:"09:00",name:"",desc:"",duration:"1.5 小时"};$("#editStopIndex").value=index;fillStopDayOptions(s.day);$("#editStopTime").value=s.time;$("#editStopName").value=s.name;$("#editStopDesc").value=s.desc;$("#editStopDuration").value=s.duration;$("#editStopKicker").textContent=editing?"编辑行程节点":"手动创建行程";$("#editStopTitle").textContent=editing?"调整日期和停留信息":"安排到旅行中的哪一天？";$("#saveStopButton").textContent=editing?"保存节点修改":"添加到行程";openSheet("editStop")
}
function switchDrawer(name){
 $$("[data-drawer-tab]").forEach(b=>b.classList.toggle("active",b.dataset.drawerTab===name));
 $$("[data-drawer-panel]").forEach(p=>p.classList.toggle("active",p.dataset.drawerPanel===name));
 $("#mapDrawer").classList.add("expanded");icons()
}
function bindDrag(){
 $$(".stop-card").forEach(card=>{
  card.addEventListener("dragstart",()=>{dragIndex=+card.dataset.stopIndex;card.classList.add("dragging")});
  card.addEventListener("dragend",()=>{dragIndex=null;card.classList.remove("dragging")});
  card.addEventListener("dragover",e=>e.preventDefault());
  card.addEventListener("drop",e=>{e.preventDefault();const to=+card.dataset.stopIndex;if(dragIndex===null||to===dragIndex)return;const moved=stops.splice(dragIndex,1)[0];moved.day=+card.dataset.stopDay||moved.day;stops.splice(to,0,moved);renderTimeline();toast("行程日期与顺序已更新")})
 })
}
function generateItinerary(){
 if(places.length<3){toast("至少添加 3 个地点后才能规划");return}
 $("#loading").classList.add("visible");let pct=18,step=0;
 const messages=["检查营业时间与地点距离","参考成员投票与停留偏好","正在规避折返与高峰路段","整理可编辑的日程卡片"];
 clearInterval(loadingTimer);loadingTimer=setInterval(()=>{
  pct=Math.min(96,pct+Math.ceil(Math.random()*18));step=Math.min(messages.length-1,step+1);
  $("#loadingBar").style.width=pct+"%";$("#loadingPct").textContent=pct+"%";$("#loadingText").textContent=messages[step];
  if(pct>=96){clearInterval(loadingTimer);setTimeout(()=>{
   if(!stops.length){const times=["09:30","12:20","15:00"];stops=places.map((p,i)=>({day:1,time:times[i%times.length],name:p.name,desc:p.desc,tag:p.type+" · 成员共同收藏",duration:i%3===1?"1.5 小时":"2.5 小时"}))}
   const dayCount=tripDayCount();stops=stops.map((s,i)=>({...s,day:Math.min(dayCount,Math.floor(i*dayCount/Math.max(stops.length,1))+1)}));
   if(!spendCredits(20,"AI 行程规划")){$("#loading").classList.remove("visible");return}
   itineraryGenerated=true;$("#loading").classList.remove("visible");$("#loadingBar").style.width="18%";$("#loadingPct").textContent="18%";
   renderTrip();switchDrawer("itinerary");toast("行程已生成，可继续编辑和拖拽")
  },450)}
 },420)
}
function renderExpenses(){
 $("#expenses").innerHTML=expenses.map(e=>'<article class="expense-item"><span class="expense-icon"><i data-lucide="'+e.icon+'"></i></span><div><strong>'+e.name+'</strong><p>'+e.payer+' 垫付 · '+e.split+'</p></div><span class="expense-amount">¥'+e.amount.toFixed(2)+'</span></article>').join("");
 $("#total").textContent="¥ "+expenses.reduce((a,b)=>a+b.amount,0).toLocaleString("zh-CN",{minimumFractionDigits:2});
 $("#expenseCount").textContent=expenses.length;icons()
}
function renderSettlement(){
 $("#settlementPlaceholder").style.display=settlementGenerated?"none":"block";
 $("#settlementResult").classList.toggle("visible",settlementGenerated);
 $("#settlementVersion").textContent="基于 "+expenses.length+" 笔账单生成";
 const rows=[{from:"小乔",to:"晶晶",amount:"¥168.50",a:"乔",b:"景"},{from:"林一",to:"阿豪",amount:"¥74.00",a:"林",b:"豪"}];
 $("#transfers").innerHTML=rows.map(t=>'<div class="transfer"><span class="transfer-person"><b>'+t.a+'</b>'+t.from+'</span><span class="transfer-arrow">→</span><span class="transfer-person"><b>'+t.b+'</b>'+t.to+'</span><strong class="transfer-amount">'+t.amount+'</strong></div>').join("");icons()
}
function switchAA(stage){$$("[data-aa-stage]").forEach(b=>b.classList.toggle("active",b.dataset.aaStage===stage));$$("[data-aa-panel]").forEach(p=>p.classList.toggle("active",p.dataset.aaPanel===stage));icons()}
function invalidateSettlement(){if(settlementGenerated){settlementGenerated=false;renderSettlement();toast("账单已变化，请重新生成结算")}}
function renderProfile(kind){
 const list=kind==="owned"?ownedGuides:kind==="joined"?joinedGuides:feedData.slice(1,6);
 $("#profileList").innerHTML=list.map(x=>{
  if(kind==="saved")return '<article class="profile-guide-card"><button class="profile-guide-main" data-feed-city="'+x.city+'"><span class="profile-item-cover '+x.color+'">'+x.city+'</span><span class="profile-guide-copy"><span class="guide-status saved"><i data-lucide="bookmark"></i>已收藏</span><h3>'+x.title+'</h3><p>'+x.uses+' 人套用 · '+x.likes+' 次点赞</p><span class="guide-foot">'+x.tag+' · 来自公开广场</span></span><i data-lucide="chevron-right"></i></button></article>';
  const published=x.status==="published",pending=x.status==="pending",status=published?"已发布":pending?"审核中":"私密共创",statusIcon=published?"globe-2":pending?"clock":"lock-keyhole";
  const action=kind==="owned"&&!(published||pending)?'<button class="publish-action" data-publish-guide="'+x.id+'"><i data-lucide="send"></i>发布</button>':'<span class="guide-role">'+(kind==="owned"?"我创建":"我加入")+'</span>';
  return '<article class="profile-guide-card"><button class="profile-guide-main" data-open-trip><span class="profile-item-cover '+x.color+'">'+x.city+'</span><span class="profile-guide-copy"><span class="guide-status '+x.status+'"><i data-lucide="'+statusIcon+'"></i>'+status+'</span><h3>'+x.title+'</h3><p>'+x.places+' 个地点 · '+x.members+' 位成员</p><span class="guide-foot">'+x.updated+'</span></span><i data-lucide="chevron-right"></i></button><div class="profile-guide-actions"><span>'+ (published?"公开广场所有人可见":"仅受邀成员可见") +'</span>'+action+'</div></article>'
 }).join("");icons()
}
function applyTheme(theme){
 document.documentElement.dataset.theme=theme;
 $$("[data-theme-choice]").forEach(button=>button.classList.toggle("active",button.dataset.themeChoice===theme));
 try{localStorage.setItem("crew-theme",theme)}catch{}
 icons()
}
function initRegions(){
 const province=$("#provincePicker"),city=$("#cityPicker"),district=$("#districtPicker");
 province.innerHTML=Object.keys(regionCities).map(x=>"<option>"+x+"</option>").join("");
 function fillCities(selected){city.innerHTML=regionCities[selected].map(x=>"<option>"+x+"</option>").join("");fillDistricts(city.value)}
 function fillDistricts(selected){district.innerHTML=districts(selected).map(x=>"<option>"+x+"</option>").join("")}
 province.addEventListener("change",()=>fillCities(province.value));city.addEventListener("change",()=>fillDistricts(city.value));
 window.setRegion=(p,c,d)=>{p=p==="云南"?"云南省":p;province.value=p;fillCities(p);city.value=c;fillDistricts(c);district.value=d};
 setRegion(guide.province,guide.city,guide.district)
}
function renderCandidates(term){
 term=term||"";const list=candidates.filter(x=>!term||x.name.includes(term)||x.desc.includes(term));
 $("#placeCandidates").innerHTML=list.map(p=>'<article class="candidate"><div><strong>'+p.name+'<span class="candidate-distance">距你 '+(400+candidates.indexOf(p)*260)+'m</span></strong><p>'+p.desc+'</p></div><button data-review-candidate="'+candidates.indexOf(p)+'">编辑添加</button></article>').join("");
 if(!list.length)$("#placeCandidates").innerHTML='<div class="search-empty"><i data-lucide="map-search"></i><strong>没有直接匹配</strong><span>换个关键词，或使用链接识别批量导入</span></div>';icons()
}

function renderCredits(){
 const runs=Math.floor(credits/20),percent=Math.min(100,aiUses/5*100);
 ["#creditBalance","#creditBalanceSettings","#linkCreditBalance"].forEach(s=>{if($(s))$(s).textContent=credits});
 if($("#creditRuns"))$("#creditRuns").textContent=runs;
 if($("#aiUseCount"))$("#aiUseCount").textContent=aiUses;
 if($("#monthUseSettings"))$("#monthUseSettings").textContent=aiUses;
 if($("#todayUseSettings"))$("#todayUseSettings").textContent=dailyAiUses;
 if($("#quotaTrack"))$("#quotaTrack").style.width=percent+"%";
 updatePlanGate()
}
function spendCredits(amount,label){
 if(label==="AI 行程规划"&&(aiUses>=5||dailyAiUses>=3)){toast("AI 次数已达上限，明天再来");return false}
 if(credits<amount){toast("积分不足，发布公开攻略可获得积分");return false}
 credits-=amount;if(label==="AI 行程规划"){aiUses++;dailyAiUses++;}
 if($("#latestPointLog"))$("#latestPointLog").textContent=label+" -"+amount+" 分";
 renderCredits();return true
}
function switchPlaceMode(mode){
 $$("[data-place-mode]").forEach(b=>b.classList.toggle("active",b.dataset.placeMode===mode));
 $$("[data-place-mode-panel]").forEach(p=>p.classList.toggle("active",p.dataset.placeModePanel===mode));icons()
}
function openPlaceEditor(place,source){
 currentPlaceDraft={...place,source:source||""};selectedPlaceType=place.type||"游";
 $("#placeEditorName").value=place.name||"";$("#placeEditorAddress").value=place.address||place.desc||"大理市 · 地图 POI 待确认";
 $("#placeEditorNote").value=place.note||place.desc||"";$("#placeEditorSource").value=source||"";
 $$("[data-place-type]").forEach(b=>b.classList.toggle("active",b.dataset.placeType===selectedPlaceType));openSheet("placeEditor")
}
function renderExtractedPlaces(){
 $("#extractedPlaces").innerHTML=extractedPlaces.map((p,i)=>'<label class="extracted-item"><input class="extracted-check" type="checkbox" data-import-index="'+i+'" checked><span><strong>'+p.name+'</strong><p>'+p.desc+'</p></span><b class="confidence">'+p.confidence+'% 匹配</b></label>').join("");
 updateSelectedImportCount();icons()
}
function updateSelectedImportCount(){
 if($("#selectedImportCount"))$("#selectedImportCount").textContent=$$(".extracted-check:checked").length
}
document.addEventListener("click",e=>{
 const sheetButton=e.target.closest("[data-sheet]");if(sheetButton){openSheet(sheetButton.dataset.sheet);return}
 const settings=e.target.closest("[data-settings]");if(settings){showView("settings");return}
 const themeChoice=e.target.closest("[data-theme-choice]");if(themeChoice){applyTheme(themeChoice.dataset.themeChoice);toast("已切换为「"+themeChoice.querySelector("b").textContent+"」");return}
 const publish=e.target.closest("[data-publish-guide]");if(publish){currentPublishGuideId=publish.dataset.publishGuide;const item=ownedGuides.find(x=>x.id===currentPublishGuideId);$("#publishGuideTitle").textContent=item.title;$("#publishConsent").checked=false;$("#confirmPublish").disabled=true;openSheet("publishGuide");return}
 if(e.target.closest("[data-profile-back]")){showView("profile");return}
 const placeMode=e.target.closest("[data-place-mode]");if(placeMode){switchPlaceMode(placeMode.dataset.placeMode);return}
 const recent=e.target.closest("[data-recent]");if(recent){$("#placeSearchInput").value=recent.dataset.recent;renderCandidates(recent.dataset.recent);return}
 const review=e.target.closest("[data-review-candidate]");if(review){openPlaceEditor(candidates[+review.dataset.reviewCandidate],"");return}
 const placeType=e.target.closest("[data-place-type]");if(placeType){selectedPlaceType=placeType.dataset.placeType;$$("[data-place-type]").forEach(b=>b.classList.toggle("active",b===placeType));return}
 if(e.target.closest(".sheet-close")){closeSheet();return}
 if(e.target===$("#sheetOverlay")){closeSheet();return}
 const nav=e.target.closest("[data-nav]");if(nav){showView(nav.dataset.nav);return}
 if(e.target.closest("[data-home]")){showView("home");return}
 if(e.target.closest("[data-open-trip]")){showView("trip");return}
 if(e.target.closest("[data-open-search]")){runSearch();showView("search");$("#searchInput").focus();return}
 const tripTab=e.target.closest("[data-trip]");if(tripTab){$$("[data-trip]").forEach(b=>b.classList.toggle("active",b===tripTab));$$("[data-panel]").forEach(p=>p.classList.toggle("active",p.dataset.panel===tripTab.dataset.trip));return}
 const publicDrawerTab=e.target.closest("[data-public-drawer-tab]");if(publicDrawerTab){switchPublicDrawer(publicDrawerTab.dataset.publicDrawerTab);return}
 const drawerTab=e.target.closest("[data-drawer-tab]");if(drawerTab){switchDrawer(drawerTab.dataset.drawerTab);return}
 const aa=e.target.closest("[data-aa-stage]");if(aa){switchAA(aa.dataset.aaStage);return}
 const profile=e.target.closest("[data-profile]");if(profile){$$("[data-profile]").forEach(b=>b.classList.toggle("active",b===profile));renderProfile(profile.dataset.profile);return}
 const hot=e.target.closest("[data-hot]");if(hot){$$("[data-hot]").forEach(b=>b.classList.toggle("active",b===hot));setRegion(...hot.dataset.hot.split("|"));return}
 const add=e.target.closest("[data-add-candidate]");if(add){const p=candidates[+add.dataset.addCandidate];if(places.some(x=>x.name===p.name)){toast("地点已经在合集中");return}places.push({...p,votes:1});renderPlaces();closeSheet();toast("已添加 "+p.name);return}
 const vote=e.target.closest("[data-vote]");if(vote){places[+vote.dataset.vote].votes++;renderPlaces();toast("已投票想去");return}
 const addStop=e.target.closest("[data-add-stop-day]");if(addStop){openStopEditor(-1,+addStop.dataset.addStopDay);return}
 const edit=e.target.closest("[data-edit-stop]");if(edit){openStopEditor(+edit.dataset.editStop);return}
 const card=e.target.closest("[data-feed-city]");if(card){openPublicTrip(card.dataset.feedCity);return}
 const publicPin=e.target.closest(".public-route-pin");if(publicPin){switchPublicDrawer("itinerary");return}
 const pin=e.target.closest(".pin");if(pin){switchDrawer("places");$$(".place-item").forEach(x=>x.classList.toggle("selected",x.dataset.placeIndex===pin.dataset.stop));document.querySelector('[data-place-index="'+pin.dataset.stop+'"]')?.scrollIntoView({block:"center",behavior:"smooth"});return}
});
$("#toggleDrawer").addEventListener("click",()=>$("#mapDrawer").classList.toggle("expanded"));
$("#togglePublicDrawer").addEventListener("click",()=>$("#publicMapDrawer").classList.toggle("expanded"));
$("#addManualStop").addEventListener("click",()=>openStopEditor(-1,1));
$("#startManualItinerary").addEventListener("click",()=>openStopEditor(-1,1));
$("#generate").addEventListener("click",generateItinerary);$("#regenerate").addEventListener("click",generateItinerary);
$("#cancel").addEventListener("click",()=>{$("#loading").classList.remove("visible");clearInterval(loadingTimer)});
$("#locateMe").addEventListener("click",()=>toast("已回到当前行程范围"));
$("#shuffle").addEventListener("click",()=>{feedData.push(feedData.shift());renderFeed(feedData);toast("已换一批路线")});
function runSearch(){const term=$("#searchInput").value.trim();const data=feedData.filter(x=>!term||x.city.includes(term)||x.title.includes(term)||x.tag.includes(term));$("#searchKeyword").textContent=term||"全部";$("#searchCount").textContent=data.length+" 条结果";renderFeed(data,"#searchGrid")}
$("#searchSubmit").addEventListener("click",runSearch);$("#searchInput").addEventListener("keydown",e=>{if(e.key==="Enter")runSearch()});
$("#createGuideForm").addEventListener("submit",e=>{
 e.preventDefault();if($("#endDate").value<$("#startDate").value){toast("返程日期不能早于出发日期");return}guide={name:$("#guideNameInput").value.trim(),province:$("#provincePicker").value,city:$("#cityPicker").value,district:$("#districtPicker").value,start:$("#startDate").value,end:$("#endDate").value};
 places=[];stops=[];expenses=[];itineraryGenerated=false;settlementGenerated=false;closeSheet();renderTrip();showView("trip");switchDrawer("places");toast("攻略已创建，先添加 3 个想去的地方")
});
$("#editStopForm").addEventListener("submit",e=>{e.preventDefault();const i=+$("#editStopIndex").value,node={day:+$("#editStopDay").value,time:$("#editStopTime").value,name:$("#editStopName").value.trim(),desc:$("#editStopDesc").value.trim()||"手动安排的行程节点",duration:$("#editStopDuration").value,tag:i>=0?stops[i].tag:"手动 · 可继续编辑"};if(i>=0)stops[i]={...stops[i],...node};else stops.push(node);itineraryGenerated=true;renderTrip();closeSheet();toast(i>=0?"行程节点已保存":"已添加到 Day "+node.day)});
$("#expenseForm").addEventListener("submit",e=>{e.preventDefault();expenses.push({name:$("#expenseName").value,amount:+$("#expenseAmount").value,payer:$("#expensePayer").value,split:"4人均分",icon:"receipt"});invalidateSettlement();renderExpenses();closeSheet();switchAA("ledger");toast("账单已保存")});
$("#generateSettlement").addEventListener("click",()=>{const b=$("#generateSettlement");b.disabled=true;b.innerHTML='<i data-lucide="loader-circle"></i>奶糖正在精算...';icons();setTimeout(()=>{settlementGenerated=true;renderSettlement();switchAA("settlement");b.disabled=false;b.innerHTML='<i data-lucide="calculator"></i>生成最少转账方案';icons();toast("结算方案已生成")},900)});
$("#redoSettlement").addEventListener("click",()=>{settlementGenerated=false;renderSettlement();switchAA("ledger");toast("请确认账单后重新生成")});
$$("[data-aa-back]").forEach(b=>b.addEventListener("click",()=>switchAA("ledger")));
$("#copy").addEventListener("click",async()=>{const text="大理朋友局结算：小乔→晶晶 ¥168.50；林一→阿豪 ¥74.00";try{await navigator.clipboard.writeText(text);toast("结算结果已复制")}catch{toast("结算结果已准备好")}});
$("#invite").addEventListener("click",()=>toast("微信邀请卡片已生成"));$("#scan").addEventListener("click",()=>toast("已识别：才村咖啡 ¥128.00"));
$("#placeSearchInput").addEventListener("input",e=>renderCandidates(e.target.value.trim()));
$("#placeSearchForm").addEventListener("submit",e=>{e.preventDefault();const term=$("#placeSearchInput").value.trim();renderCandidates(term);toast(term?"已找到附近地点":"已展示附近推荐")});
$("#clearRecent").addEventListener("click",()=>{$("#recentSearchList").innerHTML='<span class="muted-empty">暂无最近搜索</span>'});
$("#parseShareLink").addEventListener("click",()=>{
 const link=$("#shareLinkInput").value.trim();if(!link||!/^https?:\/\//i.test(link)){toast("请粘贴有效的公开分享链接");return}
 if(credits<5){toast("积分不足，暂时无法智能识别");return}
 const button=$("#parseShareLink");button.disabled=true;button.innerHTML='<i data-lucide="loader-circle"></i>芝士正在识别地点...';icons();
 setTimeout(()=>{spendCredits(5,"链接智能识别");renderExtractedPlaces();$("#importResults").classList.add("visible");button.disabled=false;button.innerHTML='<i data-lucide="refresh-cw"></i>重新识别这条链接';icons();toast("识别完成，请确认要导入的地点")},950)
});
$("#toggleImportAll").addEventListener("click",()=>{const checks=$$(".extracted-check"),all=checks.every(c=>c.checked);checks.forEach(c=>c.checked=!all);updateSelectedImportCount()});
$("#extractedPlaces").addEventListener("change",updateSelectedImportCount);
$("#batchImportPlaces").addEventListener("click",()=>{
 const selected=$$(".extracted-check:checked").map(c=>extractedPlaces[+c.dataset.importIndex]);if(!selected.length){toast("请至少选择一个地点");return}
 let added=0;selected.forEach(p=>{if(!places.some(x=>x.name===p.name)){places.push({...p,votes:1,source:"智能识别"});added++}});
 renderPlaces();closeSheet();toast(added?"已批量导入 "+added+" 个地点":"所选地点已在合集中")
});

$("#publishConsent").addEventListener("change",e=>$("#confirmPublish").disabled=!e.target.checked);
$("#tripPublishBtn")?.addEventListener("click",()=>{
 currentPublishGuideId="trip-draft";$("#publishGuideTitle").textContent=guide.name;$("#publishConsent").checked=false;$("#confirmPublish").disabled=true;openSheet("publishGuide")
});
$("#confirmPublish").addEventListener("click",()=>{
 if(!$("#publishConsent").checked)return;
 if(currentPublishGuideId==="trip-draft"){
   const existing=ownedGuides.find(x=>x.title===guide.name);
   if(existing){existing.status="published";existing.places=places.length;existing.members=4;existing.updated="刚刚更新"}
   else{ownedGuides.unshift({id:"trip-"+Date.now(),city:guide.city.replace("市",""),title:guide.name,color:"orange",status:"pending",members:4,places:places.length,updated:"等待审核"})}
   closeSheet();toast("已提交审核，通过后获得 30 积分")
 }else{
   const item=ownedGuides.find(x=>x.id===currentPublishGuideId);if(!item)return;
   item.status="published";credits+=30;if($("#latestPointLog"))$("#latestPointLog").textContent="公开攻略审核通过 +30 分";
   renderCredits();renderProfile("owned");closeSheet();toast("原型已模拟审核通过，获得 30 积分")
 }
});
$("#loginAgreement").addEventListener("change",e=>$("#startWechatLogin").disabled=!e.target.checked);
$("#startWechatLogin").addEventListener("click",()=>{
 loginFromFirstLaunch=true;const button=$("#startWechatLogin");button.disabled=true;button.innerHTML='<i data-lucide="loader-circle"></i>正在建立微信身份...';icons();
 setTimeout(()=>{button.innerHTML='<i data-lucide="message-circle"></i>微信快捷登录';button.disabled=!$("#loginAgreement").checked;openSheet("wechatLogin")},520)
});
$("#publicTripBack").addEventListener("click",()=>showView(publicReturnView));
$("#sharePublicTrip").addEventListener("click",()=>toast("公开攻略分享卡片已生成"));
$("#savePublicTrip").addEventListener("click",e=>{e.currentTarget.classList.toggle("saved");e.currentTarget.innerHTML=e.currentTarget.classList.contains("saved")?'<i data-lucide="bookmark-check"></i>已收藏':'<i data-lucide="bookmark"></i>收藏';icons();toast(e.currentTarget.classList.contains("saved")?"已收藏到我的":"已取消收藏")});
$("#copyPublicTrip").addEventListener("click",()=>{
 const item=currentPublicTrip||feedData[0];guide={...guide,name:item.title,city:item.city+"市",start:item.start,end:endDateFromDays(item.start,item.days)};stops=structuredClone(currentPublicStops);places=currentPublicStops.map((s,i)=>({name:s.name,type:s.tag.startsWith("吃")?"吃":"游",desc:s.desc,votes:0,icon:s.tag.startsWith("吃")?"utensils":"map-pin",source:"公开攻略套用"}));expenses=[];settlementGenerated=false;itineraryGenerated=true;showView("trip");switchDrawer("itinerary");toast("已套用为私密攻略，账本为空")
});
$("#resetLogin")?.addEventListener("click",()=>{try{localStorage.removeItem("crew-auth-demo")}catch{}$("#loginAgreement").checked=false;$("#startWechatLogin").disabled=true;showView("auth");toast("已回到首次登录演示")});
$("#chooseWechatAvatar").addEventListener("click",()=>{
 $("#chosenAvatarText").textContent="晶";$("#loginAvatarPreview").textContent="晶";$("#chooseWechatAvatar").classList.add("selected");toast("已选择微信头像")
});
$("#wechatLoginForm").addEventListener("submit",e=>{
 e.preventDefault();const name=$("#wechatNickname").value.trim()||"微信用户",initial=name.slice(0,1);
 $("#profileAvatarText").textContent=initial;$("#profileName").textContent=name+"的旅行宇宙";$("#profileLevel").textContent="微信用户 · 旅行策划师 Lv.2";
 $("#profileLoginLink").innerHTML='微信资料已同步 <i data-lucide="badge-check"></i>';try{localStorage.setItem("crew-auth-demo","1")}catch{}
 closeSheet();if(loginFromFirstLaunch){loginFromFirstLaunch=false;showView("home")}icons();toast("登录成功，已赠送 100 旅行积分")
});
$("#placeEditorForm").addEventListener("submit",e=>{
 e.preventDefault();const name=$("#placeEditorName").value.trim();if(places.some(x=>x.name===name)){toast("这个地点已经在合集中");return}
 const iconMap={游:"landmark",吃:"utensils",住:"bed-double",购:"shopping-bag"};
 places.push({name:name,type:selectedPlaceType,desc:$("#placeEditorNote").value.trim()||$("#placeEditorAddress").value,votes:1,icon:iconMap[selectedPlaceType],source:$("#placeEditorSource").value.trim()});
 renderPlaces();closeSheet();toast("已添加 "+name)
});
let initialTheme="sunny",hasSession=false;try{initialTheme=localStorage.getItem("crew-theme")||"sunny";hasSession=localStorage.getItem("crew-auth-demo")==="1"}catch{}applyTheme(initialTheme);initRegions();renderFeed(feedData);runSearch();renderCandidates();renderTrip();renderProfile("owned");renderCredits();showView(hasSession?"home":"auth");icons();
