const Helpers = {
  defaults: {
    lauri: {
      count: 0,
      cost: 15,
      costMultiplier: 1.5
    },
    jarski: {
      count: 0,
      cost: 100,
      costMultiplier: 1.6
    },
    tuomas: {
      count: 0,
      cost: 35,
      costMultiplier: 2.35
    }
  },

  helpers: null,
  lastTuomasReport: 'Tuomas ei ole vielä ehtinyt selitellä mitään.',

  init() {
    this.normalize();

    document.getElementById('gameMain').insertAdjacentHTML(
      'beforeend',
      Game.section(
        'Apurit',
        'helpersContent',
        `
          <button id="lauriButton" onclick="Helpers.buy('lauri')">
            Osta Lauri — Hinta: <span id="lauriCost">15</span> ryyppyä
          </button>
          <p id="lauriDescription">Lauri juo 3 täyttä tölkkiä per päivä.</p>
          <p>Laurit: <span id="lauris">0</span></p>

          <hr>

          <button id="jarskiButton" onclick="Helpers.buy('jarski')">
            Osta Jarski — Hinta: <span id="jarskiCost">100</span> ryyppyä
          </button>
          <p id="jarskiDescription">Jarski juo 20 täyttä tölkkiä per päivä ja tuottaa 20 tölkin ryyppytuloksen.</p>
          <p>Jarskit: <span id="jarskis">0</span></p>

          <hr>

          <button id="tuomasButton" onclick="Helpers.buy('tuomas')">
            Osta Tuomas — Hinta: <span id="tuomasCost">35</span> ryyppyä
          </button>
          <p id="tuomasDescription">
            Tuomas on halpa mutta arvaamaton: hän juo joka päivä satunnaisen osuuden täysistä tölkeistäsi
            ja palauttaa siitä vain 45 %, 75 % tai 100 % ryyppyinä.
          </p>
          <p>Tuomakset: <span id="tuomakset">0</span></p>
          <p id="tuomasReport" class="smallHint">Tuomas ei ole vielä ehtinyt selitellä mitään.</p>

          <hr>

          <p>Varma tölkkikulutus per päivä: <span id="fixedCansPerDay">0</span></p>
          <p>Tuomas-arvio tänään: <span id="tuomasEstimate">0</span> tölkkiä</p>
          <p>Apurien arvioitu tölkkikulutus per päivä: <span id="cansPerDay">0</span></p>
          <p>Arvioitu ryyppytuotto per päivä: <span id="ryypytPerDay">0</span></p>
          <p>Arvioitu ryyppytuotto per minuutti: <span id="ryypytPerMinute">0</span></p>
        `
      )
    );
  },

  normalize() {
    const current = this.helpers || {};
    const normalized = {};

    Object.keys(this.defaults).forEach(key => {
      normalized[key] = {
        ...this.defaults[key],
        ...(current[key] || {})
      };
    });

    this.helpers = normalized;
  },

  buy(type) {
    this.normalize();
    const h = this.helpers[type];
    const s = Game.state;
    if (!h) return;

    if (s.ryypyt >= h.cost) {
      s.ryypyt -= h.cost;
      h.count++;
      h.cost = Math.floor(h.cost * h.costMultiplier);
      Game.state.eventLog = `Apuri palkattu: ${this.helperName(type)} liittyi epämääräiseen organisaatioon.`;
      Game.update();
    }
  },

  helperName(type) {
    return type === 'lauri' ? 'Lauri' : type === 'jarski' ? 'Jarski' : 'Tuomas';
  },

  lauriDrinksPerHelper() {
    return typeof Upgrades !== 'undefined' && Upgrades.has('mestariJattiPienet') ? 6 : 3;
  },

  jarskiDrinksPerHelper() {
    return typeof Upgrades !== 'undefined' && Upgrades.has('eiKyllaLahtenNytKotia') ? 15 : 20;
  },

  jarskiOutputPerHelper() {
    return 20;
  },

  tuomasRewardRates() {
    return typeof Upgrades !== 'undefined' && Upgrades.has('naaOnNaita')
      ? [0.50, 0.80, 1.05]
      : [0.45, 0.75, 1.00];
  },

  randomTuomasPercent() {
    return Game.randInt(6, 18) / 100;
  },

  averageTuomasPercent() {
    return 0.12;
  },

  averageTuomasRewardRate() {
    const rates = this.tuomasRewardRates();
    return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  },

  getFixedHelperDrinksPerDay() {
    this.normalize();
    return this.helpers.lauri.count * this.lauriDrinksPerHelper()
      + this.helpers.jarski.count * this.jarskiDrinksPerHelper();
  },

  getTuomasEstimatedDrinksPerDay() {
    this.normalize();
    const s = Game.state;
    if (this.helpers.tuomas.count <= 0 || s.fullCans <= 0) return 0;

    const estimated = this.helpers.tuomas.count * s.fullCans * this.averageTuomasPercent();
    return Math.min(s.fullCans, Math.max(0, Math.round(estimated)));
  },

  getHelperDrinksPerDay() {
    return this.getFixedHelperDrinksPerDay() + this.getTuomasEstimatedDrinksPerDay();
  },

  getFixedRyypytPerDay() {
    this.normalize();
    const s = Game.state;
    const lauriOutput = this.helpers.lauri.count * this.lauriDrinksPerHelper() * s.ryypytPerOlut;
    const jarskiOutput = this.helpers.jarski.count * this.jarskiOutputPerHelper() * s.ryypytPerOlut;
    return lauriOutput + jarskiOutput;
  },

  getTuomasEstimatedRyypytPerDay() {
    const estimatedDrinks = this.getTuomasEstimatedDrinksPerDay();
    return Math.round(estimatedDrinks * this.averageTuomasRewardRate() * Game.state.ryypytPerOlut);
  },

  getRyypytPerDay() {
    return Math.floor(this.getFixedRyypytPerDay() + this.getTuomasEstimatedRyypytPerDay());
  },

  getRyypytPerMinute() {
    return this.getRyypytPerDay() * (60 / Game.getEffectiveSecondsPerDay());
  },

  getTotalHelpers() {
    this.normalize();
    return this.helpers.lauri.count + this.helpers.jarski.count + this.helpers.tuomas.count;
  },

  processDay() {
    this.normalize();
    const s = Game.state;
    const startFullCans = s.fullCans;

    let totalDrunk = 0;
    let totalRyypyt = 0;
    let tuomasDrunk = 0;
    let tuomasRyypyt = 0;
    const tuomasParts = [];

    for (let i = 0; i < this.helpers.tuomas.count; i++) {
      if (s.fullCans <= 0 || startFullCans <= 0) break;

      const percent = this.randomTuomasPercent();
      const wanted = Math.max(1, Math.ceil(startFullCans * percent));
      const drunk = Math.min(s.fullCans, wanted);
      const rates = this.tuomasRewardRates();
      const rate = rates[Game.randInt(0, rates.length - 1)];
      const ryypyt = Math.round(drunk * rate * s.ryypytPerOlut);

      s.fullCans -= drunk;
      s.emptyCans += drunk;
      s.oluet += drunk;
      s.ryypyt += ryypyt;

      tuomasDrunk += drunk;
      tuomasRyypyt += ryypyt;
      totalDrunk += drunk;
      totalRyypyt += ryypyt;
      tuomasParts.push(`${Math.round(percent * 100)} % → ${drunk} tölkkiä, ${Math.round(rate * 100)} % → ${ryypyt} ryyppyä`);
    }

    const lauriWanted = this.helpers.lauri.count * this.lauriDrinksPerHelper();
    const lauriDrunk = Math.min(s.fullCans, lauriWanted);
    if (lauriDrunk > 0) {
      const lauriRyypyt = lauriDrunk * s.ryypytPerOlut;
      s.fullCans -= lauriDrunk;
      s.emptyCans += lauriDrunk;
      s.oluet += lauriDrunk;
      s.ryypyt += lauriRyypyt;
      totalDrunk += lauriDrunk;
      totalRyypyt += lauriRyypyt;
    }

    const jarskiWanted = this.helpers.jarski.count * this.jarskiDrinksPerHelper();
    const jarskiDrunk = Math.min(s.fullCans, jarskiWanted);
    if (jarskiDrunk > 0) {
      const perJarskiDrinkDemand = this.jarskiDrinksPerHelper();
      const perJarskiOutput = this.jarskiOutputPerHelper();
      let jarskiOutputUnits = 0;

      if (perJarskiDrinkDemand > 0) {
        jarskiOutputUnits = jarskiDrunk * (perJarskiOutput / perJarskiDrinkDemand);
      }

      const jarskiRyypyt = Math.floor(jarskiOutputUnits * s.ryypytPerOlut);
      s.fullCans -= jarskiDrunk;
      s.emptyCans += jarskiDrunk;
      s.oluet += jarskiDrunk;
      s.ryypyt += jarskiRyypyt;
      totalDrunk += jarskiDrunk;
      totalRyypyt += jarskiRyypyt;
    }

    const bonus = typeof Upgrades !== 'undefined' ? Upgrades.helperBonusRyypyt(totalDrunk) : 0;
    if (bonus > 0) {
      s.ryypyt += bonus;
      totalRyypyt += bonus;
    }

    if (tuomasDrunk > 0) {
      this.lastTuomasReport = `Tuomas raportti: ${tuomasDrunk} tölkkiä katosi, ${tuomasRyypyt} ryyppyä tuli takaisin. ${tuomasParts.join(' | ')}.`;
    } else if (this.helpers.tuomas.count > 0) {
      this.lastTuomasReport = 'Tuomas raportti: ei täysiä tölkkejä, joten Tuomas vain seisoi eteisessä ja huokaili.';
    } else {
      this.lastTuomasReport = 'Tuomas ei ole vielä ehtinyt selitellä mitään.';
    }

    if (totalDrunk > 0 && tuomasDrunk > 0) {
      s.eventLog = `${this.lastTuomasReport} Päivän apurisaalis yhteensä: ${totalDrunk} tölkkiä ja ${Math.floor(totalRyypyt)} ryyppyä.`;
    }
  },

  render() {
    this.normalize();
    const s = Game.state;

    document.getElementById('lauris').textContent = this.helpers.lauri.count;
    document.getElementById('lauriCost').textContent = this.helpers.lauri.cost;
    document.getElementById('jarskis').textContent = this.helpers.jarski.count;
    document.getElementById('jarskiCost').textContent = this.helpers.jarski.cost;
    document.getElementById('tuomakset').textContent = this.helpers.tuomas.count;
    document.getElementById('tuomasCost').textContent = this.helpers.tuomas.cost;

    document.getElementById('lauriDescription').textContent =
      this.lauriDrinksPerHelper() === 6
        ? 'Lauri on päivitetty: hän juo 6 täyttä tölkkiä per päivä.'
        : 'Lauri juo 3 täyttä tölkkiä per päivä.';

    document.getElementById('jarskiDescription').textContent =
      this.jarskiDrinksPerHelper() === 15
        ? 'Jarski on päivitetty: hän juo vain 15 tölkkiä, mutta tuottaa silti 20 tölkin ryyppytuloksen.'
        : 'Jarski juo 20 täyttä tölkkiä per päivä ja tuottaa 20 tölkin ryyppytuloksen.';

    document.getElementById('tuomasDescription').textContent =
      this.tuomasRewardRates().includes(1.05)
        ? 'Tuomas on päivitetty: hän juo satunnaisen osuuden täysistä tölkeistäsi ja palauttaa siitä 50 %, 80 % tai 105 % ryyppyinä.'
        : 'Tuomas on halpa mutta arvaamaton: hän juo joka päivä satunnaisen osuuden täysistä tölkeistäsi ja palauttaa siitä vain 45 %, 75 % tai 100 % ryyppyinä.';

    document.getElementById('tuomasReport').textContent = this.lastTuomasReport;
    document.getElementById('fixedCansPerDay').textContent = this.getFixedHelperDrinksPerDay();
    document.getElementById('tuomasEstimate').textContent = this.getTuomasEstimatedDrinksPerDay();
    document.getElementById('cansPerDay').textContent = this.getHelperDrinksPerDay();
    document.getElementById('ryypytPerDay').textContent = this.getRyypytPerDay();
    document.getElementById('ryypytPerMinute').textContent = this.getRyypytPerMinute().toFixed(1);

    document.getElementById('lauriButton').disabled = s.ryypyt < this.helpers.lauri.cost;
    document.getElementById('jarskiButton').disabled = s.ryypyt < this.helpers.jarski.cost;
    document.getElementById('tuomasButton').disabled = s.ryypyt < this.helpers.tuomas.cost;
  }
};

Helpers.normalize();
Game.register(Helpers);
