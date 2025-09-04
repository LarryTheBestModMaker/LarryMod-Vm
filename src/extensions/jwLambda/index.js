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

function getFunction(x) {
    try {
        let func = (new Function(`return ${x}`))()
        if (Object.getPrototypeOf(func) == Object.getPrototypeOf(function*() {})) return func
    } catch {}
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
            thread._jwLambdaArgument ??= []
            thread._jwLambdaArgument.push(arg)
            let output = (yield* this.func(arg, thread, target, runtime, stage) ?? "")
            thread._jwLambdaArgument.pop()
            return output
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
            v => new Lambda.Type()
        );
        vm.runtime.registerCompiledExtensionBlocks('jwLambda', this.getCompileInfo());
    }

    get rawLambdaAvailable() {
        return vm.runtime.ext_SPjavascriptV2?.isEditorUnsandboxed
    }

    getInfo() {
        return {
            id: "jwLambda",
            name: "Lambda",
            color1: "#ff6da7",
            blockText: "#330000",
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
                    hideFromPalette: true,
                    arguments: {
                        ARG: {
                            fillIn: 'arg'
                        }
                    },
                    branches: [{}],
                    ...Lambda.Block
                },
                {
                    blockType: BlockType.XML,
                    xml: `
                    <block type="jwLambda_newLambda">
                        <value name="ARG">
                            <shadow type="jwLambda_arg" />
                        </value>
                        <value name="SUBSTACK">
                            <block type="procedures_return">
                                <value name="return">
                                    <shadow type="text">
                                        <field name="TEXT">1</field>
                                    </shadow>
                                </value>
                            </block>
                        </value>
                    </block>
                    `
                },
                {
                    opcode: 'rawLambdaInput',
                    text: '[FIELD]',
                    hideFromPalette: true,
                    blockType: BlockType.REPORTER,
                    blockShape: BlockShape.SQUARE,
                    arguments: {
                        FIELD: typeof ScratchBlocks === "object" ? {
                            type: ArgumentType.CUSTOM, id: "SPjavascriptV2-codeEditor",
                            defaultValue: "function* (arg, thread, target, runtime, stage) {\n  return 1;\n}"
                        } : {
                            type: ArgumentType.STRING,
                            defaultValue: "function* (arg, thread, target, runtime, stage) { return 1; }"
                        }
                    }
                },
                {
                    opcode: 'rawLambda',
                    text: 'new lambda [RAW]',
                    hideFromPalette: !this.rawLambdaAvailable,
                    arguments: {
                        RAW: {
                            fillIn: "rawLambdaInput"
                        }
                    },
                    ...Lambda.Block
                },
                "---",
                {
                    opcode: 'execute',
                    text: 'execute [LAMBDA] with [ARG]',
                    arguments: {
                        LAMBDA: Lambda.Argument,
                        ARG: {
                            type: ArgumentType.STRING,
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
                            type: ArgumentType.STRING,
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
                    compiler.descendStack(node.substack, new imports.Frame(false, undefined, true));
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

    rawLambdaInput({FIELD}) {
        return FIELD
    }
    rawLambda({RAW}) {
        if (!this.rawLambdaAvailable) return new Lambda.Type()
        let func = getFunction(Cast.toString(RAW))
        return new Lambda.Type(func)
    }

    execute() {
        return 'noop'
    }
    executeR() {
        return 'noop'
    }
}

module.exports = Extension