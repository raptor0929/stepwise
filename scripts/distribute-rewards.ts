import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { abi } from '../src/blockchain/abi.js';
import { sahhaIdToBytes32 } from '../src/app/helpers.js';
import { createPublicClient, createWalletClient, http, getContract } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';

dotenv.config();

// CONFIG
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ACTIVITY_ANALYSIS_URL = process.env.ACTIVITY_ANALYSIS_URL || 'http://localhost:3000/api/activity-analysis';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x42Df84a903bCb218F845F0504771c4C588868c22';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PROVIDER_URL = process.env.RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';

function getCurrentWeekMonday() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday as start
  const monday = new Date(now.setUTCDate(diff));
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

async function getParticipatingUserIds(supabase, week) {
  console.log('Querying participations for week:', week);
  const { data, error } = await supabase
    .from('participations')
    .select('sahha_id')
    .eq('week', week);
  if (error) throw error;
  const userIds = data.map(row => row.sahha_id);
  console.log('Found userIds:', userIds);
  return userIds;
}

async function getWinners(userIds) {
  console.log('Fetching winners from activity-analysis...');
  const res = await fetch(ACTIVITY_ANALYSIS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds }),
  });
  const data = await res.json();
  if (!data.success) throw new Error('Failed to get winners: ' + JSON.stringify(data));
  // winners are in data.data.winnerLoserAnalysis.winners (array of PerformanceAnalysis)
  return data.data.winnerLoserAnalysis.winners;
}

async function savePoints(supabase, winners) {
  console.log('Saving winners to Supabase...');
  try {
    const rows = winners.map(w => ({
      sahha_id: w.userId,
      amount: w.activityScore * 1000, // points are 1000x the activity score
    }));
    const { error } = await supabase.from('points').insert(rows);
    if (error) throw error;
    console.log('Saved winners to Supabase:', rows);
  } catch (error) {
    console.error('Error saving winners to Supabase:', error);
  }
}

async function distributeRewards(winners, challengeId, walletClient, publicClient) {
  console.log('Calling distributeRewards on contract...');
  const winnerBytes32 = winners.map(w => sahhaIdToBytes32(w.userId));

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'distributeRewards',
    args: [challengeId, winnerBytes32],
    account: walletClient.account,
  });
  console.log('Transaction sent:', hash);

  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('Transaction confirmed!', receipt);
  console.log('Transaction link:', `https://testnet.snowtrace.io/tx/${hash}?chainid=43113`);
}

async function main() {
  try {
    // 0. Setup
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const week = getCurrentWeekMonday();
    console.log('Week:', week);

    // 1. Get all user IDs for this week
    const userIds = await getParticipatingUserIds(supabase, week);
    if (userIds.length === 0) {
      console.log('No participations for this week. Exiting.');
      return;
    }

    // 2. Get winners
    const winners = await getWinners(userIds);
    console.log('Winners:', winners.map(w => w.userId));

    // 3. Save to Supabase
    await savePoints(supabase, winners);

    // 4. Setup viem clients
    const publicClient = createPublicClient({
      transport: http(PROVIDER_URL),
    });
    const account = privateKeyToAccount(`0x${PRIVATE_KEY.replace(/^0x/, '')}`);
    const walletClient = createWalletClient({
      account,
      transport: http(PROVIDER_URL),
    });

    // 5. Get current challengeId
    const challengeId = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'getCurrentChallengeId',
    });
    console.log('Current challengeId:', challengeId.toString());

    // 6. Distribute rewards
    await distributeRewards(winners, challengeId, walletClient, publicClient);

    console.log('All done!');
  } catch (err) {
    console.error('Error:', err);
  }
}

main(); 