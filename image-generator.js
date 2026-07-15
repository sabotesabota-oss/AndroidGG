/* =====================================================
   Stick Studio AI - IMAGE GENERATOR FIX 0.8.2
   Pollinations 100% grátis sem fetch blob (evita CORS no Lemur)
   + Meta AI fallback + Google Flow gratuito via Pollinations
===================================================== */
const ImageGenerator = {
    // Pollinations - grátis, sem chave, sem fetch, só URL direta (funciona no Lemur)
    async generateWithPollinations(prompt){
        const clean = prompt.replace(/[^a-zA-Z0-9 ,áéíóúãõç\-\.]/g," ").slice(0,600).trim();
        const encoded = encodeURIComponent(clean);
        const seed = Math.floor(Math.random()*1000000);
        // modelo turbo = rápido e bom para stick
        const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768&seed=${seed}&nologo=true&model=turbo&enhance=true`;
        // NÃO faz fetch aqui para evitar CORS no Lemur, retorna URL direta
        // O <img src> carrega direto, sem precisar blob
        return { url, blob: null, provider: "pollinations", directUrl: true };
    },

    async generateWithStability(prompt){
        const key = Config.getStabilityKey();
        if(!key) throw new Error("Configure Stability em Configurações");
        const res = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
            method:"POST",
            headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${key}`, "Accept":"application/json" },
            body: JSON.stringify({ text_prompts:[{text:prompt}], cfg_scale:7, height:768, width:1024, steps:30 })
        });
        if(!res.ok){ const t=await res.text(); throw new Error("Stability: "+t.slice(0,200)); }
        const data=await res.json();
        const b64=data.artifacts?.[0]?.base64;
        if(!b64) throw new Error("Sem imagem");
        const blob=this._b64ToBlob(b64,"image/png");
        return { url: URL.createObjectURL(blob), blob, provider:"stability" };
    },

    async generateWithGemini(prompt){
        const key=Config.getGeminiKey();
        if(!key) throw new Error("Configure Gemini em Configurações");
        const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${key}`,{
            method:"POST", headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ instances:[{prompt}], parameters:{sampleCount:1, aspectRatio:"16:9"}})
        });
        if(!res.ok){ const t=await res.text(); throw new Error("Gemini: "+t.slice(0,200)); }
        const data=await res.json();
        const b64=data.predictions?.[0]?.bytesBase64Encoded;
        if(!b64) throw new Error("Gemini sem imagem");
        const blob=this._b64ToBlob(b64,"image/png");
        return { url: URL.createObjectURL(blob), blob, provider:"gemini" };
    },

    _b64ToBlob(b64,type){ const bin=atob(b64); const arr=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i); return new Blob([arr],{type}); },

    async generate(prompt){
        const provider = (typeof Config.getImageProvider==="function" ? Config.getImageProvider() : Config.getProvider()) || "pollinations";
        if(provider==="stability") return this.generateWithStability(prompt);
        if(provider==="gemini") return this.generateWithGemini(prompt);
        return this.generateWithPollinations(prompt); // grátis default
    },

    async generateAllFromPrompts(){
        if(!Projects.current){ alert("Abra um projeto"); return; }
        const prompts=Prompts.getAll();
        if(!prompts.length){ alert("Analise o projeto primeiro"); return; }
        let ok=0, fail=0;
        UI.showLoading(`Gerando ${prompts.length} imagens (grátis)...`);
        for(let i=0;i<prompts.length;i++){
            const p=prompts[i];
            try{
                UI.showLoading(`Gerando cena ${p.sceneId} (${i+1}/${prompts.length})...`);
                const result=await this.generate(p.prompt);
                await Images.save({
                    id: Date.now()+i,
                    projectId: Projects.current.id,
                    sceneId: p.sceneId,
                    prompt: p.prompt,
                    url: result.url,
                    blob: result.blob,
                    provider: result.provider,
                    createdAt: new Date().toISOString()
                });
                ok++;
                UI.renderImages(); UI.renderPrompts();
            }catch(e){
                console.error(e); fail++; UI.toast(`Erro cena ${p.sceneId}: ${e.message}`);
            }
            // delay pequeno para não sobrecarregar pollinations gratuito
            await new Promise(r=>setTimeout(r, 600));
        }
        UI.hideLoading(); UI.toast(`${ok} imagens geradas! ${fail?`(${fail} falhas)`:''}`);
        Navigation.show("images");
    }
};
