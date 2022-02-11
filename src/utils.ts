import Jimp from "jimp";
import path from "path";
import { RARITY_DELIMITER } from "./types";

export function randomColor(): number {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  const a = 255;

  return Jimp.rgbaToInt(r, g, b, a);
}

export function rarity(elementName: string) {
  const fileNameWithoutExtension = path.parse(elementName).name;
  let rarity = Number(fileNameWithoutExtension.split(RARITY_DELIMITER).pop());
  if (isNaN(rarity)) rarity = 1;
  return rarity;
}
