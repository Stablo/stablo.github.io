const Account = {
  client: null,
  user: null,
  profile: null,
  scoreboard: [],
  busy: false,
  passwordRecoveryActive: false,
  message: 'Yhdistetään Supabaseen...',
  slot: 'main',
  maxScore: 1000000000,
  cooldowns: {},
  cooldownSeconds: {
    register: 10,
    login: 3,
    logout: 3,
    passwordReset: 20,
    passwordUpdate: 5,
    nickname: 5,
    save: 5,
    load: 5,
    scoreboard: 10
  },

  init() {
    document.getElementById('accountMain').insertAdjacentHTML(
      'beforeend',
      Game.section(
        'Tili ja tallennus',
        'accountContent',
        `
          <p id="accountStatus">Et ole kirjautunut.</p>
          <p id="accountMessage" class="smallHint">Yhdistetään Supabaseen...</p>

          <div class="accountGrid">
            <label>
              Sähköposti
              <input id="accountEmail" type="email" maxlength="254" autocomplete="email" placeholder="nimi@example.com">
            </label>
            <label>
              Salasana
              <input id="accountPassword" type="password" minlength="6" maxlength="128" autocomplete="current-password" placeholder="vähintään 6 merkkiä">
            </label>
          </div>

          <div class="accountActions">
            <button id="accountRegisterButton" onclick="Account.register()">Luo tili</button>
            <button id="accountLoginButton" onclick="Account.login()">Kirjaudu sisään</button>
            <button id="accountPasswordResetButton" onclick="Account.requestPasswordReset()">Unohtuiko salasana?</button>
            <button id="accountLogoutButton" onclick="Account.logout()">Kirjaudu ulos</button>
          </div>

          <hr>

          <div class="accountGrid">
            <label>
              Nimimerkki
              <input id="accountNickname" type="text" maxlength="24" autocomplete="nickname" placeholder="Seppo" pattern="[A-Za-z0-9ÅÄÖåäö _-]{2,24}" title="2-24 merkkiä: kirjaimet, numerot, välilyönti, _ ja -">
            </label>
            <div class="nicknameBox">
              <p id="nicknameStatus">Valitse nimimerkki, jotta näyt pistetaululla.</p>
              <button id="accountNicknameButton" onclick="Account.saveNickname()">Tallenna nimimerkki</button>
            </div>
          </div>

          <hr>

          <div class="accountActions">
            <button id="accountCloudSaveButton" onclick="SaveLoad.save()">Tallenna peli</button>
            <button id="accountCloudLoadButton" onclick="SaveLoad.load()">Lataa peli</button>
            <button id="accountResetButton" onclick="SaveLoad.reset()">Aloita alusta tallentamatta</button>
          </div>
          <p id="saveStatus" class="smallHint">Ei tallennustoimintoa käynnissä.</p>

          <hr>

          <h3>Pistetaulu</h3>
          <p class="smallHint">Pistetaulu näyttää tilien parhaimman pilvitallennetun juotujen oluiden määrän.</p>
          <ol id="scoreboardList" class="scoreboardList"></ol>
          <button id="accountRefreshScoreboardButton" onclick="Account.refreshScoreboard()">Päivitä pistetaulu</button>
        `
      )
    );

    const password = document.getElementById('accountPassword');
    if (password) {
      password.addEventListener('keydown', event => {
        if (event.key === 'Enter') this.login();
      });
    }

    this.connect();
    this.render();
  },

  isConfigured() {
    return typeof SupabaseConfig !== 'undefined'
      && !!SupabaseConfig.url
      && !!SupabaseConfig.publishableKey;
  },

  showNotice(title, body) {
    const old = document.getElementById('accountNoticeOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'accountNoticeOverlay';
    overlay.className = 'overlay accountNoticeOverlay';

    const box = document.createElement('div');
    box.className = 'overlayBox accountNoticeBox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');

    const heading = document.createElement('h2');
    heading.textContent = title;

    const text = document.createElement('p');
    text.textContent = body;

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Selvä';
    button.onclick = () => this.closeNotice();

    box.appendChild(heading);
    box.appendChild(text);
    box.appendChild(button);
    overlay.appendChild(box);

    overlay.addEventListener('click', event => {
      if (event.target === overlay) this.closeNotice();
    });

    document.body.appendChild(overlay);
  },

  closeNotice() {
    const overlay = document.getElementById('accountNoticeOverlay');
    if (overlay) overlay.remove();
  },

  explainError(error) {
    const raw = typeof error === 'string' ? error : error?.message || 'Tuntematon virhe.';
    const text = raw.toLowerCase();

    if (text.includes('invalid login credentials')) {
      return 'Sähköposti tai salasana ei täsmää. Tarkista kirjoitusasu ja yritä uudelleen.';
    }
    if (text.includes('already registered') || text.includes('user already registered')) {
      return 'Tällä sähköpostilla on jo tili. Kokeile kirjautua sisään.';
    }
    if (text.includes('email') && text.includes('invalid')) {
      return 'Sähköpostiosoite ei näytä toimivalta. Kirjoita osoite muodossa nimi@example.com.';
    }
    if (text.includes('password')) {
      return 'Salasana ei kelpaa. Käytä vähintään 6 merkkiä.';
    }
    if (text.includes('duplicate') || text.includes('23505')) {
      return 'Nimimerkki on jo käytössä. Valitse toinen.';
    }
    if (text.includes('odota hetki') || text.includes('too many') || text.includes('rate')) {
      return 'Teit tämän juuri äsken. Odota hetki ja yritä uudelleen.';
    }

    return raw;
  },

  setProblem(title, body) {
    this.message = body;
    this.showNotice(title, body);
    this.render();
  },

  cooldownLeft(action) {
    const until = this.cooldowns[action] || 0;
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  },

  startCooldown(action, seconds = this.cooldownSeconds[action] || 5) {
    this.cooldowns[action] = Date.now() + seconds * 1000;
    setTimeout(() => this.render(), seconds * 1000 + 50);
  },

  isCoolingDown(action, label) {
    const left = this.cooldownLeft(action);
    if (left <= 0) return false;

    this.setProblem('Odota hetki', `${label} on käytettävissä noin ${left} sekunnin kuluttua.`);
    return true;
  },

  validateEmail(email) {
    if (!email) return 'Anna sähköpostiosoite.';
    if (email.length > 254) return 'Sähköpostiosoite on liian pitkä.';
    if (/\s/.test(email)) return 'Sähköpostiosoitteessa ei voi olla välilyöntejä.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return 'Sähköpostiosoite ei näytä toimivalta. Kirjoita se muodossa nimi@example.com.';
    }

    const [local, domain] = email.split('@');
    if (!local || !domain || local.length > 64) return 'Sähköpostiosoite ei näytä toimivalta.';
    if (domain.length > 253 || domain.includes('..')) return 'Sähköpostin verkkotunnus ei näytä toimivalta.';
    if (!domain.split('.').every(part => /^[A-Za-z0-9-]{1,63}$/.test(part) && !part.startsWith('-') && !part.endsWith('-'))) {
      return 'Sähköpostin verkkotunnus ei näytä toimivalta.';
    }

    return '';
  },

  validatePassword(password) {
    if (!password) return 'Anna salasana.';
    if (password.length > 128) return 'Salasana on liian pitkä.';
    if (password.length < 6) return 'Salasanan pitää olla vähintään 6 merkkiä.';
    return '';
  },

  passwordRecoveryRedirectTo() {
    const href = window.location.href || '';
    if (!/^https?:\/\//.test(href)) return null;
    return window.location.origin + window.location.pathname + window.location.search;
  },

  async requestPasswordReset() {
    if (!this.client || this.busy) return;
    if (this.isCoolingDown('passwordReset', 'Salasanan palautus')) return;

    const email = document.getElementById('accountEmail')?.value.trim();
    const emailProblem = this.validateEmail(email);
    if (emailProblem) {
      this.setProblem('Sähköposti ei kelpaa', emailProblem);
      return;
    }

    this.startCooldown('passwordReset');
    this.busy = true;
    this.message = 'Lähetetään salasanan palautuslinkkiä...';
    this.render();

    const redirectTo = this.passwordRecoveryRedirectTo();
    const { error } = redirectTo
      ? await this.client.auth.resetPasswordForEmail(email, { redirectTo })
      : await this.client.auth.resetPasswordForEmail(email);

    this.busy = false;

    if (error) {
      this.setProblem('Palautuslinkkiä ei lähetetty', this.explainError(error));
      return;
    }

    this.message = 'Jos osoitteella on tili, salasanan palautuslinkki on lähetetty sähköpostiin.';
    this.showNotice(
      'Tarkista sähköposti',
      'Jos osoitteella on tili, saat linkin jolla voit asettaa uuden salasanan.'
    );
    this.render();
  },

  showPasswordResetOverlay() {
    const old = document.getElementById('passwordResetOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'passwordResetOverlay';
    overlay.className = 'overlay accountNoticeOverlay';

    const box = document.createElement('div');
    box.className = 'overlayBox accountNoticeBox passwordResetBox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');

    const heading = document.createElement('h2');
    heading.textContent = 'Aseta uusi salasana';

    const text = document.createElement('p');
    text.textContent = 'Kirjoita uusi salasana tälle tilille.';

    const passwordLabel = document.createElement('label');
    passwordLabel.textContent = 'Uusi salasana';
    const password = document.createElement('input');
    password.id = 'recoveryPassword';
    password.type = 'password';
    password.minLength = 6;
    password.maxLength = 128;
    password.autocomplete = 'new-password';
    passwordLabel.appendChild(password);

    const confirmLabel = document.createElement('label');
    confirmLabel.textContent = 'Uusi salasana uudelleen';
    const confirm = document.createElement('input');
    confirm.id = 'recoveryPasswordConfirm';
    confirm.type = 'password';
    confirm.minLength = 6;
    confirm.maxLength = 128;
    confirm.autocomplete = 'new-password';
    confirmLabel.appendChild(confirm);

    const actions = document.createElement('div');
    actions.className = 'accountActions';

    const save = document.createElement('button');
    save.id = 'recoveryPasswordSaveButton';
    save.type = 'button';
    save.textContent = 'Tallenna uusi salasana';
    save.onclick = () => this.updateRecoveredPassword();

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Sulje';
    cancel.onclick = () => this.closePasswordResetOverlay();

    actions.appendChild(save);
    actions.appendChild(cancel);

    box.appendChild(heading);
    box.appendChild(text);
    box.appendChild(passwordLabel);
    box.appendChild(confirmLabel);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    [password, confirm].forEach(input => {
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter') this.updateRecoveredPassword();
      });
    });

    password.focus();
  },

  closePasswordResetOverlay() {
    const overlay = document.getElementById('passwordResetOverlay');
    if (overlay) overlay.remove();
  },

  async updateRecoveredPassword() {
    if (!this.client || this.busy) return;
    if (this.isCoolingDown('passwordUpdate', 'Salasanan päivitys')) return;

    const password = document.getElementById('recoveryPassword')?.value || '';
    const confirm = document.getElementById('recoveryPasswordConfirm')?.value || '';

    const passwordProblem = this.validatePassword(password);
    if (passwordProblem) {
      this.setProblem('Salasana ei kelpaa', passwordProblem);
      return;
    }

    if (password !== confirm) {
      this.setProblem('Salasanat eivät täsmää', 'Kirjoita sama uusi salasana molempiin kenttiin.');
      return;
    }

    this.startCooldown('passwordUpdate');
    this.busy = true;
    this.message = 'Päivitetään salasanaa...';
    this.render();

    const { error } = await this.client.auth.updateUser({ password });

    this.busy = false;

    if (error) {
      this.setProblem('Salasanaa ei päivitetty', this.explainError(error));
      return;
    }

    this.passwordRecoveryActive = false;
    this.closePasswordResetOverlay();
    await this.refreshUser();
    this.message = 'Salasana päivitetty. Olet kirjautuneena sisään.';
    this.showNotice('Salasana päivitetty', 'Uusi salasana on nyt käytössä.');
    this.render();
  },

  connect() {
    if (!this.isConfigured()) {
      this.message = 'Supabase-asetukset puuttuvat. Pilvitallennus ei ole käytössä.';
      return;
    }

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      this.message = 'Supabase-kirjasto ei latautunut. Pilvitallennus toimii, kun peli on verkossa ja CDN latautuu.';
      return;
    }

    this.client = window.supabase.createClient(
      SupabaseConfig.url,
      SupabaseConfig.publishableKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    this.client.auth.onAuthStateChange((event, session) => {
      this.user = session?.user ?? null;
      if (!this.user) this.profile = null;
      if (this.user) this.loadProfile();
      if (event === 'PASSWORD_RECOVERY') {
        this.passwordRecoveryActive = true;
        this.message = 'Salasanan palautuslinkki hyväksytty. Aseta uusi salasana.';
        setTimeout(() => this.showPasswordResetOverlay(), 0);
      }
      if (event === 'SIGNED_OUT') this.passwordRecoveryActive = false;
      this.loadScoreboard();
      this.render();
    });

    this.refreshUser();
    this.loadScoreboard();
  },

  async refreshUser() {
    if (!this.client) return;

    const { data, error } = await this.client.auth.getSession();
    if (error) {
      this.message = error.message;
      this.render();
      return;
    }

    this.user = data.session?.user ?? null;
    if (this.user) await this.loadProfile();
    else this.profile = null;
    await this.loadScoreboard();
    this.message = this.user
      ? 'Kirjautuminen voimassa. Voit käyttää pilvitallennusta.'
      : 'Voit luoda tilin tai kirjautua sisään.';
    this.render();
  },

  cleanNickname(value) {
    return (value || '').trim().replace(/\s+/g, ' ');
  },

  isNicknameAllowed(value) {
    return /^[A-Za-z0-9ÅÄÖåäö _-]{2,24}$/.test(value);
  },

  currentRyypyt() {
    const value = Number(Game.state.ryypyt);
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(this.maxScore, Math.floor(value)));
  },

  setNicknameInput(value) {
    const input = document.getElementById('accountNickname');
    if (input) input.value = value || '';
  },

  async loadProfile() {
    if (!this.client || !this.user) return;

    let { data, error } = await this.client
      .from('profiles')
      .select('nickname, current_oluet, best_oluet, current_ryypyt, best_ryypyt, updated_at')
      .eq('user_id', this.user.id)
      .maybeSingle();

    if (error && this.isMissingColumnError(error, 'oluet')) {
      ({ data, error } = await this.client
        .from('profiles')
        .select('nickname, current_ryypyt, best_ryypyt, updated_at')
        .eq('user_id', this.user.id)
        .maybeSingle());
    }

    if (error) {
      this.message = error.message;
      this.render();
      return;
    }

    this.profile = data || null;
    if (this.profile) this.setNicknameInput(this.profile.nickname);
    this.render();
  },

  async saveNickname() {
    const user = await this.requireUser();
    if (!user || this.busy) return;
    if (this.isCoolingDown('nickname', 'Nimimerkin tallennus')) return;

    const nickname = this.cleanNickname(document.getElementById('accountNickname')?.value);
    if (!this.isNicknameAllowed(nickname)) {
      this.setProblem(
        'Nimimerkki ei kelpaa',
        'Nimimerkin pitää olla 2-24 merkkiä. Sallitut merkit: kirjaimet, numerot, välilyönti, _ ja -.'
      );
      return;
    }

    this.startCooldown('nickname');
    this.busy = true;
    this.message = 'Tallennetaan nimimerkkiä...';
    this.render();

    if (!this.profile) await this.loadProfile();

    const profileData = {
      nickname,
      updated_at: new Date().toISOString()
    };

    const query = this.profile
      ? this.client
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id)
      : this.client
        .from('profiles')
        .insert({ user_id: user.id, ...profileData });

    const { data, error } = await query
      .select('nickname, current_ryypyt, best_ryypyt, updated_at')
      .single();

    this.busy = false;

    if (error) {
      this.setProblem('Nimimerkkiä ei tallennettu', this.explainError(error));
      return;
    }

    this.profile = data;
    this.setNicknameInput(data.nickname);
    this.message = 'Nimimerkki tallennettu. Tallenna peli, jotta tulos päivittyy pistetaululle.';
    await this.loadScoreboard();
    this.render();
  },

  async loadScoreboard() {
    if (!this.client) return false;

    let { data, error } = await this.client
      .from('scoreboard')
      .select('nickname, oluet, updated_at')
      .order('oluet', { ascending: false })
      .order('updated_at', { ascending: true })
      .limit(10);

    if (error && this.isMissingColumnError(error, 'oluet')) {
      const fallback = await this.client
        .from('scoreboard')
        .select('nickname, ryypyt, updated_at')
        .order('ryypyt', { ascending: false })
        .order('updated_at', { ascending: true })
        .limit(10);

      data = (fallback.data || []).map(row => ({ ...row, oluet: row.ryypyt }));
      error = fallback.error;
      if (!error) {
        this.message = 'Pistetaulu käyttää vanhaa tietokantaa, kunnes Supabase SQL päivitetään.';
      }
    }

    if (error) {
      this.scoreboard = [];
      this.message = error.message;
      this.render();
      return false;
    }

    this.scoreboard = data || [];
    this.render();
    return true;
  },

  isMissingColumnError(error, column) {
    const text = (error?.message || error?.details || error?.hint || '').toLowerCase();
    return text.includes(column.toLowerCase()) && (
      text.includes('column') ||
      text.includes('does not exist') ||
      text.includes('not found')
    );
  },

  async refreshScoreboard() {
    if (this.isCoolingDown('scoreboard', 'Pistetaulun päivitys')) return;

    this.startCooldown('scoreboard');
    const ok = await this.loadScoreboard();
    if (!ok) this.showNotice('Pistetaulua ei voitu päivittää', this.explainError(this.message));
  },

  credentials({ registering = false } = {}) {
    const email = document.getElementById('accountEmail')?.value.trim();
    const password = document.getElementById('accountPassword')?.value;

    const emailProblem = this.validateEmail(email);
    if (emailProblem) {
      this.setProblem('Sähköposti ei kelpaa', emailProblem);
      return null;
    }

    const passwordProblem = this.validatePassword(password, registering);
    if (passwordProblem) {
      this.setProblem('Salasana ei kelpaa', passwordProblem);
      return null;
    }

    return { email, password };
  },

  async register() {
    if (!this.client || this.busy) return;
    if (this.isCoolingDown('register', 'Tilin luominen')) return;

    const credentials = this.credentials({ registering: true });
    if (!credentials) return;

    this.startCooldown('register');
    this.busy = true;
    this.message = 'Luodaan tiliä...';
    this.render();

    const redirectTo = this.passwordRecoveryRedirectTo();
    const signUpCredentials = redirectTo
      ? { ...credentials, options: { emailRedirectTo: redirectTo } }
      : credentials;

    let data = null;
    let error = null;

    try {
      ({ data, error } = await this.client.auth.signUp(signUpCredentials));
    } catch (caught) {
      error = caught;
    }

    this.busy = false;
    if (error) {
      this.setProblem('Tiliä ei luotu', this.explainError(error));
      return;
    }

    const successMessage = data.session
      ? 'Tili luotu ja olet kirjautunut sisään.'
      : 'Tili luotu. Jos sähköpostivahvistus on päällä, vahvista sähköposti ennen kirjautumista.';
    await this.refreshUser();
    this.message = successMessage;
    this.render();
  },

  async login() {
    if (!this.client || this.busy) return;
    if (this.isCoolingDown('login', 'Kirjautuminen')) return;

    const credentials = this.credentials();
    if (!credentials) return;

    this.startCooldown('login');
    this.busy = true;
    this.message = 'Kirjaudutaan sisään...';
    this.render();

    const { error } = await this.client.auth.signInWithPassword(credentials);

    this.busy = false;
    if (error) {
      this.setProblem('Kirjautuminen epäonnistui', this.explainError(error));
      return;
    }

    await this.refreshUser();
    this.message = 'Kirjautuminen onnistui.';
    this.render();
  },

  async logout() {
    if (!this.client || this.busy) return;
    if (this.isCoolingDown('logout', 'Uloskirjautuminen')) return;

    this.startCooldown('logout');
    this.busy = true;
    this.message = 'Kirjaudutaan ulos...';
    this.render();

    const { error } = await this.client.auth.signOut();

    this.busy = false;
    if (error) {
      this.setProblem('Uloskirjautuminen epäonnistui', this.explainError(error));
      return;
    }

    this.user = null;
    this.profile = null;
    this.message = 'Kirjauduit ulos.';
    await this.loadScoreboard();
    this.render();
  },

  async requireUser() {
    if (!this.client) {
      this.setProblem('Yhteys ei ole valmis', 'Supabase-yhteyttä ei ole. Tarkista, että sivu on verkossa ja yritä uudelleen.');
      return null;
    }

    if (!this.user) await this.refreshUser();

    if (!this.user) {
      this.setProblem('Kirjaudu ensin', 'Sinun pitää kirjautua sisään ennen tätä toimintoa.');
      return null;
    }

    return this.user;
  },

  async saveDataToCloud(saveData, successMessage) {
    const user = await this.requireUser();
    if (!user || this.busy) return false;

    this.busy = true;
    this.message = 'Tallennetaan pilveen...';
    this.render();

    const { error } = await this.client
      .from('game_saves')
      .upsert(
        {
          user_id: user.id,
          slot: this.slot,
          game_version: Game.version,
          save_data: saveData,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,slot' }
      );

    if (!error) {
      await this.loadProfile();
      await this.loadScoreboard();
    }

    this.busy = false;
    this.message = error
      ? this.explainError(error)
      : this.profile
        ? successMessage
        : `${successMessage} Lisää nimimerkki, jos haluat näkyä pistetaululla.`;
    if (error) this.showNotice('Tallennus epäonnistui', this.message);
    this.render();
    return !error;
  },

  async cloudSave() {
    if (typeof SaveLoad === 'undefined') return false;
    if (this.isCoolingDown('save', 'Tallennus')) return false;

    this.startCooldown('save');
    return this.saveDataToCloud(SaveLoad.getSaveData(), 'Nykyinen peli tallennettu pilveen.');
  },

  async cloudLoad() {
    const user = await this.requireUser();
    if (!user || this.busy) return false;
    if (this.isCoolingDown('load', 'Lataus')) return false;

    if (!confirm('Ladataanko pilvitallennus? Nykyinen tallentamaton tilanne korvautuu.')) return false;

    this.startCooldown('load');
    this.busy = true;
    this.message = 'Ladataan pilvestä...';
    this.render();

    const { data, error } = await this.client
      .from('game_saves')
      .select('save_data, updated_at, game_version')
      .eq('slot', this.slot)
      .maybeSingle();

    this.busy = false;

    if (error) {
      this.setProblem('Lataus epäonnistui', this.explainError(error));
      return false;
    }

    if (!data) {
      this.setProblem('Tallennusta ei löytynyt', 'Pilvessä ei ole vielä tallennusta tälle tilille.');
      return false;
    }

    SaveLoad.restoreData(data.save_data);
    this.message = `Pilvitallennus ladattu. Päivitetty: ${new Date(data.updated_at).toLocaleString('fi-FI')}.`;
    this.render();
    return true;
  },

  render() {
    const status = document.getElementById('accountStatus');
    const message = document.getElementById('accountMessage');
    if (!status || !message) return;

    const configured = this.isConfigured();
    const connected = !!this.client;
    const loggedIn = !!this.user;
    const registerCooling = this.cooldownLeft('register') > 0;
    const loginCooling = this.cooldownLeft('login') > 0;
    const logoutCooling = this.cooldownLeft('logout') > 0;
    const passwordResetCooling = this.cooldownLeft('passwordReset') > 0;
    const nicknameCooling = this.cooldownLeft('nickname') > 0;
    const saveCooling = this.cooldownLeft('save') > 0;
    const loadCooling = this.cooldownLeft('load') > 0;
    const scoreboardCooling = this.cooldownLeft('scoreboard') > 0;

    status.textContent = loggedIn
      ? this.profile
        ? `Kirjautuneena nimimerkillä: ${this.profile.nickname}`
        : 'Kirjautuneena. Valitse nimimerkki pistetaulua varten.'
      : 'Et ole kirjautunut.';
    message.textContent = this.message;

    const email = document.getElementById('accountEmail');
    const password = document.getElementById('accountPassword');
    const nickname = document.getElementById('accountNickname');
    const nicknameStatus = document.getElementById('nicknameStatus');
    const register = document.getElementById('accountRegisterButton');
    const login = document.getElementById('accountLoginButton');
    const passwordReset = document.getElementById('accountPasswordResetButton');
    const logout = document.getElementById('accountLogoutButton');
    const saveNickname = document.getElementById('accountNicknameButton');
    const cloudSave = document.getElementById('accountCloudSaveButton');
    const cloudLoad = document.getElementById('accountCloudLoadButton');
    const reset = document.getElementById('accountResetButton');
    const refreshScoreboard = document.getElementById('accountRefreshScoreboardButton');
    const scoreboardList = document.getElementById('scoreboardList');

    if (email) email.disabled = this.busy || loggedIn;
    if (password) password.disabled = this.busy || loggedIn;
    if (nickname) nickname.disabled = this.busy || !loggedIn;
    if (nicknameStatus) {
      if (this.profile && this.profile.best_oluet !== undefined) {
        nicknameStatus.textContent = `Paras pistetaulun tulos: ${Number(this.profile.best_oluet || 0).toLocaleString('fi-FI')} juotua olutta`;
      } else if (this.profile) {
        nicknameStatus.textContent = 'Tallenna peli, jotta juodut oluet päivittyvät pistetaululle.';
      } else {
        nicknameStatus.textContent = 'Valitse nimimerkki, jotta näyt pistetaululla.';
      }
    }
    if (register) register.disabled = this.busy || !configured || !connected || loggedIn || registerCooling;
    if (login) login.disabled = this.busy || !configured || !connected || loggedIn || loginCooling;
    if (passwordReset) passwordReset.disabled = this.busy || !configured || !connected || loggedIn || passwordResetCooling;
    if (logout) logout.disabled = this.busy || !connected || !loggedIn || logoutCooling;
    if (saveNickname) saveNickname.disabled = this.busy || !loggedIn || nicknameCooling;
    if (cloudSave) cloudSave.disabled = this.busy || !loggedIn || saveCooling;
    if (cloudLoad) cloudLoad.disabled = this.busy || !loggedIn || loadCooling;
    if (reset) reset.disabled = this.busy;
    if (refreshScoreboard) refreshScoreboard.disabled = this.busy || !connected || scoreboardCooling;

    if (scoreboardList) {
      scoreboardList.replaceChildren();

      if (!this.scoreboard.length) {
        const empty = document.createElement('li');
        empty.textContent = 'Pistetaulu on vielä tyhjä.';
        scoreboardList.appendChild(empty);
      } else {
        this.scoreboard.forEach(row => {
          const item = document.createElement('li');
          const name = document.createElement('span');
          const score = document.createElement('strong');
          const drinks = Number(row.oluet ?? row.ryypyt ?? 0);

          name.textContent = row.nickname || 'Nimetön';
          score.textContent = `${drinks.toLocaleString('fi-FI')} juotua olutta`;

          item.appendChild(name);
          item.appendChild(score);
          scoreboardList.appendChild(item);
        });
      }
    }
  }
};

Game.register(Account);
