
const App = {
  async init(){
    try{
      await Database.init(); await Projects.load();
      UI.init(); AudioManager.init(); await AudioManager.load();
      if(typeof Navigation!=='undefined') Navigation.init();
      this.bindEvents();
      const last = localStorage.getItem('ss_last_page');
      if(last && typeof Navigation!=='undefined') setTimeout(()=>Navigation.show(last),100);
      UI.toast('Stick Studio Pro pronto');
    }catch(e){ console.error(e); alert('Erro ao iniciar: '+e.message); }
  },
  bindEvents(){
    ['newProject','newProjectPage'].forEach(id=>{
      const b=document.getElementById(id); if(b) b.addEventListener('click',async()=>{ try{await Projects.create();}catch(err){alert(err.message);} });
    });
    const importBtn=document.getElementById('importAudio');
    const input=document.getElementById('audioInput');
    if(importBtn && input){
      importBtn.addEventListener('click',()=>input.click());
      input.addEventListener('change',async (e)=>{
        const file=e.target.files[0]; if(!file) return;
        if(!Utils.isAudio(file)){ alert('Selecione áudio válido'); return; }
        UI.showLoading('Importando...');
        try{ await AudioManager.importFile(file); UI.updateDashboard(); UI.toast('Áudio importado'); }
        catch(err){ alert('Erro: '+err.message); }
        finally{ UI.hideLoading(); input.value=''; }
      });
    }
    document.getElementById('generateAllImagesBtn')?.addEventListener('click',()=>ImageGenerator.generateAllFromPrompts());
  }
};
window.addEventListener('load',()=>App.init());
