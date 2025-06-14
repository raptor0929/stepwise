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
    overallScore: number;
    rewardScore: number;  // Steps-focused score
    pointsScore: number;  // Other factors score
    stepsValue: number;
    stepsGoalPercentage: number;
    efficiencyScore: number;
    balanceScore: number;
    consistencyBonus: number;
    totalScore: number;
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
        avgRewardScore: number;
        avgPointsScore: number;
        topInsights: string[];
    };
    loserStats: {
        avgSteps: number;
        avgRewardScore: number;
        avgPointsScore: number;
        commonIssues: string[];
    };
}