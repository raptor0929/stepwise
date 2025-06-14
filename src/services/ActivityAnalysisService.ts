import { ActivityFactor, ActivityLog, PerformanceAnalysis, UserActivityData, WinnerLoserAnalysis } from "@/types/activity";
import { SahhaApiService } from "./external/SahhaApiService";
import { WinnerLoserClassificationService } from "./analysis/WinnerLoserClassificationService";
import { ConsistencyScoringService } from "./scoring/ConsistencyScoringService";
import { RewardScoringService } from "./scoring/RewardScoringService";
import { PointsScoringService } from "./scoring/PointsScoringService";

export class ActivityAnalysisService {
    /**
     * Analyze activity data for multiple users
     */
    static async analyzeUsersActivity(userIds: string[]): Promise<{
        analyses: PerformanceAnalysis[];
        winnerLoserAnalysis: WinnerLoserAnalysis;
    }> {
        // Get current week date range
        const { startDateTime, endDateTime } = SahhaApiService.getCurrentWeekDateRange();

        // Fetch data for all users
        const usersData = await SahhaApiService.fetchMultipleUsersActivityLogs(
            userIds,
            startDateTime,
            endDateTime
        );

        // Classify users as winners or losers
        const { winners, losers, overallWeeklyAverage } = WinnerLoserClassificationService.classifyUsers(usersData);

        // Generate detailed analyses for each user
        const analyses: PerformanceAnalysis[] = [];

        for (const userData of usersData) {
            const userAnalyses = this.analyzeUserLogs(userData);
            analyses.push(...userAnalyses);
        }

        // Sort by total score
        analyses.sort((a, b) => b.totalScore - a.totalScore);

        // Assign ranks
        analyses.forEach((analysis, index) => {
            analysis.rank = index + 1;
        });

        // Create winner/loser analysis
        const winnerAnalyses = analyses.filter(a => winners.some(w => w.userId === a.userId));
        const loserAnalyses = analyses.filter(a => losers.some(l => l.userId === a.userId));

        const winnerLoserAnalysis: WinnerLoserAnalysis = {
            winners: winnerAnalyses,
            losers: loserAnalyses,
            overallWeeklyAverageSteps: overallWeeklyAverage,
            winnerStats: this.calculateWinnerStats(winnerAnalyses),
            loserStats: this.calculateLoserStats(loserAnalyses)
        };

        return {
            analyses,
            winnerLoserAnalysis
        };
    }

    /**
     * Analyze logs for a single user (weekly summary only)
     */
    private static analyzeUserLogs(userData: UserActivityData): PerformanceAnalysis[] {
        const { userId, logs } = userData;
        if (!logs || logs.length === 0) return [];
        const classification = WinnerLoserClassificationService.classifyUser(userData.weeklyAverageSteps);

        // Weekly consistency score
        const consistencyBonus = ConsistencyScoringService.calculateWeeklyConsistencyBonus(logs);

        // Aggregate numeric fields
        const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const round2 = (n: number) => Math.round(n * 100) / 100;

        // Extract all factors for aggregation
        const allFactors = logs.map(log => this.extractFactors(log));
        // For rewardScore and steps-based fields, use steps factor from each log
        const rewardScores = allFactors.map(f => RewardScoringService.calculateRewardScore(f.steps));
        const pointsScores = allFactors.map(f => PointsScoringService.calculatePointsScore(f, consistencyBonus));
        const stepsValues = allFactors.map(f => f.steps?.value || 0);
        const stepsGoalPercentages = allFactors.map(f => f.steps ? (f.steps.value / 7500) * 100 : 0);
        const efficiencyScores = allFactors.map(f => PointsScoringService['calculateEfficiencyScore'](f));
        const balanceScores = allFactors.map(f => PointsScoringService['calculateBalanceScore'](f));
        const overallScores = logs.map(log => log.score);
        const totalScores = rewardScores.map((r, i) => r * 0.7 + pointsScores[i] * 0.3);

        // Merge insights
        const stepsInsights = allFactors.flatMap(f => RewardScoringService.generateStepsInsights(f.steps));
        const pointsInsights = allFactors.flatMap(f => PointsScoringService.generatePointsInsights(f, consistencyBonus));
        const insights = Array.from(new Set([...stepsInsights, ...pointsInsights]));

        // Use the week's start date
        const weekStart = (() => {
            const date = new Date(logs[0].scoreDateTime);
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(date.setDate(diff));
            monday.setHours(0, 0, 0, 0);
            return monday.toISOString().split('T')[0];
        })();

        // Compose the weekly summary
        const summary: PerformanceAnalysis = {
            userId,
            date: weekStart,
            overallScore: round2(avg(overallScores)),
            rewardScore: round2(avg(rewardScores)),
            pointsScore: round2(avg(pointsScores)),
            stepsValue: round2(avg(stepsValues)),
            stepsGoalPercentage: round2(avg(stepsGoalPercentages)),
            efficiencyScore: round2(avg(efficiencyScores)),
            balanceScore: round2(avg(balanceScores)),
            consistencyBonus,
            totalScore: round2(avg(totalScores)),
            rank: 0, // Will be set later
            classification,
            insights
        };

        return [summary];
    }

    /**
     * Extract and organize factors from activity log
     */
    private static extractFactors(log: ActivityLog) {
        const factorMap: { [key: string]: ActivityFactor } = {};
        log.factors.forEach(factor => {
            factorMap[factor.name] = factor;
        });
        return factorMap;
    }

    /**
     * Calculate statistics for winners
     */
    private static calculateWinnerStats(winners: PerformanceAnalysis[]) {
        if (winners.length === 0) {
            return { avgSteps: 0, avgRewardScore: 0, avgPointsScore: 0, topInsights: [] };
        }

        const avgSteps = Math.round(winners.reduce((sum, w) => sum + w.stepsValue, 0) / winners.length);
        const avgRewardScore = Math.round((winners.reduce((sum, w) => sum + w.rewardScore, 0) / winners.length) * 100) / 100;
        const avgPointsScore = Math.round((winners.reduce((sum, w) => sum + w.pointsScore, 0) / winners.length) * 100) / 100;

        const allInsights = winners.flatMap(w => w.insights);
        const insightCounts = new Map<string, number>();

        allInsights.forEach(insight => {
            const key = insight.split(':')[0];
            insightCounts.set(key, (insightCounts.get(key) || 0) + 1);
        });

        const topInsights = Array.from(insightCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([insight]) => insight);

        return { avgSteps, avgRewardScore, avgPointsScore, topInsights };
    }

    /**
     * Calculate statistics for losers
     */
    private static calculateLoserStats(losers: PerformanceAnalysis[]) {
        if (losers.length === 0) {
            return { avgSteps: 0, avgRewardScore: 0, avgPointsScore: 0, commonIssues: [] };
        }

        const avgSteps = Math.round(losers.reduce((sum, l) => sum + l.stepsValue, 0) / losers.length);
        const avgRewardScore = Math.round((losers.reduce((sum, l) => sum + l.rewardScore, 0) / losers.length) * 100) / 100;
        const avgPointsScore = Math.round((losers.reduce((sum, l) => sum + l.pointsScore, 0) / losers.length) * 100) / 100;

        const commonIssues: string[] = [];

        const lowStepsCount = losers.filter(l => l.stepsValue < 5000).length;
        const lowRewardScoreCount = losers.filter(l => l.rewardScore < 50).length;
        const lowPointsScoreCount = losers.filter(l => l.pointsScore < 50).length;

        if (lowStepsCount > losers.length * 0.6) {
            commonIssues.push('Consistently low step counts');
        }
        if (lowRewardScoreCount > losers.length * 0.6) {
            commonIssues.push('Poor step performance overall');
        }
        if (lowPointsScoreCount > losers.length * 0.6) {
            commonIssues.push('Low activity quality and balance');
        }

        return { avgSteps, avgRewardScore, avgPointsScore, commonIssues };
    }
}
