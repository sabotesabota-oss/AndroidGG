/* =====================================================
   Stick Studio AI - FIXED
   utils.js
===================================================== */
const Utils = {
    formatBytes(bytes) {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B","KB","MB","GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
    },

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return "00:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return String(min).padStart(2,"0") + ":" + String(sec).padStart(2,"0");
    },

    formatDate(date) {
        return new Date(date).toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" });
    },

    uuid() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2,10);
    },

    download(blob, fileName){
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(()=>URL.revokeObjectURL(url), 1000);
    },

    clone(obj){ return typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)); },

    debounce(callback, delay=300){
        let timer;
        return (...args)=>{ clearTimeout(timer); timer=setTimeout(()=>callback(...args), delay); };
    },

    sleep(ms){ return new Promise(r=>setTimeout(r, ms)); },

    capitalize(t){ if(!t) return ""; return t.charAt(0).toUpperCase() + t.slice(1); },

    fileExtension(name){ return (name.split(".").pop() || "").toLowerCase(); },

    isAudio(file){ return !!file && file.type.startsWith("audio/"); }
};
