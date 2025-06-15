export interface ActivityFactor {
    id: string;
    name: string;
    value: number;
    goal: number;
    score: number;
    state: 'minimal' | 'low' | 'medium' | 'high';
    unit: string;
}

export interface ActivityLog {
    id: string; // This is the log ID, NOT user ID
    type: 'activity';
    state: 'minimal' | 'low' | 'medium' | 'high';
    score: number;
    factors: ActivityFactor[];
    dataSources: string[];
    scoreDateTime: string;
    createdAtUtc: string;
    version: number;
}

export interface UserActivityData {
    userId: string;
    logs: ActivityLog[];
    weeklyAverageSteps: number;
}

export interface PerformanceAnalysis {
    userId: string;
    date: string;
    activityScore: number;
    stepsValue: number;
    stepsGoalPercentage: number;
    efficiencyScore: number;
    balanceScore: number;
    consistencyBonus: number;
    rank: number;
    classification: 'winner' | 'loser';
    insights: string[];
}

export interface WinnerLoserAnalysis {
    winners: PerformanceAnalysis[];
    losers: PerformanceAnalysis[];
    overallWeeklyAverageSteps: number;
    winnerStats: {
        avgSteps: number;
        avgActivityScore: number;
        topInsights: string[];
    };
    loserStats: {
        avgSteps: number;
        avgActivityScore: number;
        commonIssues: string[];
    };
}