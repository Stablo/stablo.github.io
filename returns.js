const Returns = {
  returning: false,
  type: "",
  total: 0,
  left: 0,
  cans: 0,

  puulantoriCooldown: 0,

  init() {
    document.getElementById("gameMain").insertAdjacentHTML(
      "beforeend",
      Game.section(
        "Eurojen tienaaminen",
        "moneyContent",
        `
          <p>Palautusarvo: <span id="canValue">0.20</span> € / tölkki</p>

          <button id="puulantoriButton" onclick="Returns.startPuulantori()">
            Palauta Puulantorille — max 10 tölkkiä, klikkaa tölkkejä
          </button>

          <button id="kilinakoneButton" onclick="Returns.startKilinakone()">
            Palauta Kilinäkoneeseen — 60 sekuntia, kaikki tölkit
          </button>

          <p id="returnStatus">Et ole palauttamassa tölkkejä.</p>

          <div class="progressOuter">
            <div class="progressInner" id="returnProgressBar"></div>
          </div>
        `
      )
    );
  },

  start(type) {
    const s = Game.state;
    if (this.returning || s.emptyCans <= 0) return;

    this.returning = true;
    this.type = type;
    this.cans = type === "puulantori" ? Math.min(10, s.emptyCans) : s.emptyCans;
    this.total = type === "puulantori" ? 5 : 60;
    this.left = this.total;

    s.emptyCans -= this.cans;
    Game.update();
  },

  startPuulantori() {
    if (this.returning) return;
    if (this.puulantoriCooldown > 0) return;
    if (Game.state.emptyCans <= 0) return;

    PuulantoriCanGame.start();
  },

  startKilinakone() {
    Panttikone.start(() => this.start("kilinakone"));
  },

  tick() {
    if (this.puulantoriCooldown > 0) {
      this.puulantoriCooldown--;
    }

    if (!this.returning) return;

    this.left--;

    if (this.left <= 0) {
      this.finish();
    }
  },

  finish() {
    Game.state.euros += this.cans * Game.config.canValue;

    this.returning = false;
    this.type = "";
    this.total = 0;
    this.left = 0;
    this.cans = 0;

    Game.update();
  },

  render() {
    const s = Game.state;

    document.getElementById("puulantoriButton").textContent =
      "Palauta Puulantorille — max 10 tölkkiä, klikkaa tölkkejä";

    document.getElementById("puulantoriButton").disabled =
      this.returning || s.emptyCans <= 0 || this.puulantoriCooldown > 0;

    document.getElementById("kilinakoneButton").disabled =
      this.returning || s.emptyCans <= 0;

    const rs = document.getElementById("returnStatus");
    const rb = document.getElementById("returnProgressBar");

    if (this.returning) {
      const place =
        this.type === "puulantori" ? "Puulantorille" : "Kilinäkoneeseen";

      const done = Math.floor(((this.total - this.left) / this.total) * 100);

      rs.textContent =
        `Palautetaan ${this.cans} tölkkiä ${place}. Aikaa jäljellä: ${this.left} s.`;

      rb.style.width = done + "%";
    } else if (this.puulantoriCooldown > 0) {
      rs.textContent =
        `Puulantori lukittu hutiklikin takia. Aikaa jäljellä: ${this.puulantoriCooldown} s.`;

      rb.style.width = ((20 - this.puulantoriCooldown) / 20) * 100 + "%";
    } else {
      rs.textContent = "Et ole palauttamassa tölkkejä.";
      rb.style.width = "0%";
    }
  }
};

const PuulantoriCanGame = {
  overlay: null,
  can: null,
  area: null,

  targetCans: 0,
  returnedCans: 0,

  animationFrame: null,

  x: 40,
  y: 40,
  vx: 1.1,
  vy: 0.85,

  start() {
    this.targetCans = Math.min(10, Game.state.emptyCans);
    this.returnedCans = 0;

    this.x = 40;
    this.y = 40;
    this.vx = Game.randInt(7, 12) / 10;
    this.vy = Game.randInt(6, 10) / 10;

    if (Math.random() < 0.5) this.vx *= -1;
    if (Math.random() < 0.5) this.vy *= -1;

    this.createOverlay();
    this.animate();
  },

  createOverlay() {
    this.overlay = document.createElement("div");
    this.overlay.className = "overlay";

    this.overlay.innerHTML = `
      <style>
        @keyframes puulantoriSpinFlash {
          0% {
            transform: rotate(0deg) scale(1);
            filter: brightness(1);
            box-shadow: 0 0 0px #fff;
          }
          35% {
            transform: rotate(180deg) scale(1.35);
            filter: brightness(2.6);
            box-shadow: 0 0 22px #fff;
          }
          70% {
            transform: rotate(300deg) scale(1.15);
            filter: brightness(1.8);
            box-shadow: 0 0 14px #fffa8b;
          }
          100% {
            transform: rotate(360deg) scale(1);
            filter: brightness(1);
            box-shadow: 0 0 0px #fff;
          }
        }

        .puulantori-hit-effect {
          animation: puulantoriSpinFlash 0.32s ease-out;
        }
      </style>

      <div class="overlayBox" style="position:relative; width:min(720px,90vw); height:420px; overflow:hidden;">
        <h2>🥫 Puulantorin tölkkijahti</h2>

        <p id="puulantoriInfo">
          Klikkaa hitaasti liikkuvaa tölkkiä. Jokainen osuma palauttaa yhden tölkin.
        </p>

        <p>
          Osumat:
          <span id="puulantoriHits">0</span>/<span id="puulantoriTarget">${this.targetCans}</span>
        </p>

        <div
          id="puulantoriPlayArea"
          style="
            position:relative;
            height:280px;
            border:1px solid #666;
            background:#181818;
            overflow:hidden;
            cursor:crosshair;
          "
        >
          <button
            id="puulantoriCan"
            style="
              position:absolute;
              width:58px;
              height:58px;
              font-size:34px;
              border-radius:50%;
              border:2px solid #ddd;
              background:#333;
              color:#eee;
              cursor:pointer;
              left:40px;
              top:40px;
            "
          >🥫</button>
        </div>

        <p style="color:#aaa;">
          Huti lukitsee Puulantorin 20 sekunniksi.
        </p>
      </div>
    `;

    document.body.appendChild(this.overlay);

    this.area = document.getElementById("puulantoriPlayArea");
    this.can = document.getElementById("puulantoriCan");

    this.can.onclick = event => {
      event.stopPropagation();
      this.hitCan();
    };

    this.area.onclick = () => {
      this.missClick();
    };
  },

  animate() {
    if (!this.can || !this.area) return;

    const maxX = this.area.clientWidth - 64;
    const maxY = this.area.clientHeight - 64;

    this.x += this.vx;
    this.y += this.vy;

    if (this.x <= 6 || this.x >= maxX) {
      this.vx *= -1;
      this.x = Math.max(6, Math.min(maxX, this.x));
    }

    if (this.y <= 6 || this.y >= maxY) {
      this.vy *= -1;
      this.y = Math.max(6, Math.min(maxY, this.y));
    }

    this.can.style.left = this.x + "px";
    this.can.style.top = this.y + "px";

    this.animationFrame = requestAnimationFrame(() => this.animate());
  },

  hitCan() {
    if (Game.state.emptyCans <= 0) {
      this.finish();
      return;
    }

    this.playHitEffect();

    Game.state.emptyCans--;
    Game.state.euros += Game.config.canValue;

    this.returnedCans++;

    document.getElementById("puulantoriHits").textContent = this.returnedCans;

    if (Game.state.eventLog !== undefined) {
      Game.state.eventLog =
        `Puulantori: palautit ${this.returnedCans}/${this.targetCans} tölkkiä.`;
    }

    this.randomizeMovementSlightly();

    if (this.returnedCans >= this.targetCans) {
      setTimeout(() => this.finish(), 220);
      return;
    }

    Game.update();
  },

  playHitEffect() {
    if (!this.can) return;

    this.can.classList.remove("puulantori-hit-effect");

    void this.can.offsetWidth;

    this.can.classList.add("puulantori-hit-effect");
  },

  randomizeMovementSlightly() {
    const speedBoost = 1 + this.returnedCans * 0.04;

    this.vx += Game.randInt(-2, 2) / 20;
    this.vy += Game.randInt(-2, 2) / 20;

    this.vx = Math.max(-1.8, Math.min(1.8, this.vx * speedBoost));
    this.vy = Math.max(-1.5, Math.min(1.5, this.vy * speedBoost));

    if (Math.abs(this.vx) < 0.6) this.vx = this.vx < 0 ? -0.6 : 0.6;
    if (Math.abs(this.vy) < 0.5) this.vy = this.vy < 0 ? -0.5 : 0.5;
  },

  missClick() {
    Returns.puulantoriCooldown = 20;

    if (Game.state.eventLog !== undefined) {
      Game.state.eventLog =
        "Puulantori: hutiklikki! Puulantori lukittui 20 sekunniksi.";
    }

    this.cleanup();
    Game.update();
  },

  finish() {
    if (Game.state.eventLog !== undefined) {
      Game.state.eventLog =
        `Puulantori onnistui: palautit ${this.returnedCans} tölkkiä ja sait ${(this.returnedCans * Game.config.canValue).toFixed(2)} €.`;
    }

    this.cleanup();
    Game.update();
  },

  cleanup() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    this.can = null;
    this.area = null;
    this.targetCans = 0;
    this.returnedCans = 0;
  }
};

const Panttikone = {
  events: [
    "Kone sylkee tölkin takaisin naamallesi.",
    "Teinit kuvaavat: äijä vastaan panttikone.",
    "Eläkeläinen yrittää ohittaa mehupullolla.",
    "Humalainen setä selittää vuoden 1998 finaalia.",
    "Tölkkipussi repeää kuin draamasarjan finaali.",
    "Kone piippaa kuin sillä olisi henkilökohtainen ongelma.",
    "Joku kysyy, lainaatko S-Etukorttia ihan nopeasti.",
    "Lapsi osoittaa sinua ja kysyy äidiltään vaikean kysymyksen.",
    "Panttikone nielaisee tölkin ja miettii elämäänsä liian pitkään.",
    "Viereinen pappa antaa palautteesi tekniikasta arvosanan kuusi.",
    "Kone väittää, että selvästi suomalainen tölkki on ulkomainen.",
    "Joku alkaa ravistaa omaa säkkiään liian lähellä sinua."
  ],

  correctChoices: [
    "Paina nappia ihan hiljaa",
    "Syötä tölkki varovasti",
    "Odota kuin normaali mies",
    "Hengitä ja jatka hommaa",
    "Nyökkää ja jatka rauhassa",
    "Käännä tölkki toisin päin",
    "Ota askel sivuun nätisti",
    "Pidä kuitti mielessä vielä"
  ],

  wrongChoices: [
    "Potkaise konetta sivusta",
    "Aloita kova väittely heti",
    "Huuda tölkille ohjeita nyt",
    "Syytä viereistä asiakasta",
    "Paina kaikkia nappeja heti",
    "Tee panttikoneelle uhkaus",
    "Aloita dramaattinen puhe",
    "Tarjoa koneelle tupakkaa",
    "Ravista säkkiä kuin marakassia",
    "Kysy koneelta elämänohjeita",
    "Tee asiasta taloyhtiöriita",
    "Soita kuvitteellinen esimies"
  ],

  colors: [
    "#7b2cff",
    "#ff4f81",
    "#00a7ff",
    "#ff9f1c",
    "#2ec4b6",
    "#e71d36",
    "#6a994e",
    "#bc6c25",
    "#9d4edd",
    "#3a86ff",
    "#ff006e",
    "#70e000"
  ],

  start(success) {
    let rounds = Game.randInt(5, 7);
    let round = 0;
    let mistakes = 0;

    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = `
      <div class="overlayBox">
        <h2>🥫 Panttikoneen raivo</h2>
        <p id="ptInfo"></p>
        <p id="ptText"></p>
        <div id="ptBtns"></div>
        <p>Paina oikeaa nappia. Värit vaihtuvat joka tilanteessa.</p>
      </div>
    `;

    document.body.appendChild(overlay);

    const next = () => {
      if (round >= rounds) {
        overlay.remove();
        success();
        return;
      }

      round++;

      document.getElementById("ptInfo").textContent =
        `Tilanne ${round}/${rounds} — virheet ${mistakes}/3`;

      document.getElementById("ptText").textContent =
        this.events[Game.randInt(0, this.events.length - 1)];

      const correct =
        this.correctChoices[Game.randInt(0, this.correctChoices.length - 1)];

      const wrongPool = [...this.wrongChoices].sort(() => Math.random() - 0.5);

      const options = [
        { text: correct, correct: true },
        { text: wrongPool[0], correct: false },
        { text: wrongPool[1], correct: false }
      ].sort(() => Math.random() - 0.5);

      const buttonHtml = options.map(option => {
        const color = this.colors[Game.randInt(0, this.colors.length - 1)];

        return `
          <button
            data-correct="${option.correct}"
            style="
              background:${color};
              border-color:${color};
              color:#fff;
              min-width:260px;
              text-align:center;
              font-weight:bold;
            "
          >
            ${option.text}
          </button>
        `;
      }).join("");

      document.getElementById("ptBtns").innerHTML = buttonHtml;

      [...document.querySelectorAll("#ptBtns button")].forEach(button => {
        button.onclick = () => {
          const correct = button.dataset.correct === "true";

          if (!correct) {
            mistakes++;
            Game.changeHangover(1);
          }

          if (mistakes >= 3) {
            const lost = Game.randInt(2, 8);

            Game.state.eventLog =
              `Panttikoneen raivo voitti. Menetit ${lost} tyhjää tölkkiä.`;

            Game.state.emptyCans = Math.max(0, Game.state.emptyCans - lost);
            Game.changeHangover(8);

            overlay.remove();
            Game.update();
            return;
          }

          next();
        };
      });
    };

    next();
  }
};

Game.register(Returns);