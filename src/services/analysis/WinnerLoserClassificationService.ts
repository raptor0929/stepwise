import { UserActivityData } from "@/types/activity";
import { STEP_GOAL_THRESHOLD } from "@/app/constants";

export class WinnerLoserClassificationService {

    /**
     * Classify a user as winner or loser based on their weekly average steps
     */
    static classifyUser(userWeeklyAverageSteps: number): 'winner' | 'loser' {
        return userWeeklyAverageSteps >= STEP_GOAL_THRESHOLD ? 'winner' : 'loser';
    }

    /**
     * Classify multiple users based on their weekly average steps
     */
    static classifyUsers(usersData: UserActivityData[]): {
        winners: UserActivityData[];
        losers: UserActivityData[];
        overallWeeklyAverage: number;
    } {
        const winners: UserActivityData[] = [];
        const losers: UserActivityData[] = [];

        usersData.forEach(userData => {
            if (this.classifyUser(userData.weeklyAverageSteps) === 'winner') {
                winners.push(userData);
            } else {
                losers.push(userData);
            }
        });

        const totalAverage = usersData.reduce((sum, user) => sum + user.weeklyAverageSteps, 0) / usersData.length;

        return {
            winners,
            losers,
            overallWeeklyAverage: Math.round(totalAverage)
        };
    }
}
