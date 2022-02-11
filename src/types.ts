export interface IConfiguration {
  name: string;
  description: string;
  width: number;
  height: number;
  generateBackground: boolean;
  layers: string[];
}

export interface ITrait {
  name: string;
  value: string;
}

export type IAttributes = ITrait[];

export interface IMetadata {
  name: string;
  description: string;
  image: string;
  edition: number;
  date: number;
  attributes: IAttributes;
  compiler: string;
  dna: string;
}
