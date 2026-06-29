/* ===========================================================================
   Adega do Mercado — app de recomendação de vinhos (estático, sem build)
   Motor de recomendação fiel ao PRD v2. Catálogo persistido no localStorage.
   =========================================================================== */
(function(){
  "use strict";
  var app = document.getElementById('app');

  /* ---------- Domínio ---------- */
  var TYPES=["Tinto","Branco","Rosé","Espumante"];
  var PROFILES=["Leve","Equilibrado","Intenso"];
  var CLASSIFICATIONS=["Seco","Meio seco","Suave","Doce"];
  var BEGINNER=["Baixo","Médio","Alto"];
  var PRICE_BANDS=["Econômico","Intermediário","Premium"];
  var OCCASIONS=["Jantar especial","Presente","Comemoração","Almoço em família / refeição casual","Quero experimentar algo novo"];
  var FOODS=["Churrasco","Aves","Carne vermelha","Peixes","Frutos do Mar","Massa com molho vermelho","Massa com molho branco","Risoto","Queijos","Comida japonesa","Salada","Aperitivos","Sobremesa"];
  var FOOD_ICON={"Churrasco":"🍖","Aves":"🍗","Carne vermelha":"🥩","Peixes":"🐟","Frutos do Mar":"🦐","Massa com molho vermelho":"🍝","Massa com molho branco":"🍜","Risoto":"🍚","Queijos":"🧀","Comida japonesa":"🍣","Salada":"🥗","Aperitivos":"🫒","Sobremesa":"🍰"};
  var FOOD_MSICON={"Churrasco":"outdoor_grill","Aves":"skillet","Carne vermelha":"kebab_dining","Peixes":"set_meal","Frutos do Mar":"set_meal","Massa com molho vermelho":"dinner_dining","Massa com molho branco":"ramen_dining","Risoto":"rice_bowl","Queijos":"tapas","Comida japonesa":"ramen_dining","Salada":"eco","Aperitivos":"tapas","Sobremesa":"cake"};
  var FOOD_IMAGES={
    "Churrasco":"assets/imagens/comidas/churrasco.jpg",
    "Aves":"assets/imagens/comidas/aves.jpg",
    "Carne vermelha":"assets/imagens/comidas/carne-vermelha.jpg",
    "Peixes":"assets/imagens/comidas/peixes.jpg",
    "Frutos do Mar":"assets/imagens/comidas/frutos-do-mar.jpg",
    "Massa com molho vermelho":"assets/imagens/comidas/massa-molho-vermelho.jpg",
    "Massa com molho branco":"assets/imagens/comidas/massa-molho-branco.jpg",
    "Risoto":"assets/imagens/comidas/risoto.jpg",
    "Queijos":"assets/imagens/comidas/queijos.jpg",
    "Comida japonesa":"assets/imagens/comidas/comida-japonesa.jpg",
    "Salada":"assets/imagens/comidas/salada.jpg",
    "Aperitivos":"assets/imagens/comidas/aperitivos.jpg",
    "Sobremesa":"assets/imagens/comidas/sobremesa.jpg"
  };
  var COUNTRIES=[
    {name:"Argentina",  code:"ar"},
    {name:"Brasil",     code:"br"},
    {name:"Chile",      code:"cl"},
    {name:"Austrália",  code:"au"},
    {name:"Espanha",    code:"es"},
    {name:"Portugal",   code:"pt"},
    {name:"França",     code:"fr"},
    {name:"Itália",     code:"it"},
    {name:"Estados Unidos", code:"us"},
    {name:"Alemanha",   code:"de"},
    {name:"Nova Zelândia", code:"nz"},
    {name:"África do Sul", code:"za"},
    {name:"Uruguai",    code:"uy"}
  ];
  var PAIR_TABLE={
    "Churrasco":{types:["Tinto"],profiles:["Intenso","Equilibrado"]},
    "Aves":{types:["Branco","Rosé","Espumante","Tinto"],profiles:["Leve","Equilibrado"]},
    "Carne vermelha":{types:["Tinto"],profiles:["Intenso"]},
    "Peixes":{types:["Branco","Espumante"],profiles:["Leve"]},
    "Frutos do Mar":{types:["Branco","Espumante","Rosé"],profiles:["Leve"]},
    "Massa com molho vermelho":{types:["Tinto"],profiles:["Equilibrado","Intenso"]},
    "Massa com molho branco":{types:["Branco","Tinto"],profiles:["Leve","Equilibrado"]},
    "Risoto":{types:["Branco","Tinto","Espumante"],profiles:["Leve","Equilibrado"]},
    "Queijos":{types:["Tinto","Branco","Espumante"],profiles:["Equilibrado"]},
    "Comida japonesa":{types:["Branco","Espumante","Rosé"],profiles:["Leve"]},
    "Salada":{types:["Branco","Rosé","Espumante"],profiles:["Leve"]},
    "Aperitivos":{types:["Espumante","Branco","Rosé"],profiles:["Leve"]},
    "Sobremesa":{types:["Espumante","Branco"],profiles:["Leve"]}
  };
  var WEAK_THRESHOLD=65;

  function priceBand(p){return p<=50?PRICE_BANDS[0]:p<=100?PRICE_BANDS[1]:PRICE_BANDS[2];}
  function bandIndex(b){return PRICE_BANDS.indexOf(b);}
  function profileIndex(p){return PROFILES.indexOf(p);}
  function brl(v){return "R$ "+Number(v).toFixed(2).replace(".",",");}
  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

  /* ---------- Catálogo ---------- */
  var CLOSURES=["Rolha","Rolha sintética","Tampa de rosca"];
  function defaultColor(o){
    if(o.type==="Branco")return "Amarelo-palha brilhante";
    if(o.type==="Rosé")return "Rosa-salmão";
    if(o.type==="Espumante")return "Amarelo-claro com borbulhas finas";
    if(o.profile==="Leve")return "Vermelho-rubi translúcido";
    if(o.profile==="Intenso")return "Vermelho-violáceo intenso";
    return "Vermelho-rubi";
  }
  function defaultAbv(o){
    if(o.type==="Espumante")return "12%";
    if(o.type==="Branco"||o.type==="Rosé")return "12%";
    if(o.profile==="Leve")return "12,5%";
    if(o.profile==="Intenso")return "13,5%";
    return "13%";
  }
  function defaultTaste(o){
    var fruit=o.profile==="Equilibrado"?3:4;
    var sw=o.perceivedSweetness;
    var sugar=sw==="Seco"?0:sw==="Meio seco"?2:sw==="Suave"?3:sw==="Doce"?4:0;
    var acidity=(o.type==="Branco"||o.type==="Espumante"||o.type==="Rosé")?4:3;
    var tannin=o.type==="Tinto"?(o.profile==="Intenso"?4:o.profile==="Equilibrado"?3:2):(o.type==="Rosé"?1:0);
    return {fruit:fruit,sugar:sugar,acidity:acidity,tannin:tannin};
  }
  var REGION_BY_COUNTRY={
    "Chile":"Vale Central","Argentina":"Mendoza","Brasil":"Serra Gaúcha","Uruguai":"Canelones",
    "Itália":"Vêneto","Portugal":"Douro","França":"Bordeaux","Espanha":"Rioja","Austrália":"Barossa Valley",
    "Estados Unidos":"Califórnia","Alemanha":"Mosel","Nova Zelândia":"Marlborough","África do Sul":"Stellenbosch"
  };
  function defaultRegion(o){return REGION_BY_COUNTRY[o.country]||"";}
  function defaultMaturation(o){
    if(o.type==="Espumante")return "Método tradicional, sem passagem por madeira";
    if(o.type==="Tinto"){ if(o.profile==="Intenso")return "Estágio em barris de carvalho"; if(o.profile==="Equilibrado")return "Breve passagem por madeira"; return "Sem passagem por madeira"; }
    return "Sem passagem por madeira";
  }
  function defaultCellaring(o){
    if(o.type==="Tinto"){ if(o.profile==="Intenso")return "Pode guardar por 4 a 6 anos"; if(o.profile==="Equilibrado")return "Melhor consumir em até 3 anos"; return "Consumir jovem, em até 2 anos"; }
    return "Consumir jovem, em até 2 anos";
  }
  var _id=0;
  function W(o){o.id=++_id; if(o.isActive===undefined)o.isActive=true;
    ["country","grape","winery","servingTemperature"].forEach(function(k){if(o[k]===undefined)o[k]="";});
    if(o.region===undefined)o.region=defaultRegion(o);
    if(o.volume===undefined)o.volume="750 ml";
    if(o.alcohol===undefined)o.alcohol=defaultAbv(o);
    if(o.closure===undefined)o.closure="Rolha";
    if(o.color===undefined)o.color=defaultColor(o);
    if(o.maturation===undefined)o.maturation=defaultMaturation(o);
    if(o.cellaring===undefined)o.cellaring=defaultCellaring(o);
    if(o.taste===undefined)o.taste=defaultTaste(o);
    if(!o.occasions)o.occasions=[]; if(!o.pairings)o.pairings=[]; return o;}
  var SEED=[
    W({name:"Encosta Velha Cabernet Sauvignon",price:95,type:"Tinto",profile:"Intenso",perceivedSweetness:"Seco",beginnerLevel:"Baixo",grape:"Cabernet Sauvignon",country:"Chile",servingTemperature:"16–18 °C",
      shortRecommendation:"Combina bem com pratos de sabor mais marcante.",
      profileReason:"Este vinho tem corpo e presença, indicado para quem gosta de um sabor mais intenso e estruturado.",
      occasions:["Jantar especial","Presente"],
      pairings:[{foodCategory:"Carne vermelha",level:"primary",pairingReason:"Acompanha a intensidade da carne vermelha sem perder o sabor próprio."},
        {foodCategory:"Churrasco",level:"primary",pairingReason:"Sustenta bem o sabor defumado e a gordura do churrasco."},
        {foodCategory:"Queijos",level:"secondary",pairingReason:"Vai bem com queijos mais firmes e curados."}]}),
    W({name:"Pequena Colheita Merlot",price:62,type:"Tinto",profile:"Equilibrado",perceivedSweetness:"Seco",beginnerLevel:"Médio",grape:"Merlot",country:"Chile",servingTemperature:"16–18 °C",
      shortRecommendation:"Boa escolha para quem procura um vinho equilibrado e fácil de apreciar.",
      profileReason:"Um tinto equilibrado, de sabor agradável e fácil de combinar com diferentes pratos.",
      occasions:["Almoço em família / refeição casual","Comemoração"],
      pairings:[{foodCategory:"Massa com molho vermelho",level:"primary",pairingReason:"Acompanha a intensidade do molho sem deixar a refeição pesada."},
        {foodCategory:"Aves",level:"secondary",pairingReason:"Funciona bem com aves de preparo mais saboroso."},
        {foodCategory:"Queijos",level:"secondary",pairingReason:"Combina com queijos de sabor médio."}]}),
    W({name:"Caminho Leve Pinot Noir",price:78,type:"Tinto",profile:"Leve",perceivedSweetness:"Seco",beginnerLevel:"Alto",grape:"Pinot Noir",country:"Argentina",servingTemperature:"14–16 °C",
      shortRecommendation:"Indicado para quem prefere tintos mais leves e agradáveis.",
      profileReason:"Um tinto leve e macio, fácil de beber e muito agradável.",
      occasions:["Comemoração","Quero experimentar algo novo"],
      pairings:[{foodCategory:"Aves",level:"primary",pairingReason:"A leveza acompanha aves sem dominar o prato."},
        {foodCategory:"Comida japonesa",level:"secondary",pairingReason:"Sua suavidade combina com pratos delicados."}]}),
    W({name:"Vinha do Campo Malbec",price:88,type:"Tinto",profile:"Intenso",perceivedSweetness:"Seco",beginnerLevel:"Médio",grape:"Malbec",country:"Argentina",servingTemperature:"16–18 °C",
      shortRecommendation:"Acompanha bem refeições de sabor forte.",
      profileReason:"Um tinto encorpado e marcante, com boa presença na boca.",
      occasions:["Jantar especial"],
      pairings:[{foodCategory:"Churrasco",level:"primary",pairingReason:"É um clássico do churrasco: sustenta carnes gordurosas."},
        {foodCategory:"Carne vermelha",level:"primary",pairingReason:"Realça o sabor da carne vermelha."}]}),
    W({name:"Brisa Clara Sauvignon Blanc",price:49,type:"Branco",profile:"Leve",perceivedSweetness:"Seco",beginnerLevel:"Alto",grape:"Sauvignon Blanc",country:"Chile",servingTemperature:"8–10 °C",
      shortRecommendation:"Uma opção leve e refrescante, fácil de apreciar.",
      profileReason:"Um branco fresco e leve, fácil de beber e versátil.",
      occasions:["Almoço em família / refeição casual","Quero experimentar algo novo"],
      pairings:[{foodCategory:"Peixes",level:"primary",pairingReason:"A acidez fresca realça peixes sem pesar."},
        {foodCategory:"Comida japonesa",level:"primary",pairingReason:"Acompanha pratos leves e delicados."},
        {foodCategory:"Aperitivos",level:"secondary",pairingReason:"Boa para começar a refeição."}]}),
    W({name:"Serra Dourada Chardonnay",price:84,type:"Branco",profile:"Equilibrado",perceivedSweetness:"Seco",beginnerLevel:"Médio",grape:"Chardonnay",country:"Brasil",servingTemperature:"10–12 °C",
      shortRecommendation:"Branco com mais corpo, sem deixar de ser agradável.",
      profileReason:"Um branco equilibrado, com sabor mais presente e boa harmonização.",
      occasions:["Jantar especial"],
      pairings:[{foodCategory:"Massa com molho branco",level:"primary",pairingReason:"Acompanha a cremosidade do molho branco com equilíbrio."},
        {foodCategory:"Aves",level:"primary",pairingReason:"Combina com aves de preparo mais encorpado."},
        {foodCategory:"Peixes",level:"secondary",pairingReason:"Vai bem com peixes de sabor mais marcante."}]}),
    W({name:"Pedra Fresca Riesling",price:70,type:"Branco",profile:"Leve",perceivedSweetness:"Meio seco",beginnerLevel:"Alto",grape:"Riesling",country:"Brasil",servingTemperature:"8–10 °C",
      shortRecommendation:"Leve e levemente adocicado, fácil de gostar.",
      profileReason:"Um branco leve, aromático e fácil de apreciar, com toque sutilmente adocicado.",
      occasions:["Comemoração","Quero experimentar algo novo"],
      pairings:[{foodCategory:"Comida japonesa",level:"primary",pairingReason:"Seu frescor combina com a comida japonesa."},
        {foodCategory:"Peixes",level:"secondary",pairingReason:"Acompanha peixes de forma leve."}]}),
    W({name:"Fim de Tarde Rosé",price:55,type:"Rosé",profile:"Leve",perceivedSweetness:"Seco",beginnerLevel:"Alto",grape:"Pinot Noir",country:"Brasil",servingTemperature:"8–10 °C",
      shortRecommendation:"Uma escolha leve e versátil para vários momentos.",
      profileReason:"Um rosé leve e refrescante, fácil de beber em diferentes ocasiões.",
      occasions:["Comemoração","Almoço em família / refeição casual","Quero experimentar algo novo"],
      pairings:[{foodCategory:"Aperitivos",level:"primary",pairingReason:"Ótimo para acompanhar petiscos e o início da refeição."},
        {foodCategory:"Comida japonesa",level:"secondary",pairingReason:"Sua leveza combina com pratos delicados."},
        {foodCategory:"Aves",level:"secondary",pairingReason:"Acompanha aves leves."}]}),
    W({name:"Festa Brilhante Espumante Brut",price:79,type:"Espumante",profile:"Leve",perceivedSweetness:"Seco",beginnerLevel:"Alto",grape:"Chardonnay",country:"Brasil",servingTemperature:"6–8 °C",
      shortRecommendation:"Uma opção leve e festiva, fácil de harmonizar.",
      profileReason:"Um espumante leve e refrescante, agradável para celebrar ou começar a refeição.",
      occasions:["Comemoração","Presente"],
      pairings:[{foodCategory:"Aperitivos",level:"primary",pairingReason:"O frescor das borbulhas abre bem o apetite."},
        {foodCategory:"Peixes",level:"secondary",pairingReason:"Acompanha peixes de forma leve e refrescante."},
        {foodCategory:"Queijos",level:"secondary",pairingReason:"Vai bem com queijos suaves."}]}),
    W({name:"Estrela da Noite Moscatel",price:52,type:"Espumante",profile:"Leve",perceivedSweetness:"Suave",beginnerLevel:"Alto",grape:"Moscato",country:"Brasil",servingTemperature:"6–8 °C",
      shortRecommendation:"Suave, aromático e fácil de gostar.",
      profileReason:"Um espumante suave e aromático, indicado para quem prefere um sabor mais leve e agradável.",
      occasions:["Comemoração","Quero experimentar algo novo"],
      pairings:[{foodCategory:"Aperitivos",level:"primary",pairingReason:"Combina com petiscos e momentos descontraídos."},
        {foodCategory:"Queijos",level:"secondary",pairingReason:"Vai bem com queijos suaves."}]}),
    W({name:"Reserva do Vale Tannat",price:135,type:"Tinto",profile:"Intenso",perceivedSweetness:"Seco",beginnerLevel:"Baixo",grape:"Tannat",country:"Uruguai",servingTemperature:"16–18 °C",
      shortRecommendation:"Combina bem com pratos de sabor mais marcante.",
      profileReason:"Um tinto robusto e encorpado, para quem aprecia vinhos mais intensos.",
      occasions:["Jantar especial","Presente"],
      pairings:[{foodCategory:"Churrasco",level:"primary",pairingReason:"Sua estrutura sustenta o churrasco mais saboroso."},
        {foodCategory:"Carne vermelha",level:"primary",pairingReason:"Acompanha carnes vermelhas de sabor intenso."}]}),
    W({name:"Tarde de Domingo Tinto Suave",price:38,type:"Tinto",profile:"Leve",perceivedSweetness:"Suave",beginnerLevel:"Alto",grape:"Bordô",country:"Brasil",servingTemperature:"14–16 °C",
      shortRecommendation:"Uma opção segura, leve e fácil de apreciar.",
      profileReason:"Um tinto leve e suave, fácil de beber e muito agradável em qualquer ocasião.",
      occasions:["Almoço em família / refeição casual"],
      pairings:[{foodCategory:"Massa com molho vermelho",level:"secondary",pairingReason:"Acompanha massas do dia a dia sem pesar."},
        {foodCategory:"Queijos",level:"secondary",pairingReason:"Vai bem com queijos suaves."}]}),
    W({name:"Costa Branca Pinot Grigio",price:58,type:"Branco",profile:"Leve",perceivedSweetness:"Seco",beginnerLevel:"Alto",grape:"Pinot Grigio",country:"Itália",servingTemperature:"8–10 °C",
      shortRecommendation:"Leve, fresco e fácil de combinar.",
      profileReason:"Um branco leve e fresco, simples de apreciar em qualquer ocasião.",
      occasions:["Almoço em família / refeição casual","Quero experimentar algo novo"],
      pairings:[{foodCategory:"Peixes",level:"primary",pairingReason:"Realça peixes leves com frescor."},
        {foodCategory:"Massa com molho branco",level:"secondary",pairingReason:"Acompanha massas leves de molho branco."},
        {foodCategory:"Aperitivos",level:"secondary",pairingReason:"Boa para abrir a refeição."}]})
  ];

  /* ---------- Motor de recomendação ---------- */
  function beg(w){return w.beginnerLevel==="Alto";}
  function scoreTaste(w,a){
    var s=0,m=0;
    if(a.type&&a.type!=="nao_sei"){m+=40; if(w.type===a.type)s+=40;}
    if(a.price&&a.price!=="tanto_faz"){m+=30; var d=Math.abs(bandIndex(priceBand(w.price))-bandIndex(a.price)); if(d===0)s+=30; else if(d===1)s+=15;}
    if(a.profile&&a.profile!=="nao_sei"){m+=25; var dp=Math.abs(profileIndex(w.profile)-profileIndex(a.profile)); if(dp===0)s+=25; else if(dp===1)s+=12;}
    if(a.occasion&&a.occasion!=="nao_sei"){m+=10; if(w.occasions.indexOf(a.occasion)>-1)s+=10;}
    if(beg(w))s+=5;
    return {score:s, pct:m>0?Math.min(100,Math.round(s/m*100)):0};
  }
  function neutralScore(w){
    var s=0;
    if(w.profile==="Leve")s+=3; else if(w.profile==="Equilibrado")s+=3;
    if(w.beginnerLevel==="Alto")s+=3; else if(w.beginnerLevel==="Médio")s+=2;
    var b=priceBand(w.price); s+=(b==="Premium")?1:2;
    if(w.profile==="Intenso")s-=1;
    return {score:s, pct:Math.max(0,Math.min(100,Math.round(s/8*100)))};
  }
  function scoreFood(w,food){
    var s=0, pair=null, i;
    for(i=0;i<w.pairings.length;i++){ if(w.pairings[i].foodCategory===food){pair=w.pairings[i];break;} }
    if(pair)s+=pair.level==="primary"?60:35;
    var t=PAIR_TABLE[food];
    if(t.types.indexOf(w.type)>-1)s+=20;
    if(t.profiles.indexOf(w.profile)>-1)s+=10;
    if(beg(w))s+=5;
    return {score:s, pct:Math.min(100,Math.round(s/90*100)), pair:pair};
  }
  function recommend(){
    var active=state.wines.filter(function(x){return x.isActive;});
    if(active.length===0)return {items:[],neutral:false,weak:false,empty:true};
    var neutral=false, scored;
    if(state.flow==="taste"){
      var a=state.answers;
      var allUnknown=(!a.type||a.type==="nao_sei")&&(!a.price||a.price==="tanto_faz")&&(!a.profile||a.profile==="nao_sei")&&(!a.occasion||a.occasion==="nao_sei");
      if(allUnknown){neutral=true; scored=active.map(function(w){var r=neutralScore(w); return {wine:w,score:r.score,pct:r.pct};});}
      else scored=active.map(function(w){var r=scoreTaste(w,a); return {wine:w,score:r.score,pct:r.pct};});
    } else {
      scored=active.map(function(w){var r=scoreFood(w,state.food); return {wine:w,score:r.score,pct:r.pct};});
    }
    scored.sort(function(x,y){return (y.score-x.score)||(x.wine.price-y.wine.price);});
    var items=scored.slice(0,3);
    var weak=!neutral&&((items[0]?items[0].pct:0)<WEAK_THRESHOLD);
    return {items:items,neutral:neutral,weak:weak,empty:false};
  }
  function recommendCountry(){
    var active=state.wines.filter(function(x){return x.isActive;});
    var cn=(state.selectedCountry||"").toLowerCase();
    var found=active.filter(function(w){return w.country.toLowerCase()===cn;});
    if(found.length===0)return {items:[],neutral:false,weak:false,empty:false,noCountry:true};
    var scored=found.map(function(w){
      var s=w.beginnerLevel==="Alto"?3:w.beginnerLevel==="Médio"?2:1;
      return {wine:w,score:s,pct:0};
    });
    scored.sort(function(a,b){return (b.score-a.score)||(a.wine.price-b.wine.price);});
    return {items:scored.slice(0,3),neutral:false,weak:false,empty:false,noCountry:false};
  }

  /* ---------- SVG ---------- */
  function wineFill(type,profile){
    if(type==="Branco")return "#E4CE83";
    if(type==="Rosé")return "#E79AA6";
    if(type==="Espumante")return "#E8D58A";
    if(profile==="Leve")return "#A3375A";
    if(profile==="Intenso")return "#561129";
    return "#7A1B3D";
  }
  function bottleSVG(type,profile,size){
    size=size||104; var fill=wineFill(type,profile), sp=type==="Espumante", wd=size*0.42;
    var gid="g"+(type+profile).replace(/[^A-Za-z]/g,"");
    var bub = sp?'<g fill="#fff" opacity="0.55"><circle cx="30" cy="64" r="1.6"/><circle cx="35" cy="72" r="1.3"/><circle cx="27" cy="78" r="1.2"/><circle cx="33" cy="84" r="1.5"/></g>':'';
    return '<svg class="i" width="'+wd+'" height="'+size+'" viewBox="0 0 60 160" aria-hidden="true">'+
      '<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="'+fill+'" stop-opacity="0.95"/><stop offset="0.5" stop-color="'+fill+'"/><stop offset="1" stop-color="'+fill+'" stop-opacity="0.78"/></linearGradient></defs>'+
      '<rect x="23" y="2" width="14" height="11" rx="2" fill="'+(sp?"#B08A46":"#5E1730")+'"/>'+
      '<rect x="25" y="12" width="10" height="30" fill="url(#'+gid+')"/>'+
      '<path d="M16 56 C16 46 25 44 25 40 L35 40 C35 44 44 46 44 56 L44 150 C44 156 40 158 36 158 L24 158 C20 158 16 156 16 150 Z" fill="url(#'+gid+')" stroke="rgba(0,0,0,0.10)" stroke-width="1"/>'+
      '<rect x="19" y="92" width="22" height="40" rx="2" fill="#FBF7F1" opacity="0.95"/>'+
      '<rect x="19" y="100" width="22" height="2" fill="#B08A46" opacity="0.7"/>'+
      '<rect x="22" y="108" width="16" height="2" fill="rgba(42,23,34,.10)"/>'+
      '<rect x="22" y="113" width="12" height="2" fill="rgba(42,23,34,.10)"/>'+
      '<rect x="20" y="60" width="3" height="80" rx="2" fill="#fff" opacity="0.18"/>'+bub+'</svg>';
  }
  var GLASS_LIQUID={Tinto:"#7E1C3C",Branco:"#E7CE7A","Rosé":"#E79AA7",Espumante:"#ECDB8E"};
  function glassSVG(type,size){
    size=size||56; var liquid=GLASS_LIQUID[type]||"#7E1C3C", sp=type==="Espumante";
    var cid="cb"+(type).replace(/[^A-Za-z]/g,"");
    var bub= sp?'<g clip-path="url(#'+cid+')" fill="#fff" opacity="0.7"><circle cx="28" cy="34" r="1.1"/><circle cx="33" cy="30" r="0.9"/><circle cx="31" cy="38" r="1.0"/><circle cx="36" cy="35" r="0.8"/></g>':'';
    return '<svg class="i" width="'+size+'" height="'+size+'" viewBox="0 0 64 80" aria-hidden="true">'+
      '<defs><clipPath id="'+cid+'"><path d="M16 10 C16 30 22 42 32 42 C42 42 48 30 48 10 Z"/></clipPath></defs>'+
      '<rect x="14" y="20" width="36" height="24" fill="'+liquid+'" clip-path="url(#'+cid+')"/>'+bub+
      '<path d="M16 10 C16 30 22 42 32 42 C42 42 48 30 48 10 Z" fill="none" stroke="#2A1722" stroke-width="2" opacity="0.85"/>'+
      '<rect x="31" y="42" width="2" height="22" fill="#2A1722" opacity="0.85"/>'+
      '<rect x="22" y="64" width="20" height="2.6" rx="1.3" fill="#2A1722" opacity="0.85"/>'+
      '<path d="M18 12 H46" stroke="#fff" stroke-width="2" opacity="0.25"/></svg>';
  }
  function ic(name){
    var p={home:'M3 11l9-8 9 8M5 10v10h14V10',back:'M19 12H5M12 19l-7-7 7-7',chev:'M6 9l6 6 6-6',
      plus:'M12 5v14M5 12h14',x:'M18 6L6 18M6 6l12 12',check:'M20 6L9 17l-5-5'}[name];
    return '<svg class="i" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="'+p+'"/></svg>';
  }
  function getWineGlassImg(type) {
    var t = (type || '').toLowerCase();
    if(t.indexOf('branco') !== -1) return 'assets/imagens/tacas/taca-branco.jpg';
    if(t.indexOf('rosé') !== -1 || t.indexOf('rose') !== -1) return 'assets/imagens/tacas/taca-rose.jpg';
    if(t.indexOf('espumante') !== -1) return 'assets/imagens/tacas/taca-espumante.jpg';
    return 'assets/imagens/tacas/taca-tinto.jpg';
  }

  /* ---------- Componentes (strings) ---------- */
  function eyebrow(t){return '<div class="eyebrow">'+t+'</div>';}
  function bottombar(showBack){
    return '<div class="bottombar-capsule">'+
      (showBack?'<button class="nav-capsule" data-action="back">'+ic('back')+' Voltar</button>':'')+
      '<button class="nav-capsule" data-action="home">'+ic('home')+' Tela inicial</button>'+
      '</div>';
  }
  function qProgress(step){
    var pct=[25,50,75,95][step-1];
    return '<div class="q-progress">'+
      '<div class="q-progress-track"><div class="q-progress-fill" style="width:'+pct+'%"></div></div>'+
      '<div class="q-progress-row"><span class="q-progress-label">Sua jornada</span><span class="q-progress-pct">'+pct+'%</span></div>'+
    '</div>';
  }
  function qFooter(){
    return '<footer class="q-footer">'+
      '<button class="q-foot-btn" data-action="back"><span class="material-symbols-outlined">arrow_back</span><span class="q-foot-label">Voltar</span></button>'+
      '<button class="q-foot-btn" data-action="home"><span class="material-symbols-outlined">restart_alt</span><span class="q-foot-label">Reiniciar</span></button>'+
    '</footer>';
  }
  function qcard(o){
    return '<button class="qcard" data-action="answer" data-key="'+o.key+'" data-val="'+esc(o.v)+'" data-next="'+o.next+'">'+
      '<span class="qcard-badge"><span class="material-symbols-outlined">'+o.icon+'</span></span>'+
      '<span class="qcard-title">'+o.label+'</span>'+
      (o.desc?'<span class="qcard-desc">'+o.desc+'</span>':'')+
    '</button>';
  }
  function questionScreen(step,title,subtitle,opts,extra){
    var cards=opts.map(qcard).join('');
    var skip=extra?'<button class="qskip" data-action="answer" data-key="'+extra.key+'" data-val="'+esc(extra.v)+'" data-next="'+extra.next+'"><span class="material-symbols-outlined">skip_next</span>'+extra.label+'</button>':'';
    return qProgress(step)+
      '<main class="q-main"><div class="q-inner">'+
        '<div class="q-head"><h2 class="q-title">'+title+'</h2>'+(subtitle?'<p class="q-sub">'+subtitle+'</p>':'')+'</div>'+
        '<div class="qgrid">'+cards+'</div>'+skip+
      '</div></main>'+
      qFooter();
  }

  /* ---------- Telas ---------- */
  function viewAge(){
    return '<main class="welcome-main">'+
      '<div class="welcome-bg">'+
        '<div class="welcome-bg-image">'+
          '<div class="welcome-scrim"></div>'+
        '</div>'+
      '</div>'+
      '<section class="welcome-section">'+
        '<div class="welcome-card">'+
          '<p class="welcome-eyebrow">Planos Supermercados</p>'+
          '<h1 class="welcome-title">Encontre o vinho perfeito para cada momento</h1>'+
          '<p class="welcome-subtitle">Você tem 18 anos ou mais?</p>'+
          '<div class="welcome-buttons">'+
            '<button class="welcome-btn-primary" data-action="ageYes">Sim, tenho 18 anos ou mais</button>'+
            '<button class="welcome-btn-outline" data-action="ageNo">Não</button>'+
          '</div>'+
        '</div>'+
      '</section>'+
    '</main>';
  }
  function viewQ1(){
    var TIPOS=[
      {v:"Tinto",img:"tipo-tinto",name:"Tinto",desc:"Encorpados, complexos e com taninos presentes."},
      {v:"Branco",img:"tipo-branco",name:"Branco",desc:"Frescos, aromáticos e vibrantes."},
      {v:"Rosé",img:"tipo-rose",name:"Rosé",desc:"Leves, frutados e ideais para momentos descontraídos."},
      {v:"Espumante",img:"tipo-espumante",name:"Espumante",desc:"Festivos, refrescantes e com perlage persistente."}
    ];
    var cards=TIPOS.map(function(c){
      return '<button class="wine-card" data-action="answer" data-key="type" data-val="'+c.v+'" data-next="q2">'+
        '<div class="wine-card-img-wrapper">'+
          '<div class="wine-card-img" style="background-image: url(\'assets/imagens/tipos/'+c.img+'.jpg\')"></div>'+
          '<div class="wine-card-scrim"></div>'+
        '</div>'+
        '<div class="wine-card-body">'+
          '<div><h3 class="wine-card-name">'+c.name+'</h3><p class="wine-card-desc">'+c.desc+'</p></div>'+
          '<span class="wine-card-arrow">arrow_forward</span>'+
        '</div>'+
      '</button>';
    }).join('');
    return qProgress(1)+
      '<main class="q1-main">'+
        '<div class="q-head"><h2 class="q-title">Que tipo de vinho você procura?</h2>'+
          '<p class="q-sub">Escolha o tipo que combina com o seu momento.</p></div>'+
        '<div class="q1-grid">'+cards+'</div>'+
        '<button class="q1-skip-btn" data-action="answer" data-key="type" data-val="nao_sei" data-next="q2">'+
          '<span class="material-symbols-outlined">help_outline</span>Não sei, quero ajuda'+
        '</button>'+
      '</main>'+
      qFooter();
  }
  function viewBlock(){
    return '<div class="wrap"><div class="card center">'+
      '<h1 class="s">Conteúdo para maiores de 18 anos</h1>'+
      '<p class="sub">Este conteúdo é destinado apenas a maiores de 18 anos.</p>'+
      '<div style="margin-top:26px;display:flex;justify-content:center">'+
        '<button class="nav ink" style="border:1.5px solid var(--line)" data-action="home">'+ic('home')+' Voltar ao início</button>'+
      '</div></div></div>';
  }
  function viewPath(){
    return '<main class="flex-grow flex w-full path-columns">'+
      '<!-- Column 1: Taste Profile -->'+
      '<button class="hero-column" data-action="startTaste">'+
        '<div class="hero-column-bg" style="background-image: url(\'assets/imagens/caminhos/escolher.jpg\')"></div>'+
        '<div class="overlay-gradient"></div>'+
        '<div class="hero-column-content">'+
          '<h2 class="hero-column-title">Quero escolher</h2>'+
          '<div class="hero-column-line"></div>'+
        '</div>'+
      '</button>'+
      '<!-- Column 2: Gourmet Pairing -->'+
      '<button class="hero-column" data-action="startFood">'+
        '<div class="hero-column-bg" style="background-image: url(\'assets/imagens/caminhos/harmonizar.jpg\')"></div>'+
        '<div class="overlay-gradient"></div>'+
        '<div class="hero-column-content">'+
          '<h2 class="hero-column-title">Quero harmonizar</h2>'+
          '<div class="hero-column-line"></div>'+
        '</div>'+
      '</button>'+
      '<!-- Column 3: World Vineyard -->'+
      '<button class="hero-column" data-action="startCountry">'+
        '<div class="hero-column-bg" style="background-image: url(\'assets/imagens/caminhos/pais.jpg\')"></div>'+
        '<div class="overlay-gradient"></div>'+
        '<div class="hero-column-content">'+
          '<h2 class="hero-column-title">Escolher por país</h2>'+
          '<div class="hero-column-line"></div>'+
        '</div>'+
      '</button>'+
    '</main>'+
    '<!-- Bottom Secondary Navigation -->'+
    '<footer class="path-footer">'+
      '<button class="path-footer-btn" data-action="openLearn">'+
        '<span class="material-symbols-outlined">menu_book</span>'+
        '<span class="path-footer-btn-text">Aprender sobre vinhos</span>'+
      '</button>'+
      '<div class="path-footer-sep"></div>'+
      '<button class="path-footer-btn" data-action="openFaq">'+
        '<span class="material-symbols-outlined">help</span>'+
        '<span class="path-footer-btn-text">Dúvidas frequentes</span>'+
      '</button>'+
      '<div class="path-footer-sep"></div>'+
      '<button class="path-footer-btn" data-action="home">'+
        '<span class="material-symbols-outlined">home</span>'+
        '<span class="path-footer-btn-text">Voltar ao início</span>'+
      '</button>'+
    '</footer>';
  }
  function viewFood(){
    var tiles=FOODS.map(function(f){
      return '<button class="foodtile" data-action="pickFood" data-food="'+esc(f)+'">'+
        '<img class="food-img" src="'+(FOOD_IMAGES[f] || '')+'" alt="'+esc(f)+'">'+
        '<span class="nm">'+f+'</span></button>';
    }).join('');
    return '<div class="wrap"><div style="margin-bottom:22px">'+eyebrow('Combinar com comida')+
      '<h1 class="s">O que você vai comer?</h1><p class="sub" style="margin-top:8px;font-size:15px">Escolha a opção mais próxima do seu prato.</p></div>'+
      '<div class="foods">'+tiles+'</div>'+bottombar(true)+'</div>';
  }
  function viewCountry(){
    var tiles=COUNTRIES.map(function(c){
      return '<button class="ctile" data-action="pickCountry" data-country="'+esc(c.name)+'">'+
        '<span class="cflag"><img class="cflag-img" src="assets/imagens/bandeiras/'+c.code+'.png" alt="'+esc(c.name)+'"/></span>'+
        '<span class="cname">'+c.name+'</span>'+
      '</button>';
    }).join('');
    return '<div class="wrap country-wrap">'+
      '<div class="wine-stain wine-stain-1"></div><div class="wine-stain wine-stain-2"></div>'+
      '<header class="country-head">'+
        '<h1 class="country-title">Escolha o país</h1>'+
        '<p class="country-sub">Escolha um país para ver os vinhos disponíveis.</p>'+
      '</header>'+
      '<div class="countrygrid">'+tiles+'</div>'+bottombar(true)+'</div>';
  }
  function viewProcessing(){
    return '<div class="wrap center" style="padding:48px 0">'+
      '<div style="width:56px;height:56px;border-radius:50%;border:4px solid var(--paper2);border-top-color:var(--burgundy);animation:spin 1s linear infinite;margin:0 auto 28px"></div>'+
      '<h1 class="s">Analisando suas respostas</h1>'+
      '<p class="sub">Estamos buscando vinhos que combinam com sua escolha.</p></div>';
  }
  function viewResults(){
    var r=state.result;
    if(r.empty){
      return '<div class="wrap"><div class="card center"><h1 class="s">Catálogo indisponível no momento</h1>'+
        '<p class="sub">Procure um atendente do mercado para ajudar você.</p></div>'+bottombar(true)+'</div>';
    }
    if(r.noCountry){
      return '<div class="wrap"><div class="card center">'+
        '<div style="font-size:48px;margin-bottom:12px">🔍</div>'+
        '<h1 class="s">Nenhum vinho de '+esc(state.selectedCountry)+' no momento</h1>'+
        '<p class="sub" style="margin-top:10px">Ainda não temos vinhos desse país cadastrados. Experimente escolher outro país ou use outro caminho de busca.</p>'+
        '</div>'+bottombar(true)+'</div>';
    }
    var note=r.neutral?"Selecionamos opções seguras para quem quer uma escolha fácil de apreciar.":
             r.weak?"Não encontramos uma combinação perfeita, mas estas são as opções mais próximas da sua escolha.":
             state.flow==="country"?"Vinhos de "+esc(state.selectedCountry)+" disponíveis na adega.":null;
    var title=r.weak?"As opções mais próximas da sua escolha":
              state.flow==="country"?"Vinhos de "+esc(state.selectedCountry):
              "Encontramos vinhos que combinam com sua escolha";
    var cards=r.items.map(function(it,i){
      var w=it.wine, top=(i===0&&!r.neutral&&!r.weak&&state.flow!=="country");
      return '<button class="winecard'+(top?' top':'')+'" data-action="openWine" data-id="'+w.id+'">'+
        '<img class="winecard-glass-img" src="' + getWineGlassImg(w.type) + '" alt="' + esc(w.name) + '">'+
        '<span style="flex:1">'+(top?'<span class="tag">Mais recomendado</span>':'')+
          '<span class="nm" style="display:block">'+esc(w.name)+'</span>'+
          '<span class="meta"><b>'+brl(w.price)+'</b><span style="color:var(--lineStrong)">&bull;</span><span>'+w.type+'</span></span>'+
          '<span class="ph" style="display:block">'+esc(w.shortRecommendation)+'</span></span>'+
        '<span style="color:var(--inkSoft);transform:rotate(-90deg)">'+ic('chev')+'</span></button>';
    }).join('');
    return '<div class="wrap"><div style="margin-bottom:22px">'+eyebrow('Recomendação')+
      '<h1 class="s">'+title+'</h1>'+
      '<p class="sub" style="margin-top:8px;font-size:15px">Toque em um vinho para ver mais detalhes.</p>'+
      (note?'<div class="note">'+note+'</div>':'')+'</div>'+
      '<div class="stack" style="margin-top:0">'+cards+'</div>'+bottombar(true)+'</div>';
  }
  function dtItem(icon,label,value){
    return '<div class="dt-item"><span class="material-symbols-outlined">'+icon+'</span>'+
      '<div><p class="dt-item-label">'+label+'</p><p class="dt-item-value">'+esc(value||'—')+'</p></div></div>';
  }
  function dtTasteRow(label,value){
    var v=Math.max(0,Math.min(5,Math.round(value||0))), dots='',i;
    for(i=1;i<=5;i++){ dots+='<span class="dt-dot'+(i<=v?' on':'')+'"></span>'; }
    return '<div class="dt-taste-row"><span class="dt-taste-label">'+label+'</span><div class="dt-dots">'+dots+'</div></div>';
  }
  function viewDetails(){
    var w=state.selected.wine;
    var pairs=w.pairings.map(function(p){return '<span class="pair"><span class="material-symbols-outlined">'+(FOOD_MSICON[p.foodCategory]||'restaurant')+'</span>'+p.foodCategory+'</span>';}).join('');
    var t=w.taste||{fruit:0,sugar:0,acidity:0,tannin:0};
    var found=COUNTRIES.find(function(c){return c.name.toLowerCase()===w.country.toLowerCase();});
    var flagURL='assets/imagens/bandeiras/'+(found?found.code:'br')+'.png';
    var origin=esc(w.country)+(w.region?', '+esc(w.region):'');
    var desc=w.profileReason||w.shortRecommendation||'';

    var grid='<div class="dt-grid">'+
      dtItem('liquor','Tipo',w.type)+
      dtItem('verified','Classificação',w.perceivedSweetness)+
      dtItem('nutrition','Uva',w.grape)+
      dtItem('hourglass_empty','Amadurecimento',w.maturation)+
      dtItem('thermostat','Serviço',w.servingTemperature)+
      dtItem('percent','Álcool',w.alcohol)+
      dtItem('wine_bar','Volume',w.volume)+
      dtItem('calendar_month','Potencial de guarda',w.cellaring)+
    '</div>';

    var taste='<div class="dt-taste"><h3>Perfil de Sabor</h3>'+
      dtTasteRow('Fruta',t.fruit)+
      dtTasteRow('Doçura',t.sugar)+
      dtTasteRow('Acidez',t.acidity)+
      dtTasteRow('Tanino',t.tannin)+
    '</div>';

    return '<div class="details2">'+
      '<div class="dt-main">'+
        '<section class="dt-image">'+bottleSVG(w.type,w.profile,340)+'</section>'+
        '<section class="dt-content">'+
          '<div class="dt-header">'+
            '<div class="dt-title-row"><h1 class="dt-name">'+esc(w.name)+'</h1><div class="dt-price">'+brl(w.price)+'</div></div>'+
            '<div class="dt-origin"><span class="dt-flag"><img src="'+flagURL+'" alt="'+esc(w.country)+'"></span><span>'+origin+'</span></div>'+
            (w.winery?'<p class="dt-winery">'+esc(w.winery)+'</p>':'')+
            (desc?'<p class="dt-desc">'+esc(desc)+'</p>':'')+
          '</div>'+
          '<hr class="dt-divider">'+
          grid+
          taste+
          (pairs?'<div class="dt-pairs-block">'+eyebrow('Harmoniza bem com')+'<div class="pairs">'+pairs+'</div></div>':'')+
        '</section>'+
      '</div>'+
      bottombar(true)+
    '</div>';
  }

  /* ---------- Aprender ---------- */
  var LEARN_TYPES=[
    {type:"Tinto",desc:"Feito com uvas de casca escura. Costuma ter mais corpo e lembrar frutas vermelhas. Vai de leve a intenso.",serve:"Sirva entre 14 e 18 °C.",pairs:"Carnes, churrasco, massas de molho vermelho e queijos."},
    {type:"Branco",desc:"Em geral feito com uvas de casca clara. É mais leve e refrescante, com acidez agradável.",serve:"Sirva gelado, entre 8 e 12 °C.",pairs:"Peixes, aves, massas de molho branco e comida japonesa."},
    {type:"Rosé",desc:"Fica entre o tinto e o branco: cor rosada, leve, fresco e fácil de beber.",serve:"Sirva bem gelado, entre 8 e 10 °C.",pairs:"Aperitivos, saladas e pratos leves."},
    {type:"Espumante",desc:"Tem borbulhas e é bem refrescante. Ótimo para comemorar ou começar a refeição.",serve:"Sirva bem gelado, entre 6 e 8 °C.",pairs:"Aperitivos, queijos e frutos do mar."}
  ];
  var LEARN_COUNTRIES=[
    {c:"Brasil",t:"Destaque para os espumantes da Serra Gaúcha, além de tintos e brancos leves e frutados."},
    {c:"Chile",t:"Conhecido pelo bom custo-benefício. Tintos encorpados (Cabernet, Carménère) e brancos frescos."},
    {c:"Argentina",t:"Famoso pelo Malbec, um tinto encorpado e frutado, muitas vezes de vinhedos de altitude."},
    {c:"Portugal",t:"Grande variedade. Tintos marcantes do Douro e brancos leves como o Vinho Verde."},
    {c:"Itália",t:"Muitos estilos regionais. Tintos como o Chianti e uma enorme diversidade de uvas locais."},
    {c:"França",t:"Tradição em todas as categorias, com regiões clássicas como Bordeaux e Champagne."},
    {c:"Uruguai",t:"Conhecido pelo Tannat, um tinto robusto e de bastante estrutura."}
  ];
  var LEARN_SERVE=[
    {t:"Temperatura",d:"Espumante 6–8 °C · Branco e rosé 8–12 °C · Tinto leve 14–16 °C · Tinto encorpado 16–18 °C."},
    {t:"A taça",d:"Use taças com boca um pouco mais larga e segure pela haste, para não esquentar o vinho com a mão."},
    {t:"Deixar respirar",d:"Não é obrigatório. Tintos mais encorpados podem ficar mais agradáveis alguns minutos após abrir."},
    {t:"Depois de aberto",d:"Feche bem e guarde na geladeira. Costuma se manter por 2 a 3 dias; espumantes perdem gás mais rápido."},
    {t:"Quanto rende",d:"Uma garrafa de 750 ml serve cerca de 5 taças."}
  ];
  var LEARN_GRAPES={
    tintas:[
      {emoji:"🍇",name:"Cabernet Sauvignon",origin:"Origem: França · Muito cultivada no Chile, Argentina e Brasil",
       desc:"Uma das uvas tintas mais famosas do mundo. Produz vinhos encorpados, com sabor de frutas negras como amora e cassis, e um toque sutil de especiaria.",
       taste:"Sabor intenso · Taninos firmes · Longa duração"},
      {emoji:"🍷",name:"Merlot",origin:"Origem: França · Popular no Chile e no mundo todo",
       desc:"Macia e frutada, com sabor de ameixa, chocolate e frutas vermelhas. Menos intensa que o Cabernet, é considerada mais fácil e redonda de beber.",
       taste:"Sabor suave · Frutada · Fácil de gostar"},
      {emoji:"🌿",name:"Malbec",origin:"Origem: França · Ícone da Argentina",
       desc:"A uva símbolo da Argentina. Tinto encorpado com aromas de frutas negras, violeta e um toque aveludado. Costuma ser frutado, macio e muito agradável.",
       taste:"Encorpado · Frutado · Aveludado"},
      {emoji:"🍓",name:"Pinot Noir",origin:"Origem: França (Borgonha) · Cultivada na Argentina e no Brasil",
       desc:"Uva delicada e elegante. Produz tintos mais leves, com aromas de frutas vermelhas como cereja e morango. Considerada um dos vinhos mais refinados do mundo.",
       taste:"Leve · Elegante · Aromas delicados"},
      {emoji:"🌶️",name:"Syrah / Shiraz",origin:"Origem: França · Chamada Syrah na Europa, Shiraz na Austrália",
       desc:"Tinto encorpado e especiado, com notas de pimenta, frutas escuras e defumado. Personalidade marcante e muito distinta.",
       taste:"Intenso · Especiado · Marcante"},
      {emoji:"🏔️",name:"Tannat",origin:"Origem: França · Ícone do Uruguai",
       desc:"Uva robusta e de muito caráter. Produz tintos estruturados, com taninos firmes e boa capacidade de envelhecimento. É a uva mais representativa do Uruguai.",
       taste:"Robusto · Taninos fortes · Complexo"},
      {emoji:"🌱",name:"Carménère",origin:"Origem: França · Ícone do Chile",
       desc:"A uva símbolo do Chile. Tem sabor de pimentão verde, frutas escuras e especiarias. Os taninos são mais suaves que os do Cabernet.",
       taste:"Sabor único · Frutado · Suavemente especiado"},
      {emoji:"🍒",name:"Bordô",origin:"Origem: França · Muito cultivada no Sul do Brasil",
       desc:"Uva tradicional brasileira, especialmente da Serra Gaúcha. Produz tintos mais leves e muitas vezes suaves, com sabor de frutas vermelhas. Acessível e simpática.",
       taste:"Leve · Suave · Frutado"}
    ],
    brancas:[
      {emoji:"✨",name:"Chardonnay",origin:"Origem: França · Cultivada no mundo inteiro",
       desc:"A uva branca mais famosa do mundo. Versátil: pode ser leve e fresca ou mais encorpada e cremosa dependendo do estilo. Está presente em muitos espumantes.",
       taste:"Versátil · Frutado · Vai de leve a encorpado"},
      {emoji:"🍋",name:"Sauvignon Blanc",origin:"Origem: França · Destaque no Chile e Nova Zelândia",
       desc:"Muito aromática e fresca, com sabor de frutas cítricas, maracujá e ervas. Uma das brancas mais refrescantes e fáceis de beber.",
       taste:"Refrescante · Aromático · Cítrico"},
      {emoji:"🌸",name:"Riesling",origin:"Origem: Alemanha · Cultivada no Brasil (Serra Gaúcha)",
       desc:"Uva aromática e elegante. Pode ser seca, meio seca ou levemente adocicada. Muito usada em espumantes e em vinhos de mesa leves.",
       taste:"Aromático · Delicado · Do seco ao suave"},
      {emoji:"🕊️",name:"Pinot Grigio / Pinot Gris",origin:"Origem: França · Popular na Itália",
       desc:"Leve, fresco e fácil de beber. Tem sabor suave de frutas brancas como maçã e pera. Ideal para acompanhar frutos do mar e pratos delicados.",
       taste:"Leve · Fresco · Neutro e agradável"},
      {emoji:"🍑",name:"Moscato / Moscatel",origin:"Origem: Mediterrâneo · Muito cultivada no Brasil",
       desc:"Uva muito aromática e naturalmente adocicada. Produz espumantes suaves e perfumados, com aromas de pêssego, laranja e flores. Muito apreciada por quem prefere vinhos mais doces.",
       taste:"Suave · Aromático · Adocicado e floral"}
    ]
  };
  function viewLearn(){
    var tab=state.learnTab;
    var seg=["Vinhos","Uvas","Países","Como servir"].map(function(it){
      return '<button class="'+(tab===it?'on':'')+'" data-action="learnTab" data-tab="'+it+'">'+it+'</button>';
    }).join('');
    var body='';
    if(tab==="Vinhos"){
      body=LEARN_TYPES.map(function(it){
        return '<div class="learnrow"><div class="g">'+glassSVG(it.type,56)+'</div><div style="flex:1">'+
          '<div class="h">'+it.type+'</div><div class="d">'+it.desc+'</div>'+
          '<div class="x"><span class="s">'+it.serve+'</span><span class="c">Combina com: '+it.pairs+'</span></div></div></div>';
      }).join('');
    } else if(tab==="Uvas"){
      var tBlock=LEARN_GRAPES.tintas.map(function(g){
        return '<div class="grapecard">'+
          '<div class="grape-badge tinta">'+g.emoji+'</div>'+
          '<div style="flex:1"><span class="grape-type tinta">Uva tinta</span>'+
            '<span class="grape-name">'+g.name+'</span>'+
            '<div class="grape-origin">'+g.origin+'</div>'+
            '<div class="grape-desc">'+g.desc+'</div>'+
            '<div class="grape-taste">'+g.taste+'</div>'+
          '</div></div>';
      }).join('');
      var wBlock=LEARN_GRAPES.brancas.map(function(g){
        return '<div class="grapecard">'+
          '<div class="grape-badge branca">'+g.emoji+'</div>'+
          '<div style="flex:1"><span class="grape-type branca">Uva branca</span>'+
            '<span class="grape-name">'+g.name+'</span>'+
            '<div class="grape-origin">'+g.origin+'</div>'+
            '<div class="grape-desc">'+g.desc+'</div>'+
            '<div class="grape-taste">'+g.taste+'</div>'+
          '</div></div>';
      }).join('');
      body='<div class="grape-section">🍷 Uvas tintas</div>'+tBlock+
           '<div class="grape-section">🥂 Uvas brancas</div>'+wBlock;
    } else if(tab==="Países"){
      body=LEARN_COUNTRIES.map(function(it){return '<div class="infocard"><div class="h">'+it.c+'</div><div class="d">'+it.t+'</div></div>';}).join('');
    } else {
      body=LEARN_SERVE.map(function(it){return '<div class="infocard"><div class="hs">'+it.t+'</div><div class="d">'+it.d+'</div></div>';}).join('');
    }
    return '<div class="wrap"><div style="margin-bottom:18px">'+eyebrow('Aprender sobre vinhos')+'<h1 class="s">Conheça um pouco mais</h1></div>'+
      '<div class="seg">'+seg+'</div>'+body+bottombar(true)+'</div>';
  }

  /* ---------- FAQ ---------- */
  var FAQ=[
    {q:"Tinto pode ser servido gelado?",a:"Tintos leves podem ir levemente frescos (14–16 °C). Os mais encorpados ficam melhores um pouco menos gelados (16–18 °C). Evite gelo dentro do copo."},
    {q:"Vinho mais caro é sempre melhor?",a:"Não. O preço não garante que você vai gostar mais. O melhor vinho é o que agrada o seu paladar e combina com a ocasião."},
    {q:"Quanto tempo o vinho dura depois de aberto?",a:"Em geral 2 a 3 dias, bem fechado e na geladeira. Espumantes perdem o gás mais rápido."},
    {q:"Qual a diferença entre seco e suave?",a:"Seco tem pouca doçura. Suave (ou meio seco) é mais adocicado e costuma agradar quem está começando."},
    {q:"Preciso deixar o vinho respirar?",a:"Não é obrigatório. Tintos mais encorpados podem ficar mais agradáveis alguns minutos após abrir."},
    {q:"Qual vinho combina com carne vermelha?",a:"Tintos encorpados, como Cabernet Sauvignon, Malbec ou Tannat, costumam ser ótimas escolhas."},
    {q:"E com peixe ou comida japonesa?",a:"Brancos leves e espumantes são as opções mais seguras e refrescantes."},
    {q:"Como guardar a garrafa fechada?",a:"Em local fresco, escuro e longe do calor. Se a rolha for natural, deite a garrafa para manter a rolha úmida."},
    {q:"Preciso de uma taça especial?",a:"Ajuda, mas não é obrigatório. Uma taça limpa, de boca um pouco mais larga, já valoriza o aroma."}
  ];
  function viewFaq(){
    var items=FAQ.map(function(it,i){
      var open=state.faqOpen===i;
      return '<div class="faqitem'+(open?' open':'')+'">'+
        '<button class="faqq" data-action="faqToggle" data-i="'+i+'"><span>'+it.q+'</span>'+
          '<span class="chev" style="color:var(--burgundy);transform:'+(open?'rotate(180deg)':'none')+'">'+ic('chev')+'</span></button>'+
        (open?'<div class="faqa">'+it.a+'</div>':'')+'</div>';
    }).join('');
    return '<div class="wrap"><div style="margin-bottom:18px">'+eyebrow('Perguntas frequentes')+'<h1 class="s">Dúvidas comuns sobre vinhos</h1></div>'+
      '<div class="faq">'+items+'</div>'+bottombar(true)+'</div>';
  }

  /* ---------- Admin ---------- */
  function viewAdminAuth(){
    var errDisplay = state.adminAuthError ? 'block' : 'none';
    return '<div class="wrap" style="max-width:380px"><div class="card center">'+
      eyebrow('Acesso Restrito')+
      '<h1 class="s">Área do Administrador</h1>'+
      '<p class="sub" style="font-size:14px;margin-top:6px;margin-bottom:20px">Digite a senha para acessar as configurações.</p>'+
      '<input id="admin-pass" type="password" placeholder="Senha..." style="text-align:center;margin-bottom:14px;max-width:240px;margin-left:auto;margin-right:auto;display:block"/>'+
      '<div id="admin-auth-err" style="color:var(--burgundy);font-size:13px;margin-bottom:14px;display:'+errDisplay+';font-weight:600">Senha incorreta!</div>'+
      '<div style="display:flex;gap:8px;justify-content:center">'+
        '<button class="btn-outline" style="padding:10px 18px;font-size:15px;border-radius:12px" data-action="adminAuthCancel">Cancelar</button>'+
        '<button class="btn-primary" style="padding:10px 18px;font-size:15px;border-radius:12px;box-shadow:none" data-action="adminAuthConfirm">Entrar</button>'+
      '</div></div></div>';
  }
  function viewAdmin(){
    if(state.editing)return viewAdminForm();
    var q=(state.query||"").toLowerCase();
    var rows=state.wines.filter(function(x){return x.name.toLowerCase().indexOf(q)>-1;}).map(function(x){
      return '<div class="trow"><span style="font-weight:600">'+esc(x.name)+'</span>'+
        '<span class="muted">'+x.type+'</span><span class="muted">'+brl(x.price)+'</span><span class="muted">'+priceBand(x.price)+'</span>'+
        '<span style="display:flex;gap:8px;align-items:center">'+
          '<button class="status '+(x.isActive?'on':'off')+'" data-action="adminToggle" data-id="'+x.id+'">'+(x.isActive?'Ativo':'Inativo')+'</button>'+
          '<button class="nav ink" style="padding:8px 10px;color:var(--burgundy)" data-action="adminEdit" data-id="'+x.id+'">Editar</button>'+
        '</span></div>';
    }).join('');
    return '<div class="admin"><div class="head"><div>'+eyebrow('Área administrativa')+'<h1 class="s">Vinhos cadastrados</h1></div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn-sm fill" data-action="adminAdd">'+ic('plus')+' Novo vinho</button>'+
        '<button class="btn-sm out" style="color:var(--burgundy);border-color:var(--burgundy)" data-action="adminReset">Resetar padrões</button>'+
        '<button class="btn-sm out" data-action="adminExit">'+ic('x')+' Sair</button></div></div>'+
      '<input id="admin-search" placeholder="Buscar por nome…" value="'+esc(state.query||"")+'" data-action="search" style="margin-bottom:14px"/>'+
      '<div class="table"><div class="trow thead"><span>Nome</span><span>Tipo</span><span>Preço</span><span>Faixa</span><span>Status</span></div>'+rows+'</div>'+
      '<p class="muted" style="margin-top:14px">A faixa de preço é calculada automaticamente. A pontuação de recomendação é fixa no sistema — o administrador edita apenas os dados dos vinhos. A importação por planilha faz parte da versão de produção.</p></div>';
  }
  function selOptions(list,val){return list.map(function(o){return '<option'+(o===val?' selected':'')+'>'+o+'</option>';}).join('');}
  function viewAdminForm(){
    var f=state.editing;
    var occ=OCCASIONS.map(function(o){var on=f.occasions.indexOf(o)>-1;return '<button class="chip'+(on?' on':'')+'" data-action="occToggle" data-occ="'+esc(o)+'">'+o+'</button>';}).join('');
    var pairs=FOODS.map(function(food){
      var cur=null,i; for(i=0;i<f.pairings.length;i++){if(f.pairings[i].foodCategory===food){cur=f.pairings[i];break;}}
      var lvl=cur?cur.level:"none";
      var btns=[["none","—"],["primary","Principal"],["secondary","Secundária"]].map(function(p){
        return '<button class="lvl'+(lvl===p[0]?' on':'')+'" data-action="pairSet" data-food="'+esc(food)+'" data-level="'+p[0]+'">'+p[1]+'</button>';
      }).join('');
      var reason=lvl!=="none"?'<input data-action="pairReason" data-food="'+esc(food)+'" placeholder="Frase: por que combina com este prato" value="'+esc(cur?cur.pairingReason:"")+'" style="font-size:14px"/>':'';
      return '<div class="pairrow"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">'+
        '<span style="font-weight:600;font-size:14px">'+FOOD_ICON[food]+' '+food+'</span><span class="lvls">'+btns+'</span></div>'+reason+'</div>';
    }).join('');
    return '<div class="admin" style="max-width:820px">'+
      '<div class="head"><h1 class="s">'+(f.id==null?"Novo vinho":"Editar vinho")+'</h1><button class="nav soft" data-action="adminCancel">Cancelar</button></div>'+
      '<div class="card">'+
        '<div class="formgrid">'+
          '<div class="col2"><div class="lab">Nome do vinho *</div><input id="f-name" data-field="name" value="'+esc(f.name)+'"/></div>'+
          '<div><div class="lab">Preço (R$) *</div><input id="f-price" data-field="price" type="number" value="'+esc(f.price)+'"/><div class="muted" style="margin-top:4px">Faixa: '+priceBand(Number(f.price)||0)+'</div></div>'+
          '<div><div class="lab">Tipo *</div><select id="f-type" data-field="type">'+selOptions(TYPES,f.type)+'</select></div>'+
          '<div><div class="lab">Perfil *</div><select id="f-profile" data-field="profile">'+selOptions(PROFILES,f.profile)+'</select></div>'+
          '<div><div class="lab">Classificação *</div><select id="f-sweet" data-field="perceivedSweetness">'+selOptions(CLASSIFICATIONS,f.perceivedSweetness)+'</select></div>'+
          '<div><div class="lab">Nível para iniciantes</div><select id="f-beg" data-field="beginnerLevel">'+selOptions(BEGINNER,f.beginnerLevel)+'</select></div>'+
          '<div><div class="lab">Temperatura ideal *</div><input id="f-temp" data-field="servingTemperature" value="'+esc(f.servingTemperature)+'" placeholder="ex.: 16–18 °C"/></div>'+
          '<div><div class="lab">Uva *</div><input id="f-grape" data-field="grape" value="'+esc(f.grape)+'"/></div>'+
          '<div><div class="lab">País *</div><input id="f-country" data-field="country" value="'+esc(f.country)+'"/></div>'+
          '<div><div class="lab">Região</div><input id="f-region" data-field="region" value="'+esc(f.region||"")+'" placeholder="ex.: Mendoza"/></div>'+
          '<div><div class="lab">Vinícola</div><input id="f-winery" data-field="winery" value="'+esc(f.winery||"")+'" placeholder="ex.: Bodega ..."/></div>'+
          '<div><div class="lab">Volume</div><input id="f-vol" data-field="volume" value="'+esc(f.volume||"")+'" placeholder="ex.: 750 ml"/></div>'+
          '<div><div class="lab">Teor alcoólico</div><input id="f-abv" data-field="alcohol" value="'+esc(f.alcohol||"")+'" placeholder="ex.: 13%"/></div>'+
          '<div><div class="lab">Fechamento</div><select id="f-closure" data-field="closure">'+selOptions(CLOSURES,f.closure)+'</select></div>'+
          '<div><div class="lab">Amadurecimento</div><input id="f-mat" data-field="maturation" value="'+esc(f.maturation||"")+'" placeholder="ex.: 6 meses em carvalho"/></div>'+
          '<div class="col2"><div class="lab">Potencial de guarda</div><input id="f-cellar" data-field="cellaring" value="'+esc(f.cellaring||"")+'" placeholder="ex.: Consumir em até 3 anos"/></div>'+
          '<div class="col2"><div class="lab">Cor do vinho</div><input id="f-color" data-field="color" value="'+esc(f.color||"")+'" placeholder="ex.: Vermelho-rubi translúcido"/></div>'+
          '<div class="col2"><div class="lab">Notas de prova (0 a 5)</div>'+
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+
              '<div><div class="lab">Fruta</div><input id="t-fruit" type="number" min="0" max="5" data-field="taste.fruit" value="'+(f.taste?f.taste.fruit:0)+'"/></div>'+
              '<div><div class="lab">Açúcar</div><input id="t-sugar" type="number" min="0" max="5" data-field="taste.sugar" value="'+(f.taste?f.taste.sugar:0)+'"/></div>'+
              '<div><div class="lab">Acidez</div><input id="t-acid" type="number" min="0" max="5" data-field="taste.acidity" value="'+(f.taste?f.taste.acidity:0)+'"/></div>'+
              '<div><div class="lab">Tanino</div><input id="t-tan" type="number" min="0" max="5" data-field="taste.tannin" value="'+(f.taste?f.taste.tannin:0)+'"/></div>'+
            '</div></div>'+
          '<div class="col2"><div class="lab">Frase curta (card)</div><input id="f-short" data-field="shortRecommendation" value="'+esc(f.shortRecommendation)+'"/></div>'+
          '<div class="col2"><div class="lab">Por que recomendamos (frase base)</div><textarea id="f-reason" data-field="profileReason">'+esc(f.profileReason)+'</textarea></div>'+
        '</div>'+
        '<div style="margin-top:22px"><div class="lab">Ocasiões</div><div class="chips">'+occ+'</div></div>'+
        '<div style="margin-top:22px"><div class="lab">Harmonizações (principal / secundária)</div><div class="stack" style="margin-top:0;gap:8px">'+pairs+'</div></div>'+
        '<div style="display:flex;align-items:center;gap:12px;margin-top:22px">'+
          '<button class="status '+(f.isActive?'on':'off')+'" data-action="activeToggle">'+(f.isActive?'Ativo':'Inativo')+'</button>'+
          '<span class="muted">Apenas vinhos ativos aparecem nas recomendações.</span></div>'+
      '</div>'+
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:22px">'+
        '<button class="btn-sm out" data-action="adminCancel">Cancelar</button>'+
        '<button class="btn-sm fill" data-action="adminSave">Salvar vinho</button></div></div>';
  }

  /* ---------- Render principal ---------- */
  function view(){
    switch(state.screen){
      case "age": return viewAge();
      case "block": return viewBlock();
      case "path": return viewPath();
      case "q1": return viewQ1();
      case "q2": return questionScreen(2,"Qual o investimento pretendido?","Selecione a faixa de preço que melhor se adapta à ocasião.",[
        {key:"price",v:"Econômico",icon:"payments",label:"Econômico",desc:"Até R$ 50",next:"q3"},
        {key:"price",v:"Intermediário",icon:"savings",label:"Intermediário",desc:"R$ 50 – R$ 100",next:"q3"},
        {key:"price",v:"Premium",icon:"diamond",label:"Premium",desc:"Acima de R$ 100",next:"q3"},
        {key:"price",v:"tanto_faz",icon:"auto_awesome",label:"Estou aberto a sugestões",desc:"Deixe o sommelier decidir",next:"q3"}
      ]);
      case "q3": return questionScreen(3,"Qual estilo você prefere?","Escolha o perfil que mais combina com o seu paladar.",[
        {key:"profile",v:"Leve",icon:"water_drop",label:"Leve e suave",desc:"Macio e fácil de beber",next:"q4"},
        {key:"profile",v:"Equilibrado",icon:"balance",label:"Equilibrado",desc:"Um meio-termo versátil",next:"q4"},
        {key:"profile",v:"Intenso",icon:"local_fire_department",label:"Encorpado e marcante",desc:"Corpo e personalidade",next:"q4"},
        {key:"profile",v:"nao_sei",icon:"help",label:"Não sei",desc:"Deixe o sommelier decidir",next:"q4"}
      ]);
      case "q4": return questionScreen(4,"Qual é a ocasião?","Esta etapa é opcional, mas ajuda a refinar a escolha.",[
        {key:"occasion",v:"Jantar especial",icon:"restaurant",label:"Refeição especial",desc:"Um jantar à altura",next:"processing"},
        {key:"occasion",v:"Presente",icon:"card_giftcard",label:"Presente",desc:"Para presentear bem",next:"processing"},
        {key:"occasion",v:"Comemoração",icon:"celebration",label:"Celebração",desc:"Hora de comemorar",next:"processing"},
        {key:"occasion",v:"Almoço em família / refeição casual",icon:"weekend",label:"Relaxar em casa",desc:"Um momento descontraído",next:"processing"}
      ],{key:"occasion",v:"nao_sei",label:"Pular esta pergunta",next:"processing"});
      case "food": return viewFood();
      case "country": return viewCountry();
      case "processing": return viewProcessing();
      case "results": return viewResults();
      case "details": return viewDetails();
      case "learn": return viewLearn();
      case "faq": return viewFaq();
      case "admin": return viewAdmin();
      case "admin_auth": return viewAdminAuth();
      default: return viewAge();
    }
  }
  function chrome(inner){
    var isAge = (state.screen === "age");
    var isPath = (state.screen === "path" || state.screen === "q1" || state.screen === "q2" || state.screen === "q3" || state.screen === "q4");
    var brand=(state.screen!=="admin" && state.screen!=="admin_auth" && !isAge)?
      '<div class="brand-bar"><img class="brand-logo" src="assets/imagens/logo/planos.jpg" alt="Planos Supermercados Logo"></div>':'';
    var gear=isAge?'<button class="gear" title="Área administrativa" data-action="gear">⚙️</button>':'';
    var appClass = isAge ? 'app welcome-active' : (isPath ? 'app path-active' : 'app');
    return '<div class="'+appClass+'">'+brand+'<div class="stage">'+inner+'</div>'+gear+'</div>';
  }
  function render(){
    var act=document.activeElement, fid=act&&act.id?act.id:null;
    var sel=(act&&'selectionStart'in act)?act.selectionStart:null;
    app.innerHTML=chrome(view());
    if(fid){var el=document.getElementById(fid); if(el){el.focus(); if(sel!=null&&el.setSelectionRange){try{el.setSelectionRange(sel,sel);}catch(e){}}}}
    if(state.screen === "age"){
      setTimeout(function(){
        var card = document.querySelector('.welcome-card');
        if(card) card.classList.add('active');
      }, 50);
    }
  }

  /* ---------- Estado e navegação ---------- */
  var localWines = null;
  try {
    var stored = localStorage.getItem('adega_do_mercado_wines');
    if (stored) localWines = JSON.parse(stored);
  } catch(e) {
    console.error("Erro ao carregar localStorage:", e);
  }

  var state={
    screen:"age", flow:null, answers:{type:null,price:null,profile:null,occasion:null},
    food:null, selectedCountry:null, result:null, selected:null, learnTab:"Vinhos", faqOpen:0,
    wines:localWines || SEED, editing:null, query:"", isAdminAuthenticated:false, adminAuthError:false
  };

  // Ajusta o contador de ID global para evitar colisões
  state.wines.forEach(function(w){
    if(w.id > _id) _id = w.id;
  });

  function saveWines(){
    try {
      localStorage.setItem('adega_do_mercado_wines', JSON.stringify(state.wines));
    } catch(e) {
      console.error("Erro ao salvar localStorage:", e);
    }
  }

  function goHome(){
    state.screen="age"; state.flow=null; state.answers={type:null,price:null,profile:null,occasion:null};
    state.food=null; state.selectedCountry=null; state.result=null; state.selected=null; state.editing=null; state.query="";
    state.isAdminAuthenticated = false; state.adminAuthError = false;
  }
  var BACK={q2:"q1",q3:"q2",q4:"q3",food:"path",q1:"path",learn:"path",faq:"path",country:"path"};
  function handleBack(){
    if(state.screen==="details"){state.screen="results";return;}
    if(state.screen==="results"){
      if(state.flow==="food"){state.screen="food";return;}
      if(state.flow==="country"){state.screen="country";return;}
      goHome();return;
    }
    var p=BACK[state.screen]; if(p)state.screen=p;
  }
  function go(screen){
    state.screen=screen;
    if(screen==="processing"){
      render();
      setTimeout(function(){ state.result=recommend(); state.screen="results"; render(); },1500);
      return false;
    }
    return true;
  }

  /* ---------- Inatividade (RF02): 120s ---------- */
  var idleTimer=null;
  function resetIdle(){
    if(idleTimer)clearTimeout(idleTimer);
    if(state.screen==="admin" || state.screen==="admin_auth")return;
    idleTimer=setTimeout(function(){ goHome(); render(); },120000);
  }

  /* ---------- Eventos ---------- */
  function readField(field,val,el){
    if(field==="price"){ state.editing.price=Number(val)||0; }
    else if(field.indexOf(".")>-1){ var pp=field.split("."); if(!state.editing[pp[0]])state.editing[pp[0]]={}; state.editing[pp[0]][pp[1]]=Math.max(0,Math.min(5,Math.round(Number(val)||0))); }
    else { state.editing[field]=val; }
  }
  app.addEventListener('click',function(e){
    var el=e.target.closest('[data-action]'); if(!el)return;
    var a=el.dataset.action, d=el.dataset;
    // ações de input não tratadas aqui
    if(a==="search"||a==="field"||a==="pairReason")return;
    var willRender=true;
    switch(a){
      case "ageYes": state.screen="path"; break;
      case "ageNo": state.screen="block"; break;
      case "home": goHome(); break;
      case "back": handleBack(); break;
      case "startTaste": state.flow="taste"; state.screen="q1"; break;
      case "startFood": state.flow="food"; state.screen="food"; break;
      case "startCountry": state.flow="country"; state.screen="country"; break;
      case "pickCountry":
        state.selectedCountry=d.country;
        state.result=recommendCountry();
        state.screen="results"; break;
      case "answer":
        state.answers[d.key]=d.val;
        willRender=go(d.next); break;
      case "pickFood": state.food=d.food; willRender=go("processing"); break;
      case "openWine":
        var id=Number(d.id), found=null;
        state.result.items.forEach(function(it){if(it.wine.id===id)found=it;});
        state.selected=found; state.screen="details"; break;
      case "openLearn": state.screen="learn"; break;
      case "openFaq": state.screen="faq"; break;
      case "learnTab": state.learnTab=d.tab; break;
      case "faqToggle": state.faqOpen=(state.faqOpen===Number(d.i)?-1:Number(d.i)); break;
      case "gear":
        if(state.isAdminAuthenticated){
          state.screen="admin";
        } else {
          state.screen="admin_auth";
        }
        break;
      case "adminAuthConfirm":
        var passInput = document.getElementById('admin-pass');
        if(passInput && passInput.value === "1234") {
          state.isAdminAuthenticated = true;
          state.adminAuthError = false;
          state.screen = "admin";
        } else {
          state.adminAuthError = true;
          setTimeout(function(){
            var inp = document.getElementById('admin-pass');
            if(inp) inp.focus();
          }, 50);
        }
        break;
      case "adminAuthCancel":
        state.adminAuthError = false;
        state.screen = "age";
        break;
      case "adminReset":
        if(confirm("Tem certeza que deseja resetar o catálogo para as configurações padrão de fábrica? Todas as edições e novos vinhos serão perdidos.")){
          state.wines = JSON.parse(JSON.stringify(SEED));
          var maxSeedId = 0;
          SEED.forEach(function(w){ if(w.id > maxSeedId) maxSeedId = w.id; });
          _id = maxSeedId;
          saveWines();
        } else {
          willRender = false;
        }
        break;
      case "adminAdd": state.editing={id:null,name:"",price:0,type:"Tinto",profile:"Equilibrado",perceivedSweetness:"Seco",beginnerLevel:"Médio",grape:"",country:"",region:"",winery:"",servingTemperature:"",volume:"750 ml",alcohol:"13%",closure:"Rolha",color:"",maturation:"",cellaring:"",taste:{fruit:3,sugar:0,acidity:3,tannin:2},isActive:true,shortRecommendation:"",profileReason:"",occasions:[],pairings:[]}; break;
      case "adminEdit":
        var w=state.wines.filter(function(x){return x.id===Number(d.id);})[0];
        state.editing=JSON.parse(JSON.stringify(w)); break;
      case "adminToggle":
        state.wines=state.wines.map(function(x){return x.id===Number(d.id)?Object.assign({},x,{isActive:!x.isActive}):x;});
        saveWines();
        break;
      case "adminExit":
        state.isAdminAuthenticated = false;
        state.screen="age"; break;
      case "adminCancel": state.editing=null; break;
      case "adminSave":
        var f=state.editing;
        if(!f.name.trim()||!(Number(f.price)>0))return;
        if(f.id==null){ f.id=++_id; state.wines=state.wines.concat([f]); }
        else { state.wines=state.wines.map(function(x){return x.id===f.id?f:x;}); }
        saveWines();
        state.editing=null; break;
      case "occToggle":
        var o=d.occ, arr=state.editing.occasions;
        state.editing.occasions = arr.indexOf(o)>-1 ? arr.filter(function(x){return x!==o;}) : arr.concat([o]);
        break;
      case "pairSet":
        var food=d.food, level=d.level, ps=state.editing.pairings.filter(function(p){return p.foodCategory!==food;});
        if(level!=="none"){ var ex=state.editing.pairings.filter(function(p){return p.foodCategory===food;})[0];
          ps=ps.concat([{foodCategory:food,level:level,pairingReason:ex?ex.pairingReason:""}]); }
        state.editing.pairings=ps; break;
      case "activeToggle": state.editing.isActive=!state.editing.isActive; break;
      default: willRender=false;
    }
    if(willRender)render();
  });
  function onInput(e){
    var el=e.target.closest('[data-action]');
    if(el){
      var a=el.dataset.action;
      if(a==="search"){ state.query=el.value; render(); return; }
      if(a==="pairReason"){
        var food=el.dataset.food;
        state.editing.pairings=state.editing.pairings.map(function(p){return p.foodCategory===food?Object.assign({},p,{pairingReason:el.value}):p;});
        render(); return;
      }
    }
    // Campos do formulário admin: identificados por data-field (não têm data-action)
    var fld=e.target.closest('[data-field]');
    if(fld && state.editing){ readField(fld.dataset.field,fld.value,fld); render(); }
  }
  app.addEventListener('input',onInput);
  app.addEventListener('change',onInput);
  app.addEventListener('keydown',function(e){
    if(e.key === "Enter" && document.activeElement && document.activeElement.id === "admin-pass") {
      e.preventDefault();
      var confirmBtn = app.querySelector('[data-action="adminAuthConfirm"]');
      if(confirmBtn) confirmBtn.click();
    }
  });
  document.addEventListener('pointerdown',resetIdle,{passive:true});

  /* ---------- Início ---------- */
  render();
})();
