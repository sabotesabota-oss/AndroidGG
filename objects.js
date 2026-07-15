/* =====================================================
   Stick Studio AI - OBJECTS FIX 0.8.2
   Agora detecta qualquer objeto após "com", "usando", etc.
   e lista ampliada incluindo madeira, pau, etc.
===================================================== */
const Objects = {
    list: [],
    async process(){ this.clear(); const scenes=Scenes.getAll(); scenes.forEach(s=>this.extract(s)); console.log(`${this.list.length} objeto(s)`); return this.list; },
    extract(scene){
        const text = (scene.text||"").toLowerCase();
        // lista base ampliada
        const base = ["espada","escudo","livro","mochila","celular","telefone","carro","moto","bicicleta","arma","revólver","pistola","arco","flecha","machado","martelo","chave","porta","janela","mesa","cadeira","computador","notebook","tv","microfone","câmera","lanterna","mapa","caixa","poção","cristal","anel","madeira","pau","galho","pedra","tocha","corda","moeda","cajado","vara","faca","panela","fruta","peixe","cesta","corda","vara","lança"];
        const found = new Set();

        // 1) palavras-chave diretas
        base.forEach(obj=>{ if(text.includes(obj)) found.add(obj); });

        // 2) heurística: pega substantivos após "com", "usando", "segurando", "carregando", "com uma", "com um"
        const regex = /(?:com|usando|segurando|carregando|empunhando)\s+(?:uma?\s+)?([a-zçãõáéíóúâêô]{3,15})/gi;
        let m;
        while((m=regex.exec(text))!==null){
            const word = m[1].toLowerCase();
            if(word.length>=3 && !["floresta","cena","joão","maria","para","pela","pelo","muito","como","isso"].includes(word)){
                found.add(word);
            }
        }

        found.forEach(name=>{
            if(this.exists(name)){ this.addScene(name, scene.id); return; }
            this.list.push({ id: Date.now()+Math.floor(Math.random()*1000), name, description:"", category:"prop", scenes:[scene.id] });
        });
    },
    exists(name){ return this.list.some(o=>o.name===name); },
    addScene(name,id){ const o=this.list.find(i=>i.name===name); if(o && !o.scenes.includes(id)) o.scenes.push(id); },
    getAll(){ return this.list; },
    get(name){ return this.list.find(o=>o.name===name); },
    clear(){ this.list=[]; }
};
