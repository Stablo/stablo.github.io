const SaveLoad = {
  init() {
    document.getElementById('gameMain').insertAdjacentHTML(
      'beforeend',
      Game.section(
        'Tallennus',
        'saveContent',
        `<button onclick="SaveLoad.save()">Tallenna peli</button><button onclick="SaveLoad.load()">Lataa peli</button><button onclick="SaveLoad.reset()">Nollaa peli</button>`
      )
    );
  },

  save() {
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

    localStorage.setItem('villisikaSeppoModularSave', JSON.stringify(data));
    alert('Peli tallennettu!');
  },

  load() {
    const raw = localStorage.getItem('villisikaSeppoModularSave');
    if (!raw) return;

    const data = JSON.parse(raw);
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
  },

  reset() {
    if (!confirm('Haluatko varmasti aloittaa alusta?')) return;
    localStorage.removeItem('villisikaSeppoModularSave');
    location.reload();
  },

  render() {}
};

Game.register(SaveLoad);
