// SPDX-License-Identifier: CC-BY-NC-4.0
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {FoodMemeFactory} from "contracts/FoodMemeFactory.sol";
import {FoodMemeFactoryHelper} from "contracts/FoodMemeFactoryHelper.sol";
import "forge-std/console.sol";

contract DeployFoodMemeFactoryScript is Script {
    uint256 DEPLOYER_PRIVATE_KEY = vm.envUint("DEPLOYER_PRIVATE_KEY");
    string BASE_URL = vm.envString("BASE_URL");
    address deployer = vm.addr(DEPLOYER_PRIVATE_KEY);

    function run() public {
        vm.startBroadcast();
        FoodMemeFactoryHelper helper = new FoodMemeFactoryHelper();
        FoodMemeFactory factory = new FoodMemeFactory(helper, BASE_URL);
        console.log("Deployed factory to %s", address(factory));
        vm.stopBroadcast();
    }
}
