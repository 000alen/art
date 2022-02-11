import { NFTFactory } from "./src";
import path from "path";
import Jimp from "jimp";

const rootDir = path.join("./");
const inputDir = path.resolve("./sample/input/");
const outputDir = path.resolve("./sample/output/");

async function main() {
  const factory = new NFTFactory(
    {
      name: "Test",
      description: "Test",
      width: 512,
      height: 512,
      generateBackground: false,
      layers: ["Background", "Eyeball", "Shine", "Iris"],
    },
    inputDir,
    outputDir
  );
  await factory.loadLayers();
  await factory.bootstrapOutput();

  const attributes = factory.generateRandomAttributes(10);
  factory.generateImages(attributes);
}

main();

async function test() {
  const factory = new NFTFactory(
    {
      name: "Test",
      description: "Test",
      width: 512,
      height: 512,
      generateBackground: false,
      layers: ["Background", "Eyeball", "Shine", "Iris"],
    },
    inputDir,
    outputDir
  );

  const imageA = await Jimp.read(path.join(inputDir, "Background/Black#1.png"));
  const imageB = await Jimp.read(path.join(inputDir, "Eyeball/Red#50.png"));

  const imageC = factory.composeImages(imageA, imageB);
  // await imageC.writeAsync(path.join(rootDir, "test.png"));
  imageC.write(path.join(rootDir, "test.png"));
}

// test();
