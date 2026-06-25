const Economy = {
  minIndex: 0.85,
  maxIndex: 1.40,
  index: null,
  nextShiftDay: null,
  lastSeenDay: 1,
  startingAdjusted: false,
  history: [],

  init() {
    this.normalize();
    this.adjustStartingEuros();

    document.getElementById('moneyMain').insertAdjacentHTML(
      'afterbegin',
      Game.section(
        'Talous',
        'economyContent',
        `
          <p>Eurohinnat ja euromaksut elävät talousindeksin mukana. Ryypyt, apurit ja parannukset eivät.</p>
          <p>Talousindeksi: <strong><span id="economyIndex">100 %</span></strong></p>
          <p>Tila: <strong><span id="economyMood">Tavallinen nihkeys</span></strong></p>
          <p>Seuraava indeksipäivitys: päivä <span id="economyNextDay">-</span></p>
          <div id="economyEffects" class="smallHint"></div>
        `
      )
    );
  },

  normalize() {
    const storedIndex = Number(this.index);
    if (this.index === null || this.index === undefined || this.index === '' || !Number.isFinite(storedIndex)) {
      this.index = Number(Game.randFloat(0.90, 1.22).toFixed(3));
    } else {
      this.index = storedIndex;
    }

    this.index = this.clampIndex(this.index);
    this.lastSeenDay = Number(this.lastSeenDay || Game.state.day || 1);
    this.nextShiftDay = Number(this.nextShiftDay || (Game.state.day + Game.randInt(4, 7)));
    this.startingAdjusted = !!this.startingAdjusted;

    if (!Array.isArray(this.history) || !this.history.length) {
      this.history = [{ day: Game.state.day || 1, index: this.index }];
    }
  },

  clampIndex(value) {
    return Game.clamp(Number(value), this.minIndex, this.maxIndex);
  },

  adjustStartingEuros() {
    const base = Game.config.startingEuros || 200;
    if (this.startingAdjusted) return;
    if (Game.state.day !== 1) return;
    if (Math.abs(Number(Game.state.euros) - base) > 0.001) return;

    const multiplier = 0.75 + this.index * 0.25;
    Game.state.euros = Number((base * multiplier).toFixed(2));
    this.startingAdjusted = true;
  },

  tick() {
    if (Game.state.day === this.lastSeenDay) return;
    this.lastSeenDay = Game.state.day;
    this.onNewDay();
  },

  onNewDay() {
    if (Game.state.day < this.nextShiftDay) return;

    let delta = Game.randFloat(-0.06, 0.08);
    if (Math.random() < 0.18) delta += Game.randFloat(-0.07, 0.10);

    this.index = Number(this.clampIndex(this.index + delta).toFixed(3));
    this.nextShiftDay = Game.state.day + Game.randInt(4, 7);
    this.history.push({ day: Game.state.day, index: this.index });
    this.history = this.history.slice(-20);
  },

  mood() {
    if (this.index <= 0.92) return 'Halpuutuspaniikki';
    if (this.index <= 1.05) return 'Tavallinen nihkeys';
    if (this.index <= 1.20) return 'Hintahumppa';
    if (this.index <= 1.32) return 'Kuitinpolttokausi';
    return 'Indeksihorkka';
  },

  weightedMultiplier(weight) {
    this.normalize();
    return Math.max(0.5, 1 + (this.index - 1) * weight);
  },

  priceMultiplier(kind = 'general') {
    const weights = {
      beer: 1.00,
      market: 0.80,
      general: 1.00
    };
    return this.weightedMultiplier(weights[kind] ?? weights.general);
  },

  paymentMultiplier(kind = 'general') {
    const weights = {
      jobs: 0.70,
      kela: 0.50,
      general: 0.60
    };
    return this.weightedMultiplier(weights[kind] ?? weights.general);
  },

  scalePrice(amount, kind = 'general') {
    return Number((Number(amount) * this.priceMultiplier(kind)).toFixed(2));
  },

  scalePayment(amount, kind = 'general') {
    return Number((Number(amount) * this.paymentMultiplier(kind)).toFixed(2));
  },

  stateForSave() {
    this.normalize();
    return {
      index: this.index,
      nextShiftDay: this.nextShiftDay,
      lastSeenDay: this.lastSeenDay,
      startingAdjusted: this.startingAdjusted,
      history: this.history
    };
  },

  restoreState(data) {
    if (!data) return;
    this.index = Number(data.index);
    this.nextShiftDay = Number(data.nextShiftDay);
    this.lastSeenDay = Number(data.lastSeenDay || Game.state.day || 1);
    this.startingAdjusted = !!data.startingAdjusted;
    this.history = Array.isArray(data.history) ? data.history : [];
    this.normalize();
  },

  render() {
    const index = document.getElementById('economyIndex');
    const mood = document.getElementById('economyMood');
    const nextDay = document.getElementById('economyNextDay');
    const effects = document.getElementById('economyEffects');

    if (!index || !mood || !nextDay || !effects) return;

    index.textContent = `${Math.round(this.index * 100)} %`;
    mood.textContent = this.mood();
    nextDay.textContent = this.nextShiftDay;
    effects.textContent =
      `Olut ${Math.round(this.priceMultiplier('beer') * 100)} %, market ${Math.round(this.priceMultiplier('market') * 100)} %, Kela ${Math.round(this.paymentMultiplier('kela') * 100)} %, pikkukeikat ${Math.round(this.paymentMultiplier('jobs') * 100)} %.`;
  }
};

Game.register(Economy);
