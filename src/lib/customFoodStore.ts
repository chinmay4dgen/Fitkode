import { MealItem } from '../types';

/**
 * Storage manager for User-Specific Custom Food items.
 *
 * CRITICAL RULE:
 * Custom added food items MUST NEVER be inserted into the master database
 * of ICMR, US FDA, and INFS approved food items.
 * They are stored strictly at the user profile level (keyed by user email)
 * and are only usable and visible by the user who uploaded the custom food item.
 */

function getStorageKey(userEmail?: string): string {
  const normalized = (userEmail || 'guest_user').toLowerCase().trim();
  return `fitkode_user_custom_foods_${normalized}`;
}

export function loadUserCustomFoods(userEmail?: string): MealItem[] {
  try {
    const key = getStorageKey(userEmail);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        ...item,
        isCustom: true,
      }));
    }
    return [];
  } catch (err) {
    console.error('Error reading user custom foods from storage:', err);
    return [];
  }
}

export function saveUserCustomFood(
  userEmail: string,
  food: Omit<MealItem, 'id'> & { id?: string }
): MealItem[] {
  try {
    const current = loadUserCustomFoods(userEmail);
    const now = Date.now();
    const customFood: MealItem = {
      ...food,
      id: food.id || `custom_food_${now}_${Math.random().toString(36).substr(2, 5)}`,
      isCustom: true,
      measurementType: food.measurementType || (food.unit === 'g' || food.unit === 'ml' ? 'si' : 'count'),
      quantity: food.quantity ?? 100,
      unit: food.unit || 'g',
      unitWeight: food.unitWeight ?? (food.measurementType === 'count' && food.quantity ? (food.baseQuantity || 100) / food.quantity : 50),
      countUnitName: food.countUnitName || (food.measurementType === 'count' ? food.unit : 'units'),
      siUnitName: food.siUnitName || (food.unit === 'ml' ? 'ml' : 'g'),
      baseQuantity: food.baseQuantity ?? food.quantity ?? 100,
      baseUnit: food.baseUnit || food.unit || 'g',
      baseMeasurementType: food.baseMeasurementType || food.measurementType,
      baseCalories: food.baseCalories ?? food.calories,
      baseProtein: food.baseProtein ?? food.protein,
      baseCarbs: food.baseCarbs ?? food.carbs,
      baseFats: food.baseFats ?? food.fats,
      baseServingSize: food.baseServingSize || food.servingSize,
    };

    const existingIdx = current.findIndex((item) => item.id === customFood.id);
    let updated: MealItem[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = customFood;
    } else {
      updated = [customFood, ...current];
    }

    const key = getStorageKey(userEmail);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving user custom food to storage:', err);
    return loadUserCustomFoods(userEmail);
  }
}

export function deleteUserCustomFood(userEmail: string, foodId: string): MealItem[] {
  try {
    const current = loadUserCustomFoods(userEmail);
    const updated = current.filter((item) => item.id !== foodId);
    const key = getStorageKey(userEmail);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error deleting user custom food:', err);
    return loadUserCustomFoods(userEmail);
  }
}
