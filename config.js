/* =====================================================
   Stick Studio AI - CONFIG FIX 0.8.2
   Compatível com código antigo e novo
===================================================== */
const Config = {
    // === IMAGEM ===
    getImageProvider(){ return localStorage.getItem("ss_image_provider") || "pollinations"; },
    setImageProvider(p){ localStorage.setItem("ss_image_provider", p); },
    // alias antigo que causava o erro da sua print
    getProvider(){ return this.getImageProvider(); },
    setProvider(p){ return this.setImageProvider(p); },

    getStabilityKey(){ return localStorage.getItem("ss_stability_key") || ""; },
    setStabilityKey(k){ localStorage.setItem("ss_stability_key", (k||"").trim()); },
    getGeminiKey(){ return localStorage.getItem("ss_gemini_key") || ""; },
    setGeminiKey(k){ localStorage.setItem("ss_gemini_key", (k||"").trim()); },

    // === TRANSCRIÇÃO ===
    getTranscriptionProvider(){ return localStorage.getItem("ss_transcription_provider") || "mock"; },
    setTranscriptionProvider(p){ localStorage.setItem("ss_transcription_provider", p); },
    getGroqKey(){ return localStorage.getItem("ss_groq_key") || ""; },
    setGroqKey(k){ localStorage.setItem("ss_groq_key", (k||"").trim()); },
    getOpenAIKey(){ return localStorage.getItem("ss_openai_key") || ""; },
    setOpenAIKey(k){ localStorage.setItem("ss_openai_key", (k||"").trim()); },

    hasImageKey(){
        const p=this.getImageProvider();
        if(p==="pollinations") return true;
        if(p==="stability") return !!this.getStabilityKey();
        if(p==="gemini") return !!this.getGeminiKey();
        return false;
    },
    hasTranscriptionKey(){
        const p=this.getTranscriptionProvider();
        if(p==="mock" || p==="browser") return true;
        if(p==="groq") return !!this.getGroqKey();
        if(p==="openai") return !!this.getOpenAIKey();
        return false;
    }
};
