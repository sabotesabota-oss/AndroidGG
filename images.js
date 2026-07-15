/* =====================================================
   Stick Studio AI - NOVO
   images.js - Armazenamento de imagens geradas
===================================================== */
const Images = {
    list: [],

    clear(){ this.list = []; },

    getAll(){ return this.list; },

    count(){ return this.list.length; },

    async loadByProject(projectId){
        if(!projectId){ this.list=[]; return []; }
        try{
            const all = await Database.getAll("images");
            this.list = (all||[]).filter(i=>String(i.projectId)===String(projectId));
        }catch{
            this.list = JSON.parse(localStorage.getItem(`ss_images_${projectId}`)||"[]");
        }
        return this.list;
    },

    async save(imageData){
        // imageData = { id, projectId, sceneId, prompt, url, blob?, createdAt }
        this.list.push(imageData);
        try{
            await Database.put("images", imageData);
        }catch(e){
            console.warn("[Images] fallback localStorage", e);
            const key = `ss_images_${imageData.projectId}`;
            const saved = JSON.parse(localStorage.getItem(key)||"[]");
            // não salva blob no localStorage
            const clone = {...imageData}; delete clone.blob;
            saved.push(clone);
            localStorage.setItem(key, JSON.stringify(saved));
        }
        UI.updateDashboard?.();
        return imageData;
    },

    async remove(id){
        this.list = this.list.filter(i=>String(i.id)!==String(id));
        try{
            const store = Database.getStore("images","readwrite");
            store.delete(Number(id)||id);
        }catch{}
        UI.renderImages?.();
    }
};
