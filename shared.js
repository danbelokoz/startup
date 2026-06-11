// ── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  en: {
    dir:'ltr', flag:'🇬🇧', code:'EN',
    nav: { home:'Home', acquire:'Buy', sell:'Sell a startup', apiKey:'API key', top:'Top growing' },
    hero: { badge:'Data verified via Stripe, LemonSqueezy & Polar', title:'Find a ', span:'verified startup', titleEnd:' with confirmed revenue', sub:'Real MRR data only. No made-up numbers — every metric verified directly through payment providers.', btn1:'View for sale', btn2:'All startups' },
    stats: { total:'Startups in database', sale:'For sale right now', mrr:'Total MRR' },
    filter: { search:'Search by name...', allCats:'All categories', sortRevDesc:'By revenue', sortGrowth:'By growth', sortPriceAsc:'Cheapest first', sortPriceDesc:'Most expensive', sortMultiple:'Best value', sortListed:'Recently listed', sortDeal:'Best deals', chipAll:'All', chipSale:'For sale' },
    card: { mrr:'MRR', rev30:'30-day revenue', growth:'growth', customers:'Customers', total:'total', subs:'Subscriptions', active:'active', price:'Asking price', notSale:'Not for sale', more:'Details', verified:'verified' },
    page: { label:'Page', of:'of' },
    modal: { title:'Enter API key', desc:'You need a TrustMRR API key. It is only used in your browser and never sent anywhere.', hint1:'Get your key:', hint2:'Keys start with', save:'Save & load', demo:'Demo mode' },
    errors: { key:'Invalid API key. Check your key at trustmrr.com/dashboard-dev', load:'Error loading data. Check your API key or internet connection.' },
    empty: { title:'Nothing found', sub:'Try changing the filters or search query' },
    cache: { loading:'Loading startups...', cached:'Loaded from cache', fresh:'Data updated' },
    startupPage: { back:'Back to catalog', founded:'Founded', country:'Country', audience:'Audience', provider:'Payment provider', customers:'Customers', subs:'Active subscriptions', rev30:'Revenue (30 days)', mrr:'MRR', totalRev:'Total revenue', growth:'30-day growth', margin:'Profit margin', rank:'Rank', visitors:'Visitors (30d)', contact:'Contact seller', viewOriginal:'Visit website', forSale:'For sale', notForSale:'Not for sale', price:'Asking price', multiple:'Revenue multiple', techStack:'Tech stack', cofounders:'Cofounders', reveal:'Open seller contacts and site', revealBtn:'Open', revealNote:'spends 1 view from your daily limit', dailyChart:'Daily metrics', chartCollecting:'Collecting daily data', chartWillAppear:"Chart will appear in a few days — we snapshot metrics every day at 3:00 UTC.", chartEstimated:'Estimated', tipProvider:'Revenue verified directly through this payment provider', tipMor:'Merchant of Record — the provider handles billing, taxes and compliance', tipRank:'Position in the overall revenue ranking of all verified startups', tipStealth:'The founder keeps the startup name hidden', tipCofounder:'The founder is looking for a cofounder', tipFunding:'Funding status of the startup', tipScore:'Acquisition attractiveness score from 0 to 100 — higher is better' },
    idx: { heroTitle:'Find a', heroSpan:'verified startup', heroEnd:'with confirmed revenue', heroSub:'Only verified data. Every metric checked directly through payment providers.', statTotal:'Startups in database', statSale:'For sale', statRev30:'Revenue (30d)', statMrr:'Total MRR', fltTitle:'Filters', fltReset:'Reset', fltSearch:'Search by name...', fltStatus:'Status', fltStatusSale:'For sale', fltStatusAll:'All', fltCats:'Categories', fltCatsAll:'All categories...', fltRev30:'30-day revenue', fltMrr:'MRR', fltGrowth:'30-day growth', fltPrice:'Asking price', fltMultiple:'Multiple', fltMargin:'Profit margin', fltAudience:'Audience', fltMobile:'Mobile app', fltApply:'Apply filters', fltAny:'Any', fltHas:'Has', fltNo:'No', sortRev:'Revenue ↓', sortGrowth:'Growth ↓', sortPriceAsc:'Price ↑', sortPriceDesc:'Price ↓', loading:'Loading startups...', error:'Error loading data', notFound:'Nothing found', countStartups:'startups', countOnSale:'for sale', tipRev30:'Total revenue over the last 30 days', tipMrr:'Monthly Recurring Revenue', tipGrowth:'MRR change over 30 days in %', tipPrice:'Asking price for 100% equity', tipMultiple:'Price / annual MRR', tipVerified:'Revenue verified directly through the payment provider', tipForSaleBadge:'The founder listed this startup for sale', tipNew:'Listed for sale within the last 7 days', tipCategory:'Show all {cat} startups — for sale first', cardRev:'Rev. 30d', cardAsk:'Asking', cardMult:'Multiple', cardMrr:'MRR', favorites:'Favorites', anonLabel:'anonymous', anonHint:'The founder chose to stay anonymous', anonNoDesc:'The seller chose not to disclose product details.', acqHeroTitle:'Buy a', acqHeroSpan:'profitable startup', acqHeroEnd:'with confirmed metrics', acqHeroSub:'Every listing has real MRR verified through payment providers — no estimates.', statAvgMult:'Average multiple' },
    dash: { favorites:'Favorites', favEmpty:'No favorites yet. Tap the heart on any startup to save it here.', loading:'Loading...' },
    acquire: { heroTitle:'Buy a <span>profitable startup</span> with confirmed metrics', heroSub:'Every listing has real MRR verified through Stripe, LemonSqueezy, or Polar. No made-up numbers.', step1Title:'Browse listings', step1Desc:'Filter by category, price, and revenue multiple to find the right deal', step2Title:'Verify metrics', step2Desc:'All revenue data is verified directly through payment providers — no estimates', step3Title:'Contact seller', step3Desc:'Reach out directly to the founder on the startup detail page' },
    roadmap: { title:'How MRRket works', sub:'Two simple paths — pick whether you want to buy a profitable startup or sell yours.', tabBuy:'I want to buy', tabSell:'I want to sell', forBuyers:'For buyers', forSellers:'For sellers', youAreHere:'You are here', done:'Done', statusGuest:'You are browsing as a guest', statusUser:'Free level', statusPro:'Advanced — unlimited access', revealsLeft:'reveals left today', b1t:'Create a free account', b1d:'Sign up with just an email and get 3 free contact reveals instantly — no credit card.', b2t:'Browse verified startups', b2d:'Every listing has real MRR verified through Stripe, LemonSqueezy and Polar. No guessed numbers.', b3t:'Level up your access', b3d:'The free level gives 8 reveals a day. Level up to unlock unlimited reveals, full metrics and seller contacts.', b4t:'Contact the seller', b4d:'Reveal the website and seller contacts, reach out directly and close the deal.', ctaSignup:'Create free account', ctaBrowse:'Browse startups', ctaUpgrade:'Upgrade level', ctaAccount:'Open my account', s1t:'Connect your payment provider', s1d:'Add a read-only API key from Stripe, LemonSqueezy, Polar, Paddle or any other payment provider — we read revenue only, your account stays safe.', s2t:'Set your asking price', s2d:'Pick a fair multiple (2–4× annual revenue is typical) and choose to stay anonymous until a buyer pays.', s3t:'Get listed for buyers', s3d:'Your startup appears in the marketplace with a verified badge, in front of buyers actively shopping.', s4t:'Get matched with buyers', s4d:'Interested buyers reveal your contacts and reach out. You negotiate and close on your terms.', ctaList:'List my startup' },
    lead: { title:'Top growing startups', sub:'The fastest-growing verified startups right now, ranked by 30-day momentum.', thRank:'#', thStartup:'Startup', thMrr:'MRR', thRev:'Revenue (30d)', thGrowth:'MoM Growth', sortBy:'Sort by', sortGrowth:'Growth', sortMrr:'MRR', sortRev:'Revenue', period:'Last 30 days', loading:'Loading leaderboard…', empty:'Leaderboard is warming up — check back shortly.', stealth:'Stealth startup', forSale:'For sale', verified:'verified', viewAll:'Open full catalog →' },
    acct: { profile:'Profile', favorites:'Favorites', settings:'Settings', signout:'Sign out', profileTitle:'Profile', nickname:'Nickname', nicknameHint:'This is how you appear across MRRket.', nicknamePh:'Your display name', save:'Save', saved:'Saved', email:'Email', planTitle:'Your level', levelFree:'Free', levelPro:'Advanced', planFreeDesc:'Free level — limited daily reveals.', planProDesc:'Advanced level — unlimited access, no daily limits.', limitsTitle:'Daily limit', viewsUsed:'Reveals used today', resets:'Resets at midnight UTC · Free level: 8 per day', upgradeLevel:'Upgrade level', upgradeDesc:'Unlock unlimited reveals, full seller contacts and metrics.', favEmpty:'No favorites yet. Tap the heart on any startup to save it here.', loading:'Loading…', settingsTitle:'Settings', notifTitle:'Email notifications', notifDesc:'Product updates and alerts about new listings that match your filters.', notifOn:'On', notifOff:'Off', pwTitle:'Change password', pwNew:'New password', pwConfirm:'Confirm new password', pwUpdate:'Update password', pwOk:'Password updated.', pwMismatch:'Passwords do not match.', pwShort:'Password must be at least 6 characters.', dangerTitle:'Delete account', dangerDesc:'Permanently delete your account, favorites and history. This cannot be undone.', deleteBtn:'Delete my account', deleteConfirm:'Delete account permanently? This cannot be undone.', deleting:'Deleting…' },
    sell: { title:'List your startup', sub:'Get in front of buyers actively shopping for verified MRR. Connect your payment provider — we pull revenue read-only so it stays trustworthy.', provider:'Payment provider', keyLabel:'Read-only API key', keyHint:'We only need a <b>restricted (read-only) key</b> — your account stays safe.', keyStep1:'Open your provider dashboard → API keys', keyStep2:'Create a restricted key, no write permissions', keyStep3:'Paste it above — we never store the raw secret', priceLabel:'Asking price (USD)', pricePh:'e.g. 50000', priceHint:'Buyers compare on revenue multiple (price ÷ annual MRR). The sweet spot for bootstrapped MRR businesses is <b>2-4×</b>. Example: $10k/yr in revenue → ask $20-40k.', marginLabel:'Profit margin, last 30 days (%)', marginPh:'e.g. 65', marginHint:'65 means you kept $65 out of every $100 in revenue after costs.', anon:'Stay anonymous until a buyer pays for contact', planLabel:'Listing plan', oneTime:'one-time', popular:'popular', fStarter:'Listed in marketplace', fListed:'Listed', fBrand:'Custom brand color', fNewsletter:'Newsletter feature', f3x:'3× views', fEverything:'Everything in the popular plan', fManager:'Dedicated deal manager', f20x:'20× views', fPinned:'Pinned 30 days', fMatching:'Buyer matching', submit:'Submit listing', submitting:'Submitting…', fillError:'Please fill in API key, asking price, and profit margin.', fallback:"Don't have read-only API access yet? Email {email} with your numbers and we'll list it manually.", successTitle:"Got it — we'll review your listing.", successBody:"You'll hear from us within 24 hours at the email you signed up with. Meanwhile, browse the marketplace to see how comparable startups are priced.", close:'Close' }
  },
  de: {
    dir:'ltr', flag:'🇩🇪', code:'DE',
    nav: { home:'Startseite', acquire:'Kaufen', sell:'Startup verkaufen', apiKey:'API-Schlüssel', top:'Top-Wachstum' },
    hero: { badge:'Daten verifiziert über Stripe, LemonSqueezy & Polar', title:'Finde ein ', span:'verifiziertes Startup', titleEnd:' mit bestätigtem Umsatz', sub:'Nur echte MRR-Daten. Keine erfundenen Zahlen.', btn1:'Zum Verkauf', btn2:'Alle Startups' },
    stats: { total:'Startups in der Datenbank', sale:'Gerade zum Verkauf', mrr:'Gesamt MRR' },
    filter: { search:'Nach Name suchen...', allCats:'Alle Kategorien', sortRevDesc:'Nach Umsatz', sortGrowth:'Nach Wachstum', sortPriceAsc:'Günstigste zuerst', sortPriceDesc:'Teuerste zuerst', sortMultiple:'Bestes Preis-Umsatz', sortListed:'Zuletzt gelistet', sortDeal:'Beste Deals', chipAll:'Alle', chipSale:'Zum Verkauf' },
    card: { mrr:'MRR', rev30:'30-Tage Umsatz', growth:'Wachstum', customers:'Kunden', total:'gesamt', subs:'Abonnements', active:'aktiv', price:'Verkaufspreis', notSale:'Nicht zum Verkauf', more:'Details', verified:'verifiziert' },
    page: { label:'Seite', of:'von' },
    modal: { title:'API-Schlüssel eingeben', desc:'Sie benötigen einen TrustMRR API-Schlüssel.', hint1:'Schlüssel erhalten:', hint2:'Schlüssel beginnen mit', save:'Speichern & laden', demo:'Demo-Modus' },
    errors: { key:'Ungültiger API-Schlüssel.', load:'Fehler beim Laden.' },
    empty: { title:'Nichts gefunden', sub:'Filter ändern' },
    cache: { loading:'Lade Startups...', cached:'Aus Cache geladen', fresh:'Daten aktualisiert' },
    startupPage: { back:'Zurück zum Katalog', founded:'Gegründet', country:'Land', audience:'Zielgruppe', provider:'Zahlungsanbieter', customers:'Kunden', subs:'Aktive Abonnements', rev30:'Umsatz (30 Tage)', mrr:'MRR', totalRev:'Gesamtumsatz', growth:'30-Tage Wachstum', margin:'Gewinnmarge', rank:'Rang', visitors:'Besucher (30T)', contact:'Verkäufer kontaktieren', viewOriginal:'Website öffnen', forSale:'Zum Verkauf', notForSale:'Nicht zum Verkauf', price:'Verkaufspreis', multiple:'Umsatzmultiplikator', techStack:'Tech Stack', cofounders:'Mitgründer', reveal:'Verkäuferkontakte und Website öffnen', revealBtn:'Öffnen', revealNote:'verbraucht 1 Aufruf aus deinem Tageslimit', dailyChart:'Tägliche Metriken', chartCollecting:'Sammle tägliche Daten', chartWillAppear:'Diagramm erscheint in einigen Tagen — wir speichern täglich um 3:00 UTC einen Snapshot.', chartEstimated:'Geschätzt', tipProvider:'Umsatz direkt über diesen Zahlungsanbieter verifiziert', tipMor:'Merchant of Record — der Anbieter übernimmt Abrechnung, Steuern und Compliance', tipRank:'Platz im Gesamtranking nach Umsatz unter allen verifizierten Startups', tipStealth:'Der Gründer hält den Namen des Startups geheim', tipCofounder:'Der Gründer sucht einen Mitgründer', tipFunding:'Finanzierungsstatus des Startups', tipScore:'Kaufattraktivität von 0 bis 100 — je höher, desto besser' },
    idx: { heroTitle:'Finde ein', heroSpan:'verifiziertes Startup', heroEnd:'mit bestätigtem Umsatz', heroSub:'Nur verifizierte Daten. Jede Kennzahl direkt über Zahlungsanbieter geprüft.', statTotal:'Startups in der Datenbank', statSale:'Zum Verkauf', statRev30:'Umsatz (30T)', statMrr:'Gesamt MRR', fltTitle:'Filter', fltReset:'Zurücksetzen', fltSearch:'Nach Name suchen...', fltStatus:'Status', fltStatusSale:'Zum Verkauf', fltStatusAll:'Alle', fltCats:'Kategorien', fltCatsAll:'Alle Kategorien...', fltRev30:'30-Tage Umsatz', fltMrr:'MRR', fltGrowth:'30-Tage Wachstum', fltPrice:'Verkaufspreis', fltMultiple:'Multiplikator', fltMargin:'Gewinnmarge', fltAudience:'Zielgruppe', fltMobile:'Mobile App', fltApply:'Filter anwenden', fltAny:'Beliebig', fltHas:'Ja', fltNo:'Nein', sortRev:'Umsatz ↓', sortGrowth:'Wachstum ↓', sortPriceAsc:'Preis ↑', sortPriceDesc:'Preis ↓', loading:'Lade Startups...', error:'Fehler beim Laden', notFound:'Nichts gefunden', countStartups:'Startups', countOnSale:'zum Verkauf', tipRev30:'Gesamtumsatz der letzten 30 Tage', tipMrr:'Monthly Recurring Revenue', tipGrowth:'MRR-Änderung in 30 Tagen in %', tipPrice:'Verkaufspreis für 100% der Anteile', tipMultiple:'Preis / Jahres-MRR', cardRev:'Umsatz 30T', cardAsk:'Preis', cardMult:'Multipl.', cardMrr:'MRR', favorites:'Favoriten', anonLabel:'anonym', anonHint:'Der Gründer bleibt anonym', anonNoDesc:'Der Verkäufer hat sich entschieden, Produktdetails nicht offenzulegen.', acqHeroTitle:'Kaufe ein', acqHeroSpan:'profitables Startup', acqHeroEnd:'mit bestätigten Kennzahlen', acqHeroSub:'Jedes Angebot hat echte MRR-Daten, verifiziert über Zahlungsanbieter — keine Schätzungen.', statAvgMult:'Durchschn. Multipl.' },
    dash: { favorites:'Favoriten', favEmpty:'Noch keine Favoriten. Tippe auf das Herz, um Startups hier zu speichern.', loading:'Lädt...' },
    acquire: { heroTitle:'Ein <span>profitables Startup</span> mit verifizierten Kennzahlen kaufen', heroSub:'Alle Listings haben echte MRR-Daten, verifiziert über Stripe, LemonSqueezy oder Polar.', step1Title:'Listings durchsuchen', step1Desc:'Nach Kategorie, Preis und Umsatzmultiplikator filtern', step2Title:'Kennzahlen prüfen', step2Desc:'Alle Umsatzdaten sind direkt durch Zahlungsanbieter verifiziert', step3Title:'Verkäufer kontaktieren', step3Desc:'Den Gründer direkt auf der Startup-Detailseite kontaktieren' },
    roadmap: { title:'So funktioniert MRRket', sub:'Zwei einfache Wege — wähle, ob du ein profitables Startup kaufen oder deins verkaufen willst.', tabBuy:'Ich will kaufen', tabSell:'Ich will verkaufen', forBuyers:'Für Käufer', forSellers:'Für Verkäufer', youAreHere:'Du bist hier', done:'Erledigt', statusGuest:'Du siehst dies als Gast', statusUser:'Kostenlose Stufe', statusPro:'Erweitert — unbegrenzter Zugang', revealsLeft:'Freischaltungen heute übrig', b1t:'Erstelle ein kostenloses Konto', b1d:'Registriere dich nur mit einer E-Mail und erhalte sofort 3 kostenlose Kontakt-Freischaltungen — ohne Kreditkarte.', b2t:'Verifizierte Startups durchsuchen', b2d:'Jedes Angebot hat echte MRR-Daten, verifiziert über Stripe, LemonSqueezy und Polar. Keine geschätzten Zahlen.', b3t:'Erhöhe deine Stufe', b3d:'Die kostenlose Stufe bietet 8 Freischaltungen pro Tag. Steige auf für unbegrenzte Freischaltungen, volle Kennzahlen und Verkäuferkontakte.', b4t:'Kontaktiere den Verkäufer', b4d:'Schalte Website und Verkäuferkontakte frei, melde dich direkt und schließe den Deal ab.', ctaSignup:'Kostenloses Konto erstellen', ctaBrowse:'Startups durchsuchen', ctaUpgrade:'Stufe erhöhen', ctaAccount:'Mein Konto öffnen', s1t:'Verbinde deinen Zahlungsanbieter', s1d:'Füge einen schreibgeschützten API-Schlüssel von Stripe, LemonSqueezy, Polar, Paddle oder einem beliebigen anderen Zahlungsanbieter hinzu — wir lesen nur den Umsatz, dein Konto bleibt sicher.', s2t:'Lege deinen Verkaufspreis fest', s2d:'Wähle einen fairen Multiplikator (üblich sind 2–4× Jahresumsatz) und bleibe auf Wunsch anonym, bis ein Käufer zahlt.', s3t:'Erscheine im Katalog für Käufer', s3d:'Dein Startup erscheint im Marktplatz mit einem Verifiziert-Abzeichen — vor Käufern, die aktiv suchen.', s4t:'Werde mit Käufern zusammengebracht', s4d:'Interessierte Käufer schalten deine Kontakte frei und melden sich. Du verhandelst und schließt zu deinen Bedingungen ab.', ctaList:'Mein Startup einstellen' },
    lead: { title:'Top wachsende Startups', sub:'Die am schnellsten wachsenden verifizierten Startups gerade jetzt — nach 30-Tage-Dynamik.', thRank:'#', thStartup:'Startup', thMrr:'MRR', thRev:'Umsatz (30T)', thGrowth:'Wachstum/Monat', sortBy:'Sortieren', sortGrowth:'Wachstum', sortMrr:'MRR', sortRev:'Umsatz', period:'Letzte 30 Tage', loading:'Lade Rangliste…', empty:'Die Rangliste wird vorbereitet — schau bald wieder vorbei.', stealth:'Stealth-Startup', forSale:'Zum Verkauf', verified:'verifiziert', viewAll:'Vollständigen Katalog öffnen →' },
    acct: { profile:'Profil', favorites:'Favoriten', settings:'Einstellungen', signout:'Abmelden', profileTitle:'Profil', nickname:'Spitzname', nicknameHint:'So erscheinst du auf MRRket.', nicknamePh:'Dein Anzeigename', save:'Speichern', saved:'Gespeichert', email:'E-Mail', planTitle:'Deine Stufe', levelFree:'Kostenlos', levelPro:'Erweitert', planFreeDesc:'Kostenlose Stufe — begrenzte tägliche Freischaltungen.', planProDesc:'Erweiterte Stufe — unbegrenzter Zugang, keine Tageslimits.', limitsTitle:'Tageslimit', viewsUsed:'Heute genutzte Freischaltungen', resets:'Setzt um Mitternacht UTC zurück · Kostenlose Stufe: 8 pro Tag', upgradeLevel:'Stufe erhöhen', upgradeDesc:'Schalte unbegrenzte Freischaltungen, volle Verkäuferkontakte und Kennzahlen frei.', favEmpty:'Noch keine Favoriten. Tippe auf das Herz, um Startups hier zu speichern.', loading:'Lädt…', settingsTitle:'Einstellungen', notifTitle:'E-Mail-Benachrichtigungen', notifDesc:'Produkt-Updates und Hinweise zu neuen Angeboten, die zu deinen Filtern passen.', notifOn:'An', notifOff:'Aus', pwTitle:'Passwort ändern', pwNew:'Neues Passwort', pwConfirm:'Neues Passwort bestätigen', pwUpdate:'Passwort aktualisieren', pwOk:'Passwort aktualisiert.', pwMismatch:'Passwörter stimmen nicht überein.', pwShort:'Das Passwort muss mindestens 6 Zeichen lang sein.', dangerTitle:'Konto löschen', dangerDesc:'Lösche dein Konto, Favoriten und Verlauf dauerhaft. Dies kann nicht rückgängig gemacht werden.', deleteBtn:'Mein Konto löschen', deleteConfirm:'Konto dauerhaft löschen? Dies kann nicht rückgängig gemacht werden.', deleting:'Wird gelöscht…' },
    sell: { title:'Startup einstellen', sub:'Zeige dein Startup Käufern, die aktiv nach verifiziertem MRR suchen. Verbinde deinen Zahlungsanbieter — wir lesen den Umsatz nur lesend, so bleibt es vertrauenswürdig.', provider:'Zahlungsanbieter', keyLabel:'Schreibgeschützter API-Schlüssel', keyHint:'Wir brauchen nur einen <b>eingeschränkten (schreibgeschützten) Schlüssel</b> — dein Konto bleibt sicher.', keyStep1:'Öffne dein Anbieter-Dashboard → API-Schlüssel', keyStep2:'Erstelle einen eingeschränkten Schlüssel ohne Schreibrechte', keyStep3:'Füge ihn oben ein — wir speichern das Geheimnis nie im Klartext', priceLabel:'Verkaufspreis (USD)', pricePh:'z. B. 50000', priceHint:'Käufer vergleichen über den Umsatzmultiplikator (Preis ÷ Jahres-MRR). Ideal für Bootstrap-MRR sind <b>2-4×</b>. Beispiel: $10k/Jahr Umsatz → fordere $20-40k.', marginLabel:'Gewinnmarge, letzte 30 Tage (%)', marginPh:'z. B. 65', marginHint:'65 bedeutet, dass du von je $100 Umsatz nach Kosten $65 behalten hast.', anon:'Anonym bleiben, bis ein Käufer für den Kontakt zahlt', planLabel:'Listing-Tarif', oneTime:'einmalig', popular:'beliebt', fStarter:'Im Marktplatz gelistet', fListed:'Gelistet', fBrand:'Eigene Markenfarbe', fNewsletter:'Newsletter-Platzierung', f3x:'3× Aufrufe', fEverything:'Alles aus dem beliebten Tarif', fManager:'Persönlicher Deal-Manager', f20x:'20× Aufrufe', fPinned:'30 Tage angeheftet', fMatching:'Käufer-Matching', submit:'Listing absenden', submitting:'Wird gesendet…', fillError:'Bitte API-Schlüssel, Verkaufspreis und Gewinnmarge ausfüllen.', fallback:'Noch keinen schreibgeschützten API-Zugang? Schreib an {email} mit deinen Zahlen und wir listen es manuell.', successTitle:'Erledigt — wir prüfen dein Listing.', successBody:'Du hörst innerhalb von 24 Stunden von uns an der E-Mail, mit der du dich angemeldet hast. Schau dir derweil den Marktplatz an, um vergleichbare Preise zu sehen.', close:'Schließen' }
  },
  fr: {
    dir:'ltr', flag:'🇫🇷', code:'FR',
    nav: { home:'Accueil', acquire:'Acheter', sell:'Vendre une startup', apiKey:'Clé API', top:'En croissance' },
    hero: { badge:'Données vérifiées via Stripe, LemonSqueezy & Polar', title:'Trouvez une ', span:'startup vérifiée', titleEnd:' avec des revenus confirmés', sub:'Uniquement des données MRR réelles. Aucun chiffre inventé.', btn1:'Voir à vendre', btn2:'Toutes les startups' },
    stats: { total:'Startups dans la base', sale:'En vente maintenant', mrr:'MRR total' },
    filter: { search:'Rechercher par nom...', allCats:'Toutes les catégories', sortRevDesc:'Par revenu', sortGrowth:'Par croissance', sortPriceAsc:'Moins cher', sortPriceDesc:'Plus cher', sortMultiple:'Meilleur rapport', sortListed:'Récemment listés', sortDeal:'Meilleures offres', chipAll:'Tous', chipSale:'À vendre' },
    card: { mrr:'MRR', rev30:'Revenu 30 jours', growth:'croissance', customers:'Clients', total:'total', subs:'Abonnements', active:'actifs', price:'Prix demandé', notSale:'Non à vendre', more:'Détails', verified:'vérifié' },
    page: { label:'Page', of:'sur' },
    modal: { title:'Entrez la clé API', desc:"Vous avez besoin d'une clé API TrustMRR.", hint1:'Obtenir la clé:', hint2:'Les clés commencent par', save:'Sauvegarder & charger', demo:'Mode démo' },
    errors: { key:'Clé API invalide.', load:'Erreur de chargement.' },
    empty: { title:'Rien trouvé', sub:'Modifier les filtres' },
    cache: { loading:'Chargement...', cached:'Chargé depuis le cache', fresh:'Données mises à jour' },
    startupPage: { back:'Retour au catalogue', founded:'Fondée', country:'Pays', audience:'Audience', provider:'Fournisseur de paiement', customers:'Clients', subs:'Abonnements actifs', rev30:'Revenu (30 jours)', mrr:'MRR', totalRev:'Revenu total', growth:'Croissance 30 jours', margin:'Marge bénéficiaire', rank:'Rang', visitors:'Visiteurs (30j)', contact:'Contacter le vendeur', viewOriginal:'Visiter le site', forSale:'À vendre', notForSale:'Non à vendre', price:'Prix demandé', multiple:'Multiple de revenus', techStack:'Stack technique', cofounders:'Cofondateurs', reveal:'Ouvrir les contacts du vendeur et le site', revealBtn:'Ouvrir', revealNote:'consomme 1 vue de votre limite quotidienne', dailyChart:'Métriques quotidiennes', chartCollecting:'Collecte des données quotidiennes', chartWillAppear:'Le graphique apparaîtra dans quelques jours — nous capturons les métriques chaque jour à 3h00 UTC.', chartEstimated:'Estimé', tipProvider:'Revenu vérifié directement via ce fournisseur de paiement', tipMor:'Merchant of Record — le fournisseur gère la facturation, les taxes et la conformité', tipRank:'Position dans le classement général par revenu parmi toutes les startups vérifiées', tipStealth:'Le fondateur garde le nom de la startup caché', tipCofounder:'Le fondateur cherche un cofondateur', tipFunding:'Statut de financement de la startup', tipScore:"Score d'attractivité pour l'achat de 0 à 100 — plus haut, c'est mieux" },
    idx: { heroTitle:'Trouvez une', heroSpan:'startup vérifiée', heroEnd:'avec revenus confirmés', heroSub:'Uniquement des données vérifiées. Chaque métrique vérifiée directement via les fournisseurs de paiement.', statTotal:'Startups dans la base', statSale:'À vendre', statRev30:'Revenu (30j)', statMrr:'MRR total', fltTitle:'Filtres', fltReset:'Réinitialiser', fltSearch:'Rechercher par nom...', fltStatus:'Statut', fltStatusSale:'À vendre', fltStatusAll:'Tous', fltCats:'Catégories', fltCatsAll:'Toutes les catégories...', fltRev30:'Revenu 30 jours', fltMrr:'MRR', fltGrowth:'Croissance 30 jours', fltPrice:'Prix demandé', fltMultiple:'Multiple', fltMargin:'Marge bénéficiaire', fltAudience:'Audience', fltMobile:'Application mobile', fltApply:'Appliquer les filtres', fltAny:'Tout', fltHas:'Oui', fltNo:'Non', sortRev:'Revenu ↓', sortGrowth:'Croissance ↓', sortPriceAsc:'Prix ↑', sortPriceDesc:'Prix ↓', loading:'Chargement des startups...', error:'Erreur de chargement', notFound:'Rien trouvé', countStartups:'startups', countOnSale:'à vendre', tipRev30:'Revenu total des 30 derniers jours', tipMrr:'Monthly Recurring Revenue', tipGrowth:'Variation MRR sur 30 jours en %', tipPrice:'Prix demandé pour 100% du capital', tipMultiple:'Prix / MRR annuel', cardRev:'Rev. 30j', cardAsk:'Prix', cardMult:'Multiple', cardMrr:'MRR', favorites:'Favoris', anonLabel:'anonyme', anonHint:'Le fondateur reste anonyme', anonNoDesc:'Le vendeur préfère ne pas divulguer les détails du produit.', acqHeroTitle:'Achète une', acqHeroSpan:'startup rentable', acqHeroEnd:'avec métriques confirmées', acqHeroSub:'Chaque annonce a un MRR réel vérifié via les fournisseurs de paiement — pas d\'estimations.', statAvgMult:'Multiple moyen' },
    dash: { favorites:'Favoris', favEmpty:"Aucun favori pour l'instant. Touchez le cœur pour enregistrer une startup ici.", loading:'Chargement...' },
    acquire: { heroTitle:'Acheter une <span>startup rentable</span> avec des métriques confirmées', heroSub:'Chaque annonce a un MRR réel vérifié via Stripe, LemonSqueezy ou Polar.', step1Title:'Parcourir les annonces', step1Desc:'Filtrer par catégorie, prix et multiple de revenus', step2Title:'Vérifier les métriques', step2Desc:'Toutes les données sont vérifiées directement via les fournisseurs de paiement', step3Title:'Contacter le vendeur', step3Desc:'Contactez directement le fondateur sur la page de détail' },
    roadmap: { title:'Comment fonctionne MRRket', sub:'Deux chemins simples — choisis si tu veux acheter une startup rentable ou vendre la tienne.', tabBuy:'Je veux acheter', tabSell:'Je veux vendre', forBuyers:'Pour les acheteurs', forSellers:'Pour les vendeurs', youAreHere:'Tu es ici', done:'Terminé', statusGuest:"Tu navigues en tant qu'invité", statusUser:'Niveau gratuit', statusPro:'Avancé — accès illimité', revealsLeft:"révélations restantes aujourd'hui", b1t:'Crée un compte gratuit', b1d:'Inscris-toi avec juste un email et obtiens 3 révélations de contact gratuites instantanément — sans carte bancaire.', b2t:'Parcours les startups vérifiées', b2d:'Chaque annonce a un MRR réel vérifié via Stripe, LemonSqueezy et Polar. Aucun chiffre estimé.', b3t:'Augmente ton niveau', b3d:'Le niveau gratuit offre 8 révélations par jour. Passe au niveau supérieur pour des révélations illimitées, toutes les métriques et les contacts vendeurs.', b4t:'Contacte le vendeur', b4d:'Révèle le site et les contacts du vendeur, contacte-le directement et conclus la vente.', ctaSignup:'Créer un compte gratuit', ctaBrowse:'Parcourir les startups', ctaUpgrade:'Augmenter le niveau', ctaAccount:'Ouvrir mon compte', s1t:'Connecte ton fournisseur de paiement', s1d:'Ajoute une clé API en lecture seule de Stripe, LemonSqueezy, Polar, Paddle ou de tout autre fournisseur de paiement — nous lisons seulement le revenu, ton compte reste protégé.', s2t:'Fixe ton prix de vente', s2d:"Choisis un multiple équitable (2–4× le revenu annuel est typique) et reste anonyme si tu veux, jusqu'à ce qu'un acheteur paie.", s3t:'Apparais dans le catalogue pour les acheteurs', s3d:'Ta startup apparaît sur la marketplace avec un badge vérifié — devant des acheteurs qui cherchent activement.', s4t:'Sois mis en relation avec des acheteurs', s4d:'Les acheteurs intéressés révèlent tes contacts et te contactent. Tu négocies et conclus selon tes conditions.', ctaList:'Publier ma startup' },
    lead: { title:'Startups en forte croissance', sub:'Les startups vérifiées qui croissent le plus vite en ce moment — selon la dynamique sur 30 jours.', thRank:'#', thStartup:'Startup', thMrr:'MRR', thRev:'Revenu (30j)', thGrowth:'Croissance/mois', sortBy:'Trier par', sortGrowth:'Croissance', sortMrr:'MRR', sortRev:'Revenu', period:'30 derniers jours', loading:'Chargement du classement…', empty:'Le classement se prépare — reviens bientôt.', stealth:'Startup furtive', forSale:'À vendre', verified:'vérifié', viewAll:'Ouvrir le catalogue complet →' },
    acct: { profile:'Profil', favorites:'Favoris', settings:'Paramètres', signout:'Se déconnecter', profileTitle:'Profil', nickname:'Pseudo', nicknameHint:'Voici comment tu apparais sur MRRket.', nicknamePh:"Ton nom d'affichage", save:'Enregistrer', saved:'Enregistré', email:'Email', planTitle:'Ton niveau', levelFree:'Gratuit', levelPro:'Avancé', planFreeDesc:'Niveau gratuit — révélations quotidiennes limitées.', planProDesc:'Niveau avancé — accès illimité, sans limites quotidiennes.', limitsTitle:'Limite quotidienne', viewsUsed:"Révélations utilisées aujourd'hui", resets:'Réinitialisé à minuit UTC · Niveau gratuit : 8 par jour', upgradeLevel:'Augmenter le niveau', upgradeDesc:'Débloque des révélations illimitées, tous les contacts vendeurs et les métriques.', favEmpty:'Aucun favori pour le moment. Touche le cœur pour enregistrer une startup ici.', loading:'Chargement…', settingsTitle:'Paramètres', notifTitle:'Notifications par email', notifDesc:'Nouveautés produit et alertes sur les nouvelles annonces correspondant à tes filtres.', notifOn:'Activé', notifOff:'Désactivé', pwTitle:'Changer le mot de passe', pwNew:'Nouveau mot de passe', pwConfirm:'Confirme le nouveau mot de passe', pwUpdate:'Mettre à jour le mot de passe', pwOk:'Mot de passe mis à jour.', pwMismatch:'Les mots de passe ne correspondent pas.', pwShort:'Le mot de passe doit contenir au moins 6 caractères.', dangerTitle:'Supprimer le compte', dangerDesc:'Supprime définitivement ton compte, tes favoris et ton historique. Ceci est irréversible.', deleteBtn:'Supprimer mon compte', deleteConfirm:'Supprimer le compte définitivement ? Ceci est irréversible.', deleting:'Suppression…' },
    sell: { title:'Publier ma startup', sub:'Mets ta startup devant des acheteurs qui cherchent activement un MRR vérifié. Connecte ton fournisseur de paiement — nous lisons le revenu en lecture seule, pour que ça reste fiable.', provider:'Fournisseur de paiement', keyLabel:'Clé API en lecture seule', keyHint:"Nous avons seulement besoin d'une <b>clé restreinte (lecture seule)</b> — ton compte reste protégé.", keyStep1:'Ouvre le tableau de bord de ton fournisseur → clés API', keyStep2:"Crée une clé restreinte, sans droits d'écriture", keyStep3:'Colle-la ci-dessus — nous ne stockons jamais le secret brut', priceLabel:'Prix demandé (USD)', pricePh:'ex. 50000', priceHint:"Les acheteurs comparent au multiple de revenu (prix ÷ MRR annuel). L'idéal pour un MRR bootstrap est <b>2-4×</b>. Exemple : $10k/an de revenu → demande $20-40k.", marginLabel:'Marge bénéficiaire, 30 derniers jours (%)', marginPh:'ex. 65', marginHint:'65 signifie que tu as gardé $65 sur chaque $100 de revenu après coûts.', anon:"Rester anonyme jusqu'à ce qu'un acheteur paie le contact", planLabel:'Formule de publication', oneTime:'une fois', popular:'populaire', fStarter:'Listé sur la marketplace', fListed:'Listé', fBrand:'Couleur de marque', fNewsletter:'Mise en avant newsletter', f3x:'3× vues', fEverything:'Tout du plan populaire', fManager:'Manager de transaction dédié', f20x:'20× vues', fPinned:'Épinglé 30 jours', fMatching:'Mise en relation acheteurs', submit:"Envoyer l'annonce", submitting:'Envoi…', fillError:'Remplis la clé API, le prix demandé et la marge bénéficiaire.', fallback:"Pas encore d'accès API en lecture seule ? Écris à {email} avec tes chiffres et nous publierons manuellement.", successTitle:"C'est noté — nous examinons ton annonce.", successBody:"Tu auras de nos nouvelles sous 24 heures à l'email avec lequel tu t'es inscrit. En attendant, parcours la marketplace pour voir les prix comparables.", close:'Fermer' }
  },
  it: {
    dir:'ltr', flag:'🇮🇹', code:'IT',
    nav: { home:'Home', acquire:'Acquista', sell:'Vendi startup', apiKey:'Chiave API', top:'In crescita' },
    hero: { badge:'Dati verificati tramite Stripe, LemonSqueezy e Polar', title:'Trova una ', span:'startup verificata', titleEnd:' con ricavi confermati', sub:'Solo dati MRR reali. Nessun numero inventato.', btn1:'Vedi in vendita', btn2:'Tutte le startup' },
    stats: { total:'Startup nel database', sale:'In vendita adesso', mrr:'MRR totale' },
    filter: { search:'Cerca per nome...', allCats:'Tutte le categorie', sortRevDesc:'Per fatturato', sortGrowth:'Per crescita', sortPriceAsc:'Più economico', sortPriceDesc:'Più costoso', sortMultiple:'Miglior rapporto', sortListed:'Aggiunti di recente', sortDeal:'Migliori offerte', chipAll:'Tutti', chipSale:'In vendita' },
    card: { mrr:'MRR', rev30:'Fatturato 30 giorni', growth:'crescita', customers:'Clienti', total:'totale', subs:'Abbonamenti', active:'attivi', price:'Prezzo richiesto', notSale:'Non in vendita', more:'Dettagli', verified:'verificato' },
    page: { label:'Pagina', of:'di' },
    modal: { title:'Inserisci la chiave API', desc:'Hai bisogno di una chiave API TrustMRR.', hint1:'Ottieni la chiave:', hint2:'Le chiavi iniziano con', save:'Salva e carica', demo:'Modalità demo' },
    errors: { key:'Chiave API non valida.', load:'Errore di caricamento.' },
    empty: { title:'Niente trovato', sub:'Cambia i filtri' },
    cache: { loading:'Caricamento...', cached:'Caricato dalla cache', fresh:'Dati aggiornati' },
    startupPage: { back:'Torna al catalogo', founded:'Fondata', country:'Paese', audience:'Pubblico', provider:'Fornitore pagamenti', customers:'Clienti', subs:'Abbonamenti attivi', rev30:'Fatturato (30 giorni)', mrr:'MRR', totalRev:'Fatturato totale', growth:'Crescita 30 giorni', margin:'Margine di profitto', rank:'Classifica', visitors:'Visitatori (30g)', contact:'Contatta il venditore', viewOriginal:'Visita il sito', forSale:'In vendita', notForSale:'Non in vendita', price:'Prezzo richiesto', multiple:'Multiplo di ricavi', techStack:'Stack tecnologico', cofounders:'Cofondatori', reveal:'Apri i contatti del venditore e il sito', revealBtn:'Apri', revealNote:'consuma 1 visualizzazione dal limite giornaliero', dailyChart:'Metriche giornaliere', chartCollecting:'Raccolta dati giornalieri', chartWillAppear:'Il grafico apparirà tra qualche giorno — salviamo uno snapshot ogni giorno alle 3:00 UTC.', chartEstimated:'Stimato', tipProvider:'Ricavi verificati direttamente tramite questo fornitore di pagamenti', tipMor:'Merchant of Record — il fornitore gestisce fatturazione, tasse e conformità', tipRank:'Posizione nella classifica generale per ricavi tra tutte le startup verificate', tipStealth:'Il fondatore tiene nascosto il nome della startup', tipCofounder:'Il fondatore cerca un cofondatore', tipFunding:'Stato di finanziamento della startup', tipScore:"Punteggio di attrattività per l'acquisto da 0 a 100 — più alto è meglio" },
    idx: { heroTitle:'Trova una', heroSpan:'startup verificata', heroEnd:'con ricavi confermati', heroSub:'Solo dati verificati. Ogni metrica controllata direttamente tramite i fornitori di pagamento.', statTotal:'Startup nel database', statSale:'In vendita', statRev30:'Fatturato (30g)', statMrr:'MRR totale', fltTitle:'Filtri', fltReset:'Reimposta', fltSearch:'Cerca per nome...', fltStatus:'Stato', fltStatusSale:'In vendita', fltStatusAll:'Tutti', fltCats:'Categorie', fltCatsAll:'Tutte le categorie...', fltRev30:'Fatturato 30 giorni', fltMrr:'MRR', fltGrowth:'Crescita 30 giorni', fltPrice:'Prezzo richiesto', fltMultiple:'Multiplo', fltMargin:'Margine di profitto', fltAudience:'Pubblico', fltMobile:'App mobile', fltApply:'Applica filtri', fltAny:'Qualsiasi', fltHas:'Sì', fltNo:'No', sortRev:'Fatturato ↓', sortGrowth:'Crescita ↓', sortPriceAsc:'Prezzo ↑', sortPriceDesc:'Prezzo ↓', loading:'Caricamento startup...', error:'Errore di caricamento', notFound:'Niente trovato', countStartups:'startup', countOnSale:'in vendita', tipRev30:'Fatturato totale degli ultimi 30 giorni', tipMrr:'Monthly Recurring Revenue', tipGrowth:'Variazione MRR in 30 giorni in %', tipPrice:'Prezzo richiesto per il 100% delle quote', tipMultiple:'Prezzo / MRR annuale', cardRev:'Ric. 30g', cardAsk:'Prezzo', cardMult:'Multiplo', cardMrr:'MRR', favorites:'Preferiti', anonLabel:'anonimo', anonHint:'Il fondatore rimane anonimo', anonNoDesc:'Il venditore ha scelto di non rivelare i dettagli del prodotto.', acqHeroTitle:'Acquista una', acqHeroSpan:'startup redditizia', acqHeroEnd:'con metriche confermate', acqHeroSub:'Ogni annuncio ha MRR reale verificato tramite i fornitori di pagamento — niente stime.', statAvgMult:'Multiplo medio' },
    dash: { favorites:'Preferiti', favEmpty:'Ancora nessun preferito. Tocca il cuore per salvare una startup qui.', loading:'Caricamento...' },
    acquire: { heroTitle:'Acquista una <span>startup redditizia</span> con metriche confermate', heroSub:'Ogni annuncio ha MRR reale verificato tramite Stripe, LemonSqueezy o Polar.', step1Title:'Sfoglia gli annunci', step1Desc:'Filtra per categoria, prezzo e multiplo di ricavi', step2Title:'Verifica le metriche', step2Desc:'Tutti i dati sui ricavi sono verificati direttamente tramite i fornitori di pagamento', step3Title:'Contatta il venditore', step3Desc:'Contatta direttamente il fondatore nella pagina di dettaglio' },
    roadmap: { title:'Come funziona MRRket', sub:'Due percorsi semplici — scegli se vuoi comprare una startup redditizia o vendere la tua.', tabBuy:'Voglio comprare', tabSell:'Voglio vendere', forBuyers:'Per i compratori', forSellers:'Per i venditori', youAreHere:'Sei qui', done:'Fatto', statusGuest:'Stai navigando come ospite', statusUser:'Livello gratuito', statusPro:'Avanzato — accesso illimitato', revealsLeft:'visualizzazioni rimaste oggi', b1t:'Crea un account gratuito', b1d:"Registrati solo con un'email e ottieni subito 3 rivelazioni di contatto gratuite — senza carta.", b2t:'Sfoglia le startup verificate', b2d:'Ogni annuncio ha un MRR reale verificato tramite Stripe, LemonSqueezy e Polar. Nessun numero stimato.', b3t:'Aumenta il tuo livello', b3d:'Il livello gratuito offre 8 rivelazioni al giorno. Passa a un livello superiore per rivelazioni illimitate, metriche complete e contatti dei venditori.', b4t:'Contatta il venditore', b4d:'Rivela il sito e i contatti del venditore, contattalo direttamente e chiudi la trattativa.', ctaSignup:'Crea account gratuito', ctaBrowse:'Sfoglia le startup', ctaUpgrade:'Aumenta il livello', ctaAccount:'Apri il mio account', s1t:'Collega il tuo fornitore di pagamenti', s1d:'Aggiungi una chiave API di sola lettura da Stripe, LemonSqueezy, Polar, Paddle o da qualsiasi altro fornitore di pagamenti — leggiamo solo i ricavi, il tuo account resta al sicuro.', s2t:'Imposta il prezzo di vendita', s2d:'Scegli un multiplo equo (di solito 2–4× il fatturato annuo) e resta anonimo, se vuoi, finché un compratore non paga.', s3t:'Entra nel catalogo per i compratori', s3d:'La tua startup appare nel marketplace con un badge verificato — davanti ai compratori che cercano attivamente.', s4t:'Trova compratori interessati', s4d:'I compratori interessati rivelano i tuoi contatti e ti scrivono. Tu negozi e chiudi alle tue condizioni.', ctaList:'Pubblica la mia startup' },
    lead: { title:'Startup in forte crescita', sub:'Le startup verificate che crescono più velocemente in questo momento — per dinamica a 30 giorni.', thRank:'#', thStartup:'Startup', thMrr:'MRR', thRev:'Ricavi (30g)', thGrowth:'Crescita/mese', sortBy:'Ordina per', sortGrowth:'Crescita', sortMrr:'MRR', sortRev:'Ricavi', period:'Ultimi 30 giorni', loading:'Caricamento classifica…', empty:'La classifica si sta preparando — torna tra poco.', stealth:'Startup stealth', forSale:'In vendita', verified:'verificato', viewAll:'Apri il catalogo completo →' },
    acct: { profile:'Profilo', favorites:'Preferiti', settings:'Impostazioni', signout:'Esci', profileTitle:'Profilo', nickname:'Nickname', nicknameHint:'Così appari su MRRket.', nicknamePh:'Il tuo nome visualizzato', save:'Salva', saved:'Salvato', email:'Email', planTitle:'Il tuo livello', levelFree:'Gratuito', levelPro:'Avanzato', planFreeDesc:'Livello gratuito — rivelazioni giornaliere limitate.', planProDesc:'Livello avanzato — accesso illimitato, senza limiti giornalieri.', limitsTitle:'Limite giornaliero', viewsUsed:'Rivelazioni usate oggi', resets:'Si azzera a mezzanotte UTC · Livello gratuito: 8 al giorno', upgradeLevel:'Aumenta il livello', upgradeDesc:'Sblocca rivelazioni illimitate, contatti completi dei venditori e metriche.', favEmpty:'Ancora nessun preferito. Tocca il cuore per salvare una startup qui.', loading:'Caricamento…', settingsTitle:'Impostazioni', notifTitle:'Notifiche email', notifDesc:'Aggiornamenti sul prodotto e avvisi sui nuovi annunci che corrispondono ai tuoi filtri.', notifOn:'Attivo', notifOff:'Disattivo', pwTitle:'Cambia password', pwNew:'Nuova password', pwConfirm:'Conferma nuova password', pwUpdate:'Aggiorna password', pwOk:'Password aggiornata.', pwMismatch:'Le password non corrispondono.', pwShort:'La password deve avere almeno 6 caratteri.', dangerTitle:'Elimina account', dangerDesc:'Elimina definitivamente il tuo account, i preferiti e la cronologia. Non puoi annullare.', deleteBtn:'Elimina il mio account', deleteConfirm:"Eliminare l'account definitivamente? Non puoi annullare.", deleting:'Eliminazione…' },
    sell: { title:'Pubblica la mia startup', sub:'Mostra la tua startup ai compratori che cercano attivamente un MRR verificato. Collega il tuo fornitore di pagamenti — leggiamo i ricavi in sola lettura, così resta affidabile.', provider:'Fornitore di pagamenti', keyLabel:'Chiave API di sola lettura', keyHint:'Ci serve solo una <b>chiave limitata (sola lettura)</b> — il tuo account resta al sicuro.', keyStep1:'Apri la dashboard del fornitore → chiavi API', keyStep2:'Crea una chiave limitata, senza permessi di scrittura', keyStep3:'Incollala sopra — non memorizziamo mai il segreto in chiaro', priceLabel:'Prezzo richiesto (USD)', pricePh:'es. 50000', priceHint:"I compratori confrontano sul multiplo dei ricavi (prezzo ÷ MRR annuo). L'ideale per un MRR bootstrap è <b>2-4×</b>. Esempio: $10k/anno di ricavi → chiedi $20-40k.", marginLabel:'Margine di profitto, ultimi 30 giorni (%)', marginPh:'es. 65', marginHint:'65 significa che hai tenuto $65 ogni $100 di ricavi dopo i costi.', anon:'Resta anonimo finché un compratore non paga il contatto', planLabel:'Piano di inserzione', oneTime:'una tantum', popular:'popolare', fStarter:'Inserito nel marketplace', fListed:'Inserito', fBrand:'Colore del brand', fNewsletter:'Spazio in newsletter', f3x:'3× visualizzazioni', fEverything:'Tutto del piano popolare', fManager:'Manager dedicato alla trattativa', f20x:'20× visualizzazioni', fPinned:'In evidenza 30 giorni', fMatching:'Abbinamento compratori', submit:'Invia inserzione', submitting:'Invio…', fillError:'Compila chiave API, prezzo richiesto e margine di profitto.', fallback:'Non hai ancora accesso API in sola lettura? Scrivi a {email} con i tuoi numeri e la inseriamo manualmente.', successTitle:'Fatto — esamineremo la tua inserzione.', successBody:"Ti contatteremo entro 24 ore all'email con cui ti sei registrato. Intanto esplora il marketplace per vedere i prezzi di startup simili.", close:'Chiudi' }
  },
  ru: {
    dir:'ltr', flag:'🇷🇺', code:'RU',
    nav: { home:'Главная', acquire:'Купить', sell:'Продать стартап', apiKey:'API ключ', top:'Топ растущих' },
    hero: { badge:'Данные верифицированы через Stripe, LemonSqueezy и Polar', title:'Найди ', span:'верифицированный стартап', titleEnd:' с подтверждённой выручкой', sub:'Только реальные MRR-данные. Никаких выдуманных цифр — каждый показатель проверен через платёжные провайдеры напрямую.', btn1:'На продаже', btn2:'Все стартапы' },
    stats: { total:'Стартапов в базе', sale:'На продаже сейчас', mrr:'Суммарный MRR' },
    filter: { search:'Поиск по названию...', allCats:'Все категории', sortRevDesc:'По выручке', sortGrowth:'По росту', sortPriceAsc:'Дешевле сначала', sortPriceDesc:'Дороже сначала', sortMultiple:'Лучшая цена/выручка', sortListed:'Недавно добавлены', sortDeal:'Лучшие сделки', chipAll:'Все', chipSale:'На продаже' },
    card: { mrr:'MRR', rev30:'Выручка 30 дней', growth:'рост', customers:'Клиентов', total:'всего', subs:'Подписки', active:'активных', price:'Цена продажи', notSale:'Не продаётся', more:'Подробнее', verified:'verified' },
    page: { label:'Страница', of:'из' },
    modal: { title:'Введите API ключ', desc:'Для работы сайта нужен API ключ TrustMRR. Он используется только в вашем браузере и никуда не отправляется.', hint1:'Получить ключ:', hint2:'Ключи начинаются с', save:'Сохранить и загрузить', demo:'Демо-режим' },
    errors: { key:'Неверный API ключ. Проверьте ключ на trustmrr.com/dashboard-dev', load:'Ошибка загрузки данных. Проверьте API ключ или интернет-соединение.' },
    empty: { title:'Ничего не найдено', sub:'Попробуйте изменить фильтры или поисковый запрос' },
    cache: { loading:'Загружаем стартапы...', cached:'Загружено из кэша', fresh:'Данные обновлены' },
    startupPage: { back:'Назад в каталог', founded:'Основан', country:'Страна', audience:'Аудитория', provider:'Платёжный провайдер', customers:'Клиентов', subs:'Активных подписок', rev30:'Выручка (30 дней)', mrr:'MRR', totalRev:'Общая выручка', growth:'Рост за 30 дней', margin:'Маржа прибыли', rank:'Место в рейтинге', visitors:'Посетителей (30д)', contact:'Связаться с продавцом', viewOriginal:'Открыть сайт', forSale:'На продаже', notForSale:'Не продаётся', price:'Цена', multiple:'Мультипл выручки', techStack:'Технологии', cofounders:'Сооснователи', reveal:'Открыть контакты продавца и сайт', revealBtn:'Открыть', revealNote:'тратит 1 просмотр из вашего лимита', dailyChart:'Динамика по дням', chartCollecting:'Собираем дневные данные', chartWillAppear:'График появится через несколько дней — каждый день в 3:00 UTC мы сохраняем снимок метрик.', chartEstimated:'Расчётно', tipProvider:'Выручка верифицирована напрямую через этого платёжного провайдера', tipMor:'Merchant of Record — провайдер берёт на себя платежи, налоги и комплаенс', tipRank:'Место в общем рейтинге по выручке среди всех проверенных стартапов', tipStealth:'Основатель скрывает название стартапа', tipCofounder:'Основатель ищет кофаундера', tipFunding:'Статус финансирования стартапа', tipScore:'Оценка привлекательности для покупки от 0 до 100 — чем выше, тем лучше' },
    idx: { heroTitle:'Найди', heroSpan:'верифицированный', heroEnd:'стартап с выручкой', heroSub:'Только подтверждённые данные. Каждый показатель проверен через платёжные провайдеры напрямую.', statTotal:'Стартапов в базе', statSale:'На продаже', statRev30:'Выручка (30д)', statMrr:'Суммарный MRR', fltTitle:'Фильтры', fltReset:'Сбросить', fltSearch:'Поиск по названию...', fltStatus:'Статус', fltStatusSale:'На продаже', fltStatusAll:'Все', fltCats:'Категории', fltCatsAll:'Все категории...', fltRev30:'Выручка 30 дней', fltMrr:'MRR', fltGrowth:'Рост 30 дней', fltPrice:'Цена продажи', fltMultiple:'Мультипликатор', fltMargin:'Маржа прибыли', fltAudience:'Аудитория', fltMobile:'Мобильное приложение', fltApply:'Применить фильтры', fltAny:'Любой', fltHas:'Есть', fltNo:'Нет', sortRev:'Выручка ↓', sortGrowth:'Рост ↓', sortPriceAsc:'Цена ↑', sortPriceDesc:'Цена ↓', loading:'Загружаем стартапы...', error:'Ошибка загрузки данных', notFound:'Ничего не найдено', countStartups:'стартапов', countOnSale:'на продаже', tipRev30:'Суммарная выручка за последние 30 дней', tipMrr:'Monthly Recurring Revenue', tipGrowth:'Изменение MRR за 30 дней в %', tipPrice:'Запрашиваемая цена за 100% доли', tipMultiple:'Цена / годовой MRR', tipVerified:'Выручка подтверждена напрямую через платёжного провайдера', tipForSaleBadge:'Основатель выставил стартап на продажу', tipNew:'Выставлен на продажу за последние 7 дней', tipCategory:'Показать все стартапы категории {cat} — сначала те, что на продаже', cardRev:'Выр. 30д', cardAsk:'Цена', cardMult:'Мультипл', cardMrr:'MRR', favorites:'Избранное', anonLabel:'аноним', anonHint:'Основатель решил остаться анонимным', anonNoDesc:'Продавец решил не раскрывать детали продукта.', acqHeroTitle:'Купи', acqHeroSpan:'прибыльный стартап', acqHeroEnd:'с подтверждёнными метриками', acqHeroSub:'У каждого объявления реальный MRR, верифицированный через платёжных провайдеров — без оценок.', statAvgMult:'Средний мультипл' },
    dash: { favorites:'Избранное', favEmpty:'Пока нет избранных. Нажми на сердечко у стартапа, чтобы сохранить его здесь.', loading:'Загрузка...' },
    acquire: { heroTitle:'Купи <span>прибыльный стартап</span> с подтверждёнными метриками', heroSub:'У каждого объявления реальный MRR, верифицированный через Stripe, LemonSqueezy или Polar.', step1Title:'Смотри объявления', step1Desc:'Фильтруй по категории, цене и мультиплу выручки', step2Title:'Проверяй метрики', step2Desc:'Все данные по выручке подтверждены напрямую через платёжные сервисы', step3Title:'Свяжись с продавцом', step3Desc:'Пиши основателю напрямую со страницы стартапа' },
    roadmap: { title:'Как работает MRRket', sub:'Два простых пути — выбери, хочешь ли ты купить прибыльный стартап или продать свой.', tabBuy:'Хочу купить', tabSell:'Хочу продать', forBuyers:'Для покупателей', forSellers:'Для продавцов', youAreHere:'Ты здесь', done:'Готово', statusGuest:'Ты просматриваешь как гость', statusUser:'Бесплатный уровень', statusPro:'Продвинутый — безлимитный доступ', revealsLeft:'просмотров осталось сегодня', b1t:'Создай бесплатный аккаунт', b1d:'Регистрация только по email — сразу 3 бесплатных раскрытия контактов, без карты.', b2t:'Смотри проверенные стартапы', b2d:'У каждого объявления реальный MRR, верифицированный через Stripe, LemonSqueezy и Polar. Без выдуманных цифр.', b3t:'Повысь свой уровень', b3d:'Бесплатный уровень даёт 8 раскрытий в день. Повысь уровень — безлимит раскрытий, полные метрики и контакты продавца.', b4t:'Свяжись с продавцом', b4d:'Раскрой сайт и контакты продавца, напиши напрямую и закрой сделку.', ctaSignup:'Создать бесплатный аккаунт', ctaBrowse:'Смотреть стартапы', ctaUpgrade:'Повысить уровень', ctaAccount:'Открыть кабинет', s1t:'Подключи платёжного провайдера', s1d:'Добавь read-only API-ключ из Stripe, LemonSqueezy, Polar, Paddle или любого другого платёжного провайдера — мы читаем выручку только на чтение, твой аккаунт в безопасности.', s2t:'Укажи цену продажи', s2d:'Выбери справедливый мультипл (обычно 2–4× годовой выручки) и при желании останься анонимным, пока покупатель не оплатит контакт.', s3t:'Попади в каталог для покупателей', s3d:'Твой стартап появляется на маркетплейсе с бейджем проверки — перед покупателями, которые активно ищут.', s4t:'Получай заявки от покупателей', s4d:'Заинтересованные покупатели раскрывают твои контакты и пишут. Ты ведёшь переговоры и закрываешь сделку на своих условиях.', ctaList:'Разместить стартап' },
    lead: { title:'Топ растущих стартапов', sub:'Самые быстрорастущие проверенные стартапы прямо сейчас — по динамике за 30 дней.', thRank:'#', thStartup:'Стартап', thMrr:'MRR', thRev:'Выручка (30д)', thGrowth:'Рост за месяц', sortBy:'Сортировка', sortGrowth:'Рост', sortMrr:'MRR', sortRev:'Выручка', period:'За 30 дней', loading:'Загружаем рейтинг…', empty:'Рейтинг готовится — загляни чуть позже.', stealth:'Стелс-стартап', forSale:'На продаже', verified:'проверен', viewAll:'Открыть полный каталог →' },
    acct: { profile:'Профиль', favorites:'Избранное', settings:'Настройки', signout:'Выйти', profileTitle:'Профиль', nickname:'Никнейм', nicknameHint:'Так ты отображаешься на MRRket.', nicknamePh:'Отображаемое имя', save:'Сохранить', saved:'Сохранено', email:'Email', planTitle:'Твой уровень', levelFree:'Бесплатный', levelPro:'Продвинутый', planFreeDesc:'Бесплатный уровень — ограниченные раскрытия в день.', planProDesc:'Продвинутый уровень — безлимитный доступ, без дневных лимитов.', limitsTitle:'Дневной лимит', viewsUsed:'Раскрытий использовано сегодня', resets:'Сбрасывается в полночь UTC · Бесплатный уровень: 8 в день', upgradeLevel:'Повысить уровень', upgradeDesc:'Открой безлимит раскрытий, полные контакты продавцов и метрики.', favEmpty:'Пока нет избранных. Нажми на сердечко у стартапа, чтобы сохранить его здесь.', loading:'Загрузка…', settingsTitle:'Настройки', notifTitle:'Email-уведомления', notifDesc:'Новости продукта и алерты о новых листингах по твоим фильтрам.', notifOn:'Вкл', notifOff:'Выкл', pwTitle:'Сменить пароль', pwNew:'Новый пароль', pwConfirm:'Повтори новый пароль', pwUpdate:'Обновить пароль', pwOk:'Пароль обновлён.', pwMismatch:'Пароли не совпадают.', pwShort:'Пароль должен быть не короче 6 символов.', dangerTitle:'Удалить аккаунт', dangerDesc:'Безвозвратно удалить аккаунт, избранное и историю. Это нельзя отменить.', deleteBtn:'Удалить мой аккаунт', deleteConfirm:'Удалить аккаунт навсегда? Это нельзя отменить.', deleting:'Удаляем…' },
    sell: { title:'Разместить стартап', sub:'Покажи свой стартап покупателям, которые активно ищут проверенный MRR. Подключи платёжного провайдера — выручку мы читаем только на чтение, так это остаётся надёжным.', provider:'Платёжный провайдер', keyLabel:'API-ключ только для чтения', keyHint:'Нам нужен только <b>ограниченный (read-only) ключ</b> — твой аккаунт в безопасности.', keyStep1:'Открой панель провайдера → API-ключи', keyStep2:'Создай ограниченный ключ без прав на запись', keyStep3:'Вставь его выше — мы не храним сам секрет', priceLabel:'Цена продажи (USD)', pricePh:'напр. 50000', priceHint:'Покупатели сравнивают по мультиплу выручки (цена ÷ годовой MRR). Оптимально для бутстрап-MRR — <b>2-4×</b>. Пример: $10k/год выручки → проси $20-40k.', marginLabel:'Маржа прибыли за 30 дней (%)', marginPh:'напр. 65', marginHint:'65 означает, что из каждых $100 выручки ты оставил $65 после расходов.', anon:'Оставаться анонимным, пока покупатель не оплатит контакт', planLabel:'Тариф размещения', oneTime:'разово', popular:'популярный', fStarter:'В каталоге маркетплейса', fListed:'В каталоге', fBrand:'Свой цвет бренда', fNewsletter:'Попадание в рассылку', f3x:'3× просмотров', fEverything:'Всё из популярного тарифа', fManager:'Личный менеджер сделки', f20x:'20× просмотров', fPinned:'Закреплён на 30 дней', fMatching:'Подбор покупателей', submit:'Отправить заявку', submitting:'Отправляем…', fillError:'Заполни API-ключ, цену продажи и маржу прибыли.', fallback:'Пока нет read-only доступа к API? Напиши на {email} со своими цифрами — разместим вручную.', successTitle:'Готово — мы рассмотрим твою заявку.', successBody:'Мы напишем в течение 24 часов на email, с которым ты зарегистрировался. А пока посмотри маркетплейс, чтобы оценить цены похожих стартапов.', close:'Закрыть' }
  },
  zh: {
    dir:'ltr', flag:'🇨🇳', code:'ZH',
    nav: { home:'首页', acquire:'购买', sell:'出售初创公司', apiKey:'API 密钥', top:'增长榜' },
    hero: { badge:'数据通过 Stripe、LemonSqueezy 和 Polar 验证', title:'找到', span:'经过验证的初创公司', titleEnd:'，收入经过确认', sub:'只有真实的 MRR 数据。没有虚构数字。', btn1:'查看在售', btn2:'所有初创公司' },
    stats: { total:'数据库中的初创公司', sale:'当前在售', mrr:'总 MRR' },
    filter: { search:'按名称搜索...', allCats:'所有类别', sortRevDesc:'按收入', sortGrowth:'按增长', sortPriceAsc:'价格从低到高', sortPriceDesc:'价格从高到低', sortMultiple:'最佳性价比', sortListed:'最近上架', sortDeal:'最佳交易', chipAll:'全部', chipSale:'在售' },
    card: { mrr:'MRR', rev30:'30天收入', growth:'增长', customers:'客户', total:'总计', subs:'订阅', active:'活跃', price:'要价', notSale:'不出售', more:'详情', verified:'已验证' },
    page: { label:'第', of:'页，共' },
    modal: { title:'输入 API 密钥', desc:'您需要 TrustMRR API 密钥。', hint1:'获取密钥：', hint2:'密钥以', save:'保存并加载', demo:'演示模式' },
    errors: { key:'API 密钥无效。', load:'加载数据时出错。' },
    empty: { title:'未找到任何内容', sub:'请尝试更改过滤条件' },
    cache: { loading:'加载中...', cached:'从缓存加载', fresh:'数据已更新' },
    startupPage: { back:'返回目录', founded:'成立于', country:'国家', audience:'目标受众', provider:'支付提供商', customers:'客户', subs:'活跃订阅', rev30:'收入（30天）', mrr:'MRR', totalRev:'总收入', growth:'30天增长', margin:'利润率', rank:'排名', visitors:'访客（30天）', contact:'联系卖家', viewOriginal:'访问网站', forSale:'在售', notForSale:'不出售', price:'要价', multiple:'收入倍数', techStack:'技术栈', cofounders:'联合创始人', reveal:'打开卖家联系方式和网站', revealBtn:'打开', revealNote:'消耗您每日限额中的1次查看', dailyChart:'每日指标', chartCollecting:'正在收集每日数据', chartWillAppear:'图表将在几天后显示 — 我们每天 3:00 UTC 保存一次快照。', chartEstimated:'估算', tipProvider:'收入直接通过该支付提供商验证', tipMor:'Merchant of Record — 提供商负责账单、税务与合规', tipRank:'在所有已验证初创公司收入总排名中的位置', tipStealth:'创始人隐藏了公司名称', tipCofounder:'创始人正在寻找联合创始人', tipFunding:'初创公司的融资状态', tipScore:'收购吸引力评分（0-100），越高越好' },
    idx: { heroTitle:'寻找', heroSpan:'经过验证的初创公司', heroEnd:'收入已确认', heroSub:'仅限验证数据。每项指标都通过支付提供商直接验证。', statTotal:'数据库中的初创公司', statSale:'在售', statRev30:'收入（30天）', statMrr:'总 MRR', fltTitle:'筛选器', fltReset:'重置', fltSearch:'按名称搜索...', fltStatus:'状态', fltStatusSale:'在售', fltStatusAll:'全部', fltCats:'类别', fltCatsAll:'所有类别...', fltRev30:'30天收入', fltMrr:'MRR', fltGrowth:'30天增长', fltPrice:'要价', fltMultiple:'倍数', fltMargin:'利润率', fltAudience:'目标受众', fltMobile:'移动应用', fltApply:'应用筛选', fltAny:'任何', fltHas:'有', fltNo:'无', sortRev:'收入 ↓', sortGrowth:'增长 ↓', sortPriceAsc:'价格 ↑', sortPriceDesc:'价格 ↓', loading:'加载初创公司...', error:'加载数据时出错', notFound:'未找到任何内容', countStartups:'初创公司', countOnSale:'在售', tipRev30:'过去30天的总收入', tipMrr:'Monthly Recurring Revenue', tipGrowth:'30天MRR变化百分比', tipPrice:'100%股权的要价', tipMultiple:'价格 / 年化MRR', cardRev:'30天收入', cardAsk:'要价', cardMult:'倍数', cardMrr:'MRR', favorites:'收藏', anonLabel:'匿名', anonHint:'创始人选择匿名', anonNoDesc:'卖家选择不披露产品细节。', acqHeroTitle:'购买', acqHeroSpan:'盈利的初创公司', acqHeroEnd:'指标已验证', acqHeroSub:'每个列表都有通过支付提供商验证的真实 MRR — 无估算。', statAvgMult:'平均倍数' },
    dash: { favorites:'收藏', favEmpty:'暂无收藏。点击爱心图标将初创公司保存到此处。', loading:'加载中...' },
    acquire: { heroTitle:'购买<span>盈利的初创公司</span>，指标经过验证', heroSub:'每个列表都有通过 Stripe、LemonSqueezy 或 Polar 验证的真实 MRR。', step1Title:'浏览列表', step1Desc:'按类别、价格和收入倍数筛选', step2Title:'核实指标', step2Desc:'所有收入数据均直接通过支付提供商验证', step3Title:'联系卖家', step3Desc:'在初创公司详情页直接联系创始人' },
    roadmap: { title:'MRRket 如何运作', sub:'两条简单路径 — 选择你是想购买盈利的初创公司，还是出售自己的。', tabBuy:'我想购买', tabSell:'我想出售', forBuyers:'面向买家', forSellers:'面向卖家', youAreHere:'你在这里', done:'完成', statusGuest:'你正在以访客身份浏览', statusUser:'免费等级', statusPro:'高级 — 无限访问', revealsLeft:'今天剩余的查看次数', b1t:'创建免费账户', b1d:'仅用邮箱注册，立即获得 3 次免费联系方式查看 — 无需信用卡。', b2t:'浏览已验证的初创公司', b2d:'每个列表都有通过 Stripe、LemonSqueezy 和 Polar 验证的真实 MRR。没有估算数字。', b3t:'提升你的等级', b3d:'免费等级每天 8 次查看。升级以解锁无限查看、完整指标和卖家联系方式。', b4t:'联系卖家', b4d:'查看网站和卖家联系方式，直接联系并完成交易。', ctaSignup:'创建免费账户', ctaBrowse:'浏览初创公司', ctaUpgrade:'提升等级', ctaAccount:'打开我的账户', s1t:'连接你的支付提供商', s1d:'添加来自 Stripe、LemonSqueezy、Polar、Paddle 或任何其他支付提供商的只读 API 密钥 — 我们仅读取收入，你的账户保持安全。', s2t:'设置你的要价', s2d:'选择合理的倍数（通常为年收入的 2–4 倍），并可选择保持匿名，直到买家付费。', s3t:'进入买家目录', s3d:'你的初创公司将带着验证徽章出现在市场中 — 面向正在积极寻找的买家。', s4t:'与买家匹配', s4d:'感兴趣的买家会查看你的联系方式并联系你。你按自己的条件谈判并成交。', ctaList:'发布我的初创公司' },
    lead: { title:'增长最快的初创公司', sub:'当前增长最快的已验证初创公司 — 按 30 天动态排名。', thRank:'#', thStartup:'初创公司', thMrr:'MRR', thRev:'收入（30天）', thGrowth:'月增长', sortBy:'排序', sortGrowth:'增长', sortMrr:'MRR', sortRev:'收入', period:'最近 30 天', loading:'正在加载排行榜…', empty:'排行榜正在准备中 — 请稍后再来。', stealth:'隐身初创公司', forSale:'在售', verified:'已验证', viewAll:'打开完整目录 →' },
    acct: { profile:'个人资料', favorites:'收藏', settings:'设置', signout:'退出登录', profileTitle:'个人资料', nickname:'昵称', nicknameHint:'这是你在 MRRket 上的显示名称。', nicknamePh:'你的显示名称', save:'保存', saved:'已保存', email:'邮箱', planTitle:'你的等级', levelFree:'免费', levelPro:'高级', planFreeDesc:'免费等级 — 每日查看次数有限。', planProDesc:'高级等级 — 无限访问，没有每日限制。', limitsTitle:'每日限额', viewsUsed:'今日已用查看次数', resets:'在 UTC 午夜重置 · 免费等级：每天 8 次', upgradeLevel:'提升等级', upgradeDesc:'解锁无限查看、完整的卖家联系方式和指标。', favEmpty:'还没有收藏。点击爱心图标将初创公司保存到此处。', loading:'加载中…', settingsTitle:'设置', notifTitle:'邮件通知', notifDesc:'产品更新以及符合你筛选条件的新列表提醒。', notifOn:'开', notifOff:'关', pwTitle:'修改密码', pwNew:'新密码', pwConfirm:'确认新密码', pwUpdate:'更新密码', pwOk:'密码已更新。', pwMismatch:'两次密码不一致。', pwShort:'密码至少需要 6 个字符。', dangerTitle:'删除账户', dangerDesc:'永久删除你的账户、收藏和历史记录。此操作无法撤销。', deleteBtn:'删除我的账户', deleteConfirm:'永久删除账户？此操作无法撤销。', deleting:'正在删除…' },
    sell: { title:'发布我的初创公司', sub:'让正在积极寻找已验证 MRR 的买家看到你的初创公司。连接你的支付提供商 — 我们以只读方式读取收入，保持可信。', provider:'支付提供商', keyLabel:'只读 API 密钥', keyHint:'我们只需要一个<b>受限的（只读）密钥</b> — 你的账户保持安全。', keyStep1:'打开你的提供商后台 → API 密钥', keyStep2:'创建一个受限密钥，没有写入权限', keyStep3:'粘贴到上方 — 我们绝不存储原始密钥', priceLabel:'要价（美元）', pricePh:'例如 50000', priceHint:'买家按收入倍数比较（价格 ÷ 年化 MRR）。自举 MRR 业务的理想区间是 <b>2-4×</b>。例如：年收入 $10k → 要价 $20-40k。', marginLabel:'近 30 天利润率（%）', marginPh:'例如 65', marginHint:'65 表示每 $100 收入扣除成本后你保留了 $65。', anon:'在买家付费获取联系方式前保持匿名', planLabel:'发布套餐', oneTime:'一次性', popular:'热门', fStarter:'在市场中展示', fListed:'已展示', fBrand:'自定义品牌颜色', fNewsletter:'邮件推送展示', f3x:'3× 曝光', fEverything:'包含热门套餐全部权益', fManager:'专属交易经理', f20x:'20× 曝光', fPinned:'置顶 30 天', fMatching:'买家匹配', submit:'提交发布', submitting:'提交中…', fillError:'请填写 API 密钥、要价和利润率。', fallback:'还没有只读 API 访问权限？把你的数据发送到 {email}，我们会手动发布。', successTitle:'已收到 — 我们会审核你的发布。', successBody:'我们会在 24 小时内通过你注册的邮箱联系你。同时可以浏览市场，了解同类初创公司的定价。', close:'关闭' }
  },
  ar: {
    dir:'rtl', flag:'🇸🇦', code:'AR',
    nav: { home:'الرئيسية', acquire:'شراء', sell:'بيع شركة ناشئة', apiKey:'مفتاح API', top:'الأسرع نموًا' },
    hero: { badge:'البيانات موثقة عبر Stripe و LemonSqueezy و Polar', title:'ابحث عن ', span:'شركة ناشئة موثقة', titleEnd:' بإيرادات مؤكدة', sub:'بيانات MRR حقيقية فقط. لا أرقام مخترعة.', btn1:'عرض المعروضة للبيع', btn2:'جميع الشركات الناشئة' },
    stats: { total:'الشركات الناشئة في قاعدة البيانات', sale:'معروضة للبيع الآن', mrr:'إجمالي MRR' },
    filter: { search:'بحث بالاسم...', allCats:'جميع الفئات', sortRevDesc:'حسب الإيرادات', sortGrowth:'حسب النمو', sortPriceAsc:'الأرخص أولاً', sortPriceDesc:'الأغلى أولاً', sortMultiple:'أفضل قيمة', sortListed:'المضافة حديثاً', sortDeal:'أفضل الصفقات', chipAll:'الكل', chipSale:'للبيع' },
    card: { mrr:'MRR', rev30:'إيرادات 30 يوم', growth:'نمو', customers:'العملاء', total:'الإجمالي', subs:'الاشتراكات', active:'نشط', price:'سعر الطلب', notSale:'غير معروض للبيع', more:'التفاصيل', verified:'موثق' },
    page: { label:'صفحة', of:'من' },
    modal: { title:'أدخل مفتاح API', desc:'تحتاج إلى مفتاح API من TrustMRR.', hint1:'احصل على المفتاح:', hint2:'تبدأ المفاتيح بـ', save:'حفظ وتحميل', demo:'وضع العرض التوضيحي' },
    errors: { key:'مفتاح API غير صالح.', load:'خطأ في تحميل البيانات.' },
    empty: { title:'لم يتم العثور على شيء', sub:'حاول تغيير المرشحات' },
    cache: { loading:'جارٍ التحميل...', cached:'تم التحميل من الذاكرة المؤقتة', fresh:'تم تحديث البيانات' },
    startupPage: { back:'العودة إلى الكتالوج', founded:'تأسست', country:'الدولة', audience:'الجمهور', provider:'مزود الدفع', customers:'العملاء', subs:'الاشتراكات النشطة', rev30:'الإيرادات (30 يوم)', mrr:'MRR', totalRev:'إجمالي الإيرادات', growth:'نمو 30 يوم', margin:'هامش الربح', rank:'الترتيب', visitors:'الزوار (30 يوم)', contact:'التواصل مع البائع', viewOriginal:'زيارة الموقع', forSale:'للبيع', notForSale:'غير معروض للبيع', price:'سعر الطلب', multiple:'مضاعف الإيرادات', techStack:'مجموعة التقنيات', cofounders:'المؤسسون المشاركون', reveal:'فتح بيانات البائع والموقع', revealBtn:'فتح', revealNote:'يستهلك 1 مشاهدة من حدك اليومي', dailyChart:'المقاييس اليومية', chartCollecting:'جاري جمع البيانات اليومية', chartWillAppear:'سيظهر الرسم البياني خلال أيام قليلة — نحفظ لقطة يوميًا في 3:00 UTC.', chartEstimated:'تقديري', tipProvider:'الإيرادات موثقة مباشرة عبر مزود الدفع هذا', tipMor:'Merchant of Record — يتولى المزود الفوترة والضرائب والامتثال', tipRank:'الموقع في الترتيب العام حسب الإيرادات بين جميع الشركات الموثقة', tipStealth:'المؤسس يخفي اسم الشركة الناشئة', tipCofounder:'المؤسس يبحث عن شريك مؤسس', tipFunding:'حالة تمويل الشركة الناشئة', tipScore:'درجة جاذبية الاستحواذ من 0 إلى 100 — كلما زادت كان أفضل' },
    idx: { heroTitle:'ابحث عن', heroSpan:'شركة ناشئة موثقة', heroEnd:'بإيرادات مؤكدة', heroSub:'بيانات موثقة فقط. كل مقياس تم التحقق منه مباشرة عبر مزودي الدفع.', statTotal:'الشركات الناشئة في قاعدة البيانات', statSale:'للبيع', statRev30:'الإيرادات (30 يوم)', statMrr:'إجمالي MRR', fltTitle:'المرشحات', fltReset:'إعادة تعيين', fltSearch:'بحث بالاسم...', fltStatus:'الحالة', fltStatusSale:'للبيع', fltStatusAll:'الكل', fltCats:'الفئات', fltCatsAll:'جميع الفئات...', fltRev30:'إيرادات 30 يوم', fltMrr:'MRR', fltGrowth:'نمو 30 يوم', fltPrice:'سعر الطلب', fltMultiple:'المضاعف', fltMargin:'هامش الربح', fltAudience:'الجمهور', fltMobile:'تطبيق الجوال', fltApply:'تطبيق المرشحات', fltAny:'أي', fltHas:'نعم', fltNo:'لا', sortRev:'الإيرادات ↓', sortGrowth:'النمو ↓', sortPriceAsc:'السعر ↑', sortPriceDesc:'السعر ↓', loading:'جاري تحميل الشركات الناشئة...', error:'خطأ في تحميل البيانات', notFound:'لم يتم العثور على شيء', countStartups:'شركة ناشئة', countOnSale:'للبيع', tipRev30:'إجمالي الإيرادات خلال آخر 30 يوم', tipMrr:'Monthly Recurring Revenue', tipGrowth:'تغيير MRR خلال 30 يوم بالنسبة المئوية', tipPrice:'سعر الطلب لـ 100% من الأسهم', tipMultiple:'السعر / MRR السنوي', cardRev:'إيراد 30ي', cardAsk:'السعر', cardMult:'مضاعف', cardMrr:'MRR', favorites:'المفضلة', anonLabel:'مجهول', anonHint:'اختار المؤسس البقاء مجهولاً', anonNoDesc:'اختار البائع عدم الكشف عن تفاصيل المنتج.', acqHeroTitle:'اشترِ', acqHeroSpan:'شركة ناشئة مربحة', acqHeroEnd:'بمقاييس مؤكدة', acqHeroSub:'كل إعلان لديه MRR حقيقي موثق عبر مزودي الدفع — لا تقديرات.', statAvgMult:'متوسط المضاعف' },
    dash: { favorites:'المفضلة', favEmpty:'لا توجد مفضلات بعد. اضغط على القلب لحفظ شركة ناشئة هنا.', loading:'جاري التحميل...' },
    acquire: { heroTitle:'اشترِ <span>شركة ناشئة مربحة</span> بمقاييس مؤكدة', heroSub:'كل إعلان يحتوي على MRR حقيقي موثق عبر Stripe أو LemonSqueezy أو Polar.', step1Title:'تصفح الإعلانات', step1Desc:'فلتر حسب الفئة والسعر ومضاعف الإيرادات', step2Title:'تحقق من المقاييس', step2Desc:'جميع بيانات الإيرادات موثقة مباشرة عبر مزودي الدفع', step3Title:'تواصل مع البائع', step3Desc:'تواصل مباشرة مع المؤسس في صفحة تفاصيل الشركة الناشئة' },
    roadmap: { title:'كيف يعمل MRRket', sub:'مساران بسيطان — اختر إن كنت تريد شراء شركة ناشئة مربحة أو بيع شركتك.', tabBuy:'أريد الشراء', tabSell:'أريد البيع', forBuyers:'للمشترين', forSellers:'للبائعين', youAreHere:'أنت هنا', done:'تم', statusGuest:'أنت تتصفح كضيف', statusUser:'المستوى المجاني', statusPro:'متقدم — وصول غير محدود', revealsLeft:'مرات كشف متبقية اليوم', b1t:'أنشئ حسابًا مجانيًا', b1d:'سجّل ببريد إلكتروني فقط واحصل فورًا على 3 عمليات كشف للتواصل مجانًا — بدون بطاقة.', b2t:'تصفح الشركات الناشئة الموثقة', b2d:'كل إعلان لديه MRR حقيقي موثق عبر Stripe وLemonSqueezy وPolar. لا أرقام تقديرية.', b3t:'ارفع مستواك', b3d:'يمنحك المستوى المجاني 8 عمليات كشف يوميًا. ارفع مستواك لفتح كشف غير محدود ومقاييس كاملة وجهات اتصال البائعين.', b4t:'تواصل مع البائع', b4d:'اكشف الموقع وجهات اتصال البائع، وتواصل مباشرة وأغلق الصفقة.', ctaSignup:'إنشاء حساب مجاني', ctaBrowse:'تصفح الشركات الناشئة', ctaUpgrade:'رفع المستوى', ctaAccount:'فتح حسابي', s1t:'اربط مزود الدفع الخاص بك', s1d:'أضف مفتاح API للقراءة فقط من Stripe أو LemonSqueezy أو Polar أو Paddle أو أي مزود دفع آخر — نقرأ الإيرادات فقط، ويبقى حسابك آمنًا.', s2t:'حدد سعر البيع', s2d:'اختر مضاعفًا عادلًا (عادة 2–4× الإيراد السنوي) وابقَ مجهولًا إن أردت حتى يدفع المشتري.', s3t:'اظهر في الكتالوج للمشترين', s3d:'تظهر شركتك الناشئة في السوق مع شارة التوثيق — أمام المشترين الذين يبحثون بنشاط.', s4t:'تواصل مع مشترين مهتمين', s4d:'يكشف المشترون المهتمون جهات اتصالك ويتواصلون معك. أنت تتفاوض وتغلق الصفقة بشروطك.', ctaList:'أضف شركتي الناشئة' },
    lead: { title:'الشركات الناشئة الأسرع نموًا', sub:'أسرع الشركات الناشئة الموثقة نموًا الآن — حسب الأداء خلال 30 يومًا.', thRank:'#', thStartup:'الشركة الناشئة', thMrr:'MRR', thRev:'الإيرادات (30 يوم)', thGrowth:'النمو الشهري', sortBy:'ترتيب حسب', sortGrowth:'النمو', sortMrr:'MRR', sortRev:'الإيرادات', period:'آخر 30 يومًا', loading:'جارٍ تحميل القائمة…', empty:'القائمة قيد الإعداد — عُد قريبًا.', stealth:'شركة ناشئة سرية', forSale:'للبيع', verified:'موثق', viewAll:'افتح الكتالوج الكامل →' },
    acct: { profile:'الملف الشخصي', favorites:'المفضلة', settings:'الإعدادات', signout:'تسجيل الخروج', profileTitle:'الملف الشخصي', nickname:'الاسم المستعار', nicknameHint:'هكذا تظهر على MRRket.', nicknamePh:'اسمك المعروض', save:'حفظ', saved:'تم الحفظ', email:'البريد الإلكتروني', planTitle:'مستواك', levelFree:'مجاني', levelPro:'متقدم', planFreeDesc:'المستوى المجاني — عمليات كشف يومية محدودة.', planProDesc:'المستوى المتقدم — وصول غير محدود، بدون حدود يومية.', limitsTitle:'الحد اليومي', viewsUsed:'عمليات الكشف المستخدمة اليوم', resets:'يُعاد الضبط منتصف الليل UTC · المستوى المجاني: 8 يوميًا', upgradeLevel:'رفع المستوى', upgradeDesc:'افتح كشفًا غير محدود وجهات اتصال البائعين الكاملة والمقاييس.', favEmpty:'لا مفضلات بعد. اضغط على القلب لحفظ شركة ناشئة هنا.', loading:'جارٍ التحميل…', settingsTitle:'الإعدادات', notifTitle:'إشعارات البريد الإلكتروني', notifDesc:'تحديثات المنتج وتنبيهات حول الإعلانات الجديدة المطابقة لمرشحاتك.', notifOn:'تشغيل', notifOff:'إيقاف', pwTitle:'تغيير كلمة المرور', pwNew:'كلمة مرور جديدة', pwConfirm:'أكد كلمة المرور الجديدة', pwUpdate:'تحديث كلمة المرور', pwOk:'تم تحديث كلمة المرور.', pwMismatch:'كلمتا المرور غير متطابقتين.', pwShort:'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.', dangerTitle:'حذف الحساب', dangerDesc:'احذف حسابك والمفضلة والسجل نهائيًا. لا يمكن التراجع عن هذا.', deleteBtn:'حذف حسابي', deleteConfirm:'حذف الحساب نهائيًا؟ لا يمكن التراجع عن هذا.', deleting:'جارٍ الحذف…' },
    sell: { title:'أضف شركتي الناشئة', sub:'اعرض شركتك الناشئة أمام المشترين الذين يبحثون بنشاط عن MRR موثق. اربط مزود الدفع — نقرأ الإيرادات للقراءة فقط، لتبقى موثوقة.', provider:'مزود الدفع', keyLabel:'مفتاح API للقراءة فقط', keyHint:'نحتاج فقط إلى <b>مفتاح مقيّد (للقراءة فقط)</b> — يبقى حسابك آمنًا.', keyStep1:'افتح لوحة تحكم مزودك → مفاتيح API', keyStep2:'أنشئ مفتاحًا مقيّدًا بدون صلاحيات كتابة', keyStep3:'الصقه بالأعلى — لا نخزّن السر الأصلي أبدًا', priceLabel:'سعر الطلب (USD)', pricePh:'مثال 50000', priceHint:'يقارن المشترون بمضاعف الإيراد (السعر ÷ MRR السنوي). النطاق المثالي لأعمال MRR الذاتية هو <b>2-4×</b>. مثال: $10k/سنة إيراد → اطلب $20-40k.', marginLabel:'هامش الربح، آخر 30 يومًا (%)', marginPh:'مثال 65', marginHint:'65 يعني أنك احتفظت بـ $65 من كل $100 إيراد بعد التكاليف.', anon:'ابقَ مجهولًا حتى يدفع المشتري مقابل التواصل', planLabel:'خطة الإدراج', oneTime:'مرة واحدة', popular:'شائع', fStarter:'مُدرج في السوق', fListed:'مُدرج', fBrand:'لون علامة مخصص', fNewsletter:'ظهور في النشرة', f3x:'3× مشاهدات', fEverything:'كل مزايا الخطة الشائعة', fManager:'مدير صفقة مخصص', f20x:'20× مشاهدات', fPinned:'مثبّت 30 يومًا', fMatching:'مطابقة المشترين', submit:'إرسال الإدراج', submitting:'جارٍ الإرسال…', fillError:'يرجى إدخال مفتاح API وسعر الطلب وهامش الربح.', fallback:'لا تملك وصول API للقراءة فقط بعد؟ راسلنا على {email} بأرقامك وسندرجها يدويًا.', successTitle:'تم — سنراجع إدراجك.', successBody:'سنتواصل معك خلال 24 ساعة على البريد الذي سجّلت به. في هذه الأثناء تصفّح السوق لمعرفة أسعار الشركات المماثلة.', close:'إغلاق' }
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

// ── Revealed startups (persisted, shared across pages) ──────────────────────────
// When a user reveals a startup's name/contacts on its detail page it is recorded
// here so it stays un-blurred everywhere (home catalog + leaderboard) and across
// sessions. Stored in localStorage as a list of slugs.
function getRevealedSlugs() { try { return JSON.parse(localStorage.getItem('sm_revealed') || '[]'); } catch { return []; } }
function isRevealed(slug)   { return !!slug && getRevealedSlugs().includes(slug); }
function addRevealedSlug(slug) {
  if (!slug) return;
  const list = getRevealedSlugs();
  if (!list.includes(slug)) { list.push(slug); try { localStorage.setItem('sm_revealed', JSON.stringify(list)); } catch {} }
}

// ── ICON SYSTEM ───────────────────────────────────────────────────────────────
// Lucide-style line icons (https://lucide.dev). Path data is taken from the
// open-source Lucide set (ISC license). Returns an inline SVG that inherits
// stroke colour from the surrounding element via currentColor.
const ICON_PATHS = {
  calendar:    '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  globe:       '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  lightbulb:   '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/>',
  target:      '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  users:       '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  tag:         '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  dollar:      '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  code:        '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  megaphone:   '<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  clock:       '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  trending:    '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  heart:       '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>',
  heartFill:   '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" fill="currentColor"/>',
  lock:        '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  unlock:      '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  star:        '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  search:      '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  externalLink:'<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  arrowRight:  '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  ghost:       '<path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>',
  handshake:   '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
  trophy:      '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  flag:        '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  zap:         '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  barChart:    '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
  pieChart:    '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
  shield:      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  eye:         '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  pin:         '<path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  check:       '<polyline points="20 6 9 17 4 12"/>',
  x:           '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
};

function icon(name, opts) {
  opts = opts || {};
  const size = opts.size || 14;
  const stroke = opts.stroke || 1.75;
  const cls = opts.cls ? ' class="'+opts.cls+'"' : '';
  const p = ICON_PATHS[name];
  if (!p) return '';
  return `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle;">${p}</svg>`;
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
      <a href="/top.html" class="nav-link ${activePage==='top'?'active':''}">${l.nav.top || 'Top growing'}</a>
    </div>
    <div class="nav-right">
      <div class="lang-switcher" id="langSwitcher">
        <button class="lang-btn" onclick="document.getElementById('langDropdown').classList.toggle('open')" id="langBtnLabel">${l.code}</button>
        <div class="lang-dropdown" id="langDropdown">
          ${Object.entries(T).map(([code, v]) => `<div class="lang-option ${code===lang?'active':''}" data-lang="${code}" onclick="setLangCode('${code}')">${langNames[code]||code}</div>`).join('')}
        </div>
      </div>
      <div id="navAuth"></div>
      <button class="btn btn-primary btn-sm" onclick="openSellModal()">${l.nav.sell}</button>
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
      maybeShowAdminLink();
      window.dispatchEvent(new CustomEvent('navAuthUpdated'));
    }
  } catch {}
}

// Admins (profiles.role = 'admin') get an extra nav button to /admin.html.
// Everyone else never sees it — the page itself is guarded server-side anyway.
function maybeShowAdminLink() {
  const el = document.getElementById('navAuth');
  if (!el || document.getElementById('navAdminLink')) return;
  if (window._access && window._access.role === 'admin') {
    el.insertAdjacentHTML('afterbegin', '<a class="btn btn-ghost btn-sm" id="navAdminLink" href="/admin.html">Admin</a>');
  }
}

async function navSignOut() {
  if (window._sb) await window._sb.auth.signOut();
  location.href = '/';
}

document.addEventListener('click', (e) => {
  const sw = document.getElementById('langSwitcher');
  if (sw && !sw.contains(e.target)) document.getElementById('langDropdown')?.classList.remove('open');
});

// ── PAYWALL TOOLTIP ─────────────────────────────────────────────────────────
// Single floating tooltip wired to any .paywall-blur / .name-blur / .logo-blur
// / .owner-blur element. Messages adapt to the auth state from window._access.
function getPaywallState() {
  const a = window._access;
  if (!a || !a.authenticated) {
    return {
      kind: 'guest',
      title: 'Зарегистрируйся — получи 3 бесплатных просмотра',
      body: 'Без карты, без подписки. Просто email и пароль — и сразу 3 раскрытия в подарок.',
      cta: 'Зарегистрироваться',
      action: 'signin',
    };
  }
  if (a.role === 'subscriber') return null;
  const left = a.viewsLeft != null ? a.viewsLeft : 8;
  if (left > 0) {
    const word = left === 1 ? 'просмотр' : left < 5 ? 'просмотра' : 'просмотров';
    return {
      kind: 'user',
      title: `У тебя осталось ${left} ${word}`,
      body: 'Нажимая «Открыть» ты тратишь 1 просмотр и раскрываешь название, лого, сайт и контакты продавца.',
      cta: 'Открыть',
      action: 'reveal',
      sub: 'Открой безлимит навсегда — пока бесплатно',
      subAction: 'upgrade',
    };
  }
  return {
    kind: 'limit',
    title: 'Просмотры закончились',
    body: 'Открой безлимит навсегда — пока полностью бесплатно во время бета-периода.',
    cta: 'Получить безлимит',
    action: 'upgrade',
  };
}

function handlePaywallAction(act) {
  if (act === 'signin') {
    location.href = '/auth.html?from=' + encodeURIComponent(location.pathname);
  } else if (act === 'reveal') {
    if (typeof window.tryReveal === 'function') window.tryReveal();
    else location.reload();
  } else if (act === 'upgrade') {
    location.href = '/dashboard.html#upgrade';
  }
}

// Paywall modal — opens on click of any blurred element. Hover tooltip stays.
function mountPaywallModal() {
  if (document.getElementById('paywallModalBg')) return;
  const bg = document.createElement('div');
  bg.id = 'paywallModalBg';
  bg.innerHTML = '<div class="pw-modal" id="paywallModal"></div>';
  document.body.appendChild(bg);
  bg.addEventListener('click', (e) => { if (e.target === bg) closePaywallModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePaywallModal(); });
}
function closePaywallModal() {
  const bg = document.getElementById('paywallModalBg'); if (bg) bg.classList.remove('open');
}
function openPaywallModal() {
  mountPaywallModal();
  const state = getPaywallState(); if (!state) return;
  const bg = document.getElementById('paywallModalBg');
  const modal = document.getElementById('paywallModal');
  const iconName = state.kind === 'guest' ? 'unlock' : state.kind === 'user' ? 'eye' : 'star';
  const offer = state.kind === 'user' ? `
    <div class="pw-modal-offer">
      <div class="pw-modal-offer-title">⚡ Открой безлимит навсегда</div>
      <div class="pw-modal-offer-body">Пока бета — Pro-план полностью бесплатный. Безлимит раскрытий, экспорт и алерты по новым листингам.</div>
      <a class="pw-modal-offer-link" data-act="upgrade">Получить безлимит →</a>
    </div>` : '';
  modal.innerHTML =
    '<button class="pw-modal-close" data-act="close">×</button>' +
    '<span class="pw-modal-icon">' + (typeof icon === 'function' ? icon(iconName,{size:22}) : '') + '</span>' +
    '<h2>' + state.title + '</h2>' +
    '<p>' + state.body + '</p>' +
    '<button class="pw-modal-cta" data-act="' + state.action + '">' + state.cta + '</button>' +
    offer;
  modal.querySelectorAll('[data-act]').forEach(el => {
    el.addEventListener('click', () => {
      const act = el.dataset.act;
      if (act === 'close') { closePaywallModal(); return; }
      closePaywallModal();
      handlePaywallAction(act);
    });
  });
  bg.classList.add('open');
}

function mountPaywallTooltip() {
  if (document.getElementById('paywallTip')) return;
  const tip = document.createElement('div');
  tip.id = 'paywallTip';
  document.body.appendChild(tip);

  let activeTarget = null;
  let hideTimer = null;

  function position(e) {
    const padding = 14;
    const tw = tip.offsetWidth || 280;
    const th = tip.offsetHeight || 120;
    let x = e.clientX + 14;
    let y = e.clientY + 14;
    if (x + tw + padding > window.innerWidth)  x = window.innerWidth  - tw - padding;
    if (y + th + padding > window.innerHeight) y = e.clientY - th - 14;
    if (x < padding) x = padding;
    if (y < padding) y = padding;
    tip.style.left = x + 'px';
    tip.style.top  = y + 'px';
  }

  function show(e) {
    const state = getPaywallState();
    if (!state) return;
    tip.innerHTML =
      '<div class="pt-title">' + state.title + '</div>' +
      '<div class="pt-body">'  + state.body  + '</div>' +
      '<button class="pt-cta" data-act="' + state.action + '">' + state.cta + ' →</button>' +
      (state.sub ? '<a class="pt-sub-cta" data-act="' + state.subAction + '">' + state.sub + '</a>' : '');
    tip.classList.add('show');
    position(e);
  }

  function hideSoon() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { tip.classList.remove('show'); activeTarget = null; }, 180);
  }

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('.paywall-blur, .name-blur, .logo-blur, .owner-blur');
    if (!target) return;
    clearTimeout(hideTimer);
    if (activeTarget === target) { position(e); return; }
    activeTarget = target;
    show(e);
  });
  document.addEventListener('mousemove', (e) => {
    if (activeTarget && activeTarget.contains(e.target)) position(e);
  });
  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('.paywall-blur, .name-blur, .logo-blur, .owner-blur');
    if (!target) return;
    if (e.relatedTarget && (tip.contains(e.relatedTarget) || target.contains(e.relatedTarget))) return;
    hideSoon();
  });
  tip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  tip.addEventListener('mouseleave', hideSoon);
  tip.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act) { handlePaywallAction(act); tip.classList.remove('show'); }
  });

  // Clicking the blurred element itself opens the full paywall modal so the
  // buyer sees an explicit "spend 1" vs "unlock forever" choice instead of
  // silently consuming a reveal.
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.paywall-blur, .name-blur, .logo-blur, .owner-blur');
    if (!target) return;
    if (target.closest('.card, .similar-card')) return;
    e.preventDefault();
    openPaywallModal();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountPaywallTooltip);
} else {
  mountPaywallTooltip();
}

// ── SELL STARTUP MODAL ──────────────────────────────────────────────────────
const SELL_FALLBACK_EMAIL = 'sell@mrrket.com';

function mountSellModal() {
  if (document.getElementById('sellModalBg')) return;
  const bg = document.createElement('div');
  bg.id = 'sellModalBg';
  bg.innerHTML = '<div class="sm-modal" id="sellModal"></div>';
  document.body.appendChild(bg);
  bg.addEventListener('click', (e) => { if (e.target === bg) closeSellModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSellModal(); });
}
function closeSellModal() {
  const bg = document.getElementById('sellModalBg'); if (bg) bg.classList.remove('open');
}
function openSellModal() {
  mountSellModal();
  const modal = document.getElementById('sellModal');
  const S = (k) => t('sell', k);
  const planOptions = [
    { id:'starter', price:'$19',  features:[S('fStarter')], popular:false },
    { id:'pro',     price:'$100', features:[S('fListed'),S('fBrand'),S('fNewsletter'),S('f3x')], popular:true },
    { id:'premium', price:'$399', features:[S('fEverything'),S('f20x'),S('fPinned'),S('fMatching'),S('fManager')], popular:false },
  ];
  modal.innerHTML = `
    <button class="sm-modal-close" data-close>×</button>
    <h2>${S('title')}</h2>
    <div class="sm-modal-sub">${S('sub')}</div>

    <div class="sm-step">
      <div class="sm-label">${S('provider')}</div>
      <select class="sm-select" id="smProvider">
        <option value="stripe">Stripe</option>
        <option value="lemonsqueezy">LemonSqueezy</option>
        <option value="polar">Polar</option>
        <option value="paddle">Paddle</option>
      </select>
    </div>

    <div class="sm-step">
      <div class="sm-label">${S('keyLabel')} <span class="sm-required">*</span></div>
      <input class="sm-input" id="smApiKey" placeholder="rk_live_…" autocomplete="off"/>
      <div class="sm-hint">
        ${S('keyHint')}
        <ol class="sm-hint-list">
          <li>${S('keyStep1')}</li>
          <li>${S('keyStep2')}</li>
          <li>${S('keyStep3')}</li>
        </ol>
      </div>
    </div>

    <div class="sm-step">
      <div class="sm-label">${S('priceLabel')} <span class="sm-required">*</span></div>
      <input class="sm-input" id="smPrice" type="number" min="100" placeholder="${S('pricePh')}"/>
      <div class="sm-hint">${S('priceHint')}</div>
    </div>

    <div class="sm-step">
      <div class="sm-label">${S('marginLabel')} <span class="sm-required">*</span></div>
      <input class="sm-input" id="smMargin" type="number" min="0" max="100" placeholder="${S('marginPh')}"/>
      <div class="sm-hint">${S('marginHint')}</div>
    </div>

    <div class="sm-step">
      <label class="sm-toggle"><input type="checkbox" id="smAnon"/> ${S('anon')}</label>
    </div>

    <div class="sm-step">
      <div class="sm-label">${S('planLabel')}</div>
      <div class="sm-plans">
        ${planOptions.map((p,i) => `
          <button class="sm-plan${i===1?' selected':''}" data-plan="${p.id}" type="button">
            ${p.popular ? `<span class="sm-plan-popular">${S('popular')}</span>` : ''}
            <div class="sm-plan-price">${p.price}</div>
            <div class="sm-plan-tag">${S('oneTime')}</div>
            ${p.features.map(f => `<div class="sm-plan-feat">${icon('check',{size:10})}${f}</div>`).join('')}
          </button>`).join('')}
      </div>
    </div>

    <button class="sm-submit" id="smSubmit">${S('submit')} →</button>

    <div class="sm-fallback">
      ${S('fallback').replace('{email}', `<a href="mailto:${SELL_FALLBACK_EMAIL}?subject=Sell%20my%20startup">${SELL_FALLBACK_EMAIL}</a>`)}
    </div>
  `;
  // Plan switching
  modal.querySelectorAll('.sm-plan').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.sm-plan').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
  modal.querySelector('[data-close]').addEventListener('click', closeSellModal);
  modal.querySelector('#smSubmit').addEventListener('click', () => submitSellForm(modal));
  document.getElementById('sellModalBg').classList.add('open');
}

async function submitSellForm(modal) {
  const provider = modal.querySelector('#smProvider').value;
  const apiKey   = modal.querySelector('#smApiKey').value.trim();
  const price    = parseFloat(modal.querySelector('#smPrice').value);
  const margin   = parseFloat(modal.querySelector('#smMargin').value);
  const anon     = modal.querySelector('#smAnon').checked;
  const plan     = modal.querySelector('.sm-plan.selected')?.dataset.plan || 'pro';

  if (!apiKey || !price || isNaN(margin)) {
    alert(t('sell','fillError'));
    return;
  }
  const btn = modal.querySelector('#smSubmit');
  btn.disabled = true; btn.textContent = t('sell','submitting');

  const payload = { provider, apiKey, price, margin, anon, plan, ts: Date.now() };
  try {
    const list = JSON.parse(localStorage.getItem('sm_sell_intents') || '[]');
    // Don't persist the raw API key on the device — replace with a safe hint.
    list.push({ ...payload, apiKey: apiKey.slice(0,6) + '…' });
    localStorage.setItem('sm_sell_intents', JSON.stringify(list));
  } catch {}
  try {
    // Attach the session token when present so the request links to the account.
    const headers = { 'Content-Type': 'application/json' };
    try {
      const s = window._sb ? (await window._sb.auth.getSession()).data.session : null;
      if (s && s.access_token) headers.Authorization = 'Bearer ' + s.access_token;
    } catch {}
    await fetch('/api/sell-listing-intent', { method:'POST', headers, body: JSON.stringify(payload) });
  } catch {}

  modal.innerHTML = `
    <button class="sm-modal-close" data-close>×</button>
    <div class="sm-success"><strong>${t('sell','successTitle')}</strong>${t('sell','successBody')}</div>
    <button class="sm-submit" data-close style="margin-top:14px;">${t('sell','close')}</button>
  `;
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeSellModal));
}

// ── TRAFFIC BEACON ────────────────────────────────────────────────────────────
// Anonymous page-load ping feeding the admin dashboard counters. No cookies and
// no client ids — daily uniqueness is derived server-side from a salted
// ip+ua hash that rotates every day. The admin page itself is not counted.
(function trackVisit() {
  try {
    const path = location.pathname;
    if (path.startsWith('/admin')) return;
    let p = 'other', s;
    if (path === '/' || path === '/index.html') p = 'home';
    else if (path.startsWith('/acquire'))   p = 'acquire';
    else if (path.startsWith('/top'))       p = 'top';
    else if (path.startsWith('/auth'))      p = 'auth';
    else if (path.startsWith('/dashboard')) p = 'dashboard';
    else if (path.startsWith('/startup/')) {
      p = 'startup';
      s = decodeURIComponent(path.split('/')[2] || '').replace(/\.html$/, '');
    }
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p, s }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
})();
