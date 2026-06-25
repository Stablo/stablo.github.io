const Events = {
  cost: 20,
  positive: [],
  negative: [],

  init() {
    this.positive = [
      {
        txt: 'Heräsit ostoskärrystä, joka oli täynnä panttitölkkejä.',
        fn: () => {
          Game.state.emptyCans += 30;
          return ['+30 tyhjää tölkkiä'];
        }
      },
      {
        txt: 'Löysit takin taskusta vanhan veikkausvoiton.',
        fn: () => {
          Game.state.euros += 75;
          return ['+75.00 €'];
        }
      },
      {
        txt: 'Polttariporukka teki sinusta maskotin.',
        fn: () => {
          Game.state.fullCans += 12;
          return ['+12 täyttä tölkkiä'];
        }
      },
      {
        txt: 'Pultsarikuningas nimitti sinut hovimestariksi.',
        fn: () => {
          Game.state.ryypyt += 80;
          Game.state.fullCans += 4;
          return ['+80 ryyppyä', '+4 tölkkiä'];
        }
      },
      {
        txt: 'Joku maksoi sinulle, ettet laulaisi enää karaokea.',
        fn: () => {
          Game.state.euros += 30;
          return ['+30.00 €'];
        }
      },
      {
        txt: 'Kaupungin panttikeiju siunasi säkkisi.',
        fn: () => {
          Game.state.emptyCans += 50;
          return ['+50 tyhjää tölkkiä'];
        }
      }
    ];

    this.negative = [
      {
        txt: 'Taksimatka oli vahinko, mutta maksu oli oikea.',
        fn: () => {
          const loss = Math.min(Game.state.euros, 60);
          Game.state.euros -= loss;
          return ['-' + loss.toFixed(2) + ' €'];
        }
      },
      {
        txt: 'Aamulla löytyi vain kuitteja. Ryyppyjä hävisi.',
        fn: () => {
          const loss = Math.min(Game.state.ryypyt, 50);
          Game.state.ryypyt -= loss;
          return ['-' + loss + ' ryyppyä'];
        }
      },
      {
        txt: 'Lokki nappasi eväskassisi ja katsoi halveksivasti.',
        fn: () => {
          const lost = Math.min(Supermarket.items[0].owned, 3);
          Supermarket.items[0].owned -= lost;
          return ['-' + lost + ' banaania'];
        }
      },
      {
        txt: 'Bussikuski ei hyväksynyt ryyppyjä maksuvälineeksi.',
        fn: () => {
          const loss = Math.min(Game.state.ryypyt, 30);
          Game.state.ryypyt -= loss;
          return ['-' + loss + ' ryyppyä'];
        }
      },
      {
        txt: 'Aamulla sinulla oli liikennemerkki, mutta ei ostoskassia.',
        fn: () => {
          const loss = Math.min(Game.state.fullCans, 12);
          Game.state.fullCans -= loss;
          return ['-' + loss + ' täyttä tölkkiä'];
        }
      },
      {
        txt: 'Joogaryhmä tapahtui sinulle vahingossa.',
        fn: () => {
          Game.changeHangover(15);
          return ['Krapula +15'];
        }
      }
    ];

    document.getElementById('dailyMain').insertAdjacentHTML(
      'beforeend',
      Game.section(
        'Satunnaiset tapahtumat',
        'eventContent',
        `
          <p>Käytä ryyppyjä kaaoksen kutsumiseen. Hinta on aina 20 + 35-65 % nykyisistä ryypyistä.</p>
          <p>Hinta: <span id="eventCost">20</span> ryyppyä</p>
          <button id="eventButton" onclick="Events.trigger()">Käynnistä satunnainen tapahtuma</button>
          <p id="eventLog">Ei tapahtumia vielä.</p>
        `
      )
    );
  },

  rollCost() {
    this.cost = 20 + Math.floor(Game.state.ryypyt * Game.randFloat(0.35, 0.65));
  },

  trigger() {
    if (this.cost < 20) this.rollCost();
    if (Game.state.ryypyt < this.cost) return;

    const paid = this.cost;
    Game.state.ryypyt -= paid;

    const good = Math.random() < 0.52;
    const list = good ? this.positive : this.negative;
    const ev = list[Game.randInt(0, list.length - 1)];
    const changes = ev.fn();

    Game.state.eventLog = (good ? 'Hyvä tapahtuma: ' : 'Huono tapahtuma: ')
      + ev.txt
      + ' | Maksoit: -'
      + paid
      + ' ryyppyä | Muutokset: '
      + changes.join(', ');

    if (typeof UI !== 'undefined' && typeof UI.announceEvent === 'function') {
      UI.announceEvent(Game.state.eventLog, { sound: true, type: good ? 'good' : 'bad' });
    }

    this.rollCost();
    Game.update();
  },

  render() {
    if (this.cost < 20) this.rollCost();
    document.getElementById('eventCost').textContent = this.cost;
    document.getElementById('eventButton').disabled = Game.state.ryypyt < this.cost;
    document.getElementById('eventLog').textContent = Game.state.eventLog;
  }
};

Game.register(Events);
