const formatMessage = require('format-message');
const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');
const Cast = require('../../util/cast');
const Icon = require('./icon.png');
const IconController = require('./controller.png');

const SESSION_TYPE = "immersive-vr";

// thanks to twoerner94 for quaternion-to-euler on npm
function quaternionToEuler(quat) {
    const q0 = quat[0];
    const q1 = quat[1];
    const q2 = quat[2];
    const q3 = quat[3];

    const Rx = Math.atan2(2 * (q0 * q1 + q2 * q3), 1 - (2 * (q1 * q1 + q2 * q2)));
    const Ry = Math.asin(2 * (q0 * q2 - q3 * q1));
    const Rz = Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - (2 * (q2 * q2 + q3 * q3)));

    const euler = [Rx, Ry, Rz];

    return euler;
};

function toRad(deg) {
    return deg * (Math.PI / 180);
}
function toDeg(rad) {
    return rad * (180 / Math.PI);
}
function toDegRounding(rad) {
    const result = toDeg(rad);
    if (!String(result).includes('.')) return result;
    const split = String(result).split('.');
    const endingDecimals = split[1].substring(0, 3);
    if ((endingDecimals === '999') && (split[1].charAt(3) === '9')) return Number(split[0]) + 1;
    return Number(split[0] + '.' + endingDecimals);
}

/**
 * Class for 3D VR blokckes
 */
class Jg3DVrBlocks {
    constructor(runtime) {
        /**
         * The runtime instantiating this block package.
         */
        this.runtime = runtime;
        this.open = false;
        this._3d = {}
        this.three = {}
        if (!this.runtime.ext_jg3d) {
            vm.extensionManager.loadExtensionURL('jg3d')
                .then(() => {
                    this._3d = this.runtime.ext_jg3d;
                    this.three = this._3d.three;
                });
        } else {
            this._3d = this.runtime.ext_jg3d;
            this.three = this._3d.three
        }
    }
    /**
     * metadata for this extension and its blocks.
     * @returns {object}
     */
    getInfo() {
        return {
            id: 'jg3dVr',
            name: '3D VR',
            color1: '#B100FE',
            color2: '#8000BC',
            blockIconURI: Icon,
            blocks: [
                // CORE
                {
                    opcode: 'isSupported',
                    text: 'is vr supported?',
                    blockType: BlockType.BOOLEAN,
                    disableMonitor: true
                },
                {
                    opcode: 'createSession',
                    text: 'create vr session',
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'closeSession',
                    text: 'close vr session',
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'isOpened',
                    text: 'is vr open?',
                    blockType: BlockType.BOOLEAN,
                    disableMonitor: true
                },
                '---',
                {
                    opcode: 'attachObject',
                    text: 'attach camera to object named [OBJECT]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        OBJECT: {
                            type: ArgumentType.STRING,
                            defaultValue: "Object1"
                        }
                    }
                },
                {
                    opcode: 'detachObject',
                    text: 'detach camera from object',
                    blockType: BlockType.COMMAND
                },
                '---',
                {
                    opcode: 'getControllerPosition',
                    text: 'controller #[INDEX] position [VECTOR3]',
                    blockType: BlockType.REPORTER,
                    blockIconURI: IconController,
                    disableMonitor: true,
                    arguments: {
                        INDEX: {
                            type: ArgumentType.NUMBER,
                            menu: 'count'
                        },
                        VECTOR3: {
                            type: ArgumentType.STRING,
                            menu: 'vector3'
                        }
                    }
                },
                {
                    opcode: 'getControllerRotation',
                    text: 'controller #[INDEX] rotation [VECTOR3]',
                    blockType: BlockType.REPORTER,
                    blockIconURI: IconController,
                    disableMonitor: true,
                    arguments: {
                        INDEX: {
                            type: ArgumentType.NUMBER,
                            menu: 'count'
                        },
                        VECTOR3: {
                            type: ArgumentType.STRING,
                            menu: 'vector3'
                        }
                    }
                },
                {
                    opcode: 'getControllerSide',
                    text: 'side of controller #[INDEX]',
                    blockType: BlockType.REPORTER,
                    blockIconURI: IconController,
                    disableMonitor: true,
                    arguments: {
                        INDEX: {
                            type: ArgumentType.NUMBER,
                            menu: 'count'
                        }
                    }
                },
                '---',
                {
                    opcode: 'getControllerStick',
                    text: 'joystick axis [XY] of controller #[INDEX]',
                    blockType: BlockType.REPORTER,
                    blockIconURI: IconController,
                    disableMonitor: true,
                    arguments: {
                        XY: {
                            type: ArgumentType.STRING,
                            menu: 'vector2'
                        },
                        INDEX: {
                            type: ArgumentType.NUMBER,
                            menu: 'count'
                        }
                    }
                },
                {
                    opcode: 'getControllerTrig',
                    text: 'analog value of [TRIGGER] trigger on controller #[INDEX]',
                    blockType: BlockType.REPORTER,
                    blockIconURI: IconController,
                    disableMonitor: true,
                    arguments: {
                        TRIGGER: {
                            type: ArgumentType.STRING,
                            menu: 'trig'
                        },
                        INDEX: {
                            type: ArgumentType.NUMBER,
                            menu: 'count'
                        }
                    }
                },
                {
                    opcode: 'getControllerButton',
                    text: 'button [BUTTON] on controller #[INDEX] pressed?',
                    blockType: BlockType.BOOLEAN,
                    blockIconURI: IconController,
                    disableMonitor: true,
                    arguments: {
                        BUTTON: {
                            type: ArgumentType.STRING,
                            menu: 'butt'
                        },
                        INDEX: {
                            type: ArgumentType.NUMBER,
                            menu: 'count'
                        }
                    }
                },
                {
                    opcode: 'getControllerTouching',
                    text: '[BUTTON] on controller #[INDEX] touched?',
                    blockType: BlockType.BOOLEAN,
                    blockIconURI: IconController,
                    disableMonitor: true,
                    arguments: {
                        BUTTON: {
                            type: ArgumentType.STRING,
                            menu: 'buttAll'
                        },
                        INDEX: {
                            type: ArgumentType.NUMBER,
                            menu: 'count'
                        }
                    }
                },
            ],
            menus: {
                vector3: {
                    acceptReporters: true,
                    items: [
                        "x",
                        "y",
                        "z",
                    ].map(item => ({ text: item, value: item }))
                },
                vector2: {
                    acceptReporters: true,
                    items: [
                        "x",
                        "y",
                    ].map(item => ({ text: item, value: item }))
                },
                butt: {
                    acceptReporters: true,
                    items: [
                        "a",
                        "b",
                        "x",
                        "y",
                        "joystick",
                    ].map(item => ({ text: item, value: item }))
                },
                trig: {
                    acceptReporters: true,
                    items: [
                        "back",
                        "side",
                    ].map(item => ({ text: item, value: item }))
                },
                buttAll: {
                    acceptReporters: true,
                    items: [
                        "a button",
                        "b button",
                        "x button",
                        "y button",
                        "joystick",
                        "back trigger",
                        "side trigger",
                    ].map(item => ({ text: item, value: item }))
                },
                count: {
                    acceptReporters: true,
                    items: [
                        "1",
                        "2",
                    ].map(item => ({ text: item, value: item }))
                },
            }
        };
    }

    // util
    _getRenderer() {
        if (!this._3d) return;
        return this._3d.renderer;
    }
    _getGamepad(indexFrom1) {
        const index = Cast.toNumber(indexFrom1) - 1;

        const three = this._3d;
        if (!three.scene) return;
        const renderer = this._getRenderer();
        if (!renderer) return;
        const session = renderer.xr.getSession();
        if (!session) return;

        const sources = session.inputSources;
        const controller = sources[index];
        if (!controller) return;

        const gamepad = controller.gamepad;
        return gamepad;
    }
    _getController(index) {
        const renderer = this._getRenderer();
        if (!renderer) return null;
        // try to use grip first (which typically has position/quaternion)
        const grip = renderer.xr.getControllerGrip(index);
        return grip || renderer.xr.getController(index);
    }
    _getInputSource(index) {
        const renderer = this._getRenderer();
        if (!renderer) return null;
        const session = renderer.xr.getSession();
        if (!session) return null;
        const sources = session.inputSources;
        return sources[index] || null;
    }
    _disposeImmersive() {
        this.session = null;

        const renderer = this._getRenderer();
        if (!renderer) return;

        renderer.xr.enabled = false;
    }
    async _createImmersive() {
        if (!('xr' in navigator)) return false;
        const renderer = this._getRenderer();
        if (!renderer) return false;

        const sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers'] };
        const session = await navigator.xr.requestSession(SESSION_TYPE, sessionInit);
        this.session = session;
        this.open = true;

        // enable xr on three.js
        renderer.xr.enabled = true;
        await renderer.xr.setSession(session);

        // we need to make sure stuff is back to normal once the vr session is done
        // but this isnt always triggered by the close session block
        // the user can also close it themselves, so we need to handle that
        // this is also triggered by the close session block btw so we dont need
        // to repeat
        session.addEventListener("end", () => {
            this.open = false;
            this._disposeImmersive();
        });

        // setup render loop
        const drawFrame = (_, frame) => {
            // breaks the loop once the session has ended
            if (!this.open) return;

            const threed = this._3d;
            // break loop if no camera or scene
            if (!threed.camera) return;
            if (!threed.scene) return;

            // force renderer to draw a new frame
            // otherwise we would only actually draw outside of this loop
            // which just ends up showing nothing
            // since rendering only happens in session.requestAnimationFrame
            // we also dont give blocks for rendering
            // because it would be too slow compared to just rendering
            // every animation frame
            renderer.render(threed.scene, threed.camera);
            // loop again
            session.requestAnimationFrame(drawFrame);
        }
        session.requestAnimationFrame(drawFrame);

        // reference space
        session.requestReferenceSpace("local").then(space => {
            this.localSpace = space;
            // TODO: add "when position reset" hat?
            //     done with space.addEventListener("reset")
        });

        return session;
    }

    // blocks
    isSupported() {
        if (!('xr' in navigator)) return false;
        return navigator.xr.isSessionSupported(SESSION_TYPE);
    }
    isOpened() {
        return this.open;
    }

    createSession() {
        if (this.open) return;
        if (this.session) return;
        return this._createImmersive();
    }
    closeSession() {
        this.open = false;
        if (!this.session) return;
        return this.session.end();
    }

    // extra
    attachObject(args) {
        const three = this._3d;
        if (!three.scene) return;
        if (!three.camera) return;
        const name = Cast.toString(args.OBJECT);
        const object = three.scene.getObjectByName(name);
        if (!object) return;
        object.add(three.camera);
    }
    detachObject() {
        const three = this._3d;
        if (!three.scene) return;
        if (!three.camera) return;
        three.scene.add(three.camera);
    }

    // inputs
    getControllerPosition(args) {
        const three = this._3d;
        if (!three.scene) return "";
        const index = Cast.toNumber(args.INDEX) - 1;
        const renderer = this._getRenderer();
        if (!renderer) return "";
        const controller = this._getController(index);
        if (!controller) return "";
        const v = args.VECTOR3;
        if (!v) return "";
        if (!["x", "y", "z"].includes(v)) return "";
        return Cast.toNumber(controller.position[v]);
    }
    getControllerRotation(args) {
        const three = this._3d;
        if (!three.scene) return "";
        const index = Cast.toNumber(args.INDEX) - 1;
        const renderer = this._getRenderer();
        if (!renderer) return "";
        const controller = this._getController(index);
        if (!controller) return "";
        const v = args.VECTOR3;
        if (!v) return "";
        if (!["x", "y", "z"].includes(v)) return "";

        // rotation is funky
        // lets make it match the 3D extensions handling of rotation
        // YXZ tells it to rotate Y first, then X, then Z
        const euler = new three.three.Euler(0, 0, 0);
        euler.setFromQuaternion(controller.quaternion, 'YXZ');
        const rotation = Cast.toNumber(euler[v]);
        // rotation is in radians, convert to degrees but round it
        // a bit so that we get 46 instead of 45.999999999999996
        return toDegRounding(rotation);
    }

    // inputs but like actual
    getControllerSide(args) {
        const three = this._3d;
        if (!three.scene) return "";
        const renderer = this._getRenderer();
        if (!renderer) return "";
        const session = renderer.xr.getSession();
        if (!session) return "";

        const sources = session.inputSources;
        const index = Cast.toNumber(args.INDEX) - 1;
        const controller = sources[index];
        if (!controller) return "";

        return controller.handedness;
    }
    getControllerStick(args) {
        const gamepad = this._getGamepad(args.INDEX);
        if (!gamepad) return 0;
        // index gained by testing
        if (Cast.toString(args.XY) === "y") {
            return gamepad.axes[3];
        } else {
            return gamepad.axes[2];
        }
    }
    getControllerTrig(args) {
        const gamepad = this._getGamepad(args.INDEX);
        if (!gamepad) return 0;
        // Using a similar idea: if "side" is selected for trigger, use button[1],
        // otherwise default to button[0]
        if (Cast.toString(args.TRIGGER) === "side") {
            return gamepad.buttons[1] ? gamepad.buttons[1].value : 0;
        } else {
            return gamepad.buttons[0] ? gamepad.buttons[0].value : 0;
        }
    }
    getControllerButton(args) {
        const gamepad = this._getGamepad(args.INDEX);
        if (!gamepad) return false;
        // determine controller handedness; default to right if unknown
        const inputSource = this._getInputSource(Cast.toNumber(args.INDEX) - 1);
        let handedness = 'right';
        if (inputSource && inputSource.handedness) {
            handedness = inputSource.handedness;
        }

        const button = Cast.toString(args.BUTTON).toLowerCase();
        // for Oculus Touch as an example: right controller uses "a"/"b", left uses "x"/"y"
        if (handedness === 'right') {
            switch (button) {
                case 'a':
                    return gamepad.buttons[4] && gamepad.buttons[4].pressed;
                case 'b':
                    return gamepad.buttons[5] && gamepad.buttons[5].pressed;
                case 'joystick':
                    return gamepad.buttons[3] && gamepad.buttons[3].pressed;
            }
        } else if (handedness === 'left') {
            switch (button) {
                case 'x':
                    return gamepad.buttons[4] && gamepad.buttons[4].pressed;
                case 'y':
                    return gamepad.buttons[5] && gamepad.buttons[5].pressed;
                case 'joystick':
                    return gamepad.buttons[3] && gamepad.buttons[3].pressed;
            }
        }
        return false;
    }
    getControllerTouching(args) {
        const gamepad = this._getGamepad(args.INDEX);
        if (!gamepad) return false;
        const inputSource = this._getInputSource(Cast.toNumber(args.INDEX) - 1);
        let handedness = 'right';
        if (inputSource && inputSource.handedness) {
            handedness = inputSource.handedness;
        }

        const button = Cast.toString(args.BUTTON).toLowerCase();
        if (handedness === 'right') {
            switch (button) {
                case 'a button':
                    return gamepad.buttons[4] && gamepad.buttons[4].touched;
                case 'b button':
                    return gamepad.buttons[5] && gamepad.buttons[5].touched;
                case 'joystick':
                    return gamepad.buttons[3] && gamepad.buttons[3].touched;
                case 'back trigger':
                    return gamepad.buttons[0] && gamepad.buttons[0].touched;
                case 'side trigger':
                    return gamepad.buttons[1] && gamepad.buttons[1].touched;
            }
        } else if (handedness === 'left') {
            switch (button) {
                case 'x button':
                    return gamepad.buttons[4] && gamepad.buttons[4].touched;
                case 'y button':
                    return gamepad.buttons[5] && gamepad.buttons[5].touched;
                case 'joystick':
                    return gamepad.buttons[3] && gamepad.buttons[3].touched;
                case 'back trigger':
                    return gamepad.buttons[0] && gamepad.buttons[0].touched;
                case 'side trigger':
                    return gamepad.buttons[1] && gamepad.buttons[1].touched;
            }
        }
        return false;
    }
}

module.exports = Jg3DVrBlocks;
