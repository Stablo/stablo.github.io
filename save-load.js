const SaveLoad={
  key:'villisikaSeppoModularSave',
  init(){document.getElementById('gameMain').insertAdjacentHTML('beforeend',Game.section('Tallennus','saveContent',`<button onclick="SaveLoad.save()">Tallenna peli</button><button onclick="SaveLoad.load()">Lataa peli</button><button onclick="SaveLoad.reset()">Nollaa peli</button>`))},
  snapshot(){return{state:Game.state,beerPackages:BeerShop.packages,averageHistory:BeerShop.averageHistory,marketItems:Supermarket.items,helpers:Helpers.data,kela:Kela.benefits,kelaActive:Kela.active,returns:{returning:Returns.returning,type:Returns.type,total:Returns.total,left:Returns.left,cans:Returns.cans},events:{cost:RandomEvents.cost},jobsCooldowns:Jobs.cooldowns}},
  save(){localStorage.setItem(this.key,JSON.stringify(this.snapshot()));alert('Peli tallennettu!')},
  load(){const raw=localStorage.getItem(this.key);if(!raw)return;const s=JSON.parse(raw);Object.assign(Game.state,s.state||{});if(s.beerPackages)BeerShop.packages=s.beerPackages;if(s.averageHistory)BeerShop.averageHistory=s.averageHistory;if(s.marketItems)Supermarket.items=s.marketItems;if(s.helpers)Helpers.data=s.helpers;if(s.kela)Kela.benefits=s.kela;if(s.kelaActive)Kela.active=s.kelaActive;if(s.returns)Object.assign(Returns,s.returns);if(s.events)RandomEvents.cost=s.events.cost;if(s.jobsCooldowns)Jobs.cooldowns=s.jobsCooldowns;Game.update()},
  reset(){if(!confirm('Haluatko varmasti aloittaa alusta?'))return;localStorage.removeItem(this.key);location.reload()}
};
Game.register(SaveLoad);
