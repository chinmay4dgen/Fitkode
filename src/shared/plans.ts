export interface PlanCatalogItem {
  id: string;
  name: string;
  amountInr: number;
  priceInr: number;
  grantsPaid: boolean;
}

export const PLAN_CATALOG: Record<string, PlanCatalogItem> = {
  plan_3m: {
    id: 'plan_3m',
    name: '3 Months Plan - Fitness Fundamentals',
    amountInr: 20999,
    priceInr: 20999,
    grantsPaid: true,
  },
  plan_6m: {
    id: 'plan_6m',
    name: '6 Months Plan - Comprehensive',
    amountInr: 38999,
    priceInr: 38999,
    grantsPaid: true,
  },
  plan_annual: {
    id: 'plan_annual',
    name: 'Annual Plan - Longevity & Habits Builder',
    amountInr: 71999,
    priceInr: 71999,
    grantsPaid: true,
  },
  plan_nutrition: {
    id: 'plan_nutrition',
    name: 'Diet & Nutrition Plan',
    amountInr: 3999,
    priceInr: 3999,
    grantsPaid: true,
  },
  plan_workout: {
    id: 'plan_workout',
    name: 'Workout Science Plan',
    amountInr: 3999,
    priceInr: 3999,
    grantsPaid: true,
  },
  plan_test_1: {
    id: 'plan_test_1',
    name: 'Razorpay Live Test Plan',
    amountInr: 1,
    priceInr: 1,
    grantsPaid: false,
  },
} as const;
