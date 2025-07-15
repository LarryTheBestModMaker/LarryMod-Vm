const BlockType = require('../../extension-support/block-type')
const BlockShape = require('../../extension-support/block-shape')
const ArgumentType = require('../../extension-support/argument-type')
const TargetType = require('../../extension-support/target-type')
const Cast = require('../../util/cast')

let jwArray = {
    Type: class {},
    Block: {},
    Argument: {}
}

class Extension {
    constructor() {
        if (!vm.jwArray) vm.extensionManager.loadExtensionIdSync('jwArray')
        jwArray = vm.jwArray
    }

    getInfo() {
        return {
            id: "jwStorage",
            name: "Storage",
            color1: "#555555",
            blocks: [
                {
                    opcode: 'getFile',
                    text: 'get file [NAME] as [MENU]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: "file.txt"
                        },
                        MENU: {
                            menu: "fileExportType",
                            defaultValue: "text"
                        }
                    }
                },
                {
                    opcode: 'getAllFiles',
                    text: 'get all files',
                    ...jwArray.Block
                }
            ],
            menus: {
                fileExportType: [
                    "text",
                    "base64"
                ],
            }
        };
    }

    async getFile({NAME, TYPE}) {
        if (!vm._projectZip.files["extraFiles/"]) return ""

        NAME = Cast.toString(NAME)
        TYPE = Cast.toString(TYPE)

        let file = vm._projectZip.folder("extraFiles").file(NAME)
        if (!file) return ""

        switch (TYPE) {
            case "text": return await file.async("text")
            case "base64": return await file.async("base64")
            default: return ""
        }
    }

    getAllFiles() {
        if (!vm._projectZip.files["extraFiles/"]) return new jwArray.Type()

        return new jwArray.Type(Object.values(vm._projectZip.files).filter(v => v.name.startsWith("extraFiles/") && !v.dir).map(v => v.name.substring(11)))
    }
}

module.exports = Extension