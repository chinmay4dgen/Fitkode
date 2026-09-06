import { MealItem, MeasurementSystem } from '../types';

export interface ParsedPortion {
  quantity: number;
  unit: string;
  displaySuffix?: string;
}

export interface DetailedPortion {
  countQuantity: number;
  countUnit: string;
  siQuantity: number;
  siUnit: 'g' | 'ml';
  unitWeight: number; // weight in grams or ml per 1 unit
  preferredMode: MeasurementSystem;
}

/**
 * Knowledge base of standard unit weights for common ingredients.
 * Enables automatic conversion between Count (units/pcs/eggs) and SI units (g/ml).
 */
export function getStandardFoodMetrics(foodName: string, servingSizeStr?: string): {
  unitWeight: number;
  countUnit: string;
  siUnit: 'g' | 'ml';
  isCountDefault: boolean;
} {
  const name = (foodName || '').toLowerCase();
  const serving = (servingSizeStr || '').toLowerCase();

  // 1. Eggs
  if (name.includes('egg white')) {
    return { unitWeight: 32.5, countUnit: 'whites', siUnit: 'g', isCountDefault: true };
  }
  if (name.includes('egg')) {
    return { unitWeight: 50, countUnit: 'eggs', siUnit: 'g', isCountDefault: true };
  }

  // 2. Roti / Chapati / Bread
  if (name.includes('roti') || name.includes('chapati') || name.includes('phulka')) {
    return { unitWeight: 30, countUnit: 'rotis', siUnit: 'g', isCountDefault: true };
  }
  if (name.includes('bread') || name.includes('toast') || name.includes('slice')) {
    return { unitWeight: 30, countUnit: 'slices', siUnit: 'g', isCountDefault: true };
  }

  // 3. Protein Powders / Scoops
  if (name.includes('whey') || name.includes('protein blend') || serving.includes('scoop')) {
    return { unitWeight: 30, countUnit: 'scoops', siUnit: 'g', isCountDefault: true };
  }

  // 4. Whole Fruits
  if (name.includes('apple')) {
    return { unitWeight: 150, countUnit: 'units', siUnit: 'g', isCountDefault: true };
  }
  if (name.includes('banana')) {
    return { unitWeight: 100, countUnit: 'units', siUnit: 'g', isCountDefault: true };
  }
  if (name.includes('sweet potato') || name.includes('potato')) {
    return { unitWeight: 150, countUnit: 'units', siUnit: 'g', isCountDefault: false };
  }
  if (name.includes('orange') || name.includes('citrus')) {
    return { unitWeight: 130, countUnit: 'units', siUnit: 'g', isCountDefault: true };
  }

  // 5. Nuts & Seeds
  if (name.includes('almond')) {
    return { unitWeight: 1.2, countUnit: 'nuts', siUnit: 'g', isCountDefault: false };
  }
  if (name.includes('walnut')) {
    return { unitWeight: 2.5, countUnit: 'halves', siUnit: 'g', isCountDefault: false };
  }
  if (name.includes('peanut butter')) {
    return { unitWeight: 16, countUnit: 'tbsp', siUnit: 'g', isCountDefault: false };
  }
  if (name.includes('ghee') || name.includes('oil')) {
    return { unitWeight: 5, countUnit: 'tsp', siUnit: 'g', isCountDefault: false };
  }
  if (name.includes('chia') || name.includes('seed')) {
    return { unitWeight: 12, countUnit: 'tbsp', siUnit: 'g', isCountDefault: false };
  }

  // 6. Milks & Liquids (SI unit is ml)
  if (name.includes('milk') || name.includes('shake')) {
    return { unitWeight: 240, countUnit: 'glasses', siUnit: 'ml', isCountDefault: false };
  }

  // 7. Grains, Dals, Bowls
  if (name.includes('rice') || name.includes('quinoa')) {
    return { unitWeight: 150, countUnit: 'cups', siUnit: 'g', isCountDefault: false };
  }
  if (name.includes('dal') || name.includes('curry')) {
    return { unitWeight: 180, countUnit: 'bowls', siUnit: 'g', isCountDefault: false };
  }
  if (name.includes('oats')) {
    return { unitWeight: 50, countUnit: 'bowls', siUnit: 'g', isCountDefault: false };
  }
  if (name.includes('yogurt') || name.includes('curd')) {
    return { unitWeight: 150, countUnit: 'cups', siUnit: 'g', isCountDefault: false };
  }
  if (name.includes('salad')) {
    return { unitWeight: 200, countUnit: 'bowls', siUnit: 'g', isCountDefault: false };
  }

  // 8. Solid Proteins
  if (name.includes('paneer') || name.includes('cottage cheese')) {
    return { unitWeight: 50, countUnit: 'units', siUnit: 'g', isCountDefault: false };
  }
  if (name.includes('tofu')) {
    return { unitWeight: 50, countUnit: 'units', siUnit: 'g', isCountDefault: false };
  }
  if (name.includes('chicken')) {
    return { unitWeight: 100, countUnit: 'units', siUnit: 'g', isCountDefault: false };
  }
  if (name.includes('fish')) {
    return { unitWeight: 150, countUnit: 'units', siUnit: 'g', isCountDefault: false };
  }
  if (name.includes('soya')) {
    return { unitWeight: 50, countUnit: 'bowls', siUnit: 'g', isCountDefault: false };
  }

  // General fallback
  const isMl = serving.includes('ml') || serving.includes('liter');
  return {
    unitWeight: 50,
    countUnit: 'units',
    siUnit: isMl ? 'ml' : 'g',
    isCountDefault: false,
  };
}

/**
 * Parses portion string into detailed SI and Count representations.
 * Handles strings like:
 * - "2 eggs (100g)"
 * - "1 scoop (30g)"
 * - "2 medium rotis (60g flour)"
 * - "1 medium (150g)"
 * - "1 glass (240ml)"
 * - "100g"
 * - "2 units"
 */
export function parsePortionDetailed(portionStr: string, foodName = ''): DetailedPortion {
  const fallback = getStandardFoodMetrics(foodName, portionStr);
  if (!portionStr || typeof portionStr !== 'string') {
    return {
      countQuantity: 1,
      countUnit: fallback.countUnit,
      siQuantity: fallback.unitWeight,
      siUnit: fallback.siUnit,
      unitWeight: fallback.unitWeight,
      preferredMode: fallback.isCountDefault ? 'count' : 'si',
    };
  }

  const cleaned = portionStr.trim();

  // Pattern A: "2 eggs (100g)" or "1 scoop (30g)" or "2 medium rotis (60g flour)"
  const parenSiMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?.*?\((\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams|ml|milliliter|milliliters)\b/i);
  if (parenSiMatch) {
    const count = parseFloat(parenSiMatch[1]);
    const rawCountUnit = (parenSiMatch[2] || fallback.countUnit).toLowerCase();
    const si = parseFloat(parenSiMatch[3]);
    const rawSiUnit = parenSiMatch[4].toLowerCase().startsWith('m') ? 'ml' : 'g';
    const computedUnitWeight = count > 0 && si > 0 ? Number((si / count).toFixed(1)) : fallback.unitWeight;

    return {
      countQuantity: count,
      countUnit: rawCountUnit === 'medium' ? 'units' : rawCountUnit,
      siQuantity: si,
      siUnit: rawSiUnit as 'g' | 'ml',
      unitWeight: computedUnitWeight,
      preferredMode: 'count', // user explicitly defined count in front
    };
  }

  // Pattern B: Count only, e.g. "2 units", "2 eggs", "3 scoops", "2 rotis", "1 apple"
  const countOnlyMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*(unit|units|piece|pieces|pcs|egg|eggs|roti|rotis|scoop|scoops|slice|slices|cup|cups|bowl|bowls|portion|portions)\b/i);
  if (countOnlyMatch) {
    const count = parseFloat(countOnlyMatch[1]);
    const countUnit = countOnlyMatch[2].toLowerCase();
    const si = Number((count * fallback.unitWeight).toFixed(1));
    return {
      countQuantity: count,
      countUnit,
      siQuantity: si,
      siUnit: fallback.siUnit,
      unitWeight: fallback.unitWeight,
      preferredMode: 'count',
    };
  }

  // Pattern C: Plain SI grams or ml inside string, e.g. "100g", "150 gm", "240ml"
  const siMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams|ml|milliliter|milliliters)\b/i);
  if (siMatch) {
    const si = parseFloat(siMatch[1]);
    const siUnit = siMatch[2].toLowerCase().startsWith('m') ? 'ml' : 'g';
    const count = Number((si / fallback.unitWeight).toFixed(1));
    return {
      countQuantity: count > 0 ? count : 1,
      countUnit: fallback.countUnit,
      siQuantity: si,
      siUnit: siUnit as 'g' | 'ml',
      unitWeight: fallback.unitWeight,
      preferredMode: fallback.isCountDefault ? 'count' : 'si',
    };
  }

  // Pattern D: Generic number leading, e.g. "2"
  const numMatch = cleaned.match(/^(\d+(?:\.\d+)?)/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);
    if (num <= 10) {
      // Small number -> assume count
      return {
        countQuantity: num,
        countUnit: fallback.countUnit,
        siQuantity: Number((num * fallback.unitWeight).toFixed(1)),
        siUnit: fallback.siUnit,
        unitWeight: fallback.unitWeight,
        preferredMode: 'count',
      };
    }
    // Larger number -> assume grams
    return {
      countQuantity: Number((num / fallback.unitWeight).toFixed(1)),
      countUnit: fallback.countUnit,
      siQuantity: num,
      siUnit: fallback.siUnit,
      unitWeight: fallback.unitWeight,
      preferredMode: 'si',
    };
  }

  return {
    countQuantity: 1,
    countUnit: fallback.countUnit,
    siQuantity: fallback.unitWeight,
    siUnit: fallback.siUnit,
    unitWeight: fallback.unitWeight,
    preferredMode: fallback.isCountDefault ? 'count' : 'si',
  };
}

/**
 * Standard legacy portion parser preserved for backwards compatibility.
 */
export function parsePortion(portionStr: string): ParsedPortion {
  if (!portionStr || typeof portionStr !== 'string') {
    return { quantity: 100, unit: 'g' };
  }

  const detailed = parsePortionDetailed(portionStr);
  if (detailed.preferredMode === 'count') {
    return { quantity: detailed.countQuantity, unit: detailed.countUnit };
  }
  return { quantity: detailed.siQuantity, unit: detailed.siUnit };
}

/**
 * Ensures an item has base reference nutrition data, SI metrics, and count metrics attached.
 */
export function ensureBaseNutrition(
  item: MealItem,
  fallbackLibItem?: {
    name?: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    servingSize: string;
  }
): MealItem {
  const servingStr = item.servingSize || fallbackLibItem?.servingSize || '100g';
  const foodName = item.name || fallbackLibItem?.name || '';
  const detailed = parsePortionDetailed(servingStr, foodName);

  const unitWeight = item.unitWeight ?? detailed.unitWeight;
  const countUnitName = item.countUnitName || detailed.countUnit || 'units';
  const siUnitName = (item.siUnitName as 'g' | 'ml') || detailed.siUnit || 'g';

  // Determine current measurement mode
  let measurementType: MeasurementSystem =
    item.measurementType ||
    (item.unit === 'units' ||
    item.unit === 'eggs' ||
    item.unit === 'rotis' ||
    item.unit === 'scoops' ||
    item.unit === 'slices' ||
    item.unit === 'pcs' ||
    item.unit === 'pieces'
      ? 'count'
      : item.unit === 'g' || item.unit === 'ml'
      ? 'si'
      : detailed.preferredMode);

  // If item already has a quantity and unit, respect it
  let activeQuantity = item.quantity;
  let activeUnit = item.unit;

  if (activeQuantity === undefined || activeQuantity === null) {
    if (measurementType === 'count') {
      activeQuantity = detailed.countQuantity;
      activeUnit = detailed.countUnit;
    } else {
      activeQuantity = detailed.siQuantity;
      activeUnit = detailed.siUnit;
    }
  }

  // Reference base macros
  const baseCal = item.baseCalories ?? fallbackLibItem?.calories ?? item.calories;
  const basePro = item.baseProtein ?? fallbackLibItem?.protein ?? item.protein;
  const baseCarb = item.baseCarbs ?? fallbackLibItem?.carbs ?? item.carbs;
  const baseFat = item.baseFats ?? fallbackLibItem?.fats ?? item.fats;

  // Reference base quantity: in SI amount to provide reliable invariant ratio
  const baseQuantity =
    item.baseQuantity && item.baseQuantity > 0
      ? item.baseQuantity
      : detailed.siQuantity > 0
      ? detailed.siQuantity
      : 100;

  return {
    ...item,
    measurementType,
    quantity: activeQuantity,
    unit: activeUnit || (measurementType === 'count' ? countUnitName : siUnitName),
    unitWeight,
    countUnitName,
    siUnitName,
    baseQuantity,
    baseUnit: item.baseUnit || detailed.siUnit || 'g',
    baseMeasurementType: item.baseMeasurementType || detailed.preferredMode,
    baseCalories: baseCal,
    baseProtein: basePro,
    baseCarbs: baseCarb,
    baseFats: baseFat,
    baseServingSize: item.baseServingSize || fallbackLibItem?.servingSize || item.servingSize,
  };
}

/**
 * Format standard serving label based on quantity and unit.
 * E.g.: "2 units (100g)" or "100g (2 units)" or "3 eggs (150g)"
 */
export function formatServingLabel(
  quantity: number,
  unit: string,
  measurementType: MeasurementSystem,
  unitWeight: number,
  siUnit = 'g'
): string {
  const safeQty = Math.max(0, quantity);
  if (measurementType === 'count') {
    const siEquiv = Math.round(safeQty * unitWeight);
    return `${safeQty} ${unit} (${siEquiv}${siUnit})`;
  } else {
    const countEquiv = Number((safeQty / (unitWeight > 0 ? unitWeight : 50)).toFixed(1));
    return `${safeQty}${unit} (${countEquiv} units)`;
  }
}

/**
 * Recalculates calories and macros for an item based on a new numeric quantity and/or unit.
 * Handles both SI units (g, ml) and Count units (units, eggs, rotis, etc.).
 */
export function scaleNutritionByQuantity(
  item: MealItem,
  newQuantity: number,
  newUnit?: string
): MealItem {
  const initialized = ensureBaseNutrition(item);
  const targetUnit = (newUnit || initialized.unit || 'g').toLowerCase();

  const isCountUnit =
    targetUnit === 'units' ||
    targetUnit === 'unit' ||
    targetUnit === 'pcs' ||
    targetUnit === 'pieces' ||
    targetUnit === 'eggs' ||
    targetUnit === 'egg' ||
    targetUnit === 'rotis' ||
    targetUnit === 'roti' ||
    targetUnit === 'scoops' ||
    targetUnit === 'scoop' ||
    targetUnit === 'slices' ||
    targetUnit === 'slice' ||
    targetUnit === 'cups' ||
    targetUnit === 'cup' ||
    targetUnit === 'bowls' ||
    targetUnit === 'bowl' ||
    targetUnit === 'nuts' ||
    targetUnit === 'halves' ||
    targetUnit === 'tbsp' ||
    targetUnit === 'tsp';

  const measurementType: MeasurementSystem = isCountUnit ? 'count' : 'si';
  const unitWeight = initialized.unitWeight || 50;
  const safeQty = Math.max(0, newQuantity);

  // Convert quantity to SI equivalent to compare with baseQuantity
  let currentSIEquiv: number;
  if (measurementType === 'count') {
    currentSIEquiv = safeQty * unitWeight;
  } else {
    currentSIEquiv = safeQty;
  }

  // Calculate scaling ratio
  const baseSI = initialized.baseQuantity || 100;
  const ratio = baseSI > 0 ? currentSIEquiv / baseSI : 1;

  const baseCal = initialized.baseCalories ?? initialized.calories;
  const basePro = initialized.baseProtein ?? initialized.protein;
  const baseCarb = initialized.baseCarbs ?? initialized.carbs;
  const baseFat = initialized.baseFats ?? initialized.fats;

  const scaledCalories = Math.round(baseCal * ratio);
  const scaledProtein = Number((basePro * ratio).toFixed(1));
  const scaledCarbs = Number((baseCarb * ratio).toFixed(1));
  const scaledFats = Number((baseFat * ratio).toFixed(1));

  const updatedServingSize = formatServingLabel(
    safeQty,
    targetUnit,
    measurementType,
    unitWeight,
    initialized.siUnitName || 'g'
  );

  return {
    ...initialized,
    measurementType,
    quantity: safeQty,
    unit: targetUnit,
    servingSize: updatedServingSize,
    calories: scaledCalories,
    protein: scaledProtein,
    carbs: scaledCarbs,
    fats: scaledFats,
  };
}

/**
 * Switches an item between SI unit of measurement (g/ml) and Count (units/pcs/eggs).
 * Immediately recalculates and converts the displayed numeric quantity without altering
 * nutritional macros.
 */
export function switchItemMeasurementSystem(
  item: MealItem,
  targetSystem: MeasurementSystem,
  targetSpecificUnit?: string
): MealItem {
  const initialized = ensureBaseNutrition(item);
  const currentSystem = initialized.measurementType || 'si';
  const unitWeight = initialized.unitWeight || 50;
  const currentQty = initialized.quantity ?? 1;

  if (currentSystem === targetSystem) {
    if (targetSpecificUnit && targetSpecificUnit !== initialized.unit) {
      return scaleNutritionByQuantity(initialized, currentQty, targetSpecificUnit);
    }
    return initialized;
  }

  if (targetSystem === 'count') {
    // Convert from SI (e.g. 100g) to Count (e.g. 2 units)
    const convertedCount = Number((currentQty / unitWeight).toFixed(1));
    const countUnit = targetSpecificUnit || initialized.countUnitName || 'units';
    const updatedServing = formatServingLabel(
      convertedCount,
      countUnit,
      'count',
      unitWeight,
      initialized.siUnitName || 'g'
    );

    return {
      ...initialized,
      measurementType: 'count',
      quantity: convertedCount,
      unit: countUnit,
      servingSize: updatedServing,
    };
  } else {
    // Convert from Count (e.g. 2 units) to SI (e.g. 100g)
    const convertedSI = Math.round(currentQty * unitWeight);
    const siUnit = targetSpecificUnit || initialized.siUnitName || 'g';
    const updatedServing = formatServingLabel(
      convertedSI,
      siUnit,
      'si',
      unitWeight,
      siUnit
    );

    return {
      ...initialized,
      measurementType: 'si',
      quantity: convertedSI,
      unit: siUnit,
      servingSize: updatedServing,
    };
  }
}

/**
 * Handles text change in the serving size input field.
 * If user changes text from "50g" to "100g" or "2 units" or "3 eggs",
 * extracts the new quantity and unit and updates correlated macros.
 */
export function scaleNutritionByServingText(
  item: MealItem,
  newServingText: string
): MealItem {
  const initialized = ensureBaseNutrition(item);
  const detailed = parsePortionDetailed(newServingText, item.name);

  if (detailed.preferredMode === 'count' && detailed.countQuantity > 0) {
    const scaled = scaleNutritionByQuantity(initialized, detailed.countQuantity, detailed.countUnit);
    return {
      ...scaled,
      servingSize: newServingText,
    };
  } else if (detailed.siQuantity > 0) {
    const scaled = scaleNutritionByQuantity(initialized, detailed.siQuantity, detailed.siUnit);
    return {
      ...scaled,
      servingSize: newServingText,
    };
  }

  return {
    ...initialized,
    servingSize: newServingText,
  };
}
