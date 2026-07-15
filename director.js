/* =====================================================
   Stick Studio AI - FINAL
   director.js - Suporta Manual e Áudio com transcrição real
===================================================== */
const Director = {
    projectId: null,
    story: "",

    async start(projectId) {
        this.projectId = projectId;
        console.log("[Director] Iniciado modo:", Story.getSource());

        try {
            UI.showLoading?.("Preparando história...");

            await this.loadStory();

            if (!this.story || !this.story.trim() || this.story.trim().length < 5) {
                UI.hideLoading?.();
                if(Story.getSource()==="manual"){
                    alert("Roteiro vazio. Vá em Roteiro e escreva sua história com pelo menos 2 cenas.");
                    Navigation.show("story");
                } else {
                    alert("Transcrição vazia. Verifique o áudio principal em Áudios ou troque para Roteiro Manual.");
                    Navigation.show("audio");
                }
                return;
            }

            await this.process();
            this.finish();

        } catch (error) {
            console.error("[Director] Erro:", error);
            UI.hideLoading?.();
            UI.toast?.("Erro: " + error.message);
            alert("Erro durante análise:\n\n"+error.message);
        }
    },

    async loadStory() {
        // MODO MANUAL - usa texto direto
        if (Story.getSource() === "manual") {
            this.story = Story.getText();
            console.log("[Director] Modo MANUAL, chars:", this.story.length);
            // salva no Transcription para exibir na view
            if(typeof Transcription!=="undefined") Transcription.text = this.story;
            return;
        }

        // MODO ÁUDIO - transcreve áudio principal
        const audio = AudioManager.getMainAudio?.() || AudioManager.getAll?.()[0];
        if (!audio) {
            this.story = "";
            throw new Error("Nenhum áudio principal definido. Vá em Áudios e marque um como ⭐ Principal.");
        }

        UI.showLoading?.(`Transcrevendo ${audio.name}...`);

        const text = await Transcription.process(audio);
        Story.setText(text, true);
        this.story = text;
        console.log("[Director] Modo ÁUDIO transcrito, chars:", text.length);
    },

    async process() {
        console.log("[Director] Processando história...");
        UI.showLoading?.("Criando cenas...");
        await this.createScenes();
        UI.showLoading?.("Detectando personagens...");
        await this.detectCharacters();
        UI.showLoading?.("Detectando cenários...");
        await this.detectLocations();
        UI.showLoading?.("Detectando objetos...");
        await this.detectObjects();
        UI.showLoading?.("Gerando prompts...");
        await this.createPrompts();
        UI.showLoading?.("Montando timeline...");
        await this.createTimeline();
    },

    async createScenes() {
        if (typeof Scenes?.process === "function") Scenes.process(this.story);
        else if (typeof Scenes?.generate === "function") Scenes.generate(this.story);
        // salva story no projeto
        if(Projects.current) Projects.updateCurrent?.({ storyText: this.story });
    },

    async detectCharacters() { if (typeof Characters?.process === "function") await Characters.process(this.story); },
    async detectLocations() { if (typeof Locations?.process === "function") await Locations.process(); },
    async detectObjects() { if (typeof Objects?.process === "function") await Objects.process(); },

    async createPrompts() {
        // compat com duas APIs: Prompts.generate(projectId) ou Prompts.process()
        if (typeof Prompts?.generate === "function") await Prompts.generate(this.projectId);
        else if (typeof Prompts?.process === "function") await Prompts.process();
        else if (typeof Prompts?.create === "function") await Prompts.create();
    },

    async createTimeline() {
        if (typeof Timeline === "undefined") return;
        if (typeof Timeline.generate === "function") Timeline.generate();
        else if (typeof Timeline.build === "function") Timeline.build();
    },

    finish() {
        console.log("[Director] Finalizado");
        UI.renderDirector?.();
        UI.updateDashboard?.();
        UI.hideLoading?.();
        UI.toast?.(Story.getSource()==="manual" ? "Roteiro analisado!" : "Áudio transcrito e analisado!");
    },

    reset(){ this.projectId=null; this.story=""; },
    async reanalyze(){ if(!Projects.current){alert("Sem projeto");return;} this.reset(); await this.start(Projects.current.id); },
    getStory(){return this.story;}
};
