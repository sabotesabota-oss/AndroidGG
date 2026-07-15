/* =====================================================
   Stick Studio AI - FINAL HÍBRIDO
   story.js - Seu original + persistência
===================================================== */
const Story = {
    source: "manual", // manual | audio
    text: "",
    audio: null,

    setSource(source) {
        this.source = source==="audio"?"audio":"manual";
        // NOVO: persiste no projeto para não perder ao trocar de aba
        if(Projects?.current){
            Projects.updateCurrent?.({ storySource: this.source });
        }
        localStorage.setItem("ss_story_source", this.source);
        if(typeof UI !== "undefined") UI.updateStoryUI?.();
    },

    getSource() { return this.source; },

    setText(text, persist=true) {
        this.text = (text || "").trim();
        if(persist && Projects?.current){
            Projects.updateCurrent?.({ storyText: this.text });
        }
        localStorage.setItem("ss_story_text", this.text);
    },

    append(text) {
        this.text += "\n" + (text||"");
        this.setText(this.text);
    },

    getText() { return this.text; },

    clear() {
        this.text = "";
        this.audio = null;
        localStorage.removeItem("ss_story_text");
    },

    hasStory() { return this.text.trim().length > 10; },

    setAudio(audio) { this.audio = audio; },
    getAudio() { return this.audio; },

    async loadFromAudio(audio) {
        if (!audio) return false;
        this.audio = audio;
        this.source = "audio";
        try{
            const txt = await Transcription.process(audio);
            this.text = txt || "";
            this.setText(this.text);
            return true;
        }catch(e){
            console.error("[Story] loadFromAudio falhou", e);
            return false;
        }
    },

    loadFromManual(text) {
        this.source = "manual";
        this.text = (text || "").trim();
        this.setText(this.text);
        return true;
    }
};
