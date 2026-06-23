const Game={
  modules:[],
  state:{ryypyt:0,euros:200,oluet:0,fullCans:0,emptyCans:0,ryypytPerOlut:1,hangover:0,cigarettes:0,day:1,dayProgressSeconds:0,eventLog:'Ei tapahtumia vielä.'},
  config:{baseSecondsPerDay:15,canValue:.20,priceChangeIntervalDays:7},
  register(module){this.modules.push(module)},
  start(){this.modules.forEach(m=>m.init&&m.init()); SaveLoad.load(); this.update(); setInterval(()=>this.tick(),1000)},
  tick(){this.state.dayProgressSeconds++; if(this.state.dayProgressSeconds>=this.effectiveSecondsPerDay()) this.newDay(); this.modules.forEach(m=>m.tick&&m.tick()); this.update()},
  newDay(){const s=this.state; s.day++; s.dayProgressSeconds=0; this.changeHangover(5); this.modules.forEach(m=>m.newDay&&m.newDay())},
  update(){this.modules.forEach(m=>m.render&&m.render()); UI.renderStats()},
  clamp(v,min,max){return Math.max(min,Math.min(max,v))},
  randInt(min,max){return Math.floor(Math.random()*(max-min+1))+min},
  randFloat(min,max){return Math.random()*(max-min)+min},
  changeHangover(n){this.state.hangover=this.clamp(this.state.hangover+n,0,100)},
  slowdown(){return Math.min(99,Math.floor(this.state.hangover))},
  effectiveSecondsPerDay(){return this.config.baseSecondsPerDay*(1+this.slowdown()/100)},
  toggle(id,btn){const c=document.getElementById(id),b=document.getElementById(btn); c.classList.toggle('hidden'); b.textContent=c.classList.contains('hidden')?'Näytä':'Piilota'},
  section(title,id,html){return `<div class="box"><div class="sectionHeader" onclick="Game.toggle('${id}','${id}Btn')"><h2>${title}</h2><button id="${id}Btn">Piilota</button></div><div class="sectionContent" id="${id}">${html}</div></div>`}
};
