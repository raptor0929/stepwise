// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import {Test, console} from "forge-std/Test.sol";
import {StepWise} from "../src/Stepwise.sol";

contract StepWiseTest is Test {
    StepWise public stepWise;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    function setUp() public {
        stepWise = new StepWise();
        vm.warp(1749924300);
        // create alice and bob accounts each with 0.05 ether
        vm.deal(alice, 0.05 ether);
        vm.deal(bob, 0.05 ether);
    }

    function testGetMondayStart() public view{
        // Test case 1: Monday at 00:00
        uint256 mondayTimestamp = 1709510400; // March 4, 2024 00:00:00 UTC (Monday)
        assertEq(stepWise.getMondayStart(mondayTimestamp), mondayTimestamp);

        // Test case 2: Wednesday at 15:30
        uint256 wednesdayTimestamp = 1709739000; // March 6, 2024 15:30:00 UTC (Wednesday)
        uint256 expectedMondayStart = 1709510400; // March 4, 2024 00:00:00 UTC (Monday)
        assertEq(stepWise.getMondayStart(wednesdayTimestamp), expectedMondayStart);

        // Test case 3: Sunday at 23:59
        uint256 sundayTimestamp = 1710115140; // March 10, 2024 23:59:59 UTC (Sunday)
        uint256 expectedMondayStart2 = 1709510400; // March 4, 2024 00:00:00 UTC (Monday)
        assertEq(stepWise.getMondayStart(sundayTimestamp), expectedMondayStart2);
    }

    function test_getChallengeId() public view {
        uint256 challengeId = stepWise.getCurrentChallengeId();
        assertEq(challengeId, 1749427200);
    }

    function test_getChallengeTimeBounds() public view {
        uint256 currentChallengeId = stepWise.getCurrentChallengeId();
        (uint256 startTime, uint256 endTime) = stepWise.getChallengeTimeBounds(currentChallengeId);
        assertEq(startTime, 1749427200);
        assertEq(endTime, 1749427200 + 7 days);
    }

    function test_joinChallenge() public {
        uint256 challengeId = stepWise.getCurrentChallengeId();
        stepWise.joinChallenge{value: 0.01 ether}(0x00000000000000000000000000000000AF3EA4D5EB5044AC9DBA37F4CE395048);
        (, , , uint256 totalDeposits, uint256 totalParticipants, ) = stepWise.getChallengeInfo(challengeId);
        assertEq(totalParticipants, 1);
        assertEq(totalDeposits, 0.01 ether);
        console.log("totalDeposits", totalDeposits);
    }

    function test_joinChallenge_multiple() public {
        uint256 challengeId = stepWise.getCurrentChallengeId();
        stepWise.joinChallenge{value: 0.01 ether}(0x00000000000000000000000000000000AF3EA4D5EB5044AC9DBA37F4CE395048);
        stepWise.joinChallenge{value: 0.02 ether}(0x000000000000000000000000000000001D0C697FD20B48FD8658978B970756F9);
        (, , , uint256 totalDeposits, uint256 totalParticipants, ) = stepWise.getChallengeInfo(challengeId);
        assertEq(totalParticipants, 2);
        assertEq(totalDeposits, 0.03 ether);
    }

    function test_distributeRewards() public {
        uint256 challengeId = stepWise.getCurrentChallengeId();
        // alice joins the challenge
        vm.prank(alice);
        console.log("alice address", alice);
        console.log("alice balance", alice.balance);
        stepWise.joinChallenge{value: 0.01 ether}(0x00000000000000000000000000000000AF3EA4D5EB5044AC9DBA37F4CE395048);
        vm.stopPrank();
        // bob joins the challenge
        vm.prank(bob);
        console.log("bob address", bob);
        console.log("bob balance", bob.balance);
        stepWise.joinChallenge{value: 0.02 ether}(0x000000000000000000000000000000001D0C697FD20B48FD8658978B970756F9);
        vm.stopPrank();
        // alice is the winner
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = 0x00000000000000000000000000000000AF3EA4D5EB5044AC9DBA37F4CE395048;
        (,,,address winnerAddress) = stepWise.participants(winners[0]);
        console.log("winnerAddress", winnerAddress);
        uint256 winnerBalanceBefore = winnerAddress.balance;
        console.log("winnerBalanceBefore", winnerBalanceBefore);
        vm.warp(1749924300 + 7 days);
        // deployer distributes the rewards
        vm.prank(address(this));
        stepWise.distributeRewards(challengeId, winners);
        uint256 winnerBalanceAfter = winnerAddress.balance;
        console.log("winnerBalanceAfter", winnerBalanceAfter);
        assertEq(winnerBalanceAfter, winnerBalanceBefore + 0.03 ether);
        (, , , , , bool rewardsDistributed) = stepWise.getChallengeInfo(challengeId);
        console.log("rewardsDistributed", rewardsDistributed);
        assertEq(rewardsDistributed, true);
        vm.stopPrank();
    }

    function test_distributeRewards_multiple_winners() public {
        uint256 challengeId = stepWise.getCurrentChallengeId();
        // alice joins the challenge
        vm.prank(alice);
        console.log("alice address", alice);
        console.log("alice balance", alice.balance);
        stepWise.joinChallenge{value: 0.01 ether}(0x00000000000000000000000000000000AF3EA4D5EB5044AC9DBA37F4CE395048);
        vm.stopPrank();
        // bob joins the challenge
        vm.prank(bob);
        console.log("bob address", bob);
        console.log("bob balance", bob.balance);
        stepWise.joinChallenge{value: 0.02 ether}(0x000000000000000000000000000000001D0C697FD20B48FD8658978B970756F9);
        vm.stopPrank();
        // alice is the winner
        bytes32[] memory winners = new bytes32[](2);
        winners[0] = 0x00000000000000000000000000000000AF3EA4D5EB5044AC9DBA37F4CE395048;
        winners[1] = 0x000000000000000000000000000000001D0C697FD20B48FD8658978B970756F9;
        (,,,address winnerAddress1) = stepWise.participants(winners[0]);
        (,,,address winnerAddress2) = stepWise.participants(winners[1]);
        console.log("winnerAddress1", winnerAddress1);
        console.log("winnerAddress2", winnerAddress2);
        uint256 winnerBalanceBefore1 = winnerAddress1.balance;
        uint256 winnerBalanceBefore2 = winnerAddress2.balance;
        console.log("winnerBalanceBefore1", winnerBalanceBefore1);
        console.log("winnerBalanceBefore2", winnerBalanceBefore2);
        vm.warp(1749924300 + 7 days);
        // deployer distributes the rewards
        vm.prank(address(this));
        stepWise.distributeRewards(challengeId, winners);
        uint256 winnerBalanceAfter1 = winnerAddress1.balance;
        uint256 winnerBalanceAfter2 = winnerAddress2.balance;
        console.log("winnerBalanceAfter1", winnerBalanceAfter1);
        console.log("winnerBalanceAfter2", winnerBalanceAfter2);
        assertEq(winnerBalanceAfter1, winnerBalanceBefore1 + 0.01 ether);
        assertEq(winnerBalanceAfter2, winnerBalanceBefore2 + 0.02 ether);
        (, , , , , bool rewardsDistributed) = stepWise.getChallengeInfo(challengeId);
        console.log("rewardsDistributed", rewardsDistributed);
        assertEq(rewardsDistributed, true);
        vm.stopPrank();
    }
}
