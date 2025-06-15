import { ActivityFactor } from "@/types/activity";
import { STEP_GOAL_THRESHOLD } from "@/app/constants";

export class ScoringService {
    /**
     * Calculate the unified activity score using the new weights:
     * steps (40%), efficiencyScore (30%), balanceScore (20%), consistencyScore (10%)
     */
    static calculateActivityScore(
        factors: { [key: string]: ActivityFactor },
        consistencyScore: number
    ): number {
        const steps = factors.steps?.value || 0;
        const stepsScore = this.calculateStepsScore(steps);
        const efficiencyScore = this.calculateEfficiencyScore(factors);
        const balanceScore = this.calculateBalanceScore(factors);
        // Consistency score is already provided
        return (
            stepsScore * 0.4 +
            efficiencyScore * 0.3 +
            balanceScore * 0.2 +
            consistencyScore * 0.1
        );
    }

    /**
     * Calculate steps score as a percentage of the step goal threshold (capped at 100)
     */
    static calculateStepsScore(steps: number): number {
        if (!steps) return 0;
        const goal = STEP_GOAL_THRESHOLD;
        const percentage = steps / goal;
        return Math.min(percentage * 100, 100);
    }

    /**
     * Calculate efficiency score based on calories burned per step
     */
    static calculateEfficiencyScore(factors: { [key: string]: ActivityFactor }): number {
        const steps = factors.steps?.value || 0;
        const calories = factors.active_calories?.value || 0;
        if (steps === 0) return 0;
        const caloriesPerStep = calories / steps;
        const avgCaloriesPerStep = 0.04;
        const efficiencyRatio = caloriesPerStep / avgCaloriesPerStep;
        return Math.min(efficiencyRatio * 50, 100);
    }

    /**
     * Calculate balance score based on activity distribution
     */
    static calculateBalanceScore(factors: { [key: string]: ActivityFactor }): number {
        const activeHours = factors.active_hours?.value || 0;
        const activeHoursGoal = factors.active_hours?.goal || 10;
        const inactivity = factors.extended_inactivity?.value || 0;
        const inactivityGoal = factors.extended_inactivity?.goal || 600;
        const intenseActivity = factors.intense_activity_duration?.value || 0;
        const activeHoursScore = Math.min((activeHours / activeHoursGoal) * 40, 40);
        const inactivityRatio = Math.min(inactivity / inactivityGoal, 2);
        const inactivityScore = Math.max(30 - (inactivityRatio * 15), 0);
        const intenseScore = Math.min(intenseActivity * 1, 30);
        return activeHoursScore + inactivityScore + intenseScore;
    }

    /**
     * Generate unified activity insights (steps + other factors + consistency)
     */
    static generateActivityInsights(
        factors: { [key: string]: ActivityFactor },
        consistencyScore: number
    ): string[] {
        return [
            ...this.generateStepsInsights(factors.steps),
            ...this.generatePointsInsights(factors, consistencyScore)
        ];
    }

    /**
     * Generate insights for non-step factors including consistency
     */
    static generatePointsInsights(
        factors: { [key: string]: ActivityFactor },
        consistencyScore: number
    ): string[] {
        const insights: string[] = [];
        const activeHours = factors.active_hours?.value || 0;
        const inactivity = factors.extended_inactivity?.value || 0;
        const calories = factors.active_calories?.value || 0;
        const steps = factors.steps?.value || 0;
        if (steps > 0) {
            const efficiency = calories / steps * 1000;
            if (efficiency >= 40) {
                insights.push(`High calorie burn efficiency: ${efficiency.toFixed(1)} cal per 1000 steps`);
            } else if (efficiency >= 30) {
                insights.push(`Moderate activity intensity: ${calories} active calories burned`);
            }
        }
        if (activeHours >= 8) {
            insights.push(`Excellent activity distribution: ${activeHours} active hours`);
        } else if (activeHours >= 6) {
            insights.push(`Good activity spread: ${activeHours} active hours throughout the day`);
        }
        if (inactivity > 900) {
            insights.push(`High inactivity: ${Math.round(inactivity / 60)} hours of extended sitting`);
        }
        if (consistencyScore >= 80) {
            insights.push('Strong consistency: improving or maintaining performance');
        } else if (consistencyScore >= 60) {
            insights.push('Moderate consistency: slight performance variation');
        } else {
            insights.push('Consistency opportunity: performance below recent average');
        }
        return insights;
    }

    /**
     * Generate steps-based insights
     */
    static generateStepsInsights(stepsFactor?: ActivityFactor): string[] {
        if (!stepsFactor) return ['No step data available'];
        const insights: string[] = [];
        const steps = stepsFactor.value;
        const percentage = (steps / STEP_GOAL_THRESHOLD) * 100;
        if (steps >= STEP_GOAL_THRESHOLD * 1.5) {
            insights.push(`Outstanding step achievement: ${steps.toLocaleString()} steps (${Math.round(percentage)}% of threshold)`);
        } else if (steps >= STEP_GOAL_THRESHOLD) {
            insights.push(`Excellent step count: ${steps.toLocaleString()} steps (${Math.round(percentage)}% of threshold)`);
        } else if (steps >= STEP_GOAL_THRESHOLD * 0.75) {
            insights.push(`Good step progress: ${steps.toLocaleString()} steps, close to threshold`);
        } else {
            insights.push(`Steps below threshold: ${steps.toLocaleString()} steps (${Math.round(percentage)}% of ${STEP_GOAL_THRESHOLD.toLocaleString()})`);
        }
        return insights;
    }
} 