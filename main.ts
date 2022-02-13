import { NFTFactory, IInstance } from "./src";
import path from "path";

const inputDir = path.resolve("./sample/input/");
const outputDir = path.resolve("./sample/output/");

async function main() {
  const factory = new NFTFactory(
    {
      name: "Test",
      symbol: "TEST",
      description: "Test",
      width: 512,
      height: 512,
      generateBackground: true,
      layers: ["Eyeball", "Eye color", "Shine", "Iris"],
    },
    inputDir,
    outputDir
  );

  // const instance: IInstance = {
  //   imagesCID: "QmS3ojSSornLo2u3RLSk6Jz1YhgQqWF3PL6CBPYje9Yw5a",
  //   metadataCID: "QmaWopqrpdw3nsfj2UNuFWDNiB5rs5MrMJjifWCgoMbs9f",
  //   contractAddress: "0x2Af7AEB427926D5330a5a0db4D4EC9641B800725",
  // };
  // factory.loadInstance(instance);

  await factory.loadLayers();
  await factory.bootstrapOutput();
  const attributes = factory.generateRandomAttributes(10);
  await factory.generateImages(attributes);

  // const imagesCID = await factory.deployImages();
  // await factory.generateMetadata(imagesCID, attributes);
  // await factory.deployMetadata();
  // await factory.deployContract();
  // await factory.verifyContract();
}

main();
