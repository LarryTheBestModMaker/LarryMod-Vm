const BlockType = require("../../extension-support/block-type");
const ArgumentType = require("../../extension-support/argument-type");
const SandboxRunner = require("../../util/sandboxed-javascript-runner");
const Cast = require("../../util/cast");

let isScratchBlocksReady = typeof ScratchBlocks === "object";
const codeEditorHandlers = new Map();

function initBlockTools() {
  // Global message listener (outside of block registration)
  window.addEventListener("message", (e) => {
    if (e.data?.type === "code-change") {
      const handler = codeEditorHandlers.get(e.data.id);
      if (handler) handler(e.data.value);
    }
  });

  const recyclableDiv = document.createElement("div");
  recyclableDiv.setAttribute("style", `display: flex; justify-content: center; margin-top: 5px; width: 300px; height: 200px;`);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("style", "border-radius: 10px; border: none; width: 100%; height: calc(100% - 10px);");
  iframe.setAttribute("sandbox", "allow-scripts");
  iframe.setAttribute("src", `data:text/html;,${encodeURIComponent(
`<!DOCTYPE html>
<html><head>
  <style>html, body, #editor { margin: 0; padding: 0; height: 100%; width: 100%; }</style>
</head>
<body>
  <div id="editor"></div>
  <script src="https://cdn.jsdelivr.net/npm/ace-builds@1.32.3/src-min-noconflict/ace.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/ace-builds@1.32.3/src-min-noconflict/mode-javascript.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/ace-builds@1.32.3/src-min-noconflict/theme-monokai.js"></script>
  <script>
    window.addEventListener("message", function(e) {
      const id = e.data.id;
      const editor = ace.edit("editor");
      editor.setOptions({
        fontSize: "12px",
        showPrintMargin: false,
        highlightActiveLine: true,
        useWorker: false
      });

      editor.session.setMode("ace/mode/javascript");
      editor.setTheme("ace/theme/monokai");
      editor.setValue(e.data.value || "", -1);

      editor.session.on("change", () => parent.postMessage({
        type: "code-change", id, value: editor.getValue()
      }, "*"));
    }, { once: true });
  </script>
</body>
</html>`
      )}`);
      recyclableDiv.appendChild(iframe);

  ScratchBlocks.FieldCustom.registerInput(
    "SPjavascriptV2-codeEditor",
    recyclableDiv,
    (field, input) => {
      const srcBlock = field.sourceBlock_;
      const outerID = srcBlock.id;
      let offset;
      switch (srcBlock.outputShape_) {
        case 1:
          break;
        case 2:
          break;
        case 3:
          break;
      }

      const iframe = input.firstChild;
      iframe.onload = () => iframe.contentWindow.postMessage({
        id: outerID, value: field.getValue()
      }, "*");

      // Listen for code updates
      codeEditorHandlers.set(outerID, (value) => field.setValue(value));
    },
    () => {},
    () => {}
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
        /* shown if ScratchBlocks is not availiable */
        {
          opcode: "jsCommand",
          text: "run [CODE]",
          blockText: "#323330", // only reason this is here is to test individual text colors 
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
            CODE: {
              type: ArgumentType.CUSTOM, id: "SPjavascriptV2-codeEditor",
              defaultValue: `alert(FOO);`
            },
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
            CODE: {
              type: ArgumentType.CUSTOM, id: "SPjavascriptV2-codeEditor",
              defaultValue: `STRING + Math.random()`
            },
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
            CODE: {
              type: ArgumentType.CUSTOM, id: "SPjavascriptV2-codeEditor",
              defaultValue: `Math.random() > THRESHOLD`
            },
            ARGS: {
              type: ArgumentType.STRING,
              defaultValue: `{ "THRESHOLD": 0.5 }`,
              exemptFromNormalization: true
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

  runCode(code, binds) {
    let binders = "";
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
}

module.exports = SPjavascriptV2;
