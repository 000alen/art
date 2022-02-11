// Source: https://github.com/parmentf/random-weighted-choice
export function rarityWeightedChoice(
  layerElements: { name: string; rarity: number }[],
  temperature = 50,
  randomFunction = Math.random,
  influence = 2
) {
  const T = (temperature - 50) / 50;
  const nb = layerElements.length;
  if (!nb) return null;

  const total = layerElements.reduce(
    (previousTotal, element) => previousTotal + element.rarity,
    0
  );

  const avg = total / nb;

  const ur: { [name: string]: number } = {};
  const urgencySum = layerElements.reduce((previousSum, element) => {
    const { name, rarity } = element;
    let urgency = rarity + T * influence * (avg - rarity);
    if (urgency < 0) urgency = 0;
    ur[name] = (ur[name] || 0) + urgency;
    return previousSum + urgency;
  }, 0);

  let currentUrgency = 0;
  const cumulatedUrgencies: { [name: string]: number } = {};
  Object.keys(ur).forEach((id) => {
    currentUrgency += ur[id];
    cumulatedUrgencies[id] = currentUrgency;
  });

  if (urgencySum <= 0) return null;

  const choice = randomFunction() * urgencySum;
  const names = Object.keys(cumulatedUrgencies);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const urgency = cumulatedUrgencies[name];
    if (choice <= urgency) {
      return name;
    }
  }
}
