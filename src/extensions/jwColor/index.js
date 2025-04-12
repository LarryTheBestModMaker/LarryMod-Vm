const BlockType = require('../../extension-support/block-type')
const BlockShape = require('../../extension-support/block-shape')
const ArgumentType = require('../../extension-support/argument-type')
const Cast = require('../../util/cast')

/**
 * @param {number} x
 * @returns {string}
 */
function formatNumber(x) {
    if (x >= 1e6) {
        return x.toExponential(4)
    } else {
        x = Math.floor(x * 1000) / 1000
        return x.toFixed(Math.min(1, (String(x).split('.')[1] || '').length))
    }
}

function span(text) {
    let el = document.createElement('span')
    el.innerHTML = text
    el.style.display = 'hidden'
    el.style.whiteSpace = 'nowrap'
    el.style.width = '100%'
    el.style.textAlign = 'center'
    return el
}

class ColorType {
    customId = "jwColor"

    hue = 0
    setHue(x) {
        this.hue = (x % 360)
        if (this.hue < 0) {
            this.hue = 360 + this.hue
        }
    }

    saturation = 0
    setSaturation(x) {
        this.saturation = Math.max(0, Math.min(x, 1))
    }

    value = 0
    setValue(x) {
        this.value = Math.max(0, Math.min(x, 1))
    }

    constructor(h = 0, s = 0, v = 0) {
        this.setHue(h)
        this.setSaturation(s)
        this.setValue(v)
    }

    static toColor(x) {
        if (x instanceof ColorType) return x
        if (typeof x == 'string' && x.startsWith("#")) {
            try {
                if (x.length === 7 || x.length === 9) {
                    return ColorType.fromDecimal(Number(`0x${x.slice(1, 7)}`))
                } else if (x.length === 4 || x.length === 5) {
                    return ColorType.fromDecimal(Number(`0x${x.slice(1, 4).split("").map(v => v + v).join("")}`))
                }
            } catch {}
        }
        if (Number(x) == x) return ColorType.fromDecimal(x)
        return new ColorType()
    }

    static fromRGB(r, g, b) {
        r /= 255
        g /= 255
        b /= 255

        let v = Math.max(r, g, b), c = v - Math.min(r, g, b)
        let h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c))
        return new ColorType(60 * (h < 0 ? h + 6 : h), v && c / v, v)
    }

    static fromDecimal(d) {
        const r = (d >> 16) & 0xFF
        const g = (d >> 8) & 0xFF
        const b = d & 0xFF
        return this.fromRGB(r, g, b)
    }

    jwArrayHandler() {
        return 'Color'
    }

    toString() {
        return this.toDecimal()
    }
    toMonitorContent = () => span(this.toString())

    toReporterContent() {
        let root = document.createElement('div')
        root.style.display = 'flex'
        root.style.width = "200px"
        root.style.overflow = "hidden"
        let details = document.createElement('div')
        details.style.display = 'flex'
        details.style.flexDirection = 'column'
        details.style.justifyContent = 'center'
        details.style.width = "100px"
        details.appendChild(span(`<b>H:</b> ${formatNumber(Math.round(this.hue))}`))
        details.appendChild(span(`<b>S:</b> ${formatNumber(this.saturation * 100)}%`))
        details.appendChild(span(`<b>V:</b> ${formatNumber(this.value * 100)}%`))
        root.appendChild(details)
        let color = document.createElement('div')
        color.style.width = "84px"
        color.style.height = "84px"
        color.style.margin = "8px"
        color.style.border = "2px solid black"
        color.style.borderRadius = "8px"
        color.style.boxSizing = "border-box"
        color.style.backgroundColor = this.toHex()
        root.appendChild(color)
        return root
    }

    toRGB() {
        let f = (n, k = (n + this.hue / 60) % 6) => this.value - this.value * this.saturation * Math.max(Math.min(k, 4 - k, 1), 0)
        return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)]
    }

    toDecimal() {
        let [r, g, b] = this.toRGB()
        return r * 0x10000 + g * 0x100 + b * 0x1
    }

    toHex() {
        return `#${this.toDecimal().toString(16).padStart(6, "0")}`
    }
}

const Color = {
    Type: ColorType,
    Block: {
        blockType: BlockType.REPORTER,
        forceOutputType: "Color",
        disableMonitor: true
    },
    Argument: {
        type: ArgumentType.COLOR,
        defaultValue: "#ff7aab"
    }
}

class Extension {
    constructor() {
        vm.jwColor = Color
        vm.runtime.registerSerializer(
            "jwColor",
            v => [v.hue, v.saturation, v.value],
            v => new Color.Type(...v)
        );
    }

    getInfo() {
        return {
            id: "jwColor",
            name: "Color",
            color1: "#f04a87",
            menuIconURI: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMTI0IDEyNCIgZmlsbD0ibm9uZSI+CjxyZWN0IHdpZHRoPSIxMjQiIGhlaWdodD0iMTI0IiByeD0iMjQiIGZpbGw9IiNGOTczMTYiLz4KPHBhdGggZD0iTTE5LjM3NSAzNi43ODE4VjEwMC42MjVDMTkuMzc1IDEwMi44MzQgMjEuMTY1OSAxMDQuNjI1IDIzLjM3NSAxMDQuNjI1SDg3LjIxODFDOTAuNzgxOCAxMDQuNjI1IDkyLjU2NjQgMTAwLjMxNiA5MC4wNDY2IDk3Ljc5NjZMMjYuMjAzNCAzMy45NTM0QzIzLjY4MzYgMzEuNDMzNiAxOS4zNzUgMzMuMjE4MiAxOS4zNzUgMzYuNzgxOFoiIGZpbGw9IndoaXRlIi8+CjxjaXJjbGUgY3g9IjYzLjIxMDkiIGN5PSIzNy41MzkxIiByPSIxOC4xNjQxIiBmaWxsPSJibGFjayIvPgo8cmVjdCBvcGFjaXR5PSIwLjQiIHg9IjgxLjEzMjgiIHk9IjgwLjcxOTgiIHdpZHRoPSIxNy41Njg3IiBoZWlnaHQ9IjE3LjM4NzYiIHJ4PSI0IiB0cmFuc2Zvcm09InJvdGF0ZSgtNDUgODEuMTMyOCA4MC43MTk4KSIgZmlsbD0iI0ZEQkE3NCIvPgo8L3N2Zz4=",
            blocks: [
                {
                    opcode: 'newColor',
                    text: 'new color [COLOR]',
                    arguments: {
                        COLOR: Color.Argument
                    },
                    ...Color.Block
                },
                {
                    opcode: 'fromRGB',
                    text: 'from RGB [R] [G] [B]',
                    arguments: {
                        R: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 255
                        },
                        G: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 122
                        },
                        B: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 171
                        }
                    },
                    ...Color.Block
                },
                {
                    opcode: 'fromHSV',
                    text: 'from HSV [H] [S] [V]',
                    arguments: {
                        H: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 338
                        },
                        S: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.52
                        },
                        V: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    },
                    ...Color.Block
                },
                "---",
                {
                    opcode: 'add',
                    text: '[A] + [B]',
                    arguments: {
                        A: Color.Argument,
                        B: Color.Argument
                    },
                    ...Color.Block
                },
                {
                    opcode: 'sub',
                    text: '[A] - [B]',
                    arguments: {
                        A: Color.Argument,
                        B: Color.Argument
                    },
                    ...Color.Block
                },
                {
                    opcode: 'mul',
                    text: '[A] * [B]',
                    arguments: {
                        A: Color.Argument,
                        B: Color.Argument
                    },
                    ...Color.Block
                },
                "---",
                {
                    opcode: 'getR',
                    text: 'get R of [COLOR]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        COLOR: Color.Argument
                    }
                },
                {
                    opcode: 'getG',
                    text: 'get G of [COLOR]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        COLOR: Color.Argument
                    }
                },
                {
                    opcode: 'getB',
                    text: 'get B of [COLOR]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        COLOR: Color.Argument
                    }
                },
                {
                    opcode: 'setR',
                    text: 'set R of [COLOR] to [VALUE]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        COLOR: Color.Argument,
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'setG',
                    text: 'set G of [COLOR] to [VALUE]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        COLOR: Color.Argument,
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'setB',
                    text: 'set B of [COLOR] to [VALUE]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        COLOR: Color.Argument,
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                }
            ]
        };
    }

    newColor({COLOR}) {
        return Color.Type.toColor(COLOR)
    }

    fromRGB({R, G, B}) {
        R = Cast.toNumber(R)
        G = Cast.toNumber(G)
        B = Cast.toNumber(B)

        return Color.Type.fromRGB(R, G, B)
    }

    fromHSV({H, S, V}) {
        H = Cast.toNumber(H)
        S = Cast.toNumber(S)
        V = Cast.toNumber(V)

        return new Color.Type(H, S, V)
    }

    add({A, B}) {
        A = Color.Type.toColor(A).toRGB()
        B = Color.Type.toColor(B).toRGB()

        return Color.Type.fromRGB(Math.min(255, A[0] + B[0]), Math.min(255, A[1] + B[1]), Math.min(255, A[2] + B[2]))
    }

    sub({A, B}) {
        A = Color.Type.toColor(A).toRGB()
        B = Color.Type.toColor(B).toRGB()

        return Color.Type.fromRGB(A[0] - B[0], A[1] - B[1], A[2] - B[2])
    }

    mul({A, B}) {
        A = Color.Type.toColor(A).toRGB()
        B = Color.Type.toColor(B).toRGB()

        return Color.Type.fromRGB(A[0] * B[0] / 255, A[1] * B[1] / 255, A[2] * B[2] / 255)
    }

    getR({COLOR}) {
        COLOR = Color.Type.toColor(COLOR).toRGB()

        return COLOR[0]
    }

    getG({COLOR}) {
        COLOR = Color.Type.toColor(COLOR).toRGB()

        return COLOR[1]
    }

    getB({COLOR}) {
        COLOR = Color.Type.toColor(COLOR).toRGB()

        return COLOR[2]
    }

    setR({COLOR, VALUE}) {
        COLOR = Color.Type.toColor(COLOR).toRGB()
        VALUE = Cast.toNumber(VALUE)

        return Color.Type.fromRGB(VALUE, COLOR[1], COLOR[2])
    }

    setG({COLOR, VALUE}) {
        COLOR = Color.Type.toColor(COLOR).toRGB()
        VALUE = Cast.toNumber(VALUE)

        return Color.Type.fromRGB(COLOR[0], VALUE, COLOR[2])
    }

    setB({COLOR, VALUE}) {
        COLOR = Color.Type.toColor(COLOR).toRGB()
        VALUE = Cast.toNumber(VALUE)

        return Color.Type.fromRGB(COLOR[0], COLOR[1], VALUE)
    }
}

module.exports = Extension