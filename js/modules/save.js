const SaveLoad = {
  localKey: 'villisikaSeppoAutosaveV1',
  autoSaveReady: false,
  restoring: false,
  localTimer: null,
  cloudTimer: null,
  cloudAutosaveBusy: false,
  cloudAutosaveForced: false,
  lastLocalWrite: 0,
  lastCloudWrite: 0,
  cloudFailureCount: 0,
  lastAutoSaveJson: '',
  lastLocalStatus: null,
  lastCloudStatus: null,
  localDebounceMs: 800,
  localMinIntervalMs: 2500,
  cloudDebounceMs: 2500,
  cloudMinIntervalMs: 45000,
  cloudForcedMinIntervalMs: 6500,

  init() {
    const restored = this.restoreLocalAutoSave();
    this.autoSaveReady = true;
    this.requestAutoSave(restored ? 'autosave-loaded' : 'startup');
    if (!restored) this.reportAutoSave();
  },

  maxScore() {
    return typeof Account !== 'undefined' && Account.maxScore ? Account.maxScore : 1000000000;
  },

  clampNumber(value, min, max, fallback = min) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, number));
  },

  clampInteger(value, min, max, fallback = min) {
    return Math.floor(this.clampNumber(value, min, max, fallback));
  },

  sanitizeSaveData(data) {
    const clean = JSON.parse(JSON.stringify(data || {}));
    clean.state = clean.state || {};

    const s = clean.state;
    const maxScore = this.maxScore();
    const maxResource = 1000000000;

    s.ryypyt = this.clampInteger(s.ryypyt, 0, maxScore, 0);
    s.euros = this.clampNumber(s.euros, 0, maxResource, 0);
    s.oluet = this.clampInteger(s.oluet, 0, maxResource, 0);
    s.fullCans = this.clampInteger(s.fullCans, 0, maxResource, 0);
    s.emptyCans = this.clampInteger(s.emptyCans, 0, maxResource, 0);
    s.ryypytPerOlut = this.clampInteger(s.ryypytPerOlut, 1, 1000000, 1);
    s.manualDrinksForTiiviste = this.clampInteger(s.manualDrinksForTiiviste, 0, 49, 0);
    s.hangover = this.clampNumber(s.hangover, 0, 100, 0);
    s.stress = this.clampNumber(s.stress ?? 0, 0, 100, 0);
    s.cigarettes = this.clampInteger(s.cigarettes, 0, maxResource, 0);
    s.day = this.clampInteger(s.day, 1, maxResource, 1);
    s.dayProgressSeconds = this.clampNumber(s.dayProgressSeconds, 0, 86400, 0);
    s.collapseCount = this.clampInteger(s.collapseCount ?? 0, 0, 3, 0);
    s.gameOver = !!s.gameOver;

    if (typeof s.eventLog !== 'string') s.eventLog = 'Ei tapahtumia vielä.';
    s.eventLog = s.eventLog.slice(0, 600);

    if (clean.helpers) {
      Object.values(clean.helpers).forEach(helper => {
        helper.count = this.clampInteger(helper.count, 0, 1000000, 0);
        helper.cost = this.clampInteger(helper.cost, 1, maxResource, 1);
      });
    }

    if (Array.isArray(clean.marketItems)) {
      clean.marketItems.forEach(item => {
        item.owned = this.clampInteger(item.owned, 0, maxResource, 0);
      });
    }

    if (clean.economy) {
      clean.economy.index = this.clampNumber(clean.economy.index, 0.85, 1.40, 1);
      clean.economy.delta = this.clampNumber(clean.economy.delta, -1, 1, 0);
      clean.economy.source = ['global', 'local'].includes(clean.economy.source) ? clean.economy.source : 'local';
      clean.economy.lastShiftAt = typeof clean.economy.lastShiftAt === 'string' ? clean.economy.lastShiftAt.slice(0, 64) : null;
      clean.economy.nextShiftAt = typeof clean.economy.nextShiftAt === 'string' ? clean.economy.nextShiftAt.slice(0, 64) : null;
      clean.economy.lastFetchAt = typeof clean.economy.lastFetchAt === 'string' ? clean.economy.lastFetchAt.slice(0, 64) : null;
      clean.economy.startingAdjusted = !!clean.economy.startingAdjusted;
      clean.economy.history = Array.isArray(clean.economy.history) ? clean.economy.history.slice(-20) : [];
    }

    if (clean.gamblingKaraokeEvent) {
      const event = clean.gamblingKaraokeEvent;
      event.active = !!event.active;
      event.activeUntilDay = this.clampInteger(event.activeUntilDay, 0, maxResource, 0);
      event.nextCheckAt = this.clampNumber(event.nextCheckAt, 0, 9999999999999, 0);
      event.openedAt = this.clampNumber(event.openedAt, 0, 9999999999999, 0);
    }

    return clean;
  },

  getSaveData() {
    const data = {
      state: Game.state,
      helpers: Helpers.helpers,
      beerPackages: BeerShop.packages,
      averagePriceHistory: BeerShop.averagePriceHistory,
      marketItems: Supermarket.items,
      economy: typeof Economy !== 'undefined' ? Economy.stateForSave() : null,
      kelaBenefits: Kela.benefits,
      kelaActive: Kela.activeProblem,
      eventCost: Events.cost,
      jobs: Jobs.jobs,
      cooldowns: Jobs.cooldowns,
      returnsCooldown: Returns.puulantoriCooldown,
      upgradesPurchased: typeof Upgrades !== 'undefined' ? Upgrades.purchased : {},
      gamblingBet: typeof Gambling !== 'undefined' ? Gambling.bet : 25,
      gamblingLog: typeof Gambling !== 'undefined' ? Gambling.log : '',
      gamblingKaraokeEvent: typeof Gambling !== 'undefined' ? Gambling.karaokeEvent : null
    };

    return this.sanitizeSaveData(data);
  },

  restoreData(data) {
    if (!data) return false;
    data = this.sanitizeSaveData(data);

    Object.assign(Game.state, data.state || {});

    if (data.helpers) {
      Helpers.helpers = data.helpers;
      if (typeof Helpers.normalize === 'function') Helpers.normalize();
    }
    if (data.beerPackages) BeerShop.packages = data.beerPackages;
    if (data.averagePriceHistory) BeerShop.averagePriceHistory = data.averagePriceHistory;
    if (data.marketItems) data.marketItems.forEach((item, i) => {
      if (Supermarket.items[i]) Supermarket.items[i].owned = item.owned ?? 0;
    });
    if (typeof Economy !== 'undefined') Economy.restoreState(data.economy);
    if (data.kelaBenefits) Kela.benefits = data.kelaBenefits;
    Kela.activeProblem = data.kelaActive ?? null;
    Events.cost = data.eventCost ?? 20;
    if (data.jobs) Jobs.jobs = data.jobs;
    if (data.cooldowns) Jobs.cooldowns = data.cooldowns;
    Returns.puulantoriCooldown = data.returnsCooldown ?? 0;

    if (typeof Upgrades !== 'undefined' && data.upgradesPurchased) {
      Upgrades.purchased = data.upgradesPurchased;
      Upgrades.items.forEach(item => {
        if (Upgrades.purchased[item.id] === undefined) Upgrades.purchased[item.id] = false;
      });
    }

    if (typeof Gambling !== 'undefined') {
      Gambling.bet = data.gamblingBet ?? 25;
      Gambling.log = data.gamblingLog || Gambling.log;
      if (data.gamblingKaraokeEvent) {
        Gambling.karaokeEvent = data.gamblingKaraokeEvent;
        Gambling.normalizeKaraokeEvent();
      }
    }

    Game.update();
    return true;
  },

  readLocalAutoSave() {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(this.localKey);
    } catch (error) {
      return null;
    }
  },

  restoreLocalAutoSave() {
    const raw = this.readLocalAutoSave();
    if (!raw) return false;

    try {
      const payload = JSON.parse(raw);
      const saveData = payload && payload.saveData ? payload.saveData : payload;
      this.restoring = true;
      const ok = this.restoreData(saveData);
      this.restoring = false;

      if (ok) {
        this.lastAutoSaveJson = raw;
        this.lastLocalWrite = Date.now();
        this.lastLocalStatus = this.formatStatusTime();
        this.report('Automaattitallennus ladattu selaimesta.');
      }

      return ok;
    } catch (error) {
      this.restoring = false;
      this.clearLocalAutoSave();
      this.report('Selainautosave oli viallinen ja tyhjennettiin.');
      return false;
    }
  },

  writeLocalAutoSave() {
    try {
      if (typeof localStorage === 'undefined') return false;
      const payload = {
        gameVersion: Game.version,
        savedAt: new Date().toISOString(),
        saveData: this.getSaveData()
      };
      const json = JSON.stringify(payload);
      if (json === this.lastAutoSaveJson) return false;

      localStorage.setItem(this.localKey, json);
      this.lastAutoSaveJson = json;
      this.lastLocalWrite = Date.now();
      this.lastLocalStatus = this.formatStatusTime();
      return true;
    } catch (error) {
      return false;
    }
  },

  clearLocalAutoSave() {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(this.localKey);
    } catch (error) {
      // localStorage can be unavailable in private or restricted browser modes.
    }
    this.lastAutoSaveJson = '';
    this.lastLocalStatus = null;
  },

  clearAutoSaveTimers() {
    if (this.localTimer) {
      clearTimeout(this.localTimer);
      this.localTimer = null;
    }
    if (this.cloudTimer) {
      clearTimeout(this.cloudTimer);
      this.cloudTimer = null;
    }
  },

  requestAutoSave(reason = 'update', options = {}) {
    if (!this.autoSaveReady || this.restoring) return;
    if (options.forceCloud) this.cloudAutosaveForced = true;

    if (this.localTimer) clearTimeout(this.localTimer);
    this.localTimer = setTimeout(() => this.flushLocalAutoSave(reason), this.localDebounceMs);
  },

  flushLocalAutoSave(reason = 'update') {
    this.localTimer = null;
    if (!this.autoSaveReady || this.restoring) return;

    const elapsed = Date.now() - this.lastLocalWrite;
    if (elapsed < this.localMinIntervalMs) {
      this.localTimer = setTimeout(() => this.flushLocalAutoSave(reason), this.localMinIntervalMs - elapsed);
      return;
    }

    this.writeLocalAutoSave();
    this.reportAutoSave();
    this.scheduleCloudAutoSave(reason);
  },

  scheduleCloudAutoSave(reason = 'update') {
    if (!this.canUseCloudAutoSave()) return;
    if (this.cloudTimer) clearTimeout(this.cloudTimer);
    this.cloudTimer = setTimeout(() => this.flushCloudAutoSave(reason), this.cloudDebounceMs);
  },

  canUseCloudAutoSave() {
    return typeof Account !== 'undefined'
      && Account.client
      && Account.user
      && !Account.busy
      && !this.cloudAutosaveBusy;
  },

  async flushCloudAutoSave(reason = 'update') {
    this.cloudTimer = null;
    if (!this.canUseCloudAutoSave()) return false;

    const now = Date.now();
    const minimumInterval = this.cloudAutosaveForced ? this.cloudForcedMinIntervalMs : this.cloudMinIntervalMs;
    const remaining = minimumInterval - (now - this.lastCloudWrite);
    if (remaining > 0) {
      this.cloudTimer = setTimeout(() => this.flushCloudAutoSave(reason), remaining);
      return false;
    }

    this.cloudAutosaveBusy = true;
    this.lastCloudWrite = now;
    const saveData = this.getSaveData();
    const { error } = await Account.client
      .from('game_saves')
      .upsert(
        {
          user_id: Account.user.id,
          slot: Account.slot,
          game_version: Game.version,
          save_data: saveData,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,slot' }
      );

    this.cloudAutosaveBusy = false;

    if (error) {
      this.cloudFailureCount += 1;
      if (this.cloudAutosaveForced) {
        const retryDelay = Math.min(60000, this.cloudForcedMinIntervalMs * this.cloudFailureCount);
        this.cloudTimer = setTimeout(() => this.flushCloudAutoSave(reason), retryDelay);
      }
      return false;
    }

    this.cloudFailureCount = 0;
    this.lastCloudStatus = this.formatStatusTime();
    this.cloudAutosaveForced = false;
    this.reportAutoSave();
    return true;
  },

  formatStatusTime() {
    return new Date().toLocaleTimeString('fi-FI', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },

  reportAutoSave() {
    const browserPart = this.lastLocalStatus ? `selain ${this.lastLocalStatus}` : 'selain valmiina';
    const cloudPart = this.lastCloudStatus ? `, pilvi ${this.lastCloudStatus}` : '';
    this.report(`Automaattitallennus käytössä: ${browserPart}${cloudPart}.`);
  },

  report(message) {
    const status = document.getElementById('saveStatus');
    if (status) status.textContent = message;
  },

  async save() {
    if (typeof Account === 'undefined' || !Account.client) {
      this.report('Pilvitallennus ei ole käytettävissä.');
      return false;
    }

    const ok = await Account.cloudSave();
    if (ok) {
      this.lastCloudWrite = Date.now();
      this.lastCloudStatus = this.formatStatusTime();
      this.cloudAutosaveForced = false;
      this.cloudFailureCount = 0;
    }
    this.report(Account.message);
    return ok;
  },

  async load() {
    if (typeof Account === 'undefined' || !Account.client) {
      this.report('Pilvitallennus ei ole käytettävissä.');
      return false;
    }

    const ok = await Account.cloudLoad();
    this.report(Account.message);
    if (ok) this.requestAutoSave('cloud-load');
    return ok;
  },

  reset() {
    if (!confirm('Aloitetaanko nykyinen selainistunto alusta? Selainautosave tyhjennetään, mutta pilvitallennusta ei poisteta.')) return;
    this.clearAutoSaveTimers();
    this.clearLocalAutoSave();
    location.reload();
  }
};

Game.register(SaveLoad);
