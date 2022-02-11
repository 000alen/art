import { IAttributes, IConfiguration, IMetadata } from "./types";
import fs from "fs";
import path from "path";
import Jimp from "jimp";
import { randomColor } from "./utils";

export class NFTFactory {
  private layers: Map<string, { name: string; rarity: number }[]>;
  private buffers: Map<string, Buffer>;

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
            rarity: 1, // ! TODO: Compute rarity
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

  // ! TODO: Probability distribution is uniform; should consider element's rarity
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
        const layerElement =
          layerElements[Math.floor(Math.random() * layerElements.length)];

        attribute.push({
          name: layerName,
          value: layerElement.name,
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

  private ensureBuffer(elementKey: string) {
    if (!this.buffers.has(elementKey)) {
      const buffer = fs.readFileSync(path.join(this.inputDir, elementKey));
      this.buffers.set(elementKey, buffer);
    }
  }

  async generateImages(attributes: IAttributes[]) {
    for (let i = 0; i < attributes.length; i++) {
      const traits = attributes[i];

      const image = await Jimp.create(
        this.configuration.width,
        this.configuration.height,
        this.configuration.generateBackground
          ? randomColor()
          : this.configuration.defaultBackground || 0xffffff
      );

      for (let j = 0; j < traits.length; j++) {
        const trait = traits[j];

        const elementKey = path.join(trait.name, trait.value);
        this.ensureBuffer(elementKey);

        const current = await Jimp.read(this.buffers.get(elementKey)!);

        this.composeImages(image, current);
      }

      await image.writeAsync(path.join(this.outputDir, "images", `${i}.png`));
    }
  }

  async generateMetadata(attributes: IAttributes[]) {
    const metadatas: IMetadata[] = [];
    for (let i = 0; i < attributes.length; i++) {
      const traits = attributes[i];

      const metadata: IMetadata = {
        name: this.configuration.name,
        description: this.configuration.description,
        image: `${i}.png`, // ! TODO: Use URI
        edition: i,
        date: Date.now(),
        attributes: traits, // ! TODO: Format attributes
      };
      metadatas.push(metadata);

      await fs.promises.writeFile(
        path.join(this.outputDir, "json", `${i}.json`),
        JSON.stringify(metadata)
      );
    }

    await fs.promises.writeFile(
      path.join(this.outputDir, "json", "metadata.json"),
      JSON.stringify(metadatas)
    );
  }
}
