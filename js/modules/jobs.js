const Jobs = {
  boardSize: 3,
  boardRefreshIntervalDays: 3,
  nextBoardRefreshDay: 4,
  jobTypes: [
    { name: 'Vie naapurin roskat', pay: 1.40, difficulty: 1, cooldown: 18, missionType: 'sequence', tag: 'Fyysinen', description: 'Nopea peruskeikka, jossa pitää muistaa askelmerkit.' },
    { name: 'Pidä ovea auki taloyhtiön kokouksen ajan', pay: 1.70, difficulty: 1, cooldown: 20, missionType: 'sequence', tag: 'Sosiaalinen', description: 'Pieni palvelus, outo määrä muodollisuutta.' },
    { name: 'Kerää irtotölkkejä torilta', pay: 1.90, difficulty: 1, cooldown: 22, missionType: 'clickTargets', tag: 'Keräily', description: 'Klikkaa esiin pomppivat panttikohteet ennen kuin joku muu ehtii.' },
    { name: 'Suorista taloyhtiön ilmoitustaulu', pay: 2.10, difficulty: 1, cooldown: 24, missionType: 'rotate', tag: 'Säätö', description: 'Käännä vino kyltti suunnilleen ihmisarvoiseen asentoon.' },
    { name: 'Täytä kadonneen kuitin selvityslomake', pay: 2.20, difficulty: 2, cooldown: 30, missionType: 'typing', tag: 'Paperi', description: 'Kirjoita lomakerivi ennen kuin byrokratia huomaa sinut.' },
    { name: 'Kanna mummon ostokset hissiin asti', pay: 2.50, difficulty: 2, cooldown: 32, missionType: 'sequence', tag: 'Fyysinen', description: 'Askelissa on rytmi, ostoskasseissa oma tahto.' },
    { name: 'Lajittele pullokassista pantilliset', pay: 2.80, difficulty: 2, cooldown: 34, missionType: 'clickTargets', tag: 'Keräily', description: 'Poimi oikeat kohteet nopeasti, ennen kuin kuitti pitenee.' },
    { name: 'Kirjoita taloyhtiön vikailmoitus ilman huutomerkkejä', pay: 3.00, difficulty: 2, cooldown: 36, missionType: 'typing', tag: 'Paperi', description: 'Täsmällinen teksti, epäselvä ongelma.' },
    { name: 'Kohdista antenni että kanava näkyy', pay: 3.30, difficulty: 3, cooldown: 44, missionType: 'rotate', tag: 'Säätö', description: 'Yksi aste liikaa ja ruudussa on vain lumisadetta.' },
    { name: 'Lapioi lunta rapun edestä sandaaleissa', pay: 3.60, difficulty: 3, cooldown: 46, missionType: 'sequence', tag: 'Fyysinen', description: 'Liike on tärkeintä, kengät eivät.' },
    { name: 'Naputtele varastolistaan tölkkien lukumäärät', pay: 3.90, difficulty: 3, cooldown: 48, missionType: 'typing', tag: 'Paperi', description: 'Tölkit ovat laskettu, mutta paperi vaatii oman uhrinsa.' },
    { name: 'Napsi varaston hintalaput oikeisiin laatikoihin', pay: 4.20, difficulty: 3, cooldown: 50, missionType: 'clickTargets', tag: 'Keräily', description: 'Kohteita tulee nopeasti ja jokainen väittää olevansa tärkeä.' },
    { name: 'Toimi epävirallisena jononvalvojana panttikoneella', pay: 4.70, difficulty: 4, cooldown: 60, missionType: 'sequence', tag: 'Sosiaalinen', description: 'Katsekontakti, nyökkäys, väistöliike. Toista.' },
    { name: 'Käännä varastohyllyn vino kyltti suoraksi', pay: 4.90, difficulty: 4, cooldown: 62, missionType: 'rotate', tag: 'Säätö', description: 'Kyltti ei tottele ketään, mutta eurot odottavat.' },
    { name: 'Täytä talkoolappu jossa on liian monta kohtaa', pay: 5.20, difficulty: 4, cooldown: 64, missionType: 'typing', tag: 'Paperi', description: 'Kirjoita ennen kuin joku lisää uuden ruudun.' },
    { name: 'Sammuta karaokevalojen vilkkuvat nappulat', pay: 5.60, difficulty: 4, cooldown: 66, missionType: 'clickTargets', tag: 'Tekniikka', description: 'Klikkaa valot kiinni siinä järjestyksessä kuin paniikki sallii.' },
    { name: 'Korjaa pyörän ketjut räkälän pihassa lusikalla', pay: 6.10, difficulty: 5, cooldown: 78, missionType: 'rotate', tag: 'Säätö', description: 'Käännä osa kohdalleen, vaikka työkalu on enemmän ajatus kuin esine.' },
    { name: 'Auta muuttokuormassa, mutta vain koska luvattiin kahvia', pay: 6.50, difficulty: 5, cooldown: 82, missionType: 'sequence', tag: 'Fyysinen', description: 'Painavat laatikot vaativat oikean rytmin ja vähän katumusta.' },
    { name: 'Kirjaa kirpputoripöydän oudot löydöt', pay: 6.80, difficulty: 5, cooldown: 86, missionType: 'typing', tag: 'Paperi', description: 'Teksti on lyhyt, mutta jokainen sana tuntuu kuitilta.' },
    { name: 'Poimi muuttolaatikoista särkyvät tavarat', pay: 7.30, difficulty: 5, cooldown: 90, missionType: 'clickTargets', tag: 'Keräily', description: 'Nopea käsi säästää lautaset ja ehkä myös maineen.' }
  ],
  missionLabels: {
    sequence: 'Nuolirutiini',
    typing: 'Lomakekirjoitus',
    clickTargets: 'Klikkikeikka',
    rotate: 'Säätöhomma'
  },
  typingFragments: [
    'kuitti puuttuu',
    'asiakas odottaa',
    'tavara löytyi',
    'lomake valmis',
    'ovi jäi auki',
    'tölkit laskettu',
    'ei lisäselvitystä',
    'työ tehty melkein',
    'varasto tarkistettu',
    'kahvitauko evätty'
  ],
  jobs: [],
  cooldowns: {},
  active: null,
  mission: null,
  seq: [],
  idx: 0,
  left: 0,
  timer: null,
  arrows: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  labels: { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' },

  init() {
    this.normalizeJobs();

    document.getElementById('moneyMain').insertAdjacentHTML(
      'beforeend',
      Game.section(
        'Pikkukeikat',
        'jobsContent',
        `
          <p>Kolme keikkaa kerrallaan. Lista vaihtuu muutaman pelipäivän välein ja tehdyn keikan tilalle ilmestyy uusi homma.</p>
          <p>Korkea stressi lisää tehtävän säätöä ja lyhentää aikaa. Talousindeksi vaikuttaa euromaksuihin.</p>
          <p id="jobBoardStatus" class="smallHint"></p>
          <div id="jobList" class="jobBoard"></div>
          <p id="jobStatus">Ei aktiivista keikkaa.</p>
        `
      )
    );
  },

  validMissionType(type) {
    return ['sequence', 'typing', 'clickTargets', 'rotate'].includes(type);
  },

  makeSlotId(index = 0) {
    return 'job_' + Date.now() + '_' + index + '_' + Math.random();
  },

  normalizeJob(job, index = 0) {
    const match = this.jobTypes.find(item => item.name === job?.name);
    const fallback = match || this.jobTypes[index % this.jobTypes.length];
    const difficulty = Number(job?.difficulty ?? fallback.difficulty);
    const pay = Number(job?.pay ?? fallback.pay);
    const cooldown = Number(job?.cooldown ?? fallback.cooldown);
    const missionType = this.validMissionType(job?.missionType) ? job.missionType : match ? fallback.missionType : 'sequence';

    return {
      ...fallback,
      ...job,
      name: String(job?.name || fallback.name),
      pay: Game.clamp(Number.isFinite(pay) ? pay : fallback.pay, 1, 12),
      difficulty: Math.floor(Game.clamp(Number.isFinite(difficulty) ? difficulty : fallback.difficulty, 1, 5)),
      cooldown: Math.floor(Game.clamp(Number.isFinite(cooldown) ? cooldown : fallback.cooldown, 10, 120)),
      missionType,
      tag: String(job?.tag || (match ? fallback.tag : 'Sekalainen') || this.missionLabels[missionType]),
      description: String(job?.description || (match ? fallback.description : 'Vanha keikka sovitettiin uuteen työlistaan.') || ''),
      slotId: job?.slotId || this.makeSlotId(index)
    };
  },

  normalizeJobs() {
    this.jobs = Array.isArray(this.jobs) ? this.jobs.slice(0, this.boardSize).map((job, index) => this.normalizeJob(job, index)) : [];
    while (this.jobs.length < this.boardSize) {
      this.jobs.push(this.pickOneJob(this.jobs, this.jobs.length));
    }

    if (!this.cooldowns || typeof this.cooldowns !== 'object') this.cooldowns = {};
    const activeIds = new Set(this.jobs.map(job => job.slotId));
    Object.keys(this.cooldowns).forEach(id => {
      if (!activeIds.has(id)) delete this.cooldowns[id];
      else this.cooldowns[id] = Math.max(0, Math.floor(Number(this.cooldowns[id]) || 0));
    });
    this.jobs.forEach(job => {
      if (this.cooldowns[job.slotId] === undefined) this.cooldowns[job.slotId] = 0;
    });

    const refreshDay = Math.floor(Number(this.nextBoardRefreshDay) || 0);
    this.nextBoardRefreshDay = refreshDay > 0 ? refreshDay : Game.state.day + this.boardRefreshIntervalDays;
  },

  pickOneJob(existing = [], index = 0) {
    const names = new Set(existing.map(job => job.name));
    let options = this.jobTypes.filter(job => !names.has(job.name));
    if (!options.length) options = this.jobTypes;
    return this.normalizeJob(options[Game.randInt(0, options.length - 1)], index);
  },

  pickRandomJobs(amount) {
    const result = [];
    for (let i = 0; i < amount; i++) result.push(this.pickOneJob(result, i));
    return result;
  },

  refreshBoard(force = false) {
    if (this.active && !force) return;
    this.jobs = this.pickRandomJobs(this.boardSize);
    this.cooldowns = {};
    this.jobs.forEach(job => this.cooldowns[job.slotId] = 0);
    this.nextBoardRefreshDay = Game.state.day + this.boardRefreshIntervalDays;
  },

  replaceJob(slotIndex) {
    const job = this.pickOneJob(this.jobs.filter((_, index) => index !== slotIndex), slotIndex);
    this.jobs[slotIndex] = job;
    this.cooldowns[job.slotId] = job.cooldown;
  },

  stressBonus() {
    return typeof Stress !== 'undefined' ? Stress.difficultyBonus() : 0;
  },

  stressTimePenalty() {
    const base = typeof Stress !== 'undefined' ? Stress.timePenalty() : 0;
    const discount = typeof Upgrades !== 'undefined' ? Upgrades.jobStressTimeDiscount() : 0;
    return Math.max(0, base - discount);
  },

  displayPay(job) {
    return typeof Economy !== 'undefined' ? Economy.scalePayment(job.pay, 'jobs') : job.pay;
  },

  missionTime(job) {
    const typeBase = {
      sequence: 8.5,
      typing: 12.5,
      clickTargets: 8.8,
      rotate: 8.2
    };
    const base = typeBase[job.missionType] || 8.5;
    return Math.max(3.2, base - job.difficulty * 0.45 - this.stressTimePenalty());
  },

  start(jobOrSlotId) {
    const job = typeof jobOrSlotId === 'string'
      ? this.jobs.find(item => item.slotId === jobOrSlotId)
      : jobOrSlotId;
    if (!job || this.active || this.cooldowns[job.slotId] > 0) return;

    this.active = this.normalizeJob(job, this.jobs.findIndex(item => item.slotId === job.slotId));
    this.idx = 0;
    this.seq = [];
    this.left = this.missionTime(this.active);
    this.mission = this.createMission(this.active);
    this.overlay();

    this.timer = setInterval(() => {
      this.left -= 0.1;
      if (this.left <= 0) this.fail('Aika loppui.');
      else this.renderOverlay();
    }, 100);

    if (this.active.missionType === 'sequence') window.addEventListener('keydown', this.handle);
    if (this.active.missionType === 'typing') {
      setTimeout(() => document.getElementById('jobTypingInput')?.focus(), 50);
    }
  },

  createMission(job) {
    const bonus = this.stressBonus();
    if (job.missionType === 'typing') return this.createTypingMission(job, bonus);
    if (job.missionType === 'clickTargets') return this.createClickMission(job, bonus);
    if (job.missionType === 'rotate') return this.createRotateMission(job, bonus);
    return this.createSequenceMission(job, bonus);
  },

  createSequenceMission(job, bonus) {
    const length = 4 + job.difficulty * 2 + bonus;
    this.seq = Array.from({ length }, () => this.arrows[Game.randInt(0, 3)]);
    return { type: 'sequence', maxTime: this.left };
  },

  createTypingMission(job, bonus) {
    const shuffled = [...this.typingFragments].sort(() => Math.random() - 0.5);
    const count = Game.clamp(2 + Math.floor(job.difficulty / 2) + Math.floor(bonus / 2), 2, 5);
    return {
      type: 'typing',
      maxTime: this.left,
      phrase: shuffled.slice(0, count).join(' / ')
    };
  },

  createClickMission(job, bonus) {
    const count = Game.clamp(3 + job.difficulty + bonus, 4, 11);
    const size = Math.max(30, 58 - job.difficulty * 4 - bonus * 2);
    const targets = Array.from({ length: count }, (_, index) => ({
      id: index,
      x: Game.randInt(10, 84),
      y: Game.randInt(18, 76),
      size
    }));
    return { type: 'clickTargets', maxTime: this.left, targets, targetIndex: 0 };
  },

  createRotateMission(job, bonus) {
    return {
      type: 'rotate',
      maxTime: this.left,
      targetAngle: Game.randInt(0, 359),
      currentAngle: Game.randInt(0, 359),
      tolerance: Math.max(8, 30 - job.difficulty * 3 - bonus * 2),
      hint: 'Säädä kulma ja lukitse, kun se näyttää oikealta.'
    };
  },

  overlay() {
    const overlay = document.createElement('div');
    overlay.id = 'jobOverlay';
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="overlayBox jobMissionBox">
        <h2 id="jobTitle"></h2>
        <p id="jobMissionHint"></p>
        <p id="jobStressHint"></p>
        <div class="progressOuter"><div class="progressInner" id="jobTime"></div></div>
        <div id="jobMissionArea"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.renderOverlay();
  },

  renderOverlay() {
    if (!this.active || !this.mission || !document.getElementById('jobOverlay')) return;

    document.getElementById('jobTitle').textContent = `${this.active.name} — ${this.displayPay(this.active).toFixed(2)} €`;
    document.getElementById('jobMissionHint').textContent = `${this.missionLabels[this.active.missionType]}: ${this.active.description}`;
    document.getElementById('jobStressHint').textContent =
      `Stressilisä: +${this.stressBonus()} vaikeutta, -${this.stressTimePenalty().toFixed(1)} s.`;

    const timeBar = document.getElementById('jobTime');
    if (timeBar) timeBar.style.width = Math.max(0, Math.min(100, this.left / this.mission.maxTime * 100)) + '%';

    if (this.mission.type === 'typing') this.renderTypingMission();
    else if (this.mission.type === 'clickTargets') this.renderClickMission();
    else if (this.mission.type === 'rotate') this.renderRotateMission();
    else this.renderSequenceMission();
  },

  renderSequenceMission() {
    const area = document.getElementById('jobMissionArea');
    if (!area) return;
    area.innerHTML = '<p>Paina nuolinäppäimet oikeassa järjestyksessä.</p><div class="bigSeq" id="jobSeq"></div>';
    const seq = document.getElementById('jobSeq');
    this.seq.forEach((key, index) => {
      const span = document.createElement('span');
      span.className = index < this.idx ? 'done' : index === this.idx ? 'current' : 'pending';
      span.textContent = this.labels[key];
      seq.appendChild(span);
    });
  },

  renderTypingMission() {
    const area = document.getElementById('jobMissionArea');
    if (!area) return;

    if (!document.getElementById('jobTypingInput')) {
      area.innerHTML = `
        <p class="jobTypingPhrase" id="jobTypingPhrase"></p>
        <input id="jobTypingInput" class="jobTypingInput" type="text" autocomplete="off" spellcheck="false">
        <p id="jobTypingProgress" class="smallHint"></p>
      `;
      document.getElementById('jobTypingInput').addEventListener('input', () => this.checkTyping());
    }

    document.getElementById('jobTypingPhrase').textContent = this.mission.phrase;
    const input = document.getElementById('jobTypingInput');
    const progress = document.getElementById('jobTypingProgress');
    if (progress && input) progress.textContent = `${input.value.length}/${this.mission.phrase.length} merkkiä`;
  },

  renderClickMission() {
    const area = document.getElementById('jobMissionArea');
    if (!area) return;

    const current = this.mission.targets[this.mission.targetIndex];
    if (!current) {
      this.success();
      return;
    }

    if (area.dataset.targetIndex === String(this.mission.targetIndex) && document.getElementById('jobClickField')) return;
    area.dataset.targetIndex = String(this.mission.targetIndex);

    area.innerHTML = `
      <p class="smallHint">Kohde ${this.mission.targetIndex + 1}/${this.mission.targets.length}. Klikkaa ilmestyvä kohde.</p>
      <div class="jobClickField" id="jobClickField"></div>
    `;

    const field = document.getElementById('jobClickField');
    const target = document.createElement('button');
    target.type = 'button';
    target.className = 'jobClickTarget';
    target.textContent = String(this.mission.targetIndex + 1);
    target.style.left = current.x + '%';
    target.style.top = current.y + '%';
    target.style.width = current.size + 'px';
    target.style.height = current.size + 'px';
    target.onclick = () => this.hitTarget(current.id);
    field.appendChild(target);
  },

  renderRotateMission() {
    const area = document.getElementById('jobMissionArea');
    if (!area) return;

    if (!document.getElementById('jobRotateSlider')) {
      area.innerHTML = `
        <p id="jobRotateHint" class="smallHint"></p>
        <div class="jobRotateStage">
          <div class="jobAngleTarget" id="jobAngleTarget"></div>
          <div class="jobRotatingObject" id="jobRotatingObject">KYLTTI</div>
        </div>
        <input id="jobRotateSlider" type="range" min="0" max="359" step="1">
        <div class="accountActions">
          <button type="button" onclick="Jobs.lockRotation()">Lukitse kulma</button>
        </div>
      `;
      document.getElementById('jobRotateSlider').addEventListener('input', event => this.updateRotation(event.target.value));
    }

    const slider = document.getElementById('jobRotateSlider');
    const target = document.getElementById('jobAngleTarget');
    const object = document.getElementById('jobRotatingObject');
    const hint = document.getElementById('jobRotateHint');

    slider.value = String(this.mission.currentAngle);
    target.style.transform = `translate(-50%, -50%) rotate(${this.mission.targetAngle}deg)`;
    object.style.transform = `translate(-50%, -50%) rotate(${this.mission.currentAngle}deg)`;
    hint.textContent = `${this.mission.hint} Sallitun heiton raja: ±${this.mission.tolerance}°.`;
  },

  handle(event) {
    Jobs.key(event);
  },

  key(event) {
    if (!this.active || !this.mission || this.mission.type !== 'sequence' || !this.arrows.includes(event.key)) return;
    event.preventDefault();
    if (event.key === this.seq[this.idx]) {
      this.idx++;
      if (this.idx >= this.seq.length) this.success();
      else this.renderOverlay();
    } else {
      this.fail('Väärä nuoli.');
    }
  },

  normalizeText(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
  },

  checkTyping() {
    if (!this.active || !this.mission || this.mission.type !== 'typing') return;
    const input = document.getElementById('jobTypingInput');
    if (!input) return;
    if (this.normalizeText(input.value) === this.normalizeText(this.mission.phrase)) this.success();
    else this.renderOverlay();
  },

  hitTarget(id) {
    if (!this.active || !this.mission || this.mission.type !== 'clickTargets') return;
    const current = this.mission.targets[this.mission.targetIndex];
    if (!current || current.id !== id) return;

    this.mission.targetIndex++;
    if (this.mission.targetIndex >= this.mission.targets.length) this.success();
    else this.renderOverlay();
  },

  updateRotation(value) {
    if (!this.active || !this.mission || this.mission.type !== 'rotate') return;
    this.mission.currentAngle = Math.floor(Number(value) || 0);
    this.renderRotateMission();
  },

  angleDistance(a, b) {
    return Math.abs(((a - b + 540) % 360) - 180);
  },

  lockRotation() {
    if (!this.active || !this.mission || this.mission.type !== 'rotate') return;
    const distance = this.angleDistance(this.mission.currentAngle, this.mission.targetAngle);
    if (distance <= this.mission.tolerance) {
      this.success();
      return;
    }

    this.mission.hint = `Vielä vinossa: heitto ${Math.round(distance)}°.`;
    this.renderRotateMission();
  },

  cleanup() {
    clearInterval(this.timer);
    this.timer = null;
    window.removeEventListener('keydown', this.handle);
    const overlay = document.getElementById('jobOverlay');
    if (overlay) overlay.remove();
    this.mission = null;
    this.seq = [];
    this.idx = 0;
  },

  success() {
    const job = this.active;
    if (!job) return;

    const slot = this.jobs.findIndex(item => item.slotId === job.slotId);
    const pay = this.displayPay(job);
    const stressRelief = Math.max(1, job.difficulty + 1);
    this.cleanup();

    Game.state.euros += pay;
    Game.changeHangover(job.difficulty);
    if (typeof Stress !== 'undefined') Game.changeStress(-stressRelief);

    Game.state.eventLog = `Pikkukeikka onnistui: ${job.name}. +${pay.toFixed(2)} €, krapula +${job.difficulty}, stressi -${stressRelief}.`;
    this.active = null;
    if (slot >= 0) this.replaceJob(slot);
    Game.update();
  },

  fail(reason) {
    if (!this.active) return;
    const job = this.active;
    const slot = this.jobs.findIndex(item => item.slotId === job.slotId);
    const stressGain = Math.max(4, job.difficulty * 2 + 2);
    this.cleanup();

    Game.changeHangover(job.difficulty * 2);
    if (typeof Stress !== 'undefined') Game.changeStress(stressGain);

    Game.state.eventLog = `Pikkukeikka epäonnistui: ${job.name}. ${reason} Krapula +${job.difficulty * 2}, stressi +${stressGain}.`;
    this.active = null;
    if (slot >= 0) this.replaceJob(slot);
    Game.update();
  },

  tick() {
    let changed = false;
    Object.keys(this.cooldowns).forEach(id => {
      if (this.cooldowns[id] > 0) {
        this.cooldowns[id]--;
        changed = true;
      }
    });

    if (!this.active && Game.state.day >= this.nextBoardRefreshDay) {
      this.refreshBoard(true);
      changed = true;
    }

    if (changed) this.render();
  },

  render() {
    this.normalizeJobs();

    const list = document.getElementById('jobList');
    const status = document.getElementById('jobStatus');
    const boardStatus = document.getElementById('jobBoardStatus');
    if (!list || !status || !boardStatus) return;

    list.replaceChildren();
    boardStatus.textContent = `Lista vaihtuu seuraavan kerran päivänä ${this.nextBoardRefreshDay}.`;

    this.jobs.forEach(job => {
      const cooldown = this.cooldowns[job.slotId] || 0;
      const card = document.createElement('div');
      card.className = 'jobCard';

      const title = document.createElement('h3');
      title.textContent = job.name;

      const tag = document.createElement('div');
      tag.className = 'jobTag';
      tag.textContent = `${job.tag} / ${this.missionLabels[job.missionType]}`;

      const desc = document.createElement('p');
      desc.textContent = job.description;

      const meta = document.createElement('div');
      meta.className = 'jobMeta';
      meta.textContent = `${this.displayPay(job).toFixed(2)} € · vaikeus ${job.difficulty} · ${cooldown > 0 ? 'odottaa ' + cooldown + ' s' : 'valmis'}`;

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = cooldown > 0 ? `Odottaa ${cooldown} s` : 'Aloita keikka';
      button.disabled = !!this.active || cooldown > 0;
      button.onclick = () => this.start(job.slotId);

      card.appendChild(title);
      card.appendChild(tag);
      card.appendChild(desc);
      card.appendChild(meta);
      card.appendChild(button);
      list.appendChild(card);
    });

    status.textContent = this.active ? 'Keikka käynnissä: ' + this.active.name : 'Ei aktiivista keikkaa.';
  }
};

Game.register(Jobs);
