/* =====================================================
   Stick Studio AI - FIXED
   database-upgrade.js
===================================================== */
const DatabaseUpgrade = {
    upgrade(db, event) {
        this.createProjects(db);
        this.createAudios(db);
        this.createSettings(db);
        this.createMetadata(db);
        this.createSimpleStore(db, "transcriptions");
        this.createSimpleStore(db, "scenes");
        this.createSimpleStore(db, "characters");
        this.createSimpleStore(db, "locations");
        this.createSimpleStore(db, "objects");
        this.createSimpleStore(db, "prompts");
        this.createSimpleStore(db, "images");
        this.createSimpleStore(db, "queue");
    },

    createProjects(db){
        if(db.objectStoreNames.contains("projects")) return;
        db.createObjectStore("projects", { keyPath:"id" }); // id = Date.now(), não autoIncrement
    },

    createAudios(db){
        if(db.objectStoreNames.contains("audios")) return;
        const store = db.createObjectStore("audios", { keyPath:"id" });
        store.createIndex("projectId", "projectId", { unique:false });
    },

    createSettings(db){
        if(db.objectStoreNames.contains("settings")) return;
        db.createObjectStore("settings", { keyPath:"id" });
    },

    createMetadata(db){
        if(db.objectStoreNames.contains("metadata")) return;
        db.createObjectStore("metadata", { keyPath:"key" });
    },

    createSimpleStore(db,name){
        if(db.objectStoreNames.contains(name)) return;
        const store = db.createObjectStore(name, { keyPath:"id" });
        store.createIndex("projectId", "projectId", { unique:false });
    }
};
