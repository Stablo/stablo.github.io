const UI={
  init(){document.getElementById('gameMain').insertAdjacentHTML('beforeend',Game.section('Peli','mainContent',`
    <p>Ryypyt: <span id="ryypyt">0</span></p><p>Eurot: <span id="euros">200.00</span> €</p>
    <p>Täydet tölkit: <span id="fullCans">0</span></p><p>Tyhjät tölkit: <span id="emptyCans">0</span></p>
    <p>Juodut oluet: <span id="oluet">0</span></p><p>Ryypyt per olut: <span id="ryypytPerOlut">1</span></p>
    <p>Krapula: <span id="hangoverStatus">0</span>/100</p><div class="hangoverOuter"><div class="hangoverInner" id="hangoverBar"></div></div>
    <p id="drinkWarning" class="warning"></p><button id="drinkButton" onclick="UI.drinkBeer()">Juo olut</button><button id="smokeButton" onclick="Supermarket.smoke()">Polta tupakka</button>`));
    document.getElementById('gameMain').insertAdjacentHTML('beforeend',Game.section('Aika','timeContent',`
    <p>Päivä: <span id="day">1</span></p><p>Peruspäivän pituus: 15 sekuntia</p><p>Nykyinen päivän pituus: <span id="effectiveDayLength">15.0</span> sekuntia</p><p>Krapulan hidastus: <span id="hangoverSlowdown">0</span>%</p><p>Päivän eteneminen: <span id="dayProgressText">0</span>%</p><div class="progressOuter"><div class="progressInner" id="dayProgressBar"></div></div>`));
  },
  drinkBeer(){const s=Game.state;if(s.fullCans<=0)return; s.fullCans--;s.emptyCans++;s.oluet++;s.ryypyt+=s.ryypytPerOlut;Game.changeHangover(-1);Game.update()},
  render(){const s=Game.state,eff=Game.effectiveSecondsPerDay(),prog=Math.floor((s.dayProgressSeconds/eff)*100),slow=Game.slowdown();
    ['ryypyt','euros','fullCans','emptyCans','oluet','ryypytPerOlut','day'].forEach(id=>{const e=document.getElementById(id); if(e)e.textContent=id==='euros'?s[id].toFixed(2):Math.floor(s[id])});
    document.getElementById('hangoverStatus').textContent=Math.floor(s.hangover); const bar=document.getElementById('hangoverBar'); bar.style.width=s.hangover+'%'; bar.style.background=`rgb(${Math.floor(s.hangover*2.55)},${Math.floor(255-s.hangover*2.55)},0)`;
    document.getElementById('effectiveDayLength').textContent=eff.toFixed(1); document.getElementById('hangoverSlowdown').textContent=slow; document.getElementById('dayProgressText').textContent=Game.clamp(prog,0,100); document.getElementById('dayProgressBar').style.width=Game.clamp(prog,0,100)+'%';
    document.getElementById('drinkButton').disabled=s.fullCans<=0; document.getElementById('smokeButton').disabled=s.cigarettes<=0; document.getElementById('drinkWarning').textContent=s.fullCans<=0?'Ei täysiä tölkkejä. Osta olutta ennen kuin voit juoda.':'';
  },
  renderStats(){const s=Game.state,emptyValue=s.emptyCans*Game.config.canValue; document.getElementById('statsPanel').innerHTML=`<h2>Pikatilastot</h2>
    <div class="statLine">Ryypyt: ${Math.floor(s.ryypyt)}</div><div class="statLine">Eurot: ${s.euros.toFixed(2)} €</div><div class="statLine">Krapula: ${Math.floor(s.hangover)}/100</div><div class="statLine">Päivän hidastus: ${Game.slowdown()}%</div><div class="statLine">Tupakat: ${s.cigarettes}</div><div class="statLine">Täydet tölkit: ${s.fullCans}</div><div class="statLine">Tyhjät tölkit: ${s.emptyCans}</div><div class="statLine">Tyhjien arvo: ${emptyValue.toFixed(2)} €</div><div class="statLine">Juodut oluet: ${s.oluet}</div><div class="statLine">Päivä: ${s.day}</div><div class="statLine">Apureita: ${Helpers.total()}</div><div class="statLine">Kela-hakemuksia: ${Kela.activeCount()}</div><div class="statLine">Kela-ongelmia: ${Kela.problemCount()}</div>`}
};
Game.register(UI);
