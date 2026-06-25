const Stress = {
  calmActions: [
    { name: 'Istu penkillä ja tuijota kaukaisuuteen', cost: 0.00, seconds: 8, effect: 5, hangover: 0 },
    { name: 'Kuuntele radiosta säätiedotus kahdesti', cost: 0.00, seconds: 10, effect: 7, hangover: 0 },
    { name: 'Osta kahvi ja katso seinää', cost: 2.20, seconds: 6, effect: 9, hangover: -1 },
    { name: 'Käy marketin aulassa hengittämässä', cost: 0.00, seconds: 7, effect: 6, hangover: 0 },
    { name: 'Sauna vuorossa, jos kukaan ei kysy mitään', cost: 6.00, seconds: 14, effect: 20, hangover: -8 },
    { name: 'Soita kaverille ja toivo parasta', cost: 0.00, seconds: 9, effect: 'random', hangover: 0 }
  ],
  activeAction: null,
  actionLeft: 0,
  actionTotal: 0,
  dailyMeltdownDone: false,

  init() {
    document.getElementById('dailyMain').insertAdjacentHTML(
      'beforeend',
      Game.section(
        'Stressi',
        'stressContent',
        `
          <p>Stressi tekee minipeleistä hankalampia ja voi aiheuttaa pieniä sekoilutapahtumia.</p>
          <p>Stressi: <span id="stressValue">0</span>/100 — <span id="stressLabel">Zen-Seppo</span></p>
          <div class="stressOuter"><div class="stressInner" id="stressBar"></div></div>
          <p id="stressEffectText"></p>
          <div id="stressActions"></div>
          <p id="stressActionStatus">Et rauhoitu aktiivisesti.</p>
          <div class="progressOuter"><div class="progressInner" id="stressActionBar"></div></div>
        `
      )
    );
  },

  label() {
    const s = Game.state.stress ?? 0;
    if (s <= 20) return 'Zen-Seppo';
    if (s <= 40) return 'Pientä vapinaa';
    if (s <= 60) return 'Paperit hukassa';
    if (s <= 80) return 'Puhelin soi päässä';
    return 'Täysi Kelamyrsky';
  },

  difficultyBonus() {
    return Math.floor((Game.state.stress ?? 0) / 25);
  },

  timePenalty() {
    return Math.floor((Game.state.stress ?? 0) / 20) * 0.35;
  },

  minigameSpeedMultiplier() {
    return 1 + Math.min(0.65, (Game.state.stress ?? 0) / 160);
  },

  healingPenalty() {
    return Math.floor((Game.state.stress ?? 0) / 30);
  },

  startAction(index) {
    if (this.activeAction) return;

    const action = this.calmActions[index];
    if (!action) return;
    if (Game.state.euros < action.cost) return;

    Game.state.euros -= action.cost;
    this.activeAction = action;
    this.actionTotal = action.seconds;
    this.actionLeft = action.seconds;

    Game.update();
  },

  finishAction() {
    if (!this.activeAction) return;

    const action = this.activeAction;
    let effect = action.effect;
    let note = '';

    if (effect === 'random') {
      if (Math.random() < 0.7) {
        effect = Game.randInt(8, 18);
        note = ' Puhelu oli yllättävän normaali.';
      } else {
        effect = -Game.randInt(6, 14);
        note = ' Puhelu meni aivan vihkoon.';
      }
    }

    Game.changeStress(-effect);
    Game.changeHangover(action.hangover);

    Game.state.eventLog =
      `Stressitoimi: ${action.name}. Stressi ${effect >= 0 ? '-' + effect : '+' + Math.abs(effect)}.${note}`;

    this.activeAction = null;
    this.actionLeft = 0;
    this.actionTotal = 0;
  },

  onNewDay() {
    this.dailyMeltdownDone = false;

    let gain = 0;
    gain += Math.floor(Game.state.hangover / 25);
    if (Game.state.euros < 10) gain += 4;
    else if (Game.state.euros < 30) gain += 2;
    if (Game.state.fullCans <= 0) gain += 2;
    if (typeof Kela !== 'undefined' && Kela.countProblems && Kela.countProblems() > 0) gain += 3;
    if (typeof Upgrades !== 'undefined') gain = Math.max(0, gain - Upgrades.dailyStressReduction());

    if (gain > 0) Game.changeStress(gain);
    this.maybeDailyMeltdown();
  },

  maybeDailyMeltdown() {
    if (this.dailyMeltdownDone) return;
    this.dailyMeltdownDone = true;

    const stress = Game.state.stress ?? 0;
    if (stress < 70) return;

    const chance = Math.min(0.55, (stress - 60) / 80);
    if (Math.random() > chance) return;

    const outcomes = [
      () => {
        const lost = Math.min(Game.state.emptyCans, Game.randInt(1, 5));
        Game.state.emptyCans -= lost;
        return `Stressisekoilu: unohdit ${lost} tyhjää tölkkiä johonkin.`;
      },
      () => {
        const lost = Math.min(Game.state.euros, Game.randInt(2, 12));
        Game.state.euros -= lost;
        return `Stressisekoilu: maksoit vahingossa ${lost.toFixed(2)} € turhasta kuitista.`;
      },
      () => {
        Game.changeHangover(Game.randInt(2, 6));
        return 'Stressisekoilu: tuijotit kattoa liian pitkään. Krapula paheni.';
      },
      () => {
        Game.state.dayProgressSeconds = Math.max(0, Game.state.dayProgressSeconds - 3);
        return 'Stressisekoilu: unohdit mitä olit tekemässä. Päivä tuntuu vähän pidemmältä.';
      }
    ];

    Game.state.eventLog = outcomes[Game.randInt(0, outcomes.length - 1)]();
  },

  tick() {
    if (!this.activeAction) return;
    this.actionLeft--;
    if (this.actionLeft <= 0) this.finishAction();
  },

  render() {
    const stress = Game.state.stress ?? 0;
    const value = document.getElementById('stressValue');
    const label = document.getElementById('stressLabel');
    const bar = document.getElementById('stressBar');
    const effect = document.getElementById('stressEffectText');
    const actions = document.getElementById('stressActions');
    const status = document.getElementById('stressActionStatus');
    const progress = document.getElementById('stressActionBar');

    if (!value || !label || !bar || !effect || !actions || !status || !progress) return;

    value.textContent = Math.floor(stress);
    label.textContent = this.label();
    bar.style.width = stress + '%';
    bar.style.background = `rgb(${Math.floor(stress * 2.55)},${Math.floor(210 - stress * 1.25)},${Math.floor(80 + stress * 0.8)})`;

    effect.textContent =
      `Vaikutus: minipelit +${this.difficultyBonus()} askelta, aikaikkuna -${this.timePenalty().toFixed(1)} s, healing -${this.healingPenalty()} pistettä.`;

    actions.innerHTML = '';
    this.calmActions.forEach((action, index) => {
      const button = document.createElement('button');
      const effectText = action.effect === 'random' ? 'satunnainen' : `-${action.effect}`;
      button.textContent = `${action.name} — ${action.cost.toFixed(2)} €, ${action.seconds}s, stressi ${effectText}`;
      button.disabled = !!this.activeAction || Game.state.euros < action.cost;
      button.onclick = () => this.startAction(index);
      actions.appendChild(button);
      actions.appendChild(document.createElement('br'));
    });

    if (this.activeAction) {
      status.textContent = `Kesken: ${this.activeAction.name}. Aikaa jäljellä: ${this.actionLeft}s.`;
      progress.style.width = ((this.actionTotal - this.actionLeft) / this.actionTotal) * 100 + '%';
    } else {
      status.textContent = 'Et rauhoitu aktiivisesti.';
      progress.style.width = '0%';
    }
  }
};

Game.register(Stress);
