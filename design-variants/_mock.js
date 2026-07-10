/* Мок-данные и общие помощники для Binance-концептов MRRket */
const STARTUPS = [
  { name:'PixelForge',  desc:'AI-генерация иллюстраций',     cat:'AI',         mrr:21700, growth:24.8, rev:260400, price:980000, sale:true  },
  { name:'NotifyHub',   desc:'Push-уведомления для SaaS',    cat:'DevTools',   mrr:18420, growth:12.4, rev:221000, price:660000, sale:true  },
  { name:'DataPulse',   desc:'Продуктовая аналитика',        cat:'Analytics',  mrr:15900, growth:9.1,  rev:190800, price:572000, sale:true  },
  { name:'SecureVault', desc:'Менеджер секретов для команд', cat:'Security',   mrr:13800, growth:6.7,  rev:165600, price:497000, sale:true  },
  { name:'MailFlow',    desc:'Email-автоматизация',          cat:'Marketing',  mrr:12400, growth:8.2,  rev:148800, price:446000, sale:true  },
  { name:'LinguaBot',   desc:'AI-перевод сайтов на лету',    cat:'AI',         mrr:11200, growth:17.3, rev:134400, price:504000, sale:true  },
  { name:'CloudLedger', desc:'Бухгалтерия для стартапов',    cat:'FinTech',    mrr:9850,  growth:-2.1, rev:118200, price:354000, sale:false },
  { name:'ShopMetrics', desc:'Аналитика для e-commerce',     cat:'E-commerce', mrr:8600,  growth:3.4,  rev:103200, price:310000, sale:false },
  { name:'FormPilot',   desc:'No-code конструктор форм',     cat:'NoCode',     mrr:7300,  growth:5.6,  rev:87600,  price:262000, sale:false },
  { name:'TaskHive',    desc:'Управление проектами',         cat:'SaaS',       mrr:5400,  growth:-4.3, rev:64800,  price:194000, sale:false },
];
const TOTAL_MRR = STARTUPS.reduce((s, x) => s + x.mrr, 0);
const CATS = ['Все', 'AI', 'SaaS', 'DevTools', 'Analytics', 'FinTech', 'Marketing', 'E-commerce', 'Security', 'NoCode'];

const F = {
  usd: n => '$' + Math.round(n).toLocaleString('ru-RU'),
  pct: n => (n > 0 ? '+' : '') + n.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %',
  cls: n => n >= 0 ? 'up' : 'down',
  mult: s => '×' + (s.price / (s.mrr * 12)).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
};

const AVA = ['#F0B90B', '#0ECB81', '#627EEA', '#F6465D', '#9C6CFF', '#3B82F6', '#F97316', '#14B8A6', '#EC4899', '#84CC16'];
function avatar(s, size = 36) {
  const i = [...s.name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVA.length;
  return `<span class="ava" style="width:${size}px;height:${size}px;background:${AVA[i]};font-size:${Math.round(size * .44)}px">${s.name[0]}</span>`;
}

/* набор простых line-иконок в духе Binance */
const I = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.6-3.8 4.8-5 8-5s6.4 1.2 8 5"/>',
  bell: '<path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3.6 3.2 14.4 0 18M12 3c-3.2 3.6-3.2 14.4 0 18"/>',
  star: '<path d="M12 3.5l2.6 5.4 6 .7-4.4 4.1 1.2 5.9L12 16.7l-5.4 2.9 1.2-5.9-4.4-4.1 6-.7z"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M15.5 14.5h2"/>',
  chart: '<path d="M3 21h18M7 17v-6M12 17V7M17 17v-9"/>',
  trend: '<path d="M3 17l5.5-5.5 4 4L21 7"/><path d="M15 7h6v6"/>',
  set: '<path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.5"/><circle cx="8" cy="17" r="2.5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  chat: '<path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"/>',
  chevD: '<path d="M6 9l6 6 6-6"/>',
  chevR: '<path d="M9 6l6 6-6 6"/>',
  dl: '<path d="M12 3v12M6 10l6 6 6-6M4 21h16"/>',
  swap: '<path d="M7 4v13M3.5 7.5L7 4l3.5 3.5M17 20V7M13.5 16.5L17 20l3.5-3.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1.2-3.4 3.8-4.5 6.5-4.5s5.3 1.1 6.5 4.5"/><path d="M16 5a3.5 3.5 0 0 1 0 7M17.5 15.7c2 .6 3.4 1.9 4 4.3"/>',
  shield: '<path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  bolt: '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
};
function ic(n, size = 20, sw = 1.7) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;
}

/* детерминированный ряд значений для спарклайнов/графиков */
function seededSeries(key, n = 18, up = true) {
  let h = [...key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rnd = () => (h = (h * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  let v = up ? 35 : 65; const out = [];
  for (let i = 0; i < n; i++) { v = Math.max(6, Math.min(94, v + (rnd() - (up ? .38 : .62)) * 16)); out.push(v); }
  return out;
}
function spark(s, w = 110, h = 34, sw = 1.6) {
  const pts = seededSeries(s.name, 18, s.growth >= 0).map((v, i, a) => `${(i / (a.length - 1) * w).toFixed(1)},${(h - 2 - (v / 100) * (h - 4)).toFixed(1)}`).join(' ');
  const c = s.growth >= 0 ? '#0ECB81' : '#F6465D';
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none"><polyline points="${pts}" stroke="${c}" stroke-width="${sw}"/></svg>`;
}
function areaChart(key, w = 760, h = 300, up = true) {
  const data = seededSeries(key, 40, up);
  const px = i => (i / (data.length - 1) * w).toFixed(1), py = v => (h - 10 - (v / 100) * (h - 30)).toFixed(1);
  const line = data.map((v, i) => `${px(i)},${py(v)}`).join(' ');
  const c = up ? '#0ECB81' : '#F6465D';
  const gridLines = [0.25, 0.5, 0.75].map(t => `<line x1="0" y1="${h * t}" x2="${w}" y2="${h * t}" stroke="#2B3139" stroke-width="1"/>`).join('');
  return `<svg width="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" fill="none">${gridLines}<polygon points="0,${h} ${line} ${w},${h}" fill="${c}18"/><polyline points="${line}" stroke="${c}" stroke-width="2"/></svg>`;
}

/* верхняя навигация: лого слева, ссылки, справа поиск + жёлтый CTA + иконки (как у Binance) */
function buildNav(active = '') {
  const links = ['Каталог', 'Купить', 'Топ растущих', 'Как это работает'];
  return `<header class="bnav">
    <a class="blogo" href="index.html"><i>${ic('trend', 17, 2.2)}</i><b><span>MRR</span>ket</b></a>
    <nav>${links.map(l => `<a class="${l === active ? 'on' : ''}">${l}</a>`).join('')}</nav>
    <div class="bnav-r">
      <button class="ibtn">${ic('search')}</button>
      <button class="btn-y sm">${ic('dl', 15, 2)}Продать стартап</button>
      <button class="ibtn">${ic('bell')}</button>
      <button class="ibtn">${ic('user')}</button>
      <button class="ibtn">${ic('globe')}<span style="font-size:13px">RU</span></button>
    </div>
  </header>`;
}

/* плашка-навигатор между концептами (внизу справа) */
function badge(n, name) {
  const p = n === 1 ? 10 : n - 1, x = n === 10 ? 1 : n + 1;
  return `<div class="cbadge"><a href="variant-${p}.html">‹</a><span><b>${n}/10</b> · ${name}</span><a href="variant-${x}.html">›</a><a href="index.html" title="Все концепты">${ic('grid', 15)}</a></div>`;
}
