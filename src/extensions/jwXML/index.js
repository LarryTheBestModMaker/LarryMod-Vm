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
        this.name = name

        this.children = children
        this.attributes = attributes
    }

    static toXML(v) {
        if (v instanceof XMLType) return new XMLType(v.name, [...v.children], {...v.attributes})
        // TODO: implement string to xml
        return new XMLType()
    }

    static safeName(name) {
        return /[A-z_][A-z0-9_-]*/.exec(name) ? name : "node"
    }

    toString() {

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
            color1: "#88ee63",
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
                "---",
                {
                    opcode: "getName",
                    text: "name of [XML]",
                    arguments: {
                        XML: XML.Argument
                    },
                    ...XML.Block
                },
                "---",
                {
                    opcode: "validName",
                    text: "is [NAME] valid node name",
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

    getName({XML}) {
        XML = XML.Type.toXML(XML)
        
        return XML.name
    }

    validName({NAME}) {
        NAME = Cast.toString(NAME)

        return XML.Type.safeName(NAME) === NAME
    }
}

module.exports = Extension