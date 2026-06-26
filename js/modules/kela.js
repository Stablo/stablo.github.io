const Kela = {
  benefitDefaults: {
    toimeentulotuki: {
      name: 'Toimeentulotuki',
      range: [45, 75],
      baseDaysRange: [25, 35],
      problemMultiplier: 1
    },
    yleistuki: {
      name: 'Yleistuki',
      range: [520, 680],
      baseDaysRange: [25, 35],
      problemMultiplier: 1
    },
    asumistuki: {
      name: 'Asumistuki',
      range: [220, 340],
      baseDaysRange: [25, 35],
      problemMultiplier: 0.35
    }
  },

  benefits: {
    toimeentulotuki: { name: 'Toimeentulotuki', amount: 56, applied: false, payDay: null, baseDays: 0, problems: [] },
    yleistuki: { name: 'Yleistuki', amount: 595, applied: false, payDay: null, baseDays: 0, problems: [] },
    asumistuki: { name: 'Asumistuki', amount: 262, applied: false, payDay: null, baseDays: 0, problems: [] }
  },

  activeProblem: null,
  forms: [
    'Lisäselvitys 17B',
    'Liite K-404',
    'Unohtunut kuitti',
    'Vuokranantajan vahvistus',
    'Tulotietoruutu',
    'Pankkitilin varmistus',
    'Takautuva epäselvyys',
    'Sähköinen allekirjoitus',
    'Päätöksen esipäätös',
    'Kysymys, johon vastasit jo'
  ],
  texts: [
    'Hakemuksesta puuttuu outo liite, jota kukaan ei maininnut aiemmin.',
    'Kela pyytää lisäselvitystä asiasta, joka oli jo hakemuksessa.',
    'Järjestelmä haluaa sinun täyttävän muutaman satunnaisen lomakkeen.',
    'Hakemus jäi käsittelyjonon sivuraiteelle.',
    'Virkailija tarvitsee vielä yhden varmistuksen.'
  ],
  attachmentOptions: [
    'Vuokrasopimuksen sivu, jossa on kahvitahra',
    'Pankkitiliote ilman sitä yhtä riviä',
    'Työsopimus, jota et muista allekirjoittaneesi',
    'Kuitti, jossa lukee vain "se oli tarpeellinen"',
    'Selvitys siitä, miksi selvitys puuttuu'
  ],
  incomeOptions: [
    'Ilmoita vain virallinen tulo',
    'Ilmoita panttirahat tulona',
    'Ilmoita pikkukeikat kahteen kertaan',
    'Kirjoita lisätietoihin "en tiedä mutta yritän"',
    'Laita kaikki nollaksi ja toivo rauhaa'
  ],

  init() {
    this.normalizeBenefits();

    document.getElementById('moneyMain').insertAdjacentHTML(
      'beforeend',
      Game.section(
        'Kela',
        'kelaContent',
        `
          <button id="toimeentulotukiButton" onclick="Kela.apply('toimeentulotuki')">Hae Toimeentulotuki</button>
          <p><span id="toimeentulotukiRange">${this.rangeText('toimeentulotuki')}</span>, käsittelyaika 25-35 päivää.</p>
          <p id="toimeentulotukiStatus"></p>
          <hr>
          <button id="yleistukiButton" onclick="Kela.apply('yleistuki')">Hae Yleistuki</button>
          <p><span id="yleistukiRange">${this.rangeText('yleistuki')}</span>, käsittelyaika 25-35 päivää.</p>
          <p id="yleistukiStatus"></p>
          <hr>
          <button id="asumistukiButton" onclick="Kela.apply('asumistuki')">Hae Asumistuki</button>
          <p><span id="asumistukiRange">${this.rangeText('asumistuki')}</span>, käsittelyaika 25-35 päivää. Ongelmat ovat harvinaisempia.</p>
          <p id="asumistukiStatus"></p>
          <div id="kelaProblemBox" class="kelaProblem hidden">
            <h3>Kelan ongelma</h3>
            <p id="kelaProblemText"></p>
            <p id="kelaProblemHint"></p>
            <div id="kelaProblemActions"></div>
          </div>
        `
      )
    );
  },

  normalizeBenefits() {
    Object.keys(this.benefitDefaults).forEach(type => this.normalizeBenefit(type));
  },

  normalizeBenefit(type) {
    const defaults = this.benefitDefaults[type];
    const current = this.benefits[type] || {};
    const [minDays, maxDays] = defaults.baseDaysRange;

    this.benefits[type] = {
      name: defaults.name,
      amount: Number(current.amount ?? current.currentAmount ?? this.averageRange(defaults.range)),
      applied: !!current.applied,
      payDay: current.payDay ?? null,
      baseDays: Number(current.baseDays || Game.randInt(minDays, maxDays)),
      problems: Array.isArray(current.problems) ? current.problems : [],
      decisionLabel: current.decisionLabel || 'Päätös odottaa hakemusta.',
      decisionText: current.decisionText || '',
      decisionMultiplier: Number(current.decisionMultiplier || 1),
      lastPaidAmount: Number(current.lastPaidAmount || 0)
    };

    this.benefits[type].problems.forEach(problem => this.normalizeProblem(problem));
    return this.benefits[type];
  },

  normalizeProblem(problem) {
    if (!problem.kind) {
      problem.kind = problem.forms ? 'paperwork' : 'paperwork';
    }
    if (!problem.id) problem.id = Date.now() + Math.random();
    if (problem.kind === 'paperwork') {
      problem.forms = Array.isArray(problem.forms) ? problem.forms : [];
      problem.needsCall = !!problem.needsCall;
      problem.callDone = problem.needsCall ? !!problem.callDone : true;
      problem.callSecondsTotal = Number(problem.callSecondsTotal || 0);
      problem.callSecondsLeft = Number(problem.callSecondsLeft || 0);
      problem.callActive = !!problem.callActive;
    }
    if (problem.kind === 'phoneQueue') {
      problem.callDone = !!problem.callDone;
      problem.callActive = !!problem.callActive;
      problem.callSecondsTotal = Number(problem.callSecondsTotal || 8);
      problem.callSecondsLeft = Number(problem.callSecondsLeft || 0);
    }
    if (problem.kind === 'attachment' || problem.kind === 'incomeCheck') {
      problem.options = Array.isArray(problem.options) ? problem.options : [];
      problem.correctIndex = Number(problem.correctIndex || 0);
      problem.wrongChoices = Array.isArray(problem.wrongChoices) ? problem.wrongChoices : [];
      problem.solved = !!problem.solved;
    }
    return problem;
  },

  averageRange(range) {
    return Math.round((range[0] + range[1]) / 2);
  },

  formatMoney(amount) {
    return `${Number(amount).toFixed(2)} €`;
  },

  rangeText(type) {
    const range = this.benefitDefaults[type].range;
    const adjusted = range.map(amount => {
      const value = typeof Economy !== 'undefined' ? Economy.scalePayment(amount, 'kela') : amount;
      return Math.round(value);
    });
    return `${adjusted[0]}-${adjusted[1]} €`;
  },

  apply(type) {
    const b = this.normalizeBenefit(type);
    if (b.applied) return;

    const [minDays, maxDays] = this.benefitDefaults[type].baseDaysRange;
    const decision = this.rollDecision();

    b.applied = true;
    b.problems = [];
    b.baseDays = Game.randInt(minDays, maxDays) + decision.extraDays;
    b.payDay = Game.state.day + b.baseDays;
    b.decisionMultiplier = decision.multiplier;
    b.decisionLabel = decision.label;
    b.decisionText = decision.text;
    b.amount = this.rollAmount(type, decision.multiplier);

    this.maybeCreateProblemForBenefit(type, true);
    if (typeof Stress !== 'undefined') Game.changeStress(4);
    Game.update();
  },

  rollAmount(type, multiplier = 1) {
    const [min, max] = this.benefitDefaults[type].range;
    const base = Game.randInt(min, max) * multiplier;
    const adjusted = typeof Economy !== 'undefined' ? Economy.scalePayment(base, 'kela') : base;
    return Math.max(1, Math.round(adjusted));
  },

  rollDecision() {
    const roll = Math.random();
    if (roll < 0.12) {
      return {
        label: 'Takautuva päätös',
        multiplier: Game.randFloat(1.25, 1.55),
        extraDays: Game.randInt(3, 7),
        text: 'Maksu voi olla suurempi, mutta käsittely venyy.'
      };
    }
    if (roll < 0.30) {
      return {
        label: 'Hyvä päätös',
        multiplier: Game.randFloat(1.10, 1.20),
        extraDays: 0,
        text: 'Päätös näyttää tavallista anteliaammalta.'
      };
    }
    if (roll < 0.52) {
      return {
        label: 'Osittainen hyväksyntä',
        multiplier: Game.randFloat(0.65, 0.85),
        extraDays: 0,
        text: 'Osa tuesta jäi mystisesti paperipinon alle.'
      };
    }
    return {
      label: 'Tavallinen päätös',
      multiplier: 1,
      extraDays: 0,
      text: 'Päätös näyttää tavallisen nihkeältä.'
    };
  },

  problemChance(type, fromApplication) {
    const base = fromApplication ? 0.45 : 0.12;
    return base * this.benefitDefaults[type].problemMultiplier;
  },

  maybeCreateProblems() {
    this.normalizeBenefits();
    for (const type in this.benefits) {
      const b = this.benefits[type];
      if (!b.applied || b.problems.length > 0) continue;
      if (b.payDay - Game.state.day > 2 && Math.random() < this.problemChance(type, false)) {
        this.maybeCreateProblemForBenefit(type, false);
      }
    }
  },

  maybeCreateProblemForBenefit(type, fromApplication) {
    const b = this.normalizeBenefit(type);
    if (Math.random() > this.problemChance(type, fromApplication)) return;

    const problem = this.createProblem(type, fromApplication);
    b.problems.push(problem);
    if (typeof Stress !== 'undefined') Game.changeStress(fromApplication ? 6 : 8);
    if (!this.activeProblem) this.activeProblem = { benefitType: type, problemId: b.problems[0].id };
    this.announceProblem(type, problem);
  },

  announceProblem(type, problem) {
    const benefit = this.benefitDefaults[type]?.name || 'Kela';
    const text = `Kela-ongelma: ${benefit} - ${problem.title || 'selvityspyyntö'}.`;
    Game.state.eventLog = text;

    if (typeof UI !== 'undefined' && typeof UI.announceEvent === 'function') {
      UI.announceEvent(text, { sound: true, type: 'kela', id: this.problemNoticeId(problem) });
    }
  },

  problemNoticeId(problem) {
    return `kela-problem-${problem?.id ?? ''}`;
  },

  resolveProblemNotice(problem) {
    if (typeof UI !== 'undefined' && typeof UI.resolveEvent === 'function') {
      UI.resolveEvent(this.problemNoticeId(problem), 'ratkaistu');
    }
  },

  createProblem(type, fromApplication) {
    const roll = Math.random();
    if (roll < 0.45) return this.createPaperworkProblem(fromApplication);
    if (roll < 0.68) return this.createPhoneQueueProblem();
    if (roll < 0.84) return this.createAttachmentProblem();
    return this.createIncomeCheckProblem(type);
  },

  createPaperworkProblem(fromApplication) {
    const stressForms = typeof Stress !== 'undefined' ? Stress.difficultyBonus() : 0;
    const formReduction = typeof Upgrades !== 'undefined' ? Upgrades.kelaFormReduction() : 0;
    const formCount = Math.max(1, Game.randInt(3, 7) + stressForms - formReduction);
    const forms = [];

    for (let i = 0; i < formCount; i++) {
      forms.push({
        label: this.forms[Game.randInt(0, this.forms.length - 1)],
        clicked: false
      });
    }

    const needsCall = Math.random() < (fromApplication ? 0.35 : 0.45);
    return {
      id: Date.now() + Math.random(),
      kind: 'paperwork',
      title: 'Paperirumba',
      text: this.texts[Game.randInt(0, this.texts.length - 1)],
      forms,
      needsCall,
      callDone: !needsCall,
      callSecondsTotal: needsCall ? Game.randInt(2, 10) : 0,
      callSecondsLeft: 0,
      callActive: false,
      resolveDays: 1
    };
  },

  createPhoneQueueProblem() {
    const stressBonus = typeof Stress !== 'undefined' ? Stress.difficultyBonus() : 0;
    return {
      id: Date.now() + Math.random(),
      kind: 'phoneQueue',
      title: 'Puhelujono',
      text: 'Hakemus jäi jonoon, jossa soi yksi ja sama odotusmusiikki.',
      callDone: false,
      callActive: false,
      callSecondsTotal: Game.randInt(6, 12) + stressBonus,
      callSecondsLeft: 0,
      resolveDays: 1
    };
  },

  createAttachmentProblem() {
    const options = this.shuffle(this.attachmentOptions).slice(0, 3);
    return {
      id: Date.now() + Math.random(),
      kind: 'attachment',
      title: 'Liitejahti',
      text: 'Virkailija haluaa juuri oikean liitteen. Väärä liite lisää päivän käsittelyyn.',
      options,
      correctIndex: Game.randInt(0, options.length - 1),
      wrongChoices: [],
      solved: false,
      resolveDays: 1
    };
  },

  createIncomeCheckProblem(type) {
    const options = this.shuffle(this.incomeOptions).slice(0, 3);
    const correctIndex = options.findIndex(option => option === 'Ilmoita vain virallinen tulo');
    return {
      id: Date.now() + Math.random(),
      kind: 'incomeCheck',
      title: 'Tulotarkistus',
      text: `${this.benefitDefaults[type].name} vaatii tuloselvityksen. Valitse vähiten huono ilmoitus.`,
      options,
      correctIndex: correctIndex >= 0 ? correctIndex : Game.randInt(0, options.length - 1),
      wrongChoices: [],
      solved: false,
      resolveDays: 1
    };
  },

  shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
  },

  getCurrent() {
    if (!this.activeProblem) return null;
    const b = this.normalizeBenefit(this.activeProblem.benefitType);
    const problem = b.problems.find(p => p.id === this.activeProblem.problemId) || null;
    return problem ? this.normalizeProblem(problem) : null;
  },

  clickForm(index) {
    const p = this.getCurrent();
    if (!p || p.kind !== 'paperwork' || !p.forms[index]) return;
    p.forms[index].clicked = true;
    this.checkSolved();
    Game.update();
  },

  startCall() {
    const p = this.getCurrent();
    if (!p || p.callDone || p.callActive) return;

    p.callActive = true;
    p.callSecondsLeft = p.callSecondsTotal;
    if (typeof Stress !== 'undefined') Game.changeStress(2);
    Game.update();
  },

  chooseOption(index) {
    const p = this.getCurrent();
    if (!p || !['attachment', 'incomeCheck'].includes(p.kind)) return;
    if (p.solved || p.wrongChoices.includes(index)) return;

    if (index === p.correctIndex) {
      p.solved = true;
      this.checkSolved();
      Game.update();
      return;
    }

    p.wrongChoices.push(index);
    const b = this.normalizeBenefit(this.activeProblem.benefitType);
    if (b.payDay !== null) b.payDay += 1;
    if (typeof Stress !== 'undefined') Game.changeStress(5);
    Game.state.eventLog = 'Kela: väärä valinta lisäsi käsittelyyn yhden päivän.';
    Game.update();
  },

  tick() {
    const p = this.getCurrent();
    if (!p || !p.callActive) return;

    p.callSecondsLeft--;
    if (p.callSecondsLeft <= 0) {
      p.callActive = false;
      p.callDone = true;
      this.checkSolved();
    }
  },

  isSolved(problem) {
    if (!problem) return false;
    if (problem.kind === 'paperwork') return problem.forms.every(form => form.clicked) && problem.callDone;
    if (problem.kind === 'phoneQueue') return problem.callDone;
    if (problem.kind === 'attachment' || problem.kind === 'incomeCheck') return problem.solved;
    return false;
  },

  checkSolved() {
    const p = this.getCurrent();
    if (!this.isSolved(p)) return;

    const type = this.activeProblem.benefitType;
    const b = this.normalizeBenefit(type);
    this.resolveProblemNotice(p);
    b.problems = b.problems.filter(problem => problem.id !== p.id);

    if (b.applied && b.payDay !== null) {
      b.payDay = Math.max(Game.state.day, b.payDay - (p.resolveDays || 1));
    }

    if (typeof Stress !== 'undefined') Game.changeStress(-8);
    Game.state.eventLog = `Kela: ${p.title || 'ongelma'} ratkaistu.`;
    this.activeProblem = this.findNext();
  },

  findNext() {
    this.normalizeBenefits();
    for (const type in this.benefits) {
      const problem = this.benefits[type].problems[0];
      if (problem) return { benefitType: type, problemId: problem.id };
    }
    return null;
  },

  checkPayments() {
    this.normalizeBenefits();
    for (const type in this.benefits) {
      const b = this.benefits[type];
      if (!b.applied || b.problems.length > 0) continue;
      if (Game.state.day < b.payDay) continue;

      Game.state.euros += b.amount;
      b.lastPaidAmount = b.amount;
      Game.state.eventLog = `Kela maksoi: ${b.name} ${this.formatMoney(b.amount)} (${b.decisionLabel}).`;

      if (typeof Stress !== 'undefined') Game.changeStress(-8);
      this.resetBenefit(type);
    }

    if (!this.activeProblem) this.activeProblem = this.findNext();
  },

  resetBenefit(type) {
    const defaults = this.benefitDefaults[type];
    const lastPaidAmount = this.benefits[type]?.lastPaidAmount || 0;
    this.benefits[type] = {
      name: defaults.name,
      amount: this.averageRange(defaults.range),
      applied: false,
      payDay: null,
      baseDays: Game.randInt(defaults.baseDaysRange[0], defaults.baseDaysRange[1]),
      problems: [],
      decisionLabel: 'Päätös odottaa hakemusta.',
      decisionText: '',
      decisionMultiplier: 1,
      lastPaidAmount
    };
  },

  status(type) {
    const b = this.normalizeBenefit(type);
    const lastPaid = b.lastPaidAmount ? ` Viimeksi maksettu: ${this.formatMoney(b.lastPaidAmount)}.` : '';

    if (!b.applied) {
      return `Ei hakemusta käsittelyssä. Arvioitu maksu: ${this.rangeText(type)}. Seuraava perusaika: ${b.baseDays} päivää.${lastPaid}`;
    }

    const amount = this.formatMoney(b.amount);
    if (b.problems.length > 0) {
      return `Hakemus jumissa. Ongelmat ratkaisematta: ${b.problems.length}. Alustava maksu: ${amount} (${b.decisionLabel}). Maksupäivä olisi päivä ${b.payDay}.`;
    }

    return `Hakemus käsittelyssä. Alustava maksu: ${amount} (${b.decisionLabel}). Arvioitu maksupäivä: päivä ${b.payDay}. Päiviä jäljellä: ${Math.max(b.payDay - Game.state.day, 0)}.`;
  },

  countActive() {
    this.normalizeBenefits();
    let count = 0;
    for (const type in this.benefits) {
      if (this.benefits[type].applied) count++;
    }
    return count;
  },

  countProblems() {
    this.normalizeBenefits();
    let count = 0;
    for (const type in this.benefits) {
      count += this.benefits[type].problems.length;
    }
    return count;
  },

  renderProblem() {
    const box = document.getElementById('kelaProblemBox');
    const actions = document.getElementById('kelaProblemActions');
    const p = this.getCurrent();

    if (!box || !actions) return;

    if (!p) {
      box.classList.add('hidden');
      actions.innerHTML = '';
      return;
    }

    const b = this.normalizeBenefit(this.activeProblem.benefitType);
    box.classList.remove('hidden');
    document.getElementById('kelaProblemText').textContent = `${b.name}: ${p.title || 'Ongelma'} - ${p.text}`;
    actions.innerHTML = '';

    if (p.kind === 'paperwork') this.renderPaperworkProblem(p, actions);
    if (p.kind === 'phoneQueue') this.renderPhoneProblem(p, actions);
    if (p.kind === 'attachment' || p.kind === 'incomeCheck') this.renderChoiceProblem(p, actions);
  },

  renderPaperworkProblem(problem, actions) {
    document.getElementById('kelaProblemHint').textContent =
      `Lomakkeet: ${problem.forms.filter(form => form.clicked).length}/${problem.forms.length}. Puhelu: ${problem.callDone ? 'valmis' : 'kesken tai tekemättä'}. Ratkaisu aikaistaa maksua 1 päivällä.`;

    problem.forms.forEach((form, index) => {
      const button = document.createElement('button');
      button.className = 'formButton';
      button.textContent = form.clicked ? `✓ ${form.label}` : form.label;
      button.disabled = form.clicked || problem.callActive;
      button.onclick = () => this.clickForm(index);
      actions.appendChild(button);
    });

    if (problem.needsCall) this.appendCallButton(problem, actions);
  },

  renderPhoneProblem(problem, actions) {
    document.getElementById('kelaProblemHint').textContent =
      `Puhelu pitää hoitaa ennen kuin hakemus liikkuu. Ratkaisu aikaistaa maksua 1 päivällä.`;
    this.appendCallButton(problem, actions);
  },

  appendCallButton(problem, actions) {
    const button = document.createElement('button');
    if (problem.callDone) {
      button.textContent = '✓ Puhelu hoidettu';
      button.disabled = true;
    } else if (problem.callActive) {
      button.textContent = `Puhelu käynnissä... ${problem.callSecondsLeft} s`;
      button.disabled = true;
    } else {
      button.textContent = `Soita Kelaan (${problem.callSecondsTotal} s)`;
      button.onclick = () => this.startCall();
    }
    actions.appendChild(document.createElement('br'));
    actions.appendChild(button);
  },

  renderChoiceProblem(problem, actions) {
    const wrongCount = problem.wrongChoices.length;
    document.getElementById('kelaProblemHint').textContent =
      `Valitse oikea vaihtoehto. Väärä valinta lisää käsittelyyn päivän. Vääriä valintoja: ${wrongCount}.`;

    problem.options.forEach((option, index) => {
      const button = document.createElement('button');
      const wrong = problem.wrongChoices.includes(index);
      button.className = wrong ? 'formButton kelaWrongChoice' : 'formButton';
      button.textContent = wrong ? `✗ ${option}` : option;
      button.disabled = wrong || problem.solved;
      button.onclick = () => this.chooseOption(index);
      actions.appendChild(button);
    });
  },

  render() {
    this.normalizeBenefits();
    ['toimeentulotuki', 'yleistuki', 'asumistuki'].forEach(type => {
      const button = document.getElementById(type + 'Button');
      const status = document.getElementById(type + 'Status');
      const range = document.getElementById(type + 'Range');
      if (button) button.disabled = this.benefits[type].applied;
      if (range) range.textContent = this.rangeText(type);
      if (status) status.textContent = this.status(type);
    });
    this.renderProblem();
  }
};

Game.register(Kela);
