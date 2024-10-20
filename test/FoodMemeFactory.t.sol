// SPDX-License-Identifier: CC-BY-NC-4.0
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import "forge-std/console.sol";
import {FoodMemeFactory} from "contracts/FoodMemeFactory.sol";
import {FoodMemeFactoryHelper} from "contracts/FoodMemeFactoryHelper.sol";
import {FoodMeme} from "contracts/FoodMeme.sol";
import {Utils} from "contracts/Utils.sol";

// OApp imports
import {OptionsBuilder} from "@layerzerolabs/oapp-evm/libs/OptionsBuilder.sol";

// OFT imports
import {IOFT, SendParam, OFTReceipt} from "@layerzerolabs/oft-evm/interfaces/IOFT.sol";
import {MessagingFee, MessagingReceipt} from "@layerzerolabs/oft-evm/OFTCore.sol";
import {OFTMsgCodec} from "@layerzerolabs/oft-evm/libs/OFTMsgCodec.sol";
import {OFTComposeMsgCodec} from "@layerzerolabs/oft-evm/libs/OFTComposeMsgCodec.sol";
// DevTools imports
import {TestHelperOz5} from "@layerzerolabs/test-devtools-evm-foundry/contracts/TestHelperOz5.sol";

contract FoodMemeFactoryTest is TestHelperOz5 {
    uint256 DEPLOYER_PRIVATE_KEY = vm.envUint("DEPLOYER_PRIVATE_KEY");
    address deployer = vm.addr(DEPLOYER_PRIVATE_KEY);

    using OptionsBuilder for bytes;

    uint32 private aEid = 1;
    uint32 private bEid = 2;

    FoodMeme private aOFT;
    FoodMeme private bOFT;

    address private userA = address(0x1);
    address private userB = address(0x2);
    uint256 private initialBalance = 1 ether;
    FoodMemeFactoryHelper helper = new FoodMemeFactoryHelper();

    FoodMemeFactory factory1;
    FoodMemeFactory factory2;

    function setUp() public virtual override {
        vm.deal(userA, 1000 ether);
        vm.deal(userB, 1000 ether);

        super.setUp();
        setUpEndpoints(2, LibraryType.UltraLightNode);

        vm.startPrank(deployer);
        vm.chainId(31337);
        factory1 = new FoodMemeFactory(helper, "1");
        vm.chainId(31338);
        factory2 = new FoodMemeFactory(helper, "2");

        vm.chainId(31337);
        uint256[] memory mintChains = new uint256[](1);
        mintChains[0] = block.chainid;
        console.log("Current chain: %s", block.chainid);
        aOFT = factory1.launch(
            Utils.MemeParams({name: "a", symbol: "A", endpoint: address(endpoints[aEid])}),
            userA,
            Utils.InitParams({
                mintable: true,
                imageHash: bytes32(0),
                recipeHash: bytes32(0),
                mintChains: mintChains,
                masterChain: block.chainid,
                maxSupply: 0,
                maxPerMint: 0,
                minReviewThreshold: 0,
                priceSettings: Utils.PriceSettings({mode: Utils.PriceMode.LinearPrice, a: 0, b: 2, c: 1}),
                baseUri: ""
            })
        );
        vm.chainId(31338);
        console.log("Switched to chain: %s", block.chainid);
        bOFT = factory2.launch(
            Utils.MemeParams({name: "b", symbol: "B", endpoint: address(endpoints[aEid])}),
            userB,
            Utils.InitParams({
                mintable: true,
                imageHash: bytes32(0),
                recipeHash: bytes32(0),
                mintChains: mintChains,
                masterChain: block.chainid,
                maxSupply: 0,
                maxPerMint: 0,
                minReviewThreshold: 0,
                priceSettings: Utils.PriceSettings({mode: Utils.PriceMode.LinearPrice, a: 0, b: 2, c: 2}),
                baseUri: ""
            })
        );
        console.log("aOFT delegate: %s", aOFT.owner());
        console.log("factory1 : %s", address(factory1));
        console.log("bOFT delegate: %s", bOFT.owner());
        console.log("factory2 : %s", address(factory2));
        {
            vm.chainId(31337);
            uint32[] memory endPointIds = new uint32[](1);
            endPointIds[0] = bEid;
            bytes32[] memory remoteContractAddresses = new bytes32[](1);
            remoteContractAddresses[0] = bytes32(uint256(uint160(address(bOFT))));
            address[] memory sendLibraries = new address[](0);
            address[] memory receiveLibraries = new address[](0);
            uint256[] memory gracePeriods = new uint256[](0);
            uint128[] memory minGasEnforceConfig = new uint128[](1);
            minGasEnforceConfig[0] = 100000;
            Utils.LzSetConfigParam[] memory sendConfigParams = new Utils.LzSetConfigParam[](0);
            Utils.LzSetConfigParam[] memory receiveConfigParams = new Utils.LzSetConfigParam[](0);
            Utils.LzEnforcedOptionParam[] memory enforceConfigParams = new Utils.LzEnforcedOptionParam[](0);

            Utils.LzParams memory lzParams = Utils.LzParams({
                endPointIds: endPointIds,
                remoteContractAddresses: remoteContractAddresses,
                sendLibraries: sendLibraries,
                receiveLibraries: receiveLibraries,
                gracePeriods: gracePeriods,
                minGasEnforceConfig: minGasEnforceConfig,
                sendConfigParams: sendConfigParams,
                receiveConfigParams: receiveConfigParams,
                enforceConfigParams: enforceConfigParams
            });
            factory1.setupLz(aOFT, lzParams);
        }
        {
            vm.chainId(31338);
            uint32[] memory endPointIds = new uint32[](1);
            endPointIds[0] = aEid;
            bytes32[] memory remoteContractAddresses = new bytes32[](1);
            remoteContractAddresses[0] = bytes32(uint256(uint160(address(aOFT))));
            address[] memory sendLibraries = new address[](0);
            address[] memory receiveLibraries = new address[](0);
            uint256[] memory gracePeriods = new uint256[](0);
            uint128[] memory minGasEnforceConfig = new uint128[](1);
            minGasEnforceConfig[0] = 100000;
            Utils.LzSetConfigParam[] memory sendConfigParams = new Utils.LzSetConfigParam[](0);
            Utils.LzSetConfigParam[] memory receiveConfigParams = new Utils.LzSetConfigParam[](0);
            Utils.LzEnforcedOptionParam[] memory enforceConfigParams = new Utils.LzEnforcedOptionParam[](0);

            Utils.LzParams memory lzParams = Utils.LzParams({
                endPointIds: endPointIds,
                remoteContractAddresses: remoteContractAddresses,
                sendLibraries: sendLibraries,
                receiveLibraries: receiveLibraries,
                gracePeriods: gracePeriods,
                minGasEnforceConfig: minGasEnforceConfig,
                sendConfigParams: sendConfigParams,
                receiveConfigParams: receiveConfigParams,
                enforceConfigParams: enforceConfigParams
            });
            factory2.setupLz(bOFT, lzParams);
        }

        vm.chainId(31337);
        uint256 aPrice = aOFT.mintPrice(initialBalance);
        console.log("aPrice %s", aPrice);
        vm.chainId(31337);
        aOFT.mint{value: aPrice * initialBalance}(initialBalance, userA);
        console.log("a minted %s", aOFT.balanceOf(userA));
        vm.chainId(31337);
        uint256 bPrice = bOFT.mintPrice(initialBalance);
        console.log("bPrice %s", bPrice);
        vm.chainId(31338);
        vm.expectRevert();
        bOFT.mint{value: bPrice * initialBalance}(initialBalance, userB);
        vm.chainId(31337);
        bOFT.mint{value: bPrice * initialBalance}(initialBalance, userB);
        console.log("aOFT owner after setup: %s", aOFT.owner());
        console.log("bOFT after setup: %s", bOFT.owner());
        vm.stopPrank();
    }

    function test_constructor() public {
        assertEq(aOFT.owner(), deployer);
        assertEq(bOFT.owner(), deployer);

        assertEq(aOFT.balanceOf(userA), initialBalance);
        assertEq(bOFT.balanceOf(userB), initialBalance);

        assertEq(aOFT.token(), address(aOFT));
        assertEq(bOFT.token(), address(bOFT));
    }
    //
    //    function test_send_oft() public {
    //        uint256 tokensToSend = 1 ether;
    //        bytes memory options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(200000, 0);
    //        SendParam memory sendParam = SendParam(
    //            bEid,
    //            addressToBytes32(userB),
    //            tokensToSend,
    //            tokensToSend,
    //            options,
    //            "",
    //            ""
    //        );
    //        MessagingFee memory fee = aOFT.quoteSend(sendParam, false);
    //
    //        assertEq(aOFT.balanceOf(userA), initialBalance);
    //        assertEq(bOFT.balanceOf(userB), initialBalance);
    //
    //        vm.prank(userA);
    //        aOFT.send{value: fee.nativeFee}(sendParam, fee, payable(address(this)));
    //        verifyPackets(bEid, addressToBytes32(address(bOFT)));
    //
    //        assertEq(aOFT.balanceOf(userA), initialBalance - tokensToSend);
    //        assertEq(bOFT.balanceOf(userB), initialBalance + tokensToSend);
    //    }
}
