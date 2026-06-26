const LauriThaiMadness = {
  imagePath: 'assets/tupe.png',
  durationDays: 30,
  multiplier: 5,
  state: {
    scheduleDate: '',
    scheduledAt: 0,
    triggeredDate: '',
    startedDay: 0,
    activeUntilDay: 0
  },

  init() {
    this.ensureSchedule();
  },

  dateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  nightDate(now = new Date()) {
    const target = new Date(now);
    if (now.getHours() >= 6) target.setDate(target.getDate() + 1);
    target.setHours(0, 0, 0, 0);
    return target;
  },

  scheduleForNight(now = new Date()) {
    const night = this.nightDate(now);
    const windowMs = 6 * 60 * 60 * 1000;

    this.state.scheduleDate = this.dateKey(night);
    this.state.scheduledAt = night.getTime() + Game.randInt(0, windowMs);
  },

  ensureSchedule(now = new Date()) {
    const targetDate = this.dateKey(this.nightDate(now));
    if (this.state.scheduleDate !== targetDate || !this.state.scheduledAt) {
      this.scheduleForNight(now);
    }
  },

  stateForSave() {
    return {
      scheduleDate: this.state.scheduleDate,
      scheduledAt: this.state.scheduledAt,
      triggeredDate: this.state.triggeredDate,
      startedDay: this.state.startedDay,
      activeUntilDay: this.state.activeUntilDay
    };
  },

  restoreState(data) {
    this.state = {
      scheduleDate: typeof data?.scheduleDate === 'string' ? data.scheduleDate.slice(0, 16) : '',
      scheduledAt: Number.isFinite(Number(data?.scheduledAt)) ? Number(data.scheduledAt) : 0,
      triggeredDate: typeof data?.triggeredDate === 'string' ? data.triggeredDate.slice(0, 16) : '',
      startedDay: Number.isFinite(Number(data?.startedDay)) ? Math.max(0, Math.floor(Number(data.startedDay))) : 0,
      activeUntilDay: Number.isFinite(Number(data?.activeUntilDay)) ? Math.max(0, Math.floor(Number(data.activeUntilDay))) : 0
    };
    this.ensureSchedule();
  },

  isActive() {
    return Number(this.state.activeUntilDay || 0) > Game.state.day;
  },

  daysLeft() {
    if (!this.isActive()) return 0;
    return Math.max(1, Math.ceil(Number(this.state.activeUntilDay || 0) - Game.state.day));
  },

  lauriMultiplier() {
    return this.isActive() ? this.multiplier : 1;
  },

  activeEventInfo() {
    if (!this.isActive()) return null;

    const baseDrink = typeof Helpers !== 'undefined' ? Helpers.lauriDrinksPerHelper() : 3;
    const boostedDrink = baseDrink * this.multiplier;

    return {
      name: 'Lauri-sedän Thai-hulluus',
      effect: `Laurit juovat ${this.multiplier}x vauhdilla (${boostedDrink} tölkkiä / Lauri / päivä).`,
      timer: `${this.daysLeft()} pelipäivää`
    };
  },

  tick() {
    const now = new Date();
    this.ensureSchedule(now);

    const today = this.dateKey(now);
    const inNightWindow = now.getHours() < 6;
    const due = Date.now() >= this.state.scheduledAt;

    if (inNightWindow && due && this.state.scheduleDate === today && this.state.triggeredDate !== today) {
      this.trigger(today);
    }
  },

  trigger(dayKey) {
    this.state.triggeredDate = dayKey;
    this.state.startedDay = Game.state.day;
    this.state.activeUntilDay = Math.max(
      Number(this.state.activeUntilDay || 0),
      Game.state.day + this.durationDays
    );

    const resultText = this.activateLauriMadness();
    this.showSplash(resultText);

    Game.state.eventLog = `Lauri-sedän Thai-hulluus: ${resultText}`;
    if (typeof UI !== 'undefined' && typeof UI.announceEvent === 'function') {
      UI.announceEvent(Game.state.eventLog, { sound: true, type: 'lauri' });
    }
    Game.update();
  },

  activateLauriMadness() {
    if (typeof Helpers === 'undefined') {
      return `Thai-hulluus on päällä ${this.daysLeft()} pelipäivää, mutta apurilistaa ei löytynyt.`;
    }

    Helpers.normalize();
    const lauris = Helpers.helpers.lauri.count;
    if (lauris <= 0) {
      return `Thai-hulluus on päällä ${this.daysLeft()} pelipäivää. Lauri-setä reissaa näyttävästi, vaikka palkkalistoilla ei vielä ole Lauria.`;
    }

    const dailyDemand = lauris * Helpers.lauriDrinksPerHelper() * this.multiplier;
    return `Thai-hulluus on päällä ${this.daysLeft()} pelipäivää. Nykyiset Laurit yrittävät juoda ${dailyDemand} tölkkiä per päivä.`;
  },

  showSplash(resultText) {
    const old = document.getElementById('lauriThaiOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'lauriThaiOverlay';
    overlay.className = 'overlay lauriThaiOverlay';

    const box = document.createElement('div');
    box.className = 'lauriThaiBox';
    box.style.backgroundImage = `linear-gradient(90deg, rgba(0,0,0,.42), rgba(0,0,0,.12)), url("${this.imagePath}")`;

    const fireworks = document.createElement('div');
    fireworks.className = 'lauriThaiFireworks';
    this.populateFireworks(fireworks);

    const content = document.createElement('div');
    content.className = 'lauriThaiContent';

    const title = document.createElement('h2');
    title.className = 'lauriThaiTitle';
    title.textContent = 'Lauri-sedän Thai-hulluus';

    const message = document.createElement('p');
    message.className = 'lauriThaiRainbowText';
    message.textContent = 'Lauri-setä on reissaamassa Thaimaassa ledareita jahtaamassa! Lavetilla lötköttäessä Lauri niin sanotusti vetelee menemään kaljaa viisinkertaisen määrän!';

    const result = document.createElement('p');
    result.className = 'lauriThaiResult';
    result.textContent = resultText;

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Selvä, antaa mennä';
    button.onclick = () => this.closeSplash();

    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(result);
    content.appendChild(button);
    box.appendChild(fireworks);
    box.appendChild(content);
    overlay.appendChild(box);

    overlay.addEventListener('click', event => {
      if (event.target === overlay) this.closeSplash();
    });

    document.body.appendChild(overlay);
  },

  populateFireworks(container) {
    const colors = ['#ff3bff', '#00e5ff', '#fff200', '#2dff73', '#ff6b00', '#ff3b3b'];
    for (let i = 0; i < 9; i++) {
      const burst = document.createElement('div');
      burst.className = 'lauriThaiFirework';
      burst.style.left = Game.randInt(7, 93) + '%';
      burst.style.top = Game.randInt(6, 62) + '%';
      burst.style.animationDelay = (i * 0.18).toFixed(2) + 's';

      for (let j = 0; j < 14; j++) {
        const spark = document.createElement('span');
        spark.className = 'lauriThaiSpark';
        spark.style.setProperty('--angle', `${Math.round((360 / 14) * j)}deg`);
        spark.style.setProperty('--spark-color', colors[(i + j) % colors.length]);
        spark.style.animationDelay = (i * 0.18).toFixed(2) + 's';
        burst.appendChild(spark);
      }

      container.appendChild(burst);
    }
  },

  closeSplash() {
    const overlay = document.getElementById('lauriThaiOverlay');
    if (overlay) overlay.remove();
  }
};

Game.register(LauriThaiMadness);
