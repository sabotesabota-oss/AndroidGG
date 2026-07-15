/* =====================================================
   Stick Studio AI - FIXED
   database.js
===================================================== */
const Database = {
    DB_NAME: "StickStudioAI",
    DB_VERSION: 4, // bump para garantir upgrade limpo
    db: null,

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log("[DB] Upgrade para v" + this.DB_VERSION);
                if (typeof DatabaseUpgrade !== "undefined") {
                    DatabaseUpgrade.upgrade(db, event);
                }
            };

            request.onblocked = () => {
                console.warn("[DB] Upgrade bloqueado, feche outras abas");
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.db.onversionchange = () => {
                    this.db.close();
                    alert("Banco atualizado, recarregue a página");
                };
                console.log("Banco iniciado.");
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error("[DB] Erro", event.target.error);
                reject(event.target.error);
            };
        });
    },

    getStore(storeName, mode = "readonly") {
        if (!this.db) throw new Error("Database não iniciado");
        const tx = this.db.transaction(storeName, mode);
        return tx.objectStore(storeName);
    },

    // compat com código antigo
    transaction(store, mode = "readonly") {
        return this.getStore(store, mode);
    },

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async put(storeName, value) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(storeName, "readwrite");
            const req = store.put(value);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
};
