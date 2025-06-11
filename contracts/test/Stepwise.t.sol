// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import {Test, console} from "forge-std/Test.sol";
import {StepWise} from "../src/Stepwise.sol";

contract StepWiseTest is Test {
    StepWise public stepWise;

    function setUp() public {
        stepWise = new StepWise();
    }
}
