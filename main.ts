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
      layers: [
        "Eyeball",
        "Eye color",
        "Shine",
        "Iris",
        "Bottom lid",
        "Top lid",
      ],
    },
    inputDir,
    outputDir
  );
  await factory.loadLayers();
  await factory.bootstrapOutput();

  const attributes = factory.generateRandomAttributes(10);

  await factory.generateImages(attributes);
  const imagesCID = await factory.deployImages();

  console.log(`Images CID: ${imagesCID}`);

  await factory.generateMetadata(imagesCID, attributes);
  const metadataCID = await factory.deployMetadata();

  console.log(`Metadata CID: ${metadataCID}`);
}

main();
