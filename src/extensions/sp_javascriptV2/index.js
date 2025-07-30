const BlockType = require("../../extension-support/block-type");
const BlockShape = require("../../extension-support/block-shape");
const ArgumentType = require("../../extension-support/argument-type");
const SandboxRunner = require("../../util/sandboxed-javascript-runner");
const Cast = require("../../util/cast");

let isScratchBlocksReady = typeof ScratchBlocks === "object";
const codeEditorHandlers = new Map();

function initBlockTools() {
  window.addEventListener("message", (e) => {
    if (e.data?.type === "code-change") {
      const handler = codeEditorHandlers.get(e.data.id);
      if (handler) handler(e.data.value);
    }
  });

  const recyclableDiv = document.createElement("div");
  recyclableDiv.setAttribute("style", `display: flex; justify-content: center; margin-top: 10px; width: 250px; height: 200px;`);

  const fakeDiv = document.createElement("div");
  fakeDiv.setAttribute("style", "background: #272822; border-radius: 10px; border: none; width: 100%; height: calc(100% - 20px);");
  recyclableDiv.appendChild(fakeDiv);

  ScratchBlocks.FieldCustom.registerInput(
    "SPjavascriptV2-codeEditor",
    recyclableDiv,
    (field) => {
      /* on init */
      const input = field.inputSource.firstChild;
      const srcBlock = field.sourceBlock_;
      const dragCheck = srcBlock.svgGroup_.classList.contains("blocklyDragging") ? "none" : "all";

      field.inputSource.setAttribute("pointer-events", "none");
      const iframe = document.createElement("iframe");
      iframe.setAttribute("style", `pointer-events: ${dragCheck}; background: #272822; border-radius: 10px; border: none; width: 100%; height: calc(100% - 20px);`);
      iframe.setAttribute("sandbox", "allow-scripts");

      const html = `
<!DOCTYPE html>
<html><head>
  <style>html, body, #editor {background: #272822; margin: 0; padding: 0; height: 100%; width: 100%;}</style>
</head>
<body>
  <div id="editor"></div>
  <script src="https://cdn.jsdelivr.net/npm/ace-builds@1.32.3/src-min-noconflict/ace.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/ace-builds@1.32.3/src-min-noconflict/mode-javascript.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/ace-builds@1.32.3/src-min-noconflict/theme-monokai.js"></script>
  <script>
    window.addEventListener("message", function(e) {
      const editor = ace.edit("editor");
      editor.setOptions({
        fontSize: "15px", showPrintMargin: false,
        highlightActiveLine: true, useWorker: false
      });

      editor.session.setMode("ace/mode/javascript");
      editor.setTheme("ace/theme/monokai");
      editor.setValue(e.data.value);
      editor.session.on("change", () => parent.postMessage({
        type: "code-change", id: "${srcBlock.id}", value: editor.getValue()
      }, "*"));
    }, { once: true });
  </script>
</body>
</html>`;
      iframe.src = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      input.replaceChild(iframe, input.firstChild);
      iframe.onload = () => {
        let value = field.getValue();
        if (value === "needsInit-1@#4%^7*(0") {
          const outerType = srcBlock.parentBlock_.type;
          if (outerType.endsWith("jsCommandBinded")) value = `alert(FOO);`;
          else if (outerType.endsWith("jsReporterBinded")) value = `STRING + Math.random()`;
          else if (outerType.endsWith("jsBooleanBinded")) value = `Math.random() > THRESHOLD`;
          field.setValue(value);
        }

        iframe.contentWindow.postMessage({ value }, "*");
      };

      // listen for code updates
      codeEditorHandlers.set(srcBlock.id, (value) => field.setValue(value));

      // monkey patch this function since MutationObservers will lag
      // this patch allows dragging blocks to not act weird with mouse touching
      const parent = srcBlock.parentBlock_;
      const ogSetAtt = parent.svgGroup_.setAttribute
      parent.svgGroup_.setAttribute = (...args) => {
        if (args[0] === "class") {
          if (args[1].includes("blocklyDragging")) iframe.style.pointerEvents = "none";
          else iframe.style.pointerEvents = "all";
        }
        ogSetAtt.call(parent.svgGroup_, ...args);
      }
    },
    () => { /* no work needs to be done here */ },
    () => { /* no work needs to be done here */ }
  );
}
if (isScratchBlocksReady) initBlockTools();

class SPjavascriptV2 {
  constructor(runtime) {
    this.runtime = runtime;
    this.isEditorUnsandboxed = false;

    this.runtime.vm.on("workspaceUpdate", () => {
      codeEditorHandlers.clear();
      if (!isScratchBlocksReady) {
        isScratchBlocksReady = typeof ScratchBlocks === "object";
        if (isScratchBlocksReady) initBlockTools();
      }
    });

    this.globalFuncs = new Map();
  }
  getInfo() {
    return {
      id: "SPjavascriptV2",
      name: "JavaScript V2",
      color1: "#f7df1e",
      blockText: "#323330",
      blocks: [
        {
          opcode: "toggleSandbox",
          text: this.isEditorUnsandboxed ? "Run Sandboxed" : "Run Unsandboxed",
          blockType: BlockType.BUTTON,
        },
        {
          opcode: "codeInput",
          text: "[CODE]",
          blockType: BlockType.REPORTER,
          blockShape: BlockShape.SQUARE,
          hideFromPalette: true,
          arguments: {
            CODE: {
              type: ArgumentType.CUSTOM, id: "SPjavascriptV2-codeEditor",
              defaultValue: "needsInit-1@#4%^7*(0"
            }
          },
        },
        /* shown if ScratchBlocks is not availiable */
        {
          opcode: "jsCommand",
          text: "run [CODE]",
          blockType: BlockType.COMMAND,
          hideFromPalette: isScratchBlocksReady,
          arguments: {
            CODE: { type: ArgumentType.STRING, defaultValue: `alert("Hello!")` }
          }
        },
        {
          opcode: "jsReporter",
          text: "run [CODE]",
          blockType: BlockType.REPORTER,
          disableMonitor: true,
          hideFromPalette: isScratchBlocksReady,
          arguments: {
            CODE: {
              type: ArgumentType.STRING,
              defaultValue: "Math.random()"
            }
          }
        },
        {
          opcode: "jsBoolean",
          text: "run [CODE]",
          blockType: BlockType.BOOLEAN,
          disableMonitor: true,
          hideFromPalette: isScratchBlocksReady,
          arguments: {
            CODE: {
              type: ArgumentType.STRING,
              defaultValue: "Math.round(Math.random()) === 1"
            }
          }
        },
        /* shown if ScratchBlocks is availiable */
        {
          opcode: "jsCommandBinded",
          text: "run [CODE] with data [ARGS]",
          blockType: BlockType.COMMAND,
          hideFromPalette: !isScratchBlocksReady,
          arguments: {
            CODE: { fillIn: "codeInput" },
            ARGS: {
              type: ArgumentType.STRING,
              defaultValue: `{ "FOO": "bar" }`,
              exemptFromNormalization: true
            }
          }
        },
        {
          opcode: "jsReporterBinded",
          text: "run [CODE] with data [ARGS]",
          blockType: BlockType.REPORTER,
          disableMonitor: true,
          hideFromPalette: !isScratchBlocksReady,
          arguments: {
            CODE: { fillIn: "codeInput" },
            ARGS: {
              type: ArgumentType.STRING,
              defaultValue: `{ "STRING": "output: " }`,
              exemptFromNormalization: true
            }
          }
        },
        {
          opcode: "jsBooleanBinded",
          text: "run [CODE] with data [ARGS]",
          blockType: BlockType.BOOLEAN,
          disableMonitor: true,
          hideFromPalette: !isScratchBlocksReady,
          arguments: {
            CODE: { fillIn: "codeInput" },
            ARGS: {
              type: ArgumentType.STRING,
              defaultValue: `{ "THRESHOLD": 0.5 }`,
              exemptFromNormalization: true
            }
          }
        },
        ...(isScratchBlocksReady ? ["---"] : []),
        {
          opcode: "defineGlobalFunc",
          text: "create global function named [NAME] with code [CODE]",
          blockType: BlockType.COMMAND,
          hideFromPalette: !isScratchBlocksReady,
          arguments: {
            ARGS: {
              type: ArgumentType.STRING, defaultValue: "myFunction"
            },
            CODE: { fillIn: "codeInput" }
          }
        },
        {
          opcode: "deleteGlobalFunc",
          text: "delete global function [NAME]",
          blockType: BlockType.COMMAND,
          hideFromPalette: !isScratchBlocksReady,
          arguments: {
            ARGS: {
              type: ArgumentType.STRING, defaultValue: "myFunction"
            }
          }
        },
        {
          opcode: "packagerInfo",
          text: "Sandbox in Packager Notice",
          blockType: BlockType.BUTTON,
          hideFromPalette: !this.isEditorUnsandboxed
        }
      ]
    };
  }

  // helper funcs
  toggleSandbox() {
    if (this.isEditorUnsandboxed) {
      this.isEditorUnsandboxed = false;
      this.runtime.extensionManager.refreshBlocks("SPjavascriptV2");
    } else {
      this.runtime.vm.securityManager.canUnsandbox("JavaScript").then((isAllowed) => {
        if (!isAllowed) return;
        this.isEditorUnsandboxed = true;
        this.runtime.extensionManager.refreshBlocks("SPjavascriptV2");
      });
    }
  }

  packagerInfo() {
    alert([
      "You can run code Unsandboxed in the Project Packager but toggling:",
      "'Player Options > Remove sandbox on the JavaScript Ext.'",
      "On!"
    ].join("\n"));
  }

  parseArguments(argJSON) {
    try {
      if (typeof argJSON === "object" && !Array.isArray(argJSON)) return argJSON;
      else return JSON.parse(argJSON);
    } catch(err) {
      console.warn(`Failed to parse Javascript Data JSON: ${err}`);
      return {};
    }
  }

  isLegalFuncName(name) {
    try {
      new Function(`function ${name}(){}`);
      return true;
    } catch {
      return false;
    }
  }

  runCode(code, binds) {
    let binders = "";

    /* inject global functions */
    if (this.globalFuncs.size > 0) {
      const funcs = this.globalFuncs.entries().toArray();
      for (const [name, code] of funcs) binders += `const ${name} = ${code}\n`;
    }

    /* inject arguments */
    if (binds !== undefined) {
      for (let [name, value] of Object.entries(binds)) {
        // normalize values
        switch (typeof value) {
          case "string":
            value = `"${value}"`;
            break;
          case "object":
            value = JSON.stringify(value);
            break;
          default: break;
        }
        binders += `const ${name} = ${value};\n`;
      }
    }

    /* 'extensionRuntimeOptions.javascriptUnsandboxed' is used for packager */
    if (this.isEditorUnsandboxed || this.runtime.extensionRuntimeOptions.javascriptUnsandboxed === true) {
      let result;
      try {
        // eslint-disable-next-line no-eval
        result = eval(binders + code);
      } catch (err) {
        result = err;
      }
      return result;
    }
    // we are sandboxed
    return new Promise((resolve) => {
      SandboxRunner.execute(binders + code).then(result => {
        // result is { value: any, success: boolean }
        // in PM, we always ignore errors
        return resolve(result.value);
      });
    });
  }

  // block funcs
  codeInput(args) {
    return args.CODE;
  }

  jsCommand(args) {
    this.runCode(Cast.toString(args.CODE));
  }
  jsCommandBinded(args) {
    this.runCode(
      Cast.toString(args.CODE),
      this.parseArguments(args.ARGS)
    );
  }

  jsReporter(args) {
    return this.runCode(Cast.toString(args.CODE));
  }
  jsReporterBinded(args) {
    return this.runCode(
      Cast.toString(args.CODE),
      this.parseArguments(args.ARGS)
    );
  }

  jsBoolean(args) {
    const possiblePromise = this.runCode(Cast.toString(args.CODE));
    /* force output a boolean */
    if (possiblePromise && typeof possiblePromise.then === "function") {
      return (async () => {
        const value = await possiblePromise;
        return Cast.toBoolean(value);
      })();
    }
    return Cast.toBoolean(possiblePromise);
  }
  jsBooleanBinded(args) {
    const possiblePromise = this.runCode(
      Cast.toString(args.CODE),
      this.parseArguments(args.ARGS)
    );
    /* force output a boolean */
    if (possiblePromise && typeof possiblePromise.then === "function") {
      return (async () => {
        const value = await possiblePromise;
        return Cast.toBoolean(value);
      })();
    }
    return Cast.toBoolean(possiblePromise);
  }

  defineGlobalFunc(args) {
    const funcName = Cast.toString(args.NAME);
    if (this.isLegalFuncName(funcName)) {
      const funcRegex = /^function\s*\([^)]*\)\s*\{[\s\S]*\}$/;
      const lambRegex = /^\([^)]*\)\s*=>\s*(\{[\s\S]*\}|[^{}][^\n]*)$/;
      const code = Cast.toString(args.CODE).trim();
      if (funcRegex.test(code) || lambRegex.test(code)) this.globalFuncs.set(funcName, code);
      else throw new Error("Global Code must be 'function' or 'lambda'!");
    } else {
      throw new Error("Illegal Function Name!");
    }
  }

  deleteGlobalFunc(args) {
    this.globalFuncs.delete(Cast.toString(args.NAME));
  }
}

module.exports = SPjavascriptV2;
