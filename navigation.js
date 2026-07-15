/* =====================================================
   Stick Studio AI - EXTENSÃO - Navigation com Imagens
===================================================== */
const Navigation = {
    currentPage: "dashboard",
    pages: ["dashboard","projects","audio","story","director","timeline","characters","locations","objects","prompts","images","settings"],
    bottomPages: ["dashboard","projects","audio","story","director"],

    init(){
        this.bindDrawer(); this.bindBottomBar(); this.bindOverlay();
        this.show("dashboard");
        console.log("[Navigation] Iniciado com", this.pages.length, "páginas");
    },
    capitalize(t){ return t.charAt(0).toUpperCase()+t.slice(1); },
    getButton(prefix,page){ return document.getElementById(prefix+this.capitalize(page)); },
    getSection(page){ return document.getElementById(page+"Page"); },

    bindDrawer(){
        this.pages.forEach(page=>{
            const b=this.getButton("menu",page);
            if(b) b.addEventListener("click", ()=>this.show(page));
        });
    },
    bindBottomBar(){
        this.bottomPages.forEach(page=>{
            const b=this.getButton("bottom",page);
            if(b) b.addEventListener("click", ()=>this.show(page));
        });
        // botão extra de imagens no dashboard via atalho
        const imgBtn=this.getButton("menu","images")||document.getElementById("menuImages");
        if(imgBtn) imgBtn.addEventListener("click", ()=>this.show("images"));
    },
    bindOverlay(){
        const overlay=document.getElementById("overlay"), drawer=document.getElementById("drawer"), menuBtn=document.getElementById("menuButton");
        if(overlay) overlay.addEventListener("click", ()=>{ drawer?.classList.remove("open"); overlay.classList.remove("show"); });
        if(menuBtn) menuBtn.addEventListener("click", ()=>{ drawer?.classList.add("open"); overlay?.classList.add("show"); });
    },
    show(page){
        if(!this.pages.includes(page)){ console.warn("Página inexistente:",page); return; }
        this.currentPage=page;
        this.pages.forEach(name=>{
            const sec=this.getSection(name); if(!sec) return;
            const isActive=name===page;
            sec.style.display=isActive?"block":"none";
            sec.classList.toggle("active",isActive);
        });
        this.updateActiveButtons(); this.closeDrawer(); this.afterPageChange(page);
        // salva última página para reabrir igual
        try{ localStorage.setItem("ss_last_page", page); }catch{}
    },
    afterPageChange(page){
        const map={
            dashboard:"updateDashboard", projects:"renderProjects", audio:"renderAudios",
            story:"updateStoryUI", director:"renderDirector", timeline:"renderTimeline",
            characters:"renderCharacters", locations:"renderLocations", objects:"renderObjects",
            prompts:"renderPrompts", images:"renderImages", settings:"updateSettingsUI"
        };
        const fn=map[page];
        if(fn && typeof UI!=="undefined" && typeof UI[fn]==="function"){
            try{ UI[fn](); }catch(e){ console.warn("afterPageChange",page,e); }
        }
    },
    updateActiveButtons(){
        [...new Set([...this.pages, ...this.bottomPages])].forEach(page=>{
            ["menu","bottom"].forEach(prefix=>{
                const b=this.getButton(prefix,page); if(!b) return;
                b.classList.toggle("active", page===this.currentPage);
            });
        });
    },
    openDrawer(){ document.getElementById("drawer")?.classList.add("open"); document.getElementById("overlay")?.classList.add("show"); },
    closeDrawer(){ document.getElementById("drawer")?.classList.remove("open"); document.getElementById("overlay")?.classList.remove("show"); }
};
