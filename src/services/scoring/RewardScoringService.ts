import { ActivityFactor } from "@/types/activity";
import { STEP_GOAL_THRESHOLD } from "@/app/constants";

export class RewardScoringService {

    /**
     * Calculate reward score based purely on steps performance
     */
    static calculateRewardScore(stepsFactor?: ActivityFactor): number {
        if (!stepsFactor) return 0;

        const { value } = stepsFactor;
        const goal = STEP_GOAL_THRESHOLD;
        const percentage = value / goal;

        // Exponential scaling for steps reward
        const baseScore = (1 - Math.exp(-3 * percentage)) * 100;

        // Bonus for exceeding threshold
        const exceedanceBonus = percentage > 1 ? Math.min((percentage - 1) * 20, 10) : 0;

        return Math.min(baseScore + exceedanceBonus, 100);
    }

    /**
     * Get steps-based insights
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