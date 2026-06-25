const BeerShop = {
  brands: [
    { name: 'Karhu III', single: 1.45 },
    { name: 'Karjala III', single: 1.35 },
    { name: 'Koff', single: 1.30 },
    { name: 'Lapin Kulta', single: 1.55 },
    { name: 'Olvi III', single: 1.25 },
    { name: 'Sandels', single: 1.60 },
    { name: 'Lahden Erikois', single: 1.70 },
    { name: 'Aura', single: 1.40 }
  ],
  packages: [],
  averagePriceHistory: [],

  init() {
    this.createPackages();
    this.averagePriceHistory = [this.getAveragePricePerCan()];
    document.getElementById('gameMain').insertAdjacentHTML(
      'beforeend',
      Game.section(
        'Olutkauppa',
        'beerShopContent',
        `
          <p>Hinnat muuttuvat 7 päivän välein.</p>
          <p id="beerUpgradeHint"></p>
          <h3>Keskihinta / tölkki</h3>
          <canvas id="averagePriceGraph" width="260" height="80"></canvas>
          <div id="beerShopList"></div>
        `
      )
    );
  },

  priceMultiplier() {
    return typeof Upgrades !== 'undefined' ? Upgrades.beerDiscountMultiplier() : 1;
  },

  displayPrice(pack) {
    return Number((pack.currentPrice * this.priceMultiplier()).toFixed(2));
  },

  createPackages() {
    this.packages = [];
    const packageDiscounts = { 1: 1, 6: .88, 12: .80, 24: .72 };
    this.brands.forEach(brand => [1, 6, 12, 24].forEach(cans => {
      const discount = packageDiscounts[cans] ?? 1;
      const basePrice = Number((brand.single * cans * discount).toFixed(2));
      this.packages.push({
        name: brand.name,
        size: cans === 1 ? '1 tölkki' : cans + '-pack',
        cans,
        basePrice,
        currentPrice: basePrice,
        history: [basePrice]
      });
    }));
  },

  getAveragePricePerCan() {
    let total = 0;
    this.packages.forEach(pack => total += pack.currentPrice / pack.cans);
    return total / this.packages.length;
  },

  getCheapestCanPrice() {
    let cheapest = Infinity;
    this.packages.forEach(pack => {
      const perCan = this.displayPrice(pack) / pack.cans;
      if (perCan < cheapest) cheapest = perCan;
    });
    return cheapest === Infinity ? 0 : cheapest;
  },

  updatePrices() {
    this.packages.forEach(pack => {
      let multiplier = pack.cans === 1 ? Game.randFloat(.75, 1.45) : pack.cans === 6 ? Game.randFloat(.72, 1.35) : Game.randFloat(.70, 1.30);
      if (Math.random() < .12 && pack.cans > 1) multiplier += Game.randFloat(.10, .28);
      pack.currentPrice = Math.max(.50, Number((pack.basePrice * multiplier).toFixed(2)));
      pack.history.push(pack.currentPrice);
    });
    this.averagePriceHistory.push(this.getAveragePricePerCan());
  },

  buy(index) {
    const pack = this.packages[index];
    const price = this.displayPrice(pack);
    const s = Game.state;
    if (s.euros < price) return;
    s.euros -= price;
    s.fullCans += pack.cans;
    Game.update();
  },

  drawGraph(id, values) {
    const canvas = document.getElementById(id);
    if (!canvas || !values.length) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(0, h - 16);
    ctx.lineTo(w, h - 16);
    ctx.stroke();

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach((value, i) => {
      const x = values.length === 1 ? 8 : 8 + i * ((w - 16) / (values.length - 1));
      const y = 8 + (1 - (value - min) / range) * (h - 30);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#aaa';
    ctx.font = '10px monospace';
    ctx.fillText(min.toFixed(2) + '€', 4, h - 3);
    ctx.fillText(max.toFixed(2) + '€', 4, 11);
  },

  render() {
    const list = document.getElementById('beerShopList');
    if (!list) return;

    const hint = document.getElementById('beerUpgradeHint');
    if (hint) {
      hint.textContent = this.priceMultiplier() < 1 ? 'Alehaukan muistivihko: olutostokset -2 %.' : '';
    }

    list.innerHTML = '';
    this.brands.forEach((brand, brandIndex) => {
      const matching = this.packages.map((pack, index) => ({ ...pack, index })).filter(pack => pack.name === brand.name);
      let buttons = '';

      matching.forEach(pack => {
        const price = this.displayPrice(pack);
        buttons += `
          <button onclick="BeerShop.buy(${pack.index})" ${Game.state.euros < price ? 'disabled' : ''}>
            ${pack.size}: ${price.toFixed(2)} €<br>${(price / pack.cans).toFixed(2)} €/tlk
          </button>
        `;
      });

      const div = document.createElement('div');
      div.className = 'beerRow';
      div.innerHTML = `<div><strong>${brand.name}</strong></div><div class="packButtons">${buttons}</div><div><canvas id="beerGraph${brandIndex}" width="250" height="60"></canvas></div>`;
      list.appendChild(div);

      const history = [];
      for (let i = 0; i < matching[0].history.length; i++) {
        let sum = 0;
        let count = 0;
        matching.forEach(pack => {
          if (pack.history[i] !== undefined) {
            sum += pack.history[i] / pack.cans;
            count++;
          }
        });
        history.push(sum / count);
      }
      this.drawGraph('beerGraph' + brandIndex, history);
    });

    this.drawGraph('averagePriceGraph', this.averagePriceHistory);
  }
};

Game.register(BeerShop);
