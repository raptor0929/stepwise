import { ActivityFactor } from "@/types/activity";

export class PointsScoringService {
    /**
     * Calculate points score based on all non-step factors including consistency
     */
    static calculatePointsScore(
        factors: { [key: string]: ActivityFactor },
        consistencyScore: number
    ): number {
        const efficiencyScore = this.calculateEfficiencyScore(factors);
        const balanceScore = this.calculateBalanceScore(factors);

        // Weight the components for points score (including consistency)
        return (
            efficiencyScore * 0.4 +
            balanceScore * 0.35 +
            consistencyScore * 0.25
        );
    }

    /**
     * Calculate efficiency score based on calories burned per step
     */
    private static calculateEfficiencyScore(factors: { [key: string]: ActivityFactor }): number {
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
    private static calculateBalanceScore(factors: { [key: string]: ActivityFactor }): number {
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
}