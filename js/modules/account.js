const Account = {
  client: null,
  user: null,
  busy: false,
  message: 'Yhdistetään Supabaseen...',
  slot: 'main',

  init() {
    document.getElementById('gameMain').insertAdjacentHTML(
      'beforeend',
      Game.section(
        'Tili ja pilvitallennus',
        'accountContent',
        `
          <p id="accountStatus">Et ole kirjautunut.</p>
          <p id="accountMessage" class="smallHint">Yhdistetään Supabaseen...</p>

          <div class="accountGrid">
            <label>
              Sähköposti
              <input id="accountEmail" type="email" autocomplete="email" placeholder="nimi@example.com">
            </label>
            <label>
              Salasana
              <input id="accountPassword" type="password" autocomplete="current-password" placeholder="vähintään 6 merkkiä">
            </label>
          </div>

          <div class="accountActions">
            <button id="accountRegisterButton" onclick="Account.register()">Luo tili</button>
            <button id="accountLoginButton" onclick="Account.login()">Kirjaudu sisään</button>
            <button id="accountLogoutButton" onclick="Account.logout()">Kirjaudu ulos</button>
          </div>

          <hr>

          <p>Pilvitallennus käyttää Supabasen <strong>game_saves</strong>-taulua.</p>
          <div class="accountActions">
            <button id="accountCloudSaveButton" onclick="Account.cloudSave()">Tallenna nykyinen peli pilveen</button>
            <button id="accountCloudLoadButton" onclick="Account.cloudLoad()">Lataa pilvestä</button>
            <button id="accountUploadLocalButton" onclick="Account.uploadLocalSave()">Lähetä selaimen tallennus pilveen</button>
          </div>
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

    this.client.auth.onAuthStateChange((_event, session) => {
      this.user = session?.user ?? null;
      this.render();
    });

    this.refreshUser();
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
    this.message = this.user
      ? 'Kirjautuminen voimassa. Voit käyttää pilvitallennusta.'
      : 'Voit luoda tilin tai kirjautua sisään.';
    this.render();
  },

  credentials() {
    const email = document.getElementById('accountEmail')?.value.trim();
    const password = document.getElementById('accountPassword')?.value;

    if (!email || !password) {
      this.message = 'Anna sähköposti ja salasana.';
      this.render();
      return null;
    }

    return { email, password };
  },

  async register() {
    if (!this.client || this.busy) return;

    const credentials = this.credentials();
    if (!credentials) return;

    this.busy = true;
    this.message = 'Luodaan tiliä...';
    this.render();

    const { data, error } = await this.client.auth.signUp(credentials);

    this.busy = false;
    if (error) {
      this.message = error.message;
      this.render();
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

    const credentials = this.credentials();
    if (!credentials) return;

    this.busy = true;
    this.message = 'Kirjaudutaan sisään...';
    this.render();

    const { error } = await this.client.auth.signInWithPassword(credentials);

    this.busy = false;
    if (error) {
      this.message = error.message;
      this.render();
      return;
    }

    await this.refreshUser();
    this.message = 'Kirjautuminen onnistui.';
    this.render();
  },

  async logout() {
    if (!this.client || this.busy) return;

    this.busy = true;
    this.message = 'Kirjaudutaan ulos...';
    this.render();

    const { error } = await this.client.auth.signOut();

    this.busy = false;
    if (error) {
      this.message = error.message;
      this.render();
      return;
    }

    this.user = null;
    this.message = 'Kirjauduit ulos.';
    this.render();
  },

  async requireUser() {
    if (!this.client) {
      this.message = 'Supabase-yhteyttä ei ole.';
      this.render();
      return null;
    }

    if (!this.user) await this.refreshUser();

    if (!this.user) {
      this.message = 'Kirjaudu ensin sisään.';
      this.render();
      return null;
    }

    return this.user;
  },

  async saveDataToCloud(saveData, successMessage) {
    const user = await this.requireUser();
    if (!user || this.busy) return;

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

    this.busy = false;
    this.message = error ? error.message : successMessage;
    this.render();
  },

  async cloudSave() {
    if (typeof SaveLoad === 'undefined') return;
    await this.saveDataToCloud(SaveLoad.getSaveData(), 'Nykyinen peli tallennettu pilveen.');
  },

  async uploadLocalSave() {
    if (typeof SaveLoad === 'undefined') return;

    const raw = localStorage.getItem(SaveLoad.storageKey);
    if (!raw) {
      this.message = 'Selaimessa ei ole paikallista tallennusta lähetettäväksi.';
      this.render();
      return;
    }

    try {
      await this.saveDataToCloud(JSON.parse(raw), 'Selaimen paikallinen tallennus lähetetty pilveen.');
    } catch (_error) {
      this.message = 'Paikallista tallennusta ei voitu lukea.';
      this.render();
    }
  },

  async cloudLoad() {
    const user = await this.requireUser();
    if (!user || this.busy) return;

    if (!confirm('Ladataanko pilvitallennus? Nykyinen tallentamaton tilanne korvautuu.')) return;

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
      this.message = error.message;
      this.render();
      return;
    }

    if (!data) {
      this.message = 'Pilvessä ei ole vielä tallennusta tälle tilille.';
      this.render();
      return;
    }

    SaveLoad.restoreData(data.save_data);
    localStorage.setItem(SaveLoad.storageKey, JSON.stringify(data.save_data));
    this.message = `Pilvitallennus ladattu. Päivitetty: ${new Date(data.updated_at).toLocaleString('fi-FI')}.`;
    this.render();
  },

  hasLocalSave() {
    return typeof SaveLoad !== 'undefined' && !!localStorage.getItem(SaveLoad.storageKey);
  },

  render() {
    const status = document.getElementById('accountStatus');
    const message = document.getElementById('accountMessage');
    if (!status || !message) return;

    const configured = this.isConfigured();
    const connected = !!this.client;
    const loggedIn = !!this.user;

    status.textContent = loggedIn
      ? `Kirjautuneena: ${this.user.email || this.user.id}`
      : 'Et ole kirjautunut.';
    message.textContent = this.message;

    const email = document.getElementById('accountEmail');
    const password = document.getElementById('accountPassword');
    const register = document.getElementById('accountRegisterButton');
    const login = document.getElementById('accountLoginButton');
    const logout = document.getElementById('accountLogoutButton');
    const cloudSave = document.getElementById('accountCloudSaveButton');
    const cloudLoad = document.getElementById('accountCloudLoadButton');
    const uploadLocal = document.getElementById('accountUploadLocalButton');

    if (email) email.disabled = this.busy || loggedIn;
    if (password) password.disabled = this.busy || loggedIn;
    if (register) register.disabled = this.busy || !configured || !connected || loggedIn;
    if (login) login.disabled = this.busy || !configured || !connected || loggedIn;
    if (logout) logout.disabled = this.busy || !connected || !loggedIn;
    if (cloudSave) cloudSave.disabled = this.busy || !loggedIn;
    if (cloudLoad) cloudLoad.disabled = this.busy || !loggedIn;
    if (uploadLocal) uploadLocal.disabled = this.busy || !loggedIn || !this.hasLocalSave();
  }
};

Game.register(Account);
