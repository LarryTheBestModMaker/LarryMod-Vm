const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Clone = require('../../util/clone');
const Cast = require('../../util/cast');
const formatMessage = require('format-message');
const MathUtil = require('../../util/math-util');
const Timer = require('../../util/timer');

/**
 * The instrument and drum sounds, loaded as static assets.
 * @type {object}
 */
let assetData = {};
try {
    assetData = require('./manifest');
} catch (e) {
    // Non-webpack environment, don't worry about assets.
}

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PHRpdGxlPm11c2ljLWJsb2NrLWljb248L3RpdGxlPjxkZWZzPjxwYXRoIGQ9Ik0zMi4xOCAyNS44NzRDMzIuNjM2IDI4LjE1NyAzMC41MTIgMzAgMjcuNDMzIDMwYy0zLjA3IDAtNS45MjMtMS44NDMtNi4zNzItNC4xMjYtLjQ1OC0yLjI4NSAxLjY2NS00LjEzNiA0Ljc0My00LjEzNi42NDcgMCAxLjI4My4wODQgMS44OS4yMzQuMzM4LjA4Ni42MzcuMTguOTM4LjMwMi44Ny0uMDItLjEwNC0yLjI5NC0xLjgzNS0xMi4yMy0yLjEzNC0xMi4zMDIgMy4wNi0xLjg3IDguNzY4LTIuNzUyIDUuNzA4LS44ODUuMDc2IDQuODItMy42NSAzLjg0NC0zLjcyNC0uOTg3LTQuNjUtNy4xNTMuMjYzIDE0LjczOHptLTE2Ljk5OCA1Ljk5QzE1LjYzIDM0LjE0OCAxMy41MDcgMzYgMTAuNDQgMzZjLTMuMDcgMC01LjkyMi0xLjg1Mi02LjM4LTQuMTM2LS40NDgtMi4yODQgMS42NzQtNC4xMzUgNC43NS00LjEzNSAxLjAwMyAwIDEuOTc1LjE5NiAyLjg1NS41NDMuODIyLS4wNTUtLjE1LTIuMzc3LTEuODYyLTEyLjIyOC0yLjEzMy0xMi4zMDMgMy4wNi0xLjg3IDguNzY0LTIuNzUzIDUuNzA2LS44OTQuMDc2IDQuODItMy42NDggMy44MzQtMy43MjQtLjk4Ny00LjY1LTcuMTUyLjI2MiAxNC43Mzh6IiBpZD0iYSIvPjwvZGVmcz48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjx1c2UgZmlsbD0iI0ZGRiIgeGxpbms6aHJlZj0iI2EiLz48cGF0aCBzdHJva2Utb3BhY2l0eT0iLjEiIHN0cm9rZT0iIzAwMCIgZD0iTTI4LjQ1NiAyMS42NzVjLS4wMS0uMzEyLS4wODctLjgyNS0uMjU2LTEuNzAyLS4wOTYtLjQ5NS0uNjEyLTMuMDIyLS43NTMtMy43My0uMzk1LTEuOTgtLjc2LTMuOTItMS4xNDItNi4xMTMtLjczMi00LjIyMy0uNjkzLTYuMDUuMzQ0LTYuNTI3LjUtLjIzIDEuMDYtLjA4IDEuODQuMzUuNDE0LjIyNyAyLjE4MiAxLjM2NSAyLjA3IDEuMjk2IDEuOTk0IDEuMjQyIDMuNDY0IDEuNzc0IDQuOTMgMS41NDggMS41MjYtLjIzNyAyLjUwNC0uMDYgMi44NzYuNjE4LjM0OC42MzUuMDE1IDEuNDE2LS43MyAyLjE4LTEuNDcyIDEuNTE2LTMuOTc1IDIuNTE0LTUuODQ4IDIuMDIzLS44MjItLjIyLTEuMjM4LS40NjUtMi4zOC0xLjI2N2wtLjA5NS0uMDY2Yy4wNDcuNTkzLjI2NCAxLjc0LjcxNyAzLjgwMy4yOTQgMS4zMzYgMi4wOCA5LjE4NyAyLjYzNyAxMS42NzRsLjAwMi4wMTJjLjUyOCAyLjYzNy0xLjg3MyA0LjcyNC01LjIzNiA0LjcyNC0zLjI5IDAtNi4zNjMtMS45ODgtNi44NjItNC41MjgtLjUzLTIuNjQgMS44NzMtNC43MzQgNS4yMzMtNC43MzQuNjcyIDAgMS4zNDcuMDg1IDIuMDE0LjI1LjIyNy4wNTcuNDM2LjExOC42MzYuMTg3em0tMTYuOTk2IDUuOTljLS4wMS0uMzE4LS4wOS0uODM4LS4yNjYtMS43MzctLjA5LS40Ni0uNTk1LTIuOTM3LS43NTMtMy43MjctLjM5LTEuOTYtLjc1LTMuODktMS4xMy02LjA3LS43MzItNC4yMjMtLjY5Mi02LjA1LjM0NC02LjUyNi41MDItLjIzIDEuMDYtLjA4MiAxLjg0LjM1LjQxNS4yMjcgMi4xODIgMS4zNjQgMi4wNyAxLjI5NSAxLjk5MyAxLjI0MiAzLjQ2MiAxLjc3NCA0LjkyNiAxLjU0OCAxLjUyNS0uMjQgMi41MDQtLjA2NCAyLjg3Ni42MTQuMzQ4LjYzNS4wMTUgMS40MTUtLjcyOCAyLjE4LTEuNDc0IDEuNTE3LTMuOTc3IDIuNTEzLTUuODQ3IDIuMDE3LS44Mi0uMjItMS4yMzYtLjQ2NC0yLjM3OC0xLjI2N2wtLjA5NS0uMDY1Yy4wNDcuNTkzLjI2NCAxLjc0LjcxNyAzLjgwMi4yOTQgMS4zMzcgMi4wNzggOS4xOSAyLjYzNiAxMS42NzVsLjAwMy4wMTNjLjUxNyAyLjYzOC0xLjg4NCA0LjczMi01LjIzNCA0LjczMi0zLjI4NyAwLTYuMzYtMS45OTMtNi44Ny00LjU0LS41Mi0yLjY0IDEuODg0LTQuNzMgNS4yNC00LjczLjkwNSAwIDEuODAzLjE1IDIuNjUuNDM2eiIvPjwvZz48L3N2Zz4=';

/**
 * Icon svg to be displayed in the category menu, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const menuIconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTE2LjA5IDEyLjkzN2MuMjI4IDEuMTQxLS44MzMgMi4wNjMtMi4zNzMgMi4wNjMtMS41MzUgMC0yLjk2Mi0uOTIyLTMuMTg2LTIuMDYzLS4yMy0xLjE0Mi44MzMtMi4wNjggMi4zNzItMi4wNjguMzIzIDAgLjY0MS4wNDIuOTQ1LjExN2EzLjUgMy41IDAgMCAxIC40NjguMTUxYy40MzUtLjAxLS4wNTItMS4xNDctLjkxNy02LjExNC0xLjA2Ny02LjE1MiAxLjUzLS45MzUgNC4zODQtMS4zNzcgMi44NTQtLjQ0Mi4wMzggMi40MS0xLjgyNSAxLjkyMi0xLjg2Mi0uNDkzLTIuMzI1LTMuNTc3LjEzMiA3LjM3ek03LjQ2IDguNTYzYy0xLjg2Mi0uNDkzLTIuMzI1LTMuNTc2LjEzIDcuMzdDNy44MTYgMTcuMDczIDYuNzU0IDE4IDUuMjIgMThjLTEuNTM1IDAtMi45NjEtLjkyNi0zLjE5LTIuMDY4LS4yMjQtMS4xNDIuODM3LTIuMDY3IDIuMzc1LTIuMDY3LjUwMSAwIC45ODcuMDk4IDEuNDI3LjI3Mi40MTItLjAyOC0uMDc0LTEuMTg5LS45My02LjExNEMzLjgzNCAxLjg3IDYuNDMgNy4wODcgOS4yODIgNi42NDZjMi44NTQtLjQ0Ny4wMzggMi40MS0xLjgyMyAxLjkxN3oiIGZpbGw9IiM1NzVFNzUiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==';

/**
 * Class for the music-related blocks in Scratch 3.0
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3MusicBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * The number of drum and instrument sounds currently being played simultaneously.
         * @type {number}
         * @private
         */
        this._concurrencyCounter = 0;

        /**
         * An array of sound players, one for each drum sound.
         * @type {Array}
         * @private
         */
        this._drumPlayers = [];

        /**
         * An array of arrays of sound players. Each instrument has one or more audio players.
         * @type {Array[]}
         * @private
         */
        this._instrumentPlayerArrays = [];

        /**
         * An array of arrays of sound players. Each instrument mya have an audio player for each playable note.
         * @type {Array[]}
         * @private
         */
        this._instrumentPlayerNoteArrays = [];

        /**
         * An array of audio bufferSourceNodes. Each time you play an instrument or drum sound,
         * a bufferSourceNode is created. We keep references to them to make sure their onended
         * events can fire.
         * @type {Array}
         * @private
         */
        this._bufferSources = [];

        this._loadAllSounds();

        this._onTargetCreated = this._onTargetCreated.bind(this);
        this.runtime.on('targetWasCreated', this._onTargetCreated);

        this._playNoteForPicker = this._playNoteForPicker.bind(this);
        this.runtime.on('PLAY_NOTE', this._playNoteForPicker);

        this._allCurrentlyRunningSounds = [];
        this._allCUtils = {};
    }

    /**
     * Decode the full set of drum and instrument sounds, and store the audio buffers in arrays.
     */
    _loadAllSounds () {
        const loadingPromises = [];
        this.DRUM_INFO.forEach((drumInfo, index) => {
            const filePath = `drums/${drumInfo.fileName}`;
            const promise = this._storeSound(filePath, index, this._drumPlayers);
            loadingPromises.push(promise);
        });
        this.INSTRUMENT_INFO.forEach((instrumentInfo, instrumentIndex) => {
            this._instrumentPlayerArrays[instrumentIndex] = [];
            this._instrumentPlayerNoteArrays[instrumentIndex] = [];
            instrumentInfo.samples.forEach((sample, noteIndex) => {
                const filePath = `instruments/${instrumentInfo.dirName}/${sample}`;
                const promise = this._storeSound(filePath, noteIndex, this._instrumentPlayerArrays[instrumentIndex]);
                loadingPromises.push(promise);
            });
        });
        Promise.all(loadingPromises).then(() => {
            // @TODO: Update the extension status indicator.
        });
    }

    /**
     * Decode a sound and store the player in an array.
     * @param {string} filePath - the audio file name.
     * @param {number} index - the index at which to store the audio player.
     * @param {array} playerArray - the array of players in which to store it.
     * @return {Promise} - a promise which will resolve once the sound has been stored.
     */
    _storeSound (filePath, index, playerArray) {
        const fullPath = `${filePath}.mp3`;

        if (!assetData[fullPath]) return;

        const soundFile = assetData[fullPath];

        return fetch(soundFile)
            .then(r => r.arrayBuffer())
            .then(soundBuffer => this._decodeSound(soundBuffer))
            .then(player => {
                playerArray[index] = player;
            });
    }

    /**
     * Decode a sound and return a promise with the audio buffer.
     * @param  {ArrayBuffer} soundBuffer - a buffer containing the encoded audio.
     * @return {Promise} - a promise which will resolve once the sound has decoded.
     */
    _decodeSound (soundBuffer) {
        const engine = this.runtime.audioEngine;

        if (!engine) {
            return Promise.reject(new Error('No Audio Context Detected'));
        }

        // Check for newer promise-based API
        return engine.decodeSoundPlayer({data: {buffer: soundBuffer}});
    }

    /**
     * Create data for a menu in scratch-blocks format, consisting of an array of objects with text and
     * value properties. The text is a translated string, and the value is one-indexed.
     * @param  {object[]} info - An array of info objects each having a name property.
     * @return {array} - An array of objects with text and value properties.
     * @private
     */
    _buildMenu (info) {
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry.name;
            obj.value = String(index + 1);
            return obj;
        });
    }

    /**
     * An array of info about each drum.
     * @type {object[]}
     * @param {string} name - the translatable name to display in the drums menu.
     * @param {string} fileName - the name of the audio file containing the drum sound.
     */
    get DRUM_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'music.drumSnare',
                    default: '(1) Snare Drum',
                    description: 'Sound of snare drum as used in a standard drum kit'
                }),
                fileName: '1-snare'
            },
            {
                name: formatMessage({
                    id: 'music.drumBass',
                    default: '(2) Bass Drum',
                    description: 'Sound of bass drum as used in a standard drum kit'
                }),
                fileName: '2-bass-drum'
            },
            {
                name: formatMessage({
                    id: 'music.drumSideStick',
                    default: '(3) Side Stick',
                    description: 'Sound of a drum stick hitting the side of a drum (usually the snare)'
                }),
                fileName: '3-side-stick'
            },
            {
                name: formatMessage({
                    id: 'music.drumCrashCymbal',
                    default: '(4) Crash Cymbal',
                    description: 'Sound of a drum stick hitting a crash cymbal'
                }),
                fileName: '4-crash-cymbal'
            },
            {
                name: formatMessage({
                    id: 'music.drumOpenHiHat',
                    default: '(5) Open Hi-Hat',
                    description: 'Sound of a drum stick hitting a hi-hat while open'
                }),
                fileName: '5-open-hi-hat'
            },
            {
                name: formatMessage({
                    id: 'music.drumClosedHiHat',
                    default: '(6) Closed Hi-Hat',
                    description: 'Sound of a drum stick hitting a hi-hat while closed'
                }),
                fileName: '6-closed-hi-hat'
            },
            {
                name: formatMessage({
                    id: 'music.drumTambourine',
                    default: '(7) Tambourine',
                    description: 'Sound of a tambourine being struck'
                }),
                fileName: '7-tambourine'
            },
            {
                name: formatMessage({
                    id: 'music.drumHandClap',
                    default: '(8) Hand Clap',
                    description: 'Sound of two hands clapping together'
                }),
                fileName: '8-hand-clap'
            },
            {
                name: formatMessage({
                    id: 'music.drumClaves',
                    default: '(9) Claves',
                    description: 'Sound of claves being struck together'
                }),
                fileName: '9-claves'
            },
            {
                name: formatMessage({
                    id: 'music.drumWoodBlock',
                    default: '(10) Wood Block',
                    description: 'Sound of a wood block being struck'
                }),
                fileName: '10-wood-block'
            },
            {
                name: formatMessage({
                    id: 'music.drumCowbell',
                    default: '(11) Cowbell',
                    description: 'Sound of a cowbell being struck'
                }),
                fileName: '11-cowbell'
            },
            {
                name: formatMessage({
                    id: 'music.drumTriangle',
                    default: '(12) Triangle',
                    description: 'Sound of a triangle (instrument) being struck'
                }),
                fileName: '12-triangle'
            },
            {
                name: formatMessage({
                    id: 'music.drumBongo',
                    default: '(13) Bongo',
                    description: 'Sound of a bongo being struck'
                }),
                fileName: '13-bongo'
            },
            {
                name: formatMessage({
                    id: 'music.drumConga',
                    default: '(14) Conga',
                    description: 'Sound of a conga being struck'
                }),
                fileName: '14-conga'
            },
            {
                name: formatMessage({
                    id: 'music.drumCabasa',
                    default: '(15) Cabasa',
                    description: 'Sound of a cabasa being shaken'
                }),
                fileName: '15-cabasa'
            },
            {
                name: formatMessage({
                    id: 'music.drumGuiro',
                    default: '(16) Guiro',
                    description: 'Sound of a guiro being played'
                }),
                fileName: '16-guiro'
            },
            {
                name: formatMessage({
                    id: 'music.drumVibraslap',
                    default: '(17) Vibraslap',
                    description: 'Sound of a Vibraslap being played'
                }),
                fileName: '17-vibraslap'
            },
            {
                name: formatMessage({
                    id: 'music.drumCuica',
                    default: '(18) Cuica',
                    description: 'Sound of a cuica being played'
                }),
                fileName: '18-cuica'
            },
            {
                name: formatMessage({
                    id: 'music.drumSleighBells',
                    default: '(19) Sleigh Bell (D.M.)',
                    description: 'Sound of a sleigh bell being played'
                }),
                fileName: '19-sleigh-bells'
            },
        ];
    }

    /**
     * An array of info about each instrument.
     * @type {object[]}
     * @param {string} name - the translatable name to display in the instruments menu.
     * @param {string} dirName - the name of the directory containing audio samples for this instrument.
     * @param {number} [releaseTime] - an optional duration for the release portion of each note.
     * @param {number[]} samples - an array of numbers representing the MIDI note number for each
     *                           sampled sound used to play this instrument.
     */
    get INSTRUMENT_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'music.instrumentAcousticGrandPiano',
                    default: '(1) Acoustic Grand Piano',
                    description: 'Sound of an acoustic grand piano'
                }),
                dirName: '1-acoustic-grand-piano',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentBrightAcousticPiano',
                    default: '(2) Bright Acoustic Piano',
                    description: 'Sound of a bright acoustic piano'
                }),
                dirName: '2-bright-acoustic-piano',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentElectricGrandPiano',
                    default: '(3) Electric Grand Piano',
                    description: 'Sound of an electric grand piano'
                }),
                dirName: '3-electric-grand-piano',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentHonkyTonkPiano',
                    default: '(4) Honky-tonk Piano',
                    description: 'Sound of a honky-tonk piano'
                }),
                dirName: '4-honky-tonk-piano',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentElectricPianoOne',
                    default: '(5) Electric Piano 1',
                    description: 'Sound of an electric piano (1)'
                }),
                dirName: '5-electric-piano-one',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentElectricPianoTwo',
                    default: '(6) Electric Piano 2',
                    description: 'Sound of an electric piano (2)'
                }),
                dirName: '6-electric-piano-two',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentHarpsichord',
                    default: '(7) Harpsichord',
                    description: 'Sound of a harpsichord'
                }),
                dirName: '7-harpsichord',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentClavinet',
                    default: '(8) Clavinet',
                    description: 'Sound of a clavinet'
                }),
                dirName: '8-clavinet',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentCelesta',
                    default: '(9) Celesta',
                    description: 'Sound of a celesta'
                }),
                dirName: '9-celesta',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentGlockenspiel',
                    default: '(10) Glockenspiel',
                    description: 'Sound of a glockenspiel'
                }),
                dirName: '10-glockenspiel',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentMusicBox',
                    default: '(11) Music Box',
                    description: 'Sound of a music box'
                }),
                dirName: '11-music-box',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentVibraphone',
                    default: '(12) Vibraphone',
                    description: 'Sound of a vibraphone'
                }),
                dirName: '12-vibraphone',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentMarimba',
                    default: '(13) Marimba',
                    description: 'Sound of a marimba'
                }),
                dirName: '13-marimba',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentXylophone',
                    default: '(14) Xylophone',
                    description: 'Sound of a xylophone'
                }),
                dirName: '14-xylophone',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentTubularBells',
                    default: '(15) Tubular Bells',
                    description: 'Sound of a tubular bell'
                }),
                dirName: '15-tubular-bells',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentDulcimer',
                    default: '(16) Dulcimer',
                    description: 'Sound of a dulcimer'
                }),
                dirName: '16-dulcimer',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentDrawbarOrgan',
                    default: '(17) Drawbar Organ',
                    description: 'Sound of a drawbar organ'
                }),
                dirName: '17-drawbar-organ',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentPercussiveOrgan',
                    default: '(18) Percussive Organ',
                    description: 'Sound of a percussive organ'
                }),
                dirName: '18-percussive-organ',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentRockOrgan',
                    default: '(19) Rock Organ',
                    description: 'Sound of a rock organ'
                }),
                dirName: '19-rock-organ',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentChurchOrgan',
                    default: '(20) Church Organ',
                    description: 'Sound of a church organ'
                }),
                dirName: '20-church-organ',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentReedOrgan',
                    default: '(21) Reed Organ',
                    description: 'Sound of a reed organ'
                }),
                dirName: '21-reed-organ',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentAccordion',
                    default: '(22) Accordion',
                    description: 'Sound of a accordion'
                }),
                dirName: '22-accordion',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentHarmonica',
                    default: '(23) Harmonica',
                    description: 'Sound of a harmonica'
                }),
                dirName: '23-harmonica',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentTangoAccordion',
                    default: '(24) Tango Accordion',
                    description: 'Sound of a tango accordion'
                }),
                dirName: '24-tango-accordion',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentAcousticGuitarNylon',
                    default: '(25) Acoustic Guitar (nylon)',
                    description: 'Sound of an acoustic guitar (nylon)'
                }),
                dirName: '25-acoustic-guitar-nylon',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentAcousticGuitarSteel',
                    default: '(26) Acoustic Guitar (steel)',
                    description: 'Sound of an acoustic guitar (steel)'
                }),
                dirName: '26-acoustic-guitar-steel',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentElectricGuitarJazz',
                    default: '(27) Electric Guitar (jazz)',
                    description: 'Sound of an electric guitar (jazz)'
                }),
                dirName: '27-electric-guitar-jazz',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentElectricGuitarClean',
                    default: '(28) Electric Guitar (clean)',
                    description: 'Sound of an electric guitar (clean)'
                }),
                dirName: '28-electric-guitar-clean',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentElectricGuitarMuted',
                    default: '(29) Electric Guitar (muted)',
                    description: 'Sound of an electric guitar (muted)'
                }),
                dirName: '29-electric-guitar-muted',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentOverdrivenGuitar',
                    default: '(30) Overdriven Guitar',
                    description: 'Sound of an overdriven guitar'
                }),
                dirName: '30-overdriven-guitar',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentDistortionGuitar',
                    default: '(31) Distortion Guitar',
                    description: 'Sound of a distortion guitar'
                }),
                dirName: '31-distortion-guitar',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentGuitarHarmonics',
                    default: '(32) Guitar Harmonics',
                    description: 'Sound of guitar harmonics'
                }),
                dirName: '32-guitar-harmonics',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentAcousticBass',
                    default: '(33) Acoustic Bass',
                    description: 'Sound of an acoustic bass'
                }),
                dirName: '33-acoustic-bass',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentElectricBassFinger',
                    default: '(34) Electric Bass (finger)',
                    description: 'Sound of an electric bass (finger)'
                }),
                dirName: '34-electric-bass-finger',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentElectricBassPick',
                    default: '(35) Electric Bass (pick)',
                    description: 'Sound of an electric bass (pick)'
                }),
                dirName: '35-electric-bass-pick',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentFretlessBass',
                    default: '(36) Fretless Bass',
                    description: 'Sound of a fretless bass'
                }),
                dirName: '36-fretless-bass',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentSlapBassOne',
                    default: '(37) Slap Bass 1',
                    description: 'Sound of a slap bass (1)'
                }),
                dirName: '37-slap-bass-one',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentSlapBassTwo',
                    default: '(38) Slap Bass 2',
                    description: 'Sound of a slap bass (2)'
                }),
                dirName: '38-slap-bass-two',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentSynthBassOne',
                    default: '(39) Synth Bass 1',
                    description: 'Sound of a synth bass (1)'
                }),
                dirName: '39-synth-bass-one',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentSynthBassTwo',
                    default: '(40) Synth Bass 2',
                    description: 'Sound of a synth bass (2)'
                }),
                dirName: '40-synth-bass-two',
                releaseTime: 2.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
    name: formatMessage({
        id: 'music.instrumentViolin',
        default: '(41) Violin',
        description: 'Sound of Violin'
    }),
    dirName: '41-violin',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentViola',
        default: '(42) Viola',
        description: 'Sound of Viola'
    }),
    dirName: '42-viola',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentCello',
        default: '(43) Cello',
        description: 'Sound of Cello'
    }),
    dirName: '43-cello',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentContrabass',
        default: '(44) Contrabass',
        description: 'Sound of Contrabass'
    }),
    dirName: '44-contrabass',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentTremoloStrings',
        default: '(45) Tremolo Strings',
        description: 'Sound of Tremolo Strings'
    }),
    dirName: '45-tremolo-strings',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentPizzicatoStrings',
        default: '(46) Pizzicato Strings',
        description: 'Sound of Pizzicato Strings'
    }),
    dirName: '46-pizzicato-strings',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentOrchestralHarp',
        default: '(47) Orchestral Harp',
        description: 'Sound of Orchestral Harp'
    }),
    dirName: '47-orchestral-harp',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentTimpani',
        default: '(48) Timpani',
        description: 'Sound of Timpani'
    }),
    dirName: '48-timpani',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentStringEnsembleOne',
        default: '(49) String Ensemble 1',
        description: 'Sound of String Ensemble 1'
    }),
    dirName: '49-string-ensemble-one',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentStringEnsembleTwo',
        default: '(50) String Ensemble 2',
        description: 'Sound of String Ensemble 2'
    }),
    dirName: '50-string-ensemble-two',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentSynthStringsOne',
        default: '(51) Synth Strings 1',
        description: 'Sound of Synth Strings 1'
    }),
    dirName: '51-synth-strings-one',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentSynthStringsTwo',
        default: '(52) Synth Strings 2',
        description: 'Sound of Synth Strings 2'
    }),
    dirName: '52-synth-strings-two',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentChoirAahs',
        default: '(53) Choir Aahs',
        description: 'Sound of Choir Aahs'
    }),
    dirName: '53-choir-aahs',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentVoiceOohs',
        default: '(54) Voice Oohs',
        description: 'Sound of Voice Oohs'
    }),
    dirName: '54-voice-oohs',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentSynthChoir',
        default: '(55) Synth Choir',
        description: 'Sound of Synth Choir'
    }),
    dirName: '55-synth-choir',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentOrchestraHit',
        default: '(56) Orchestra Hit',
        description: 'Sound of Orchestra Hit'
    }),
    dirName: '56-orchestra-hit',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentTrumpet',
        default: '(57) Trumpet',
        description: 'Sound of Trumpet'
    }),
    dirName: '57-trumpet',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentTrombone',
        default: '(58) Trombone',
        description: 'Sound of Trombone'
    }),
    dirName: '58-trombone',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentTuba',
        default: '(59) Tuba',
        description: 'Sound of Tuba'
    }),
    dirName: '59-tuba',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentMutedTrumpet',
        default: '(60) Muted Trumpet',
        description: 'Sound of Muted Trumpet'
    }),
    dirName: '60-muted-trumpet',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentFrenchHorn',
        default: '(61) French Horn',
        description: 'Sound of French Horn'
    }),
    dirName: '61-french-horn',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentBrassSection',
        default: '(62) Brass Section',
        description: 'Sound of Brass Section'
    }),
    dirName: '62-brass-section',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentSynthBrassOne',
        default: '(63) Synth Brass 1',
        description: 'Sound of Synth Brass 1'
    }),
    dirName: '63-synth-brass-one',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentSynthBrassTwo',
        default: '(64) Synth Brass 2',
        description: 'Sound of Synth Brass 2'
    }),
    dirName: '64-synth-brass-two',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentSopranoSax',
        default: '(65) Soprano Sax',
        description: 'Sound of Soprano Sax'
    }),
    dirName: '65-soprano-sax',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentAltoSax',
        default: '(66) Alto Sax',
        description: 'Sound of Alto Sax'
    }),
    dirName: '66-alto-sax',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentTenorSax',
        default: '(67) Tenor Sax',
        description: 'Sound of Tenor Sax'
    }),
    dirName: '67-tenor-sax',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentBaritoneSax',
        default: '(68) Baritone Sax',
        description: 'Sound of Baritone Sax'
    }),
    dirName: '68-baritone-sax',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentOboe',
        default: '(69) Oboe',
        description: 'Sound of Oboe'
    }),
    dirName: '69-oboe',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentEnglishHorn',
        default: '(70) English Horn',
        description: 'Sound of English Horn'
    }),
    dirName: '70-english-horn',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentBassoon',
        default: '(71) Bassoon',
        description: 'Sound of Bassoon'
    }),
    dirName: '71-bassoon',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentClarinet',
        default: '(72) Clarinet',
        description: 'Sound of Clarinet'
    }),
    dirName: '72-clarinet',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentPiccolo',
        default: '(73) Piccolo',
        description: 'Sound of Piccolo'
    }),
    dirName: '73-piccolo',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentFlute',
        default: '(74) Flute',
        description: 'Sound of Flute'
    }),
    dirName: '74-flute',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentRecorder',
        default: '(75) Recorder',
        description: 'Sound of Recorder'
    }),
    dirName: '75-recorder',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentPanFlute',
        default: '(76) Pan Flute',
        description: 'Sound of Pan Flute'
    }),
    dirName: '76-pan-flute',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentBlownBottle',
        default: '(77) Blown Bottle',
        description: 'Sound of Blown Bottle'
    }),
    dirName: '77-blown-bottle',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentShakyhachi',
        default: '(78) Shakyhachi',
        description: 'Sound of Shakyhachi'
    }),
    dirName: '78-shakyhachi',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentWhistle',
        default: '(79) Whistle',
        description: 'Sound of Whistle'
    }),
    dirName: '79-whistle',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentOcarina',
        default: '(80) Ocarina',
        description: 'Sound of Ocarina'
    }),
    dirName: '80-ocarina',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentLeadOneSquare',
        default: '(81) Lead 1 (square)',
        description: 'Sound of Lead 1 (square)'
    }),
    dirName: '81-lead-one-square',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentLeadTwoSawtooth',
        default: '(82) Lead 2 (sawtooth)',
        description: 'Sound of Lead 2 (sawtooth)'
    }),
    dirName: '82-lead-two-sawtooth',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentLeadThreeCalliope',
        default: '(83) Lead 3 (calliope)',
        description: 'Sound of Lead 3 (calliope)'
    }),
    dirName: '83-lead-three-calliope',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentLeadFourChiff',
        default: '(84) Lead 4 (chiff)',
        description: 'Sound of Lead 4 (chiff)'
    }),
    dirName: '84-lead-four-chiff',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentLeadFiveCharang',
        default: '(85) Lead 5 (charang)',
        description: 'Sound of Lead 5 (charang)'
    }),
    dirName: '85-lead-five-charang',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentLeadSixVoice',
        default: '(86) Lead 6 (voice)',
        description: 'Sound of Lead 6 (voice)'
    }),
    dirName: '86-lead-six-voice',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentLeadSevenFifths',
        default: '(87) Lead 7 (fifths)',
        description: 'Sound of Lead 7 (fifths)'
    }),
    dirName: '87-lead-seven-fifths',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentLeadEightBassLead',
        default: '(88) Lead 8 (bass + lead)',
        description: 'Sound of Lead 8 (bass + lead)'
    }),
    dirName: '88-lead-eight-bass-lead',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentPadOneNewAge',
        default: '(89) Pad 1 (new age)',
        description: 'Sound of Pad 1 (new age)'
    }),
    dirName: '89-pad-one-new-age',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentPadTwoWarm',
        default: '(90) Pad 2 (warm)',
        description: 'Sound of Pad 2 (warm)'
    }),
    dirName: '90-pad-two-warm',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentPadThreePolysynth',
        default: '(91) Pad 3 (polysynth)',
        description: 'Sound of Pad 3 (polysynth)'
    }),
    dirName: '91-pad-three-polysynth',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentPadFourChoir',
        default: '(92) Pad 4 (choir)',
        description: 'Sound of Pad 4 (choir)'
    }),
    dirName: '92-pad-four-choir',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentPadFiveBowed',
        default: '(93) Pad 5 (bowed)',
        description: 'Sound of Pad 5 (bowed)'
    }),
    dirName: '93-pad-five-bowed',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentPadSixMetallic',
        default: '(94) Pad 6 (metallic)',
        description: 'Sound of Pad 6 (metallic)'
    }),
    dirName: '94-pad-six-metallic',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentPadSevenHalo',
        default: '(95) Pad 7 (halo)',
        description: 'Sound of Pad 7 (halo)'
    }),
    dirName: '95-pad-seven-halo',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentPadEightSweep',
        default: '(96) Pad 8 (sweep)',
        description: 'Sound of Pad 8 (sweep)'
    }),
    dirName: '96-pad-eight-sweep',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentFXOneRain',
        default: '(97) FX 1 (rain)',
        description: 'Sound of FX 1 (rain)'
    }),
    dirName: '97-fx-one-rain',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentFXTwoSoundtrack',
        default: '(98) FX 2 (soundtrack)',
        description: 'Sound of FX 2 (soundtrack)'
    }),
    dirName: '98-fx-two-soundtrack',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentFXThreeCrystal',
        default: '(99) FX 3 (crystal)',
        description: 'Sound of FX 3 (crystal)'
    }),
    dirName: '99-fx-three-crystal',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentFXFourAtmosphere',
        default: '(100) FX 4 (atmosphere)',
        description: 'Sound of FX 4 (atmosphere)'
    }),
    dirName: '100-fx-four-atmosphere',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentFXFiveBrightness',
        default: '(101) FX 5 (brightness)',
        description: 'Sound of FX 5 (brightness)'
    }),
    dirName: '101-fx-five-brightness',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentFXSixGoblins',
        default: '(102) FX 6 (goblins)',
        description: 'Sound of FX 6 (goblins)'
    }),
    dirName: '102-fx-six-goblins',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentFXSevenEchoes',
        default: '(103) FX 7 (echoes)',
        description: 'Sound of FX 7 (echoes)'
    }),
    dirName: '103-fx-seven-echoes',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentFXEightSciFi',
        default: '(104) FX 8 (sci-fi)',
        description: 'Sound of FX 8 (sci-fi)'
    }),
    dirName: '104-fx-eight-sci-fi',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentSitar',
        default: '(105) Sitar',
        description: 'Sound of Sitar'
    }),
    dirName: '105-sitar',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentBanjo',
        default: '(106) Banjo',
        description: 'Sound of Banjo'
    }),
    dirName: '106-banjo',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentShamisen',
        default: '(107) Shamisen',
        description: 'Sound of Shamisen'
    }),
    dirName: '107-shamisen',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentKoto',
        default: '(108) Koto',
        description: 'Sound of Koto'
    }),
    dirName: '108-koto',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentKalimba',
        default: '(109) Kalimba',
        description: 'Sound of Kalimba'
    }),
    dirName: '109-kalimba',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentBagpipe',
        default: '(110) Bagpipe',
        description: 'Sound of Bagpipe'
    }),
    dirName: '110-bagpipe',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentFiddle',
        default: '(111) Fiddle',
        description: 'Sound of Fiddle'
    }),
    dirName: '111-fiddle',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentShanai',
        default: '(112) Shanai',
        description: 'Sound of Shanai'
    }),
    dirName: '112-shanai',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentTinkleBell',
        default: '(113) Tinkle Bell',
        description: 'Sound of Tinkle Bell'
    }),
    dirName: '113-tinkle-bell',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentAgogo',
        default: '(114) Agogo',
        description: 'Sound of Agogo'
    }),
    dirName: '114-agogo',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentSteelDrums',
        default: '(115) Steel Drums',
        description: 'Sound of Steel Drums'
    }),
    dirName: '115-steel-drums',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentWoodblock',
        default: '(116) Woodblock',
        description: 'Sound of Woodblock'
    }),
    dirName: '116-woodblock',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentTaikoDrum',
        default: '(117) Taiko Drum',
        description: 'Sound of Taiko Drum'
    }),
    dirName: '117-taiko-drum',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentMelodicTom',
        default: '(118) Melodic Tom',
        description: 'Sound of Melodic Tom'
    }),
    dirName: '118-melodic-tom',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentSynthDrum',
        default: '(119) Synth Drum',
        description: 'Sound of Synth Drum'
    }),
    dirName: '119-synth-drum',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentReverseCymbal',
        default: '(120) Reverse Cymbal',
        description: 'Sound of Reverse Cymbal'
    }),
    dirName: '120-reverse-cymbal',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentGuitarFretNoise',
        default: '(121) Guitar Fret Noise',
        description: 'Sound of Guitar Fret Noise'
    }),
    dirName: '121-guitar-fret-noise',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentBreathNoise',
        default: '(122) Breath Noise',
        description: 'Sound of Breath Noise'
    }),
    dirName: '122-breath-noise',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentSeashore',
        default: '(123) Seashore',
        description: 'Sound of Seashore'
    }),
    dirName: '123-seashore',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentBirdTweet',
        default: '(124) Bird Tweet',
        description: 'Sound of Bird Tweet'
    }),
    dirName: '124-bird-tweet',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentTelephoneRing',
        default: '(125) Telephone Ring',
        description: 'Sound of Telephone Ring'
    }),
    dirName: '125-telephone-ring',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentHelicopter',
        default: '(126) Helicopter',
        description: 'Sound of Helicopter'
    }),
    dirName: '126-helicopter',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
{
    name: formatMessage({
        id: 'music.instrumentApplause',
        default: '(127) Applause',
        description: 'Sound of Applause'
    }),
    dirName: '127-applause',
    releaseTime: 2.5,
    samples: [24, 36, 48, 60, 72, 84, 96, 108]
},
        ];
    }

    /**
     * An array that is a mapping from MIDI instrument numbers to Scratch instrument numbers.
     * @type {number[]}
     */
    get MIDI_INSTRUMENTS () {
        return [
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            16,
            17,
            18,
            19,
            20,
            21,
            22,
            23,
            24,
            25,
            26,
            27,
            28,
            29,
            30,
            31,
            32,
            33,
            34,
            35,
            36,
            37,
            38,
            39,
            40,
            41,
            42,
            43,
            44,
            45,
            46,
            47,
            48,
            49,
            50,
            51,
            52,
            53,
            54,
            55,
            56,
            57,
            58,
            59,
            60,
            61,
            62,
            63,
            64,
            65,
            66,
            67,
            68,
            69,
            70,
            71,
            72,
            73,
            74,
            75,
            76,
            77,
            78,
            79,
            80,
            81,
            82,
            83,
            84,
            85,
            86,
            87,
            88,
            89,
            90,
            91,
            92,
            93,
            94,
            95,
            96,
            97,
            98,
            99,
            100,
            101,
            102,
            103,
            104,
            105,
            106,
            107,
            108,
            109,
            110,
            111,
            112,
            113,
            114,
            115,
            116,
            117,
            118,
            119,
            120,
            121,
            122,
            123,
            124,
            125,
            126,
            127,
        ];
    }

    /**
     * An array that is a mapping from MIDI drum numbers in range (35..81) to Scratch drum numbers.
     * It's in the format [drumNum, pitch, decay].
     * The pitch and decay properties are not currently being used.
     * @type {Array[]}
     */
    get MIDI_DRUMS () {
        return [
            [1, -4], // "BassDrum" in 2.0, "Bass Drum" in 3.0 (which was "Tom" in 2.0)
            [1, 0], // Same as just above
            [2, 0],
            [0, 0],
            [7, 0],
            [0, 2],
            [1, -6, 4],
            [5, 0],
            [1, -3, 3.2],
            [5, 0], // "HiHatPedal" in 2.0, "Closed Hi-Hat" in 3.0
            [1, 0, 3],
            [4, -8],
            [1, 4, 3],
            [1, 7, 2.7],
            [3, -8],
            [1, 10, 2.7],
            [4, -2],
            [3, -11],
            [4, 2],
            [6, 0],
            [3, 0, 3.5],
            [10, 0],
            [3, -8, 3.5],
            [16, -6],
            [4, 2],
            [12, 2],
            [12, 0],
            [13, 0, 0.2],
            [13, 0, 2],
            [13, -5, 2],
            [12, 12],
            [12, 5],
            [10, 19],
            [10, 12],
            [14, 0],
            [14, 0], // "Maracas" in 2.0, "Cabasa" in 3.0 (TODO: pitch up?)
            [17, 12],
            [17, 5],
            [15, 0], // "GuiroShort" in 2.0, "Guiro" in 3.0 (which was "GuiroLong" in 2.0) (TODO: decay?)
            [15, 0],
            [8, 0],
            [9, 0],
            [9, -4],
            [17, -5],
            [17, 0],
            [11, -6, 1],
            [11, -6, 3]
        ];
    }

    /**
     * The key to load & store a target's music-related state.
     * @type {string}
     */
    static get STATE_KEY () {
        return 'Scratch.music';
    }

    /**
     * The default music-related state, to be used when a target has no existing music state.
     * @type {MusicState}
     */
    static get DEFAULT_MUSIC_STATE () {
        return {
            currentInstrument: 0
        };
    }

    /**
     * The minimum and maximum MIDI note numbers, for clamping the input to play note.
     * @type {{min: number, max: number}}
     */
    static get MIDI_NOTE_RANGE () {
        return {min: 0, max: 130};
    }

    /**
     * The minimum and maximum beat values, for clamping the duration of play note, play drum and rest.
     * 100 beats at the default tempo of 60bpm is 100 seconds.
     * @type {{min: number, max: number}}
     */
    static get BEAT_RANGE () {
        return {min: 0, max: 1024};
    }

    /** The minimum and maximum tempo values, in bpm.
     * @type {{min: number, max: number}}
     */
    static get TEMPO_RANGE () {
        return {min: 10, max: 1024};
    }

    /**
     * The maximum number of sounds to allow to play simultaneously.
     * @type {number}
     */
    static get CONCURRENCY_LIMIT () {
        return 1024;
    }

    /**
     * @param {Target} target - collect music state for this target.
     * @returns {MusicState} the mutable music state associated with that target. This will be created if necessary.
     * @private
     */
    _getMusicState (target) {
        let musicState = target.getCustomState(Scratch3MusicBlocks.STATE_KEY);
        if (!musicState) {
            musicState = Clone.simple(Scratch3MusicBlocks.DEFAULT_MUSIC_STATE);
            target.setCustomState(Scratch3MusicBlocks.STATE_KEY, musicState);
        }
        return musicState;
    }

    /**
     * When a music-playing Target is cloned, clone the music state.
     * @param {Target} newTarget - the newly created target.
     * @param {Target} [sourceTarget] - the target used as a source for the new clone, if any.
     * @listens Runtime#event:targetWasCreated
     * @private
     */
    _onTargetCreated (newTarget, sourceTarget) {
        if (sourceTarget) {
            const musicState = sourceTarget.getCustomState(Scratch3MusicBlocks.STATE_KEY);
            if (musicState) {
                newTarget.setCustomState(Scratch3MusicBlocks.STATE_KEY, Clone.simple(musicState));
            }
        }
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'music',
            name: formatMessage({
                id: 'music.categoryName',
                default: 'Music',
                description: 'Label for the Music extension category'
            }),
            menuIconURI: menuIconURI,
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'playDrumForBeats',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'music.playDrumForBeats',
                        default: 'play drum [DRUM] for [BEATS] beats',
                        description: 'play drum sample for a number of beats'
                    }),
                    arguments: {
                        DRUM: {
                            type: ArgumentType.NUMBER,
                            menu: 'DRUM',
                            defaultValue: 1
                        },
                        BEATS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.25
                        }
                    }
                },
                {
                    opcode: 'midiPlayDrumForBeats',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'music.midiPlayDrumForBeats',
                        default: 'play drum [DRUM] for [BEATS] beats',
                        description: 'play drum sample for a number of beats according to a mapping of MIDI codes'
                    }),
                    arguments: {
                        DRUM: {
                            type: ArgumentType.NUMBER,
                            menu: 'DRUM',
                            defaultValue: 1
                        },
                        BEATS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.25
                        }
                    },
                    hideFromPalette: true
                },
                {
                    opcode: 'restForBeats',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'music.restForBeats',
                        default: 'rest for [BEATS] beats',
                        description: 'rest (play no sound) for a number of beats'
                    }),
                    arguments: {
                        BEATS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.25
                        }
                    }
                },
                {
                    opcode: 'playNoteForBeats',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'music.playNoteForBeats',
                        default: 'play note [NOTE] for [BEATS] beats',
                        description: 'play a note for a number of beats'
                    }),
                    arguments: {
                        NOTE: {
                            type: ArgumentType.NOTE,
                            defaultValue: 60
                        },
                        BEATS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.25
                        }
                    }
                },
                {
                    opcode: 'setInstrument',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'music.setInstrument',
                        default: 'set instrument to [INSTRUMENT]',
                        description: 'set the instrument (e.g. piano, guitar, trombone) for notes played'
                    }),
                    arguments: {
                        INSTRUMENT: {
                            type: ArgumentType.NUMBER,
                            menu: 'INSTRUMENT',
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'midiSetInstrument',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'music.midiSetInstrument',
                        default: 'set instrument to [INSTRUMENT]',
                        description: 'set the instrument for notes played according to a mapping of MIDI codes'
                    }),
                    arguments: {
                        INSTRUMENT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    },
                    hideFromPalette: true
                },
                {
                    opcode: 'setTempo',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'music.setTempo',
                        default: 'set tempo to [TEMPO]',
                        description: 'set tempo (speed) for notes, drums, and rests played'
                    }),
                    arguments: {
                        TEMPO: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 60
                        }
                    }
                },
                {
                    opcode: 'changeTempo',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'music.changeTempo',
                        default: 'change tempo by [TEMPO]',
                        description: 'change tempo (speed) for notes, drums, and rests played'
                    }),
                    arguments: {
                        TEMPO: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    }
                },
                {
                    opcode: 'getTempo',
                    text: formatMessage({
                        id: 'music.getTempo',
                        default: 'tempo',
                        description: 'get the current tempo (speed) for notes, drums, and rests played'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    blockType: BlockType.LABEL,
                    text: "Dinosaurmod-Special Blocks"
                },
                {
                    opcode: 'playInstrument',
                    blockType: BlockType.COMMAND,
                    text: 'play note [NOTE] for [BEATS] beats as [INSTRUMENT]',
                    arguments: {
                        NOTE: {
                            type: ArgumentType.NOTE,
                            defaultValue: 60
                        },
                        BEATS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.25
                        },
                        INSTRUMENT: {
                            type: ArgumentType.NUMBER,
                            menu: 'INSTRUMENT',
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'stopAllSounds',
                    blockType: BlockType.COMMAND,
                    text: 'stop all sounds',
                    //hideFromPalette: true,
                    arguments: {}
                },
            ],
            menus: {
                DRUM: {
                    acceptReporters: true,
                    items: this._buildMenu(this.DRUM_INFO)
                },
                INSTRUMENT: {
                    acceptReporters: true,
                    items: this._buildMenu(this.INSTRUMENT_INFO)
                }
            }
        };
    }

    /**
     * Play a drum sound for some number of beats.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     * @property {int} DRUM - the number of the drum to play.
     * @property {number} BEATS - the duration in beats of the drum sound.
     */
    playDrumForBeats (args, util) {
        this._playDrumForBeats(args.DRUM, args.BEATS, util);
    }

    /**
     * Play a drum sound for some number of beats according to the range of "MIDI" drum codes supported.
     * This block is implemented for compatibility with old Scratch projects that use the
     * 'drum:duration:elapsed:from:' block.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     */
    midiPlayDrumForBeats (args, util) {
        let drumNum = Cast.toNumber(args.DRUM);
        drumNum = Math.round(drumNum);
        const midiDescription = this.MIDI_DRUMS[drumNum - 35];
        if (midiDescription) {
            drumNum = midiDescription[0];
        } else {
            drumNum = 2; // Default instrument used in Scratch 2.0
        }
        drumNum += 1; // drumNum input to _playDrumForBeats is one-indexed
        this._playDrumForBeats(drumNum, args.BEATS, util);
    }

    /**
     * Internal code to play a drum sound for some number of beats.
     * @param {number} drumNum - the drum number.
     * @param {beats} beats - the duration in beats to pause after playing the sound.
     * @param {object} util - utility object provided by the runtime.
     */
    _playDrumForBeats (drumNum, beats, util) {
        if (this._stackTimerNeedsInit(util)) {
            drumNum = Cast.toNumber(drumNum);
            drumNum = Math.round(drumNum);
            drumNum -= 1; // drums are one-indexed
            drumNum = MathUtil.wrapClamp(drumNum, 0, this.DRUM_INFO.length - 1);
            beats = Cast.toNumber(beats);
            beats = this._clampBeats(beats);
            this._playDrumNum(util, drumNum);
            this._startStackTimer(util, this._beatsToSec(beats));
        } else {
            this._checkStackTimer(util);
        }
    }

    /**
     * Play a drum sound using its 0-indexed number.
     * @param {object} util - utility object provided by the runtime.
     * @param {number} drumNum - the number of the drum to play.
     * @private
     */
    _playDrumNum (util, drumNum) {
        if (util.runtime.audioEngine === null) return;
        if (util.target.sprite.soundBank === null) return;
        // If we're playing too many sounds, do not play the drum sound.
        if (this._concurrencyCounter > Scratch3MusicBlocks.CONCURRENCY_LIMIT) {
            return;
        }

        const player = this._drumPlayers[drumNum];

        if (typeof player === 'undefined') return;

        if (player.isPlaying && !player.isStarting) {
            // Take the internal player state and create a new player with it.
            // `.play` does this internally but then instructs the sound to
            // stop.
            player.take();
        }

        const engine = util.runtime.audioEngine;
        const context = engine.audioContext;
        const volumeGain = context.createGain();
        volumeGain.gain.setValueAtTime(util.target.volume / 100, engine.currentTime);
        volumeGain.connect(engine.getInputNode());

        this._concurrencyCounter++;
        player.once('stop', () => {
            this._concurrencyCounter--;
        });

        player.play();
        // Connect the player to the gain node.
        player.connect({getInputNode () {
            return volumeGain;
        }});
    }

    /**
     * Rest for some number of beats.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     * @property {number} BEATS - the duration in beats of the rest.
     */
    restForBeats (args, util) {
        if (this._stackTimerNeedsInit(util)) {
            let beats = Cast.toNumber(args.BEATS);
            beats = this._clampBeats(beats);
            this._startStackTimer(util, this._beatsToSec(beats));
        } else {
            this._checkStackTimer(util);
        }
    }

    /**
     * Play a note using the current musical instrument for some number of beats.
     * This function processes the arguments, and handles the timing of the block's execution.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     * @property {number} NOTE - the pitch of the note to play, interpreted as a MIDI note number.
     * @property {number} BEATS - the duration in beats of the note.
     */
    playNoteForBeats (args, util) {
        if (this._stackTimerNeedsInit(util)) {
            let note = Cast.toNumber(args.NOTE);
            note = MathUtil.clamp(note,
                Scratch3MusicBlocks.MIDI_NOTE_RANGE.min, Scratch3MusicBlocks.MIDI_NOTE_RANGE.max);
            let beats = Cast.toNumber(args.BEATS);
            beats = this._clampBeats(beats);
            // If the duration is 0, do not play the note. In Scratch 2.0, "play drum for 0 beats" plays the drum,
            // but "play note for 0 beats" is silent.
            if (beats === 0) return;

            const durationSec = this._beatsToSec(beats);

            this._playNote(util, note, durationSec);

            this._startStackTimer(util, durationSec);
        } else {
            this._checkStackTimer(util);
        }
    }

    playInstrument (args, util) {
        if (this._stackTimerNeedsInit(util)) {
            let note = Cast.toNumber(args.NOTE);
            note = MathUtil.clamp(note,
                Scratch3MusicBlocks.MIDI_NOTE_RANGE.min, Scratch3MusicBlocks.MIDI_NOTE_RANGE.max);
            let beats = Cast.toNumber(args.BEATS);
            beats = this._clampBeats(beats);
            // If the duration is 0, do not play the note. In Scratch 2.0, "play drum for 0 beats" plays the drum,
            // but "play note for 0 beats" is silent.
            if (beats === 0) return;

            const durationSec = this._beatsToSec(beats);

            let instrument = this._getInstrument(args.INSTRUMENT, util, false);

            this._playNote(util, note, durationSec, instrument);

            this._startStackTimer(util, durationSec);
        } else {
            this._checkStackTimer(util);
        }
    }

    _playNoteForPicker (noteNum, category) {
        if (category !== this.getInfo().name) return;
        const util = {
            runtime: this.runtime,
            target: this.runtime.getEditingTarget()
        };
        this._playNote(util, noteNum, 0.25, null, true);
    }

    /**
     * Play a note using the current instrument for a duration in seconds.
     * This function actually plays the sound, and handles the timing of the sound, including the
     * "release" portion of the sound, which continues briefly after the block execution has finished.
     * @param {object} util - utility object provided by the runtime.
     * @param {number} note - the pitch of the note to play, interpreted as a MIDI note number.
     * @param {number} durationSec - the duration in seconds to play the note.
     * @param {any} customInstrument - when the value isn't null, it replaces the current instrument with itself
     * @private
     */
    _playNote (util, note, durationSec, customInstrument = null, usesPicker) {
        if (util.runtime.audioEngine === null) return;
        if (util.target.sprite.soundBank === null) return;

        // If we're playing too many sounds, do not play the note.
        if (this._concurrencyCounter > Scratch3MusicBlocks.CONCURRENCY_LIMIT) {
            return;
        }

        // Determine which of the audio samples for this instrument to play
        const musicState = this._getMusicState(util.target);
        const inst = customInstrument == null ? musicState.currentInstrument : customInstrument;
        const instrumentInfo = this.INSTRUMENT_INFO[inst];
        const sampleArray = instrumentInfo.samples;
        const sampleIndex = this._selectSampleIndexForNote(note, sampleArray);

        // If the audio sample has not loaded yet, bail out
        if (typeof this._instrumentPlayerArrays[inst] === 'undefined') return;
        if (typeof this._instrumentPlayerArrays[inst][sampleIndex] === 'undefined') return;

        // Fetch the sound player to play the note.
        const engine = util.runtime.audioEngine;

        if (!this._instrumentPlayerNoteArrays[inst][note]) {
            this._instrumentPlayerNoteArrays[inst][note] = this._instrumentPlayerArrays[inst][sampleIndex].take();
        }

        const player = this._instrumentPlayerNoteArrays[inst][note];

        if (player.isPlaying && !player.isStarting) {
            // Take the internal player state and create a new player with it.
            // `.play` does this internally but then instructs the sound to
            // stop.
            player.take();
        }

        // Set its pitch.
        const sampleNote = sampleArray[sampleIndex];
        const notePitchInterval = this._ratioForPitchInterval(note - sampleNote);

        // Create gain nodes for this note's volume and release, and chain them
        // to the output.
        const context = engine.audioContext;
        const volumeGain = context.createGain();
        volumeGain.gain.setValueAtTime(util.target.volume / 100, engine.currentTime);
        const releaseGain = context.createGain();
        volumeGain.connect(releaseGain);
        releaseGain.connect(engine.getInputNode());

        // Schedule the release of the note, ramping its gain down to zero,
        // and then stopping the sound.
        let releaseDuration = this.INSTRUMENT_INFO[inst].releaseTime;
        if (typeof releaseDuration === 'undefined') {
            releaseDuration = 0.01;
        }
        const releaseStart = context.currentTime + durationSec;
        const releaseEnd = releaseStart + releaseDuration;
        releaseGain.gain.setValueAtTime(1, releaseStart);
        releaseGain.gain.linearRampToValueAtTime(0.0001, releaseEnd);

        this._concurrencyCounter++;
        player.once('stop', () => {
            this._concurrencyCounter--;

            if (!usesPicker) {
                const index = this._allCurrentlyRunningSounds.indexOf(player);
                if (index > -1) {
                    this._allCurrentlyRunningSounds.splice(index, 1);
                }
                /*if (!this._stackTimerNeedsInit(util)) */this._allCUtils[player] = null;
            };
        });

        // Start playing the note
        player.play();
        // Connect the player to the gain node.
        player.connect({getInputNode () {
            return volumeGain;
        }});
        // Set playback now after play creates the outputNode.
        player.outputNode.playbackRate.value = notePitchInterval;
        // Schedule playback to stop.
        player.outputNode.stop(releaseEnd);

        if (!usesPicker) {
            this._allCurrentlyRunningSounds.push(player);
            /*if (!this._stackTimerNeedsInit(util)) */this._allCUtils[player] = util
        };
    }

    _stopAllSounds () {
        for (const sound of this._allCurrentlyRunningSounds) {
            if ('outputNode' in sound) {
                sound.stop();
            }
            let Util = this._allCUtils[sound];
            if (Util && 'stackFrame' in Util) {
                console.log(Util.stackFrame)
                _forceStopStackTimer(Util)
                //Util.stackFrame.timer.setTimer((Util.stackFrame.duration * 1000) - 0.01)
            }
        }
    }

    /**
     * The samples array for each instrument is the set of pitches of the available audio samples.
     * This function selects the best one to use to play a given input note, and returns its index
     * in the samples array.
     * @param  {number} note - the input note to select a sample for.
     * @param  {number[]} samples - an array of the pitches of the available samples.
     * @return {index} the index of the selected sample in the samples array.
     * @private
     */
    _selectSampleIndexForNote (note, samples) {
        // Step backwards through the array of samples, i.e. in descending pitch, in order to find
        // the sample that is the closest one below (or matching) the pitch of the input note.
        for (let i = samples.length - 1; i >= 0; i--) {
            if (note >= samples[i]) {
                return i;
            }
        }
        return 0;
    }

    /**
     * Calcuate the frequency ratio for a given musical interval.
     * @param  {number} interval - the pitch interval to convert.
     * @return {number} a ratio corresponding to the input interval.
     * @private
     */
    _ratioForPitchInterval (interval) {
        return Math.pow(2, (interval / 12));
    }

    /**
     * Clamp a duration in beats to the allowed min and max duration.
     * @param  {number} beats - a duration in beats.
     * @return {number} - the clamped duration.
     * @private
     */
    _clampBeats (beats) {
        return MathUtil.clamp(beats, Scratch3MusicBlocks.BEAT_RANGE.min, Scratch3MusicBlocks.BEAT_RANGE.max);
    }

    /**
     * Convert a number of beats to a number of seconds, using the current tempo.
     * @param  {number} beats - number of beats to convert to secs.
     * @return {number} seconds - number of seconds `beats` will last.
     * @private
     */
    _beatsToSec (beats) {
        return (60 / this.getTempo()) * beats;
    }

    /**
     * Check if the stack timer needs initialization.
     * @param {object} util - utility object provided by the runtime.
     * @return {boolean} - true if the stack timer needs to be initialized.
     * @private
     */
    _stackTimerNeedsInit (util) {
        return !util.stackFrame.timer;
    }

    /**
     * Start the stack timer and the yield the thread if necessary.
     * @param {object} util - utility object provided by the runtime.
     * @param {number} duration - a duration in seconds to set the timer for.
     * @private
     */
    _startStackTimer (util, duration) {
        util.stackFrame.timer = new Timer();
        util.stackFrame.timer.start();
        util.stackFrame.duration = duration;
        util.yield();
    }

    /**
     * Check the stack timer, and if its time is not up yet, yield the thread.
     * @param {object} util - utility object provided by the runtime.
     * @private
     */
    _checkStackTimer (util) {
        const timeElapsed = util.stackFrame.timer.timeElapsed();
        if (timeElapsed < util.stackFrame.duration * 1000) {
            util.yield();
        }
    }

    //THREAD: stopThisScript
    _forceStopStackTimer (util) {
        if (!util) return;
        if (util.hasOwnProperty('stackFrame')) {
            if (util.hasOwnProperty('timer')) {
                util.stackFrame.duration = util.stackFrame.timer.timeElapsed() - 0.05
            }
        }
    }

    /**
     * Select an instrument for playing notes.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     * @property {int} INSTRUMENT - the number of the instrument to select.
     */
    setInstrument (args, util) {
        this._setInstrument(args.INSTRUMENT, util, false);
    }

    /**
     * Select an instrument for playing notes according to a mapping of MIDI codes to Scratch instrument numbers.
     * This block is implemented for compatibility with old Scratch projects that use the 'midiInstrument:' block.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     * @property {int} INSTRUMENT - the MIDI number of the instrument to select.
     */
    midiSetInstrument (args, util) {
        this._setInstrument(args.INSTRUMENT, util, true);
    }

    /**
     * Internal code to select an instrument for playing notes. If mapMidi is true, set the instrument according to
     * the MIDI to Scratch instrument mapping.
     * @param {number} instNum - the instrument number.
     * @param {object} util - utility object provided by the runtime.
     * @param {boolean} mapMidi - whether or not instNum is a MIDI instrument number.
     */
    _setInstrument (instNum, util, mapMidi) {
        const musicState = this._getMusicState(util.target);
        instNum = Cast.toNumber(instNum);
        instNum = Math.round(instNum);
        instNum -= 1; // instruments are one-indexed
        if (mapMidi) {
            instNum = (this.MIDI_INSTRUMENTS[instNum] || 0) - 1;
        }
        instNum = MathUtil.wrapClamp(instNum, 0, this.INSTRUMENT_INFO.length - 1);
        musicState.currentInstrument = instNum;
    }

    /**
     * Internal code to select an instrument for playing notes. If mapMidi is true, get the instrument according to
     * the MIDI to Scratch instrument mapping.
     * @param {number} instNum - the instrument number.
     * @param {object} util - utility object provided by the runtime.
     * @param {boolean} mapMidi - whether or not instNum is a MIDI instrument number.
     */
    _getInstrument (instNum, util, mapMidi) {
        instNum = Cast.toNumber(instNum);
        instNum = Math.round(instNum);
        instNum -= 1; // instruments are one-indexed
        if (mapMidi) {
            instNum = (this.MIDI_INSTRUMENTS[instNum] || 0) - 1;
        }
        instNum = MathUtil.wrapClamp(instNum, 0, this.INSTRUMENT_INFO.length - 1);
        return instNum;
    }

    /**
     * Set the current tempo to a new value.
     * @param {object} args - the block arguments.
     * @property {number} TEMPO - the tempo, in beats per minute.
     */
    setTempo (args) {
        const tempo = Cast.toNumber(args.TEMPO);
        this._updateTempo(tempo);
    }

    /**
     * Change the current tempo by some amount.
     * @param {object} args - the block arguments.
     * @property {number} TEMPO - the amount to change the tempo, in beats per minute.
     */
    changeTempo (args) {
        const change = Cast.toNumber(args.TEMPO);
        const tempo = change + this.getTempo();
        this._updateTempo(tempo);
    }

    /**
     * Update the current tempo, clamping it to the min and max allowable range.
     * @param {number} tempo - the tempo to set, in beats per minute.
     * @private
     */
    _updateTempo (tempo) {
        tempo = MathUtil.clamp(tempo, Scratch3MusicBlocks.TEMPO_RANGE.min, Scratch3MusicBlocks.TEMPO_RANGE.max);
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            stage.tempo = tempo;
        }
    }

    /**
     * Get the current tempo.
     * @return {number} - the current tempo, in beats per minute.
     */
    getTempo () {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            return stage.tempo;
        }
        return 60;
    }

    stopAllSounds () {
        return this._stopAllSounds();
    }
}

module.exports = Scratch3MusicBlocks;
