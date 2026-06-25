const Jobs = {
  jobTypes: [
    { name: 'Vie naapurin roskat', pay: 1.20, difficulty: 1, cooldown: 10 },
    { name: 'Harjaa rappukäytävän hiekat maton alle', pay: 1.40, difficulty: 1, cooldown: 10 },
    { name: 'Vie väärän talon roskat oikeaan roskikseen', pay: 1.50, difficulty: 1, cooldown: 12 },
    { name: 'Kerää irtotölkkejä torilta', pay: 1.80, difficulty: 1, cooldown: 14 },
    { name: 'Selitä mummolle missä lähin pankkiautomaatti on', pay: 1.90, difficulty: 1, cooldown: 15 },
    { name: 'Kanna mummon ostokset hissiin asti', pay: 2.30, difficulty: 2, cooldown: 20 },
    { name: 'Palauta jonkun tölkkisäkki ilman että katsot kuittia liian pitkään', pay: 2.60, difficulty: 2, cooldown: 22 },
    { name: 'Pidä ovea auki taloyhtiön kokouksen ajan', pay: 2.70, difficulty: 2, cooldown: 24 },
    { name: 'Etsi naapurin koiran heijastinliivi puskasta', pay: 2.90, difficulty: 2, cooldown: 25 },
    { name: 'Käy ostamassa kahvimaitoa ja muista kuitin olemassaolo', pay: 3.00, difficulty: 2, cooldown: 26 },
    { name: 'Lapioi lunta rapun edestä sandaaleissa', pay: 3.60, difficulty: 3, cooldown: 34 },
    { name: 'Vahtaa naapurin koiraa, joka tuomitsee sinua hiljaa', pay: 3.90, difficulty: 3, cooldown: 36 },
    { name: 'Kerää tupakantumpit taloyhtiön pihalta', pay: 4.10, difficulty: 3, cooldown: 38 },
    { name: 'Pese taloyhtiön ilmoitustaulu liian märällä rätillä', pay: 4.20, difficulty: 3, cooldown: 40 },
    { name: 'Ole muutossa mukana vain sen yhden sohvan verran', pay: 4.50, difficulty: 3, cooldown: 42 },
    { name: 'Korjaa pyörän ketjut räkälän pihassa lusikalla', pay: 5.20, difficulty: 4, cooldown: 55 },
    { name: 'Toimi epävirallisena jononvalvojana panttikoneella', pay: 5.50, difficulty: 4, cooldown: 58 },
    { name: 'Hae kadonnut ostoskärry ojan reunasta', pay: 5.80, difficulty: 4, cooldown: 60 },
    { name: 'Selvitä kuka vei taloyhtiön lumilapion', pay: 6.00, difficulty: 4, cooldown: 62 },
    { name: 'Auta muuttokuormassa, mutta vain koska luvattiin kahvia', pay: 7.00, difficulty: 5, cooldown: 75 },
    { name: 'Pidä kirpputoripöytää pystyssä ilmastointiteipillä', pay: 7.40, difficulty: 5, cooldown: 80 },
    { name: 'Ohjaa humalainen karaokeisäntä oikeaan taksiin', pay: 7.80, difficulty: 5, cooldown: 85 },
    { name: 'Korjaa naapurin digiboksi painamalla kaikkia nappeja viisaasti', pay: 8.20, difficulty: 5, cooldown: 90 }
  ],
  jobs: [],
  cooldowns: {},
  active: null,
  seq: [],
  idx: 0,
  left: 0,
  timer: null,
  arrows: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  labels: { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' },

  init() {
    this.jobs = this.pickRandomJobs(5);
    this.jobs.forEach(job => this.cooldowns[job.slotId] = 0);

    document.getElementById('moneyMain').insertAdjacentHTML(
      'beforeend',
      Game.section(
        'Pikkukeikat',
        'jobsContent',
        `
          <p>Pienet käteiskeikat. Kun onnistut tai epäonnistut keikassa, sen tilalle ilmestyy uusi satunnainen homma.</p>
          <p>Korkea stressi lisää nuolia ja lyhentää aikaa.</p>
          <div id="jobList"></div>
          <p id="jobStatus">Ei aktiivista keikkaa.</p>
        `
      )
    );
  },

  pickRandomJobs(amount) {
    const pool = [...this.jobTypes];
    const result = [];
    for (let i = 0; i < amount && pool.length; i++) {
      const index = Game.randInt(0, pool.length - 1);
      const picked = pool.splice(index, 1)[0];
      result.push({ ...picked, slotId: 'job_' + Date.now() + '_' + i + '_' + Math.random() });
    }
    return result;
  },

  replaceJob(slotIndex) {
    const names = new Set(this.jobs.map(job => job.name));
    let options = this.jobTypes.filter(job => !names.has(job.name));
    if (!options.length) options = this.jobTypes;
    const picked = options[Game.randInt(0, options.length - 1)];
    const job = { ...picked, slotId: 'job_' + Date.now() + '_' + slotIndex + '_' + Math.random() };
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

  start(job) {
    if (this.active || this.cooldowns[job.slotId] > 0) return;

    this.active = job;
    this.idx = 0;

    const bonus = this.stressBonus();
    const length = 4 + job.difficulty * 2 + bonus;
    this.seq = Array.from({ length }, () => this.arrows[Game.randInt(0, 3)]);
    this.left = Math.max(2.4, 8 - job.difficulty * 0.7 - this.stressTimePenalty());

    this.overlay();
    this.timer = setInterval(() => {
      this.left -= 0.1;
      if (this.left <= 0) this.fail('Aika loppui.');
      this.renderOverlay();
    }, 100);

    window.addEventListener('keydown', this.handle);
  },

  overlay() {
    const overlay = document.createElement('div');
    overlay.id = 'jobOverlay';
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="overlayBox">
        <h2 id="jobTitle"></h2>
        <p>Paina nuolinäppäimet oikeassa järjestyksessä.</p>
        <p id="jobStressHint"></p>
        <div class="progressOuter"><div class="progressInner" id="jobTime"></div></div>
        <div class="bigSeq" id="jobSeq"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.renderOverlay();
  },

  renderOverlay() {
    if (!this.active || !document.getElementById('jobOverlay')) return;
    document.getElementById('jobTitle').textContent = `${this.active.name} — ${this.displayPay(this.active).toFixed(2)} €`;
    document.getElementById('jobStressHint').textContent = `Stressilisä: +${this.stressBonus()} nuolta, -${this.stressTimePenalty().toFixed(1)} s.`;

    const seq = document.getElementById('jobSeq');
    seq.innerHTML = '';
    this.seq.forEach((key, index) => {
      seq.insertAdjacentHTML('beforeend', `<span class="${index < this.idx ? 'done' : index === this.idx ? 'current' : 'pending'}">${this.labels[key]}</span>`);
    });

    const max = Math.max(2.4, 8 - this.active.difficulty * 0.7 - this.stressTimePenalty());
    document.getElementById('jobTime').style.width = Math.max(0, Math.min(100, this.left / max * 100)) + '%';
  },

  handle(event) {
    Jobs.key(event);
  },

  key(event) {
    if (!this.active || !this.arrows.includes(event.key)) return;
    event.preventDefault();
    if (event.key === this.seq[this.idx]) {
      this.idx++;
      if (this.idx >= this.seq.length) this.success();
    } else {
      this.fail('Väärä nuoli.');
    }
  },

  cleanup() {
    clearInterval(this.timer);
    window.removeEventListener('keydown', this.handle);
    const overlay = document.getElementById('jobOverlay');
    if (overlay) overlay.remove();
  },

  success() {
    const job = this.active;
    const slot = this.jobs.findIndex(j => j.slotId === job.slotId);
    const pay = this.displayPay(job);
    this.cleanup();

    Game.state.euros += pay;
    Game.changeHangover(job.difficulty);
    if (typeof Stress !== 'undefined') Game.changeStress(-Math.max(2, job.difficulty * 2));

    Game.state.eventLog = `Pikkukeikka onnistui: ${job.name}. +${pay.toFixed(2)} €, krapula +${job.difficulty}, stressi -${Math.max(2, job.difficulty * 2)}.`;
    this.active = null;
    if (slot >= 0) this.replaceJob(slot);
    Game.update();
  },

  fail(reason) {
    if (!this.active) return;
    const job = this.active;
    const slot = this.jobs.findIndex(j => j.slotId === job.slotId);
    this.cleanup();

    Game.changeHangover(job.difficulty * 2);
    if (typeof Stress !== 'undefined') Game.changeStress(Math.max(4, job.difficulty * 3));

    Game.state.eventLog = `Pikkukeikka epäonnistui: ${job.name}. ${reason} Krapula +${job.difficulty * 2}, stressi +${Math.max(4, job.difficulty * 3)}.`;
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
    if (changed) this.render();
  },

  render() {
    const list = document.getElementById('jobList');
    if (!list) return;
    list.innerHTML = '';

    this.jobs.forEach((job, index) => {
      const cooldown = this.cooldowns[job.slotId] || 0;
      list.insertAdjacentHTML(
        'beforeend',
        `<button onclick="Jobs.start(Jobs.jobs[${index}])" ${this.active || cooldown > 0 ? 'disabled' : ''}>${job.name} — ${this.displayPay(job).toFixed(2)} €, vaikeus ${job.difficulty}, cooldown ${cooldown > 0 ? cooldown + 's' : job.cooldown + 's'}</button><br>`
      );
    });

    document.getElementById('jobStatus').textContent = this.active ? 'Keikka käynnissä: ' + this.active.name : 'Ei aktiivista keikkaa.';
  }
};

Game.register(Jobs);
