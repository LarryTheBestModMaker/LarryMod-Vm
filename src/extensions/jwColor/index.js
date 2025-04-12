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
            menuIconURI: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCI+CiAgPGVsbGlwc2Ugc3R5bGU9ImZpbGw6IHJnYigyNDAsIDc0LCAxMzUpOyBzdHJva2U6IHJnYigyMTYsIDY2LCAxMjIpOyBzdHJva2Utd2lkdGg6IDJweDsgcGFpbnQtb3JkZXI6IHN0cm9rZTsiIGN4PSIxMCIgY3k9IjEwIiByeD0iOSIgcnk9IjkiPjwvZWxsaXBzZT4KICA8cGF0aCB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGQ9Ik0gMTIuMTYyIDExLjAxNSBDIDExLjM1OCAxMS44MTkgMTAuNzY1IDEyLjIzMyAxMC4yOTkgMTIuMzkxIEMgMTAuMTYyIDExLjk2OCA5LjkyOSAxMS41NzYgOS42MDEgMTEuMjQ4IEMgOS4yNjIgMTAuOTIgOC44NzEgMTAuNjg3IDguNDQ3IDEwLjUzOCBDIDguNjE3IDEwLjA3MyA5LjAzIDkuNDggOS44MjMgOC42ODcgQyAxMS43MjggNi43NzEgMTUuMTE1IDQuNDMyIDE1Ljc2MSA1LjA3OCBDIDE2LjQwNyA1LjcyMyAxNC4wNjggOS4xMSAxMi4xNjIgMTEuMDE1IFogTSA4LjY1IDE0LjUzOSBDIDguMzM1IDE0Ljg0NCA3LjkyOSAxNSA3LjUyMiAxNS4wMiBMIDcuNTIyIDE1LjAzIEwgNy40MjEgMTUuMDMgQyA0LjY5OCAxNS4xMjggMy41MDkgMTIuMDQ2IDQuNDQ0IDEyLjM2OSBDIDUuNjczIDEyLjc5MiA2LjE3MiAxMi4xODMgNi4xOTEgMTIuMTYzIEMgNi44NzIgMTEuNTE2IDcuOTY5IDExLjUxNiA4LjY1IDEyLjE2MyBDIDkuMzMxIDEyLjgyMSA5LjMzMSAxMy44OTIgOC42NSAxNC41MzkgWiIgaWQ9ImJ1cnNoLWljb24iIHN0eWxlPSJmaWxsOiByZ2IoMjU1LCAyNTUsIDI1NSk7Ij48L3BhdGg+Cjwvc3ZnPg==",
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
                {
                    opcode: 'interpolate',
                    text: 'interpolate [A] to [B] by [I] using [OPTION]',
                    arguments: {
                        A: Color.Argument,
                        B: Color.Argument,
                        I: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.5
                        },
                        OPTION: {
                            menu: "interpolateOption"
                        }
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
            ],
            menus: {
                interpolateOption: {
                    acceptReporters: false,
                    items: [
                        'RGB',
                        'HSV'
                    ]
                }
            }
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

    interpolate({A, B, I, OPTION}) {
        A = Color.Type.toColor(A)
        B = Color.Type.toColor(B)
        I = Math.max(0, Math.min(Cast.toNumber(I), 1))

        switch (OPTION) {
            case "RGB":
                A = A.toRGB()
                B = B.toRGB()

                return Color.Type.fromRGB(A[0] * 1-I + B[0] * I, A[1] * 1-I + B[1] * I, A[2] * 1-I + B[2] * I)
            case "HSV":
                let hueDifference = Math.abs(A.hue - B.hue)
                if (hueDifference > 180) {
                    return new Color.Type(A.hue * (1-I) - (360 - hueDifference) * I, A.saturation * (1-I) + B.saturation * I, A.value * (1-I) + B.value * I)
                } else {
                    return new Color.Type(A.hue * (1-I) + B.hue * I, A.saturation * (1-I) + B.saturation * I, A.value * (1-I) + B.value * I)
                }
            default: return new Color.Type
        }
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