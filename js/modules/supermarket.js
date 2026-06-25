const Supermarket = {
  items: [
    { name: 'Banaani', price: .30, owned: 0, type: 'food' },
    { name: 'Kivennäisvesi 0,5 l', price: 1.25, owned: 0, type: 'drink' },
    { name: 'Coca-Cola 0,5 l', price: 2.35, owned: 0, type: 'drink' },
    { name: 'Battery energiajuoma 0,33 l', price: 2.99, owned: 0, type: 'drink' },
    { name: 'Mikropizza', price: 2.89, owned: 0, type: 'food' },
    { name: 'Sipsipussi 175 g', price: 2.49, owned: 0, type: 'food' },
    { name: 'Ruisleipä', price: 1.79, owned: 0, type: 'food' },
    { name: 'Lenkkimakkara', price: 3.29, owned: 0, type: 'food' },
    { name: 'Kahvijuoma', price: 2.19, owned: 0, type: 'drink' },
    { name: 'Tupakka-aski', price: 9.50, owned: 0, type: 'cigarette' }
  ],

  init() {
    document.getElementById('moneyMain').insertAdjacentHTML(
      'beforeend',
      Game.section(
        'Supermarket',
        'marketContent',
        `
          <p>Kaikki tuotteet vähentävät krapulaa. Parannusteho seuraa tuotteen perushintaa.</p>
          <div id="marketList"></div>
        `
      )
    );
  },

  displayPrice(item) {
    const economy = typeof Economy !== 'undefined' ? Economy.priceMultiplier('market') : 1;
    return Number((item.price * economy).toFixed(2));
  },

  healing(item) {
    return Math.max(1, Math.round(item.price * 3));
  },

  buy(index) {
    const item = this.items[index];
    const price = this.displayPrice(item);
    const s = Game.state;
    if (s.euros < price) return;

    s.euros -= price;
    item.owned++;
    if (item.type === 'cigarette') s.cigarettes++;
    Game.update();
  },

  use(index) {
    const item = this.items[index];
    const s = Game.state;
    if (item.owned <= 0) return;

    item.owned--;
    if (item.type === 'cigarette') s.cigarettes = Math.max(0, s.cigarettes - 1);

    const heal = Math.max(1, this.healing(item) - (typeof Stress !== 'undefined' ? Stress.healingPenalty() : 0));
    Game.changeHangover(-heal);
    if (typeof Stress !== 'undefined') Game.changeStress(-Math.max(1, Math.ceil(item.price)));
    Game.update();
  },

  smokeCigarette() {
    const index = this.items.findIndex(item => item.type === 'cigarette');
    if (Game.state.cigarettes <= 0) return;
    this.use(index);
  },

  render() {
    const list = document.getElementById('marketList');
    if (!list) return;

    list.innerHTML = '';
    this.items.forEach((item, index) => {
      const price = this.displayPrice(item);
      const div = document.createElement('div');
      div.className = 'marketRow';
      div.innerHTML = `
        <div><strong>${item.name}</strong><br>${price.toFixed(2)} €</div>
        <div>
          Omistat: ${item.owned}<br>
          Krapula -${Math.max(1, this.healing(item) - (typeof Stress !== 'undefined' ? Stress.healingPenalty() : 0))}<br>
          Stressi -${Math.max(1, Math.ceil(item.price))}
        </div>
        <div>
          <button onclick="Supermarket.buy(${index})" ${Game.state.euros < price ? 'disabled' : ''}>Osta</button>
          <button onclick="Supermarket.use(${index})" ${item.owned <= 0 ? 'disabled' : ''}>Käytä</button>
        </div>
      `;
      list.appendChild(div);
    });
  }
};

Game.register(Supermarket);
