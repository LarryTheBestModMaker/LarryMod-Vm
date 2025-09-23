const BlockType = require('../../extension-support/block-type');
const BlockShape = require('../../extension-support/block-shape');
const ArgumentType = require('../../extension-support/argument-type');
const Cast = require('../../util/cast');

/**
 * @param {number} x
 * @returns {string}
 */
function formatNumber(x) {
    if (x >= 1e6) {
        return x.toExponential(4);
    } else {
        x = Math.floor(x * 1000) / 1000;
        return x.toFixed(Math.min(3, (String(x).split('.')[1] || '').length));
    }
}

function span(text) {
    let el = document.createElement('span');
    el.innerHTML = text;
    el.style.display = 'hidden';
    el.style.width = '100%';
    el.style.boxSizing = 'border-box';
    el.style.textAlign = 'center';
    return el;
}

function getFunction(x) {
    try {
        let func = (new Function(`return ${x}`))();
        if (Object.getPrototypeOf(func) == Object.getPrototypeOf(function* () {})) return func;
    } catch {}
}

/* --- Lexical Scope (closures) --- */
class Scope {
    constructor(parent = null) {
        this.parent = parent;
        this.vars = Object.create(null);
    }
    get(name) {
        if (name in this.vars) return this.vars[name];
        if (this.parent) return this.parent.get(name);
        return "";
    }
    set(name, value) {
        if (name in this.vars) {
            this.vars[name] = value;
        } else if (this.parent && this.parent.has(name)) {
            this.parent.set(name, value);
        } else {
            this.vars[name] = value;
        }
    }
    has(name) {
        if (name in this.vars) return true;
        if (this.parent) return this.parent.has(name);
        return false;
    }
}

/* --- Lambda custom type with scope --- */
class LambdaType {
    customId = "frLambda2";

    constructor(func = function* () {}, scope = new Scope()) {
        this.func = func;
        this.scope = scope;
    }

    static toLambda(x) {
        if (x instanceof LambdaType) return x;
        return new LambdaType();
    }

    jwArrayHandler() {
        return 'Lambda';
    }

    toString() {
        return this.func.toString();
    }

    toReporterContent() {
        let root = span(this.toString());
        root.style.display = "block";
        root.style.textAlign = "left";
        root.style.fontFamily = "monospace";
        root.style.fontSize = "14px";
        return root;
    }

    // execute a lambda: set up lexical scope, run generator body, wrap returned generators/lambdas
    execute = function* (arg, thread, target, runtime, stage) {
        try {
            thread._frLambda2Argument ??= [];
            thread._frLambda2Argument.push(arg);

            const oldScope = thread._frLambda2Scope;
            thread._frLambda2Scope = new Scope(this.scope);

            let output = (yield* this.func(arg, thread, target, runtime, stage) ?? "");

            // If the body returned a raw generator function, wrap it as a LambdaType (capture closure)
            if (output instanceof Function && Object.getPrototypeOf(output) === Object.getPrototypeOf(function* () {})) {
                output = new LambdaType(output, thread._frLambda2Scope);
            } else if (output instanceof LambdaType) {
                // propagate lexical scope
                output.scope = new Scope(thread._frLambda2Scope);
            }

            thread._frLambda2Scope = oldScope;
            thread._frLambda2Argument.pop();

            return output;
        } catch (e) {
            console.warn("Lambda failed", e);
            return "";
        }
    }
}

/* --- Helper object to mimic original shape --- */
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
};

/* --- Extension --- */
class Extension {
    constructor() {
        // Provide Lambda object on vm (like original extension)
        vm.frLambda2 = Lambda;

        // register serializer so the VM treats this as a custom type (no [object Generator])
        vm.runtime.registerSerializer(
            "frLambda2",
            v => null,
            v => new Lambda.Type()
        );

        // preserve compile-time behavior
        vm.runtime.registerCompiledExtensionBlocks('frLambda2', this.getCompileInfo());
    }

    get rawLambdaAvailable() {
        return vm.runtime.ext_SPjavascriptV2?.isEditorUnsandboxed;
    }

    getInfo() {
        return {
            id: "frLambda2",
            name: "Fresh's Lambda",
            color1: "#c71a4b",
            menuIconURI: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCI+CiAgPGVsbGlwc2Ugc3R5bGU9ImZpbGw6IHJnYigxOTksIDI2LCA3NSk7IHN0cm9rZTogcmdiKDE1OSwgMjAsIDYwKTsiIGN4PSIxMCIgY3k9IjEwIiByeT0iOS41IiByeD0iOS41Ij48L2VsbGlwc2U+CiAgPHBhdGggZD0iTSA3LjIzNyA1LjI2NCBDIDEwLjM5NSA1LjI2NCAxMC4zOTUgMTQuNzM2IDEzLjU1MSAxNC43MzYgTSAxMC4wNzkgOS4wNTMgTCA2LjQ0OSAxNC43MzYiIHN0eWxlPSJmaWxsOiBub25lOyBzdHJva2U6IHJnYigyNTUsIDI1NSwgMjU1KTsgc3Ryb2tlLWxpbmVjYXA6IHJvdW5kOyBzdHJva2Utd2lkdGg6IDJweDsiPjwvcGF0aD4KPC9zdmc+",
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
                    <block type="frLambda2_newLambda">
                        <value name="ARG">
                            <shadow type="frLambda2_arg" />
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
                        FIELD: {
                            type: ArgumentType.CUSTOM, id: "SPjavascriptV2-codeEditor",
                            defaultValue: "function* (arg, thread, target, runtime, stage) {\n  return 1;\n}"
                        }
                    }
                },
                {
                    opcode: 'rawLambda',
                    text: 'new lambda [RAW]',
                    hideFromPalette: !this.rawLambdaAvailable || !(typeof ScratchBlocks === "object"),
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
                },
                // set/get/change blocks
                {
                    opcode: 'setVar',
                    text: 'set [NAME] to [VALUE]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        NAME: { type: ArgumentType.STRING, defaultValue: "x" },
                        VALUE: { type: ArgumentType.STRING, defaultValue: "0", exemptFromNormalization: true }
                    }
                },
                {
                    opcode: 'getVar',
                    text: 'get [NAME]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        NAME: { type: ArgumentType.STRING, defaultValue: "x" }
                    }
                },
                {
                    opcode: 'changeVar',
                    text: 'change [NAME] by [DELTA]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        NAME: { type: ArgumentType.STRING, defaultValue: "x" },
                        DELTA: { type: ArgumentType.NUMBER, defaultValue: 1 }
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
                    compiler.source = '(new runtime.vm.frLambda2.Type(function*(arg, thread, target, runtime, stage) {\n';
                    compiler.descendStack(node.substack, new imports.Frame(false, undefined, true));
                    compiler.source += '}))';
                    const returns = compiler.source;
                    compiler.source = temp;
                    return new imports.TypedInput(returns, imports.TYPE_UNKNOWN);
                },
                execute: (node, compiler, imports) => {
                    compiler.source += `yield* runtime.vm.frLambda2.Type.toLambda(${compiler.descendInput(node.lambda).asUnknown()}).execute(${compiler.descendInput(node.arg).asUnknown()}, thread, target, runtime, stage);\n`
                },
                executeR: (node, compiler, imports) => {
                    return new imports.TypedInput(`(yield* runtime.vm.frLambda2.Type.toLambda(${compiler.descendInput(node.lambda).asUnknown()}).execute(${compiler.descendInput(node.arg).asUnknown()}, thread, target, runtime, stage))`)
                }
            }
        }
    }

    // ---- runtime implementations ----

    arg({}, util) {
        return util.thread._frLambda2Argument ? util.thread._frLambda2Argument[util.thread._frLambda2Argument.length - 1] : ""
    }

    newLambda(args, util) {
        // capture current lexical scope for closures
        const parentScope = util.thread._frLambda2Scope || new Scope();

        // generator body executes the substack when invoked
        const func = function* (arg, thread, target, runtime, stage) {
            return yield* util.startBranch(0, true);
        };

        return new Lambda.Type(func, parentScope);
    }

    rawLambdaInput({ FIELD }) {
        return FIELD;
    }

    rawLambda({ RAW }, util) {
        if (!this.rawLambdaAvailable) return new Lambda.Type();

        // capture current scope for closure
        const parentScope = util?.thread?._frLambda2Scope || new Scope();
        let func = getFunction(Cast.toString(RAW));
        return new Lambda.Type(func, parentScope);
    }

    *execute({ LAMBDA, ARG }, util) {
        yield* Lambda.Type.toLambda(LAMBDA).execute(ARG, util.thread, util.target, util.runtime, /*stage*/ undefined);
    }

    *executeR({ LAMBDA, ARG }, util) {
        return yield* Lambda.Type.toLambda(LAMBDA).execute(ARG, util.thread, util.target, util.runtime, /*stage*/ undefined);
    }

    // set/get/change operate only on the current lexical scope (if present)
    setVar({ NAME, VALUE }, util) {
        const scope = util.thread._frLambda2Scope;
        if (scope) {
            scope.set(NAME, VALUE);
        }
    }

    getVar({ NAME }, util) {
        const scope = util.thread._frLambda2Scope;
        if (scope) {
            return scope.get(NAME);
        }
        return "";
    }

    changeVar({ NAME, DELTA }, util) {
        const scope = util.thread._frLambda2Scope;
        if (!scope) return;

        const cur = scope.get(NAME);
        const curNum = parseFloat(cur);
        const deltaNum = parseFloat(DELTA);

        if (!Number.isNaN(curNum) && !Number.isNaN(deltaNum)) {
            const result = curNum + deltaNum;
            scope.set(NAME, result);
        }
    }
}

module.exports = Extension;
