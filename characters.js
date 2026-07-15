/* =====================================================
   Stick Studio AI - FIXED
   characters.js - Memória de Personagens
===================================================== */

const Characters = {
    list: [],

    STOPWORDS: new Set([
        "Cena", "Floresta", "Cidade", "Castelo", "Casa", "Quarto",
        "Escola", "Praia", "Parque", "Rua", "Montanha", "Rio", "Lago",
        "Deserto", "Igreja", "Hospital", "Mercado", "Fazenda", "Vila",
        "Oceano", "Caverna", "Espada", "Escudo"
    ]),

    async process() {
        this.clear();
        const scenes = Scenes.getAll();
        scenes.forEach(scene => this.extract(scene));
        console.log(`${this.list.length} personagem(ns) encontrado(s).`);
        return this.list;
    },

    extract(scene) {
        // Pega palavras capitalizadas, mas filtra melhor
        const words = scene.text.match(/\b[A-ZÀ-Ú][a-zà-ú]{2,}\b/g) || [];
        const uniqueWords = [...new Set(words)];

        uniqueWords.forEach(name => {
            if (this.STOPWORDS.has(name)) return;
            if (name.length < 3) return;

            if (this.exists(name)) {
                // BUG CORRIGIDO: antes retornava sem adicionar a cena
                this.addScene(name, scene.id);
                return;
            }

            this.list.push({
                id: this.list.length + 1,
                name,
                description: "",
                age: "",
                gender: "",
                appearance: { hair: "", eyes: "", clothes: "", colors: "" },
                expressions: [],
                scenes: [scene.id]
            });
        });
    },

    exists(name) {
        return this.list.some(c => c.name.toLowerCase() === name.toLowerCase());
    },

    addScene(characterName, sceneId) {
        const character = this.list.find(c => c.name.toLowerCase() === characterName.toLowerCase());
        if (!character) return;
        if (!character.scenes.includes(sceneId)) {
            character.scenes.push(sceneId);
        }
    },

    getAll() { return this.list; },
    get(name) { return this.list.find(c => c.name.toLowerCase() === name.toLowerCase()); },
    clear() { this.list = []; }
};
