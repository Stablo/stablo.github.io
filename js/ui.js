const UI = {
  init() {
    document.querySelectorAll('.leftNav button[data-target]').forEach(button => {
      button.onclick = () => {
        this.showSite('game');
        const id = button.dataset.target;
        setTimeout(() => {
          const element = document.getElementById('section-' + id) || document.getElementById(id);
          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 40);
      };
    });

    const guideButton = document.getElementById('guideButton');
    if (guideButton) guideButton.onclick = () => this.showGuide();

    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') this.closeGuide();
    });
  },


  showSite(site) {
    ['game', 'upgrades', 'gambling'].forEach(name => {
      const panel = document.getElementById('site-' + name);
      const button = document.getElementById('siteButton' + name.charAt(0).toUpperCase() + name.slice(1));

      if (panel) {
        panel.classList.toggle('activeSite', name === site);
        panel.classList.toggle('hiddenSite', name !== site);
      }

      if (button) button.classList.toggle('active', name === site);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  toggleSection(id) {
    const content = document.getElementById(id);
    const button = document.getElementById(id + 'Toggle');
    if (!content) return;

    content.classList.toggle('hidden');
    if (button) button.textContent = content.classList.contains('hidden') ? 'Näytä' : 'Piilota';
  },

  showGuide() {
    if (document.getElementById('guideOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'guideOverlay';
    overlay.className = 'overlay guideOverlay';

    overlay.innerHTML = `
      <div class="overlayBox guideBox" role="dialog" aria-modal="true" aria-labelledby="guideTitle">
        <button class="guideClose" type="button" onclick="UI.closeGuide()" aria-label="Sulje opas">×</button>

        <h2 id="guideTitle">📖 Villisika-Sepon pikaopas</h2>

        <p>
          Tavoitteena on pitää Seppo jotenkin toimintakykyisenä: hanki ryyppyjä,
          osta olutta, palauta tölkkejä, selvitä Kela-sotkuja ja yritä olla romahtamatta
          krapulan ja stressin alle.
        </p>

        <h3>Peruskierto</h3>
        <ol>
          <li>Osta olutta Olutkaupasta, kun hinta on siedettävä.</li>
          <li>Juo tölkkejä saadaksesi ryyppyjä ja tyhjiä tölkkejä.</li>
          <li>Palauta tyhjät tölkit euroiksi Puulantorilla tai Kilinäkoneessa.</li>
          <li>Pidä ruokaa, tupakkaa ja stressinlievitystä varalla pahojen päivien varalta.</li>
        </ol>

        <h3>Tärkeimmät mittarit</h3>
        <ul>
          <li><strong>Ryypyt</strong> ovat päävaluuttaa apureihin ja tapahtumiin.</li>
          <li><strong>Eurot</strong> tarvitaan olueen, markettiostoksiin ja selviytymiseen.</li>
          <li><strong>Krapula</strong> hidastaa päivän kulkua. Ruoka ja sauna auttavat.</li>
          <li><strong>Stressi</strong> vaikeuttaa minipelejä ja voi aiheuttaa sekoilutapahtumia.</li>
        </ul>

        <h3>Pysyvät parannukset</h3>
        <ul>
          <li>Parannukset ostetaan ryypyillä omalla ylävalikon sivullaan.</li>
          <li>Ne ovat kalliita, mutta pysyviä. Osta niitä vasta kun perusarki ei kaadu joka päivä.</li>
          <li>Teräsmaksan tiiviste vahvistuu hitaasti: se vaatii 50 itse juotua olutta ennen pysyvää +1 ryyppyä per olut.</li>
          <li>Apuriparannukset voivat säästää tölkkejä tai kasvattaa tuotantoa, joten ne sopivat pitkään peliin.</li>
        </ul>

        <h3>Minipeleistä</h3>
        <ul>
          <li>Puulantorilla jokainen tölkkiosuma palauttaa yhden tölkin. Hutiklikki lukitsee Puulantorin hetkeksi.</li>
          <li>Kilinäkoneessa valitse järkevin toiminta. Väärät päätökset nostavat stressiä ja voivat maksaa tölkkejä.</li>
          <li>Pikkukeikoissa paina nuolinäppäimet oikeassa järjestyksessä. Stressi lisää askelia ja lyhentää aikaa.</li>
          <li>Karaokessa nuolet liikkuvat kohti keskimerkkiä. Paina oikea nuoli merkin kohdalla; vaikeammat tasot maksavat enemmän mutta ovat usein huono idea spammata.</li>
          <li>Kuppipelissä näet kupit sekoittuvan. Lopputulos voi olla 0x, 1x tai 2x panos.</li>
          <li>Korttipakka on kaoottinen: hyvä merkki voi palkita, paha merkki voi viedä ryyppyjä tai pahentaa oloa.</li>
        </ul>

        <h3>Romahdus ja pelin loppu</h3>
        <ul>
          <li>Romahdus voi tapahtua, kun stressi on 100, krapula on 100, euroja on alle 1 € ja täysiä tölkkejä ei ole.</li>
          <li>Ensimmäinen ja toinen romahdus eivät lopeta peliä, mutta vievät puolet euroista ja ryypyistä. Saat samalla pienen säälivaraston takaisin.</li>
          <li>Kolmas romahdus on varsinainen game over: Seppo siirtyy taustatarinaksi.</li>
          <li>Pidä aina ainakin yksi pelastusreitti hengissä: hieman euroja, muutama tölkki, matalampi stressi tai matalampi krapula.</li>
        </ul>

        <h3>Hyödyllisiä vinkkejä</h3>
        <ul>
          <li>Älä polta kaikkia euroja kalliiseen olueen; hinnat vaihtuvat muutaman päivän välein.</li>
          <li>Puulantori on helppo ja nopea, mutta hutiklikki lukitsee sen hetkeksi.</li>
          <li>Kilinäkone palauttaa kaiken, mutta Panttikoneen raivo voi kostautua.</li>
          <li>Kela-hakemukset kannattaa laittaa vetämään ajoissa, koska ongelmat venyttävät arkea.</li>
          <li>Apurit tekevät ryyppyjä, jos täysiä tölkkejä riittää. Pidä varasto hengissä.</li>
          <li>Kun stressi nousee, käytä Stressi-osion rauhoittavia toimintoja ennen vaikeita minipelejä.</li>
          <li>Supermarketin ostokset eivät ole loistava sijoitus, mutta voivat pelastaa krapulapäivän.</li>
          <li>Tallenna välillä, varsinkin ennen kuin alat kokeilla outoja tapahtumia.</li>
        </ul>

        <h3>Pieni selviytymissääntö</h3>
        <p>
          Jos kaikki menee pieleen: palauta tölkkejä, hae halpaa ruokaa, laske stressiä,
          hanki täysiä tölkkejä ja vasta sitten tee vaikeampia keikkoja tai uhkapelejä.
        </p>
      </div>
    `;

    overlay.addEventListener('click', event => {
      if (event.target === overlay) this.closeGuide();
    });

    document.body.appendChild(overlay);
  },

  closeGuide() {
    const overlay = document.getElementById('guideOverlay');
    if (overlay) overlay.remove();
  },

  renderStats() {
    const s = Game.state;
    const helper = Helpers.getHelperDrinksPerDay();
    const emptyValue = s.emptyCans * Game.config.canValue;
    const stress = s.stress ?? 0;
    const stressLabel = typeof Stress !== 'undefined' ? Stress.label() : '';

    document.getElementById('statsPanel').innerHTML = `
      <h2>Pikatilastot</h2>
      <div class="statLine">Ryypyt: ${Math.floor(s.ryypyt)}</div>
      <div class="statLine">Eurot: ${s.euros.toFixed(2)} €</div>
      <div class="statLine">Krapula: ${Math.floor(s.hangover)}/100</div>
      <div class="statLine">Stressi: ${Math.floor(stress)}/100</div>
      <div class="statLine">Tila: ${stressLabel}</div>
      <div class="statLine">Romahdukset: ${s.collapseCount ?? 0}/3</div>
      <div class="statLine">Päivän hidastus: ${Game.getSlowdownPercent()}%</div>
      <div class="statLine">Tupakat: ${s.cigarettes}</div>
      <div class="statLine">Täydet tölkit: ${s.fullCans}</div>
      <div class="statLine">Tyhjät tölkit: ${s.emptyCans}</div>
      <div class="statLine">Tyhjien arvo: ${emptyValue.toFixed(2)} €</div>
      <div class="statLine">Juodut oluet: ${s.oluet}</div>
      <div class="statLine">Apurien tölkit / päivä: ${helper}</div>
      <div class="statLine">Ryyppyjä / päivä: ${Helpers.getRyypytPerDay()}</div>
      <div class="statLine">Ryyppyjä / minuutti: ${Helpers.getRyypytPerMinute().toFixed(1)}</div>
      <div class="statLine">Halvin tölkki nyt: ${BeerShop.getCheapestCanPrice().toFixed(2)} €</div>
      <div class="statLine">Päivä: ${s.day}</div>
      <div class="statLine">Apureita yhteensä: ${Helpers.getTotalHelpers()}</div>
      <div class="statLine">Kela-hakemuksia: ${Kela.countActive()}</div>
      <div class="statLine">Avoimia Kela-ongelmia: ${Kela.countProblems()}</div>
    `;
  }
};
