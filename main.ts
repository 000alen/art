import { NFTFactory } from "./src";
import path from "path";

const inputDir = path.resolve("./sample/input/");
const outputDir = path.resolve("./sample/output/");

async function main() {
  const factory = new NFTFactory(
    {
      name: "Test",
      description: "Test",
      width: 512,
      height: 512,
      generateBackground: true,
      layers: ["Eyeball", "Shine", "Iris"],
    },
    inputDir,
    outputDir
  );
  await factory.loadLayers();
  await factory.bootstrapOutput();

  // const attributes = factory.generateRandomAttributes(10);
  const attributes = factory.generateAllAttributes();
  await factory.generateImages(attributes);
  await factory.generateMetadata(attributes);
}

main();
