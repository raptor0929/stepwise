import { NextRequest, NextResponse } from 'next/server';
import { avalancheFuji } from 'viem/chains';
import { createMetadata, Metadata, ValidatedMetadata, ExecutionResponse } from '@sherrylinks/sdk';
import { serialize } from 'wagmi';
import { encodeFunctionData, TransactionSerializable, parseEther } from 'viem';
import { abi } from '@/blockchain/abi';
import { createClient } from '@supabase/supabase-js';
import { sahhaIdToBytes32 } from '@/app/helpers';

const CONTRACT_ADDRESS = '0x42Df84a903bCb218F845F0504771c4C588868c22';

// Setup Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
          label: 'Join StepWise Challenge',
          description:
            'Lock your funds for a week and start earning rewards if you improve your step count',
          chains: { source: 'fuji' },
          path: `/api/my-app`,
          params: [
            {
              name: 'sahhaId',
              label: 'Sahha ID',
              type: 'text',
              required: true,
              description: 'Sahha ID',
            },
            {
              name: 'depositAmount',
              label: 'Deposit Amount (AVAX)',
              type: 'text',
              required: true,
              description: 'Amount to deposit (only for joining challenge)',
            }
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
    const depositAmount = searchParams.get('depositAmount');
    const sahhaId = searchParams.get('sahhaId');

    if (!sahhaId || !depositAmount) {
      return NextResponse.json(
        { error: 'Some parameters are missing' },
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

    const amount = depositAmount || '0.01'; // Default 0.01 AVAX
    const joinData = encodeFunctionData({
      abi: abi,
      functionName: 'joinChallenge',
      args: [sahhaIdToBytes32(sahhaId) as `0x${string}`],
    });
    tx = {
      to: CONTRACT_ADDRESS,
      data: joinData,
      value: parseEther(amount),
      chainId: avalancheFuji.id,
      type: 'legacy',
    };

    const serialized = serialize(tx);

    // Save participation to Supabase
    // Calculate Monday of the current week (UTC)
    const now = new Date();
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday as start
    const monday = new Date(now.setUTCDate(diff));
    monday.setUTCHours(0, 0, 0, 0);
    const week = monday.toISOString().split('T')[0];

    await supabase.from('participations').insert([
      {
        sahha_id: sahhaId,
        amount: depositAmount,
        week: week,
      },
    ]);

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