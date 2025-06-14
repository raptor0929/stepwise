import { NextRequest, NextResponse } from 'next/server';
import { avalancheFuji } from 'viem/chains';
import { createMetadata, Metadata, ValidatedMetadata, ExecutionResponse } from '@sherrylinks/sdk';
import { serialize } from 'wagmi';
import { encodeFunctionData, TransactionSerializable, parseEther } from 'viem';
import { abi } from '@/blockchain/abi';

const CONTRACT_ADDRESS = '0x8590bD18FdB00F62c644c3a4288d1Dceb41eaE41';

export async function GET(req: NextRequest) {
  try {
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const serverUrl = `${protocol}://${host}`;

    const metadata: Metadata = {
      url: 'https://stepwise-sand.vercel.app',
      icon: 'https://raw.githubusercontent.com/raptor0929/stepwise/refs/heads/main/public/stepwise.png',
      title: 'StepWise',
      baseUrl: serverUrl,
      description:
        'App that rewards your commitment on improving your step count and health',
      actions: [
        {
          type: 'dynamic',
          label: 'StepWise Challenge',
          description:
            'Lock your funds for a week and start earning rewards if you improve your step count',
          chains: { source: 'fuji' },
          path: `/api/my-app`,
          params: [
            {
              name: 'action',
              label: 'Action',
              type: 'select',
              required: true,
              description: 'Choose your action',
              options: [
                { label: 'Join Challenge', value: 'joinChallenge' },
                { label: 'Distribute Rewards', value: 'distributeRewards' }
              ]
            },
            {
              name: 'depositAmount',
              label: 'Deposit Amount (AVAX)',
              type: 'text',
              required: false,
              description: 'Amount to deposit (only for joining challenge)',
            },
            {
              name: 'challengeId',
              label: 'Challenge ID',
              type: 'text',
              required: false,
              description: 'Challenge ID (only for distributing rewards)',
            },
            {
              name: 'winners',
              label: 'Winners (comma separated)',
              type: 'text',
              required: false,
              description: 'Comma-separated list of winner addresses',
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

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const depositAmount = searchParams.get('depositAmount');
    const challengeId = searchParams.get('challengeId');
    const winnersParam = searchParams.get('winners');

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        },
      );
    }

    let tx: TransactionSerializable;

    switch (action) {
      case 'joinChallenge':
        const amount = depositAmount || '0.01'; // Default 0.01 AVAX
        
        const joinData = encodeFunctionData({
          abi: abi,
          functionName: 'joinChallenge',
          args: [],
        });

        tx = {
          to: CONTRACT_ADDRESS,
          data: joinData,
          value: parseEther(amount),
          chainId: avalancheFuji.id,
          type: 'legacy',
        };
        break;

      case 'distributeRewards':
        if (!challengeId || !winnersParam) {
          return NextResponse.json(
            { error: 'Challenge ID and winners are required for distributing rewards' },
            {
              status: 400,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              },
            },
          );
        }

        // Parse winners from comma-separated string
        const winners = winnersParam.split(',').map(addr => addr.trim());
        
        // Validate addresses (basic check)
        for (const winner of winners) {
          if (!winner.startsWith('0x') || winner.length !== 42) {
            return NextResponse.json(
              { error: `Invalid address format: ${winner}` },
              {
                status: 400,
                headers: {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
              },
            );
          }
        }

        const distributeData = encodeFunctionData({
          abi: abi,
          functionName: 'distributeRewards',
          args: [BigInt(challengeId), winners as `0x${string}`[]],
        });

        tx = {
          to: CONTRACT_ADDRESS,
          data: distributeData,
          chainId: avalancheFuji.id,
          type: 'legacy',
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          {
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
          },
        );
    }

    const serialized = serialize(tx);

    const resp: ExecutionResponse = {
      serializedTransaction: serialized,
      chainId: avalancheFuji.name,
    };

    return NextResponse.json(resp, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error en petición POST:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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