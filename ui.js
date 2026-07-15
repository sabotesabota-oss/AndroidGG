/* =====================================================
   Stick Studio AI - EXTENSÃO LEMUR - UI SEM INLINE HANDLERS
   Compatível com MV3 CSP (sem onclick="...")
===================================================== */
const UI = {
    init(){
        this.bindMenu(); this.bindStory(); this.bindDirector(); this.bindSettings(); this.bindDashboard();
        this.updateStoryUI(); this.updateDashboard(); this.injectToastContainer();
    },
    injectToastContainer(){ if(document.getElementById("toastContainer")) return; const d=document.createElement("div"); d.id="toastContainer"; d.style.cssText="position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none"; document.body.appendChild(d); },
    
    bindMenu(){
        const btn=document.getElementById("menuButton"), dr=document.getElementById("drawer"), ov=document.getElementById("overlay");
        if(btn) btn.addEventListener("click", ()=>{ dr?.classList.add("open"); ov?.classList.add("show"); });
        if(ov) ov.addEventListener("click", ()=>{ dr?.classList.remove("open"); ov?.classList.remove("show"); });
    },
    bindDashboard(){
        document.getElementById("newProject")?.addEventListener("click", ()=>Projects.create());
        document.getElementById("newProjectPage")?.addEventListener("click", ()=>Projects.create());
        document.getElementById("importAudio")?.addEventListener("click", ()=>{
            if(!Projects.current){ alert("Abra um projeto primeiro"); return; }
            document.getElementById("audioInput")?.click();
        });
        // torna stats clicáveis
        document.getElementById("audioCount")?.parentElement?.addEventListener("click", ()=>Navigation.show("audio"));
        document.getElementById("sceneCount")?.parentElement?.addEventListener("click", ()=>Navigation.show("timeline"));
        document.getElementById("imageCount")?.parentElement?.addEventListener("click", ()=>Navigation.show("images"));
        document.getElementById("characterCount")?.parentElement?.addEventListener("click", ()=>Navigation.show("characters"));
        document.getElementById("promptCount")?.parentElement?.addEventListener("click", ()=>Navigation.show("prompts"));
    },
    bindStory(){
        const ta=document.getElementById("storyText");
        document.querySelectorAll("input[name='storySource']").forEach(r=>{
            r.addEventListener("change", ()=>{ Story.setSource(r.value); this.updateStoryUI(); });
        });
        if(ta){
            ta.value = Story.getText();
            ta.addEventListener("input", Utils.debounce(()=>Story.setText(ta.value,false), 600));
        }
        document.getElementById("saveStory")?.addEventListener("click", ()=>{
            const v=document.getElementById("storyText")?.value||"";
            Story.setText(v,true); this.toast("Roteiro salvo");
        });
    },
    bindDirector(){
        document.getElementById("analyzeProject")?.addEventListener("click", async ()=>{
            if(!Projects.current){ alert("Crie ou abra um projeto"); return; }
            if(Story.getSource()==="manual" && !Story.hasStory()){ alert("Escreva o roteiro"); Navigation.show("story"); return; }
            if(Story.getSource()!=="manual" && !AudioManager.getMainAudio() && AudioManager.count()===0){ alert("Importe um áudio e marque como principal"); Navigation.show("audio"); return; }
            try{ await Director.start(Projects.current.id); }catch(e){ console.error(e); }
        });
    },
    bindSettings(){
        const imgSel=document.getElementById("imageProvider"), transSel=document.getElementById("transcriptionProvider");
        const stab=document.getElementById("stabilityKey"), gem=document.getElementById("geminiKey"), groq=document.getElementById("groqKey"), openai=document.getElementById("openaiKey");
        if(imgSel){ imgSel.value=Config.getImageProvider(); imgSel.addEventListener("change", ()=>{ Config.setImageProvider(imgSel.value); this.updateSettingsUI(); }); }
        if(transSel){ transSel.value=Config.getTranscriptionProvider(); transSel.addEventListener("change", ()=>{ Config.setTranscriptionProvider(transSel.value); this.updateSettingsUI(); }); }
        if(stab) stab.value=Config.getStabilityKey();
        if(gem) gem.value=Config.getGeminiKey();
        if(groq) groq.value=Config.getGroqKey();
        if(openai) openai.value=Config.getOpenAIKey();
        document.getElementById("saveKeys")?.addEventListener("click", ()=>{
            if(stab) Config.setStabilityKey(stab.value);
            if(gem) Config.setGeminiKey(gem.value);
            if(groq) Config.setGroqKey(groq.value);
            if(openai) Config.setOpenAIKey(openai.value);
            this.toast("Salvo ✅"); this.updateSettingsUI();
        });
        document.getElementById("clearDBBtn")?.addEventListener("click", ()=>{
            if(confirm("Apagar tudo?")){ indexedDB.deleteDatabase("StickStudioAI"); localStorage.clear(); location.reload(); }
        });
        this.updateSettingsUI();
    },
    updateSettingsUI(){
        const ip=Config.getImageProvider(), tp=Config.getTranscriptionProvider();
        document.querySelectorAll("[data-img]").forEach(el=>{ el.style.display = (el.dataset.img===ip || el.dataset.img==="all") ? "block":"none"; });
        document.querySelectorAll("[data-trans]").forEach(el=>{ el.style.display = (el.dataset.trans===tp || el.dataset.trans==="all") ? "block":"none"; });
        const ib=document.getElementById("providerBadge"), tb=document.getElementById("transcriptionBadge"), ib2=document.getElementById("imageProviderBadge");
        if(ib) ib.textContent = ip==="pollinations" ? "Grátis" : "Pago";
        if(ib2) ib2.textContent = ip;
        if(tb) tb.textContent = tp==="mock" ? "Offline" : tp;
        const mode=document.getElementById("modeBadge"); if(mode) mode.textContent = Story.getSource()==="manual"?"Manual":"Áudio";
    },
    updateStoryUI(){
        const ta=document.getElementById("storyText"), hint=document.getElementById("storyHint");
        const isManual=Story.getSource()==="manual";
        if(ta){ ta.disabled=!isManual; ta.style.opacity=isManual?"1":"0.5"; ta.placeholder=isManual?"Escreva seu roteiro...\n\nCena 1 - Floresta\nJoão caminha...":"Modo Áudio: importe áudio, marque como principal e clique Analisar. A transcrição aparecerá no Diretor."; }
        if(hint) hint.innerHTML = isManual ? "✍️ <b>Manual:</b> Escreva o roteiro livremente." : "🎙️ <b>Áudio:</b> O Diretor vai transcrever o áudio principal.";
        this.updateSettingsUI();
    },

    // ===== RENDERS SEM INLINE ONCLICK =====
    renderProjects(){
        const container=document.getElementById("projectsContainer");
        if(!container) return;
        container.innerHTML="";
        const list=Projects.getAll();
        if(!list.length){
            const empty=document.createElement("div"); empty.className="emptyAudio"; empty.innerHTML="<strong>Nenhum projeto</strong><small>Crie seu primeiro projeto</small>"; container.appendChild(empty); return;
        }
        list.forEach(p=>{
            const card=document.createElement("div");
            card.className="projectItem fadeIn";
            if(Projects.current && String(Projects.current.id)===String(p.id)) card.classList.add("selected");
            const h3=document.createElement("h3"); h3.textContent=p.name;
            const small=document.createElement("small"); small.textContent=`${p.status||"Novo"} • ${Utils.formatDate(p.created||p.createdAt)}`;
            const btnRow=document.createElement("div"); btnRow.style.cssText="margin-top:12px;display:flex;gap:8px";
            const openBtn=document.createElement("button"); openBtn.textContent="Abrir"; openBtn.style.cssText="background:#2962FF;color:#fff;border:none;padding:8px 14px;border-radius:8px;flex:1";
            openBtn.addEventListener("click", ()=>{ Projects.open(p.id); Navigation.show("dashboard"); });
            const delBtn=document.createElement("button"); delBtn.textContent="Excluir"; delBtn.style.cssText="background:#2A2A2A;color:#ff5252;border:1px solid #333;padding:8px 14px;border-radius:8px";
            delBtn.addEventListener("click", (e)=>{ e.stopPropagation(); Projects.remove(p.id); });
            btnRow.appendChild(openBtn); btnRow.appendChild(delBtn);
            card.appendChild(h3); card.appendChild(small); card.appendChild(btnRow);
            card.addEventListener("dblclick", ()=>Projects.rename(p.id));
            container.appendChild(card);
        });
    },

    renderAudios(){
        const listEl=document.getElementById("audioList"); if(!listEl) return;
        listEl.innerHTML="";
        const audios=AudioManager.getAll();
        if(!audios.length){
            const d=document.createElement("div"); d.className="emptyAudio"; d.innerHTML="<strong>Nenhum áudio</strong><small>Toque em Importar</small>"; listEl.appendChild(d); return;
        }
        audios.forEach(a=>{
            const card=document.createElement("div");
            card.style.cssText=`background:#1E1E1E;padding:14px;border-radius:12px;margin-bottom:10px;border:${a.main?'2px solid #00C853':'1px solid #333'}`;
            card.innerHTML=`<strong>${this._esc(a.name)}</strong><br><small>${Utils.formatBytes(a.size||0)} • ${Utils.formatTime(a.duration||0)} ${a.main?'• ⭐ Principal':''}</small>`;
            const row=document.createElement("div"); row.style.cssText="margin-top:10px;display:flex;gap:8px";
            const play=document.createElement("button"); play.textContent="▶"; play.title="Tocar"; play.style.cssText="background:#2962FF;color:#fff;border:none;padding:6px 10px;border-radius:6px";
            play.addEventListener("click", ()=>AudioManager.play(a));
            const main=document.createElement("button"); main.textContent=a.main?"★":"☆"; main.title="Definir principal"; main.style.cssText="background:#2A2A2A;color:#FFD600;border:1px solid #333;padding:6px 10px;border-radius:6px";
            main.addEventListener("click", ()=>AudioManager.setMain(a.id));
            const ren=document.createElement("button"); ren.textContent="✏"; ren.style.cssText="background:#2A2A2A;color:#fff;border:1px solid #333;padding:6px 10px;border-radius:6px";
            ren.addEventListener("click", ()=>AudioManager.rename(a.id));
            const del=document.createElement("button"); del.textContent="🗑"; del.style.cssText="background:#2A2A2A;color:#ff5252;border:1px solid #333;padding:6px 10px;border-radius:6px";
            del.addEventListener("click", ()=>AudioManager.remove(a.id));
            row.append(play,main,ren,del); card.appendChild(row); listEl.appendChild(card);
        });
    },

    renderDirector(){ this.renderTranscription(); this.renderTimeline(); this.renderCharacters(); this.renderLocations(); this.renderObjects(); this.renderPrompts(); this.renderImages(); this.updateDashboard(); },

    renderTranscription(){
        const el=document.getElementById("transcriptionView"); if(!el) return;
        const txt=Story.getSource()==="manual"?Story.getText():Transcription.getText();
        el.textContent = txt && txt.trim() ? txt : "Nenhum conteúdo. Escreva o roteiro ou importe áudio e clique Analisar.";
    },

    renderTimeline(){
        const containers=[document.getElementById("timelineView"), document.getElementById("timelineFull")].filter(Boolean);
        if(!containers.length) return;
        const list=Timeline.getAll();
        containers.forEach(el=>{
            el.innerHTML="";
            if(!list.length){
                el.innerHTML='<div class="emptyAudio"><strong>Nenhuma cena</strong><small>Analise o projeto no Diretor</small></div>'; return;
            }
            const total=Timeline.totalDuration()||1;
            list.forEach(item=>{
                const div=document.createElement("div"); div.className="timelineItem"; div.style.cssText="background:#1E1E1E;padding:12px;border-radius:10px;margin-bottom:10px;border:1px solid #333";
                const title=document.createElement("div"); title.innerHTML=`<strong>${this._esc(item.title)}</strong><br><small>${item.duration}s • ${Utils.formatTime(item.start)} → ${Utils.formatTime(item.end)}</small>`;
                const bar=document.createElement("div"); bar.className="timelineBar"; bar.style.cssText="height:6px;background:#333;border-radius:3px;margin-top:8px;overflow:hidden";
                const fill=document.createElement("div"); fill.className="timelineFill"; fill.style.cssText=`height:100%;background:#2962FF;width:${(item.duration/total*100).toFixed(1)}%`;
                bar.appendChild(fill); div.appendChild(title); div.appendChild(bar); el.appendChild(div);
            });
            const totalDiv=document.createElement("div"); totalDiv.style.cssText="margin-top:12px;text-align:center;color:#9E9E9E;font-size:12px"; totalDiv.textContent=`Duração total: ${Utils.formatTime(total)} • ${list.length} cenas`;
            el.appendChild(totalDiv);
        });
    },

    renderCharacters(){ this._simpleList("charactersView","charactersList",Characters,"👤","Nenhum personagem"); },
    renderLocations(){ this._simpleList("locationsView","locationsList",Locations,"🌍","Nenhum cenário"); },
    renderObjects(){ this._simpleList("objectsView","objectsList",Objects,"📦","Nenhum objeto"); },

    _simpleList(viewId,listId,Module,icon,empty){
        [viewId,listId].forEach(id=>{
            const el=document.getElementById(id); if(!el) return; el.innerHTML="";
            const arr=Module?.getAll?.()||[]; if(!arr.length){ const d=document.createElement("div"); d.innerHTML=`<small>${empty}</small>`; el.appendChild(d); return; }
            arr.forEach(item=>{
                const div=document.createElement("div"); div.className="memoryItem"; div.style.cssText="padding:8px;background:#1E1E1E;border-radius:8px;margin-bottom:6px;border:1px solid #2A2A2A";
                div.textContent=`${icon} ${item.name} • ${item.scenes?.length||0} cenas`; el.appendChild(div);
            });
        });
    },

    renderPrompts(){
        const el=document.getElementById("promptsView")||document.getElementById("promptsList"); if(!el) return; el.innerHTML="";
        const list=Prompts.getAll(); if(!list.length){ el.innerHTML='<div class="emptyAudio"><small>Nenhum prompt. Clique Analisar no Diretor</small></div>'; return; }
        const topBtn=document.createElement("button"); topBtn.textContent=`🎨 Gerar ${list.length} Imagens (${Config.getImageProvider()})`; topBtn.style.cssText="width:100%;background:#2962FF;color:#fff;border:none;padding:12px;border-radius:10px;font-weight:bold;margin-bottom:12px";
        topBtn.addEventListener("click", ()=>ImageGenerator.generateAllFromPrompts()); el.appendChild(topBtn);
        list.forEach(p=>{
            const card=document.createElement("div"); card.className="promptCard"; card.style.cssText="background:#1E1E1E;padding:12px;border-radius:10px;margin-bottom:10px;border:1px solid #333";
            const strong=document.createElement("strong"); strong.textContent=`Cena ${p.sceneId}: ${p.sceneTitle||''}`; const pre=document.createElement("pre"); pre.style.cssText="white-space:pre-wrap;font-size:12px;margin-top:8px;background:#121212;padding:8px;border-radius:6px;overflow:auto"; pre.textContent=p.prompt;
            const btn=document.createElement("button"); btn.textContent="Gerar só esta"; btn.style.cssText="margin-top:8px;background:#00C853;color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:12px";
            btn.addEventListener("click", async ()=>{ try{ UI.showLoading("Gerando..."); const r=await ImageGenerator.generate(p.prompt); await Images.save({id:Date.now(),projectId:Projects.current.id,sceneId:p.sceneId,prompt:p.prompt,url:r.url,blob:r.blob,provider:r.provider,createdAt:new Date().toISOString()}); UI.renderImages(); UI.toast("Imagem gerada"); }catch(e){ UI.toast("Erro: "+e.message);} finally{ UI.hideLoading(); } });
            card.append(strong,pre,btn); el.appendChild(card);
        });
    },

    renderImages(){
        const ids=["imagesView","imagesFull","imagesList"];
        ids.forEach(id=>{
            const el=document.getElementById(id); if(!el) return; el.innerHTML="";
            const arr=Images.getAll();
            if(!arr.length){ const d=document.createElement("div"); d.className="emptyAudio"; d.innerHTML='<div style="font-size:32px">🖼️</div><strong>Sem imagens</strong><br><small>Gere pelos Prompts</small>'; el.appendChild(d); return; }
            arr.forEach(im=>{
                const card=document.createElement("div"); card.style.cssText="background:#1E1E1E;border-radius:12px;overflow:hidden;margin-bottom:12px;border:1px solid #333";
                const img=document.createElement("img"); img.src=im.url; img.style.cssText="width:100%;display:block"; img.loading="lazy";
                const info=document.createElement("div"); info.style.cssText="padding:10px";
                const small=document.createElement("small"); small.style.color="#9E9E9E"; small.textContent=`Cena ${im.sceneId} • ${im.provider} • ${Utils.formatDate(im.createdAt)}`;
                const actions=document.createElement("div"); actions.style.cssText="margin-top:8px;display:flex;gap:8px";
                const dl=document.createElement("a"); dl.textContent="⬇ Baixar"; dl.href=im.url; dl.download=`cena-${im.sceneId}.png`; dl.style.cssText="background:#2962FF;color:#fff;padding:6px 10px;border-radius:6px;text-decoration:none;font-size:12px";
                const del=document.createElement("button"); del.textContent="🗑"; del.style.cssText="background:#D50000;color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:12px";
                del.addEventListener("click", ()=>{ Images.remove(im.id); UI.renderImages(); });
                actions.append(dl,del); info.append(small,actions); card.append(img,info); el.appendChild(card);
            });
        });
        const c=document.getElementById("imageCount"); if(c) c.textContent=Images.count();
    },

    updateDashboard(){
        const s=(id,v)=>{ const e=document.getElementById(id); if(e) e.textContent=v; };
        s("currentProject", Projects.current?Projects.current.name:"Nenhum projeto");
        s("projectStatus", Projects.current?`Status: ${Projects.current.status||"Ativo"}`:"Selecione um projeto");
        s("audioCount", AudioManager.count?.()||0);
        s("sceneCount", Scenes.count?.()||0);
        s("promptCount", Prompts.getAll?.().length||0);
        s("characterCount", Characters.getAll?.().length||0);
        s("imageCount", Images.count?.()||0);
        this.renderProjects(); this.renderAudios();
    },

    showLoading(m="Carregando..."){ let e=document.getElementById("appLoading"); if(!e){ e=document.createElement("div"); e.id="appLoading"; e.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:9999;color:#fff;font-size:18px;font-weight:bold"; document.body.appendChild(e);} e.textContent=m; e.style.display="flex"; },
    hideLoading(){ const e=document.getElementById("appLoading"); if(e) e.style.display="none"; },
    toast(msg){ let c=document.getElementById("toastContainer"); if(!c){ c=document.createElement("div"); c.id="toastContainer"; document.body.appendChild(c);} const t=document.createElement("div"); t.textContent=msg; t.style.cssText="background:#323232;color:#fff;padding:10px 16px;border-radius:10px;margin-top:8px;box-shadow:0 2px 8px rgba(0,0,0,.4)"; c.appendChild(t); setTimeout(()=>{ t.style.transition="opacity .3s"; t.style.opacity="0"; setTimeout(()=>t.remove(),300); },2800); },
    _esc(s){ const d=document.createElement("div"); d.textContent=s; return d.innerHTML; }
};
