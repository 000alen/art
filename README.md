# Art

## `interface IConfiguration`

```typescript
{
    name: "Test Collection",
    description: "This is just a test collection.",

    width: 512,
    height: 512,

    generateBackground: true,

    layers: [
        "Eyeball",
        "Eye color",
        "Iris",
        "Shine",
    ]
};
```

## `interface ITrait`

```typescript
{
    trait: "Eyeball",
    value: "White"
}
```

## `interface IAttribute`

```typescript
type IAttribute = ITrait[];
```

## `interface IMetadata`

```typescript
{
  name: "Collection name",
  description: "Just a collection description",
  image: "ipfs://${cid}/1.png",
  dna: "${dna}",
  edition: 4,
  date: 1644516248675,
  attributes: IAttribute[],
  compiler: "Art Engine"
}
```

## `class NFTFactory`

### `constructor(configuration: IConfiguration, inputDir: string)`

### `sample(n: number) -> IAttribute[]`

### `generateAttributes(n: number) -> IAttribute[]`

### `generateMetadata(attributes: IAttributes[], uri: string) -> IMetadata`

### `renderImages(attributes: IAttributes[]) -> Iterator<Buffer>`
