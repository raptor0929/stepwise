// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {StepWise} from "../src/Stepwise.sol";

contract DeployStepwiseScript is Script {
    StepWise public stepWise;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        stepWise = new StepWise();

        vm.stopBroadcast();
    }
}
