const SaveLoad = {
  maxScore() {
    return typeof Account !== 'undefined' && Account.maxScore ? Account.maxScore : 1000000000;
  },

  clampNumber(value, min, max, fallback = min) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, number));
  },

  clampInteger(value, min, max, fallback = min) {
    return Math.floor(this.clampNumber(value, min, max, fallback));
  },

  sanitizeSaveData(data) {
    const clean = JSON.parse(JSON.stringify(data || {}));
    clean.state = clean.state || {};

    const s = clean.state;
    const maxScore = this.maxScore();
    const maxResource = 1000000000;

    s.ryypyt = this.clampInteger(s.ryypyt, 0, maxScore, 0);
    s.euros = this.clampNumber(s.euros, 0, maxResource, 0);
    s.oluet = this.clampInteger(s.oluet, 0, maxResource, 0);
    s.fullCans = this.clampInteger(s.fullCans, 0, maxResource, 0);
    s.emptyCans = this.clampInteger(s.emptyCans, 0, maxResource, 0);
    s.ryypytPerOlut = this.clampInteger(s.ryypytPerOlut, 1, 1000000, 1);
    s.manualDrinksForTiiviste = this.clampInteger(s.manualDrinksForTiiviste, 0, 49, 0);
    s.hangover = this.clampNumber(s.hangover, 0, 100, 0);
    s.stress = this.clampNumber(s.stress ?? 0, 0, 100, 0);
    s.cigarettes = this.clampInteger(s.cigarettes, 0, maxResource, 0);
    s.day = this.clampInteger(s.day, 1, maxResource, 1);
    s.dayProgressSeconds = this.clampNumber(s.dayProgressSeconds, 0, 86400, 0);
    s.collapseCount = this.clampInteger(s.collapseCount ?? 0, 0, 3, 0);
    s.gameOver = !!s.gameOver;

    if (typeof s.eventLog !== 'string') s.eventLog = 'Ei tapahtumia vielä.';
    s.eventLog = s.eventLog.slice(0, 600);

    if (clean.helpers) {
      Object.values(clean.helpers).forEach(helper => {
        helper.count = this.clampInteger(helper.count, 0, 1000000, 0);
        helper.cost = this.clampInteger(helper.cost, 1, maxResource, 1);
      });
    }

    if (Array.isArray(clean.marketItems)) {
      clean.marketItems.forEach(item => {
        item.owned = this.clampInteger(item.owned, 0, maxResource, 0);
      });
    }

    if (clean.economy) {
      clean.economy.index = this.clampNumber(clean.economy.index, 0.85, 1.40, 1);
      clean.economy.delta = this.clampNumber(clean.economy.delta, -1, 1, 0);
      clean.economy.source = ['global', 'local'].includes(clean.economy.source) ? clean.economy.source : 'local';
      clean.economy.lastShiftAt = typeof clean.economy.lastShiftAt === 'string' ? clean.economy.lastShiftAt.slice(0, 64) : null;
      clean.economy.nextShiftAt = typeof clean.economy.nextShiftAt === 'string' ? clean.economy.nextShiftAt.slice(0, 64) : null;
      clean.economy.lastFetchAt = typeof clean.economy.lastFetchAt === 'string' ? clean.economy.lastFetchAt.slice(0, 64) : null;
      clean.economy.startingAdjusted = !!clean.economy.startingAdjusted;
      clean.economy.history = Array.isArray(clean.economy.history) ? clean.economy.history.slice(-20) : [];
    }

    return clean;
  },

  getSaveData() {
    const data = {
      state: Game.state,
      helpers: Helpers.helpers,
      beerPackages: BeerShop.packages,
      averagePriceHistory: BeerShop.averagePriceHistory,
      marketItems: Supermarket.items,
      economy: typeof Economy !== 'undefined' ? Economy.stateForSave() : null,
      kelaBenefits: Kela.benefits,
      kelaActive: Kela.activeProblem,
      eventCost: Events.cost,
      jobs: Jobs.jobs,
      cooldowns: Jobs.cooldowns,
      returnsCooldown: Returns.puulantoriCooldown,
      upgradesPurchased: typeof Upgrades !== 'undefined' ? Upgrades.purchased : {},
      gamblingBet: typeof Gambling !== 'undefined' ? Gambling.bet : 25,
      gamblingLog: typeof Gambling !== 'undefined' ? Gambling.log : ''
    };

    return this.sanitizeSaveData(data);
  },

  restoreData(data) {
    if (!data) return false;
    data = this.sanitizeSaveData(data);

    Object.assign(Game.state, data.state || {});

    if (data.helpers) {
      Helpers.helpers = data.helpers;
      if (typeof Helpers.normalize === 'function') Helpers.normalize();
    }
    if (data.beerPackages) BeerShop.packages = data.beerPackages;
    if (data.averagePriceHistory) BeerShop.averagePriceHistory = data.averagePriceHistory;
    if (data.marketItems) data.marketItems.forEach((item, i) => {
      if (Supermarket.items[i]) Supermarket.items[i].owned = item.owned ?? 0;
    });
    if (typeof Economy !== 'undefined') Economy.restoreState(data.economy);
    if (data.kelaBenefits) Kela.benefits = data.kelaBenefits;
    Kela.activeProblem = data.kelaActive ?? null;
    Events.cost = data.eventCost ?? 20;
    if (data.jobs) Jobs.jobs = data.jobs;
    if (data.cooldowns) Jobs.cooldowns = data.cooldowns;
    Returns.puulantoriCooldown = data.returnsCooldown ?? 0;

    if (typeof Upgrades !== 'undefined' && data.upgradesPurchased) {
      Upgrades.purchased = data.upgradesPurchased;
      Upgrades.items.forEach(item => {
        if (Upgrades.purchased[item.id] === undefined) Upgrades.purchased[item.id] = false;
      });
    }

    if (typeof Gambling !== 'undefined') {
      Gambling.bet = data.gamblingBet ?? 25;
      Gambling.log = data.gamblingLog || Gambling.log;
    }

    Game.update();
    return true;
  },

  report(message) {
    const status = document.getElementById('saveStatus');
    if (status) status.textContent = message;
  },

  async save() {
    if (typeof Account === 'undefined' || !Account.client) {
      this.report('Pilvitallennus ei ole käytettävissä.');
      return false;
    }

    const ok = await Account.cloudSave();
    this.report(Account.message);
    return ok;
  },

  async load() {
    if (typeof Account === 'undefined' || !Account.client) {
      this.report('Pilvitallennus ei ole käytettävissä.');
      return false;
    }

    const ok = await Account.cloudLoad();
    this.report(Account.message);
    return ok;
  },

  reset() {
    if (!confirm('Aloitetaanko nykyinen selainistunto alusta tallentamatta sitä pilveen?')) return;
    location.reload();
  }
};
