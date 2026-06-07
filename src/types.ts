export interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  coverImage: string;
  badge?: string;
  perks: string[];
}

export type ActivePage = 'home' | 'plans-pricing' | 'fitness-tools' | 'contact-us';

export type ActivityLevel = 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'extra-active';

export interface TDEEInput {
  age: number;
  gender: 'male' | 'female';
  weight: number; // in kg
  height: number; // in cm
  activity: ActivityLevel;
}

export interface MacroSplit {
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
}
