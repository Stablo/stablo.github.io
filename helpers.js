const Helpers={
  data:{lauri:{label:'Lauri',count:0,cost:15,production:3,costMultiplier:1.5},jarski:{label:'Jarski',count:0,cost:100,production:20,costMultiplier:1.6}},
  init(){document.getElementById('gameMain').insertAdjacentHTML('beforeend',Game.section('Apurit','helpersContent',`<div id="helpersList"></div><hr><p>Apurien tölkit per päivä: <span id="cansPerDay">0</span></p><p>Mahdollisia ryyppyjä per päivä: <span id="ryypytPerDay">0</span></p><p>Mahdollisia ryyppyjä per minuutti: <span id="ryypytPerMinute">0</span></p>`))},
  buy(type){const h=this.data[type],s=Game.state;if(s.ryypyt<h.cost)return;s.ryypyt-=h.cost;h.count++;h.cost=Math.floor(h.cost*h.costMultiplier);Game.update()},
  drinksPerDay(){return Object.values(this.data).reduce((a,h)=>a+h.count*h.production,0)},
  ryypytPerDay(){return this.drinksPerDay()*Game.state.ryypytPerOlut},
  total(){return Object.values(this.data).reduce((a,h)=>a+h.count,0)},
  newDay(){const s=Game.state,demand=this.drinksPerDay(),drunk=Math.min(s.fullCans,demand);s.fullCans-=drunk;s.emptyCans+=drunk;s.oluet+=drunk;s.ryypyt+=drunk*s.ryypytPerOlut},
  render(){const list=document.getElementById('helpersList'); if(!list)return; list.innerHTML=''; Object.entries(this.data).forEach(([key,h])=>list.insertAdjacentHTML('beforeend',`<button onclick="Helpers.buy('${key}')" ${Game.state.ryypyt<h.cost?'disabled':''}>Osta ${h.label} — Hinta: ${h.cost} ryyppyä</button><p>${h.label} juo +${h.production} täyttä tölkkiä per päivä. Omistat: ${h.count}</p><hr>`));document.getElementById('cansPerDay').textContent=this.drinksPerDay();document.getElementById('ryypytPerDay').textContent=this.ryypytPerDay();document.getElementById('ryypytPerMinute').textContent=(this.ryypytPerDay()*(60/Game.effectiveSecondsPerDay())).toFixed(1)}
};
Game.register(Helpers);
