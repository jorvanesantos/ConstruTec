import { CalculationResult, SavedBudget } from './types';

export function budgetCalculations(budget: SavedBudget): CalculationResult[] {
  return budget.calculationResults?.length ? budget.calculationResults : [budget.calculationResult];
}

export function budgetTotal(budget: SavedBudget): number {
  return Math.round(budgetCalculations(budget).reduce((sum, calculation) => sum + calculation.totalEstimatedCost, 0) * 100) / 100;
}
