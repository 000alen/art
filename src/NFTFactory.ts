import { IAttributes, IConfiguration } from "./types";
import fs from "fs";
import path from "path";
import Jimp from "jimp";

export class NFTFactory {
  private layers: Map<string, { name: string; rarity: number }[]>;
  private elements: Map<string, { rarity: number; buffer?: Buffer }>;

  constructor(
    public configuration: IConfiguration,
    public inputDir: string,
    public outputDir: string
  ) {
    this.layers = new Map<string, { name: string; rarity: number }[]>();
    this.elements = new Map<string, { rarity: number; buffer?: Buffer }>();
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
            buffer: undefined,
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

  generateMetadata(attributes: IAttributes[]) {}

  composeImages(back: Jimp, front: Jimp): Jimp {
    back.composite(front, 0, 0);
    return back;
  }

  private ensureBuffer(elementKey: string) {
    if (
      !this.elements.has(elementKey) ||
      this.elements.get(elementKey)!.buffer === undefined
    ) {
      const buffer = fs.readFileSync(path.join(this.inputDir, elementKey));

      if (this.elements.has(elementKey))
        this.elements.get(elementKey)!.buffer = buffer;
      else
        this.elements.set(elementKey, {
          rarity: 1, // ! TODO: Compute rarity
          buffer,
        });
    }
  }

  async generateImages(attributes: IAttributes[]) {
    for (let i = 0; i < attributes.length; i++) {
      const traits = attributes[i];

      let image = await Jimp.create(
        this.configuration.width,
        this.configuration.height,
        "#ffffff"
      );

      for (let j = 0; j < traits.length; j++) {
        const trait = traits[j];

        const elementKey = path.join(trait.name, trait.value);
        this.ensureBuffer(elementKey);

        const currentImage = await Jimp.read(
          this.elements.get(elementKey)!.buffer!
        );

        image = this.composeImages(image, currentImage);
      }

      image.write(path.join(this.outputDir, "images", `${i}.png`));
    }
  }
}
