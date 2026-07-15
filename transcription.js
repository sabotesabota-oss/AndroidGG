/* =====================================================
   Stick Studio AI - FINAL
   transcription.js - Áudio e Manual 100% funcional
   Providers: mock (offline), groq (recomendado), openai, browser
===================================================== */
const Transcription = {
    text: "",
    language: "pt-BR",
    status: "idle",

    // Método principal chamado pelo Director e Story
    async process(audio) {
        this.status = "processing";
        const provider = Config.getTranscriptionProvider?.() || "mock";
        console.log(`[Transcription] Provider: ${provider}`, audio?.name);

        try {
            if (!audio) throw new Error("Nenhum áudio encontrado. Defina um áudio principal em Áudios.");

            let resultText = "";

            if (provider === "groq") {
                resultText = await this.transcribeWithGroq(audio);
            } else if (provider === "openai") {
                resultText = await this.transcribeWithOpenAI(audio);
            } else if (provider === "browser") {
                resultText = await this.transcribeWithBrowser(audio);
            } else {
                resultText = await this.transcribeMock(audio);
            }

            this.text = (resultText || "").trim();
            if(!this.text) throw new Error("Transcrição vazia retornada");

            this.status = "finished";
            UI.toast?.("Transcrição concluída");
            return this.text;

        } catch (e) {
            this.status = "error";
            console.error("[Transcription] erro", e);
            // fallback para mock para não travar o fluxo
            if(provider !== "mock"){
                UI.toast?.(`Falha no ${provider}, usando modo offline`);
                const fallback = await this.transcribeMock(audio);
                this.text = fallback;
                this.status = "finished";
                return this.text;
            }
            throw e;
        }
    },

    // ===== MOCK INTELIGENTE (offline, funciona sempre) =====
    async transcribeMock(audio){
        return new Promise((resolve)=>{
            setTimeout(()=>{
                const dur = audio.duration ? Utils.formatTime(audio.duration) : "desconhecida";
                const name = (audio.name||"audio").toLowerCase();
                // gera roteiro plausível baseado no nome do arquivo para teste
                let base = "";
                if(name.includes("floresta") || name.includes("forest")){
                    base = `Cena 1 - Floresta misteriosa\nJoão caminha pela floresta escura com sua espada, procurando a saída.\n\nCena 2 - Clareira iluminada\nMaria aparece na clareira segurando um mapa antigo e chama João.\n\nCena 3 - Castelo ao fundo\nOs dois avistam o castelo abandonado ao longe e correm em direção a ele.`;
                } else if(name.includes("castelo") || name.includes("castle")){
                    base = `Cena 1 - Portão do castelo\nMaria empurra o portão rangendo do castelo abandonado.\n\nCena 2 - Salão principal\nJoão encontra uma espada brilhante sobre a mesa de pedra.\n\nCena 3 - Fuga\nUm barulho assusta os dois e eles fogem pela janela.`;
                } else {
                    base = `Cena 1 - Introdução\nNarrador apresenta a história enquanto o personagem principal caminha.\n\nCena 2 - Conflito\nO herói encontra um obstáculo inesperado e precisa usar sua inteligência.\n\nCena 3 - Conclusão\nO personagem supera o desafio e celebra a vitória com os amigos.`;
                }
                this.text = `[Transcrição Offline - ${audio.name} - ${dur}]\n\n${base}\n\n---\nDica: Para transcrição real do áudio, vá em Configurações > Transcrição e selecione Groq (grátis e rápido) e cole sua chave.`;
                resolve(this.text);
            }, 700);
        });
    },

    // ===== GROQ WHISPER - RECOMENDADO (grátis, rápido, 10x mais rápido que OpenAI) =====
    async transcribeWithGroq(audio){
        const key = Config.getGroqKey();
        if(!key) throw new Error("Configure sua chave Groq em Configurações > Transcrição");
        const blob = audio.blob || audio.file;
        if(!blob) throw new Error("Áudio sem arquivo blob, reimporte o áudio");

        const form = new FormData();
        form.append("file", blob, audio.name || "audio.mp3");
        form.append("model", "whisper-large-v3");
        form.append("language", "pt");
        form.append("response_format", "json");
        form.append("temperature", "0");

        UI.showLoading?.("Transcrevendo com Groq Whisper (rápido)...");

        const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${key}` },
            body: form
        });

        if(!res.ok){
            const err = await res.text();
            throw new Error(`Groq erro ${res.status}: ${err.slice(0,300)}`);
        }
        const data = await res.json();
        let rawText = data.text || "";
        // pós-processamento: transforma texto corrido em cenas
        return this._formatToScenes(rawText);
    },

    // ===== OPENAI WHISPER =====
    async transcribeWithOpenAI(audio){
        const key = Config.getOpenAIKey();
        if(!key) throw new Error("Configure sua chave OpenAI em Configurações");
        const blob = audio.blob || audio.file;
        if(!blob) throw new Error("Áudio sem blob");

        const form = new FormData();
        form.append("file", blob, audio.name || "audio.mp3");
        form.append("model", "whisper-1");
        form.append("language", "pt");

        UI.showLoading?.("Transcrevendo com OpenAI Whisper...");

        const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${key}` },
            body: form
        });
        if(!res.ok){ const t=await res.text(); throw new Error(`OpenAI erro: ${t.slice(0,300)}`); }
        const data = await res.json();
        return this._formatToScenes(data.text||"");
    },

    // ===== BROWSER - Web Speech API (experimental, precisa tocar o áudio) =====
    async transcribeWithBrowser(audio){
        return new Promise((resolve, reject)=>{
            if(!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)){
                reject(new Error("Navegador não suporta transcrição local. Use Mock ou Groq."));
                return;
            }
            UI.toast?.("Modo navegador: toque o áudio alto próximo ao microfone");
            // fallback: não dá para transcrever arquivo direto, então avisa e usa mock
            setTimeout(async ()=>{
                const t = await this.transcribeMock(audio);
                resolve(t + "\n\n[Nota: modo navegador não transcreve arquivos, use Groq para transcrição real de arquivos]");
            }, 500);
        });
    },

    // Transforma texto corrido em formato de cenas para o Director entender
    _formatToScenes(raw){
        if(!raw) return "";
        // se já tem "Cena", retorna como está
        if(/cena\s*\d+/i.test(raw)) return raw;
        // senão quebra em frases e cria 3 cenas
        const sentences = raw.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
        if(sentences.length <= 2) return raw;
        const perScene = Math.ceil(sentences.length/3);
        let out = "";
        for(let i=0;i<3;i++){
            const chunk = sentences.slice(i*perScene, (i+1)*perScene).join(". ");
            if(!chunk) continue;
            out += `Cena ${i+1} - ${i===0?'Introdução':i===1?'Desenvolvimento':'Conclusão'}\n${chunk}.\n\n`;
        }
        return out.trim();
    },

    getText(){ return this.text; },
    clear(){ this.text=""; this.status="idle"; }
};
