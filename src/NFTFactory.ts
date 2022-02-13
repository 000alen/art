import { IAttributes, IConfiguration, IInstance } from "./types";
import fs from "fs";
import path from "path";
import Jimp from "jimp";
import { randomColor, rarityWeightedChoice, rarity } from "./utils";
import { CID, create, IPFS } from "ipfs";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// ! TODO: Support vectorized images
// TODO: Support 3D assets
export class NFTFactory {
  private layers: Map<string, { name: string; rarity: number }[]>;
  private buffers: Map<string, Buffer>;
  private ipfs?: IPFS;

  public imagesCID?: string;
  public metadataCID?: string;
  public contractAddress?: string;

  constructor(
    public configuration: IConfiguration,
    public inputDir: string,
    public outputDir: string
  ) {
    this.layers = new Map<string, { name: string; rarity: number }[]>();
    this.buffers = new Map<string, Buffer>();
  }

  get maxCombinations() {
    return this.configuration.layers.reduce((accumulator, layer) => {
      return accumulator * this.layers.get(layer)!.length;
    }, 1);
  }

  get instance(): IInstance {
    return {
      imagesCID: this.imagesCID,
      metadataCID: this.metadataCID,
      contractAddress: this.contractAddress,
    };
  }

  loadInstance({ imagesCID, metadataCID, contractAddress }: IInstance) {
    this.imagesCID = imagesCID;
    this.metadataCID = metadataCID;
    this.contractAddress = contractAddress;
  }

  async loadLayers() {
    try {
      // Read the layers folders
      const layersNames = (await fs.promises.readdir(this.inputDir)).filter(
        (file) => !file.startsWith(".")
      );

      // Read the files from layers
      const layersElements = await Promise.all(
        layersNames.map(async (layerName) =>
          (
            await fs.promises.readdir(path.join(this.inputDir, layerName))
          ).filter((file) => !file.startsWith("."))
        )
      );

      // Put the layers on a map
      layersNames.forEach((layerName, i) => {
        this.layers.set(
          layerName,
          layersElements[i].map((layerElement) => ({
            name: layerElement,
            rarity: rarity(layerElement),
          }))
        );
      });
    } catch (error) {
      throw error;
    }
  }

  async bootstrapOutput() {
    if (fs.existsSync(this.outputDir))
      fs.rmSync(this.outputDir, { recursive: true });
    fs.mkdirSync(this.outputDir);
    fs.mkdirSync(path.join(this.outputDir, "json"));
    fs.mkdirSync(path.join(this.outputDir, "images"));
  }

  generateRandomAttributes(n: number): IAttributes[] {
    if (n > this.maxCombinations)
      console.warn(
        `WARN: n > maxCombinations (${n} > ${this.maxCombinations})`
      );

    const attributes: IAttributes[] = [];

    for (let i = 0; i < n; i++) {
      const attribute: IAttributes = [];

      for (const layerName of this.configuration.layers) {
        const layerElements = this.layers.get(layerName)!;
        const name = rarityWeightedChoice(layerElements)!;

        attribute.push({
          name: layerName,
          value: name,
        });
      }

      attributes.push(attribute);
    }

    return attributes;
  }

  generateAllAttributes(): IAttributes[] {
    const attributes: IAttributes[] = [];

    function* generator(
      configuration: IConfiguration,
      layers: Map<string, { name: string; rarity: number }[]>,
      n: number
    ): Generator<IAttributes> {
      if (n === 0) {
        yield [];
        return;
      }

      const layerName = configuration.layers[configuration.layers.length - n];
      const layerElements = layers.get(layerName)!;

      for (const layerElement of layerElements) {
        for (const _ of generator(configuration, layers, n - 1)) {
          yield [{ name: layerName, value: layerElement.name }, ..._];
        }
      }
    }

    for (const attribute of generator(
      this.configuration,
      this.layers,
      this.configuration.layers.length
    )) {
      attributes.push(attribute);
    }

    return attributes;
  }

  private composeImages(back: Jimp, front: Jimp): Jimp {
    back.composite(front, 0, 0);
    return back;
  }

  private async ensureBuffer(elementKey: string) {
    if (!this.buffers.has(elementKey)) {
      const buffer = await fs.promises.readFile(
        path.join(this.inputDir, elementKey)
      );
      this.buffers.set(elementKey, buffer);
    }
  }

  // ! TODO: Careful with memory usage
  async generateImages(attributes: IAttributes[]) {
    const baseImages = await Promise.all(
      attributes.map(() =>
        Jimp.create(
          this.configuration.width,
          this.configuration.height,
          this.configuration.generateBackground
            ? randomColor()
            : this.configuration.defaultBackground || 0xffffff
        )
      )
    );

    const composedImages = await Promise.all(
      baseImages.map(async (image, i) => {
        // Select attributes
        const traits: IAttributes = attributes[i];

        // Go ahead with the next IAtributes
        for (let trait of traits) {
          const elementKey = path.join(trait.name, trait.value);
          await this.ensureBuffer(elementKey);
          const current = await Jimp.read(this.buffers.get(elementKey)!);

          this.composeImages(image, current);
        }

        return image;
      })
    );

    await Promise.all(
      composedImages.map((composedImage, i) =>
        composedImage.writeAsync(
          path.join(this.outputDir, "images", `${i + 1}.png`)
        )
      )
    );
  }

  async generateMetadata(cid: string, attributes: IAttributes[]) {
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

      await fs.promises.writeFile(
        path.join(this.outputDir, "json", `${i + 1}.json`),
        JSON.stringify(metadata)
      );
    }

    await fs.promises.writeFile(
      path.join(this.outputDir, "json", "metadata.json"),
      JSON.stringify(metadatas)
    );
  }

  private async ensureIPFS() {
    if (this.ipfs === undefined) {
      this.ipfs = await create();

      // if (process.env.PINATA_KEY !== undefined) {
      //   this.ipfs!.pin.remote.service.add("pinata", {
      //     endpoint: new URL("https://api.pinata.cloud"),
      //     key: process.env.PINATA_KEY,
      //   });
      // }
    }
  }

  // ! TODO: Optimize; buffers might be loaded in this.buffers (use this.ensureBuffer)
  async deployImages(force: boolean = false): Promise<string> {
    if (this.imagesCID !== undefined && !force) {
      console.warn(
        `WARN: images have already been deployed to IPFS (cid: ${this.imagesCID})`
      );
      return this.imagesCID;
    }

    const imagesDir = path.join(this.outputDir, "images");
    const imageFiles = (await fs.promises.readdir(imagesDir))
      .filter((file) => !file.startsWith("."))
      .map((fileName) => ({
        path: path.join("images", fileName),
        content: fs.createReadStream(path.join(imagesDir, fileName)),
      }));

    await this.ensureIPFS();

    for await (const result of this.ipfs!.addAll(imageFiles))
      if (result.path == "images") this.imagesCID = result.cid.toString();

    // if (process.env.PINATA_KEY !== undefined) {
    //   await this.ipfs!.pin.remote.add(CID.parse(this.imagesCID!), {
    //     service: "pinata",
    //   });
    // }

    return this.imagesCID!;
  }

  private async ensureContract() {
    await hre.run("compile");
  }

  async deployMetadata(force: boolean = false): Promise<string> {
    if (this.metadataCID !== undefined && !force) {
      console.warn(
        `WARN: metadata has already been deployed to IPFS (cid: ${this.metadataCID})`
      );
      return this.metadataCID;
    }

    if (this.imagesCID === undefined)
      throw new Error("Images have not been deployed to IPFS");

    await this.ensureIPFS();

    const jsonDir = path.join(this.outputDir, "json");
    const jsonFiles = (await fs.promises.readdir(jsonDir))
      .filter((file) => !file.startsWith("."))
      .map((fileName) => ({
        path: path.join("json", fileName),
        content: fs.createReadStream(path.join(jsonDir, fileName)),
      }));

    await this.ensureIPFS();

    for await (const result of this.ipfs!.addAll(jsonFiles))
      if (result.path == "json") this.metadataCID = result.cid.toString();

    // if (process.env.PINATA_KEY !== undefined) {
    //   await this.ipfs!.pin.remote.add(CID.parse(this.metadataCID!), {
    //     service: "pinata",
    //   });
    // }

    return this.metadataCID!;
  }

  // ! TODO: Implement
  async deployContract(force: boolean = false): Promise<string> {
    if (this.contractAddress !== undefined && !force) {
      console.warn(
        `WARN: contract has already been deployed (address: ${this.contractAddress})`
      );
      return this.contractAddress;
    }

    await this.ensureContract();

    const contractArgs = {
      name: this.configuration.name,
      symbol: this.configuration.symbol,
      initBaseURI: `ipfs://${this.metadataCID}/`,
      initNotRevealedURI: `ipfs://${this.metadataCID}/`,
    };

    this.contractAddress = await hre.run("deploy", contractArgs);

    await this.verifyContract();

    return this.contractAddress!;
  }

  async verifyContract(): Promise<void> {
    const contractArgs = {
      name: this.configuration.name,
      symbol: this.configuration.symbol,
      initBaseURI: `ipfs://${this.metadataCID}/`,
      initNotRevealedURI: `ipfs://${this.metadataCID}/`,
    };

    await hre.run("verify:verify", {
      address: this.contractAddress,
      constructorArguments: [
        contractArgs.name,
        contractArgs.symbol,
        contractArgs.initBaseURI,
        contractArgs.initNotRevealedURI,
      ],
    });
  }
}
