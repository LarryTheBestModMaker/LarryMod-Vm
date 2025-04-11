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
        return x.toFixed(Math.min(3, (String(x).split('.')[1] || '').length))
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
                } else if (x.length === 4) {
                    return ColorType.fromDecimal(Number(`0x${x.slice(1, 4).split("").map(v => v + v).join("")}`))
                }
            } catch {}
        }
        if (Number(x) == x) return ColorType.fromDecimal(x)
        return new ColorType()
    }

    static fromRGB(r, g, b) {
        let v = Math.max(r, g, b), c = v - Math.min(r, g, b)
        let h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c))
        return new ColorType(...[60 * (h < 0 ? h + 6 : h), v && c / v, v])
    }

    static fromDecimal(d) {
        const r = (decimal >> 16) & 0xFF
        const g = (decimal >> 8) & 0xFF
        const b = decimal & 0xFF
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
        details.appendChild(span(`<b>H:</b> ${formatNumber(this.hue)}`))
        details.appendChild(span(`<b>S:</b> ${formatNumber(this.saturation)}`))
        details.appendChild(span(`<b>V:</b> ${formatNumber(this.value)}`))
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
        let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)
        return [f(5), f(3), f(1)]
    }

    toDecimal() {
        let [r, g, b] = this.toRGB()
        return r * 0x10000 + g * 0x100 + b * 0x1
    }

    toHex() {
        return `#${this.toDecimal().toString(16)}`
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
        type: ArgumentType.COLOR
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
            blocks: [
                {
                    opcode: 'newColor',
                    text: 'new color [COLOR]',
                    arguments: {
                        COLOR: Color.Argument
                    },
                    ...Color.Block
                }
            ]
        };
    }

    newColor({COLOR}) {
        return Color.Type.toColor(COLOR)
    }
}

module.exports = Extension