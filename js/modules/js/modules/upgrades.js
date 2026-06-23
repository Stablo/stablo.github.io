const Upgrades = {
  purchased: {},
  items: [
    {
      id: 'terasmaksanTiiviste',
      name: 'Teräsmaksan kunnollinen tiiviste',
      cost: 650,
      effect: 'Joka 50. itse juotu olut nostaa pysyvästi ryyppyjä per olut +1.'
    },
    {
      id: 'alehaukanMuistivihko',
      name: 'Alehaukan kuiva muistivihko',
      cost: 900,
      effect: 'Olutkaupan hinnat ovat pysyvästi 8 % halvempia.'
    },
    {
      id: 'panttinenanKalibrointi',
      name: 'Panttinenän täyskalibrointi',
      cost: 1050,
      effect: 'Puulantorin tölkki liikkuu 20 % hitaammin ja hutiklikin lukko on 12 s.'
    },
    {
      id: 'virastovaisto',
      name: 'Virastovaisto ja varakynä',
      cost: 1400,
      effect: 'Uusissa Kela-ongelmissa on kaksi lomaketta vähemmän.'
    },
    {
      id: 'keikkamuisti',
      name: 'Keikkamuistin solmittu narunpätkä',
      cost: 1600,
      effect: 'Stressin aiheuttama pikkukeikkojen aikarangaistus pienenee selvästi.'
    },
    {
      id: 'hiljainenPaa',
      name: 'Hiljainen pää ja toimiva pipo',
      cost: 1900,
      effect: 'Päivittäinen stressin nousu pienenee kolmella pisteellä.'
    },
    {
      id: 'mestariJattiPienet',
      name: 'Mestari jätti pienet',
      cost: 1250,
      effect: 'Lauri vahvistuu: jokainen Lauri juo 6 tölkkiä päivässä tavallisen 3 sijaan.'
    },
    {
      id: 'eiKyllaLahtenNytKotia',
      name: 'Ei kyllä mä lähen nyt kotia',
      cost: 1700,
      effect: 'Jarski säästää varastoa: hän juo vain 15 tölkkiä, mutta tuottaa silti 20 tölkin ryyppytuloksen.'
    },
    {
      id: 'naaOnNaita',
      name: 'Nää on näitä',
      cost: 1450,
      effect: 'Tuomas paranee vähän: hänen ryyppypalautuksensa ovat 50 %, 80 % tai 105 % aiemman 45 %, 75 % tai 100 % sijaan.'
    },
    {
      id: 'apurienKuiskaaja',
      name: 'Apurien oikea kuiskaaja',
      cost: 2300,
      effect: 'Apurit tuottavat +1 bonusryypyn jokaista 15 juomaansa tölkkiä kohti.'
    },
    {
      id: 'krapulakalenteri',
      name: 'Krapulakalenteri vuodelta 1997, ehjillä sivuilla',
      cost: 2800,
      effect: 'Uusi päivä lisää krapulaa 3 pistettä tavallisen 5 pisteen sijaan.'
    }
  ],

  init() {
    this.items.forEach(item => {
      if (this.purchased[item.id] === undefined) this.purchased[item.id] = false;
    });

    if (Game.state.manualDrinksForTiiviste === undefined) {
      Game.state.manualDrinksForTiiviste = 0;
    }

    document.getElementById('upgradesMain').insertAdjacentHTML(
      'beforeend',
      Game.section(
        'Pysyvät parannukset',
        'upgradesContent',
        `
          <p>
            Käytä ryyppyjä pysyviin parannuksiin. Nämä ovat kalliita, mutta ne muuttavat pitkän pelin rytmiä.
          </p>
          <p>Nykyiset ryypyt: <strong><span id="upgradeRyypyt">0</span></strong></p>
          <div id="upgradeList" class="upgradeGrid"></div>
        `
      )
    );
  },

  has(id) {
    return !!this.purchased[id];
  },

  buy(id) {
    const item = this.items.find(x => x.id === id);
    if (!item || this.has(id)) return;
    if (Game.state.ryypyt < item.cost) return;

    Game.state.ryypyt -= item.cost;
    this.purchased[item.id] = true;
    if (item.id === 'terasmaksanTiiviste' && Game.state.manualDrinksForTiiviste === undefined) {
      Game.state.manualDrinksForTiiviste = 0;
    }
    Game.state.eventLog = `Pysyvä parannus ostettu: ${item.name}.`;
    Game.update();
  },

  beerDiscountMultiplier() {
    return this.has('alehaukanMuistivihko') ? 0.92 : 1;
  },

  beerBonusForDrink() {
    return 0;
  },

  processManualDrink() {
    if (!this.has('terasmaksanTiiviste')) return;

    if (Game.state.manualDrinksForTiiviste === undefined) {
      Game.state.manualDrinksForTiiviste = 0;
    }

    Game.state.manualDrinksForTiiviste++;

    if (Game.state.manualDrinksForTiiviste >= 50) {
      Game.state.manualDrinksForTiiviste -= 50;
      Game.state.ryypytPerOlut += 1;
      Game.state.eventLog = `Teräsmaksan kunnollinen tiiviste napsahti: ryypyt per olut +1 pysyvästi.`;
    }
  },

  tiivisteProgressText() {
    if (!this.has('terasmaksanTiiviste')) return '';
    const progress = Game.state.manualDrinksForTiiviste ?? 0;
    return `<p class="upgradeOwned">Edistyminen seuraavaan +1: ${progress}/50 itse juotua olutta.</p>`;
  },

  puulantoriSpeedMultiplier() {
    return this.has('panttinenanKalibrointi') ? 0.80 : 1;
  },

  puulantoriCooldownSeconds() {
    return this.has('panttinenanKalibrointi') ? 12 : 20;
  },

  kelaFormReduction() {
    return this.has('virastovaisto') ? 2 : 0;
  },

  jobStressTimeDiscount() {
    return this.has('keikkamuisti') ? 0.75 : 0;
  },

  dailyStressReduction() {
    return this.has('hiljainenPaa') ? 3 : 0;
  },

  helperBonusRyypyt(drunkCans) {
    return this.has('apurienKuiskaaja') ? Math.floor(drunkCans / 15) : 0;
  },

  dailyHangoverGain() {
    return this.has('krapulakalenteri') ? 3 : 5;
  },

  render() {
    const value = document.getElementById('upgradeRyypyt');
    const list = document.getElementById('upgradeList');
    if (!value || !list) return;

    value.textContent = Math.floor(Game.state.ryypyt);
    list.innerHTML = '';

    this.items.forEach(item => {
      const owned = this.has(item.id);
      const card = document.createElement('div');
      card.className = 'upgradeCard';
      card.innerHTML = `
        <h3>${item.name}</h3>
        <p>${item.effect}</p>
        <p>Hinta: <strong>${item.cost}</strong> ryyppyä</p>
        <button onclick="Upgrades.buy('${item.id}')" ${owned || Game.state.ryypyt < item.cost ? 'disabled' : ''}>
          ${owned ? 'Ostettu' : 'Osta parannus'}
        </button>
        ${owned ? '<p class="upgradeOwned">Pysyvä vaikutus käytössä.</p>' : ''}
        ${item.id === 'terasmaksanTiiviste' ? this.tiivisteProgressText() : ''}
      `;
      list.appendChild(card);
    });
  }
};

Game.register(Upgrades);
