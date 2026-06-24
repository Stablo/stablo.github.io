const SaveLoad = {
  getSaveData() {
    const data = {
      state: Game.state,
      helpers: Helpers.helpers,
      beerPackages: BeerShop.packages,
      averagePriceHistory: BeerShop.averagePriceHistory,
      marketItems: Supermarket.items,
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

    return JSON.parse(JSON.stringify(data));
  },

  restoreData(data) {
    if (!data) return false;

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
