// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract StepWise {
    struct Challenge {
        uint256 totalDeposits;
        uint256 totalParticipants;
        mapping(address => uint256) deposits;
        mapping(address => bool) hasJoined;
        mapping(address => bool) isWinner;
        address[] participants;
        address[] winners;
        bool rewardsDistributed;
    }

    struct Participant {
        uint256 depositAmount;
        uint256 challengeId;
        bool hasWithdrawn;
    }

    mapping(uint256 => Challenge) public challenges;
    mapping(address => Participant) public participants;
    
    uint256 public constant CHALLENGE_DURATION = 7 days;
    uint256 public constant WEEK_START_DAY = 1; // Monday = 1, Sunday = 0
    
    address public owner;
    
    event ParticipantJoined(uint256 indexed challengeId, address indexed participant, uint256 amount);
    event RewardsDistributed(uint256 indexed challengeId, address[] winners, uint256 totalReward);
    event RewardClaimed(uint256 indexed challengeId, address indexed winner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier challengeActive() {
        uint256 currentChallengeId = getCurrentChallengeId();
        (uint256 startTime, uint256 endTime) = getChallengeTimeBounds(currentChallengeId);
        require(block.timestamp >= startTime, "Challenge not started");
        require(block.timestamp <= endTime, "Challenge ended");
        _;
    }

    modifier challengeEnded(uint256 _challengeId) {
        (, uint256 endTime) = getChallengeTimeBounds(_challengeId);
        require(block.timestamp > endTime, "Challenge still active");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Calculate current challenge ID based on weeks since Unix epoch
    function getCurrentChallengeId() public view returns (uint256) {
        // Get Monday 00:00 of current week
        uint256 currentMondayStart = getMondayStart(block.timestamp);
        // Challenge ID is the number of weeks since Unix epoch
        return currentMondayStart / CHALLENGE_DURATION;
    }

    // Get the Monday 00:00 timestamp for any given timestamp
    function getMondayStart(uint256 timestamp) public pure returns (uint256) {
        // Unix epoch started on Thursday (Jan 1, 1970), so we need to adjust
        // Days since epoch
        uint256 daysSinceEpoch = timestamp / 86400; // 86400 seconds in a day
        // Thursday = 4, so we need to find days since last Monday
        // (daysSinceEpoch + 3) % 7 gives us days since Monday (Thursday + 3 = Sunday = 0)
        uint256 daysSinceMonday = (daysSinceEpoch + 3) % 7;
        // Subtract days since Monday and time within the day to get Monday 00:00
        return timestamp - (daysSinceMonday * 86400) - (timestamp % 86400);
    }

    // Get start and end time for any challenge ID
    function getChallengeTimeBounds(uint256 challengeId) public pure returns (uint256 startTime, uint256 endTime) {
        startTime = challengeId * CHALLENGE_DURATION;
        endTime = startTime + CHALLENGE_DURATION;
    }

    function joinChallenge() external payable challengeActive() {
        uint256 currentChallengeId = getCurrentChallengeId();
        require(msg.value > 0, "Deposit amount must be greater than 0");
        require(!challenges[currentChallengeId].hasJoined[msg.sender], "Already joined this challenge");

        Challenge storage challenge = challenges[currentChallengeId];
        
        challenge.deposits[msg.sender] = msg.value;
        challenge.hasJoined[msg.sender] = true;
        challenge.participants.push(msg.sender);
        challenge.totalDeposits += msg.value;
        challenge.totalParticipants++;

        participants[msg.sender] = Participant({
            depositAmount: msg.value,
            challengeId: currentChallengeId,
            hasWithdrawn: false
        });

        emit ParticipantJoined(currentChallengeId, msg.sender, msg.value);
    }

    function distributeRewards(uint256 _challengeId, address[] calldata _winners) 
        external 
        onlyOwner 
        challengeEnded(_challengeId) 
    {
        Challenge storage challenge = challenges[_challengeId];
        require(!challenge.rewardsDistributed, "Rewards already distributed");
        require(_winners.length > 0, "Must have at least one winner");
        require(_winners.length <= challenge.totalParticipants, "Too many winners");

        // Validate that all winners are actual participants
        for (uint256 i = 0; i < _winners.length; i++) {
            require(challenge.hasJoined[_winners[i]], "Winner must be a participant");
            challenge.isWinner[_winners[i]] = true;
        }

        challenge.winners = _winners;
        challenge.rewardsDistributed = true;

        // Calculate total deposits from winners and losers
        uint256 totalWinnerDeposits = 0;
        uint256 totalLoserDeposits = 0;

        // Calculate winner deposits
        for (uint256 i = 0; i < _winners.length; i++) {
            totalWinnerDeposits += challenge.deposits[_winners[i]];
        }

        // Calculate loser deposits (total - winners)
        totalLoserDeposits = challenge.totalDeposits - totalWinnerDeposits;

        // Distribute rewards immediately to each winner
        for (uint256 i = 0; i < _winners.length; i++) {
            address winner = _winners[i];
            uint256 winnerDeposit = challenge.deposits[winner];
            
            // Winner gets their deposit back + proportional share of losers' pool
            uint256 shareOfLosersPool = (totalLoserDeposits * winnerDeposit) / totalWinnerDeposits;
            uint256 totalReward = winnerDeposit + shareOfLosersPool;
            
            // Mark as withdrawn to prevent double claiming
            participants[winner].hasWithdrawn = true;
            
            // Transfer the reward
            require(address(this).balance >= totalReward, "Insufficient contract balance");
            payable(winner).transfer(totalReward);
            
            emit RewardClaimed(_challengeId, winner, totalReward);
        }

        emit RewardsDistributed(_challengeId, _winners, challenge.totalDeposits);
    }

    // View functions
    function getCurrentChallenge() external view returns (
        uint256 challengeId,
        uint256 startTime,
        uint256 endTime,
        uint256 totalDeposits,
        uint256 totalParticipants,
        bool rewardsDistributed
    ) {
        challengeId = getCurrentChallengeId();
        (startTime, endTime) = getChallengeTimeBounds(challengeId);
        Challenge storage challenge = challenges[challengeId];
        return (
            challengeId,
            startTime,
            endTime,
            challenge.totalDeposits,
            challenge.totalParticipants,
            challenge.rewardsDistributed
        );
    }

    function getChallengeInfo(uint256 _challengeId) external view returns (
        uint256 challengeId,
        uint256 startTime,
        uint256 endTime,
        uint256 totalDeposits,
        uint256 totalParticipants,
        bool rewardsDistributed
    ) {
        (startTime, endTime) = getChallengeTimeBounds(_challengeId);
        Challenge storage challenge = challenges[_challengeId];
        return (
            _challengeId,
            startTime,
            endTime,
            challenge.totalDeposits,
            challenge.totalParticipants,
            challenge.rewardsDistributed
        );
    }

    function getChallengeParticipants(uint256 _challengeId) external view returns (address[] memory) {
        return challenges[_challengeId].participants;
    }

    function getChallengeWinners(uint256 _challengeId) external view returns (address[] memory) {
        return challenges[_challengeId].winners;
    }

    function getUserDeposit(uint256 _challengeId, address _user) external view returns (uint256) {
        return challenges[_challengeId].deposits[_user];
    }

    function isUserWinner(uint256 _challengeId, address _user) external view returns (bool) {
        return challenges[_challengeId].isWinner[_user];
    }

    function getUserParticipation(address _user) external view returns (
        uint256 depositAmount,
        uint256 challengeId,
        bool hasWithdrawn
    ) {
        Participant memory participant = participants[_user];
        return (participant.depositAmount, participant.challengeId, participant.hasWithdrawn);
    }

    // Check if user has joined current challenge
    function hasUserJoinedCurrentChallenge(address _user) external view returns (bool) {
        uint256 currentChallengeId = getCurrentChallengeId();
        return challenges[currentChallengeId].hasJoined[_user];
    }

    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}