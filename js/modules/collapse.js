const Collapse = {
  init() {
    this.normalizeState();

    document.getElementById('gameMain').insertAdjacentHTML(
      'beforeend',
      Game.section(
        'Romahdus',
        'collapseContent',
        `
          <p>
            Jos stressi, krapula ja rahat ajautuvat samaan aikaan aivan pohjalle, Seppo voi romahtaa.
            Ensimmäiset romahdukset ovat nöyryyttäviä mutta pelastettavissa. Kolmas romahdus päättää pelin.
          </p>
          <p>Romahduksia: <strong><span id="collapseCount">0</span>/3</strong></p>
          <p id="collapseStatus">Tilanne on toistaiseksi jotenkin hallinnassa.</p>
          <ul id="collapseRiskList" class="collapseRiskList"></ul>
        `
      )
    );
  },

  normalizeState() {
    if (Game.state.collapseCount === undefined) Game.state.collapseCount = 0;
    if (Game.state.lastCollapseDay === undefined) Game.state.lastCollapseDay = null;
    if (Game.state.gameOver === undefined) Game.state.gameOver = false;
  },

  riskChecks() {
    const s = Game.state;
    return [
      { label: 'Stressi 100/100', ok: (s.stress ?? 0) >= 100, value: Math.floor(s.stress ?? 0) + '/100' },
      { label: 'Krapula 100/100', ok: s.hangover >= 100, value: Math.floor(s.hangover) + '/100' },
      { label: 'Eurot alle 1 €', ok: s.euros < 1, value: s.euros.toFixed(2) + ' €' },
      { label: 'Ei täysiä tölkkejä', ok: s.fullCans <= 0, value: s.fullCans + ' tölkkiä' }
    ];
  },

  shouldCollapse() {
    const s = Game.state;
    if (s.gameOver) return false;
    if (s.lastCollapseDay === s.day) return false;
    return this.riskChecks().every(check => check.ok);
  },

  tick() {
    this.normalizeState();
    if (this.shouldCollapse()) this.triggerCollapse();
  },

  stopActiveChaos() {
    if (typeof Jobs !== 'undefined' && Jobs.active) {
      if (typeof Jobs.cleanup === 'function') Jobs.cleanup();
      Jobs.active = null;
    }

    if (typeof Returns !== 'undefined' && Returns.returning) {
      Returns.returning = false;
      Returns.type = '';
      Returns.total = 0;
      Returns.left = 0;
      Returns.cans = 0;
    }

    if (typeof PuulantoriCanGame !== 'undefined' && PuulantoriCanGame.overlay) {
      PuulantoriCanGame.cleanup();
    }

    if (typeof Gambling !== 'undefined') {
      if (Gambling.karaokeActive && typeof Gambling.finishKaraoke === 'function') {
        Gambling.finishKaraoke(false, 'Romahdus keskeytti karaoken.');
      }
      Gambling.cupActive = false;
      Gambling.cardActive = false;
      document.querySelectorAll('#cupOverlay, #karaokeOverlay, #cardOverlay').forEach(el => el.remove());
    }
  },

  triggerCollapse() {
    const s = Game.state;
    this.stopActiveChaos();

    s.collapseCount = (s.collapseCount ?? 0) + 1;
    s.lastCollapseDay = s.day;

    if (s.collapseCount >= 3) {
      this.triggerGameOver();
      return;
    }

    const oldRyypyt = Math.floor(s.ryypyt);
    const oldEuros = s.euros;

    s.ryypyt = Math.floor(s.ryypyt * 0.5);
    s.euros = Number((s.euros * 0.5).toFixed(2));
    s.fullCans += 3;
    s.hangover = 60;
    s.stress = 40;
    s.day += 1;
    s.dayProgressSeconds = 0;

    const title = s.collapseCount === 1 ? 'Pieni maanantai' : 'Isompi maanantai';
    s.eventLog = `${title}: romahdus! Menetit puolet ryypyistä ja euroista, mutta joku jätti säälistä 3 täyttä tölkkiä.`;

    this.showCollapseOverlay({
      title,
      text: 'Elämänhallinta meni hetkeksi määräaikaiseen huoltoon.',
      details: [
        `Ryypyt: ${oldRyypyt} → ${Math.floor(s.ryypyt)}`,
        `Eurot: ${oldEuros.toFixed(2)} € → ${s.euros.toFixed(2)} €`,
        'Krapula palautui tasolle 60/100.',
        'Stressi palautui tasolle 40/100.',
        'Sait 3 täyttä tölkkiä säälivarastoon.',
        `Romahduksia jäljellä ennen pelin loppua: ${3 - s.collapseCount}`
      ],
      final: false
    });
  },

  triggerGameOver() {
    const s = Game.state;
    s.gameOver = true;
    s.eventLog = 'Peli ohi: Seppo siirtyi taustatarinaksi.';

    this.showCollapseOverlay({
      title: 'Seppo siirtyi taustatarinaksi',
      text: 'Kolmas romahdus vei viimeisenkin hallinnan. Puulantorin penkki jäi hiljaiseksi, Kela pyysi lisäselvitystä lisäselvityksestä ja Jarski ei vastannut puhelimeen.',
      details: [
        'Peli on päättynyt.',
        'Voit aloittaa alusta tai ladata aiemman tallennuksen, jos sellainen on olemassa.',
        'Seuraavalla kierroksella: pidä ainakin yksi pelastusreitti hengissä — euroja, tölkkejä, matalampi stressi tai matalampi krapula.'
      ],
      final: true
    });
  },

  showCollapseOverlay({ title, text, details, final }) {
    const old = document.getElementById('collapseOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'collapseOverlay';
    overlay.className = 'overlay collapseOverlay';

    overlay.innerHTML = `
      <div class="overlayBox collapseBox" role="dialog" aria-modal="true">
        <h2>💥 ${title}</h2>
        <p class="collapseBig">${text}</p>
        <ul>${details.map(item => `<li>${item}</li>`).join('')}</ul>
        <div>
          ${final
            ? `<button onclick="Collapse.hardReset()">Aloita alusta</button><button onclick="SaveLoad.load().then(ok => { if (ok) Collapse.closeOverlay(); })">Lataa pilvitallennus</button>`
            : `<button onclick="Collapse.closeOverlay()">Jatka jotenkin</button>`
          }
        </div>
      </div>
    `;

    if (!final) {
      overlay.addEventListener('click', event => {
        if (event.target === overlay) this.closeOverlay();
      });
    }

    document.body.appendChild(overlay);
    Game.update();
  },

  closeOverlay() {
    const overlay = document.getElementById('collapseOverlay');
    if (overlay) overlay.remove();
    Game.update();
  },

  hardReset() {
    location.reload();
  },

  render() {
    this.normalizeState();

    const count = document.getElementById('collapseCount');
    const status = document.getElementById('collapseStatus');
    const list = document.getElementById('collapseRiskList');
    if (!count || !status || !list) return;

    const s = Game.state;
    const checks = this.riskChecks();
    const active = checks.filter(check => check.ok).length;

    count.textContent = s.collapseCount ?? 0;

    if (s.gameOver) {
      status.textContent = 'Peli on päättynyt. Seppo siirtyi taustatarinaksi.';
      status.className = 'collapseDanger';
    } else if (active >= checks.length) {
      status.textContent = 'Romahdus on välitön.';
      status.className = 'collapseDanger';
    } else if (active >= 3) {
      status.textContent = 'Vaarallinen yhdistelmä kasassa. Korjaa edes yksi asia nopeasti.';
      status.className = 'collapseDanger';
    } else {
      status.textContent = 'Tilanne on toistaiseksi jotenkin hallinnassa.';
      status.className = 'collapseSafe';
    }

    list.innerHTML = checks.map(check => `
      <li class="${check.ok ? 'collapseDanger' : 'collapseSafe'}">
        ${check.ok ? '⚠' : '✓'} ${check.label} — nykytila: ${check.value}
      </li>
    `).join('');
  }
};

Game.register(Collapse);
