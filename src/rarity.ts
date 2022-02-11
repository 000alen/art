// import path from "path";

// const rarityDelimiter = "#";

// export const DNA_DELIMITER = "-";

// export function removeQueryStrings(_dna: string) {
//   const query = /(\?.*$)/;
//   return _dna.replace(query, "");
// }

// export function cleanDNA(dna: string) {
//   const withoutOptions = removeQueryStrings(dna);
//   return Number(withoutOptions.split(":").shift());
// }

// export function constructLayersFromDNA(
//   dna = "",
//   layers: Layer[] = []
// ): Layer[] {
//   let mappedDnaToLayers = layers.map((layer, index) => {
//     let selectedElement = layer.elements!.find((element) => {
//       return element.id == cleanDNA(dna.split(DNA_DELIMITER)[index]);
//     });
//     return {
//       name: layer.name,
//       blend: layer.blend,
//       opacity: layer.opacity,
//       selectedElement: selectedElement,
//     };
//   });
//   return mappedDnaToLayers;
// }

// export function filterDNAOptions(dna: string) {
//   const dnaItems = dna.split(DNA_DELIMITER);
//   const filteredDNA = dnaItems.filter((element) => {
//     const query = /(\?.*$)/;
//     const querystring = query.exec(element);
//     if (!querystring) {
//       return true;
//     }
//     const options = querystring[1].split("&").reduce((r, setting) => {
//       const keyPairs = setting.split("=");
//       return { ...r, [keyPairs[0]]: keyPairs[1] };
//     }, []);

//     // @ts-ignore
//     return options.bypassDNA;
//   });

//   return filteredDNA.join(DNA_DELIMITER);
// }

// export function isDNAUnique(dnaList = new Set<string>(), dna = "") {
//   return !dnaList.has(filterDNAOptions(dna));
// }

// export function generateDNA(layers: Layer[]) {
//   let randNum: string[] = [];
//   layers.forEach((layer) => {
//     const totalWeight = layer.elements!.reduce(
//       (acc, element) => acc + element.weight,
//       0
//     );

//     // number between 0 - totalWeight
//     let randomWeight = Math.floor(Math.random() * totalWeight);

//     for (var i = 0; i < layer.elements!.length; i++) {
//       // subtract the current weight from the random weight until we reach a sub zero value.
//       randomWeight -= layer.elements![i].weight;

//       if (randomWeight <= 0) {
//         return randNum.push(
//           `${layer.elements![i].id}:${layer.elements![i].filename}`
//         );
//       }
//     }
//   });
//   return randNum.join(DNA_DELIMITER);
// }

// function getRarityWeight(fileName: string) {
//   const fileNameWithoutExtension = path.parse(fileName).name;
//   let rarity = Number(fileNameWithoutExtension.split(rarityDelimiter).pop());
//   if (isNaN(rarity)) rarity = 1;
//   return rarity;
// }
