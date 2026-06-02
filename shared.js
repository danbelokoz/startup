// ── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  en: {
    dir:'ltr', flag:'🇬🇧', code:'EN',
    nav: { home:'Home', acquire:'Buy', sell:'Sell a startup', apiKey:'API key' },
    hero: { badge:'Data verified via Stripe, LemonSqueezy & Polar', title:'Buy a ', span:'profitable startup', titleEnd:' with proven metrics', sub:'Real MRR data only. No made-up numbers — every metric verified directly through payment providers.', btn1:'View for sale', btn2:'All startups' },
    stats: { total:'Startups in database', sale:'For sale right now', mrr:'Total MRR' },
    filter: { search:'Search by name...', allCats:'All categories', allSort:'Sort', sortRevDesc:'By revenue', sortGrowth:'By growth', sortPriceAsc:'Cheapest first', sortPriceDesc:'Most expensive', sortMultiple:'Best value', sortListed:'Recently listed', sortDeal:'Best deals', chipAll:'All', chipSale:'For sale' },
    card: { mrr:'MRR', rev30:'30-day revenue', growth:'growth', customers:'Customers', total:'total', subs:'Subscriptions', active:'active', price:'Asking price', notSale:'Not for sale', more:'Details', verified:'verified' },
    page: { label:'Page', of:'of' },
    modal: { title:'Enter API key', desc:'You need a TrustMRR API key. It is only used in your browser and never sent anywhere.', hint1:'Get your key:', hint2:'Keys start with', save:'Save & load', demo:'Demo mode' },
    footer: { data:'Data provided by' },
    errors: { key:'Invalid API key. Check your key at trustmrr.com/dashboard-dev', load:'Error loading data. Check your API key or internet connection.' },
    empty: { title:'Nothing found', sub:'Try changing the filters or search query' },
    startupPage: { back:'Back to catalog', founded:'Founded', country:'Country', audience:'Audience', provider:'Payment provider', customers:'Customers', subs:'Active subscriptions', rev30:'Revenue (30 days)', mrr:'MRR', totalRev:'Total revenue', growth:'30-day growth', margin:'Profit margin', rank:'Rank', visitors:'Visitors (30d)', contact:'Contact seller', viewOriginal:'View on TrustMRR', forSale:'For sale', notForSale:'Not for sale', price:'Asking price', multiple:'Revenue multiple' }
  },
  de: {
    dir:'ltr', flag:'🇩🇪', code:'DE',
    nav: { home:'Startseite', acquire:'Kaufen', sell:'Startup verkaufen', apiKey:'API-Schlüssel' },
    hero: { badge:'Daten verifiziert über Stripe, LemonSqueezy & Polar', title:'Kaufen Sie ein ', span:'profitables Startup', titleEnd:' mit bewiesenen Metriken', sub:'Nur echte MRR-Daten. Keine erfundenen Zahlen — jede Kennzahl direkt verifiziert.', btn1:'Zum Verkauf', btn2:'Alle Startups' },
    stats: { total:'Startups in der Datenbank', sale:'Gerade zum Verkauf', mrr:'Gesamt MRR' },
    filter: { search:'Nach Name suchen...', allCats:'Alle Kategorien', allSort:'Sortierung', sortRevDesc:'Nach Umsatz', sortGrowth:'Nach Wachstum', sortPriceAsc:'Günstigste zuerst', sortPriceDesc:'Teuerste zuerst', sortMultiple:'Bestes Preis-Umsatz', sortListed:'Zuletzt gelistet', sortDeal:'Beste Deals', chipAll:'Alle', chipSale:'Zum Verkauf' },
    card: { mrr:'MRR', rev30:'30-Tage Umsatz', growth:'Wachstum', customers:'Kunden', total:'gesamt', subs:'Abonnements', active:'aktiv', price:'Verkaufspreis', notSale:'Nicht zum Verkauf', more:'Details', verified:'verifiziert' },
    page: { label:'Seite', of:'von' },
    modal: { title:'API-Schlüssel eingeben', desc:'Sie benötigen einen TrustMRR API-Schlüssel. Er wird nur in Ihrem Browser verwendet.', hint1:'Schlüssel erhalten:', hint2:'Schlüssel beginnen mit', save:'Speichern & laden', demo:'Demo-Modus' },
    footer: { data:'Daten bereitgestellt von' },
    errors: { key:'Ungültiger API-Schlüssel.', load:'Fehler beim Laden. API-Schlüssel prüfen.' },
    empty: { title:'Nichts gefunden', sub:'Versuchen Sie, die Filter zu ändern' },
    startupPage: { back:'Zurück zum Katalog', founded:'Gegründet', country:'Land', audience:'Zielgruppe', provider:'Zahlungsanbieter', customers:'Kunden', subs:'Aktive Abonnements', rev30:'Umsatz (30 Tage)', mrr:'MRR', totalRev:'Gesamtumsatz', growth:'30-Tage Wachstum', margin:'Gewinnmarge', rank:'Rang', visitors:'Besucher (30T)', contact:'Verkäufer kontaktieren', viewOriginal:'Auf TrustMRR ansehen', forSale:'Zum Verkauf', notForSale:'Nicht zum Verkauf', price:'Verkaufspreis', multiple:'Umsatzmultiplikator' }
  },
  fr: {
    dir:'ltr', flag:'🇫🇷', code:'FR',
    nav: { home:'Accueil', acquire:'Acheter', sell:'Vendre une startup', apiKey:'Clé API' },
    hero: { badge:'Données vérifiées via Stripe, LemonSqueezy & Polar', title:'Achetez une ', span:'startup rentable', titleEnd:' avec des métriques prouvées', sub:'Uniquement des données MRR réelles. Aucun chiffre inventé — chaque métrique vérifiée directement.', btn1:'Voir à vendre', btn2:'Toutes les startups' },
    stats: { total:'Startups dans la base', sale:'En vente maintenant', mrr:'MRR total' },
    filter: { search:'Rechercher par nom...', allCats:'Toutes les catégories', allSort:'Trier', sortRevDesc:'Par revenu', sortGrowth:'Par croissance', sortPriceAsc:'Moins cher', sortPriceDesc:'Plus cher', sortMultiple:'Meilleur rapport', sortListed:'Récemment listés', sortDeal:'Meilleures offres', chipAll:'Tous', chipSale:'À vendre' },
    card: { mrr:'MRR', rev30:'Revenu 30 jours', growth:'croissance', customers:'Clients', total:'total', subs:'Abonnements', active:'actifs', price:'Prix demandé', notSale:'Non à vendre', more:'Détails', verified:'vérifié' },
    page: { label:'Page', of:'sur' },
    modal: { title:'Entrez la clé API', desc:"Vous avez besoin d'une clé API TrustMRR. Elle n'est utilisée que dans votre navigateur.", hint1:'Obtenir la clé:', hint2:'Les clés commencent par', save:'Sauvegarder & charger', demo:'Mode démo' },
    footer: { data:'Données fournies par' },
    errors: { key:'Clé API invalide.', load:'Erreur de chargement. Vérifiez votre clé API.' },
    empty: { title:'Rien trouvé', sub:'Essayez de modifier les filtres' },
    startupPage: { back:'Retour au catalogue', founded:'Fondée', country:'Pays', audience:'Audience', provider:'Fournisseur de paiement', customers:'Clients', subs:'Abonnements actifs', rev30:'Revenu (30 jours)', mrr:'MRR', totalRev:'Revenu total', growth:'Croissance 30 jours', margin:'Marge bénéficiaire', rank:'Rang', visitors:'Visiteurs (30j)', contact:'Contacter le vendeur', viewOriginal:'Voir sur TrustMRR', forSale:'À vendre', notForSale:'Non à vendre', price:'Prix demandé', multiple:'Multiple de revenus' }
  },
  it: {
    dir:'ltr', flag:'🇮🇹', code:'IT',
    nav: { home:'Home', acquire:'Acquista', sell:'Vendi startup', apiKey:'Chiave API' },
    hero: { badge:'Dati verificati tramite Stripe, LemonSqueezy e Polar', title:'Acquista una ', span:'startup redditizia', titleEnd:' con metriche provate', sub:'Solo dati MRR reali. Nessun numero inventato — ogni metrica verificata direttamente.', btn1:'Vedi in vendita', btn2:'Tutte le startup' },
    stats: { total:'Startup nel database', sale:'In vendita adesso', mrr:'MRR totale' },
    filter: { search:'Cerca per nome...', allCats:'Tutte le categorie', allSort:'Ordina', sortRevDesc:'Per fatturato', sortGrowth:'Per crescita', sortPriceAsc:'Più economico', sortPriceDesc:'Più costoso', sortMultiple:'Miglior rapporto', sortListed:'Aggiunti di recente', sortDeal:'Migliori offerte', chipAll:'Tutti', chipSale:'In vendita' },
    card: { mrr:'MRR', rev30:'Fatturato 30 giorni', growth:'crescita', customers:'Clienti', total:'totale', subs:'Abbonamenti', active:'attivi', price:'Prezzo richiesto', notSale:'Non in vendita', more:'Dettagli', verified:'verificato' },
    page: { label:'Pagina', of:'di' },
    modal: { title:'Inserisci la chiave API', desc:'Hai bisogno di una chiave API TrustMRR. Viene utilizzata solo nel tuo browser.', hint1:'Ottieni la chiave:', hint2:'Le chiavi iniziano con', save:'Salva e carica', demo:'Modalità demo' },
    footer: { data:'Dati forniti da' },
    errors: { key:'Chiave API non valida.', load:'Errore di caricamento. Controlla la chiave API.' },
    empty: { title:'Niente trovato', sub:'Prova a cambiare i filtri' },
    startupPage: { back:'Torna al catalogo', founded:'Fondata', country:'Paese', audience:'Pubblico', provider:'Fornitore pagamenti', customers:'Clienti', subs:'Abbonamenti attivi', rev30:'Fatturato (30 giorni)', mrr:'MRR', totalRev:'Fatturato totale', growth:'Crescita 30 giorni', margin:'Margine di profitto', rank:'Classifica', visitors:'Visitatori (30g)', contact:'Contatta il venditore', viewOriginal:'Vedi su TrustMRR', forSale:'In vendita', notForSale:'Non in vendita', price:'Prezzo richiesto', multiple:'Multiplo di ricavi' }
  },
  ru: {
    dir:'ltr', flag:'🇷🇺', code:'RU',
    nav: { home:'Главная', acquire:'Купить', sell:'Продать стартап', apiKey:'API ключ' },
    hero: { badge:'Данные верифицированы через Stripe, LemonSqueezy и Polar', title:'Купите ', span:'прибыльный стартап', titleEnd:' с доказанными метриками', sub:'Только реальные MRR-данные. Никаких выдуманных цифр — каждый показатель проверен через платёжные провайдеры напрямую.', btn1:'На продаже', btn2:'Все стартапы' },
    stats: { total:'Стартапов в базе', sale:'На продаже сейчас', mrr:'Суммарный MRR' },
    filter: { search:'Поиск по названию...', allCats:'Все категории', allSort:'Сортировка', sortRevDesc:'По выручке', sortGrowth:'По росту', sortPriceAsc:'Дешевле сначала', sortPriceDesc:'Дороже сначала', sortMultiple:'Лучшая цена/выручка', sortListed:'Недавно добавлены', sortDeal:'Лучшие сделки', chipAll:'Все', chipSale:'На продаже' },
    card: { mrr:'MRR', rev30:'Выручка 30 дней', growth:'рост', customers:'Клиентов', total:'всего', subs:'Подписки', active:'активных', price:'Цена продажи', notSale:'Не продаётся', more:'Подробнее', verified:'verified' },
    page: { label:'Страница', of:'из' },
    modal: { title:'Введите API ключ', desc:'Для работы сайта нужен API ключ TrustMRR. Он используется только в вашем браузере и никуда не отправляется.', hint1:'Получить ключ:', hint2:'Ключи начинаются с', save:'Сохранить и загрузить', demo:'Демо-режим' },
    footer: { data:'Данные предоставлены' },
    errors: { key:'Неверный API ключ. Проверьте ключ на trustmrr.com/dashboard-dev', load:'Ошибка загрузки данных. Проверьте API ключ или интернет-соединение.' },
    empty: { title:'Ничего не найдено', sub:'Попробуйте изменить фильтры или поисковый запрос' },
    startupPage: { back:'Назад в каталог', founded:'Основан', country:'Страна', audience:'Аудитория', provider:'Платёжный провайдер', customers:'Клиентов', subs:'Активных подписок', rev30:'Выручка (30 дней)', mrr:'MRR', totalRev:'Общая выручка', growth:'Рост за 30 дней', margin:'Маржа прибыли', rank:'Место в рейтинге', visitors:'Посетителей (30д)', contact:'Связаться с продавцом', viewOriginal:'Открыть на TrustMRR', forSale:'На продаже', notForSale:'Не продаётся', price:'Цена', multiple:'Мультипл выручки' }
  },
  zh: {
    dir:'ltr', flag:'🇨🇳', code:'ZH',
    nav: { home:'首页', acquire:'购买', sell:'出售初创公司', apiKey:'API 密钥' },
    hero: { badge:'数据通过 Stripe、LemonSqueezy 和 Polar 验证', title:'购买', span:'盈利初创公司', titleEnd:'，指标经过验证', sub:'只有真实的 MRR 数据。没有虚构数字 — 每个指标均通过支付提供商直接验证。', btn1:'查看在售', btn2:'所有初创公司' },
    stats: { total:'数据库中的初创公司', sale:'当前在售', mrr:'总 MRR' },
    filter: { search:'按名称搜索...', allCats:'所有类别', allSort:'排序', sortRevDesc:'按收入', sortGrowth:'按增长', sortPriceAsc:'价格从低到高', sortPriceDesc:'价格从高到低', sortMultiple:'最佳性价比', sortListed:'最近上架', sortDeal:'最佳交易', chipAll:'全部', chipSale:'在售' },
    card: { mrr:'MRR', rev30:'30天收入', growth:'增长', customers:'客户', total:'总计', subs:'订阅', active:'活跃', price:'要价', notSale:'不出售', more:'详情', verified:'已验证' },
    page: { label:'第', of:'页，共' },
    modal: { title:'输入 API 密钥', desc:'您需要 TrustMRR API 密钥。它仅在您的浏览器中使用，不会发送到任何地方。', hint1:'获取密钥：', hint2:'密钥以', save:'保存并加载', demo:'演示模式' },
    footer: { data:'数据由以下提供' },
    errors: { key:'API 密钥无效。', load:'加载数据时出错。请检查您的 API 密钥。' },
    empty: { title:'未找到任何内容', sub:'请尝试更改过滤条件' },
    startupPage: { back:'返回目录', founded:'成立于', country:'国家', audience:'目标受众', provider:'支付提供商', customers:'客户', subs:'活跃订阅', rev30:'收入（30天）', mrr:'MRR', totalRev:'总收入', growth:'30天增长', margin:'利润率', rank:'排名', visitors:'访客（30天）', contact:'联系卖家', viewOriginal:'在 TrustMRR 上查看', forSale:'在售', notForSale:'不出售', price:'要价', multiple:'收入倍数' }
  },
  ar: {
    dir:'rtl', flag:'🇸🇦', code:'AR',
    nav: { home:'الرئيسية', acquire:'شراء', sell:'بيع شركة ناشئة', apiKey:'مفتاح API' },
    hero: { badge:'البيانات موثقة عبر Stripe و LemonSqueezy و Polar', title:'اشترِ ', span:'شركة ناشئة مربحة', titleEnd:' بمقاييس مثبتة', sub:'بيانات MRR حقيقية فقط. لا أرقام مخترعة — كل مقياس موثق مباشرة عبر موفري الدفع.', btn1:'عرض المعروضة للبيع', btn2:'جميع الشركات الناشئة' },
    stats: { total:'الشركات الناشئة في قاعدة البيانات', sale:'معروضة للبيع الآن', mrr:'إجمالي MRR' },
    filter: { search:'بحث بالاسم...', allCats:'جميع الفئات', allSort:'ترتيب', sortRevDesc:'حسب الإيرادات', sortGrowth:'حسب النمو', sortPriceAsc:'الأرخص أولاً', sortPriceDesc:'الأغلى أولاً', sortMultiple:'أفضل قيمة', sortListed:'المضافة حديثاً', sortDeal:'أفضل الصفقات', chipAll:'الكل', chipSale:'للبيع' },
    card: { mrr:'MRR', rev30:'إيرادات 30 يوم', growth:'نمو', customers:'العملاء', total:'الإجمالي', subs:'الاشتراكات', active:'نشط', price:'سعر الطلب', notSale:'غير معروض للبيع', more:'التفاصيل', verified:'موثق' },
    page: { label:'صفحة', of:'من' },
    modal: { title:'أدخل مفتاح API', desc:'تحتاج إلى مفتاح API من TrustMRR. يُستخدم فقط في متصفحك ولا يُرسل إلى أي مكان.', hint1:'احصل على المفتاح:', hint2:'تبدأ المفاتيح بـ', save:'حفظ وتحميل', demo:'وضع العرض التوضيحي' },
    footer: { data:'البيانات مقدمة من' },
    errors: { key:'مفتاح API غير صالح.', load:'خطأ في تحميل البيانات. تحقق من مفتاح API.' },
    empty: { title:'لم يتم العثور على شيء', sub:'حاول تغيير المرشحات' },
    startupPage: { back:'العودة إلى الكتالوج', founded:'تأسست', country:'الدولة', audience:'الجمهور', provider:'مزود الدفع', customers:'العملاء', subs:'الاشتراكات النشطة', rev30:'الإيرادات (30 يوم)', mrr:'MRR', totalRev:'إجمالي الإيرادات', growth:'نمو 30 يوم', margin:'هامش الربح', rank:'الترتيب', visitors:'الزوار (30 يوم)', contact:'التواصل مع البائع', viewOriginal:'عرض على TrustMRR', forSale:'للبيع', notForSale:'غير معروض للبيع', price:'سعر الطلب', multiple:'مضاعف الإيرادات' }
  }
};

// ── SHARED STATE ──────────────────────────────────────────────────────────────
function getLang() { return localStorage.getItem('lang') || 'ru'; }
function setLangCode(code) { localStorage.setItem('lang', code); location.reload(); }
function t(section, key) { const lang = getLang(); return (T[lang]||T.en)[section]?.[key] || (T.en[section]?.[key] || ''); }
function getApiKey() { return localStorage.getItem('trustmrr_api_key') || ''; }
function saveApiKeyToStorage(key) { localStorage.setItem('trustmrr_api_key', key); }

function formatMoney(cents) {
  if (cents === null || cents === undefined) return '—';
  const d = cents / 100;
  if (d >= 1000000) return '$' + (d/1000000).toFixed(1) + 'M';
  if (d >= 1000) return '$' + (d/1000).toFixed(1) + 'K';
  return '$' + Math.round(d).toLocaleString();
}
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function applyLangToDoc() {
  const lang = getLang();
  const l = T[lang] || T.en;
  document.documentElement.lang = lang;
  document.documentElement.dir = l.dir;
  // Update lang switcher button
  const btn = document.getElementById('langBtnLabel');
  if (btn) btn.textContent = l.flag + ' ' + l.code;
  // Mark active
  document.querySelectorAll('.lang-option').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === lang);
  });
}

function buildNavHTML(activePage) {
  const lang = getLang();
  const l = T[lang] || T.en;
  const isHome = activePage === 'home';
  const isAcquire = activePage === 'acquire';
  return `
  <nav>
    <a class="nav-logo" href="/">⚡ StartupMarket</a>
    <div class="nav-center">
      <a href="/" class="nav-link ${isHome?'active':''}">${l.nav.home}</a>
      <a href="/acquire.html" class="nav-link ${isAcquire?'active':''}">${l.nav.acquire}</a>
    </div>
    <div class="nav-right">
      <div class="lang-switcher" id="langSwitcher">
        <button class="lang-btn" onclick="document.getElementById('langDropdown').classList.toggle('open')" id="langBtnLabel">${l.flag} ${l.code}</button>
        <div class="lang-dropdown" id="langDropdown">
          ${Object.entries(T).map(([code, v]) => `<div class="lang-option ${code===lang?'active':''}" data-lang="${code}" onclick="setLangCode('${code}')""><span>${v.flag}</span> ${v.code === 'EN' ? 'English' : v.code === 'DE' ? 'Deutsch' : v.code === 'FR' ? 'Français' : v.code === 'IT' ? 'Italiano' : v.code === 'RU' ? 'Русский' : v.code === 'ZH' ? '中文' : 'العربية'}</div>`).join('')}
        </div>
      </div>
      <button class="btn btn-ghost" onclick="document.getElementById('apiModal').classList.remove('hidden')" style="font-size:13px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
        ${l.nav.apiKey}
      </button>
      <a class="btn btn-primary" href="https://trustmrr.com/sell" target="_blank">${l.nav.sell}</a>
    </div>
  </nav>`;
}

function buildModalHTML() {
  const lang = getLang();
  const l = T[lang] || T.en;
  return `
  <div class="modal-overlay hidden" id="apiModal">
    <div class="modal">
      <h2>🔑 ${l.modal.title}</h2>
      <p>${l.modal.desc}</p>
      <input type="text" id="apiKeyInput" placeholder="tmrr_xxxxxxxxxxxxxxxx" autocomplete="off" spellcheck="false" value="${escHtml(getApiKey())}" />
      <p class="modal-hint">${l.modal.hint1} <a href="https://trustmrr.com/dashboard-dev" target="_blank">trustmrr.com/dashboard-dev</a><br>${l.modal.hint2} <code style="color:var(--accent)">tmrr_</code></p>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-primary" onclick="saveApiKeyFromModal()" style="flex:1;justify-content:center;">${l.modal.save}</button>
        <button class="btn btn-ghost" onclick="useDemoModeFromModal()" style="flex:1;justify-content:center;">${l.modal.demo}</button>
      </div>
    </div>
  </div>`;
}

function saveApiKeyFromModal() {
  const val = document.getElementById('apiKeyInput').value.trim();
  if (!val) return;
  saveApiKeyToStorage(val);
  document.getElementById('apiModal').classList.add('hidden');
  if (typeof onApiKeySaved === 'function') onApiKeySaved();
}

function useDemoModeFromModal() {
  document.getElementById('apiModal').classList.add('hidden');
  if (typeof onDemoMode === 'function') onDemoMode();
}

document.addEventListener('click', (e) => {
  const sw = document.getElementById('langSwitcher');
  if (sw && !sw.contains(e.target)) document.getElementById('langDropdown')?.classList.remove('open');
  const modal = document.getElementById('apiModal');
  if (modal && e.target === modal) modal.classList.add('hidden');
});
