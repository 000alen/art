"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NFTFactory = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jimp_1 = __importDefault(require("jimp"));
const utils_1 = require("./utils");
const ipfs_1 = require("ipfs");
const hardhat_1 = __importDefault(require("hardhat"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// ! TODO: Support vectorized images
// TODO: Support 3D assets
class NFTFactory {
    constructor(configuration, inputDir, outputDir) {
        this.configuration = configuration;
        this.inputDir = inputDir;
        this.outputDir = outputDir;
        this.layers = new Map();
        this.buffers = new Map();
    }
    get maxCombinations() {
        return this.configuration.layers.reduce((accumulator, layer) => {
            return accumulator * this.layers.get(layer).length;
        }, 1);
    }
    get instance() {
        return {
            imagesCID: this.imagesCID,
            metadataCID: this.metadataCID,
            contractAddress: this.contractAddress,
        };
    }
    loadInstance({ imagesCID, metadataCID, contractAddress }) {
        this.imagesCID = imagesCID;
        this.metadataCID = metadataCID;
        this.contractAddress = contractAddress;
    }
    loadLayers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Read the layers folders
                const layersNames = (yield fs_1.default.promises.readdir(this.inputDir)).filter((file) => !file.startsWith("."));
                // Read the files from layers
                const layersElements = yield Promise.all(layersNames.map((layerName) => __awaiter(this, void 0, void 0, function* () {
                    return (yield fs_1.default.promises.readdir(path_1.default.join(this.inputDir, layerName))).filter((file) => !file.startsWith("."));
                })));
                // Put the layers on a map
                layersNames.forEach((layerName, i) => {
                    this.layers.set(layerName, layersElements[i].map((layerElement) => ({
                        name: layerElement,
                        rarity: (0, utils_1.rarity)(layerElement),
                    })));
                });
            }
            catch (error) {
                throw error;
            }
        });
    }
    bootstrapOutput() {
        return __awaiter(this, void 0, void 0, function* () {
            if (fs_1.default.existsSync(this.outputDir))
                fs_1.default.rmSync(this.outputDir, { recursive: true });
            fs_1.default.mkdirSync(this.outputDir);
            fs_1.default.mkdirSync(path_1.default.join(this.outputDir, "json"));
            fs_1.default.mkdirSync(path_1.default.join(this.outputDir, "images"));
        });
    }
    generateRandomAttributes(n) {
        if (n > this.maxCombinations)
            console.warn(`WARN: n > maxCombinations (${n} > ${this.maxCombinations})`);
        const attributes = [];
        for (let i = 0; i < n; i++) {
            const attribute = [];
            for (const layerName of this.configuration.layers) {
                const layerElements = this.layers.get(layerName);
                const name = (0, utils_1.rarityWeightedChoice)(layerElements);
                attribute.push({
                    name: layerName,
                    value: name,
                });
            }
            attributes.push(attribute);
        }
        return attributes;
    }
    generateAllAttributes() {
        const attributes = [];
        function* generator(configuration, layers, n) {
            if (n === 0) {
                yield [];
                return;
            }
            const layerName = configuration.layers[configuration.layers.length - n];
            const layerElements = layers.get(layerName);
            for (const layerElement of layerElements) {
                for (const _ of generator(configuration, layers, n - 1)) {
                    yield [{ name: layerName, value: layerElement.name }, ..._];
                }
            }
        }
        for (const attribute of generator(this.configuration, this.layers, this.configuration.layers.length)) {
            attributes.push(attribute);
        }
        return attributes;
    }
    composeImages(back, front) {
        back.composite(front, 0, 0);
        return back;
    }
    ensureBuffer(elementKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.buffers.has(elementKey)) {
                const buffer = yield fs_1.default.promises.readFile(path_1.default.join(this.inputDir, elementKey));
                this.buffers.set(elementKey, buffer);
            }
        });
    }
    // ! TODO: Careful with memory usage
    generateImages(attributes) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(attributes.map((traits, i) => __awaiter(this, void 0, void 0, function* () {
                const image = yield jimp_1.default.create(this.configuration.width, this.configuration.height, this.configuration.generateBackground
                    ? (0, utils_1.randomColor)()
                    : this.configuration.defaultBackground || 0xffffff);
                for (const trait of traits) {
                    const elementKey = path_1.default.join(trait.name, trait.value);
                    yield this.ensureBuffer(elementKey);
                    const current = yield jimp_1.default.read(this.buffers.get(elementKey));
                    this.composeImages(image, current);
                }
                yield image.writeAsync(path_1.default.join(this.outputDir, "images", `${i + 1}.png`));
            })));
        });
    }
    generateMetadata(cid, attributes) {
        return __awaiter(this, void 0, void 0, function* () {
            const metadatas = [];
            for (let i = 0; i < attributes.length; i++) {
                const traits = attributes[i];
                const metadata = {
                    name: this.configuration.name,
                    description: this.configuration.description,
                    image: `ipfs://${cid}/${i + 1}.png`,
                    edition: i,
                    date: Date.now(),
                    attributes: traits.map((trait) => ({
                        trait_type: trait.name,
                        value: trait.value,
                    })),
                };
                metadatas.push(metadata);
                yield fs_1.default.promises.writeFile(path_1.default.join(this.outputDir, "json", `${i + 1}.json`), JSON.stringify(metadata));
            }
            yield fs_1.default.promises.writeFile(path_1.default.join(this.outputDir, "json", "metadata.json"), JSON.stringify(metadatas));
        });
    }
    ensureIPFS() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.ipfs === undefined) {
                this.ipfs = yield (0, ipfs_1.create)();
                // if (process.env.PINATA_KEY !== undefined) {
                //   this.ipfs!.pin.remote.service.add("pinata", {
                //     endpoint: new URL("https://api.pinata.cloud"),
                //     key: process.env.PINATA_KEY,
                //   });
                // }
            }
        });
    }
    // ! TODO: Optimize; buffers might be loaded in this.buffers (use this.ensureBuffer)
    deployImages(force = false) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.imagesCID !== undefined && !force) {
                console.warn(`WARN: images have already been deployed to IPFS (cid: ${this.imagesCID})`);
                return this.imagesCID;
            }
            const imagesDir = path_1.default.join(this.outputDir, "images");
            const imageFiles = (yield fs_1.default.promises.readdir(imagesDir))
                .filter((file) => !file.startsWith("."))
                .map((fileName) => ({
                path: path_1.default.join("images", fileName),
                content: fs_1.default.createReadStream(path_1.default.join(imagesDir, fileName)),
            }));
            yield this.ensureIPFS();
            try {
                for (var _b = __asyncValues(this.ipfs.addAll(imageFiles)), _c; _c = yield _b.next(), !_c.done;) {
                    const result = _c.value;
                    if (result.path == "images")
                        this.imagesCID = result.cid.toString();
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // if (process.env.PINATA_KEY !== undefined) {
            //   await this.ipfs!.pin.remote.add(CID.parse(this.imagesCID!), {
            //     service: "pinata",
            //   });
            // }
            return this.imagesCID;
        });
    }
    ensureContract() {
        return __awaiter(this, void 0, void 0, function* () {
            yield hardhat_1.default.run("compile");
        });
    }
    deployMetadata(force = false) {
        var e_2, _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.metadataCID !== undefined && !force) {
                console.warn(`WARN: metadata has already been deployed to IPFS (cid: ${this.metadataCID})`);
                return this.metadataCID;
            }
            if (this.imagesCID === undefined)
                throw new Error("Images have not been deployed to IPFS");
            yield this.ensureIPFS();
            const jsonDir = path_1.default.join(this.outputDir, "json");
            const jsonFiles = (yield fs_1.default.promises.readdir(jsonDir))
                .filter((file) => !file.startsWith("."))
                .map((fileName) => ({
                path: path_1.default.join("json", fileName),
                content: fs_1.default.createReadStream(path_1.default.join(jsonDir, fileName)),
            }));
            yield this.ensureIPFS();
            try {
                for (var _b = __asyncValues(this.ipfs.addAll(jsonFiles)), _c; _c = yield _b.next(), !_c.done;) {
                    const result = _c.value;
                    if (result.path == "json")
                        this.metadataCID = result.cid.toString();
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            // if (process.env.PINATA_KEY !== undefined) {
            //   await this.ipfs!.pin.remote.add(CID.parse(this.metadataCID!), {
            //     service: "pinata",
            //   });
            // }
            return this.metadataCID;
        });
    }
    // ! TODO: Implement
    deployContract(force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.contractAddress !== undefined && !force) {
                console.warn(`WARN: contract has already been deployed (address: ${this.contractAddress})`);
                return this.contractAddress;
            }
            yield this.ensureContract();
            const contractArgs = {
                name: this.configuration.name,
                symbol: this.configuration.symbol,
                initBaseURI: `ipfs://${this.metadataCID}/`,
                initNotRevealedURI: `ipfs://${this.metadataCID}/`,
            };
            this.contractAddress = yield hardhat_1.default.run("deploy", contractArgs);
            yield this.verifyContract();
            return this.contractAddress;
        });
    }
    verifyContract() {
        return __awaiter(this, void 0, void 0, function* () {
            const contractArgs = {
                name: this.configuration.name,
                symbol: this.configuration.symbol,
                initBaseURI: `ipfs://${this.metadataCID}/`,
                initNotRevealedURI: `ipfs://${this.metadataCID}/`,
            };
            yield hardhat_1.default.run("verify:verify", {
                address: this.contractAddress,
                constructorArguments: [
                    contractArgs.name,
                    contractArgs.symbol,
                    contractArgs.initBaseURI,
                    contractArgs.initNotRevealedURI,
                ],
            });
        });
    }
}
exports.NFTFactory = NFTFactory;
