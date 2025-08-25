const ArgumentType = require('./argument-type');
const ArgumentAlignment = require('./argument-alignment');
const BlockType = require('./block-type');
const BlockShape = require('./block-shape');
const NotchShape = require('./notch-shape');
const TargetType = require('./target-type');
const Cast = require('../util/cast');
const Clone = require('../util/clone');
const Color = require('../util/color');
const TimerAPI = require('../util/timer');

class Timers {
    constructor() {
        this.timers = {}
    }

    createTimer(id) {
        if (this.timers.hasOwnProperty(id)) {
            console.warn(`there's already an existing timer called: "${id}"`)
            return;
        }
        this.timers[id] = {
            timer: new TimerAPI({now: () => Date.now()}),
            paused: false,
            started: false
        };
    }

    setTimerTo(id, at = 0) {
        if (!this.timers.hasOwnProperty(id)) {
            console.warn(`there's no timer called: "${id}"`)
            return;
        }
        this.timers[id].timer.start()
        this.timers[id].timer.setTimer(at)
        this.timers[id].started = true
    }

    restartTimer(id) {
        if (!this.timers.hasOwnProperty(id)) {
            console.warn(`there's no timer called: "${id}"`)
            return;
        }
        this.timers[id].timer.start()
        this.timers[id].started = true
    }

    pauseTimer(id) {
        if (!this.timers.hasOwnProperty(id)) {
            console.warn(`there's no timer called: "${id}"`)
            return;
        }
        if (!this.timers[id].started) {
            console.warn(`timer called: "${id}" needs to start first`)
            return;
        }
        this.timers[id].timer.pause()
        this.timers[id].paused = true
    }

    pauseTimer(id) {
        if (!this.timers.hasOwnProperty(id)) {
            console.warn(`there's no timer called: "${id}"`)
            return;
        }
        if (!this.timers[id].paused) {
            console.warn(`timer called: "${id}" needs to be paused first`)
            return;
        }
        this.timers[id].timer.play()
        this.timers[id].paused = false
    }

    stopTimer(id) {
        if (!this.timers.hasOwnProperty(id)) {
            console.warn(`there's no timer called: "${id}"`)
            return;
        }
        this.timers[id].timer = new TimerAPI({now: () => Date.now()})
        this.timers[id].paused = false
        this.timers[id].started = false
    }

    getTimer(id) {
        if (!this.timers.hasOwnProperty(id)) {
            console.warn(`there's no timer called: "${id}"`)
            return;
        }
        return this.timers[id].timer.timeElapsed() / 1000;
    }

    getTimerObject(id) {
        if (!this.timers.hasOwnProperty(id)) {
            console.warn(`there's no timer called: "${id}"`)
            return;
        }
        return this.timers[id];
    }

    getTimers() {
        return this.timers;
    }
}

const Scratch = {
    ArgumentType,
    ArgumentAlignment,
    BlockType,
    BlockShape,
    NotchShape,
    TargetType,
    Cast,
    Clone,
    Color,
    Timers: new Timers
};

module.exports = Scratch;
