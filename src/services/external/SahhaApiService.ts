import { ActivityLog, UserActivityData } from '@/types/activity';

export class SahhaApiService {
    private static readonly BASE_URL = 'https://sandbox-api.sahha.ai/api/v1';
    private static readonly AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2FwaS5zYWhoYS5haS9jbGFpbXMvYWNjb3VudElkIjoiZmZmNmExMDMtMzk1Mi00MDViLTg5YzEtOTVlM2ExN2VmZTVhIiwiaHR0cHM6Ly9hcGkuc2FoaGEuYWkvY2xhaW1zL2FkbWluIjoiVHJ1ZSIsImh0dHBzOi8vYXBpLnNhaGhhLmFpL2NsYWltcy9hY2NvdW50IjoiVHJ1ZSIsImh0dHBzOi8vYXBpLnNhaGhhLmFpL2NsYWltcy9zYWhoYUFwaVNjb3BlIjoic2FuZGJveCIsImh0dHBzOi8vYXBpLnNhaGhhLmFpL2NsYWltcy9yZWdpb24iOiJVUyIsImV4cCI6MTc1MTU3MjAxNywiaXNzIjoiaHR0cHM6Ly9zYWhoYS1wcm9kdWN0aW9uLmF1LmF1dGgwLmNvbS8iLCJhdWQiOiJodHRwczovL3NhaGhhLXByb2R1Y3Rpb24uYXUuYXV0aDAuY29tL2FwaS92Mi8ifQ.g5nmM7MJv1om8QeW-SxepnWoU8rWmEewCd5PiF0LZ5A';

    /**
     * Fetch activity logs for a specific user within a date range
     */
    static async fetchUserActivityLogs(
        userId: string,
        startDateTime: string,
        endDateTime: string
    ): Promise<ActivityLog[]> {
        const url = `${this.BASE_URL}/profile/score/${userId}?startDateTime=${startDateTime}&endDateTime=${endDateTime}&types=activity`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `account ${this.AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Assuming the API returns an array of ActivityLog objects
            // You may need to adjust this based on the actual API response structure
            return Array.isArray(data) ? data : data.logs || [];
        } catch (error) {
            console.error(`Error fetching logs for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Fetch activity logs for multiple users
     */
    static async fetchMultipleUsersActivityLogs(
        userIds: string[],
        startDateTime: string,
        endDateTime: string
    ): Promise<UserActivityData[]> {
        const promises = userIds.map(async (userId) => {
            try {
                const logs = await this.fetchUserActivityLogs(userId, startDateTime, endDateTime);
                return {
                    userId,
                    logs,
                    weeklyAverageSteps: this.calculateUserWeeklyAverageSteps(logs)
                };
            } catch (error) {
                console.error(`Failed to fetch data for user ${userId}:`, error);
                return {
                    userId,
                    logs: [],
                    weeklyAverageSteps: 0
                };
            }
        });

        return Promise.all(promises);
    }

    /**
     * Calculate weekly average steps for a user's logs
     */
    private static calculateUserWeeklyAverageSteps(logs: ActivityLog[]): number {
        if (logs.length === 0) return 0;

        const totalSteps = logs.reduce((sum, log) => {
            const stepsFactor = log.factors.find(f => f.name === 'steps');
            return sum + (stepsFactor?.value || 0);
        }, 0);

        return Math.round(totalSteps / logs.length);
    }

    /**
     * Get date range for the current week
     */
    static getCurrentWeekDateRange(): { startDateTime: string, endDateTime: string } {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Start from Monday

        const startOfWeek = new Date(now.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return {
            startDateTime: startOfWeek.toISOString(),
            endDateTime: endOfWeek.toISOString()
        };
    }
}
