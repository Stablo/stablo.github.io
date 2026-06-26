const Events = {
  cost: 20,
  lastMajorDay: 0,
  levels: {
    small: {
      name: 'Pieni säätö',
      description: 'Halpa pikku outous. Useimmiten tölkkejä, stressiapua tai pikkukolikoita.',
      baseCost: 4,
      scale: 0.015,
      maxCost: 25
    },
    medium: {
      name: 'Kunnon hässäkkä',
      description: 'Selvästi hyödyllisempi, mutta usein pienellä krapula-, stressi- tai vaihtokaupalla.',
      baseCost: 10,
      scale: 0.025,
      maxCost: 55
    },
    major: {
      name: 'Täysi katastrofi',
      description: 'Kerran päivässä tehtävä isompi sekoilu. Voi pelastaa tilanteen, mutta ei ole rahakone.',
      baseCost: 22,
      scale: 0.035,
      maxCost: 90
    }
  },
  pools: {},

  init() {
    this.buildPools();

    document.getElementById('dailyMain').insertAdjacentHTML(
      'beforeend',
      Game.section(
        'Satunnaiset tapahtumat',
        'eventContent',
        `
          <p>Käytä ryyppyjä pienen kaaoksen kutsumiseen. Tapahtumat auttavat arjen sotkuissa, mutta eivät korvaa Pikkukeikkoja.</p>
          <div class="eventChoiceGrid">
            <button id="eventSmallButton" onclick="Events.trigger('small')">
              <strong>Pieni säätö</strong><br>
              <span id="eventSmallCost">0</span> ryyppyä
            </button>
            <button id="eventMediumButton" onclick="Events.trigger('medium')">
              <strong>Kunnon hässäkkä</strong><br>
              <span id="eventMediumCost">0</span> ryyppyä
            </button>
            <button id="eventMajorButton" onclick="Events.trigger('major')">
              <strong>Täysi katastrofi</strong><br>
              <span id="eventMajorCost">0</span> ryyppyä
            </button>
          </div>
          <p id="eventHint" class="smallHint"></p>
          <p id="eventLog">Ei tapahtumia vielä.</p>
        `
      )
    );
  },

  buildPools() {
    this.pools = {
      small: [
        {
          txt: 'Panttipullo toimi oraakkelina. Se neuvoi katsomaan penkin alle.',
          fn: () => {
            const cans = Game.randInt(4, 10);
            Game.state.emptyCans += cans;
            Game.changeStress(-2);
            return [`+${cans} tyhjää tölkkiä`, 'stressi -2'];
          }
        },
        {
          txt: 'Naapurin mystinen eteiskassi sisälsi tölkin ja lapun "älä kysy".',
          fn: () => {
            Game.state.fullCans += 1;
            Game.changeStress(2);
            return ['+1 täysi tölkki', 'stressi +2'];
          }
        },
        {
          txt: 'Kuitista löytyi sivujuoni, jonka joku osti pois vaivaantuneena.',
          fn: () => {
            const euros = this.addEuros(Game.randFloat(1.00, 2.40));
            Game.changeStress(-1);
            return [`+${euros.toFixed(2)} €`, 'stressi -1'];
          }
        },
        {
          txt: 'Pankkiautomaatti sääli sinua ja sylki ulos unohtuneita kolikoita.',
          fn: () => {
            const euros = this.addEuros(Game.randFloat(0.50, 1.80));
            return [`+${euros.toFixed(2)} €`];
          }
        },
        {
          txt: 'Puistonpenkin inventaario paljasti tölkkejä ja yhden huonon päätöksen.',
          fn: () => {
            Game.state.emptyCans += 6;
            Game.changeHangover(2);
            return ['+6 tyhjää tölkkiä', 'krapula +2'];
          }
        },
        {
          txt: 'Kaupan täti nyökkäsi hyväksyvästi. Syytä ei selvinnyt.',
          fn: () => {
            Game.changeStress(-5);
            return ['stressi -5'];
          }
        },
        {
          txt: 'Sukka oli täynnä kolikoita. Toivottavasti se oli sinun sukkasi.',
          fn: () => {
            const euros = this.addEuros(Game.randFloat(1.20, 3.00));
            Game.changeHangover(1);
            return [`+${euros.toFixed(2)} €`, 'krapula +1'];
          }
        },
        {
          txt: 'Tupakkapaikan kansankokous antoi yhden käyttökelpoisen neuvon.',
          fn: () => {
            Game.state.ryypyt += 3;
            Game.changeStress(-3);
            return ['+3 ryyppyä', 'stressi -3'];
          }
        }
      ],
      medium: [
        {
          txt: 'Talkoiden jälkipyykissä kaikki luulivat, että teit paljon.',
          fn: () => {
            const euros = this.addEuros(Game.randFloat(2.00, 4.00));
            Game.changeStress(-2);
            Game.changeHangover(2);
            return [`+${euros.toFixed(2)} €`, 'stressi -2', 'krapula +2'];
          }
        },
        {
          txt: 'Panttijonon ohituslupa syntyi, koska joku luuli sinua henkilökunnaksi.',
          fn: () => this.convertEmptyCans(Game.randInt(5, 12), 0.85, 'heti palautettu'),
        },
        {
          txt: 'Kaverin varma systeemi ei ollut varma, mutta yksi osa toimi.',
          fn: () => {
            const cans = Game.randInt(2, 3);
            Game.state.fullCans += cans;
            Game.changeStress(4);
            return [`+${cans} täyttä tölkkiä`, 'stressi +4'];
          }
        },
        {
          txt: 'Roskakatoksen diplomatia tuotti säkin, jota kukaan ei halunnut nimetä.',
          fn: () => {
            const cans = Game.randInt(10, 18);
            Game.state.emptyCans += cans;
            Game.changeStress(3);
            return [`+${cans} tyhjää tölkkiä`, 'stressi +3'];
          }
        },
        {
          txt: 'Kahviautomaatti teki kompromissin: kahvi ja henkilökohtainen loukkaus.',
          fn: () => {
            this.addMarketItem('Kahvijuoma', 1);
            Game.changeHangover(-3);
            Game.changeStress(3);
            return ['+1 kahvijuoma', 'krapula -3', 'stressi +3'];
          }
        },
        {
          txt: 'Kaljakassi vaihtoi omistajaa kahdesti ja jäi lopulta sinulle.',
          fn: () => {
            const loss = this.loseEuros(Game.randFloat(1.00, 2.00));
            Game.state.fullCans += 2;
            return ['+2 täyttä tölkkiä', `-${loss.toFixed(2)} €`];
          }
        },
        {
          txt: 'Kaveri maksoi velan ryypyissä. Ei kirjanpidollisesti vahva hetki.',
          fn: () => {
            const ryypyt = Game.randInt(12, 24);
            Game.state.ryypyt += ryypyt;
            Game.changeStress(2);
            return [`+${ryypyt} ryyppyä`, 'stressi +2'];
          }
        },
        {
          txt: 'Alelapun pyhä hetki teki banaanista melkein valuuttaa.',
          fn: () => {
            this.addMarketItem('Banaani', 2);
            const euros = this.addEuros(1.00);
            return ['+2 banaania', `+${euros.toFixed(2)} €`];
          }
        }
      ],
      major: [
        {
          txt: 'Säälittävä sankariteko esti tölkkisäkkiä kaatumasta ojaan.',
          fn: () => {
            const cans = Game.randInt(18, 24);
            Game.state.emptyCans += cans;
            Game.changeStress(-4);
            Game.changeHangover(3);
            return [`+${cans} tyhjää tölkkiä`, 'stressi -4', 'krapula +3'];
          }
        },
        {
          txt: 'Päivän paras huono idea toimi juuri sen verran, että siitä tuli vaarallinen ennakkotapaus.',
          fn: () => {
            const euros = this.addEuros(Game.randFloat(1.50, 2.50));
            Game.state.fullCans += 2;
            Game.changeHangover(6);
            return ['+2 täyttä tölkkiä', `+${euros.toFixed(2)} €`, 'krapula +6'];
          }
        },
        {
          txt: 'Panttikeisarin kädenpuristus toi arvostusta väärässä seurassa.',
          fn: () => {
            const ryypyt = Game.randInt(18, 25);
            const cans = Game.randInt(6, 10);
            Game.state.ryypyt += ryypyt;
            Game.state.emptyCans += cans;
            Game.changeStress(-3);
            return [`+${ryypyt} ryyppyä`, `+${cans} tyhjää tölkkiä`, 'stressi -3'];
          }
        },
        {
          txt: 'Lähikaupan myyttinen hävikkihetki osui kohdalle kuin outo siunaus.',
          fn: () => {
            const cans = Game.randInt(1, 2);
            Game.state.fullCans += cans;
            this.addMarketItem('Banaani', 1);
            Game.changeStress(3);
            return [`+${cans} täyttä tölkkiä`, '+1 banaani', 'stressi +3'];
          }
        },
        {
          txt: 'Väärä muuttofirma maksoi väärälle miehelle väärästä laatikosta.',
          fn: () => {
            const euros = this.addEuros(Game.randFloat(4.00, 6.00));
            Game.changeStress(6);
            Game.changeHangover(3);
            return [`+${euros.toFixed(2)} €`, 'stressi +6', 'krapula +3'];
          }
        },
        {
          txt: 'Hätäinen panttidiili toi rahat nopeasti, mutta huonolla kurssilla.',
          fn: () => this.convertEmptyCans(Game.randInt(10, 18), 0.75, 'hätädiili'),
        },
        {
          txt: 'Taloyhtiön legenda tunnisti sinut. Maine kasvoi väärään suuntaan.',
          fn: () => {
            const euros = this.addEuros(Game.randFloat(2.00, 4.00));
            Game.changeStress(4);
            return [`+${euros.toFixed(2)} €`, 'stressi +4'];
          }
        },
        {
          txt: 'Huono idea joka toimi rauhoitti hermot, mutta vei eväistä palan.',
          fn: () => {
            const lost = this.loseRandomMarketItem();
            Game.changeStress(-10);
            Game.changeHangover(4);
            return ['stressi -10', 'krapula +4', lost];
          }
        }
      ]
    };
  },

  costFor(level) {
    const config = this.levels[level] || this.levels.small;
    const ryypyt = Math.max(0, Math.floor(Game.state.ryypyt || 0));
    return Math.min(config.maxCost, config.baseCost + Math.floor(ryypyt * config.scale));
  },

  isMajorAvailable() {
    return this.lastMajorDay !== Game.state.day;
  },

  addEuros(baseAmount) {
    const adjusted = typeof Economy !== 'undefined' ? Economy.scalePayment(baseAmount, 'jobs') : baseAmount;
    const amount = Math.max(0, Number(adjusted));
    Game.state.euros += amount;
    return amount;
  },

  loseEuros(baseAmount) {
    const amount = Math.min(Game.state.euros, Math.max(0, Number(baseAmount)));
    Game.state.euros -= amount;
    return amount;
  },

  addMarketItem(name, amount = 1) {
    if (typeof Supermarket === 'undefined' || !Array.isArray(Supermarket.items)) return false;
    const item = Supermarket.items.find(entry => entry.name === name);
    if (!item) return false;
    item.owned += amount;
    return true;
  },

  loseRandomMarketItem() {
    if (typeof Supermarket === 'undefined' || !Array.isArray(Supermarket.items)) return 'ei eväitä menetetty';
    const owned = Supermarket.items.filter(item => item.owned > 0 && item.type !== 'cigarette');
    if (!owned.length) return 'ei eväitä menetetty';
    const item = owned[Game.randInt(0, owned.length - 1)];
    item.owned--;
    return `-1 ${item.name}`;
  },

  convertEmptyCans(maxCans, valueMultiplier, label) {
    const cans = Math.min(Game.state.emptyCans, maxCans);
    if (cans <= 0) {
      Game.changeStress(-3);
      return [`${label}: ei tölkkejä`, 'stressi -3'];
    }

    const euros = cans * Game.config.canValue * valueMultiplier;
    Game.state.emptyCans -= cans;
    Game.state.euros += euros;
    return [`${label}: -${cans} tyhjää tölkkiä`, `+${euros.toFixed(2)} €`];
  },

  trigger(level = 'small') {
    if (!this.pools[level]) level = 'small';
    if (level === 'major' && !this.isMajorAvailable()) return;

    const cost = this.costFor(level);
    if (Game.state.ryypyt < cost) return;

    Game.state.ryypyt -= cost;
    if (level === 'major') this.lastMajorDay = Game.state.day;

    const pool = this.pools[level];
    const event = pool[Game.randInt(0, pool.length - 1)];
    const changes = event.fn();
    const title = this.levels[level].name;

    Game.state.eventLog = `${title}: ${event.txt} | Maksoit: -${cost} ryyppyä | Muutokset: ${changes.join(', ')}`;

    if (typeof UI !== 'undefined' && typeof UI.announceEvent === 'function') {
      UI.announceEvent(Game.state.eventLog, { sound: true, type: level === 'major' ? 'bad' : 'good' });
    }

    Game.update();
  },

  render() {
    const small = this.costFor('small');
    const medium = this.costFor('medium');
    const major = this.costFor('major');
    const canMajor = this.isMajorAvailable();

    const smallCost = document.getElementById('eventSmallCost');
    const mediumCost = document.getElementById('eventMediumCost');
    const majorCost = document.getElementById('eventMajorCost');
    const smallButton = document.getElementById('eventSmallButton');
    const mediumButton = document.getElementById('eventMediumButton');
    const majorButton = document.getElementById('eventMajorButton');
    const hint = document.getElementById('eventHint');
    const log = document.getElementById('eventLog');

    if (smallCost) smallCost.textContent = small;
    if (mediumCost) mediumCost.textContent = medium;
    if (majorCost) majorCost.textContent = major;
    if (smallButton) smallButton.disabled = Game.state.ryypyt < small;
    if (mediumButton) mediumButton.disabled = Game.state.ryypyt < medium;
    if (majorButton) majorButton.disabled = Game.state.ryypyt < major || !canMajor;
    if (hint) {
      hint.textContent = canMajor
        ? 'Täysi katastrofi on käytettävissä kerran pelipäivässä.'
        : 'Täysi katastrofi on jo käytetty tänään.';
    }
    if (log) log.textContent = Game.state.eventLog;
  }
};

Game.register(Events);
