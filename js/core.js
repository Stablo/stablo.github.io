const Game = {
  version: "0.4.21-pikatilastot",
  modules: [],
  config: {
    canValue: 0.20,
    baseSecondsPerDay: 15,
    priceChangeIntervalDays: 7,
    startingEuros: 200,
    soundVolume: 0.50
  },
  state: {
    ryypyt: 0,
    euros: 200,
    oluet: 0,
    fullCans: 0,
    emptyCans: 0,
    ryypytPerOlut: 1,
    manualDrinksForTiiviste: 0,
    hangover: 0,
    stress: 0,
    cigarettes: 0,
    day: 1,
    dayProgressSeconds: 0,
    eventLog: "Ei tapahtumia vielä.",
    collapseCount: 0,
    lastCollapseDay: null,
    gameOver: false
  },
  register(module) {
    this.modules.push(module);
  },
  section(title, id, html) {
    return `
      <section class="box" id="section-${id}">
        <div class="sectionHeader" onclick="UI.toggleSection('${id}')">
          <h2>${title}</h2>
          <button id="${id}Toggle">Piilota</button>
        </div>
        <div class="sectionContent" id="${id}">${html}</div>
      </section>
    `;
  },
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  randFloat(min, max) {
    return Math.random() * (max - min) + min;
  },
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },
  changeHangover(amount) {
    this.state.hangover = this.clamp(this.state.hangover + amount, 0, 100);
  },
  changeStress(amount) {
    this.state.stress = this.clamp((this.state.stress ?? 0) + amount, 0, 100);
  },
  getSlowdownPercent() {
    return Math.min(99, Math.floor(this.state.hangover));
  },
  getEffectiveSecondsPerDay() {
    return this.config.baseSecondsPerDay * (1 + this.getSlowdownPercent() / 100);
  },
  init() {
    this.modules.forEach(module => module.init && module.init());
    UI.init();
    this.update();
    setInterval(() => this.tick(), 1000);
  },
  tick() {
    if (this.state.gameOver) {
      this.update();
      return;
    }
    for (const module of this.modules) {
      if (module.tick) module.tick();
      if (this.state.gameOver) break;
    }
    this.update();
  },
  update() {
    this.modules.forEach(module => module.render && module.render());
    UI.renderStats();
    if (typeof SaveLoad !== 'undefined' && SaveLoad.requestAutoSave) {
      SaveLoad.requestAutoSave('update');
    }
  }
};
