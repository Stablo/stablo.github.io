const Economy = {
  minIndex: 0.85,
  maxIndex: 1.40,
  index: 1,
  source: 'local',
  status: 'Odottaa pilvitaloutta.',
  delta: 0,
  lastShiftAt: null,
  nextShiftAt: null,
  lastFetchAt: null,
  nextRefreshAt: 0,
  refreshIntervalMs: 15 * 60 * 1000,
  fetchInFlight: false,
  startingAdjusted: false,
  history: [],

  init() {
    this.normalize();

    document.getElementById('moneyMain').insertAdjacentHTML(
      'afterbegin',
      Game.section(
        'Talous',
        'economyContent',
        `
          <p>Eurohinnat ja euromaksut elävät yhteisen pilvitalouden mukana. Ryypyt, apurit ja parannukset eivät.</p>
          <p>Talousindeksi: <strong><span id="economyIndex">100 %</span></strong></p>
          <p>Tila: <strong><span id="economyMood">Tavallinen nihkeys</span></strong></p>
          <p>Seuraava indeksipäivitys: <span id="economyNextAt">haetaan...</span></p>
          <p>Lähde: <span id="economySource">Paikallinen varatila</span></p>
          <div id="economyEffects" class="smallHint"></div>
          <button id="economyRefreshButton" onclick="Economy.refreshGlobal(true)">Päivitä talous</button>
        `
      )
    );

    this.refreshGlobal(true);
  },

  normalize() {
    const storedIndex = Number(this.index);
    this.index = Number.isFinite(storedIndex) ? this.clampIndex(storedIndex) : 1;
    this.delta = Number.isFinite(Number(this.delta)) ? Number(this.delta) : 0;
    this.startingAdjusted = !!this.startingAdjusted;

    if (!Array.isArray(this.history) || !this.history.length) {
      this.history = [{ at: new Date().toISOString(), index: this.index, delta: 0 }];
    }
  },

  clampIndex(value) {
    return Game.clamp(Number(value), this.minIndex, this.maxIndex);
  },

  getClient() {
    if (typeof Account !== 'undefined' && Account.client) return Account.client;
    return null;
  },

  async refreshGlobal(force = false) {
    if (this.fetchInFlight) return false;
    if (!force && Date.now() < this.nextRefreshAt) return false;

    const client = this.getClient();
    if (!client || typeof client.rpc !== 'function') {
      this.status = 'Pilvitalous odottaa Supabase-yhteyttä.';
      this.nextRefreshAt = Date.now() + 30000;
      return false;
    }

    this.fetchInFlight = true;
    this.status = 'Haetaan pilvitaloutta...';
    this.render();

    let response;
    try {
      response = await client.rpc('get_global_economy');
    } catch (caught) {
      response = { data: null, error: caught };
    }

    const { data, error } = response;
    this.fetchInFlight = false;

    if (error) {
      this.status = 'Pilvitalous ei vastaa, käytössä viimeisin paikallinen arvo.';
      this.source = this.source === 'global' ? 'global' : 'local';
      this.nextRefreshAt = Date.now() + 60000;
      this.render();
      return false;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      this.status = 'Pilvitalous palautti tyhjän vastauksen.';
      this.nextRefreshAt = Date.now() + 60000;
      this.render();
      return false;
    }

    this.applyGlobalState(row);
    this.scheduleNextRefresh();
    this.render();
    if (typeof Game !== 'undefined' && typeof Game.update === 'function') Game.update();
    return true;
  },

  applyGlobalState(row) {
    const value = Number(row.index ?? row.current_index);
    if (Number.isFinite(value)) this.index = this.clampIndex(value);

    this.source = 'global';
    this.status = 'Pilvitalous käytössä: sama arvo kaikille pelaajille.';
    this.delta = Number(row.delta || 0);
    this.lastShiftAt = row.last_shift_at || row.lastShiftAt || this.lastShiftAt;
    this.nextShiftAt = row.next_shift_at || row.nextShiftAt || this.nextShiftAt;
    this.lastFetchAt = new Date().toISOString();
    this.history = this.parseHistory(row.history);
    this.adjustStartingEuros();
  },

  parseHistory(history) {
    if (Array.isArray(history)) return history.slice(-30);
    if (typeof history === 'string') {
      try {
        const parsed = JSON.parse(history);
        if (Array.isArray(parsed)) return parsed.slice(-30);
      } catch (error) {
        return this.history;
      }
    }
    return this.history;
  },

  scheduleNextRefresh() {
    const nextShift = this.nextShiftAt ? new Date(this.nextShiftAt).getTime() : 0;
    const untilShift = nextShift ? nextShift - Date.now() + 15000 : this.refreshIntervalMs;
    const delay = Game.clamp(untilShift, 60000, this.refreshIntervalMs);
    this.nextRefreshAt = Date.now() + delay;
  },

  adjustStartingEuros() {
    const base = Game.config.startingEuros || 200;
    if (this.startingAdjusted) return;
    if (Game.state.day !== 1) return;
    if (Math.abs(Number(Game.state.euros) - base) > 0.001) return;

    const multiplier = 0.75 + this.index * 0.25;
    Game.state.euros = Number((base * multiplier).toFixed(2));
    this.startingAdjusted = true;
  },

  tick() {
    if (Date.now() >= this.nextRefreshAt) this.refreshGlobal(false);
  },

  mood() {
    if (this.index <= 0.92) return 'Halpuutuspaniikki';
    if (this.index <= 1.05) return 'Tavallinen nihkeys';
    if (this.index <= 1.20) return 'Hintahumppa';
    if (this.index <= 1.32) return 'Kuitinpolttokausi';
    return 'Indeksihorkka';
  },

  weightedMultiplier(weight) {
    this.normalize();
    return Math.max(0.5, 1 + (this.index - 1) * weight);
  },

  priceMultiplier(kind = 'general') {
    const weights = {
      beer: 1.00,
      market: 0.80,
      general: 1.00
    };
    return this.weightedMultiplier(weights[kind] ?? weights.general);
  },

  paymentMultiplier(kind = 'general') {
    const weights = {
      jobs: 0.70,
      kela: 0.50,
      general: 0.60
    };
    return this.weightedMultiplier(weights[kind] ?? weights.general);
  },

  scalePrice(amount, kind = 'general') {
    return Number((Number(amount) * this.priceMultiplier(kind)).toFixed(2));
  },

  scalePayment(amount, kind = 'general') {
    return Number((Number(amount) * this.paymentMultiplier(kind)).toFixed(2));
  },

  stateForSave() {
    this.normalize();
    return {
      index: this.index,
      source: this.source,
      delta: this.delta,
      lastShiftAt: this.lastShiftAt,
      nextShiftAt: this.nextShiftAt,
      lastFetchAt: this.lastFetchAt,
      startingAdjusted: this.startingAdjusted,
      history: this.history
    };
  },

  restoreState(data) {
    if (!data) return;

    this.startingAdjusted = !!data.startingAdjusted;
    if (this.source !== 'global') {
      const value = Number(data.index ?? data.fallbackIndex);
      if (Number.isFinite(value)) this.index = this.clampIndex(value);
      this.source = data.source === 'global' ? 'local' : (data.source || 'local');
      this.delta = Number(data.delta || 0);
      this.lastShiftAt = data.lastShiftAt || data.last_shift_at || null;
      this.nextShiftAt = data.nextShiftAt || data.next_shift_at || null;
      this.history = this.parseHistory(data.history);
      this.status = 'Käytössä tallennuksen viimeisin talousarvo, kunnes pilvi vastaa.';
    }

    this.normalize();
    this.nextRefreshAt = 0;
    this.refreshGlobal(true);
  },

  formatDateTime(value) {
    if (!value) return 'haetaan...';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'haetaan...';
    return date.toLocaleString('fi-FI', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  sourceLabel() {
    return this.source === 'global' ? 'Pilvi (kaikille sama)' : 'Paikallinen varatila';
  },

  render() {
    const index = document.getElementById('economyIndex');
    const mood = document.getElementById('economyMood');
    const nextAt = document.getElementById('economyNextAt');
    const source = document.getElementById('economySource');
    const effects = document.getElementById('economyEffects');
    const refresh = document.getElementById('economyRefreshButton');

    if (!index || !mood || !nextAt || !source || !effects) return;

    const deltaText = this.delta === 0 ? '0 %' : `${this.delta > 0 ? '+' : ''}${Math.round(this.delta * 100)} %`;
    index.textContent = `${Math.round(this.index * 100)} %`;
    mood.textContent = this.mood();
    nextAt.textContent = this.formatDateTime(this.nextShiftAt);
    source.textContent = this.sourceLabel();
    effects.textContent =
      `${this.status} Muutos: ${deltaText}. Olut ${Math.round(this.priceMultiplier('beer') * 100)} %, market ${Math.round(this.priceMultiplier('market') * 100)} %, Kela ${Math.round(this.paymentMultiplier('kela') * 100)} %, pikkukeikat ${Math.round(this.paymentMultiplier('jobs') * 100)} %. Päivitys noin klo 06.00 Suomen aikaa.`;

    if (refresh) refresh.disabled = this.fetchInFlight;
  }
};

Game.register(Economy);
