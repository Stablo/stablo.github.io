const UI = {
  init() {
    document.querySelectorAll('.leftNav button[data-target]').forEach(button => {
      button.onclick = () => {
        const id = button.dataset.target;
        const element = document.getElementById('section-' + id) || document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    });
  },

  toggleSection(id) {
    const content = document.getElementById(id);
    const button = document.getElementById(id + 'Toggle');
    if (!content) return;

    content.classList.toggle('hidden');
    if (button) button.textContent = content.classList.contains('hidden') ? 'Näytä' : 'Piilota';
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
