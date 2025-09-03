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

class LambdaType {
    customId = "jwLambda"

    constructor(func = function*() {}) {
        this.func = func
    }

    static toLambda(x) {
        if (x instanceof LambdaType) return x
        return new LambdaType()
    }

    jwArrayHandler() {
        return 'Lambda'
    }

    toString() {
        return `${this.func}`
    }

    execute = function* (arg, thread, target, runtime, stage) {
        try {
            return (yield* this.func(arg, thread, target, runtime, stage) ?? "")
        } catch (e) {
            console.warn("Lambda failed", e)
            return ""
        }
    }
}

const Lambda = {
    Type: LambdaType,
    Block: {
        blockType: BlockType.REPORTER,
        blockShape: BlockShape.SQUARE,
        forceOutputType: "Lambda",
        disableMonitor: true
    },
    Argument: {
        shape: BlockShape.SQUARE,
        check: ["Lambda"]
    }
}

class Extension {
    constructor() {
        vm.jwLambda = Lambda
        vm.runtime.registerSerializer(
            "jwLambda", 
            v => null, 
            v => new Lambda.Type("")
        );
        vm.runtime.registerCompiledExtensionBlocks('jwLambda', this.getCompileInfo());
    }

    getInfo() {
        return {
            id: "jwLambda",
            name: "Lambda",
            color1: "#aa2233",
            blocks: [
                {
                    opcode: 'arg',
                    text: 'argument',
                    blockType: BlockType.REPORTER,
                    hideFromPalette: true,
                    allowDropAnywhere: true,
                    canDragDuplicate: true
                },
                {
                    opcode: 'newLambda',
                    text: 'new lambda [ARG]',
                    arguments: {
                        ARG: {
                            fillIn: 'arg'
                        }
                    },
                    branches: [{}],
                    ...Lambda.Block
                },
                {
                    opcode: 'execute',
                    text: 'execute [LAMBDA] with [ARG]',
                    arguments: {
                        LAMBDA: Lambda.Argument,
                        ARG: {
                            type: ArgumentType.String,
                            defaultValue: "foo",
                            exemptFromNormalization: true
                        }
                    }
                },
                {
                    opcode: 'executeR',
                    text: 'execute [LAMBDA] with [ARG]',
                    blockType: BlockType.REPORTER,
                    allowDropAnywhere: true,
                    arguments: {
                        LAMBDA: Lambda.Argument,
                        ARG: {
                            type: ArgumentType.String,
                            defaultValue: "foo",
                            exemptFromNormalization: true
                        }
                    }
                }
            ]
        };
    }

    getCompileInfo() {
        return {
            ir: {
                newLambda: (generator, block) => ({
                    kind: 'input',
                    substack: generator.descendSubstack(block, 'SUBSTACK')
                }),
                execute: (generator, block) => ({
                    kind: 'stack',
                    lambda: generator.descendInputOfBlock(block, 'LAMBDA'),
                    arg: generator.descendInputOfBlock(block, 'ARG')
                }),
                executeR: (generator, block) => ({
                    kind: 'input',
                    lambda: generator.descendInputOfBlock(block, 'LAMBDA'),
                    arg: generator.descendInputOfBlock(block, 'ARG')
                }),
            },
            js: {
                newLambda: (node, compiler, imports) => {
                    const temp = compiler.source;
                    compiler.source = '(new runtime.vm.jwLambda.Type(function*(arg, thread, target, runtime, stage) {';
                    compiler.source += 'thread._jwLambdaArgument ??= [];\n';
                    compiler.source += 'thread._jwLambdaArgument.push(arg);\n';
                    compiler.descendStack(node.substack, new imports.Frame(false, undefined, true));
                    compiler.source += 'thread._jwLambdaArgument.pop();\n';
                    compiler.source += '}))';
                    const returns = compiler.source;
                    compiler.source = temp;
                    return new imports.TypedInput(returns, imports.TYPE_UNKNOWN);
                },
                execute: (node, compiler, imports) => {
                    compiler.source += `yield* runtime.vm.jwLambda.Type.toLambda(${compiler.descendInput(node.lambda).asUnknown()}).execute(${compiler.descendInput(node.arg).asUnknown()}, thread, target, runtime, stage)`
                },
                executeR: (node, compiler, imports) => {
                    return new imports.TypedInput(`yield* runtime.vm.jwLambda.Type.toLambda(${compiler.descendInput(node.lambda).asUnknown()}).execute(${compiler.descendInput(node.arg).asUnknown()}, thread, target, runtime, stage)`)
                }
            }
        }
    }

    arg({}, util) {
        return util.thread._jwLambdaArgument ? util.thread._jwLambdaArgument[util.thread._jwLambdaArgument.length-1] : ""
    }

    newLambda() {
        return 'noop'
    }

    execute() {
        return 'noop'
    }
    executeR() {
        return 'noop'
    }
}

module.exports = Extension