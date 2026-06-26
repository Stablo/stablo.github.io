const UI = {
  sites: ['daily', 'money', 'progress', 'gambling', 'account'],
  siteNavGroups: {
    daily: 'navGroupDaily',
    money: 'navGroupMoney',
    progress: 'navGroupProgress',
    gambling: 'navGroupGambling',
    account: 'navGroupAccount'
  },
  sectionSites: {
    mainContent: 'daily',
    stressContent: 'daily',
    collapseContent: 'daily',
    timeContent: 'daily',
    economyContent: 'money',
    eventContent: 'daily',
    beerShopContent: 'money',
    marketContent: 'money',
    moneyContent: 'money',
    jobsContent: 'money',
    kelaContent: 'money',
    helpersContent: 'progress',
    upgradesContent: 'progress',
    gamblingContent: 'gambling',
    accountContent: 'account',
    prestigeContent: 'account',
    scoreboardContent: 'account'
  },
  eventAlertsEnabled: false,
  eventAlertStorageKey: 'villisikaSeppoEventAlerts',
  eventAlertAudioContext: null,

  init() {
    document.querySelectorAll('.leftNav button[data-target]').forEach(button => {
      button.onclick = () => {
        const id = button.dataset.target;
        if (id === 'statsPanel') {
          this.setStatsDock(false);
          return;
        }

        this.showSite(this.sectionSites[id] || 'daily');
        if (id === 'mainContent') {
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 40);
          return;
        }
        setTimeout(() => {
          const element = document.getElementById('section-' + id) || document.getElementById(id);
          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 40);
      };
    });

    const guideButton = document.getElementById('guideButton');
    if (guideButton) guideButton.onclick = () => this.showGuide();

    const statsDockToggle = document.getElementById('statsDockToggle');
    if (statsDockToggle) statsDockToggle.onclick = () => this.toggleStatsDock();
    this.setStatsDock(window.matchMedia('(max-width: 900px)').matches);

    this.initVolumeControl();
    this.initEventTicker();
    window.addEventListener('keydown', event => this.handleKeydown(event));
  },

  toggleStatsDock() {
    this.setStatsDock(!document.body.classList.contains('statsDockMinimized'));
  },

  setStatsDock(minimized) {
    document.body.classList.toggle('statsDockMinimized', minimized);

    const button = document.getElementById('statsDockToggle');
    if (!button) return;

    button.textContent = minimized ? 'Pikatilastot' : 'Piilota';
    button.setAttribute('aria-expanded', String(!minimized));
    button.setAttribute('aria-label', minimized ? 'Näytä pikatilastot' : 'Piilota pikatilastot');
  },

  initVolumeControl() {
    this.setSoundVolume(Game.config.soundVolume ?? 0.5);

    const slider = document.getElementById('gameVolumeSlider');
    if (!slider) return;

    slider.oninput = () => {
      this.setSoundVolume(Number(slider.value) / 100);
    };
  },

  setSoundVolume(value) {
    const volume = Game.clamp(Number(value), 0, 1);
    Game.config.soundVolume = Number(volume.toFixed(2));

    const slider = document.getElementById('gameVolumeSlider');
    const label = document.getElementById('gameVolumeValue');
    const percent = Math.round(Game.config.soundVolume * 100);

    if (slider) slider.value = String(percent);
    if (label) label.textContent = `${percent}%`;
    if (typeof Gambling !== 'undefined' && typeof Gambling.updateKaraokeVolume === 'function') {
      Gambling.updateKaraokeVolume();
    }
  },

  initEventTicker() {
    let stored = false;
    try {
      stored = typeof localStorage !== 'undefined' && localStorage.getItem(this.eventAlertStorageKey) === 'true';
    } catch (error) {
      stored = false;
    }

    this.setEventAlerts(stored);
    const list = document.getElementById('eventTickerList');
    if (list && !list.children.length) {
      this.announceEvent('Tapahtumasyöte valmis. Karaokeillat ja Kela-sähläykset näkyvät tässä.', { sound: false, type: 'event' });
    }
  },

  toggleEventAlerts() {
    this.setEventAlerts(!this.eventAlertsEnabled);
    this.announceEvent(
      this.eventAlertsEnabled ? 'Äänihälytykset käytössä.' : 'Äänihälytykset pois käytöstä.',
      { sound: this.eventAlertsEnabled, type: this.eventAlertsEnabled ? 'good' : 'event' }
    );
  },

  setEventAlerts(enabled) {
    this.eventAlertsEnabled = !!enabled;

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.eventAlertStorageKey, this.eventAlertsEnabled ? 'true' : 'false');
      }
    } catch (error) {
      // Browser storage is optional; the toggle still works for the current session.
    }

    const button = document.getElementById('eventAlarmToggle');
    if (button) {
      button.textContent = this.eventAlertsEnabled ? 'Hälytykset: päällä' : 'Hälytykset: pois';
      button.setAttribute('aria-pressed', String(this.eventAlertsEnabled));
    }
  },

  announceEvent(text, options = {}) {
    const list = document.getElementById('eventTickerList');
    const message = String(text || '').trim();
    if (!list || !message) return;

    const type = ['good', 'bad', 'karaoke', 'kela'].includes(options.type) ? options.type : 'event';
    const item = document.createElement('div');
    item.className = `eventTickerItem ${type}`;
    if (options.id) item.dataset.eventId = String(options.id);

    const time = document.createElement('span');
    time.className = 'eventTickerTime';
    time.textContent = this.eventTimeLabel();

    const body = document.createElement('span');
    body.className = 'eventTickerBody';
    body.textContent = message;

    item.appendChild(time);
    item.appendChild(body);
    list.prepend(item);
    this.trimEventTicker();

    if (options.sound !== false) this.playEventAlert(type);
  },

  resolveEvent(id, resolution = 'ratkaistu') {
    const list = document.getElementById('eventTickerList');
    const targetId = String(id || '');
    if (!list || !targetId) return;

    const items = list.querySelectorAll('.eventTickerItem[data-event-id]');
    for (const item of items) {
      if (item.dataset.eventId !== targetId) continue;

      item.classList.add('eventTickerResolved');
      if (!item.dataset.resolutionAdded) {
        const body = item.querySelector('.eventTickerBody');
        if (body) body.textContent = `${body.textContent} (${resolution})`;
        item.dataset.resolutionAdded = 'true';
      }
      return;
    }
  },

  eventTimeLabel() {
    try {
      return new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '--:--';
    }
  },

  trimEventTicker() {
    const list = document.getElementById('eventTickerList');
    if (!list) return;
    while (list.children.length > 12) list.lastElementChild.remove();
  },

  getEventAlertAudioContext() {
    if (!this.eventAlertsEnabled || typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    try {
      if (!this.eventAlertAudioContext) this.eventAlertAudioContext = new AudioContextClass();
      if (this.eventAlertAudioContext.state === 'suspended') this.eventAlertAudioContext.resume();
      return this.eventAlertAudioContext;
    } catch (error) {
      return null;
    }
  },

  playEventAlert(type = 'event') {
    const context = this.getEventAlertAudioContext();
    if (!context) return;

    const volume = Game.clamp(Number(Game.config.soundVolume ?? 0.5), 0, 1);
    if (volume <= 0) return;

    const now = context.currentTime;
    const gain = context.createGain();
    const level = Math.max(0.0001, volume * 0.16);
    const base = type === 'kela' || type === 'bad' ? 430 : type === 'karaoke' ? 660 : 540;
    const peak = type === 'karaoke' ? 990 : base * 1.25;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    gain.connect(context.destination);

    const tone = context.createOscillator();
    tone.type = 'triangle';
    tone.frequency.setValueAtTime(base, now);
    tone.frequency.exponentialRampToValueAtTime(peak, now + 0.18);
    tone.connect(gain);
    tone.start(now);
    tone.stop(now + 0.34);
    tone.onended = () => gain.disconnect();
  },

  handleKeydown(event) {
    if (event.key === 'Escape') {
      this.closeGuide();
      return;
    }

    if (document.getElementById('guideOverlay')) return;

    if (event.ctrlKey || event.altKey || event.metaKey || this.isTypingTarget(event.target)) return;

    const sitesByKey = {
      1: 'daily',
      2: 'money',
      3: 'progress',
      4: 'gambling',
      5: 'account'
    };

    const site = sitesByKey[event.key];
    if (!site) return;

    event.preventDefault();
    this.showSite(site);
  },

  isTypingTarget(target) {
    if (!target) return false;
    const tag = target.tagName;
    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
  },

  showSite(site) {
    this.sites.forEach(name => {
      const panel = document.getElementById('site-' + name);
      const button = document.getElementById('siteButton' + name.charAt(0).toUpperCase() + name.slice(1));

      if (panel) {
        panel.classList.toggle('activeSite', name === site);
        panel.classList.toggle('hiddenSite', name !== site);
      }

      if (button) button.classList.toggle('active', name === site);
    });

    document.querySelectorAll('.navGroup').forEach(group => {
      group.classList.toggle('activeNavGroup', group.classList.contains(this.siteNavGroups[site]));
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  toggleSection(id) {
    const content = document.getElementById(id);
    const button = document.getElementById(id + 'Toggle');
    if (!content) return;

    content.classList.toggle('hidden');
    if (button) button.textContent = content.classList.contains('hidden') ? 'Näytä' : 'Piilota';
  },

  showGuide() {
    if (document.getElementById('guideOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'guideOverlay';
    overlay.className = 'overlay guideOverlay';

    overlay.innerHTML = `
      <div class="overlayBox guideBox" role="dialog" aria-modal="true" aria-labelledby="guideTitle">
        <button class="guideClose" type="button" onclick="UI.closeGuide()" aria-label="Sulje opas">×</button>

        <h2 id="guideTitle">📖 Villisika-Sepon pikaopas</h2>

        <p>
          Tavoitteena on kasvattaa juotujen oluiden määrää ilman, että arki kaatuu
          krapulaan, stressiin, rahapulaan tai kolmanteen Romahdukseen.
        </p>

        <h3>Sivut</h3>
        <ul>
          <li><strong>1. Arki</strong>: juominen, stressi, Romahdus, aika ja tapahtumat.</li>
          <li><strong>2. Raha & ostokset</strong>: Talous, Olutkauppa, Supermarket, palautukset, pikkukeikat ja Kela.</li>
          <li><strong>3. Apurit & kehitys</strong>: apurit ja pysyvät parannukset.</li>
          <li><strong>4. Uhkapelit</strong>: kuppipeli, karaoke ja korttipakka.</li>
          <li><strong>5. Tili</strong>: kirjautuminen, pilvitallennus, salasanan palautus, prestige ja pistetaulu.</li>
        </ul>

        <h3>Peruskierto</h3>
        <ol>
          <li>Hanki euroja palautuksilla, pikkukeikoilla, Kelalla tai varovaisella uhkapelillä.</li>
          <li>Osta olutta, kun hinta ja taloustilanne ovat siedettäviä.</li>
          <li>Juo täysiä tölkkejä: saat ryyppyjä, tyhjiä tölkkejä ja juodut oluet -pisteitä.</li>
          <li>Palauta tyhjät tölkit euroiksi ja pidä ruokaa, tupakkaa tai stressinlievitystä varalla.</li>
        </ol>

        <h3>Mittarit</h3>
        <ul>
          <li><strong>Pikatilastot</strong> näkyvät oikeassa reunassa kaikilla sivuilla ja ne voi pienentää sivuun.</li>
          <li><strong>Tapahtumasyöte</strong> näyttää karaokeillat, satunnaistapahtumat ja Kela-ongelmat. Hälytysäänen voi kytkeä päälle syötteen omasta painikkeesta.</li>
          <li><strong>Juodut oluet</strong> on nykyinen pistetaulun tulos. Myös apurien juomat oluet lasketaan.</li>
          <li><strong>Prestige</strong> nollaa nykyisen kierroksen, mutta lisää nimimerkin viereen pysyvän tähden pistetaululla.</li>
          <li><strong>Ryypyt</strong> ovat etenemisvaluuttaa apureihin, parannuksiin ja satunnaisiin tapahtumiin.</li>
          <li><strong>Eurot</strong> tarvitaan ostoksiin, palautusten ja tukien rytmittämään selviytymiseen sekä uhkapeleihin.</li>
          <li><strong>Krapula</strong> hidastaa päiviä. <strong>Stressi</strong> vaikeuttaa minipelejä ja voi pahentaa tilanteita.</li>
        </ul>

        <h3>Talous</h3>
        <ul>
          <li>Talousindeksi on pilvestä haettava yhteinen arvo, joten sama taloustilanne koskee kaikkia pelaajia.</li>
          <li>Se muuttuu yleensä kerran päivässä noin klo 06.00 Suomen aikaa.</li>
          <li>Indeksi vaikuttaa vain eurohintoihin ja euromaksuihin: olueen, markettiin, Kelaan ja pikkukeikkoihin.</li>
          <li>Ryypyt, apurit, pysyvät parannukset, tapahtumien ryyppyhinnat ja pistetaulu eivät seuraa inflaatiota.</li>
        </ul>

        <h3>Apurit ja parannukset</h3>
        <ul>
          <li>Apurit juovat täysiä tölkkejä puolestasi ja tuottavat ryyppyjä, jos varasto riittää.</li>
          <li>Pysyvät parannukset ostetaan ryypyillä. Ne auttavat pitkää peliä, mutta eivät korvaa toimivaa arkea.</li>
          <li>Teräsmaksan tiiviste vahvistuu hitaasti itse juoduista oluista.</li>
          <li>Apuriparannukset voivat säästää tölkkejä, parantaa tuotantoa tai tehdä apureista vähemmän arvaamattomia.</li>
        </ul>

        <h3>Minipeleistä</h3>
        <ul>
          <li>Puulantorilla osumat palauttavat tölkkejä, mutta huti lukitsee sen hetkeksi.</li>
          <li>Kilinäkoneessa valitse järkevin toiminta. Huonot päätökset voivat maksaa tölkkejä ja nostaa stressiä.</li>
          <li>Pikkukeikoissa tehtävä vaihtuu: joskus painetaan nuolia, joskus kirjoitetaan, klikataan kohteita tai säädetään kulmaa. Stressi lisää vaikeutta.</li>
          <li>Karaoke avautuu karaokeiltoina. Paina oikea nuoli keskimerkin kohdalla. Äänet voi laittaa päälle tai pois karaokeikkunasta.</li>
          <li>Uhkapelit käyttävät euroja panoksina ja voittoina, eivät ryyppyjä.</li>
        </ul>

        <h3>Romahdus</h3>
        <ul>
          <li>Romahdus voi tapahtua, kun stressi ja krapula ovat 100, euroja on alle 1 € eikä täysiä tölkkejä ole.</li>
          <li>Ensimmäinen ja toinen Romahdus eivät lopeta peliä, mutta vievät puolet euroista ja ryypyistä.</li>
          <li>Kolmas Romahdus päättää nykyisen selainistunnon pelin.</li>
          <li>Pidä aina ainakin yksi pelastusreitti hengissä: euroja, täysiä tölkkejä, alempi stressi tai alempi krapula.</li>
        </ul>

        <h3>Tili</h3>
        <ul>
          <li>Pilvitallennus toimii kirjautuneena Supabasen kautta.</li>
          <li>Peli tallentuu automaattisesti selaimeen ja kirjautuneena myös pilveen rauhallisella tahdilla.</li>
          <li>Prestige tarvitsee kirjautuneen tilin ja varoittaa aina ennen kierroksen nollausta.</li>
          <li>Nimimerkki tarvitaan pistetaululle näkymiseen.</li>
          <li>Salasanan palautus lähettää sähköpostilinkin, jos osoitteella on tili.</li>
          <li>Lataa pilvestä vain, kun haluat korvata nykyisen selainistunnon pilvitallennuksella.</li>
        </ul>
      </div>
    `;

    overlay.addEventListener('click', event => {
      if (event.target === overlay) this.closeGuide();
    });

    document.body.appendChild(overlay);
  },

  closeGuide() {
    const overlay = document.getElementById('guideOverlay');
    if (overlay) overlay.remove();
  },

  renderStats() {
    const s = Game.state;
    const helper = Helpers.getHelperDrinksPerDay();
    const emptyValue = s.emptyCans * Game.config.canValue;
    const stress = s.stress ?? 0;
    const stressLabel = typeof Stress !== 'undefined' ? Stress.label() : '';

    const panel = document.getElementById('statsPanel');
    if (!panel) return;

    panel.innerHTML = `
      <h2>Pikatilastot</h2>
      <div class="statLine">Ryypyt: ${Math.floor(s.ryypyt)}</div>
      <div class="statLine">Eurot: ${s.euros.toFixed(2)} €</div>
      <div class="statLine">Talousindeksi: ${typeof Economy !== 'undefined' ? Math.round(Economy.index * 100) + '%' : '100%'}</div>
      <div class="statLine">Krapula: ${Math.floor(s.hangover)}/100</div>
      <div class="statLine">Stressi: ${Math.floor(stress)}/100</div>
      <div class="statLine">Tila: ${stressLabel}</div>
      <div class="statLine">Romahdukset: ${s.collapseCount ?? 0}/3</div>
      <div class="statLine">Päivän hidastus: ${Game.getSlowdownPercent()}%</div>
      <div class="statLine">Tupakat: ${s.cigarettes}</div>
      <div class="statLine">Täydet tölkit: ${s.fullCans}</div>
      <div class="statLine">Tyhjät tölkit: ${s.emptyCans}</div>
      <div class="statLine">Tyhjien arvo: ${emptyValue.toFixed(2)} €</div>
      <div class="statLine">Juodut oluet: ${s.oluet}</div>
      <div class="statLine">Apurien tölkit / päivä: ${helper}</div>
      <div class="statLine">Ryyppyjä / päivä: ${Helpers.getRyypytPerDay()}</div>
      <div class="statLine">Ryyppyjä / minuutti: ${Helpers.getRyypytPerMinute().toFixed(1)}</div>
      <div class="statLine">Halvin tölkki nyt: ${BeerShop.getCheapestCanPrice().toFixed(2)} €</div>
      <div class="statLine">Päivä: ${s.day}</div>
      <div class="statLine">Apureita yhteensä: ${Helpers.getTotalHelpers()}</div>
      <div class="statLine">Kela-hakemuksia: ${Kela.countActive()}</div>
      <div class="statLine">Avoimia Kela-ongelmia: ${Kela.countProblems()}</div>
    `;
  }
};
