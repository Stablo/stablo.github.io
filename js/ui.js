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
    statsPanel: 'daily',
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
    accountContent: 'account'
  },

  init() {
    document.querySelectorAll('.leftNav button[data-target]').forEach(button => {
      button.onclick = () => {
        const id = button.dataset.target;
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

    this.initVolumeControl();
    window.addEventListener('keydown', event => this.handleKeydown(event));
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
          <li><strong>1. Arki</strong>: juominen, stressi, Romahdus, aika, tapahtumat ja pikatilastot.</li>
          <li><strong>2. Raha & ostokset</strong>: Talous, Olutkauppa, Supermarket, palautukset, pikkukeikat ja Kela.</li>
          <li><strong>3. Apurit & kehitys</strong>: apurit ja pysyvät parannukset.</li>
          <li><strong>4. Uhkapelit</strong>: kuppipeli, karaoke ja korttipakka.</li>
          <li><strong>5. Tili</strong>: kirjautuminen, pilvitallennus, salasanan palautus ja pistetaulu.</li>
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
          <li><strong>Juodut oluet</strong> on nykyinen pistetaulun tulos. Myös apurien juomat oluet lasketaan.</li>
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
          <li>Pikkukeikoissa paina nuolinäppäimet oikeassa järjestyksessä. Stressi lisää vaikeutta.</li>
          <li>Karaokessa paina oikea nuoli keskimerkin kohdalla. Äänet voi laittaa päälle tai pois karaokeikkunasta.</li>
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
          <li>Nimimerkki tarvitaan pistetaululle näkymiseen.</li>
          <li>Salasanan palautus lähettää sähköpostilinkin, jos osoitteella on tili.</li>
          <li>Tallenna ennen isoja riskejä ja lataa pilvestä vain, kun haluat korvata nykyisen selainistunnon.</li>
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

    document.getElementById('statsPanel').innerHTML = `
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
