const Game = {
  version: "0.3.3-theme-stress-navorder",
  modules: [],
  config: {
    canValue: 0.20,
    baseSecondsPerDay: 15,
    priceChangeIntervalDays: 7
  },
  state: {
    ryypyt: 0,
    euros: 200,
    oluet: 0,
    fullCans: 0,
    emptyCans: 0,
    ryypytPerOlut: 1,
    hangover: 0,
    stress: 0,
    cigarettes: 0,
    day: 1,
    dayProgressSeconds: 0,
    eventLog: "Ei tapahtumia vielä."
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
    this.modules.forEach(module => module.tick && module.tick());
    this.update();
  },
  update() {
    this.modules.forEach(module => module.render && module.render());
    UI.renderStats();
  }
};
