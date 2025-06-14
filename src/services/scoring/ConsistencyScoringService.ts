import { ActivityLog } from "@/types/activity";

export class ConsistencyScoringService {
    /**
     * Calculate consistency bonus based on performance relative to recent days
     */
    static calculateConsistencyBonus(currentLog: ActivityLog, userLogs: ActivityLog[]): number {
        const currentDate = new Date(currentLog.scoreDateTime);
        const steps = currentLog.factors.find(f => f.name === 'steps')?.value || 0;

        // Get previous 3 days for comparison
        const recentLogs = userLogs
            .filter(l => {
                const logDate = new Date(l.scoreDateTime);
                const daysDiff = (currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
                return daysDiff > 0 && daysDiff <= 3;
            })
            .sort((a, b) => new Date(b.scoreDateTime).getTime() - new Date(a.scoreDateTime).getTime())
            .slice(0, 3);

        if (recentLogs.length === 0) return 50;

        const recentSteps = recentLogs.map(l => l.factors.find(f => f.name === 'steps')?.value || 0);
        const avgRecentSteps = recentSteps.reduce((sum, s) => sum + s, 0) / recentSteps.length;

        if (avgRecentSteps === 0) return 50;

        const improvementRatio = steps / avgRecentSteps;

        if (improvementRatio >= 1.2) return 100;
        if (improvementRatio >= 1.0) return 80;
        if (improvementRatio >= 0.8) return 60;
        return 40;
    }

    /**
     * Calculate a weekly consistency score based on the standard deviation of daily steps.
     * Lower stddev = higher consistency. Score is 100 for perfect consistency, lower for more variance.
     */
    static calculateWeeklyConsistencyBonus(logs: ActivityLog[]): number {
        if (!logs || logs.length === 0) return 50;
        const stepsArr = logs.map(log => log.factors.find(f => f.name === 'steps')?.value || 0);
        const avg = stepsArr.reduce((sum, v) => sum + v, 0) / stepsArr.length;
        const variance = stepsArr.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / stepsArr.length;
        const stddev = Math.sqrt(variance);
        // Map stddev to a 0-100 score: 0 stddev = 100, 2000+ stddev = 40 (or lower bound)
        // You can adjust the scale as needed
        const maxStddev = 2000;
        let score = 100 - (stddev / maxStddev) * 60; // 60 point drop for maxStddev
        if (score < 40) score = 40;
        if (score > 100) score = 100;
        return Math.round(score);
    }

    /**
     * Generate consistency insights
     */
    static generateConsistencyInsights(consistencyScore: number): string[] {
        const insights: string[] = [];

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