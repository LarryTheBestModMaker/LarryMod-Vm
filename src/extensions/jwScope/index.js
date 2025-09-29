const BlockType = require('../../extension-support/block-type')
const BlockShape = require('../../extension-support/block-shape')
const ArgumentType = require('../../extension-support/argument-type')
const TargetType = require('../../extension-support/target-type')
const Cast = require('../../util/cast')

const jwScope = {
    create(array, name) {
        array[array.length-1][name] ??= null
    },

    delete(array, name) {
        for (let i = array.length-1; i >= 0; i--) {
            if (name in array[i]) {
                delete array[i][name]
                return
            }
        }
    },

    set(array, name, value) {
        for (let i = array.length-1; i >= 0; i--) {
            if (name in array[i]) {
                array[i][name] = value
                return
            }
        }
        array[array.length-1][name] = value
    },

    get(array, name) {
        for (let i = array.length-1; i >= 0; i--) {
            if (name in array[i]) {
                return array[i][name]
            }
        }
        return ""
    }
}

class Extension {
    constructor() {
        if (!vm.jwScope) {
            const oldCompile = vm.exports.JSGenerator.prototype.compile
            vm.exports.JSGenerator.prototype.compile = function() {
                this.source += "const jwScope = [];\n"
                oldCompile.call(this)
            }

            const oldDescendStack = vm.exports.JSGenerator.prototype.descendStack
            vm.exports.JSGenerator.prototype.descendStack = function(...args) {
                this.source += "jwScope.push({});\n"
                const result = oldDescendStack.call(this, ...args)
                this.source += "jwScope.pop();\n"
                return result
            }
        }
        vm.jwScope = jwScope

        vm.runtime.registerCompiledExtensionBlocks('jwScope', this.getCompileInfo());
    }

    getInfo() {
        return {
            id: "jwScope",
            name: "Scope",
            blocks: [
                {
                    opcode: "create",
                    blockType: BlockType.COMMAND,
                    text: "init [NAME]",
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: "var",
                        }
                    },
                },
                {
                    opcode: "delete",
                    blockType: BlockType.COMMAND,
                    text: "remove [NAME]",
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: "var",
                        }
                    },
                },
                "---",
                {
                    opcode: "set",
                    blockType: BlockType.COMMAND,
                    text: "set [NAME] to [VALUE]",
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: "var",
                        },
                        VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: "apple",
                            exemptFromNormalization: true
                        }
                    },
                },
                {
                    opcode: "get",
                    blockType: BlockType.REPORTER,
                    text: "get [NAME]",
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: "var"
                        }
                    },
                },
            ]
        };
    }

    getCompileInfo() {
        return {
            ir: {
                create: (generator, block) => ({
                    kind: 'stack',
                    name: generator.descendInputOfBlock(block, 'NAME')
                }),
                delete: (generator, block) => ({
                    kind: 'stack',
                    name: generator.descendInputOfBlock(block, 'NAME')
                }),
                set: (generator, block) => ({
                    kind: 'stack',
                    name: generator.descendInputOfBlock(block, 'NAME'),
                    value: generator.descendInputOfBlock(block, 'VALUE')
                }),
                get: (generator, block) => ({
                    kind: 'input',
                    name: generator.descendInputOfBlock(block, 'NAME')
                })
            },
            js: {
                create: (node, compiler, imports) => {
                    compiler.source += `vm.jwScope.create(jwScope, ${compiler.descendInput(node.name).asString()});\n`
                },
                delete: (node, compiler, imports) => {
                    compiler.source += `vm.jwScope.delete(jwScope, ${compiler.descendInput(node.name).asString()});\n`
                },
                set: (node, compiler, imports) => {
                    compiler.source += `vm.jwScope.set(jwScope, ${compiler.descendInput(node.name).asString()}, ${compiler.descendInput(node.value).asUnknown()});\n`
                },
                get: (node, compiler, imports) => {
                    return new imports.TypedInput(`vm.jwScope.get(jwScope, ${compiler.descendInput(node.name).asString()})`, imports.TYPE_UNKNOWN)
                }
            }
        }
    }
}

module.exports = Extension