const BlockType = require('../../extension-support/block-type')
const BlockShape = require('../../extension-support/block-shape')
const ArgumentType = require('../../extension-support/argument-type')
const TargetType = require('../../extension-support/target-type')
const Cast = require('../../util/cast')

class XMLType {
    /** @type {Array<string | XMLType>} */
    children

    /** @type {Object<string, string>} */
    attributes

    /** @type {string} */
    name

    constructor(name, children = [], attributes = {}) {
        this.name = XMLType.safeName(name)

        this.children = children
        this.attributes = attributes
    }

    static toXML(v) {
        if (v instanceof XMLType) return new XMLType(v.name, [...v.children], {...v.attributes})
        // TODO: implement string to xml
        return new XMLType()
    }

    static forXML(v) {
        if (v instanceof XMLType) return v
        return Cast.toString(v)
    }

    static safeName(name) {
        name ??= "node"
        return /[A-z_][A-z0-9_-]*/.exec(name) ? name : "node"
    }

    static safeText(text) {
        return [
            ["&", "&amp;"],
            ["<", "&lt;"],
            [">", "&gt;"],
            ['"', "&quot;"],
            ["'", "&apos;"]
        ].reduce((a, b) => a.replaceAll(b[0], b[1]), text)
    }

    toString() {
        let output = `<${this.name}`
        
        for (let [attr, value] of Object.entries(this.attributes)) {
            output += ` ${attr}="${XMLType.safeText(value)}"`
        }

        if (this.children.length === 0) {
            output += " />"
        } else {
            output += ">"
            for (let child of this.children) {
                output += child instanceof XMLType ? child.toString() : XMLType.safeText(child)
            }
            output += `</${this.name}>`
            return output
        }

        return `<${this.name} />`
    }
}

let XML = {
    Type: XMLType,
    Block: {
        blockType: BlockType.REPORTER,
        forceOutputType: "jwXML",
        disableMonitor: true
    },
    Argument: {
        check: ["jwXML"],
        exemptFromNormalization: true
    }
}

let jwArray = {
    Type: class {},
    Block: {},
    Argument: {}
}

class Extension {
    constructor() {
        vm.jwXML = XML
        /*vm.runtime.registerSerializer(
            "jwTargets", 
            v => v.targetId, 
            v => new Target.Type(v)
        );*/

        if (!vm.jwArray) vm.extensionManager.loadExtensionIdSync('jwArray')
        jwArray = vm.jwArray
    }

    getInfo() {
        return {
            id: "jwXML",
            name: "XML",
            color1: "#8dd941",
            blocks: [
                {
                    opcode: "newNode",
                    text: "new node [NAME]",
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: "name"
                        }
                    },
                    ...XML.Block
                },
                {
                    opcode: "parse",
                    text: "parse [INPUT] as node",
                    arguments: {
                        INPUT: {
                            type: ArgumentType.STRING,
                            defaultValue: '<name />',
                            exemptFromNormalization: true
                        }
                    },
                    ...XML.Block
                },
                "---",
                {
                    opcode: "getName",
                    text: "name of [NODE]",
                    arguments: {
                        NODE: XML.Argument
                    },
                    ...XML.Block
                },
                {
                    opcode: "setName",
                    text: "set name of [NODE] to [NAME]",
                    arguments: {
                        NODE: XML.Argument,
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: "name"
                        }
                    },
                    ...XML.Block
                },
                "---",
                {
                    opcode: "getChildren",
                    text: "children of [NODE]",
                    arguments: {
                        NODE: XML.Argument
                    },
                    ...jwArray.Block
                },
                {
                    opcode: "setChildren",
                    text: "set children of [NODE] to [CHILDREN]",
                    arguments: {
                        NODE: XML.Argument,
                        CHILDREN: jwArray.Argument
                    },
                    ...XML.Block
                },
                "---",
                {
                    opcode: "getAttribute",
                    text: "attribute [ATTRIBUTE] of [NODE]",
                    type: BlockType.REPORTER,
                    arguments: {
                        ATTRIBUTE: {
                            type: ArgumentType.STRING,
                            defaultValue: "name"
                        },
                        NODE: XML.Argument
                    },
                },
                {
                    opcode: "setAttribute",
                    text: "set attribute [ATTRIBUTE] of [NODE] to [VALUE]",
                    arguments: {
                        ATTRIBUTE: {
                            type: ArgumentType.STRING,
                            defaultValue: "name"
                        },
                        NODE: XML.Argument,
                        VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: "value"
                        },
                    },
                    ...XML.Block
                },
                {
                    opcode: "removeAttribute",
                    text: "remove attribute [ATTRIBUTE] of [NODE]",
                    arguments: {
                        ATTRIBUTE: {
                            type: ArgumentType.STRING,
                            defaultValue: "name"
                        },
                        NODE: XML.Argument
                    },
                    ...XML.Block
                },
                {
                    opcode: "hasAttribute",
                    text: "[NODE] has attribute [ATTRIBUTE]",
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        NODE: XML.Argument,
                        ATTRIBUTE: {
                            type: ArgumentType.STRING,
                            defaultValue: "name"
                        }
                    }
                },
                {
                    opcode: "getAttributes",
                    text: "attributes of [NODE]",
                    arguments: {
                        NODE: XML.Argument
                    },
                    ...jwArray.Block
                },
                "---",
                {
                    opcode: "toString",
                    text: "stringify [NODE]",
                    blockType: BlockType.REPORTER,
                    arguments: {
                        NODE: XML.Argument
                    }
                },
                "---",
                {
                    opcode: "validName",
                    text: "is [NAME] valid name",
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: "name"
                        }
                    }
                }
            ]
        };
    }

    newNode({NAME}) {
        NAME = Cast.toString(NAME)

        return new XML.Type(XML.Type.safeName(NAME))
    }

    parse({INPUT}) {
        return XML.Type.toXML(INPUT)
    }

    getName({NODE}) {
        NODE = XML.Type.toXML(NODE)
        
        return NODE.name
    }

    setName({NODE, NAME}) {
        NODE = XML.Type.toXML(NODE)
        NAME = Cast.toString(NAME)

        NODE.name = XML.Type.safeName(NAME)
        return NODE
    }

    getChildren({NODE}) {
        NODE = XML.Type.toXML(NODE)

        return new jwArray.Type(NODE.children, true)
    }

    setChildren({NODE, CHILDREN}) {
        NODE = XML.Type.toXML(NODE)
        CHILDREN = jwArray.Type.toArray(CHILDREN).array.map(v => XML.Type.forXML(v))

        NODE.children = CHILDREN
        return NODE
    }

    getAttribute({NODE, ATTRIBUTE}) {
        NODE = XML.Type.toXML(NODE)
        ATTRIBUTE = Cast.toString(ATTRIBUTE)

        return NODE.attributes[ATTRIBUTE] === undefined ? "" : NODE.attributes[ATTRIBUTE]
    }

    setAttribute({NODE, ATTRIBUTE, VALUE}) {
        NODE = XML.Type.toXML(NODE)
        ATTRIBUTE = Cast.toString(ATTRIBUTE)
        VALUE = Cast.toString(VALUE)

        if (this.validName({NAME: ATTRIBUTE})) {
            NODE.attributes[ATTRIBUTE] = VALUE
        }

        return NODE
    }

    removeAttribute({NODE, ATTRIBUTE}) {
        NODE = XML.Type.toXML(NODE)
        ATTRIBUTE = Cast.toString(ATTRIBUTE)

        delete NODE.attributes[ATTRIBUTE]
        return NODE
    }

    hasAttribute({NODE, ATTRIBUTE}) {
        NODE = XML.Type.toXML(NODE)
        ATTRIBUTE = Cast.toString(ATTRIBUTE)

        return NODE.attributes[ATTRIBUTE] !== undefined
    }

    getAttributes({NODE}) {
        NODE = XML.Type.toXML(NODE)

        return new jwArray.Type(Object.keys(NODE.attributes), true)
    }

    toString({NODE}) {
        NODE = XML.Type.toXML(NODE)

        return NODE.toString()
    }

    validName({NAME}) {
        NAME = Cast.toString(NAME)

        return XML.Type.safeName(NAME) === NAME
    }
}

module.exports = Extension