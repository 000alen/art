export declare function randomColor(): number;
export declare function rarity(elementName: string): number;
export declare function rarityWeightedChoice(layerElements: {
    name: string;
    rarity: number;
}[], temperature?: number, randomFunction?: () => number, influence?: number): string | null | undefined;
