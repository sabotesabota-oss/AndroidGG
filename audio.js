/* =====================================================
   Stick Studio AI - FINAL HÍBRIDO
   audio.js - Seu original + correções de compatibilidade
===================================================== */
const AudioManager = {
    player: null,
    input: null,
    listElement: null,
    audios: [],
    currentAudio: null,

    init() {
        this.player = document.getElementById("audioPlayer");
        this.input = document.getElementById("audioInput");
        this.listElement = document.getElementById("audioList");
        this.bindButtons();
        console.log("[Audio] init");
    },

    bindButtons() {
        const importButton = document.getElementById("importAudio");
        if (importButton) {
            importButton.onclick = () => {
                if (!Projects.current) { alert("Abra um projeto primeiro."); return; }
                this.input?.click();
            };
        }
        if (this.input) {
            this.input.onchange = (event) => {
                const file = event.target.files[0];
                if (!file) return;
                if (!Utils.isAudio(file)) { alert("Arquivo inválido. Selecione um áudio."); return; }
                this.import(file);
                this.input.value = "";
            };
        }
    },

    import(file) {
        if(!Projects.current){ alert("Nenhum projeto aberto"); return; }
        UI.showLoading?.("Importando áudio...");

        const audio = new Audio();
        audio.preload = "metadata";
        audio.src = URL.createObjectURL(file);

        audio.onloadedmetadata = () => {
            const data = {
                projectId: Projects.current.id,
                name: file.name,
                blob: file,
                size: file.size,
                duration: audio.duration || 0,
                type: file.type,
                created: new Date().toISOString(),
                main: this.audios.length === 0 // primeiro vira principal automaticamente
            };

            try{
                const store = Database.transaction("audios", "readwrite");
                store.add(data);
                store.transaction.oncomplete = () => {
                    URL.revokeObjectURL(audio.src);
                    UI.hideLoading?.();
                    UI.toast?.("Áudio importado.");
                    this.load();
                };
                store.transaction.onerror = () => {
                    UI.hideLoading?.();
                    alert("Erro ao salvar áudio no banco");
                };
            }catch(e){
                console.warn("[Audio] fallback", e);
                data.id = Date.now();
                this.audios.push(data);
                this.render(this.audios);
                UI.hideLoading?.();
            }
        };
        audio.onerror = () => {
            UI.hideLoading?.();
            alert("Não foi possível ler este áudio");
        };
    },

    // seu original + alias loadByProject para compatibilidade com meu Director
    load() {
        if (!Projects.current) { this.render([]); return; }
        try{
            const store = Database.transaction("audios");
            const index = store.index("projectId");
            const request = index.getAll(Projects.current.id);
            request.onsuccess = () => {
                this.audios = request.result || [];
                this.render(this.audios);
                UI.updateDashboard?.();
            };
        }catch(e){
            console.warn("[Audio] load fallback", e);
            this.audios = JSON.parse(localStorage.getItem(`ss_audios_${Projects.current.id}`)||"[]");
            this.render(this.audios);
        }
    },
    loadByProject(projectId){ 
        // compat: meu código chamava loadByProject, seu original chamava load()
        if(projectId && Projects.current && String(Projects.current.id)!==String(projectId)) return;
        return this.load(); 
    },

    render(list) {
        if(!this.listElement) return;
        this.listElement.innerHTML = "";
        if (!list || list.length === 0) {
            this.listElement.innerHTML = `<div class="emptyAudio"><div class="audioEmptyIcon">🎵</div><strong>Nenhum áudio.</strong><small>Importe um áudio para começar.</small></div>`;
            return;
        }
        list.sort((a, b) => (a.main && !b.main) ? -1 : (!a.main && b.main) ? 1 : 0);
        list.forEach(audio => this.createCard(audio));
    },

    createCard(audio) {
        const card = document.createElement("div");
        card.className = "audioItem fadeIn";
        if (audio.main) card.classList.add("mainAudio");
        const size = Utils.formatBytes(audio.size);
        const duration = Utils.formatTime(audio.duration);
        const date = Utils.formatDate(audio.created);
        card.innerHTML = `
            <div class="audioTop">
                <div class="audioLeft">
                    <div class="audioIcon">🎵</div>
                    <div class="audioInfo">
                        <div class="audioName">${audio.name}</div>
                        <div class="audioSize">${size}</div>
                        <div class="audioDuration">⏱ ${duration}</div>
                        <div class="audioDate">📅 ${date}</div>
                        ${audio.main ? `<div class="audioMain">⭐ Áudio Principal</div>` : ""}
                    </div>
                </div>
                <div class="audioButtons">
                    <button class="audioPlay">▶</button>
                    <button class="audioRename">✏</button>
                    <button class="audioMainBtn">⭐</button>
                    <button class="audioDelete">🗑</button>
                </div>
            </div>`;
        card.querySelector(".audioPlay").onclick = () => this.play(audio);
        card.querySelector(".audioRename").onclick = () => this.rename(audio.id);
        card.querySelector(".audioMainBtn").onclick = () => this.setMain(audio.id);
        card.querySelector(".audioDelete").onclick = () => this.remove(audio.id);
        this.listElement.appendChild(card);
    },

    play(audio) {
        if (!audio || !audio.blob) { alert("Áudio sem arquivo. Reimporte."); return; }
        if (this.player?.src) URL.revokeObjectURL(this.player.src);
        this.currentAudio = audio;
        if(!this.player) return;
        this.player.src = URL.createObjectURL(audio.blob);
        this.player.style.display = "block";
        this.player.play();
    },

    rename(id) {
        const audio = this.audios.find(a => String(a.id)===String(id));
        if (!audio) return;
        const newName = prompt("Novo nome do áudio:", audio.name);
        if (!newName) return;
        audio.name = newName.trim();
        try{
            const store = Database.transaction("audios", "readwrite");
            store.put(audio);
            store.transaction.oncomplete = () => { UI.toast?.("Áudio renomeado."); this.load(); };
        }catch{ this.render(this.audios); }
    },

    setMain(id) {
        try{
            const store = Database.transaction("audios", "readwrite");
            this.audios.forEach(a => { a.main = String(a.id)===String(id); store.put(a); });
            store.transaction.oncomplete = () => { UI.toast?.("Áudio principal definido."); this.load(); };
        }catch{
            this.audios.forEach(a=>a.main=String(a.id)===String(id));
            this.render(this.audios);
        }
    },

    remove(id) {
        const audio = this.audios.find(a => String(a.id)===String(id));
        if (!audio) return;
        if (!confirm(`Excluir "${audio.name}"?`)) return;
        try{
            const store = Database.transaction("audios", "readwrite");
            store.delete(id);
            store.transaction.oncomplete = () => {
                if (this.currentAudio && String(this.currentAudio.id)===String(id)) {
                    this.player?.pause(); if(this.player){ this.player.removeAttribute("src"); this.player.style.display="none"; }
                    this.currentAudio = null;
                }
                UI.toast?.("Áudio removido."); this.load();
            };
        }catch{
            this.audios = this.audios.filter(a=>String(a.id)!==String(id));
            this.render(this.audios);
        }
    },

    // Métodos que faltavam no seu original mas que meu Director/UI usam
    getAll(){ return this.audios; },
    getMainAudio() { return this.audios.find(a => a.main) || this.audios[0] || null; },
    getById(id){ return this.audios.find(a=>String(a.id)===String(id)); },
    count(){ return this.audios.length; },
    totalDuration(){ return this.audios.reduce((t,a)=>t+(a.duration||0),0); },
    totalSize(){ return this.audios.reduce((t,a)=>t+(a.size||0),0); },
    stop(){ this.player?.pause(); if(this.player) this.player.currentTime=0; },
    pause(){ this.player?.pause(); },
    resume(){ this.player?.play(); },
    clearPlayer(){ if(!this.player) return; this.player.pause(); this.player.removeAttribute("src"); this.player.load(); this.player.style.display="none"; this.currentAudio=null; }
};
