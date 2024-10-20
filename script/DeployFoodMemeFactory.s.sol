// SPDX-License-Identifier: CC-BY-NC-4.0
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {FoodMemeFactory} from "contracts/FoodMemeFactory.sol";

contract DeployFoodMemeFactoryScript is Script {
    FoodMemeFactory public counter;

    function setUp() public {
        uint256 DEPLOYER_PRIVATE_KEY = vm.envUint("DEPLOYER_PRIVATE_KEY");
    }

    function run() public {
        uint256 DEPLOYER_PRIVATE_KEY = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast();


        vm.stopBroadcast();
    }
}
