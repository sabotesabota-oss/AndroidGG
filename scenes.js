/* =====================================================
   Stick Studio AI - FIXED
   scenes.js
===================================================== */

const Scenes = {
    list: [],

    clear() {
        this.list = [];
    },

    process(text) {
        this.clear();
        if (!text || !text.trim()) return;

        const lines = text
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(l => l.length);

        let index = 1;
        let current = null;

        const flush = () => {
            if (!current) return;
            // BUG CORRIGIDO: agora calcula duração sempre que fecha a cena
            current.text = current.text.trim();
            current.duration = this.estimateDuration(current.text);
            this.list.push(current);
        };

        lines.forEach(line => {
            const isSceneHeader = /^cena\s*\d*/i.test(line);

            if (isSceneHeader) {
                flush();
                current = {
                    id: index,
                    title: line,
                    text: "",
                    duration: 0
                };
                index++;
            } else {
                if (!current) {
                    current = {
                        id: index,
                        title: `Cena ${index}`,
                        text: "",
                        duration: 0
                    };
                    index++;
                }
                current.text += line + " ";
            }
        });

        flush(); // última cena
    },

    estimateDuration(text) {
        if (!text) return 3;
        const words = text.trim().split(/\s+/).length;
        const seconds = Math.ceil((words / 150) * 60); // 150 ppm
        return Math.max(3, Math.min(seconds, 20));
    },

    getAll() { return this.list; },
    get(id) { return this.list.find(s => s.id === id); },
    count() { return this.list.length; },

    totalDuration() {
        return this.list.reduce((total, scene) => total + (scene.duration || 0), 0);
    },

    remove(id) {
        this.list = this.list.filter(scene => scene.id !== id);
    },

    update(id, data) {
        const scene = this.get(id);
        if (!scene) return;
        Object.assign(scene, data);
        if (data.text) scene.duration = this.estimateDuration(data.text);
    },

    add(title, text = "") {
        const scene = {
            id: Date.now(),
            title,
            text,
            duration: this.estimateDuration(text)
        };
        this.list.push(scene);
        return scene;
    },

    export() {
        return structuredClone ? structuredClone(this.list) : JSON.parse(JSON.stringify(this.list));
    }
};
