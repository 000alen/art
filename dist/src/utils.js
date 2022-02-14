"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rarityWeightedChoice = exports.rarity = exports.randomColor = void 0;
const jimp_1 = __importDefault(require("jimp"));
const path_1 = __importDefault(require("path"));
const types_1 = require("./types");
function randomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const a = 255;
    return jimp_1.default.rgbaToInt(r, g, b, a);
}
exports.randomColor = randomColor;
function rarity(elementName) {
    const fileNameWithoutExtension = path_1.default.parse(elementName).name;
    let rarity = Number(fileNameWithoutExtension.split(types_1.RARITY_DELIMITER).pop());
    if (isNaN(rarity))
        rarity = 1;
    return rarity;
}
exports.rarity = rarity;
// Source: https://github.com/parmentf/random-weighted-choice
function rarityWeightedChoice(layerElements, temperature = 50, randomFunction = Math.random, influence = 2) {
    const T = (temperature - 50) / 50;
    const nb = layerElements.length;
    if (!nb)
        return null;
    const total = layerElements.reduce((previousTotal, element) => previousTotal + element.rarity, 0);
    const avg = total / nb;
    const ur = {};
    const urgencySum = layerElements.reduce((previousSum, element) => {
        const { name, rarity } = element;
        let urgency = rarity + T * influence * (avg - rarity);
        if (urgency < 0)
            urgency = 0;
        ur[name] = (ur[name] || 0) + urgency;
        return previousSum + urgency;
    }, 0);
    let currentUrgency = 0;
    const cumulatedUrgencies = {};
    Object.keys(ur).forEach((id) => {
        currentUrgency += ur[id];
        cumulatedUrgencies[id] = currentUrgency;
    });
    if (urgencySum <= 0)
        return null;
    const choice = randomFunction() * urgencySum;
    const names = Object.keys(cumulatedUrgencies);
    for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const urgency = cumulatedUrgencies[name];
        if (choice <= urgency) {
            return name;
        }
    }
}
exports.rarityWeightedChoice = rarityWeightedChoice;
