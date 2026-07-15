/* =====================================================
   Stick Studio AI - FIXED
   timeline.js - Timeline Inteligente
===================================================== */

const Timeline = {
    scenes: [],
    mode: "auto", // auto | manual | audio
    fps: 24,

    build() {
        this.scenes = [];
        const list = Scenes.getAll();
        let currentTime = 0;

        list.forEach(scene => {
            const duration = this.calculate(scene);
            this.scenes.push({
                id: scene.id,
                title: scene.title,
                start: currentTime,
                end: currentTime + duration,
                duration,
                fps: this.fps,
                transition: "cut",
                locked: false,
                scene
            });
            currentTime += duration;
        });

        console.log(`Timeline criada: ${this.scenes.length} cenas, ${currentTime}s total.`);
        return this.scenes;
    },

    // ALIAS CORRIGIDO: Director procurava por generate()
    generate() {
        return this.build();
    },

    calculate(scene) {
        switch (this.mode) {
            case "manual":
            case "audio":
                return scene.duration || 5;
            default:
                return this.autoDuration(scene);
        }
    },

    autoDuration(scene) {
        const words = (scene.text || "").split(/\s+/).filter(Boolean).length;
        // 3 palavras por segundo é mais natural para stick animation
        let seconds = Math.ceil(words / 3);
        if (seconds < 3) seconds = 3;
        if (seconds > 15) seconds = 15;
        return seconds;
    },

    setDuration(sceneId, seconds) {
        const item = this.scenes.find(s => s.id === sceneId);
        if (!item) return;
        item.duration = Math.max(1, seconds);
        this.recalculate();
    },

    recalculate() {
        let current = 0;
        this.scenes.forEach(scene => {
            scene.start = current;
            scene.end = current + scene.duration;
            current = scene.end;
        });
    },

    totalDuration() {
        if (!this.scenes.length) return 0;
        return this.scenes[this.scenes.length - 1].end;
    },

    setMode(mode) {
        this.mode = mode;
        this.build();
    },

    getAll() { return this.scenes; },
    get(id) { return this.scenes.find(s => s.id === id); },
    clear() { this.scenes = []; }
};
