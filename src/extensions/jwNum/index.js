const BlockType = require('../../extension-support/block-type')
const BlockShape = require('../../extension-support/block-shape')
const ArgumentType = require('../../extension-support/argument-type')
const Cast = require('../../util/cast')

const OmegaNum = require('./omeganum.js')

function span(text) {
    let el = document.createElement('span')
    el.innerHTML = text
    el.style.display = 'hidden'
    el.style.whiteSpace = 'nowrap'
    el.style.width = '100%'
    el.style.textAlign = 'center'
    return el
}

class NumType {
    customId = "jwNum"

    number = OmegaNum(0)

    constructor(x) {
        this.number = OmegaNum(x)
    }

    static toNum(x) {
        if (x instanceof NumType) return new NumType(x.number)
        try {
            let parsed = JSON.parse(x)
            if (typeof parsed == 'object') return new NumType(parsed)
        } catch {}
        return new NumType(x)
    }

    jwArrayHandler() {
        return `jwNum`
    }

    toString() {
        return this.number.toStringWithDecimalPlaces(7)
    }
    toMonitorContent = () => span(this.toString())
    toReporterContent = () => span(this.toString())
}

const jwNum = {
    Type: NumType,
    Block: {
        blockType: BlockType.REPORTER,
        forceOutputType: "jwNum",
        disableMonitor: true
    },
    Argument: {
        type: ArgumentType.STRING,
        check: ["Number", "String", "jwNum"]
    }
}

class Extension {
    constructor() {
        vm.jwNum = jwNum
        vm.runtime.registerSerializer(
            "jwNum",
            v => v.toJSON(),
            v => new jwNum.Type(v)
        )
    }

    getInfo() {
        return {
            id: "jwNum",
            name: "Infinity",
            color1: "#3bd471",
            blocks: [
                {
                    opcode: 'add',
                    text: '[A] + [B]',
                    arguments: {
                        A: jwNum.Argument,
                        B: jwNum.Argument
                    },
                    ...jwNum.Block
                },
                {
                    opcode: 'sub',
                    text: '[A] - [B]',
                    arguments: {
                        A: jwNum.Argument,
                        B: jwNum.Argument
                    },
                    ...jwNum.Block
                },
                {
                    opcode: 'mul',
                    text: '[A] * [B]',
                    arguments: {
                        A: jwNum.Argument,
                        B: jwNum.Argument
                    },
                    ...jwNum.Block
                },
                {
                    opcode: 'div',
                    text: '[A] / [B]',
                    arguments: {
                        A: jwNum.Argument,
                        B: jwNum.Argument
                    },
                    ...jwNum.Block
                },
                {
                    opcode: 'pow',
                    text: '[A] ^ [B]',
                    arguments: {
                        A: jwNum.Argument,
                        B: jwNum.Argument
                    },
                    ...jwNum.Block
                },
                "---",
                {
                    opcode: 'arrow',
                    text: '[A] arrow [B] [C]',
                    arguments: {
                        A: jwNum.Argument,
                        B: jwNum.Argument,
                        C: jwNum.Argument
                    },
                    ...jwNum.Block
                }
            ]
        }
    }

    add({A, B}) {
        A = jwNum.Type.toNum(A)
        B = jwNum.Type.toNum(B)

        return new jwNum.Type(A.number.add(B.number))
    }

    sub({A, B}) {
        A = jwNum.Type.toNum(A)
        B = jwNum.Type.toNum(B)

        return new jwNum.Type(A.number.sub(B.number))
    }

    mul({A, B}) {
        A = jwNum.Type.toNum(A)
        B = jwNum.Type.toNum(B)

        return new jwNum.Type(A.number.mul(B.number))
    }

    div({A, B}) {
        A = jwNum.Type.toNum(A)
        B = jwNum.Type.toNum(B)

        return new jwNum.Type(A.number.div(B.number))
    }

    pow({A, B}) {
        A = jwNum.Type.toNum(A)
        B = jwNum.Type.toNum(B)

        return new jwNum.Type(A.number.pow(B.number))
    }

    arrow({A, B, C}) {
        A = jwNum.Type.toNum(A)
        B = jwNum.Type.toNum(B)
        C = jwNum.Type.toNum(C)

        return new jwNum.Type(A.number.arrow(B.number)(C.number))
    }
}

module.exports = Extension