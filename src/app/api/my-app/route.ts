import { NextRequest, NextResponse } from 'next/server';
import { createMetadata, Metadata, ValidatedMetadata } from '@sherrylinks/sdk';

const CONTRACT_ADDRESS = '0xTuContratoInteligenteEnFuji';

export async function GET(req: NextRequest) {
  try {
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const serverUrl = `${protocol}://${host}`;

    const metadata: Metadata = {
      url: 'https://stepwise-sand.vercel.app',
      icon: 'https://raw.githubusercontent.com/raptor0929/stepwise/refs/heads/main/public/stepwise.webp',
      title: 'StepWise',
      baseUrl: serverUrl,
      description:
        'App that rewards your commitment on improving your step count and health',
      actions: [
        {
          type: 'dynamic',
          label: 'StepWise',
          description:
            'Lock your funds for a week and start earning rewards if you improve your step count',
          chains: { source: 'fuji' },
          path: `/api/my-app`,
          params: [
            {
              name: 'joinChallenge',
              label: 'Join Challenge',
              type: 'text',
              required: true,
              description: 'Lock your funds for a week and start earning rewards if you improve your step count',
            },
          ],
        },
      ],
    };

    const validated: ValidatedMetadata = createMetadata(metadata);

    return NextResponse.json(validated, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear metadata' }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
    },
  });
}
