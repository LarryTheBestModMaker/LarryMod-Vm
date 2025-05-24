const switches = {};

// use extension ID
const extensions = {
    jgFiles: require("../extensions/jg_files/switches.json"),
}

const noopSwitch = {
    isNoop: true
}

function opcodeToLabel(opcode) {
    return String(opcode).match(/([A-Z]?[^A-Z]*)/g).slice(0, -1).join(" ").toLowerCase();
}

Object.getOwnPropertyNames(extensions).forEach(extID => {
    const extension = extensions[extID];
    Object.getOwnPropertyNames(extension).forEach(b => {
        const block = extension[b];
        for (let i = 0; i < block.length; i++) {
            const item = block[i];
            if (item === "hide") {
                continue;
            }
            if (
                item === "same"
                || item === "noop"
                || item === "normal"
                || item === ""
                || item === null
            ) {
                block[i] = noopSwitch;
                continue;
            }
            if (typeof item === "string") {
                block[i] = {
                    opcode: `${extID}_${item}`,
                    msg: `${opcodeToLabel(item)}`
                }
                continue;
            }
            if (!block[i].msg) {
                block[i].msg = opcodeToLabel(block[i].opcode);
            }
            if (block[i].opcode) {
                if (String(block[i].opcode).startsWith(extID + "_")) continue;
                block[i].opcode = `${extID}_${block[i].opcode}`;
            }
        }
        extension[b] = block.filter(v => v !== "hide")
    })
    switches[extID] = extension;
})

function getSwitches({runtime}) {
    var _switches = switches;
    for (let ext of runtime._blockInfo) {
        _switches[ext.id] = {};
        for (let block of ext.blocks) {
            var blockswitches = block.info.switches;
            if (!blockswitches) continue;
            let opcode = block.json.type;
            _switches[ext.id][opcode] = blockswitches.map(current => {
                if (typeof current === "string") {
                    current = {opcode: current}
                } else if (typeof current !== "object") {
                    return noopSwitch;
                }

                if (!("opcode" in current)) {
                    return noopSwitch;
                }

                if (current.isNoop) {
                    return noopSwitch;
                }

                let get_block = ext.blocks.filter(e => e.info.opcode === current.opcode);
                if (get_block.length === 0) { // block doesn't exist.
                    return noopSwitch;
                }
                get_block = get_block[0];

                return {
                    opcode: current.opcode,
                    remapInputName: current.remapArguments ?? {},
                    msg: get_block.info.switch_text
                };
            });
        }
    }
    return _switches;
}

module.exports = getSwitches;
