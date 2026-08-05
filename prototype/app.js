/**
 * 馋猫局儿 · AI 组局小程序原型交互逻辑 (多页面重构版)
 */

// 1. 全局模拟数据库状态
const AI_DAILY_QUOTA = 50;   // 每日免费 AI 助手调用次数 (F6)
let aiUsedToday = 8;         // 今日已使用次数

const usersList = ['张三', '李四', '王五', '赵六', '孙七', '周八', '小甲', '小乙'];

const initialCrews = {
  crew1: {
    id: 'crew1',
    title: '徐州周末局',
    date: '2026-08-01',
    members: ['张三', '李四', '王五', '赵六', '孙七', '周八'],
    startPoint: '北京南站',
    budgetRange: '200-300',
    status: 'active',
    currentPlan: 'food',
    manualAdjusted: false,
    places: [
      { id: 'p1', name: '丰储街早市', cat: '早餐', detail: '地道早市，推荐胡辣汤', votes: 5, status: 'confirmed', x: 40, y: 115 },
      { id: 'p2', name: '两来风羊肉馆', cat: '午饭', detail: '避开高峰，芝士投票最高', votes: 6, status: 'confirmed', x: 180, y: 70 },
      { id: 'p3', name: '云龙湖 · 湖东路', cat: '景点', detail: '晚饭前湖边散步1小时', votes: 4, status: 'confirmed', x: 300, y: 120 },
      { id: 'p4', name: '老拾烧烤 (户部山店)', cat: '晚饭', detail: '截图OCR识别匹配候选', votes: 5, status: 'candidate', x: 275, y: 45 },
      { id: 'p5', name: '户部山小吃街', cat: '小吃', detail: '徐州老牌地标小吃街', votes: 6, status: 'candidate', x: 140, y: 30 },
      { id: 'p6', name: '回龙窝历史街区', cat: '景点', detail: '饭后街区漫步拍照', votes: 4, status: 'candidate', x: 90, y: 25 },
    ],
    plans: {
      food: {
        title: '芝士的吃逛路线',
        copy: '先去早市避开人潮，再把午饭和傍晚散步放在同一片区。',
        reason: '三站集中在市中心，午饭前不折返，傍晚留出 50 分钟逛云龙湖。',
        unselected: '老拾烧烤 (排队时间较长且不在午间片区，已备选至晚餐)',
        stops: [
          { time: '09:40', type: '早餐', name: '丰储街早市', detail: '先垫垫肚子，走路 6 分钟', votes: '5想去', id: 'p1' },
          { time: '12:10', type: '午饭', name: '两来风羊肉馆', detail: '避开午高峰，芝士投票最高', votes: '6想去', id: 'p2' },
          { time: '17:20', type: '傍晚', name: '云龙湖 · 湖东路', detail: '晚饭前散步，打车 12 分钟', votes: '4想去', id: 'p3' },
        ]
      },
      easy: {
        title: '奶糖的轻松逛吃',
        copy: '把步行距离压到最低，给每一顿留够慢慢吃的时间。',
        reason: '上午只安排一个地点，午后不跨区，适合不想早起的朋友。',
        unselected: '丰储街早市 (离酒店稍远)、高铁站附近烧烤 (返程偏慢)',
        stops: [
          { time: '10:30', type: '早午餐', name: '户部山小吃街', detail: '一站吃到多种徐州味', votes: '6想去', id: 'p5' },
          { time: '14:30', type: '闲逛', name: '回龙窝历史街区', detail: '饭后步行 8 分钟', votes: '4想去', id: 'p6' },
          { time: '18:10', type: '晚饭', name: '老拾烧烤 (户部山店)', detail: '提前取号，奶糖建议 AA 记账', votes: '5想去', id: 'p4' },
        ]
      }
    },
    expenses: [
      { id: 'e1', title: '两来风羊肉馆午饭', amount: 360.0, payer: '张三', place: '两来风羊肉馆', participants: ['张三', '李四', '王五', '赵六', '孙七', '周八'] },
      { id: 'e2', title: '云龙湖打车交通', amount: 48.0, payer: '李四', place: '打车交通', participants: ['张三', '李四', '王五', '赵六', '孙七', '周八'] },
      { id: 'e3', title: '丰储街早市小吃买单', amount: 120.0, payer: '王五', place: '丰储街早市', participants: ['张三', '李四', '王五', '赵六'] },
      { id: 'e4', title: '晚上老拾烧烤聚餐', amount: 752.0, payer: '张三', place: '老拾烧烤', participants: ['张三', '李四', '王五', '赵六', '孙七', '周八'] },
    ]
  },
  crew2: {
    id: 'crew2',
    title: '北京野三坡踏青避暑局',
    date: '2026-07-15',
    members: ['张三', '李四', '王五', '赵六', '孙七', '周八', '小甲', '小乙'],
    startPoint: '北京西站',
    budgetRange: '100-200',
    status: 'done',
    currentPlan: 'default',
    manualAdjusted: false,
    places: [
      { id: 'p10', name: '百里峡景区', cat: '景点', detail: '野三坡王牌峡谷，需步行4小时', votes: 8, status: 'confirmed', x: 60, y: 40 },
      { id: 'p11', name: '拒马河漂流', cat: '娱乐', detail: '高山漂流很凉快，易湿身', votes: 7, status: 'confirmed', x: 190, y: 110 },
      { id: 'p12', name: '野三坡烧烤大排档', cat: '晚饭', detail: '尝尝本地烤虹鳟鱼', votes: 8, status: 'confirmed', x: 290, y: 60 }
    ],
    plans: {
      default: {
        title: '芝士的峡谷漂流路线',
        copy: '上午进百里峡避暑，下午坐竹排漂流，晚上烤虹鳟鱼。',
        reason: '上午百里峡温度最低，下午玩水不晒，路线完全顺路。',
        unselected: '鱼骨洞 (排队过长且时间不够)',
        stops: [
          { time: '09:00', type: '景点', name: '百里峡景区', detail: '避开正午烈日，徒步爬山', votes: '8想去', id: 'p10' },
          { time: '14:30', type: '漂流', name: '拒马河漂流', detail: '下午玩水，打水仗凉爽', votes: '7想去', id: 'p11' },
          { time: '18:00', type: '美食', name: '野三坡烧烤大排档', detail: '返程前聚餐烤鱼', votes: '8想去', id: 'p12' }
        ]
      }
    },
    expenses: [
      { id: 'e10', title: '百里峡景区门票团购', amount: 800.0, payer: '张三', place: '百里峡景区', participants: ['张三', '李四', '王五', '赵六', '孙七', '周八', '小甲', '小乙'] },
      { id: 'e11', title: '拒马河漂流包车', amount: 350.0, payer: '李四', place: '拒马河漂流', participants: ['张三', '李四', '王五', '赵六', '孙七', '周八', '小甲', '小乙'] },
    ]
  }
};

let crews = JSON.parse(JSON.stringify(initialCrews)); // 内存深拷贝，支持复刻新增
let currentCrewId = 'crew1';

// 2. 预置攻略圈数据
const feedGuides = [
  { id: 'guide1', title: '徐州经典 1 日吃逛实战攻略', author: '张三', authorAvatar: '张', cost: '￥213', reps: '58次复刻', crewId: 'crew1' },
  { id: 'guide2', title: '北京郊游 · 野三坡峡谷漂流攻略', author: '李四', authorAvatar: '李', cost: '￥143', reps: '124次复刻', crewId: 'crew2' },
];

// ================= 3. 极简小程序路由管理器 =================
const PageRouter = {
  currentTab: 'home',
  pageStack: ['page-home'],

  init() {
    // 底部全局 Tabbar 点击监听
    document.querySelectorAll('.mp-tabbar .tab-item').forEach(item => {
      item.addEventListener('click', () => {
        const targetTab = item.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // 监听子页面返回按钮
    document.querySelectorAll('.mp-page .btn-back').forEach(btn => {
      btn.addEventListener('click', () => {
        this.back();
      });
    });
  },

  switchTab(tabId) {
    this.currentTab = tabId;
    this.pageStack = [`page-${tabId}`];
    
    // 更新底部 Tabbar 高亮
    document.querySelectorAll('.mp-tabbar .tab-item').forEach(item => {
      item.classList.toggle('is-active', item.dataset.tab === tabId);
    });

    // 更新页面 active 状态
    document.querySelectorAll('.mp-page').forEach(page => {
      page.classList.toggle('is-active', page.id === `page-${tabId}`);
    });

    // 如果切到了"我的"，刷新 AI 配额展示
    if (tabId === 'profile') {
      updateAiQuotaUI();
    }
  },

  navigateTo(pageId) {
    // 添加到路由栈
    this.pageStack.push(pageId);
    
    // 打开子页面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.classList.add('is-active');
    }
  },

  back() {
    if (this.pageStack.length <= 1) return;
    
    const curPageId = this.pageStack.pop();
    const curPage = document.getElementById(curPageId);
    if (curPage) {
      curPage.classList.remove('is-active');
    }
    
    // 渲染退回后的当前页面数据
    const prevPageId = this.pageStack[this.pageStack.length - 1];
    if (prevPageId === 'page-crew-detail') {
      const crew = crews[currentCrewId];
      // 触发详情重绘
      renderCrewWorkspace(crew);
    } else if (prevPageId === 'page-profile') {
      updateAiQuotaUI();
    }
  }
};

// ================= 4. AI 免费配额管理 (F6) =================
// 静默记录每次 AI 调用并扣减每日免费配额，同步更新"我的"页面配额环
function logApiCall(apiPath, method, status, details, tokensUsed, costYuan) {
  // 仅对真实消耗模型能力的调用计数 (排行程 / OCR / 攻略生成 / POI 检索)
  if (/itinerary|ocr|guide|poi\/search/.test(apiPath)) {
    aiUsedToday = Math.min(AI_DAILY_QUOTA, aiUsedToday + 1);
  }
  updateAiQuotaUI();
}

// 更新个人中心 AI 配额环与进度条
function updateAiQuotaUI() {
  const remaining = Math.max(0, AI_DAILY_QUOTA - aiUsedToday);
  const percent = Math.round((remaining / AI_DAILY_QUOTA) * 100);

  const ringEl = document.getElementById('aiQuotaRing');
  if (ringEl) ringEl.style.setProperty('--ring-pct', percent + '%');

  const percentEl = document.getElementById('aiQuotaPercent');
  if (percentEl) percentEl.textContent = percent;

  const remainingEl = document.getElementById('aiQuotaRemaining');
  if (remainingEl) remainingEl.textContent = remaining;

  const barEl = document.getElementById('aiQuotaBar');
  if (barEl) barEl.style.width = percent + '%';
}

// ================= 5. 地图引擎：动态 SVG 绘制 =================
function drawInteractiveMap(crew) {
  const mapSvg = document.getElementById('mapSvg');
  const pinsContainer = document.getElementById('mapPinsContainer');
  if (!mapSvg || !pinsContainer) return;

  mapSvg.innerHTML = '';
  pinsContainer.innerHTML = '';

  const confirmedStops = crew.places.filter(p => p.status === 'confirmed');
  const candidateStops = crew.places.filter(p => p.status === 'candidate');

  // 1. 绘制网格背景线（适配新 viewBox 360x320）
  mapSvg.innerHTML += `
    <line x1="0" y1="160" x2="360" y2="160" stroke="#E8DDD0" stroke-dasharray="4,4" stroke-width="1" />
    <line x1="180" y1="0" x2="180" y2="320" stroke="#E8DDD0" stroke-dasharray="4,4" stroke-width="1" />
    <line x1="0" y1="80" x2="360" y2="80" stroke="#EDE3D6" stroke-dasharray="2,6" stroke-width="0.5" />
    <line x1="0" y1="240" x2="360" y2="240" stroke="#EDE3D6" stroke-dasharray="2,6" stroke-width="0.5" />
  `;

  // 2. 如果存在确认点，根据顺序连线
  if (confirmedStops.length > 1) {
    let pathD = `M ${confirmedStops[0].x} ${confirmedStops[0].y}`;
    for (let idx = 1; idx < confirmedStops.length; idx++) {
      pathD += ` L ${confirmedStops[idx].x} ${confirmedStops[idx].y}`;
    }
    
    // 渲染背景虚线和高亮游走实线
    mapSvg.innerHTML += `
      <path class="route-polyline" d="${pathD}" fill="none" stroke="#4FA8DB" stroke-width="4" stroke-linecap="round" stroke-dasharray="6,4" />
      <path class="route-active-line" d="${pathD}" fill="none" stroke="#FF6B5B" stroke-width="4" stroke-linecap="round" />
    `;
  }

  // 3. 动态渲染 confirmed Pin 地标气泡
  // Y 坐标缩放：旧地图高 180px → 新地图动态高度，按比例放大
  const mapWrap = mapSvg.closest('.map-canvas-full') || mapSvg.parentElement;
  const mapH = mapWrap ? mapWrap.offsetHeight : 320;
  const yScale = Math.max(1.4, mapH / 180);

  confirmedStops.forEach((place, index) => {
    const isActive = index === 0 ? 'is-active' : '';
    const scaledY = place.y * yScale;
    pinsContainer.innerHTML += `
      <div class="map-pin pin-1 ${isActive}" data-place-id="${place.id}" style="top: ${scaledY}px; left: ${place.x}px;">
        <span class="pin-badge">${index + 1}</span>
        <div class="pin-popup">${place.name} <span class="pin-vote">${place.votes}想去</span></div>
      </div>
    `;
  });

  // 4. 动态渲染 candidate Pin 地标
  candidateStops.forEach((place) => {
    const scaledY = place.y * yScale;
    pinsContainer.innerHTML += `
      <div class="map-pin pin-candidate" data-place-id="${place.id}" style="top: ${scaledY}px; left: ${place.x}px;">
        <span class="pin-badge">备</span>
        <div class="pin-popup">${place.name} (备选)</div>
      </div>
    `;
  });

  // 5. 绑定 Pin 点击事件，联动高亮 PlaceCard
  pinsContainer.querySelectorAll('.map-pin').forEach(pin => {
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      const pid = pin.dataset.placeId;
      pinsContainer.querySelectorAll('.map-pin').forEach(p => p.classList.remove('is-active'));
      pin.classList.add('is-active');

      // 滚动/联动高亮地点卡片列表
      document.querySelectorAll('.place-card-item').forEach(card => {
        const isMatched = card.dataset.placeCardId === pid;
        card.classList.toggle('is-selected', isMatched);
        if (isMatched) {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });
  });
}

// ================= 6. 首页 & 发现 & 详情渲染 =================
function renderHomeCrews() {
  const container = document.getElementById('homeCrewCardsList');
  if (!container) return;

  container.innerHTML = Object.values(crews).map(crew => {
    const isDone = crew.status === 'done';
    const statusText = isDone ? '已结算' : '拼局协作中';
    const badgeCls = isDone ? 'done' : '';
    const stopCount = crew.places.filter(p => p.status === 'confirmed').length;

    return `
      <div class="crew-card" data-crew-id="${crew.id}">
        <div class="crew-card-title">${crew.title}</div>
        <div class="crew-card-date"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> 日期: ${crew.date} · 出发: ${crew.startPoint}</div>
        <div class="crew-card-info-row">
          <div class="crew-card-meta"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> ${crew.members.length} 人同行 · 已排入 ${stopCount} 处地点</div>
          <span class="crew-card-status-badge ${badgeCls}">${statusText}</span>
        </div>
      </div>
    `;
  }).join('');

  // 绑定点击进入详情路由
  container.querySelectorAll('.crew-card').forEach(card => {
    card.addEventListener('click', () => {
      currentCrewId = card.dataset.crewId;
      const crew = crews[currentCrewId];
      renderCrewWorkspace(crew);
      PageRouter.navigateTo('page-crew-detail');
      
      logApiCall('/api/v1/crews/' + currentCrewId, 'GET', 200, 'Crew detail fetched', 180, 0.005);
    });
  });
}

function renderGuidesFeed() {
  const container = document.getElementById('feedList');
  if (!container) return;

  container.innerHTML = feedGuides.map(guide => `
    <div class="feed-card" data-guide-crew="${guide.crewId}" data-guide-title="${guide.title}">
      <div class="feed-card-header">
        <h4 class="feed-card-title">${guide.title}</h4>
        <span class="feed-card-reps">${guide.reps}</span>
      </div>
      <div class="feed-card-route-preview">
        <span class="feed-stop-span"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> 丰储街早市</span>
        <span class="feed-arrow-span">➔</span>
        <span class="feed-stop-span">两来风羊肉馆</span>
        <span class="feed-arrow-span">➔</span>
        <span class="feed-stop-span">云龙湖</span>
      </div>
      <div class="feed-card-footer">
        <span class="feed-card-author">
          <span class="feed-author-avatar">${guide.authorAvatar}</span>
          ${guide.author} 分享
        </span>
        <span class="feed-card-meta">人均参考: ${guide.cost}</span>
      </div>
    </div>
  `).join('');

  // 发现卡点击，跳转攻略详情页进行复刻
  container.querySelectorAll('.feed-card').forEach(card => {
    card.addEventListener('click', () => {
      const title = card.dataset.guideTitle;
      const tcrewId = card.dataset.guideCrew;
      
      openGuideDetailScreen(tcrewId, title);
    });
  });
}

// 渲染工作空间 (页面 4)
function renderCrewWorkspace(crew) {
  // 顶部与基础元素
  document.getElementById('headerCrewTitle').textContent = crew.title;
  document.getElementById('detailCrewTitle').textContent = crew.title;
  document.getElementById('detailCrewDate').textContent = crew.date;
  document.getElementById('detailCrewMeta').textContent = `${crew.members.length} 人 · ${crew.startPoint}出发`;

  // 1. 头像
  const avatarsEl = document.getElementById('detailCrewMembers');
  if (avatarsEl) {
    avatarsEl.innerHTML = crew.members.map((m, index) => `
      <span class="avatar ${index === 0 ? 'owner' : ''}" title="${m}">${m.charAt(0)}</span>
    `).join('');
  }

  // 2. 地图 & 地点列表
  drawInteractiveMap(crew);
  renderPlacesList(crew);

  // 3. AI 行程路线
  renderItineraryStops(crew);

  // 4. AA账本
  calculateLedgerDebt(crew);
}

// 渲染地点列表 (F2 & F3)
function renderPlacesList(crew) {
  const container = document.getElementById('placeCardsList');
  if (!container) return;

  const currentFilter = document.querySelector('.pool-filter .filter-chip.is-active')?.dataset.filter || 'all';

  let filtered = crew.places;
  if (currentFilter === 'confirmed') filtered = crew.places.filter(p => p.status === 'confirmed');
  if (currentFilter === 'candidate') filtered = crew.places.filter(p => p.status === 'candidate');

  container.innerHTML = filtered.map(place => `
    <div class="place-card-item" data-place-card-id="${place.id}">
      <div class="place-info-main">
        <div class="place-title-row">
          <span class="place-category-tag">${place.cat}</span>
          <span class="place-name">${place.name}</span>
        </div>
        <span class="place-sub-detail">${place.detail}</span>
      </div>
      <div class="place-actions">
        <!-- Vote button -->
        <div class="vote-control-row">
          <button class="btn-vote-choice btn-vote-up" type="button" data-vote-up="${place.id}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg> ${place.votes}</button>
        </div>
        <button class="btn-toggle-checkin ${place.status === 'confirmed' ? 'is-done' : ''}" data-place-toggle="${place.id}">
          ${place.status === 'confirmed' ? '已排入行程' : '+ 标记想去'}
        </button>
      </div>
    </div>
  `).join('');

  // 更新计数
  document.getElementById('totalPlacesCount').textContent = crew.places.length;
  document.getElementById('countAll').textContent = crew.places.length;
  document.getElementById('countConfirmed').textContent = crew.places.filter(p => p.status === 'confirmed').length;
  document.getElementById('countCandidate').textContent = crew.places.filter(p => p.status === 'candidate').length;
  const mapStopsCount = document.getElementById('mapStopsCount');
  if (mapStopsCount) mapStopsCount.textContent = crew.places.filter(p => p.status === 'confirmed').length;

  // 绑定投票事件
  container.querySelectorAll('[data-vote-up]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pid = btn.dataset.voteUp;
      const pl = crew.places.find(p => p.id === pid);
      if (pl) {
        pl.votes += 1;
        renderPlacesList(crew);
        
        logApiCall('/api/v1/places/vote', 'POST', 200, `Voted for ${pl.name}`, 120, 0.003);
      }
    });
  });

  // 标记想去/取消排入事件
  container.querySelectorAll('[data-place-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pid = btn.dataset.placeToggle;
      const pl = crew.places.find(p => p.id === pid);
      if (pl) {
        pl.status = pl.status === 'confirmed' ? 'candidate' : 'confirmed';
        
        // 自动同步更新 AI 的 Stops
        syncPlanStops(crew);
        renderCrewWorkspace(crew);
        
        logApiCall('/api/v1/places/' + pid + '/status', 'PUT', 200, `Toggled place status to ${pl.status}`, 140, 0.004);
      }
    });
  });
}

// 确保已确认地点在 Itinerary Timeline 里同步更新
function syncPlanStops(crew) {
  const currentPlanName = crew.currentPlan;
  const plan = crew.plans[currentPlanName];
  if (!plan) return;

  const confirmedPlaces = crew.places.filter(p => p.status === 'confirmed');

  // 过滤或新增站点
  const nextStops = [];
  confirmedPlaces.forEach((p, idx) => {
    const existing = plan.stops.find(s => s.id === p.id);
    if (existing) {
      nextStops.push(existing);
    } else {
      // 自动计算估算时间段
      const startHour = 9 + idx * 3;
      const timeStr = `${startHour.toString().padStart(2, '0')}:30`;
      nextStops.push({
        time: timeStr,
        type: p.cat,
        name: p.name,
        detail: `系统自动规划顺路站点`,
        votes: `${p.votes}想去`,
        id: p.id
      });
    }
  });

  plan.stops = nextStops;
}

// ================= 7. AI 智能行程 (F4) ＆ 手动排序 =================
function renderItineraryStops(crew) {
  const timeline = document.getElementById('itineraryTimelineStops');
  if (!timeline) return;

  const currentPlanName = crew.currentPlan;
  const plan = crew.plans[currentPlanName] || Object.values(crew.plans)[0];
  if (!plan) {
    timeline.innerHTML = '<p class="live-status">没有确认的行程点。请先到地点池确认加入！</p>';
    return;
  }

  // 渲染 AI 头像与文案
  const aiStatusText = document.querySelector('[data-ai-status]');
  const aiCopyText = document.querySelector('[data-ai-copy]');
  const reasonText = document.querySelector('[data-reason]');
  const unselectedText = document.getElementById('unselectedPlaces');

  if (aiStatusText) aiStatusText.textContent = crew.manualAdjusted ? '路线已被手动微调' : plan.title;
  if (aiCopyText) aiCopyText.textContent = plan.copy;
  if (reasonText) reasonText.textContent = plan.reason;
  if (unselectedText) unselectedText.textContent = plan.unselected;

  // 手动微调 badge
  const badgeEl = document.getElementById('manualAdjustBadge');
  if (badgeEl) badgeEl.style.display = crew.manualAdjusted ? 'inline' : 'none';

  // 渲染 stops
  timeline.innerHTML = plan.stops.map((stop, index) => {
    const isFirst = index === 0;
    const isLast = index === plan.stops.length - 1;
    const isDone = stop.isDone ? 'is-done' : '';

    return `
      <div class="stop ${isDone}" data-stop-id="${stop.id}">
        <span class="stop-time">${stop.time}</span>
        <div class="stop-main" style="flex:1; margin-left: 8px;">
          <span class="stop-type">${stop.type}</span>
          <span class="stop-name" style="cursor:pointer;" onclick="toggleStopCheckin('${stop.id}')">${stop.name}</span>
          <span class="stop-detail">${stop.detail}</span>
        </div>
        <span class="vote" style="margin-right:8px;">${stop.votes}</span>
        
        <!-- Reorder Arrows -->
        <div class="stop-reorder-controls">
          <button class="btn-reorder-arrow" type="button" onclick="moveItineraryStop(-1, ${index})" ${isFirst ? 'disabled' : ''}>▲</button>
          <button class="btn-reorder-arrow" type="button" onclick="moveItineraryStop(1, ${index})" ${isLast ? 'disabled' : ''}>▼</button>
        </div>
      </div>
    `;
  }).join('');
}

// 绑定行程打卡 (F3)
window.toggleStopCheckin = function(stopId) {
  const crew = crews[currentCrewId];
  const plan = crew.plans[crew.currentPlan];
  const stop = plan.stops.find(s => s.id === stopId);
  if (stop) {
    stop.isDone = !stop.isDone;
    renderItineraryStops(crew);
    
    const liveText = document.querySelector('[data-live-status]');
    if (liveText) {
      liveText.textContent = stop.isDone 
        ? `打卡已标记！奶糖可以从「${stop.name}」直接发起记账。`
        : '取消打卡标记。';
    }

    logApiCall('/api/v1/itinerary/checkin', 'POST', 200, `Toggled checkin for ${stop.name}`, 110, 0.003);
  }
};

// 向上/下移动站点 (F4 手动排序)
window.moveItineraryStop = function(direction, index) {
  const crew = crews[currentCrewId];
  const plan = crew.plans[crew.currentPlan];
  const stops = plan.stops;

  if (direction === -1 && index > 0) {
    // 向上移动
    const temp = stops[index];
    stops[index] = stops[index - 1];
    stops[index - 1] = temp;
  } else if (direction === 1 && index < stops.length - 1) {
    // 向下移动
    const temp = stops[index];
    stops[index] = stops[index + 1];
    stops[index + 1] = temp;
  }

  // 交换完毕后，标记已手动微调，重绘地图和 timeline
  crew.manualAdjusted = true;
  
  // 调整地图上的顺序 coordinates
  const newPlacesOrder = [];
  stops.forEach(st => {
    const pl = crew.places.find(p => p.id === st.id);
    if (pl) newPlacesOrder.push(pl);
  });
  // 将没有排入的 candidate 依旧附在最后
  crew.places.forEach(pl => {
    if (pl.status !== 'confirmed') newPlacesOrder.push(pl);
  });
  crew.places = newPlacesOrder;

  renderCrewWorkspace(crew);
  
  logApiCall('/api/v1/itinerary/reorder', 'POST', 200, `Manually swapped stop index ${index}`, 160, 0.004);
};

// 重新排一排按钮逻辑
function triggerAiReplan(customPrompt = '') {
  const replanBtn = document.querySelector('[data-replan]');
  if (replanBtn) replanBtn.disabled = true;

  const statusText = document.querySelector('[data-ai-status]');
  statusText.textContent = customPrompt ? `正在按要求“${customPrompt}”重排...` : '芝士正在核对大家的投票和路线...';

  // 1秒后模拟 AI 运算返回
  setTimeout(() => {
    const crew = crews[currentCrewId];
    
    // 清除手动修改标记
    crew.manualAdjusted = false;

    // 关键词简易匹配
    if (customPrompt.includes('多睡') || customPrompt.includes('迟')) {
      // 延迟时间
      const plan = crew.plans[crew.currentPlan];
      plan.stops.forEach(st => {
        const [h, m] = st.time.split(':');
        st.time = `${(parseInt(h) + 1).toString().padStart(2,'0')}:${m}`;
      });
      plan.copy = '考虑到大家想要多睡一小时，芝士自动将出发时间顺延至上午 10:40。';
      logApiCall('/api/v1/itinerary/generate', 'POST', 200, 'AI shifted timeline based on sleep constraint', 1450, 0.045);
    } else if (customPrompt.includes('甜品') || customPrompt.includes('糖')) {
      const plan = crew.plans[crew.currentPlan];
      // 插入一个甜品点
      if (!plan.stops.some(s => s.name.includes('甜品'))) {
        plan.stops.splice(2, 0, {
          time: '16:00',
          type: '甜品',
          name: '蜜雪冰城/徐州传统糕点',
          detail: '下午补充能量甜点，打车路上顺路',
          votes: '5想去',
          id: 'temp-dessert'
        });
      }
      plan.copy = '已在午饭后、傍晚散步前插入大家高票通过的传统甜品店。';
      logApiCall('/api/v1/itinerary/generate', 'POST', 200, 'AI inserted dessert stop stop', 1520, 0.048);
    } else if (customPrompt.includes('东站') || customPrompt.includes('高铁')) {
      // 切换为高铁友好路线
      crew.currentPlan = 'easy';
      logApiCall('/api/v1/itinerary/generate', 'POST', 200, 'AI switched plan to easy-trail (高铁友好)', 1380, 0.042);
    } else {
      // 默认切换
      crew.currentPlan = crew.currentPlan === 'food' ? 'easy' : 'food';
      logApiCall('/api/v1/itinerary/generate', 'POST', 200, 'AI re-evaluated distance and votes route', 1240, 0.038);
    }

    renderCrewWorkspace(crew);
    if (replanBtn) replanBtn.disabled = false;
  }, 1200);
}

// ================= 8. AA 账本与最少债务化简 (F5) =================
function calculateLedgerDebt(crew) {
  const memberPaid = {};
  const memberOwed = {};
  
  // 初始化每个成员
  crew.members.forEach(m => {
    memberPaid[m] = 0;
    memberOwed[m] = 0;
  });

  let totalExpense = 0;

  // 1. 遍历计算 paid & owed
  crew.expenses.forEach(exp => {
    totalExpense += exp.amount;
    memberPaid[exp.payer] = (memberPaid[exp.payer] || 0) + exp.amount;

    const count = exp.participants.length || crew.members.length;
    const share = exp.amount / count;
    exp.participants.forEach(p => {
      memberOwed[p] = (memberOwed[p] || 0) + share;
    });
  });

  // 2. 算每个人净额 (Paid - Owed)
  const netBalances = {};
  crew.members.forEach(m => {
    netBalances[m] = Math.round((memberPaid[m] - memberOwed[m]) * 100) / 100;
  });

  // 3. 渲染总消费和人均
  document.getElementById('statTotalExpense').textContent = `￥${Math.round(totalExpense)}`;
  document.getElementById('statAvgExpense').textContent = `￥${Math.round(totalExpense / crew.members.length)}`;
  document.getElementById('expenseCount').textContent = crew.expenses.length;

  // 预算进度条更新
  const budgetTotal = 1800;
  const budgetUsed = Math.round(totalExpense);
  const budgetPct = Math.min(100, Math.round(budgetUsed / budgetTotal * 100));
  const budgetUsedEl = document.getElementById('budgetUsed');
  const budgetTotalEl = document.getElementById('budgetTotal');
  const budgetFillEl = document.getElementById('budgetBarFill');
  if (budgetUsedEl) budgetUsedEl.textContent = budgetUsed.toLocaleString();
  if (budgetTotalEl) budgetTotalEl.textContent = budgetTotal.toLocaleString();
  if (budgetFillEl) budgetFillEl.style.width = budgetPct + '%';

  // 4. 渲染明细列表（带圆形分类图标 + 垃圾桶删除）
  const catIcons = {
    '午饭': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11h18M5 11v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V11M9 11V7a3 3 0 0 1 6 0v4"/></svg>',
    '晚饭': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1M6 8h12v9a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V8z"/></svg>',
    '早餐': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 13h12M6 13V8a6 6 0 0 1 12 0v5M8 13v4a4 4 0 0 0 8 0v-4"/></svg>',
    '交通': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17H3v-6l2-5h12l2 5v6h-2M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0"/></svg>',
    '娱乐': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    '零食': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    'default': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'
  };
  const catColors = {
    '午饭': 'var(--ochre)', '晚饭': 'var(--mauve)', '早餐': 'var(--sage)',
    '交通': 'var(--teal)', '娱乐': 'var(--clay)', '零食': 'var(--accent)'
  };

  const expenseListEl = document.getElementById('expenseList');
  if (expenseListEl) {
    expenseListEl.innerHTML = crew.expenses.map(exp => {
      const icon = catIcons[exp.place] || catIcons['default'];
      const catColor = catColors[exp.place] || 'var(--ink-soft)';
      return `
      <div class="expense-item">
        <div class="exp-icon-circle" style="background: ${catColor}20; color: ${catColor};">
          ${icon}
        </div>
        <div class="exp-main">
          <span class="exp-title">${exp.title}</span>
          <span class="exp-detail">${exp.payer} 垫付 · ${exp.participants.length} 人均分</span>
        </div>
        <div class="exp-right">
          <span class="exp-amount">￥${exp.amount.toFixed(0)}</span>
          <button class="btn-delete-expense" type="button" title="删除此账单" onclick="deleteExpenseItem('${exp.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div>
      </div>
    `;
    }).join('');
  }

  // 5. 渲染净额 Pill
  const netEl = document.getElementById('memberNetBalances');
  if (netEl) {
    netEl.innerHTML = crew.members.map(m => {
      const net = netBalances[m];
      const isPos = net > 0;
      const isNeg = net < 0;
      const cls = isPos ? 'positive' : (isNeg ? 'negative' : '');
      const prefix = isPos ? '应收 +' : (isNeg ? '应付 ' : '已平 ');
      return `<span class="net-pill ${cls}">${m}: ${prefix}￥${Math.abs(net).toFixed(2)}</span>`;
    }).join('');
  }

  // 6. 债务化简 (Greedy 对冲算法)
  const debtors = [];
  const creditors = [];

  Object.keys(netBalances).forEach(m => {
    const bal = netBalances[m];
    if (bal < -0.01) debtors.push({ name: m, amount: -bal });
    else if (bal > 0.01) creditors.push({ name: m, amount: bal });
  });

  const transfers = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);
    transfers.push({
      from: debtor.name,
      to: creditor.name,
      amount: Math.round(amount * 100) / 100,
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  // 7. 渲染建议
  const transferListEl = document.getElementById('transferList');
  if (transferListEl) {
    if (transfers.length === 0) {
      transferListEl.innerHTML = '<li>🎉 账目已完全清算，无需转账！</li>';
    } else {
      transferListEl.innerHTML = transfers.map(t => `
        <li><strong>${t.from}</strong> 需转给 <strong>${t.to}</strong> <strong>￥${t.amount.toFixed(2)}</strong></li>
      `).join('');
    }
  }
}

// 删除消费项目 (F5)
window.deleteExpenseItem = function(expId) {
  const crew = crews[currentCrewId];
  const idx = crew.expenses.findIndex(e => e.id === expId);
  if (idx !== -1) {
    const expName = crew.expenses[idx].title;
    crew.expenses.splice(idx, 1);
    calculateLedgerDebt(crew);
    
    logApiCall('/api/v1/expenses/' + expId, 'DELETE', 200, `Deleted expense "${expName}"`, 110, 0.002);
  }
};

// ================= 9. OCR 与链接解析模拟器 (F2) =================
function handleSimulatedOcr() {
  const laser = document.getElementById('ocrLaser');
  const ocrScanningStatus = document.getElementById('ocrScanningStatus');
  const ocrResultPreview = document.getElementById('ocrResultPreview');
  const ocrDropzone = document.getElementById('ocrDropzone');

  if (!laser || !ocrScanningStatus || !ocrResultPreview) return;

  // 开始扫描动效
  laser.style.display = 'block';
  ocrScanningStatus.style.display = 'flex';
  ocrResultPreview.style.display = 'none';

  logApiCall('/api/v1/ocr', 'POST', 'SCANNING', 'Laser scan started for screenshot', 256, 0.002);

  // 1.5 秒后完成
  setTimeout(() => {
    laser.style.display = 'none';
    ocrScanningStatus.style.display = 'none';
    ocrResultPreview.style.display = 'block';

    logApiCall('/api/v1/ocr', 'POST', 200, 'OCR parsed successfully', 512, 0.005);
    logApiCall('/api/v1/poi/search', 'GET', 200, 'Matched 1 POI candidate from OCR string', 120, 0.002);
  }, 1500);
}

function handleLinkParse() {
  const linkInput = document.getElementById('linkPasteInput');
  const linkLoadingStatus = document.getElementById('linkLoadingStatus');
  if (!linkInput || !linkLoadingStatus) return;

  const val = linkInput.value.trim();
  if (!val) return;

  linkLoadingStatus.style.display = 'block';

  // 1秒后模拟解析成功
  setTimeout(() => {
    linkLoadingStatus.style.display = 'none';
    
    // 新增地点
    const crew = crews[currentCrewId];
    const newPl = {
      id: `p_${Date.now()}`,
      name: '链接定位地锅鸡',
      cat: '午饭',
      detail: '从粘贴的链接溯源，经高德 POI 补全成功',
      votes: 1,
      status: 'candidate',
      x: 100 + Math.random() * 100,
      y: 40 + Math.random() * 100
    };
    crew.places.push(newPl);
    
    linkInput.value = '';
    
    // 退回
    PageRouter.back();
    
    logApiCall('/api/v1/places/link-parse', 'POST', 200, `Parsed link and auto-created place: ${newPl.name}`, 480, 0.012);
  }, 1000);
}

// ================= 10. 攻略详情与一键复刻 (F7) =================
function openGuideDetailScreen(tcrewId, guideTitle) {
  const crew = crews[tcrewId] || crews['crew1'];
  
  // 填充预览界面
  const titleEl = document.getElementById('guidePreviewTitle');
  if (titleEl) titleEl.textContent = guideTitle;

  renderGuideRoutePreview(crew);

  // 攻略复刻表单初始化默认值
  document.getElementById('repCrewTitle').value = `克隆自_${crew.title}`;

  // 打开页面
  PageRouter.navigateTo('page-guide-detail');

  logApiCall('/api/v1/guide/snapshot/' + tcrewId, 'GET', 200, 'Guide snapshot loaded', 140, 0.003);
}

function renderGuideRoutePreview(crew) {
  const container = document.getElementById('guideRoutePreview');
  if (!container) return;

  const showStops = document.getElementById('chkShowStops').checked;
  const showVotes = document.getElementById('chkShowVotes').checked;
  const showBudget = document.getElementById('chkShowBudget').checked;

  let htmlLines = [];

  const confirmed = crew.places.filter(p => p.status === 'confirmed');

  if (showStops) {
    confirmed.forEach((place, index) => {
      const voteHtml = showVotes ? ` (${place.votes}人想去)` : '';
      htmlLines.push(`<div class="guide-step"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> 第${index+1}站: ${place.name}${voteHtml}</div>`);
      if (index < confirmed.length - 1) {
        htmlLines.push(`<div class="guide-arrow"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg> 顺路前行约 15 分钟</div>`);
      }
    });
  } else {
    htmlLines.push('<div class="guide-step"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> 路线及顺序打卡已设为私密</div>');
  }

  if (showBudget) {
    htmlLines.push(`<div class="guide-budget-pill" style="margin-top:10px; font-weight:700; color:var(--coral-deep); font-size:12px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> 团队参考人均: ￥${crew.budgetRange} 元</div>`);
  }

  container.innerHTML = htmlLines.join('');
}

// 触发攻略发布
function handlePublishGuide() {
  const crew = crews[currentCrewId];
  
  // 将攻略圈追加一条记录
  const guideId = `guide_${Date.now()}`;
  const newGuide = {
    id: guideId,
    title: `${crew.title}实战吃逛攻略`,
    author: '张三',
    authorAvatar: '张',
    cost: `￥${crew.budgetRange}`,
    reps: '0次复刻',
    crewId: crew.id
  };

  feedGuides.unshift(newGuide);
  renderGuidesFeed();

  // 弹出提示并跳转
  alert('攻略发布成功！已对外生成私密分享卡片并推送至“攻略圈”。');
  
  // 重绘并打开该详情
  openGuideDetailScreen(crew.id, newGuide.title);

  logApiCall('/api/v1/guide/publish', 'POST', 200, `Published guide snapshot for ${crew.title}`, 980, 0.032);
}

// 攻略复刻执行
function handleReplicateAction(event) {
  event.preventDefault();
  
  // 从原局中克隆所有的地点
  const origCrew = crews[currentCrewId];
  const newTitle = document.getElementById('repCrewTitle').value;
  const newDate = document.getElementById('repCrewDate').value;
  const newMembersCount = parseInt(document.getElementById('repCrewMembers').value) || 5;

  const newCrewId = `crew_${Date.now()}`;
  
  // 深拷贝克隆地点
  const clonedPlaces = origCrew.places.map(p => ({
    ...p,
    id: `cloned_${p.id}_${Date.now()}`,
    status: p.status // 继承是否 confirmed 状态
  }));

  // 生成新成员列表
  const newMembers = usersList.slice(0, newMembersCount);

  // 初始化新局
  crews[newCrewId] = {
    id: newCrewId,
    title: newTitle,
    date: newDate,
    members: newMembers,
    startPoint: '自定出发地',
    budgetRange: origCrew.budgetRange,
    status: 'active',
    currentPlan: 'food',
    manualAdjusted: false,
    places: clonedPlaces,
    plans: JSON.parse(JSON.stringify(origCrew.plans)), // 继承原规划框架
    expenses: [] // 新局 AA 账本清零
  };

  // 绑定新局的 Stops id
  const nextCrew = crews[newCrewId];
  syncPlanStops(nextCrew);

  // 关闭 Modal
  document.getElementById('replicateModal').setAttribute('aria-hidden', 'true');

  // 提示成功，回首页展示
  alert(`复刻建局成功！已继承所有地点。现自动跳转到【${newTitle}】组局主战场！`);

  // 设置当前局，渲染并导航
  currentCrewId = newCrewId;
  renderHomeCrews();
  renderCrewWorkspace(nextCrew);

  // 路由跳转
  PageRouter.switchTab('home');
  PageRouter.navigateTo('page-crew-detail');

  logApiCall('/api/v1/crews/replicate', 'POST', 200, `Replicated crew into new ID: ${newCrewId}`, 1820, 0.055);
}

// ================= 11. 初始化与 DOM 事件绑定 =================
function initApp() {
  // 1. 初始化页面路由与首屏渲染
  PageRouter.init();
  renderHomeCrews();
  renderGuidesFeed();

  // 2. 首页“新建组局”表单提交
  const createCrewModal = document.getElementById('createCrewModal');
  const openCreateCrewBtn = document.getElementById('openCreateCrewBtn');
  const closeCreateCrewBtn = document.getElementById('closeCreateCrewModal');
  const createCrewForm = document.getElementById('createCrewForm');

  if (openCreateCrewBtn && createCrewModal) {
    openCreateCrewBtn.addEventListener('click', () => createCrewModal.setAttribute('aria-hidden', 'false'));
  }
  if (closeCreateCrewBtn && createCrewModal) {
    closeCreateCrewBtn.addEventListener('click', () => createCrewModal.setAttribute('aria-hidden', 'true'));
  }

  if (createCrewForm) {
    createCrewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('newCrewTitle').value;
      const date = document.getElementById('newCrewDate').value;
      const membersCount = parseInt(document.getElementById('newCrewMembers').value) || 6;
      const start = document.getElementById('newCrewStart').value || '北京南站';
      const budget = document.getElementById('newCrewBudget').value;

      const newCrewId = `crew_${Date.now()}`;
      crews[newCrewId] = {
        id: newCrewId,
        title,
        date,
        members: usersList.slice(0, membersCount),
        startPoint: start,
        budgetRange: budget,
        status: 'active',
        currentPlan: 'food',
        manualAdjusted: false,
        places: [
          { id: 'p100', name: '预设聚餐推荐地', cat: '午饭', detail: '开局 AI 匹配的经典美食地', votes: 1, status: 'confirmed', x: 100, y: 80 }
        ],
        plans: {
          food: {
            title: '芝士的推荐吃逛',
            copy: '开局推荐路线，包含预设地点。',
            reason: '初始一站地，适合迅速落脚。',
            unselected: '无',
            stops: [
              { time: '12:00', type: '午饭', name: '预设聚餐推荐地', detail: '系统自动生成站点', votes: '1想去', id: 'p100' }
            ]
          }
        },
        expenses: []
      };

      // 重新渲染首页，并关闭 modal
      renderHomeCrews();
      createCrewModal.setAttribute('aria-hidden', 'true');
      createCrewForm.reset();

      // 直接进入新局详情
      currentCrewId = newCrewId;
      renderCrewWorkspace(crews[newCrewId]);
      PageRouter.navigateTo('page-crew-detail');

      logApiCall('/api/v1/crews', 'POST', 200, `Created crew "${title}"`, 340, 0.008);
    });
  }

  // 3. 组局详情页返回首页
  document.getElementById('backToHomeBtn')?.addEventListener('click', () => {
    PageRouter.back();
  });

  // 4. 详情页内部子导航 Tab 切换
  document.querySelectorAll('.crew-sub-nav .sub-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.crew-sub-nav .sub-nav-item').forEach(x => x.classList.remove('is-active'));
      item.classList.add('is-active');

      const targetTab = item.dataset.crewTab;
      document.querySelectorAll('.crew-content .crew-tab-panel').forEach(p => {
        p.classList.toggle('is-active', p.id === `crew-panel-${targetTab}`);
      });
      
      // 切到地图时重绘
      if (targetTab === 'map') {
        drawInteractiveMap(crews[currentCrewId]);
      }
    });
  });

  // 5. 地点池筛选 Tab
  document.querySelectorAll('.pool-filter .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.pool-filter .filter-chip').forEach(x => x.classList.remove('is-active'));
      chip.classList.add('is-active');
      renderPlacesList(crews[currentCrewId]);
    });
  });

  // 6. 去添加地点子页面
  document.getElementById('goToAddPlaceBtn')?.addEventListener('click', () => {
    PageRouter.navigateTo('page-add-place');
  });
  document.getElementById('backToCrewBtn')?.addEventListener('click', () => {
    PageRouter.back();
  });

  // 7. 添加地点子 tab 切换
  document.querySelectorAll('.modal-sub-tabs .sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.modal-sub-tabs .sub-tab').forEach(x => x.classList.remove('is-active'));
      tab.classList.add('is-active');

      const mode = tab.dataset.addMode;
      document.querySelectorAll('.add-place-content .add-mode-panel').forEach(p => {
        p.classList.toggle('is-active', p.id === `addPanel${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
      });
    });
  });

  // 8. 模拟 OCR 截图上传点击
  document.getElementById('ocrDropzone')?.addEventListener('click', () => {
    handleSimulatedOcr();
  });

  // OCR 确认入库
  document.getElementById('btnOcrConfirm')?.addEventListener('click', () => {
    const name = document.getElementById('ocrConfirmName').value;
    const crew = crews[currentCrewId];
    
    // 入库
    const newPl = {
      id: `p_ocr_${Date.now()}`,
      name,
      cat: '晚饭',
      detail: '从截图 OCR 智能提取并入库',
      votes: 5,
      status: 'candidate',
      x: 275,
      y: 45
    };
    crew.places.push(newPl);
    
    // 清除 OCR 预览
    document.getElementById('ocrResultPreview').style.display = 'none';
    document.getElementById('ocrDropzone').style.display = 'block';

    // 返回组局工作空间
    PageRouter.back();
  });

  // 链接确认入库
  document.getElementById('btnLinkConfirm')?.addEventListener('click', () => {
    handleLinkParse();
  });

  // POI 模拟模糊检索
  const searchInput = document.getElementById('poiSearchInput');
  const searchResults = document.getElementById('poiSearchResults');
  if (searchInput && searchResults) {
    // 监听输入
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim();
      if (q.length < 2) {
        searchResults.innerHTML = '';
        return;
      }
      
      // 预置候选
      const mockPois = [
        { name: `老徐州地锅鸡 (${q}分店)`, addr: '云龙区解放南路202号 · 距离 1.1km', cat: '午饭', x: 120, y: 60 },
        { name: `徐州彭城饭庄 - ${q}特色菜`, addr: '彭城路18号 · 高德评分 4.7', cat: '午饭', x: 210, y: 80 },
        { name: `${q}大牌档`, addr: '泉山区青年路22号 · 营业中', cat: '晚饭', x: 80, y: 140 }
      ];

      searchResults.innerHTML = mockPois.map(poi => `
        <div class="candidate-item">
          <div>
            <strong>${poi.name}</strong>
            <p class="candidate-addr">${poi.addr}</p>
          </div>
          <button class="btn-confirm-poi" type="button" data-poi-name="${poi.name}" data-poi-cat="${poi.cat}" data-poi-x="${poi.x}" data-poi-y="${poi.y}">确认入库</button>
        </div>
      `).join('');

      // 绑定每个确认入库事件
      searchResults.querySelectorAll('.btn-confirm-poi').forEach(btn => {
        btn.addEventListener('click', () => {
          const crew = crews[currentCrewId];
          const name = btn.dataset.poiName;
          const cat = btn.dataset.poiCat;
          const x = parseInt(btn.dataset.poiX);
          const y = parseInt(btn.dataset.poiY);

          crew.places.push({
            id: `p_search_${Date.now()}`,
            name,
            cat,
            detail: '人工地图 POI 检索添加',
            votes: 1,
            status: 'candidate',
            x,
            y
          });

          // 清空输入
          searchInput.value = '';
          searchResults.innerHTML = '';

          // 返回
          PageRouter.back();

          logApiCall('/api/v1/places', 'POST', 200, `Confirmed POI and added place: ${name}`, 140, 0.003);
        });
      });
    });
  }

  // 9. AI 重排一排按钮
  document.querySelector('[data-replan]')?.addEventListener('click', () => {
    triggerAiReplan();
  });

  const adoptBtn = document.getElementById('btnAdoptItinerary');
  if (adoptBtn) {
    adoptBtn.addEventListener('click', () => {
      alert('路线采用成功！已冻结当前站点顺序并同步至主地图。');
      const crew = crews[currentCrewId];
      crew.manualAdjusted = false;
      renderCrewWorkspace(crew);

      logApiCall('/api/v1/itinerary/adopt', 'POST', 200, 'Itinerary adopted', 120, 0.002);
    });
  }

  // AI 快捷指令 chips
  document.querySelectorAll('.chip-quick-prompt').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.textContent.trim();
      triggerAiReplan(prompt);
    });
  });

  // AI Prompt 输入发送
  const btnPromptSend = document.getElementById('btnAiPromptSend');
  const inputPrompt = document.getElementById('aiPromptInput');
  if (btnPromptSend && inputPrompt) {
    btnPromptSend.addEventListener('click', () => {
      const q = inputPrompt.value.trim();
      if (q) {
        triggerAiReplan(q);
        inputPrompt.value = '';
      }
    });
    inputPrompt.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const q = inputPrompt.value.trim();
        if (q) {
          triggerAiReplan(q);
          inputPrompt.value = '';
        }
      }
    });
  }

  // 10. 账本 - 去记账 Modal
  const addExpenseModal = document.getElementById('addExpenseModal');
  const goToAddExpenseBtn = document.getElementById('goToAddExpenseBtn');
  const closeAddExpenseBtn = document.getElementById('closeAddExpenseModal');
  const addExpenseForm = document.getElementById('addExpenseForm');

  if (goToAddExpenseBtn && addExpenseModal) {
    goToAddExpenseBtn.addEventListener('click', () => {
      const crew = crews[currentCrewId];

      // 动态填充垫付人选项
      const payerSel = document.getElementById('expPayer');
      payerSel.innerHTML = crew.members.map(m => `<option value="${m}">${m}</option>`).join('');

      // 动态填充分摊人员复选框 (F5)
      const listCheck = document.getElementById('expParticipantsList');
      listCheck.innerHTML = crew.members.map(m => `
        <label class="participant-check-label">
          <input type="checkbox" name="expShareMember" value="${m}" checked> ${m}
        </label>
      `).join('');

      // 动态填充关联地点选项
      const placeSel = document.getElementById('expPlaceSelect');
      const confirmedPlaces = crew.places.filter(p => p.status === 'confirmed');
      placeSel.innerHTML = `
        <option value="无关联">-- 无关联地点 --</option>
        ${confirmedPlaces.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
        <option value="打车交通">打车交通费</option>
      `;

      addExpenseModal.setAttribute('aria-hidden', 'false');
    });
  }

  if (closeAddExpenseBtn && addExpenseModal) {
    closeAddExpenseBtn.addEventListener('click', () => addExpenseModal.setAttribute('aria-hidden', 'true'));
  }

  if (addExpenseForm) {
    addExpenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const crew = crews[currentCrewId];

      const title = document.getElementById('expName').value || '未命名消费';
      const amount = parseFloat(document.getElementById('expAmount').value) || 0;
      const payer = document.getElementById('expPayer').value;
      const place = document.getElementById('expPlaceSelect').value;

      // 收集选中的分摊人
      const checkboxes = document.querySelectorAll('input[name="expShareMember"]:checked');
      const selectedMembers = Array.from(checkboxes).map(cb => cb.value);

      if (selectedMembers.length === 0) {
        alert('请至少选择一个分摊成员！');
        return;
      }

      // 新增账单
      const newExp = {
        id: `e_${Date.now()}`,
        title,
        amount,
        payer,
        place,
        participants: selectedMembers
      };

      crew.expenses.push(newExp);
      
      // 关闭并重绘
      addExpenseModal.setAttribute('aria-hidden', 'true');
      addExpenseForm.reset();
      calculateLedgerDebt(crew);

      logApiCall('/api/v1/expenses', 'POST', 200, `Recorded expense "${title}" (split among ${selectedMembers.length} members)`, 220, 0.005);
    });
  }

  // 11. 复制结算文本按钮
  const copyBtn = document.getElementById('copySettlementBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const listEl = document.getElementById('transferList');
      if (listEl) {
        const text = Array.from(listEl.querySelectorAll('li')).map(li => li.innerText).join('\n');
        
        // 模拟复制
        navigator.clipboard?.writeText(text).then(() => {
          copyBtn.textContent = '已成功复制文本到剪贴板！';
        }).catch(() => {
          copyBtn.textContent = '复制成功 (环境暂不支持Clipboard API)';
        });
        
        setTimeout(() => {
          copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> 复制结算结果文本';
        }, 2000);
      }
    });
  }

  // 12. 发布攻略与复刻路由跳转
  document.getElementById('goToPublishGuideBtn')?.addEventListener('click', () => {
    handlePublishGuide();
  });
  document.getElementById('backToCrewFromGuideBtn')?.addEventListener('click', () => {
    PageRouter.back();
  });

  // 脱敏勾选框联动预览刷新 (F7)
  const toggles = ['chkShowStops', 'chkShowVotes', 'chkShowBudget'];
  toggles.forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      const crew = crews[currentCrewId];
      renderGuideRoutePreview(crew);
    });
  });

  // 打开复刻 modal
  const replicateModal = document.getElementById('replicateModal');
  const openReplicateBtn = document.getElementById('openReplicateModalBtn');
  const closeReplicateBtn = document.getElementById('closeReplicateModal');
  const replicateForm = document.getElementById('replicateForm');

  if (openReplicateBtn && replicateModal) {
    openReplicateBtn.addEventListener('click', () => {
      const crew = crews[currentCrewId];
      document.getElementById('repCrewTitle').value = `复刻版_${crew.title}`;
      replicateModal.setAttribute('aria-hidden', 'false');
    });
  }

  if (closeReplicateBtn && replicateModal) {
    closeReplicateBtn.addEventListener('click', () => replicateModal.setAttribute('aria-hidden', 'true'));
  }

  if (replicateForm) {
    replicateForm.addEventListener('submit', (e) => {
      handleReplicateAction(e);
    });
  }

  // 13. 个人中心 - 设置开关与条目交互
  // 开关切换
  document.querySelectorAll('[data-toggle]').forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('is-on');
    });
  });

  // 设置条目点击 (模拟跳转/反馈)
  const settingsLabels = {
    profile: '个人资料编辑页（昵称、头像、吃货标签）',
    wallet: '我的积分：复刻攻略、邀好友赚积分',
    privacy: '隐私保护说明：账单与头像默认脱敏，归档可删',
    archive: '归档组局管理（已结束的局可归档，账单可删）',
    cache: '已清理本地缓存 12.4 MB',
    feedback: '意见反馈：感谢你的建议，我们会尽快处理！',
    about: '馋猫局儿 v0.1.0 · 周末组局 AI 助手',
    logout: '已退出登录（原型演示）'
  };
  document.querySelectorAll('[data-settings]').forEach(item => {
    item.addEventListener('click', () => {
      const key = item.dataset.settings;
      const msg = settingsLabels[key] || '功能开发中';
      if (key === 'cache') {
        const valEl = item.querySelector('.settings-item-value');
        if (valEl) valEl.textContent = '0 MB';
      }
      alert(msg);
    });
  });

  // 初始渲染 AI 配额环
  updateAiQuotaUI();

  // 14. 地图底部抽屉交互 — 点击手柄展开/收起
  const sheetHandleBar = document.getElementById('sheetHandleBar');
  const mapBottomSheet = document.getElementById('mapBottomSheet');
  if (sheetHandleBar && mapBottomSheet) {
    sheetHandleBar.addEventListener('click', () => {
      mapBottomSheet.classList.toggle('is-expanded');
    });
  }
}

// 统一执行初始化，防范 Chrome file:// 协议 DOMContentLoaded 事件提早触发导致失效的问题
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
