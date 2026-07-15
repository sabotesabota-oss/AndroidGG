/* =====================================================
   Stick Studio AI - FINAL com Geração de Imagens
   prompts.js - agora com botão de gerar imagens
===================================================== */
const Prompts = {
    list: [],

    clear(){ this.list = []; },

    getAll(){ return this.list; },

    count(){ return this.list.length; },

    async generate(projectId){
        this.list = [];
        const scenes = Scenes.getAll();
        const characters = Characters.getAll();
        const locations = Locations.getAll();
        const objects = Objects.getAll();

        for(const scene of scenes){
            const chars = characters.filter(c=>c.scenes?.includes(scene.id)).map(c=>c.name).join(", ") || "stick figures";
            const loc = locations.find(l=>l.scenes?.includes(scene.id))?.name || scene.location || "simple background";
            const objs = objects.filter(o=>o.scenes?.includes(scene.id)).map(o=>o.name).join(", ");

            // prompt otimizado para stick figure
            const prompt = `Minimalist black and white stick figure animation, ${scene.title}. Scene: ${scene.text.slice(0,180)}. Characters: ${chars}. Location: ${loc}. ${objs?`Objects: ${objs}.`:''} Style: clean line art, white background, simple stickman, no shadows, 2D, storyboard frame, high contrast`.replace(/\s+/g," ").trim();

            this.list.push({
                id: Date.now()+scene.id,
                projectId,
                sceneId: scene.id,
                sceneTitle: scene.title,
                prompt,
                negativePrompt: "photorealistic, 3d, color, blurry, text, watermark",
                createdAt: new Date().toISOString()
            });
        }

        try{
            const store = Database.getStore("prompts","readwrite");
            for(const p of this.list) store.put(p);
        }catch(e){ console.warn("[Prompts] save fallback", e); }

        console.log(`[Prompts] ${this.list.length} prompts gerados`);
        return this.list;
    },

    async loadByProject(projectId){
        try{
            const all = await Database.getAll("prompts");
            this.list = (all||[]).filter(p=>String(p.projectId)===String(projectId));
        }catch{ this.list = []; }
        return this.list;
    }
};
