// ── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  en: {
    dir:'ltr', flag:'🇬🇧', code:'EN',
    nav: { home:'Home', acquire:'Buy', sell:'Sell a startup', apiKey:'API key' },
    hero: { badge:'Data verified via Stripe, LemonSqueezy & Polar', title:'Find a ', span:'verified startup', titleEnd:' with confirmed revenue', sub:'Real MRR data only. No made-up numbers — every metric verified directly through payment providers.', btn1:'View for sale', btn2:'All startups' },
    stats: { total:'Startups in database', sale:'For sale right now', mrr:'Total MRR' },
    filter: { search:'Search by name...', allCats:'All categories', sortRevDesc:'By revenue', sortGrowth:'By growth', sortPriceAsc:'Cheapest first', sortPriceDesc:'Most expensive', sortMultiple:'Best value', sortListed:'Recently listed', sortDeal:'Best deals', chipAll:'All', chipSale:'For sale' },
    card: { mrr:'MRR', rev30:'30-day revenue', growth:'growth', customers:'Customers', total:'total', subs:'Subscriptions', active:'active', price:'Asking price', notSale:'Not for sale', more:'Details', verified:'verified' },
    page: { label:'Page', of:'of' },
    modal: { title:'Enter API key', desc:'You need a TrustMRR API key. It is only used in your browser and never sent anywhere.', hint1:'Get your key:', hint2:'Keys start with', save:'Save & load', demo:'Demo mode' },
    footer: { data:'Data provided by' },
    errors: { key:'Invalid API key. Check your key at trustmrr.com/dashboard-dev', load:'Error loading data. Check your API key or internet connection.' },
    empty: { title:'Nothing found', sub:'Try changing the filters or search query' },
    cache: { loading:'Loading startups...', cached:'Loaded from cache', fresh:'Data updated' },
    startupPage: { back:'Back to catalog', founded:'Founded', country:'Country', audience:'Audience', provider:'Payment provider', customers:'Customers', subs:'Active subscriptions', rev30:'Revenue (30 days)', mrr:'MRR', totalRev:'Total revenue', growth:'30-day growth', margin:'Profit margin', rank:'Rank', visitors:'Visitors (30d)', contact:'Contact seller', viewOriginal:'Visit website', forSale:'For sale', notForSale:'Not for sale', price:'Asking price', multiple:'Revenue multiple', techStack:'Tech stack', cofounders:'Cofounders', reveal:'Open seller contacts and site', revealBtn:'Open', revealNote:'spends 1 view from your daily limit', dailyChart:'Daily metrics', chartCollecting:'Collecting daily data', chartWillAppear:"Chart will appear in a few days — we snapshot metrics every day at 3:00 UTC.", chartEstimated:'Estimated' },
    idx: { heroTitle:'Find a', heroSpan:'verified startup', heroEnd:'with confirmed revenue', heroSub:'Only verified data. Every metric checked directly through payment providers.', statTotal:'Startups in database', statSale:'For sale', statRev30:'Revenue (30d)', statMrr:'Total MRR', fltTitle:'Filters', fltReset:'Reset', fltSearch:'Search by name...', fltStatus:'Status', fltStatusSale:'For sale', fltStatusAll:'All', fltCats:'Categories', fltCatsAll:'All categories...', fltRev30:'30-day revenue', fltMrr:'MRR', fltGrowth:'30-day growth', fltPrice:'Asking price', fltMultiple:'Multiple', fltMargin:'Profit margin', fltAudience:'Audience', fltMobile:'Mobile app', fltApply:'Apply filters', fltAny:'Any', fltHas:'Has', fltNo:'No', sortRev:'Revenue ↓', sortGrowth:'Growth ↓', sortPriceAsc:'Price ↑', sortPriceDesc:'Price ↓', loading:'Loading startups...', error:'Error loading data', notFound:'Nothing found', countStartups:'startups', countOnSale:'for sale', tipRev30:'Total revenue over the last 30 days', tipMrr:'Monthly Recurring Revenue', tipGrowth:'MRR change over 30 days in %', tipPrice:'Asking price for 100% equity', tipMultiple:'Price / annual MRR', cardRev:'Rev. 30d', cardAsk:'Asking', cardMult:'Multiple', cardMrr:'MRR', favorites:'Favorites', anonLabel:'anonymous', anonHint:'The founder chose to stay anonymous', anonNoDesc:'The seller chose not to disclose product details.', acqHeroTitle:'Buy a', acqHeroSpan:'profitable startup', acqHeroEnd:'with confirmed metrics', acqHeroSub:'Every listing has real MRR verified through payment providers — no estimates.', statAvgMult:'Average multiple' },
    dash: { favorites:'Favorites', favEmpty:'No favorites yet. Tap the heart on any startup to save it here.', loading:'Loading...' },
    acquire: { heroTitle:'Buy a <span>profitable startup</span> with confirmed metrics', heroSub:'Every listing has real MRR verified through Stripe, LemonSqueezy, or Polar. No made-up numbers.', step1Title:'Browse listings', step1Desc:'Filter by category, price, and revenue multiple to find the right deal', step2Title:'Verify metrics', step2Desc:'All revenue data is verified directly through payment providers — no estimates', step3Title:'Contact seller', step3Desc:'Reach out directly to the founder on the startup detail page' }
  },
  de: {
    dir:'ltr', flag:'🇩🇪', code:'DE',
    nav: { home:'Startseite', acquire:'Kaufen', sell:'Startup verkaufen', apiKey:'API-Schlüssel' },
    hero: { badge:'Daten verifiziert über Stripe, LemonSqueezy & Polar', title:'Finde ein ', span:'verifiziertes Startup', titleEnd:' mit bestätigtem Umsatz', sub:'Nur echte MRR-Daten. Keine erfundenen Zahlen.', btn1:'Zum Verkauf', btn2:'Alle Startups' },
    stats: { total:'Startups in der Datenbank', sale:'Gerade zum Verkauf', mrr:'Gesamt MRR' },
    filter: { search:'Nach Name suchen...', allCats:'Alle Kategorien', sortRevDesc:'Nach Umsatz', sortGrowth:'Nach Wachstum', sortPriceAsc:'Günstigste zuerst', sortPriceDesc:'Teuerste zuerst', sortMultiple:'Bestes Preis-Umsatz', sortListed:'Zuletzt gelistet', sortDeal:'Beste Deals', chipAll:'Alle', chipSale:'Zum Verkauf' },
    card: { mrr:'MRR', rev30:'30-Tage Umsatz', growth:'Wachstum', customers:'Kunden', total:'gesamt', subs:'Abonnements', active:'aktiv', price:'Verkaufspreis', notSale:'Nicht zum Verkauf', more:'Details', verified:'verifiziert' },
    page: { label:'Seite', of:'von' },
    modal: { title:'API-Schlüssel eingeben', desc:'Sie benötigen einen TrustMRR API-Schlüssel.', hint1:'Schlüssel erhalten:', hint2:'Schlüssel beginnen mit', save:'Speichern & laden', demo:'Demo-Modus' },
    footer: { data:'Daten bereitgestellt von' },
    errors: { key:'Ungültiger API-Schlüssel.', load:'Fehler beim Laden.' },
    empty: { title:'Nichts gefunden', sub:'Filter ändern' },
    cache: { loading:'Lade Startups...', cached:'Aus Cache geladen', fresh:'Daten aktualisiert' },
    startupPage: { back:'Zurück zum Katalog', founded:'Gegründet', country:'Land', audience:'Zielgruppe', provider:'Zahlungsanbieter', customers:'Kunden', subs:'Aktive Abonnements', rev30:'Umsatz (30 Tage)', mrr:'MRR', totalRev:'Gesamtumsatz', growth:'30-Tage Wachstum', margin:'Gewinnmarge', rank:'Rang', visitors:'Besucher (30T)', contact:'Verkäufer kontaktieren', viewOriginal:'Website öffnen', forSale:'Zum Verkauf', notForSale:'Nicht zum Verkauf', price:'Verkaufspreis', multiple:'Umsatzmultiplikator', techStack:'Tech Stack', cofounders:'Mitgründer', reveal:'Verkäuferkontakte und Website öffnen', revealBtn:'Öffnen', revealNote:'verbraucht 1 Aufruf aus deinem Tageslimit', dailyChart:'Tägliche Metriken', chartCollecting:'Sammle tägliche Daten', chartWillAppear:'Diagramm erscheint in einigen Tagen — wir speichern täglich um 3:00 UTC einen Snapshot.', chartEstimated:'Geschätzt' },
    idx: { heroTitle:'Finde ein', heroSpan:'verifiziertes Startup', heroEnd:'mit bestätigtem Umsatz', heroSub:'Nur verifizierte Daten. Jede Kennzahl direkt über Zahlungsanbieter geprüft.', statTotal:'Startups in der Datenbank', statSale:'Zum Verkauf', statRev30:'Umsatz (30T)', statMrr:'Gesamt MRR', fltTitle:'Filter', fltReset:'Zurücksetzen', fltSearch:'Nach Name suchen...', fltStatus:'Status', fltStatusSale:'Zum Verkauf', fltStatusAll:'Alle', fltCats:'Kategorien', fltCatsAll:'Alle Kategorien...', fltRev30:'30-Tage Umsatz', fltMrr:'MRR', fltGrowth:'30-Tage Wachstum', fltPrice:'Verkaufspreis', fltMultiple:'Multiplikator', fltMargin:'Gewinnmarge', fltAudience:'Zielgruppe', fltMobile:'Mobile App', fltApply:'Filter anwenden', fltAny:'Beliebig', fltHas:'Ja', fltNo:'Nein', sortRev:'Umsatz ↓', sortGrowth:'Wachstum ↓', sortPriceAsc:'Preis ↑', sortPriceDesc:'Preis ↓', loading:'Lade Startups...', error:'Fehler beim Laden', notFound:'Nichts gefunden', countStartups:'Startups', countOnSale:'zum Verkauf', tipRev30:'Gesamtumsatz der letzten 30 Tage', tipMrr:'Monthly Recurring Revenue', tipGrowth:'MRR-Änderung in 30 Tagen in %', tipPrice:'Verkaufspreis für 100% der Anteile', tipMultiple:'Preis / Jahres-MRR', cardRev:'Umsatz 30T', cardAsk:'Preis', cardMult:'Multipl.', cardMrr:'MRR', favorites:'Favoriten', anonLabel:'anonym', anonHint:'Der Gründer bleibt anonym', anonNoDesc:'Der Verkäufer hat sich entschieden, Produktdetails nicht offenzulegen.', acqHeroTitle:'Kaufe ein', acqHeroSpan:'profitables Startup', acqHeroEnd:'mit bestätigten Kennzahlen', acqHeroSub:'Jedes Angebot hat echte MRR-Daten, verifiziert über Zahlungsanbieter — keine Schätzungen.', statAvgMult:'Durchschn. Multipl.' },
    dash: { favorites:'Favoriten', favEmpty:'Noch keine Favoriten. Tippe auf das Herz, um Startups hier zu speichern.', loading:'Lädt...' },
    acquire: { heroTitle:'Ein <span>profitables Startup</span> mit verifizierten Kennzahlen kaufen', heroSub:'Alle Listings haben echte MRR-Daten, verifiziert über Stripe, LemonSqueezy oder Polar.', step1Title:'Listings durchsuchen', step1Desc:'Nach Kategorie, Preis und Umsatzmultiplikator filtern', step2Title:'Kennzahlen prüfen', step2Desc:'Alle Umsatzdaten sind direkt durch Zahlungsanbieter verifiziert', step3Title:'Verkäufer kontaktieren', step3Desc:'Den Gründer direkt auf der Startup-Detailseite kontaktieren' }
  },
  fr: {
    dir:'ltr', flag:'🇫🇷', code:'FR',
    nav: { home:'Accueil', acquire:'Acheter', sell:'Vendre une startup', apiKey:'Clé API' },
    hero: { badge:'Données vérifiées via Stripe, LemonSqueezy & Polar', title:'Trouvez une ', span:'startup vérifiée', titleEnd:' avec des revenus confirmés', sub:'Uniquement des données MRR réelles. Aucun chiffre inventé.', btn1:'Voir à vendre', btn2:'Toutes les startups' },
    stats: { total:'Startups dans la base', sale:'En vente maintenant', mrr:'MRR total' },
    filter: { search:'Rechercher par nom...', allCats:'Toutes les catégories', sortRevDesc:'Par revenu', sortGrowth:'Par croissance', sortPriceAsc:'Moins cher', sortPriceDesc:'Plus cher', sortMultiple:'Meilleur rapport', sortListed:'Récemment listés', sortDeal:'Meilleures offres', chipAll:'Tous', chipSale:'À vendre' },
    card: { mrr:'MRR', rev30:'Revenu 30 jours', growth:'croissance', customers:'Clients', total:'total', subs:'Abonnements', active:'actifs', price:'Prix demandé', notSale:'Non à vendre', more:'Détails', verified:'vérifié' },
    page: { label:'Page', of:'sur' },
    modal: { title:'Entrez la clé API', desc:"Vous avez besoin d'une clé API TrustMRR.", hint1:'Obtenir la clé:', hint2:'Les clés commencent par', save:'Sauvegarder & charger', demo:'Mode démo' },
    footer: { data:'Données fournies par' },
    errors: { key:'Clé API invalide.', load:'Erreur de chargement.' },
    empty: { title:'Rien trouvé', sub:'Modifier les filtres' },
    cache: { loading:'Chargement...', cached:'Chargé depuis le cache', fresh:'Données mises à jour' },
    startupPage: { back:'Retour au catalogue', founded:'Fondée', country:'Pays', audience:'Audience', provider:'Fournisseur de paiement', customers:'Clients', subs:'Abonnements actifs', rev30:'Revenu (30 jours)', mrr:'MRR', totalRev:'Revenu total', growth:'Croissance 30 jours', margin:'Marge bénéficiaire', rank:'Rang', visitors:'Visiteurs (30j)', contact:'Contacter le vendeur', viewOriginal:'Visiter le site', forSale:'À vendre', notForSale:'Non à vendre', price:'Prix demandé', multiple:'Multiple de revenus', techStack:'Stack technique', cofounders:'Cofondateurs', reveal:'Ouvrir les contacts du vendeur et le site', revealBtn:'Ouvrir', revealNote:'consomme 1 vue de votre limite quotidienne', dailyChart:'Métriques quotidiennes', chartCollecting:'Collecte des données quotidiennes', chartWillAppear:'Le graphique apparaîtra dans quelques jours — nous capturons les métriques chaque jour à 3h00 UTC.', chartEstimated:'Estimé' },
    idx: { heroTitle:'Trouvez une', heroSpan:'startup vérifiée', heroEnd:'avec revenus confirmés', heroSub:'Uniquement des données vérifiées. Chaque métrique vérifiée directement via les fournisseurs de paiement.', statTotal:'Startups dans la base', statSale:'À vendre', statRev30:'Revenu (30j)', statMrr:'MRR total', fltTitle:'Filtres', fltReset:'Réinitialiser', fltSearch:'Rechercher par nom...', fltStatus:'Statut', fltStatusSale:'À vendre', fltStatusAll:'Tous', fltCats:'Catégories', fltCatsAll:'Toutes les catégories...', fltRev30:'Revenu 30 jours', fltMrr:'MRR', fltGrowth:'Croissance 30 jours', fltPrice:'Prix demandé', fltMultiple:'Multiple', fltMargin:'Marge bénéficiaire', fltAudience:'Audience', fltMobile:'Application mobile', fltApply:'Appliquer les filtres', fltAny:'Tout', fltHas:'Oui', fltNo:'Non', sortRev:'Revenu ↓', sortGrowth:'Croissance ↓', sortPriceAsc:'Prix ↑', sortPriceDesc:'Prix ↓', loading:'Chargement des startups...', error:'Erreur de chargement', notFound:'Rien trouvé', countStartups:'startups', countOnSale:'à vendre', tipRev30:'Revenu total des 30 derniers jours', tipMrr:'Monthly Recurring Revenue', tipGrowth:'Variation MRR sur 30 jours en %', tipPrice:'Prix demandé pour 100% du capital', tipMultiple:'Prix / MRR annuel', cardRev:'Rev. 30j', cardAsk:'Prix', cardMult:'Multiple', cardMrr:'MRR', favorites:'Favoris', anonLabel:'anonyme', anonHint:'Le fondateur reste anonyme', anonNoDesc:'Le vendeur préfère ne pas divulguer les détails du produit.', acqHeroTitle:'Achète une', acqHeroSpan:'startup rentable', acqHeroEnd:'avec métriques confirmées', acqHeroSub:'Chaque annonce a un MRR réel vérifié via les fournisseurs de paiement — pas d\'estimations.', statAvgMult:'Multiple moyen' },
    dash: { favorites:'Favoris', favEmpty:"Aucun favori pour l'instant. Touchez le cœur pour enregistrer une startup ici.", loading:'Chargement...' },
    acquire: { heroTitle:'Acheter une <span>startup rentable</span> avec des métriques confirmées', heroSub:'Chaque annonce a un MRR réel vérifié via Stripe, LemonSqueezy ou Polar.', step1Title:'Parcourir les annonces', step1Desc:'Filtrer par catégorie, prix et multiple de revenus', step2Title:'Vérifier les métriques', step2Desc:'Toutes les données sont vérifiées directement via les fournisseurs de paiement', step3Title:'Contacter le vendeur', step3Desc:'Contactez directement le fondateur sur la page de détail' }
  },
  it: {
    dir:'ltr', flag:'🇮🇹', code:'IT',
    nav: { home:'Home', acquire:'Acquista', sell:'Vendi startup', apiKey:'Chiave API' },
    hero: { badge:'Dati verificati tramite Stripe, LemonSqueezy e Polar', title:'Trova una ', span:'startup verificata', titleEnd:' con ricavi confermati', sub:'Solo dati MRR reali. Nessun numero inventato.', btn1:'Vedi in vendita', btn2:'Tutte le startup' },
    stats: { total:'Startup nel database', sale:'In vendita adesso', mrr:'MRR totale' },
    filter: { search:'Cerca per nome...', allCats:'Tutte le categorie', sortRevDesc:'Per fatturato', sortGrowth:'Per crescita', sortPriceAsc:'Più economico', sortPriceDesc:'Più costoso', sortMultiple:'Miglior rapporto', sortListed:'Aggiunti di recente', sortDeal:'Migliori offerte', chipAll:'Tutti', chipSale:'In vendita' },
    card: { mrr:'MRR', rev30:'Fatturato 30 giorni', growth:'crescita', customers:'Clienti', total:'totale', subs:'Abbonamenti', active:'attivi', price:'Prezzo richiesto', notSale:'Non in vendita', more:'Dettagli', verified:'verificato' },
    page: { label:'Pagina', of:'di' },
    modal: { title:'Inserisci la chiave API', desc:'Hai bisogno di una chiave API TrustMRR.', hint1:'Ottieni la chiave:', hint2:'Le chiavi iniziano con', save:'Salva e carica', demo:'Modalità demo' },
    footer: { data:'Dati forniti da' },
    errors: { key:'Chiave API non valida.', load:'Errore di caricamento.' },
    empty: { title:'Niente trovato', sub:'Cambia i filtri' },
    cache: { loading:'Caricamento...', cached:'Caricato dalla cache', fresh:'Dati aggiornati' },
    startupPage: { back:'Torna al catalogo', founded:'Fondata', country:'Paese', audience:'Pubblico', provider:'Fornitore pagamenti', customers:'Clienti', subs:'Abbonamenti attivi', rev30:'Fatturato (30 giorni)', mrr:'MRR', totalRev:'Fatturato totale', growth:'Crescita 30 giorni', margin:'Margine di profitto', rank:'Classifica', visitors:'Visitatori (30g)', contact:'Contatta il venditore', viewOriginal:'Visita il sito', forSale:'In vendita', notForSale:'Non in vendita', price:'Prezzo richiesto', multiple:'Multiplo di ricavi', techStack:'Stack tecnologico', cofounders:'Cofondatori', reveal:'Apri i contatti del venditore e il sito', revealBtn:'Apri', revealNote:'consuma 1 visualizzazione dal limite giornaliero', dailyChart:'Metriche giornaliere', chartCollecting:'Raccolta dati giornalieri', chartWillAppear:'Il grafico apparirà tra qualche giorno — salviamo uno snapshot ogni giorno alle 3:00 UTC.', chartEstimated:'Stimato' },
    idx: { heroTitle:'Trova una', heroSpan:'startup verificata', heroEnd:'con ricavi confermati', heroSub:'Solo dati verificati. Ogni metrica controllata direttamente tramite i fornitori di pagamento.', statTotal:'Startup nel database', statSale:'In vendita', statRev30:'Fatturato (30g)', statMrr:'MRR totale', fltTitle:'Filtri', fltReset:'Reimposta', fltSearch:'Cerca per nome...', fltStatus:'Stato', fltStatusSale:'In vendita', fltStatusAll:'Tutti', fltCats:'Categorie', fltCatsAll:'Tutte le categorie...', fltRev30:'Fatturato 30 giorni', fltMrr:'MRR', fltGrowth:'Crescita 30 giorni', fltPrice:'Prezzo richiesto', fltMultiple:'Multiplo', fltMargin:'Margine di profitto', fltAudience:'Pubblico', fltMobile:'App mobile', fltApply:'Applica filtri', fltAny:'Qualsiasi', fltHas:'Sì', fltNo:'No', sortRev:'Fatturato ↓', sortGrowth:'Crescita ↓', sortPriceAsc:'Prezzo ↑', sortPriceDesc:'Prezzo ↓', loading:'Caricamento startup...', error:'Errore di caricamento', notFound:'Niente trovato', countStartups:'startup', countOnSale:'in vendita', tipRev30:'Fatturato totale degli ultimi 30 giorni', tipMrr:'Monthly Recurring Revenue', tipGrowth:'Variazione MRR in 30 giorni in %', tipPrice:'Prezzo richiesto per il 100% delle quote', tipMultiple:'Prezzo / MRR annuale', cardRev:'Ric. 30g', cardAsk:'Prezzo', cardMult:'Multiplo', cardMrr:'MRR', favorites:'Preferiti', anonLabel:'anonimo', anonHint:'Il fondatore rimane anonimo', anonNoDesc:'Il venditore ha scelto di non rivelare i dettagli del prodotto.', acqHeroTitle:'Acquista una', acqHeroSpan:'startup redditizia', acqHeroEnd:'con metriche confermate', acqHeroSub:'Ogni annuncio ha MRR reale verificato tramite i fornitori di pagamento — niente stime.', statAvgMult:'Multiplo medio' },
    dash: { favorites:'Preferiti', favEmpty:'Ancora nessun preferito. Tocca il cuore per salvare una startup qui.', loading:'Caricamento...' },
    acquire: { heroTitle:'Acquista una <span>startup redditizia</span> con metriche confermate', heroSub:'Ogni annuncio ha MRR reale verificato tramite Stripe, LemonSqueezy o Polar.', step1Title:'Sfoglia gli annunci', step1Desc:'Filtra per categoria, prezzo e multiplo di ricavi', step2Title:'Verifica le metriche', step2Desc:'Tutti i dati sui ricavi sono verificati direttamente tramite i fornitori di pagamento', step3Title:'Contatta il venditore', step3Desc:'Contatta direttamente il fondatore nella pagina di dettaglio' }
  },
  ru: {
    dir:'ltr', flag:'🇷🇺', code:'RU',
    nav: { home:'Главная', acquire:'Купить', sell:'Продать стартап', apiKey:'API ключ' },
    hero: { badge:'Данные верифицированы через Stripe, LemonSqueezy и Polar', title:'Найди ', span:'верифицированный стартап', titleEnd:' с подтверждённой выручкой', sub:'Только реальные MRR-данные. Никаких выдуманных цифр — каждый показатель проверен через платёжные провайдеры напрямую.', btn1:'На продаже', btn2:'Все стартапы' },
    stats: { total:'Стартапов в базе', sale:'На продаже сейчас', mrr:'Суммарный MRR' },
    filter: { search:'Поиск по названию...', allCats:'Все категории', sortRevDesc:'По выручке', sortGrowth:'По росту', sortPriceAsc:'Дешевле сначала', sortPriceDesc:'Дороже сначала', sortMultiple:'Лучшая цена/выручка', sortListed:'Недавно добавлены', sortDeal:'Лучшие сделки', chipAll:'Все', chipSale:'На продаже' },
    card: { mrr:'MRR', rev30:'Выручка 30 дней', growth:'рост', customers:'Клиентов', total:'всего', subs:'Подписки', active:'активных', price:'Цена продажи', notSale:'Не продаётся', more:'Подробнее', verified:'verified' },
    page: { label:'Страница', of:'из' },
    modal: { title:'Введите API ключ', desc:'Для работы сайта нужен API ключ TrustMRR. Он используется только в вашем браузере и никуда не отправляется.', hint1:'Получить ключ:', hint2:'Ключи начинаются с', save:'Сохранить и загрузить', demo:'Демо-режим' },
    footer: { data:'Данные предоставлены' },
    errors: { key:'Неверный API ключ. Проверьте ключ на trustmrr.com/dashboard-dev', load:'Ошибка загрузки данных. Проверьте API ключ или интернет-соединение.' },
    empty: { title:'Ничего не найдено', sub:'Попробуйте изменить фильтры или поисковый запрос' },
    cache: { loading:'Загружаем стартапы...', cached:'Загружено из кэша', fresh:'Данные обновлены' },
    startupPage: { back:'Назад в каталог', founded:'Основан', country:'Страна', audience:'Аудитория', provider:'Платёжный провайдер', customers:'Клиентов', subs:'Активных подписок', rev30:'Выручка (30 дней)', mrr:'MRR', totalRev:'Общая выручка', growth:'Рост за 30 дней', margin:'Маржа прибыли', rank:'Место в рейтинге', visitors:'Посетителей (30д)', contact:'Связаться с продавцом', viewOriginal:'Открыть сайт', forSale:'На продаже', notForSale:'Не продаётся', price:'Цена', multiple:'Мультипл выручки', techStack:'Технологии', cofounders:'Сооснователи', reveal:'Открыть контакты продавца и сайт', revealBtn:'Открыть', revealNote:'тратит 1 просмотр из вашего лимита', dailyChart:'Динамика по дням', chartCollecting:'Собираем дневные данные', chartWillAppear:'График появится через несколько дней — каждый день в 3:00 UTC мы сохраняем снимок метрик.', chartEstimated:'Расчётно' },
    idx: { heroTitle:'Найди', heroSpan:'верифицированный', heroEnd:'стартап с выручкой', heroSub:'Только подтверждённые данные. Каждый показатель проверен через платёжные провайдеры напрямую.', statTotal:'Стартапов в базе', statSale:'На продаже', statRev30:'Выручка (30д)', statMrr:'Суммарный MRR', fltTitle:'Фильтры', fltReset:'Сбросить', fltSearch:'Поиск по названию...', fltStatus:'Статус', fltStatusSale:'На продаже', fltStatusAll:'Все', fltCats:'Категории', fltCatsAll:'Все категории...', fltRev30:'Выручка 30 дней', fltMrr:'MRR', fltGrowth:'Рост 30 дней', fltPrice:'Цена продажи', fltMultiple:'Мультипликатор', fltMargin:'Маржа прибыли', fltAudience:'Аудитория', fltMobile:'Мобильное приложение', fltApply:'Применить фильтры', fltAny:'Любой', fltHas:'Есть', fltNo:'Нет', sortRev:'Выручка ↓', sortGrowth:'Рост ↓', sortPriceAsc:'Цена ↑', sortPriceDesc:'Цена ↓', loading:'Загружаем стартапы...', error:'Ошибка загрузки данных', notFound:'Ничего не найдено', countStartups:'стартапов', countOnSale:'на продаже', tipRev30:'Суммарная выручка за последние 30 дней', tipMrr:'Monthly Recurring Revenue', tipGrowth:'Изменение MRR за 30 дней в %', tipPrice:'Запрашиваемая цена за 100% доли', tipMultiple:'Цена / годовой MRR', cardRev:'Выр. 30д', cardAsk:'Цена', cardMult:'Мультипл', cardMrr:'MRR', favorites:'Избранное', anonLabel:'аноним', anonHint:'Основатель решил остаться анонимным', anonNoDesc:'Продавец решил не раскрывать детали продукта.', acqHeroTitle:'Купи', acqHeroSpan:'прибыльный стартап', acqHeroEnd:'с подтверждёнными метриками', acqHeroSub:'У каждого объявления реальный MRR, верифицированный через платёжных провайдеров — без оценок.', statAvgMult:'Средний мультипл' },
    dash: { favorites:'Избранное', favEmpty:'Пока нет избранных. Нажми на сердечко у стартапа, чтобы сохранить его здесь.', loading:'Загрузка...' },
    acquire: { heroTitle:'Купи <span>прибыльный стартап</span> с подтверждёнными метриками', heroSub:'У каждого объявления реальный MRR, верифицированный через Stripe, LemonSqueezy или Polar.', step1Title:'Смотри объявления', step1Desc:'Фильтруй по категории, цене и мультиплу выручки', step2Title:'Проверяй метрики', step2Desc:'Все данные по выручке подтверждены напрямую через платёжные сервисы', step3Title:'Свяжись с продавцом', step3Desc:'Пиши основателю напрямую со страницы стартапа' }
  },
  zh: {
    dir:'ltr', flag:'🇨🇳', code:'ZH',
    nav: { home:'首页', acquire:'购买', sell:'出售初创公司', apiKey:'API 密钥' },
    hero: { badge:'数据通过 Stripe、LemonSqueezy 和 Polar 验证', title:'找到', span:'经过验证的初创公司', titleEnd:'，收入经过确认', sub:'只有真实的 MRR 数据。没有虚构数字。', btn1:'查看在售', btn2:'所有初创公司' },
    stats: { total:'数据库中的初创公司', sale:'当前在售', mrr:'总 MRR' },
    filter: { search:'按名称搜索...', allCats:'所有类别', sortRevDesc:'按收入', sortGrowth:'按增长', sortPriceAsc:'价格从低到高', sortPriceDesc:'价格从高到低', sortMultiple:'最佳性价比', sortListed:'最近上架', sortDeal:'最佳交易', chipAll:'全部', chipSale:'在售' },
    card: { mrr:'MRR', rev30:'30天收入', growth:'增长', customers:'客户', total:'总计', subs:'订阅', active:'活跃', price:'要价', notSale:'不出售', more:'详情', verified:'已验证' },
    page: { label:'第', of:'页，共' },
    modal: { title:'输入 API 密钥', desc:'您需要 TrustMRR API 密钥。', hint1:'获取密钥：', hint2:'密钥以', save:'保存并加载', demo:'演示模式' },
    footer: { data:'数据由以下提供' },
    errors: { key:'API 密钥无效。', load:'加载数据时出错。' },
    empty: { title:'未找到任何内容', sub:'请尝试更改过滤条件' },
    cache: { loading:'加载中...', cached:'从缓存加载', fresh:'数据已更新' },
    startupPage: { back:'返回目录', founded:'成立于', country:'国家', audience:'目标受众', provider:'支付提供商', customers:'客户', subs:'活跃订阅', rev30:'收入（30天）', mrr:'MRR', totalRev:'总收入', growth:'30天增长', margin:'利润率', rank:'排名', visitors:'访客（30天）', contact:'联系卖家', viewOriginal:'访问网站', forSale:'在售', notForSale:'不出售', price:'要价', multiple:'收入倍数', techStack:'技术栈', cofounders:'联合创始人', reveal:'打开卖家联系方式和网站', revealBtn:'打开', revealNote:'消耗您每日限额中的1次查看', dailyChart:'每日指标', chartCollecting:'正在收集每日数据', chartWillAppear:'图表将在几天后显示 — 我们每天 3:00 UTC 保存一次快照。', chartEstimated:'估算' },
    idx: { heroTitle:'寻找', heroSpan:'经过验证的初创公司', heroEnd:'收入已确认', heroSub:'仅限验证数据。每项指标都通过支付提供商直接验证。', statTotal:'数据库中的初创公司', statSale:'在售', statRev30:'收入（30天）', statMrr:'总 MRR', fltTitle:'筛选器', fltReset:'重置', fltSearch:'按名称搜索...', fltStatus:'状态', fltStatusSale:'在售', fltStatusAll:'全部', fltCats:'类别', fltCatsAll:'所有类别...', fltRev30:'30天收入', fltMrr:'MRR', fltGrowth:'30天增长', fltPrice:'要价', fltMultiple:'倍数', fltMargin:'利润率', fltAudience:'目标受众', fltMobile:'移动应用', fltApply:'应用筛选', fltAny:'任何', fltHas:'有', fltNo:'无', sortRev:'收入 ↓', sortGrowth:'增长 ↓', sortPriceAsc:'价格 ↑', sortPriceDesc:'价格 ↓', loading:'加载初创公司...', error:'加载数据时出错', notFound:'未找到任何内容', countStartups:'初创公司', countOnSale:'在售', tipRev30:'过去30天的总收入', tipMrr:'Monthly Recurring Revenue', tipGrowth:'30天MRR变化百分比', tipPrice:'100%股权的要价', tipMultiple:'价格 / 年化MRR', cardRev:'30天收入', cardAsk:'要价', cardMult:'倍数', cardMrr:'MRR', favorites:'收藏', anonLabel:'匿名', anonHint:'创始人选择匿名', anonNoDesc:'卖家选择不披露产品细节。', acqHeroTitle:'购买', acqHeroSpan:'盈利的初创公司', acqHeroEnd:'指标已验证', acqHeroSub:'每个列表都有通过支付提供商验证的真实 MRR — 无估算。', statAvgMult:'平均倍数' },
    dash: { favorites:'收藏', favEmpty:'暂无收藏。点击爱心图标将初创公司保存到此处。', loading:'加载中...' },
    acquire: { heroTitle:'购买<span>盈利的初创公司</span>，指标经过验证', heroSub:'每个列表都有通过 Stripe、LemonSqueezy 或 Polar 验证的真实 MRR。', step1Title:'浏览列表', step1Desc:'按类别、价格和收入倍数筛选', step2Title:'核实指标', step2Desc:'所有收入数据均直接通过支付提供商验证', step3Title:'联系卖家', step3Desc:'在初创公司详情页直接联系创始人' }
  },
  ar: {
    dir:'rtl', flag:'🇸🇦', code:'AR',
    nav: { home:'الرئيسية', acquire:'شراء', sell:'بيع شركة ناشئة', apiKey:'مفتاح API' },
    hero: { badge:'البيانات موثقة عبر Stripe و LemonSqueezy و Polar', title:'ابحث عن ', span:'شركة ناشئة موثقة', titleEnd:' بإيرادات مؤكدة', sub:'بيانات MRR حقيقية فقط. لا أرقام مخترعة.', btn1:'عرض المعروضة للبيع', btn2:'جميع الشركات الناشئة' },
    stats: { total:'الشركات الناشئة في قاعدة البيانات', sale:'معروضة للبيع الآن', mrr:'إجمالي MRR' },
    filter: { search:'بحث بالاسم...', allCats:'جميع الفئات', sortRevDesc:'حسب الإيرادات', sortGrowth:'حسب النمو', sortPriceAsc:'الأرخص أولاً', sortPriceDesc:'الأغلى أولاً', sortMultiple:'أفضل قيمة', sortListed:'المضافة حديثاً', sortDeal:'أفضل الصفقات', chipAll:'الكل', chipSale:'للبيع' },
    card: { mrr:'MRR', rev30:'إيرادات 30 يوم', growth:'نمو', customers:'العملاء', total:'الإجمالي', subs:'الاشتراكات', active:'نشط', price:'سعر الطلب', notSale:'غير معروض للبيع', more:'التفاصيل', verified:'موثق' },
    page: { label:'صفحة', of:'من' },
    modal: { title:'أدخل مفتاح API', desc:'تحتاج إلى مفتاح API من TrustMRR.', hint1:'احصل على المفتاح:', hint2:'تبدأ المفاتيح بـ', save:'حفظ وتحميل', demo:'وضع العرض التوضيحي' },
    footer: { data:'البيانات مقدمة من' },
    errors: { key:'مفتاح API غير صالح.', load:'خطأ في تحميل البيانات.' },
    empty: { title:'لم يتم العثور على شيء', sub:'حاول تغيير المرشحات' },
    cache: { loading:'جارٍ التحميل...', cached:'تم التحميل من الذاكرة المؤقتة', fresh:'تم تحديث البيانات' },
    startupPage: { back:'العودة إلى الكتالوج', founded:'تأسست', country:'الدولة', audience:'الجمهور', provider:'مزود الدفع', customers:'العملاء', subs:'الاشتراكات النشطة', rev30:'الإيرادات (30 يوم)', mrr:'MRR', totalRev:'إجمالي الإيرادات', growth:'نمو 30 يوم', margin:'هامش الربح', rank:'الترتيب', visitors:'الزوار (30 يوم)', contact:'التواصل مع البائع', viewOriginal:'زيارة الموقع', forSale:'للبيع', notForSale:'غير معروض للبيع', price:'سعر الطلب', multiple:'مضاعف الإيرادات', techStack:'مجموعة التقنيات', cofounders:'المؤسسون المشاركون', reveal:'فتح بيانات البائع والموقع', revealBtn:'فتح', revealNote:'يستهلك 1 مشاهدة من حدك اليومي', dailyChart:'المقاييس اليومية', chartCollecting:'جاري جمع البيانات اليومية', chartWillAppear:'سيظهر الرسم البياني خلال أيام قليلة — نحفظ لقطة يوميًا في 3:00 UTC.', chartEstimated:'تقديري' },
    idx: { heroTitle:'ابحث عن', heroSpan:'شركة ناشئة موثقة', heroEnd:'بإيرادات مؤكدة', heroSub:'بيانات موثقة فقط. كل مقياس تم التحقق منه مباشرة عبر مزودي الدفع.', statTotal:'الشركات الناشئة في قاعدة البيانات', statSale:'للبيع', statRev30:'الإيرادات (30 يوم)', statMrr:'إجمالي MRR', fltTitle:'المرشحات', fltReset:'إعادة تعيين', fltSearch:'بحث بالاسم...', fltStatus:'الحالة', fltStatusSale:'للبيع', fltStatusAll:'الكل', fltCats:'الفئات', fltCatsAll:'جميع الفئات...', fltRev30:'إيرادات 30 يوم', fltMrr:'MRR', fltGrowth:'نمو 30 يوم', fltPrice:'سعر الطلب', fltMultiple:'المضاعف', fltMargin:'هامش الربح', fltAudience:'الجمهور', fltMobile:'تطبيق الجوال', fltApply:'تطبيق المرشحات', fltAny:'أي', fltHas:'نعم', fltNo:'لا', sortRev:'الإيرادات ↓', sortGrowth:'النمو ↓', sortPriceAsc:'السعر ↑', sortPriceDesc:'السعر ↓', loading:'جاري تحميل الشركات الناشئة...', error:'خطأ في تحميل البيانات', notFound:'لم يتم العثور على شيء', countStartups:'شركة ناشئة', countOnSale:'للبيع', tipRev30:'إجمالي الإيرادات خلال آخر 30 يوم', tipMrr:'Monthly Recurring Revenue', tipGrowth:'تغيير MRR خلال 30 يوم بالنسبة المئوية', tipPrice:'سعر الطلب لـ 100% من الأسهم', tipMultiple:'السعر / MRR السنوي', cardRev:'إيراد 30ي', cardAsk:'السعر', cardMult:'مضاعف', cardMrr:'MRR', favorites:'المفضلة', anonLabel:'مجهول', anonHint:'اختار المؤسس البقاء مجهولاً', anonNoDesc:'اختار البائع عدم الكشف عن تفاصيل المنتج.', acqHeroTitle:'اشترِ', acqHeroSpan:'شركة ناشئة مربحة', acqHeroEnd:'بمقاييس مؤكدة', acqHeroSub:'كل إعلان لديه MRR حقيقي موثق عبر مزودي الدفع — لا تقديرات.', statAvgMult:'متوسط المضاعف' },
    dash: { favorites:'المفضلة', favEmpty:'لا توجد مفضلات بعد. اضغط على القلب لحفظ شركة ناشئة هنا.', loading:'جاري التحميل...' },
    acquire: { heroTitle:'اشترِ <span>شركة ناشئة مربحة</span> بمقاييس مؤكدة', heroSub:'كل إعلان يحتوي على MRR حقيقي موثق عبر Stripe أو LemonSqueezy أو Polar.', step1Title:'تصفح الإعلانات', step1Desc:'فلتر حسب الفئة والسعر ومضاعف الإيرادات', step2Title:'تحقق من المقاييس', step2Desc:'جميع بيانات الإيرادات موثقة مباشرة عبر مزودي الدفع', step3Title:'تواصل مع البائع', step3Desc:'تواصل مباشرة مع المؤسس في صفحة تفاصيل الشركة الناشئة' }
  }
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getLang() { return localStorage.getItem('lang') || 'ru'; }
function setLangCode(code) { localStorage.setItem('lang', code); location.reload(); }
function t(section, key) { const lang = getLang(); return (T[lang]||T.en)[section]?.[key] || (T.en[section]?.[key] || ''); }

function formatMoney(cents) {
  if (cents == null) return '—';
  const d = cents / 100;
  if (d >= 1000000) return '$' + (d/1000000).toFixed(1) + 'M';
  if (d >= 1000) return '$' + (d/1000).toFixed(1) + 'K';
  return '$' + Math.round(d).toLocaleString();
}
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── INDEXEDDB CACHE ───────────────────────────────────────────────────────────
// Stores all startups with full data — no size limit (up to ~1GB)
// Data lives forever, refreshed in background once per day
const IDB_NAME = 'startupmarket';
const IDB_VERSION = 1;
const IDB_STORE = 'startups';
const IDB_META = 'meta';

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE, { keyPath: 'slug' });
      if (!db.objectStoreNames.contains(IDB_META))  db.createObjectStore(IDB_META,  { keyPath: 'key' });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = () => reject(req.error);
  });
}

async function idbGetAll() {
  try {
    const db = await idbOpen();
    return await new Promise(resolve => {
      const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => resolve([]);
    });
  } catch { return []; }
}

async function idbGetOne(slug) {
  try {
    const db = await idbOpen();
    return await new Promise(resolve => {
      const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(slug);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = () => resolve(null);
    });
  } catch { return null; }
}

async function idbSaveAll(startups) {
  try {
    const db = await idbOpen();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([IDB_STORE, IDB_META], 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.clear();
      startups.forEach(s => store.put(s));
      tx.objectStore(IDB_META).put({ key: 'lastUpdate', ts: Date.now() });
      tx.oncomplete = resolve;
      tx.onerror    = () => reject(tx.error);
    });
  } catch {}
}

async function idbGetLastUpdate() {
  try {
    const db = await idbOpen();
    return await new Promise(resolve => {
      const req = db.transaction(IDB_META, 'readonly').objectStore(IDB_META).get('lastUpdate');
      req.onsuccess = () => resolve(req.result?.ts || null);
      req.onerror   = () => resolve(null);
    });
  } catch { return null; }
}

// ── NAV & MODAL ───────────────────────────────────────────────────────────────
function applyLangToDoc() {
  const lang = getLang();
  const l = T[lang] || T.en;
  document.documentElement.lang = lang;
  document.documentElement.dir = l.dir;
  const btn = document.getElementById('langBtnLabel');
  if (btn) btn.textContent = l.code;
  document.querySelectorAll('.lang-option').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === lang);
  });
  // Walk all elements with data-i18n attributes and translate them.
  // Supports dotted paths: data-i18n="hero.title" → t('hero', 'title').
  // data-i18n-html keeps HTML, data-i18n-placeholder sets input placeholder.
  const resolve = (path) => {
    const [sec, key] = path.split('.');
    return t(sec, key);
  };
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = resolve(el.dataset.i18n);
    if (val) el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const val = resolve(el.dataset.i18nHtml);
    if (val) el.innerHTML = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const val = resolve(el.dataset.i18nPlaceholder);
    if (val) el.setAttribute('placeholder', val);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const val = resolve(el.dataset.i18nTitle);
    if (val) el.setAttribute('title', val);
  });
}

function buildNavHTML(activePage) {
  const lang = getLang();
  const l = T[lang] || T.en;
  const langNames = { en:'English', de:'Deutsch', fr:'Français', it:'Italiano', ru:'Русский', zh:'中文', ar:'العربية' };
  return `
  <nav>
    <a class="nav-logo" href="/"><span class="nav-logo-dot"></span>MRRket</a>
    <div class="nav-center">
      <a href="/" class="nav-link ${activePage==='home'?'active':''}">${l.nav.home}</a>
      <a href="/acquire.html" class="nav-link ${activePage==='acquire'?'active':''}">${l.nav.acquire}</a>
    </div>
    <div class="nav-right">
      <div class="lang-switcher" id="langSwitcher">
        <button class="lang-btn" onclick="document.getElementById('langDropdown').classList.toggle('open')" id="langBtnLabel">${l.code}</button>
        <div class="lang-dropdown" id="langDropdown">
          ${Object.entries(T).map(([code, v]) => `<div class="lang-option ${code===lang?'active':''}" data-lang="${code}" onclick="setLangCode('${code}')">${langNames[code]||code}</div>`).join('')}
        </div>
      </div>
      <div id="navAuth"></div>
      <a class="btn btn-primary btn-sm" href="https://trustmrr.com/sell" target="_blank">${l.nav.sell}</a>
    </div>
  </nav>`;
}

function buildModalHTML() { return ''; }

// ── AUTH NAV ──────────────────────────────────────────────────────────────────
// Requires window.SUPABASE_URL + window.SUPABASE_ANON (from auth-config.js)
// and the Supabase JS SDK loaded before shared.js.
async function initNavAuth() {
  if (
    typeof window.supabase === 'undefined' ||
    !window.SUPABASE_URL ||
    window.SUPABASE_URL === 'YOUR_SUPABASE_URL'
  ) {
    updateNavAuth(null);
    return;
  }
  window._sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON || '');
  const { data: { session } } = await window._sb.auth.getSession();
  updateNavAuth(session);
  window._sb.auth.onAuthStateChange((_, s) => updateNavAuth(s));
}

async function updateNavAuth(session) {
  window._session = session; // expose token for page-level API calls
  const el = document.getElementById('navAuth');
  if (el) {
    if (!session?.user) {
      const from = encodeURIComponent(location.pathname + location.search);
      el.innerHTML = `<a class="btn btn-ghost btn-sm" href="/auth.html?from=${from}">Sign in</a>`;
    } else {
      const name = escHtml(session.user.email?.split('@')[0] || 'Account');
      el.innerHTML =
        `<a class="btn btn-ghost btn-sm" href="/dashboard.html" style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</a>` +
        `<button class="btn btn-ghost btn-sm" onclick="navSignOut()">Sign out</button>`;
    }
  }
  // Fetch access level and notify pages that need limit enforcement
  try {
    const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    const r = await fetch('/api/auth', { headers });
    if (r.ok) {
      window._access = await r.json();
      window.dispatchEvent(new CustomEvent('navAuthUpdated'));
    }
  } catch {}
}

async function navSignOut() {
  if (window._sb) await window._sb.auth.signOut();
  location.href = '/';
}

document.addEventListener('click', (e) => {
  const sw = document.getElementById('langSwitcher');
  if (sw && !sw.contains(e.target)) document.getElementById('langDropdown')?.classList.remove('open');
});
