import { NextRequest } from 'next/server';
import { ActivityAnalysisService } from '@/services/ActivityAnalysisService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds)) {
      return Response.json(
        { message: 'Invalid userIds data. Expected array of user IDs.' },
        { status: 400 }
      );
    }

    // Perform the analysis
    const result = await ActivityAnalysisService.analyzeUsersActivity(userIds);

    return Response.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Activity analysis error:', error);
    return Response.json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}