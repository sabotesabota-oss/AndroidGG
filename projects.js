/* =====================================================
   Stick Studio AI - FINAL HÍBRIDO
   projects.js - Mescla seu original + correções
===================================================== */
const Projects = {
    list: [],
    current: null,

    async load() {
        return new Promise((resolve, reject) => {
            try {
                const store = Database.transaction("projects");
                const request = store.getAll();
                request.onsuccess = () => {
                    this.list = request.result || [];
                    this.render();
                    this.restoreLastProject();
                    console.log(`${this.list.length} projeto(s) carregado(s)`);
                    resolve(this.list);
                };
                request.onerror = () => reject(request.error);
            } catch(e){
                console.warn("[Projects] fallback localStorage", e);
                this.list = JSON.parse(localStorage.getItem("ss_projects")||"[]");
                this.render();
                resolve(this.list);
            }
        });
    },

    async create(name) {
        if (!name) name = prompt("Nome do projeto:", `Projeto ${this.list.length+1}`);
        if (!name) return;

        // Seu original criava só {name, created, status}
        // Final adiciona campos que o Director precisa sem quebrar o autoIncrement
        const project = {
            name: name.trim(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            status: "Novo",
            storySource: "manual",
            storyText: ""
        };

        return new Promise((resolve) => {
            try {
                const store = Database.transaction("projects", "readwrite");
                const req = store.add(project);
                req.onsuccess = (e) => {
                    // pega ID gerado pelo IndexedDB
                    project.id = e.target.result;
                };
                store.transaction.oncomplete = async () => {
                    await this.load();
                    // abre automaticamente o que acabou de criar
                    if(project.id) await this.open(project.id);
                    resolve(project);
                };
            } catch(e){
                project.id = Date.now();
                this.list.push(project);
                localStorage.setItem("ss_projects", JSON.stringify(this.list));
                this.render();
                resolve(project);
            }
        });
    },

    async open(id) {
        const project = this.list.find(p => String(p.id) === String(id));
        if (!project) return;

        this.current = project;
        localStorage.setItem("lastProject", String(id));
        localStorage.setItem("stickstudio_last_project", String(id));

        // CORREÇÃO: seu original não limpava os módulos nem carregava áudios do projeto
        if (typeof Scenes !== "undefined") Scenes.clear();
        if (typeof Characters !== "undefined") Characters.clear();
        if (typeof Locations !== "undefined") Locations.clear();
        if (typeof Objects !== "undefined") Objects.clear();
        if (typeof Prompts !== "undefined") Prompts.clear();
        if (typeof Timeline !== "undefined") Timeline.clear();
        if (typeof Transcription !== "undefined") Transcription.clear();

        // Restaura história do projeto
        if (typeof Story !== "undefined") {
            Story.setSource(project.storySource || "manual");
            Story.setText(project.storyText || "");
        }

        // Carrega áudios filtrados por projeto (seu original não fazia)
        if (typeof AudioManager !== "undefined") {
            AudioManager.load();
        }

        if (typeof UI !== "undefined") UI.updateDashboard();
        this.render();

        console.log("[Projects] Aberto:", project.name);
    },

    restoreLastProject() {
        const id = Number(localStorage.getItem("lastProject") || localStorage.getItem("stickstudio_last_project"));
        if (!id) return;
        // evita loop infinito se load() chamar restore que chama open
        if(this.current && String(this.current.id)===String(id)) return;
        const exists = this.list.some(p=>String(p.id)===String(id));
        if(exists) this.open(id);
    },

    rename(id) {
        const project = this.list.find(p => String(p.id)===String(id));
        if (!project) return;
        const newName = prompt("Novo nome:", project.name);
        if (!newName) return;
        project.name = newName.trim();
        project.updated = new Date().toISOString();
        try{
            const store = Database.transaction("projects", "readwrite");
            store.put(project);
            store.transaction.oncomplete = () => this.load();
        }catch{
            localStorage.setItem("ss_projects", JSON.stringify(this.list));
            this.render();
        }
    },

    remove(id) {
        const project = this.list.find(p => String(p.id)===String(id));
        if (!project) return;
        if (!confirm(`Excluir "${project.name}"?`)) return;

        try{
            const store = Database.transaction("projects", "readwrite");
            store.delete(id);
            store.transaction.oncomplete = () => {
                if (this.current && String(this.current.id)===String(id)) {
                    this.current = null;
                    localStorage.removeItem("lastProject");
                    localStorage.removeItem("stickstudio_last_project");
                }
                this.load();
                if(typeof UI !== "undefined") UI.updateDashboard();
            };
        }catch{
            this.list = this.list.filter(p=>String(p.id)!==String(id));
            localStorage.setItem("ss_projects", JSON.stringify(this.list));
            if (this.current && String(this.current.id)===String(id)) this.current=null;
            this.render();
        }
    },

    // compat com meu código
    getAll(){ return this.list; },
    async updateCurrent(patch){
        if(!this.current) return;
        Object.assign(this.current, patch, {updated: new Date().toISOString()});
        try{
            const store = Database.transaction("projects","readwrite");
            store.put(this.current);
        }catch{
            localStorage.setItem("ss_projects", JSON.stringify(this.list));
        }
    },

    render() {
        const container = document.getElementById("projectsContainer");
        if (!container) return;
        container.innerHTML = "";
        if (this.list.length === 0) {
            container.innerHTML = `<div class="emptyAudio"><strong>Nenhum projeto.</strong><small>Crie seu primeiro projeto.</small></div>`;
            return;
        }
        this.list.forEach(project => {
            const card = document.createElement("div");
            card.className = "projectItem fadeIn";
            if (this.current && String(this.current.id)===String(project.id)) card.classList.add("selected");
            card.innerHTML = `
                <h3>${project.name}</h3>
                <small>${project.status} • ${Utils.formatDate(project.created)}</small>
                <div class="audioButtons mt-20">
                    <button class="audioPlay">Abrir</button>
                    <button class="audioDelete">Excluir</button>
                </div>`;
            card.querySelector(".audioPlay").onclick = () => this.open(project.id);
            card.querySelector(".audioDelete").onclick = () => this.remove(project.id);
            card.ondblclick = () => this.rename(project.id);
            container.appendChild(card);
        });
    }
};
