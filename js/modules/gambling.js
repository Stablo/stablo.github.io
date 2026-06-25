const Gambling = {
  bet: 25,
  log: 'Takahuoneessa on hiljaista. Liian hiljaista.',
  cupActive: false,
  karaokeActive: false,
  cardActive: false,

  arrows: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  labels: { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' },

  karaoke: null,
  karaokeRaf: null,
  karaokeKeyHandler: null,

  karaokeDifficulties: {
    double: {
      name: 'Kellarikaraoke',
      label: '2x panos',
      multiplier: 2,
      notes: 12,
      speed: 215,
      interval: 650,
      hitWindow: 42,
      allowedMisses: 3,
      stressFail: 8,
      hangoverFail: 4
    },
    triple: {
      name: 'Räkälän semifinaali',
      label: '3x panos',
      multiplier: 3,
      notes: 16,
      speed: 265,
      interval: 520,
      hitWindow: 36,
      allowedMisses: 2,
      stressFail: 11,
      hangoverFail: 6
    },
    quadruple: {
      name: 'Kansallinen tuomioilta',
      label: '4x panos',
      multiplier: 4,
      notes: 21,
      speed: 320,
      interval: 430,
      hitWindow: 30,
      allowedMisses: 1,
      stressFail: 15,
      hangoverFail: 9
    }
  },

  init() {
    this.injectStyles();

    document.getElementById('gamblingMain').insertAdjacentHTML(
      'beforeend',
      Game.section(
        'Uhkapelit',
        'gamblingContent',
        `
          <p>
            Täällä eurot muuttuvat huonoiksi päätöksiksi. Panokset maksetaan euroina, voitot maksetaan euroina,
            ja tappiot tuntuvat yleensä stressissä tai krapulassa.
          </p>

          <p>Nykyiset eurot: <strong><span id="gamblingEuros">0.00 €</span></strong></p>

          <div class="gambleChoices">
            <span>Panostaso:</span>
            <button onclick="Gambling.setBet(10)">10</button>
            <button onclick="Gambling.setBet(25)">25</button>
            <button onclick="Gambling.setBet(50)">50</button>
            <button onclick="Gambling.setBet(100)">100</button>
            <strong id="currentBetText">25.00 €</strong>
          </div>

          <div class="gamblingGrid">
            <div class="gambleCard">
              <h3>Kolmen kupin katastrofi</h3>
              <p>Kupit sekoittuvat pop-upissa. Valitse yksi kuppi: takaisin voi tulla 0x, 1x tai 2x panos.</p>
              <button id="cupGameButton" onclick="Gambling.startCupGame()">Aloita kuppikatastrofi</button>
            </div>

            <div class="gambleCard">
              <h3>Karaoketuomio</h3>
              <p>Nuolirytmipeli, jossa merkit kulkevat vasemmalta oikealle. Paina oikea näppäin merkin kohdalla.</p>
              <button id="karaokeDoubleButton" onclick="Gambling.startKaraoke('double')">Kellarikaraoke — 2x</button>
              <button id="karaokeTripleButton" onclick="Gambling.startKaraoke('triple')">Räkälän semifinaali — 3x</button>
              <button id="karaokeQuadrupleButton" onclick="Gambling.startKaraoke('quadruple')">Kansallinen tuomioilta — 4x</button>
              <p class="smallHint">Vaikeammat tasot maksavat paremmin, mutta virheet loppuvat nopeasti.</p>
            </div>

            <div class="gambleCard">
              <h3>Korttipakka, josta puuttuu kortteja</h3>
              <p>Korttipakka sekoitetaan pop-upissa. Kortti pyörii hetken ja paljastaa hyvän tai pahan merkin.</p>
              <button onclick="Gambling.cardDraw()">Nosta epäilyttävä kortti</button>
            </div>
          </div>

          <p id="gamblingLog" class="gambleLog">Takahuoneessa on hiljaista. Liian hiljaista.</p>
        `
      )
    );
  },

  injectStyles() {
    if (document.getElementById('gamblingDynamicStyles')) return;

    const style = document.createElement('style');
    style.id = 'gamblingDynamicStyles';
    style.textContent = `
      .smallHint { color: #cdbdca; font-size: 12px; }

      .cupGameBox {
        width: min(760px, 94vw);
        text-align: center;
      }

      .cupTable {
        position: relative;
        display: flex;
        justify-content: center;
        gap: 22px;
        min-height: 190px;
        margin: 24px 0 10px;
        padding: 18px;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 14px;
        background: radial-gradient(circle at center, rgba(255, 95, 183, .14), rgba(0,0,0,.25));
        overflow: hidden;
      }

      .cupButton {
        position: relative;
        width: 130px;
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border-radius: 18px;
        transition: transform .42s ease, filter .25s ease, box-shadow .25s ease;
        text-align: center;
      }

      .actualCup {
        position: relative;
        display: block;
        width: 82px;
        height: 98px;
        filter: drop-shadow(0 12px 12px rgba(0,0,0,.35));
        transform-origin: center center;
      }

      .actualCup::before {
        content: '';
        position: absolute;
        left: 4px;
        right: 4px;
        top: 0;
        height: 23px;
        border: 3px solid #ffb8bc;
        border-radius: 50%;
        background: radial-gradient(ellipse at center, #650511 0 42%, #c80f24 44% 66%, #ff737d 68% 100%);
        box-shadow: inset 0 3px 5px rgba(255,255,255,.22), 0 2px 0 rgba(90,0,10,.45);
        z-index: 2;
      }

      .actualCup::after {
        content: '';
        position: absolute;
        left: 11px;
        top: 13px;
        width: 60px;
        height: 81px;
        clip-path: polygon(0 0, 100% 0, 80% 100%, 20% 100%);
        background:
          linear-gradient(90deg, rgba(255,255,255,.30), transparent 24%, transparent 72%, rgba(0,0,0,.20)),
          repeating-linear-gradient(0deg, transparent 0 18px, rgba(255,255,255,.12) 19px 20px),
          linear-gradient(135deg, #ff5a63 0%, #d9152b 48%, #7f0616 100%);
        border-radius: 0 0 15px 15px;
        box-shadow: inset -7px 0 12px rgba(75,0,12,.35), inset 8px 0 10px rgba(255,255,255,.16);
        z-index: 1;
      }

      .cupButton.shuffleWiggle {
        animation: cupWiggle .28s ease-in-out;
      }

      .cupButton.lifted {
        transform: translateY(-46px) rotate(-3deg) scale(1.08);
        filter: brightness(1.35);
        box-shadow: 0 0 28px rgba(255,255,255,.35);
      }

      .cupButton.cupReady .actualCup {
        animation: cupFlipOver .46s ease both;
      }

      .cupButton.lifted .actualCup {
        animation: cupRevealFlip .36s ease both;
      }

      .cupPrize {
        display: block;
        position: absolute;
        left: 50%;
        bottom: 8px;
        transform: translateX(-50%);
        min-width: 92px;
        padding: 5px 7px;
        border-radius: 999px;
        background: rgba(0,0,0,.70);
        color: #fff7b8;
        font-size: 14px;
        opacity: 0;
        transition: opacity .2s ease;
      }

      .cupButton.lifted .cupPrize {
        opacity: 1;
      }

      @keyframes cupWiggle {
        0% { transform: translateX(0) rotate(0deg); }
        33% { transform: translateX(-12px) rotate(-5deg); }
        66% { transform: translateX(12px) rotate(5deg); }
        100% { transform: translateX(0) rotate(0deg); }
      }

      @keyframes cupFlipOver {
        0% { transform: translateY(0) rotate(0deg) scale(1); }
        45% { transform: translateY(-12px) rotate(92deg) scale(1.04); }
        100% { transform: translateY(0) rotate(180deg) scale(1); }
      }

      @keyframes cupRevealFlip {
        0% { transform: translateY(0) rotate(180deg) scale(1); }
        100% { transform: translateY(-6px) rotate(0deg) scale(1.03); }
      }

      .karaokeBox {
        width: min(860px, 95vw);
        position: relative;
      }

      .karaokeHud {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        color: #ffe1f1;
      }

      .karaokeLane {
        position: relative;
        height: 170px;
        margin: 18px 0 10px;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 14px;
        background:
          linear-gradient(90deg, rgba(255,255,255,.04), rgba(255,95,183,.08), rgba(255,255,255,.04)),
          #120a12;
        overflow: hidden;
      }

      .karaokeMarker {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        width: 4px;
        transform: translateX(-50%);
        background: #fff7b8;
        box-shadow: 0 0 16px #fff7b8;
        z-index: 3;
      }

      .karaokeMarker::before {
        content: 'OSU';
        position: absolute;
        top: 6px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 11px;
        color: #111;
        background: #fff7b8;
        padding: 2px 5px;
        border-radius: 999px;
      }

      .rhythmArrow {
        position: absolute;
        top: 72px;
        width: 46px;
        height: 46px;
        line-height: 42px;
        text-align: center;
        border: 2px solid #ffb8df;
        border-radius: 50%;
        background: rgba(255, 95, 183, .20);
        color: #fff;
        font-size: 30px;
        font-weight: bold;
        transform: translateX(-50%);
        text-shadow: 0 0 10px rgba(255,255,255,.5);
        box-shadow: 0 0 14px rgba(255,95,183,.18);
        z-index: 2;
      }

      .rhythmArrow.hit {
        opacity: 0;
        transform: translateX(-50%) scale(1.45);
        transition: opacity .16s ease, transform .16s ease;
      }

      .rhythmArrow.missed {
        opacity: .20;
        border-color: #ff4444;
        color: #ff9999;
      }

      .karaokeFeedbackLayer {
        position: absolute;
        right: 28px;
        top: 120px;
        width: 150px;
        height: 90px;
        pointer-events: none;
        z-index: 7;
      }

      .karaokeFeedback {
        position: absolute;
        right: 0;
        top: 38px;
        padding: 6px 12px;
        border-radius: 10px;
        font-size: 22px;
        font-weight: bold;
        letter-spacing: 1px;
        animation: karaokePop .55s ease-out forwards;
        text-shadow: 0 0 8px rgba(0,0,0,.8);
      }

      .karaokeFeedback.hitText {
        color: #baffba;
        border: 1px solid #35ff68;
        background: rgba(0,110,35,.35);
        box-shadow: 0 0 16px rgba(53,255,104,.35);
      }

      .karaokeFeedback.missText {
        color: #ffb0b0;
        border: 1px solid #ff4444;
        background: rgba(120,0,0,.38);
        box-shadow: 0 0 16px rgba(255,68,68,.35);
      }

      @keyframes karaokePop {
        0% { opacity: 0; transform: translateY(16px) scale(.8); }
        18% { opacity: 1; transform: translateY(0) scale(1.05); }
        100% { opacity: 0; transform: translateY(-28px) scale(1); }
      }


      .cardGameBox {
        width: min(760px, 94vw);
        text-align: center;
        position: relative;
        overflow: hidden;
      }

      .deckStage {
        position: relative;
        min-height: 280px;
        margin: 18px 0;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 16px;
        background:
          radial-gradient(circle at 50% 42%, rgba(255, 247, 184, .16), transparent 34%),
          radial-gradient(circle at 50% 72%, rgba(98, 0, 163, .24), transparent 38%),
          rgba(0,0,0,.28);
        overflow: hidden;
      }

      .deckPile {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 122px;
        height: 168px;
      }

      .deckCardBack {
        position: absolute;
        width: 108px;
        height: 150px;
        left: 7px;
        top: 9px;
        border-radius: 13px;
        border: 2px solid rgba(255,255,255,.65);
        background:
          repeating-linear-gradient(45deg, #2b0b3d, #2b0b3d 8px, #441161 8px, #441161 16px),
          #2b0b3d;
        box-shadow: 0 10px 30px rgba(0,0,0,.45);
      }

      .deckPile.shuffling .deckCardBack:nth-child(1) { animation: deckShuffleA .24s ease-in-out infinite alternate; }
      .deckPile.shuffling .deckCardBack:nth-child(2) { animation: deckShuffleB .28s ease-in-out infinite alternate; }
      .deckPile.shuffling .deckCardBack:nth-child(3) { animation: deckShuffleC .32s ease-in-out infinite alternate; }

      @keyframes deckShuffleA {
        from { transform: translateX(-16px) rotate(-9deg); }
        to { transform: translateX(18px) rotate(11deg); }
      }

      @keyframes deckShuffleB {
        from { transform: translateY(-10px) rotate(8deg); }
        to { transform: translateY(14px) rotate(-7deg); }
      }

      @keyframes deckShuffleC {
        from { transform: translateX(13px) translateY(8px) rotate(12deg); }
        to { transform: translateX(-14px) translateY(-6px) rotate(-10deg); }
      }

      .drawnCard {
        position: absolute;
        left: 50%;
        top: 52%;
        width: 126px;
        height: 176px;
        transform: translate(-50%, -50%) rotate(0deg);
        border-radius: 16px;
        border: 3px solid #fff3c4;
        background: linear-gradient(145deg, #fff6df, #f1d8a8);
        color: #24110e;
        box-shadow: 0 14px 36px rgba(0,0,0,.55), 0 0 18px rgba(255,247,184,.22);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 62px;
        font-weight: bold;
        z-index: 3;
      }

      .drawnCard.cardSpinning {
        animation: cardFloatSpin .42s linear infinite;
      }

      .drawnCard.cardRevealGood {
        animation: cardRevealGood .55s ease-out forwards;
        border-color: #ff89c8;
        box-shadow: 0 14px 36px rgba(0,0,0,.55), 0 0 28px rgba(255,137,200,.65);
      }

      .drawnCard.cardRevealBad {
        animation: cardRevealBad .55s ease-out forwards;
        border-color: #7b7b8f;
        background: linear-gradient(145deg, #d9d9e6, #767086);
        color: #150a1f;
        box-shadow: 0 14px 36px rgba(0,0,0,.65), 0 0 30px rgba(49,37,71,.85);
      }

      @keyframes cardFloatSpin {
        0% { transform: translate(-50%, -50%) translateY(0) rotate(0deg) scale(1); }
        50% { transform: translate(-50%, -50%) translateY(-18px) rotate(180deg) scale(1.06); }
        100% { transform: translate(-50%, -50%) translateY(0) rotate(360deg) scale(1); }
      }

      @keyframes cardRevealGood {
        0% { transform: translate(-50%, -50%) rotate(250deg) scale(.9); }
        70% { transform: translate(-50%, -50%) rotate(-8deg) scale(1.12); }
        100% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
      }

      @keyframes cardRevealBad {
        0% { transform: translate(-50%, -50%) rotate(-250deg) scale(.9); }
        70% { transform: translate(-50%, -50%) rotate(8deg) scale(1.10); }
        100% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
      }

      .cardParticle {
        position: absolute;
        left: 50%;
        top: 50%;
        font-size: 26px;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 5;
        animation: cardParticleBurst .9s ease-out forwards;
      }

      @keyframes cardParticleBurst {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(.4) rotate(0deg); }
        20% { opacity: 1; }
        100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.35) rotate(var(--rot)); }
      }
    `;
    document.head.appendChild(style);
  },

  setBet(amount) {
    this.bet = amount;
    this.render();
  },

  formatEuros(amount) {
    return `${Number(amount).toFixed(2)} €`;
  },

  canPay() {
    return Game.state.euros >= this.bet;
  },

  payBet() {
    if (!this.canPay()) return false;
    Game.state.euros -= this.bet;
    return true;
  },

  win(amount, text) {
    Game.state.euros += amount;
    this.log = text;
    Game.state.eventLog = text;
    Game.update();
  },

  lose(text, stress = 0, hangover = 0) {
    if (stress) Game.changeStress(stress);
    if (hangover) Game.changeHangover(hangover);
    this.log = text;
    Game.state.eventLog = text;
    Game.update();
  },

  startCupGame() {
    if (this.cupActive || this.karaokeActive || this.cardActive) return;
    if (!this.payBet()) return;

    this.cupActive = true;
    Game.update();

    const paidBet = this.bet;
    const multipliers = [0, 1, 2].sort(() => Math.random() - 0.5);

    const overlay = document.createElement('div');
    overlay.id = 'cupOverlay';
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="overlayBox cupGameBox">
        <h2>Kolmen kupin katastrofi</h2>
        <p id="cupStatus">Kupit sekoittuvat. Yritä näyttää siltä, että ymmärrät pelin.</p>
        <div class="cupTable" id="cupTable">
          ${multipliers.map((multiplier, index) => `
            <button class="cupButton" data-index="${index}" data-multiplier="${multiplier}" type="button" aria-label="Valitse kuppi ${index + 1}" disabled>
              <span class="actualCup" aria-hidden="true"></span>
              <span class="cupPrize">${multiplier}x = ${this.formatEuros(paidBet * multiplier)}</span>
            </button>
          `).join('')}
        </div>
        <p id="cupResultText">Odota sekoitus loppuun.</p>
        <button id="cupCloseButton" style="display:none;" type="button">Jatka takahuoneeseen</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const table = document.getElementById('cupTable');
    const status = document.getElementById('cupStatus');
    const result = document.getElementById('cupResultText');
    const buttons = [...document.querySelectorAll('#cupTable .cupButton')];

    let shuffleSteps = 0;
    const shuffleTimer = setInterval(() => {
      shuffleSteps++;
      const shuffled = [...buttons].sort(() => Math.random() - 0.5);
      shuffled.forEach(button => table.appendChild(button));
      buttons.forEach(button => {
        button.classList.remove('shuffleWiggle');
        void button.offsetWidth;
        button.classList.add('shuffleWiggle');
      });

      if (shuffleSteps >= 9) {
        clearInterval(shuffleTimer);
        status.textContent = 'Kupit kääntyivät nurinpäin. Valitse yksi: yksi on tyhjä, yksi palauttaa panoksen ja yksi tuplaa sen.';
        result.textContent = 'Paina kuppia.';
        buttons.forEach(button => {
          button.classList.add('cupReady');
          button.disabled = false;
          button.onclick = () => this.resolveCupGame(button, paidBet, overlay, buttons);
        });
      }
    }, 260);
  },

  resolveCupGame(button, paidBet, overlay, buttons) {
    const multiplier = Number(button.dataset.multiplier);
    const payout = paidBet * multiplier;

    buttons.forEach(b => {
      b.disabled = true;
      b.onclick = null;
    });

    button.classList.add('lifted');

    if (payout > 0) Game.state.euros += payout;

    const result = document.getElementById('cupResultText');
    const close = document.getElementById('cupCloseButton');

    result.textContent = `Kupin alta löytyi ${this.formatEuros(payout)} takaisin (${multiplier}x panos).`;

    if (multiplier === 0) {
      this.log = `Kolmen kupin katastrofi: kuppi oli tyhjä. Menetit ${this.formatEuros(paidBet)}. Stressi +4.`;
      Game.changeStress(4);
    } else if (multiplier === 1) {
      this.log = `Kolmen kupin katastrofi: sait panoksen takaisin. Ei voittoa, mutta ei täydellistä häpeää.`;
    } else {
      this.log = `Kolmen kupin katastrofi: kuppi tuplasi panoksen! Sait ${this.formatEuros(payout)} takaisin.`;
      Game.changeStress(-2);
    }

    Game.state.eventLog = this.log;

    close.style.display = 'inline-block';
    close.onclick = () => {
      overlay.remove();
      this.cupActive = false;
      Game.update();
    };

    Game.update();
  },

  cardDraw() {
    if (this.cupActive || this.karaokeActive || this.cardActive) return;
    if (!this.payBet()) return;

    this.cardActive = true;
    Game.update();

    const paidBet = this.bet;
    const outcome = this.createCardOutcome(paidBet);
    const spinTime = Game.randInt(1000, 4000);

    const overlay = document.createElement('div');
    overlay.id = 'cardOverlay';
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="overlayBox cardGameBox">
        <h2>🃏 Korttipakka, josta puuttuu kortteja</h2>
        <p id="cardStatus">Pakasta kuuluu märkä läpsähtely. Kortteja sekoitetaan.</p>
        <div class="deckStage" id="deckStage">
          <div class="deckPile shuffling" id="deckPile">
            <div class="deckCardBack"></div>
            <div class="deckCardBack"></div>
            <div class="deckCardBack"></div>
          </div>
        </div>
        <p id="cardResultText">Odota, että pakka päättää kohtalosi.</p>
        <button id="cardCloseButton" style="display:none;" type="button">Sulje korttipöytä</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const stage = document.getElementById('deckStage');
    const pile = document.getElementById('deckPile');
    const status = document.getElementById('cardStatus');
    const result = document.getElementById('cardResultText');
    const close = document.getElementById('cardCloseButton');

    setTimeout(() => {
      pile.classList.remove('shuffling');
      status.textContent = 'Yksi kortti irtoaa pakasta ja alkaa käyttäytyä epäilyttävästi.';

      const card = document.createElement('div');
      card.id = 'drawnGambleCard';
      card.className = 'drawnCard cardSpinning';
      card.textContent = '🂠';
      stage.appendChild(card);

      setTimeout(() => {
        card.classList.remove('cardSpinning');
        card.classList.add(outcome.good ? 'cardRevealGood' : 'cardRevealBad');
        card.textContent = outcome.symbol;
        status.textContent = outcome.good ? 'Kortti kääntyy oikein päin. Jostain kuuluu fanfaari.' : 'Kortti kääntyy oikein päin. Ilma muuttuu kellariksi.';
        result.textContent = outcome.text;

        this.spawnCardParticles(stage, outcome.good);

        if (outcome.payout > 0) Game.state.euros += outcome.payout;
        if (outcome.stress) Game.changeStress(outcome.stress);
        if (outcome.hangover) Game.changeHangover(outcome.hangover);

        this.log = outcome.log;
        Game.state.eventLog = outcome.log;

        close.style.display = 'inline-block';
        close.onclick = () => {
          overlay.remove();
          this.cardActive = false;
          Game.update();
        };

        Game.update();
      }, spinTime);
    }, 900);
  },

  createCardOutcome(paidBet) {
    const goodSymbols = ['💖', '🐷', '🍀', '😂', '🦆', '🎉', '🥨', '👑'];
    const badSymbols = ['☠️', '👹', '🕷️', '🧿', '🌑', '⚰️', '🦇', '💀'];
    const roll = Math.random();

    if (roll < 0.08) {
      const prize = Math.floor(paidBet * 5);
      return {
        good: true,
        symbol: goodSymbols[Game.randInt(0, goodSymbols.length - 1)],
        payout: prize,
        stress: -4,
        hangover: 0,
        text: `Jättipotti: kortti sylkäisi ${this.formatEuros(prize)} takaisin ja pöytä teeskentelee, että tämä on normaalia.`,
        log: `Korttipakka: vedät kortin, jota ei pitäisi olla olemassa. Jättipotti +${this.formatEuros(prize)}! Stressi -4.`
      };
    }

    if (roll < 0.38) {
      const prize = Math.floor(paidBet * 1.7);
      return {
        good: true,
        symbol: goodSymbols[Game.randInt(0, goodSymbols.length - 1)],
        payout: prize,
        stress: -1,
        hangover: 0,
        text: `Hyvä kortti: saat ${this.formatEuros(prize)} takaisin. Joku nurkassa taputtaa yhdellä kädellä.`,
        log: `Korttipakka: jotenkin tämä laskettiin voitoksi. +${this.formatEuros(prize)}, stressi -1.`
      };
    }

    if (roll < 0.50) {
      const prize = Math.floor(paidBet * 0.7);
      return {
        good: false,
        symbol: badSymbols[Game.randInt(0, badSymbols.length - 1)],
        payout: prize,
        stress: 3,
        hangover: 0,
        text: `Outo kortti: saat vain ${this.formatEuros(prize)} takaisin. Kortti tuijottaa sinua liian pitkään.`,
        log: `Korttipakka: saat osan takaisin, mutta tunnelma pilaantuu. +${this.formatEuros(prize)}, stressi +3.`
      };
    }

    return {
      good: false,
      symbol: badSymbols[Game.randInt(0, badSymbols.length - 1)],
      payout: 0,
      stress: 5,
      hangover: 2,
      text: `Paha kortti: et saa mitään takaisin. Pöytä katsoo sinua hiljaa ja krapula hiipii lähemmäs.`,
      log: `Korttipakka: pöytä katsoo sinua hiljaa. Menetit ${this.formatEuros(paidBet)}. Krapula +2, stressi +5.`
    };
  },

  spawnCardParticles(stage, good) {
    const particles = good ? ['💖', '💕', '💗', '💘', '❤️'] : ['🌩️', '🌫️', '☁️', '⛈️', '🌑'];
    const count = good ? 24 : 22;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'cardParticle';
      p.textContent = particles[Game.randInt(0, particles.length - 1)];

      const angle = (Math.PI * 2 * i / count) + Game.randFloat(-0.25, 0.25);
      const distance = Game.randInt(80, 190);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      p.style.setProperty('--dx', dx + 'px');
      p.style.setProperty('--dy', dy + 'px');
      p.style.setProperty('--rot', Game.randInt(-220, 220) + 'deg');
      p.style.animationDelay = Game.randInt(0, 120) + 'ms';

      stage.appendChild(p);
      setTimeout(() => p.remove(), 1100);
    }
  },

  startKaraoke(level) {
    if (this.karaokeActive || this.cupActive || this.cardActive) return;
    const config = this.karaokeDifficulties[level];
    if (!config) return;
    if (!this.payBet()) return;

    const paidBet = this.bet;
    this.karaokeActive = true;

    const overlay = document.createElement('div');
    overlay.id = 'karaokeOverlay';
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="overlayBox karaokeBox">
        <h2>🎤 ${config.name} — ${config.label}</h2>
        <p>Paina oikeaa nuolinäppäintä, kun nuoli osuu keskellä olevaan merkkiin.</p>
        <div class="karaokeHud">
          <span>Panoksesi: <strong>${this.formatEuros(paidBet)}</strong></span>
          <span>Voitto onnistuessa: <strong>${this.formatEuros(paidBet * config.multiplier)}</strong></span>
          <span>Virheet: <strong id="karaokeMisses">0</strong>/${config.allowedMisses}</span>
          <span>Osumat: <strong id="karaokeHits">0</strong>/${config.notes}</span>
        </div>
        <div class="karaokeLane" id="karaokeLane">
          <div class="karaokeMarker"></div>
          <div class="karaokeFeedbackLayer" id="karaokeFeedbackLayer"></div>
        </div>
        <p id="karaokeResultLine" class="smallHint">Nuolia tulee pian vasemmalta.</p>
      </div>
    `;
    document.body.appendChild(overlay);

    const startTime = performance.now() + 700;
    const notes = [];
    for (let i = 0; i < config.notes; i++) {
      const key = this.arrows[Game.randInt(0, 3)];
      const element = document.createElement('div');
      element.className = 'rhythmArrow';
      element.textContent = this.labels[key];
      document.getElementById('karaokeLane').appendChild(element);
      notes.push({
        key,
        element,
        spawnTime: startTime + i * config.interval,
        state: 'pending',
        x: -80
      });
    }

    this.karaoke = {
      level,
      config,
      paidBet,
      overlay,
      notes,
      startTime,
      hits: 0,
      misses: 0,
      ended: false
    };

    this.karaokeKeyHandler = event => this.keyKaraoke(event);
    window.addEventListener('keydown', this.karaokeKeyHandler);

    this.karaokeLoop();
    Game.update();
  },

  karaokeLoop() {
    if (!this.karaokeActive || !this.karaoke || this.karaoke.ended) return;

    const state = this.karaoke;
    const lane = document.getElementById('karaokeLane');
    if (!lane) return;

    const now = performance.now();
    const marker = lane.clientWidth / 2;
    const missLine = marker + state.config.hitWindow;

    state.notes.forEach(note => {
      if (note.state !== 'pending') return;

      note.x = -60 + ((now - note.spawnTime) / 1000) * state.config.speed;
      note.element.style.left = note.x + 'px';

      if (note.x > missLine) {
        this.registerKaraokeMiss(note, true);
      }
    });

    document.getElementById('karaokeMisses').textContent = state.misses;
    document.getElementById('karaokeHits').textContent = state.hits;

    if (state.misses > state.config.allowedMisses) {
      this.failKaraoke('Yleisö kuuli liikaa vääriä kohtia.');
      return;
    }

    if (state.notes.every(note => note.state !== 'pending')) {
      this.winKaraoke();
      return;
    }

    this.karaokeRaf = requestAnimationFrame(() => this.karaokeLoop());
  },

  keyKaraoke(event) {
    if (!this.karaokeActive || !this.karaoke || !this.arrows.includes(event.key)) return;
    event.preventDefault();

    const state = this.karaoke;
    const lane = document.getElementById('karaokeLane');
    if (!lane || state.ended) return;

    const marker = lane.clientWidth / 2;
    const candidates = state.notes
      .filter(note => note.state === 'pending' && note.key === event.key)
      .map(note => ({ note, dist: Math.abs(note.x - marker) }))
      .sort((a, b) => a.dist - b.dist);

    if (candidates.length && candidates[0].dist <= state.config.hitWindow) {
      const note = candidates[0].note;
      note.state = 'hit';
      note.element.classList.add('hit');
      state.hits++;
      this.showKaraokeFeedback('HIT!', 'hitText');
      return;
    }

    state.misses++;
    this.showKaraokeFeedback('MISS!', 'missText');
  },

  registerKaraokeMiss(note, automatic = false) {
    if (!this.karaoke || note.state !== 'pending') return;
    note.state = 'missed';
    note.element.classList.add('missed');
    this.karaoke.misses++;
    this.showKaraokeFeedback('MISS!', 'missText');
  },

  showKaraokeFeedback(text, className) {
    const layer = document.getElementById('karaokeFeedbackLayer');
    if (!layer) return;

    const pop = document.createElement('div');
    pop.className = `karaokeFeedback ${className}`;
    pop.textContent = text;
    layer.appendChild(pop);
    setTimeout(() => pop.remove(), 650);
  },

  cleanupKaraoke() {
    if (this.karaokeRaf) {
      cancelAnimationFrame(this.karaokeRaf);
      this.karaokeRaf = null;
    }

    if (this.karaokeKeyHandler) {
      window.removeEventListener('keydown', this.karaokeKeyHandler);
      this.karaokeKeyHandler = null;
    }

    const overlay = document.getElementById('karaokeOverlay');
    if (overlay) overlay.remove();

    this.karaokeActive = false;
    this.karaoke = null;
  },

  winKaraoke() {
    if (!this.karaoke || this.karaoke.ended) return;

    const state = this.karaoke;
    state.ended = true;

    const prize = state.paidBet * state.config.multiplier;
    const text = `Karaoketuomio: ${state.config.name} meni läpi! Sait ${this.formatEuros(prize)} (${state.config.multiplier}x panos). Stressi -6.`;

    setTimeout(() => {
      this.cleanupKaraoke();
      Game.changeStress(-6);
      this.win(prize, text);
    }, 260);
  },

  failKaraoke(reason) {
    if (!this.karaoke || this.karaoke.ended) return;

    const state = this.karaoke;
    state.ended = true;
    const text = `Karaoketuomio: ${reason} Menetit ${this.formatEuros(state.paidBet)}. Krapula +${state.config.hangoverFail}, stressi +${state.config.stressFail}.`;

    setTimeout(() => {
      this.cleanupKaraoke();
      this.lose(text, state.config.stressFail, state.config.hangoverFail);
    }, 260);
  },

  render() {
    const euros = document.getElementById('gamblingEuros');
    const betText = document.getElementById('currentBetText');
    const log = document.getElementById('gamblingLog');

    if (euros) euros.textContent = this.formatEuros(Game.state.euros);
    if (betText) betText.textContent = this.formatEuros(this.bet);
    if (log) log.textContent = this.log;

    const disabled = !this.canPay() || this.cupActive || this.karaokeActive || this.cardActive;

    const cupButton = document.getElementById('cupGameButton');
    const doubleButton = document.getElementById('karaokeDoubleButton');
    const tripleButton = document.getElementById('karaokeTripleButton');
    const quadrupleButton = document.getElementById('karaokeQuadrupleButton');

    if (cupButton) cupButton.disabled = disabled;
    if (doubleButton) doubleButton.disabled = disabled;
    if (tripleButton) tripleButton.disabled = disabled;
    if (quadrupleButton) quadrupleButton.disabled = disabled;

    document.querySelectorAll('#section-gamblingContent .gambleCard button').forEach(button => {
      if (!['cupGameButton', 'karaokeDoubleButton', 'karaokeTripleButton', 'karaokeQuadrupleButton'].includes(button.id)) {
        button.disabled = disabled;
      }
    });
  }
};

Game.register(Gambling);
