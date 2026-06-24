const Account = {
  client: null,
  user: null,
  profile: null,
  scoreboard: [],
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

          <div class="accountGrid">
            <label>
              Nimimerkki
              <input id="accountNickname" type="text" maxlength="24" autocomplete="nickname" placeholder="Seppo">
            </label>
            <div class="nicknameBox">
              <p id="nicknameStatus">Valitse nimimerkki, jotta näyt pistetaululla.</p>
              <button id="accountNicknameButton" onclick="Account.saveNickname()">Tallenna nimimerkki</button>
            </div>
          </div>

          <hr>

          <div class="accountActions">
            <button id="accountCloudSaveButton" onclick="Account.cloudSave()">Tallenna nykyinen peli pilveen</button>
            <button id="accountCloudLoadButton" onclick="Account.cloudLoad()">Lataa pilvestä</button>
          </div>

          <hr>

          <h3>Pistetaulu</h3>
          <p class="smallHint">Pistetaulu näyttää tilien viimeisimmän pilvitallennetun ryyppymäärän.</p>
          <ol id="scoreboardList" class="scoreboardList"></ol>
          <button id="accountRefreshScoreboardButton" onclick="Account.loadScoreboard()">Päivitä pistetaulu</button>
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
      if (!this.user) this.profile = null;
      if (this.user) this.loadProfile();
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

  currentRyypyt() {
    return Math.max(0, Math.floor(Game.state.ryypyt || 0));
  },

  setNicknameInput(value) {
    const input = document.getElementById('accountNickname');
    if (input) input.value = value || '';
  },

  async loadProfile() {
    if (!this.client || !this.user) return;

    const { data, error } = await this.client
      .from('profiles')
      .select('nickname, ryypyt, updated_at')
      .eq('user_id', this.user.id)
      .maybeSingle();

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

    const nickname = this.cleanNickname(document.getElementById('accountNickname')?.value);
    if (nickname.length < 2 || nickname.length > 24) {
      this.message = 'Nimimerkin pitää olla 2-24 merkkiä.';
      this.render();
      return;
    }

    this.busy = true;
    this.message = 'Tallennetaan nimimerkkiä...';
    this.render();

    const { data, error } = await this.client
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          nickname,
          ryypyt: this.currentRyypyt(),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )
      .select('nickname, ryypyt, updated_at')
      .single();

    this.busy = false;

    if (error) {
      this.message = error.code === '23505'
        ? 'Nimimerkki on jo käytössä. Valitse toinen.'
        : error.message;
      this.render();
      return;
    }

    this.profile = data;
    this.setNicknameInput(data.nickname);
    this.message = 'Nimimerkki tallennettu.';
    await this.loadScoreboard();
    this.render();
  },

  async updateScoreboardScore() {
    if (!this.client || !this.user || !this.profile) return;

    const { data, error } = await this.client
      .from('profiles')
      .update({
        ryypyt: this.currentRyypyt(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', this.user.id)
      .select('nickname, ryypyt, updated_at')
      .single();

    if (!error && data) this.profile = data;
  },

  async loadScoreboard() {
    if (!this.client) return;

    const { data, error } = await this.client
      .from('profiles')
      .select('nickname, ryypyt, updated_at')
      .order('ryypyt', { ascending: false })
      .order('updated_at', { ascending: true })
      .limit(10);

    if (error) {
      this.scoreboard = [];
      this.message = error.message;
      this.render();
      return;
    }

    this.scoreboard = data || [];
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
    this.profile = null;
    this.message = 'Kirjauduit ulos.';
    await this.loadScoreboard();
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
      await this.updateScoreboardScore();
      await this.loadScoreboard();
    }

    this.busy = false;
    this.message = error
      ? error.message
      : this.profile
        ? successMessage
        : `${successMessage} Lisää nimimerkki, jos haluat näkyä pistetaululla.`;
    this.render();
    return !error;
  },

  async cloudSave() {
    if (typeof SaveLoad === 'undefined') return false;
    return this.saveDataToCloud(SaveLoad.getSaveData(), 'Nykyinen peli tallennettu pilveen.');
  },

  async cloudLoad() {
    const user = await this.requireUser();
    if (!user || this.busy) return false;

    if (!confirm('Ladataanko pilvitallennus? Nykyinen tallentamaton tilanne korvautuu.')) return false;

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
      return false;
    }

    if (!data) {
      this.message = 'Pilvessä ei ole vielä tallennusta tälle tilille.';
      this.render();
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
    const logout = document.getElementById('accountLogoutButton');
    const saveNickname = document.getElementById('accountNicknameButton');
    const cloudSave = document.getElementById('accountCloudSaveButton');
    const cloudLoad = document.getElementById('accountCloudLoadButton');
    const refreshScoreboard = document.getElementById('accountRefreshScoreboardButton');
    const scoreboardList = document.getElementById('scoreboardList');

    if (email) email.disabled = this.busy || loggedIn;
    if (password) password.disabled = this.busy || loggedIn;
    if (nickname) nickname.disabled = this.busy || !loggedIn;
    if (nicknameStatus) {
      nicknameStatus.textContent = this.profile
        ? `Nykyinen pistetaulun ryypyt: ${this.profile.ryypyt}`
        : 'Valitse nimimerkki, jotta näyt pistetaululla.';
    }
    if (register) register.disabled = this.busy || !configured || !connected || loggedIn;
    if (login) login.disabled = this.busy || !configured || !connected || loggedIn;
    if (logout) logout.disabled = this.busy || !connected || !loggedIn;
    if (saveNickname) saveNickname.disabled = this.busy || !loggedIn;
    if (cloudSave) cloudSave.disabled = this.busy || !loggedIn;
    if (cloudLoad) cloudLoad.disabled = this.busy || !loggedIn;
    if (refreshScoreboard) refreshScoreboard.disabled = this.busy || !connected;

    if (scoreboardList) {
      if (!this.scoreboard.length) {
        scoreboardList.innerHTML = '<li>Pistetaulu on vielä tyhjä.</li>';
      } else {
        scoreboardList.innerHTML = this.scoreboard.map(row => `
          <li>
            <span>${row.nickname}</span>
            <strong>${Number(row.ryypyt || 0).toLocaleString('fi-FI')} ryyppyä</strong>
          </li>
        `).join('');
      }
    }
  }
};

Game.register(Account);
