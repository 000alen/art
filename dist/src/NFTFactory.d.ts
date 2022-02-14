import { IAttributes, IConfiguration, IInstance } from "./types";
export declare class NFTFactory {
    configuration: IConfiguration;
    inputDir: string;
    outputDir: string;
    private layers;
    private buffers;
    private ipfs?;
    imagesCID?: string;
    metadataCID?: string;
    contractAddress?: string;
    constructor(configuration: IConfiguration, inputDir: string, outputDir: string);
    get maxCombinations(): number;
    get instance(): IInstance;
    loadInstance({ imagesCID, metadataCID, contractAddress }: IInstance): void;
    loadLayers(): Promise<void>;
    bootstrapOutput(): Promise<void>;
    generateRandomAttributes(n: number): IAttributes[];
    generateAllAttributes(): IAttributes[];
    private composeImages;
    private ensureBuffer;
    generateImages(attributes: IAttributes[]): Promise<void>;
    generateMetadata(cid: string, attributes: IAttributes[]): Promise<void>;
    private ensureIPFS;
    deployImages(force?: boolean): Promise<string>;
    private ensureContract;
    deployMetadata(force?: boolean): Promise<string>;
    deployContract(force?: boolean): Promise<string>;
    verifyContract(): Promise<void>;
}
