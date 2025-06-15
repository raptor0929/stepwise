# StepWise @ Sherry.social Minithon 🏃‍♂️🍒

**Step Up Your Game, Win Real Rewards!**

StepWise is a blockchain-powered fitness challenge platform. Join weekly step challenges, deposit funds, and compete for real rewards. Our smart scoring system rewards not just steps, but also activity quality, balance, and consistency. Winners take the pot!

---

## Deployed Smart Contract
- [0x42Df84a903bCb218F845F0504771c4C588868c22 on Snowtrace (Avalanche Fuji Testnet)](https://testnet.snowtrace.io/address/0x42Df84a903bCb218F845F0504771c4C588868c22)

---

## Key Features 🏅
- Weekly blockchain fitness challenges
- Smart scoring: Steps (40%) 👟, Efficiency (30%) 💪, Balance (20%) ⚖️, Consistency (10%) 🔄
- Real rewards: Winners get the losers' deposits
- Transparent, automated payouts via smart contract
- Social, gamified, and fun!

---

## Setup Instructions

### 1. Clone the repo
```bash
git clone <this-repo-url>
cd stepwise
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Run the Next.js app
```bash
npm run dev
# or
yarn dev
```
Visit [http://localhost:3000](http://localhost:3000)

### 4. Smart Contract (optional, for devs)
- Contracts are in `/contracts`
- Uses [Foundry](https://book.getfoundry.sh/)
- Deploy scripts and tests included

### 5. Distribute Rewards Script
To distribute rewards at the end of a challenge, run:
```bash
node scripts/distribute-rewards.js
```
This script will fetch winners, save results, and trigger the smart contract payout. Make sure your environment variables are set up as required in the script.

---

## How to Participate 👟
1. Connect your wallet
2. Join the current weekly challenge by depositing funds
3. Track your steps and activity
4. At week's end, winners are determined by the smart scoring system
5. Winners automatically receive rewards to their wallet

---

## How Rewards Work 💰
- All participants deposit funds to join
- At the end of the week, the smart contract scores all users
- Winners split the losers' deposits, paid out instantly
- 100% transparent, no middleman

---

## Slogan
**Step Up Your Game, Win Real Rewards!**

## Closing
**StepWise: Where Every Step Counts, Every Winner Rewarded.**

---

Made with 🍒 and 🏃‍♂️ for the [sherry.social](https://sherry.social) minithon!
