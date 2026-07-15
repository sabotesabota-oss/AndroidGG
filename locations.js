/* =====================================================
   Stick Studio AI - FIXED
   locations.js
===================================================== */
const Locations = {
    list: [],
    async process() {
        this.clear();
        const scenes = Scenes.getAll();
        scenes.forEach(scene => this.extract(scene));
        console.log(`${this.list.length} cenário(s) encontrado(s).`);
        return this.list;
    },
    extract(scene) {
        const keywords = ["floresta","cidade","castelo","casa","quarto","escola","praia","parque","rua","montanha","rio","lago","deserto","igreja","hospital","mercado","fazenda","vila","oceano","caverna","floresta escura","ponte","torre"];
        const text = scene.text.toLowerCase();
        keywords.forEach(location => {
            if (!text.includes(location)) return;
            if (this.exists(location)) { this.addScene(location, scene.id); return; }
            this.list.push({ id: this.list.length + 1, name: location, description: "", style: "stick minimal", lighting: "neutra", weather: "", scenes: [scene.id] });
        });
    },
    exists(name) { return this.list.some(l => l.name === name); },
    addScene(name, sceneId) {
        const loc = this.list.find(i => i.name === name);
        if (!loc) return;
        if (!loc.scenes.includes(sceneId)) loc.scenes.push(sceneId);
    },
    getAll() { return this.list; },
    get(name) { return this.list.find(l => l.name === name); },
    clear() { this.list = []; }
};
