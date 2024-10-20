// SPDX-License-Identifier: CC-BY-NC-4.0
pragma solidity ^0.8.26;

import "@layerzerolabs/oapp-evm/interfaces/IOAppOptionsType3.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {EndpointV2} from "@layerzerolabs/lz-evm-protocol-v2/contracts/EndpointV2.sol";
import {FoodMeme} from "./FoodMeme.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Utils} from "./Utils.sol";
import {OptionsBuilder} from "@layerzerolabs/oapp-evm/libs/OptionsBuilder.sol";
import {IOAppOptionsType3} from "@layerzerolabs/oapp-evm/interfaces/IOAppOptionsType3.sol";

// TODO: we should make FoodMemeFactory an OApp, so it can receive lz messages cross-chain and act as a synchronizer can manipulate (sync) states with instance contracts
contract FoodMemeFactory is Ownable {
    using Clones for address;

    address public FOOD_MEME_REF;
    string public baseUrl;
    uint256 public launchFee;

    error InsufficientLaunchFee();

    event MemeLaunched(string name, string symbol, address indexed instance, address indexed maker);

    constructor(address _food_meme_ref, string memory _baseUrl) Ownable(msg.sender) {
        FOOD_MEME_REF = _food_meme_ref;
        baseUrl = _baseUrl;
    }

    function setRef(address _food_meme_ref) external onlyOwner {
        FOOD_MEME_REF = _food_meme_ref;
    }

    function setBaseUrl(string memory _baseUrl) external onlyOwner {
        baseUrl = _baseUrl;
    }

    function setLaunchFee(uint256 amount) external onlyOwner {
        launchFee = amount;
    }

    function predictAddress(Utils.MemeParams memory params) external view returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(params.name, params.symbol, baseUrl, FOOD_MEME_REF));
        bytes memory args = abi.encode(params.name, params.symbol, params.endpoint, address(this));
        return FOOD_MEME_REF.predictDeterministicAddressWithImmutableArgs(args, salt, address(this));
    }

    function launch(Utils.MemeParams memory params, address maker, Utils.InitParams memory initParams)
        external
        payable
    {
        if (msg.value < launchFee) {
            revert InsufficientLaunchFee();
        }
        bytes32 salt = keccak256(abi.encodePacked(params.name, params.symbol, baseUrl, FOOD_MEME_REF));
        bytes memory args = abi.encode(params.name, params.symbol, params.endpoint, address(this));
        address instance = FOOD_MEME_REF.cloneDeterministicWithImmutableArgs(args, salt);
        emit MemeLaunched(params.name, params.symbol, instance, msg.sender);
        FoodMeme f = FoodMeme(instance);
        f.initialize(maker, initParams);
    }

    function setupLz(FoodMeme f, Utils.LzParams memory params) internal {
        require(msg.sender == owner() || f.hasRole(f.ROLE_MAKER(), msg.sender), "Unauthorized");
        require(params.endPointIds.length == params.deployedContracts.length, "Bad lz params");
        require(params.endPointIds.length == params.receiveLibraries.length, "Bad lz params");
        require(params.endPointIds.length == params.sendLibraries.length, "Bad lz params");
        require(params.endPointIds.length == params.sendConfigParams.length, "Bad lz params");
        require(params.endPointIds.length == params.receiveConfigParams.length, "Bad lz params");
        require(params.endPointIds.length == params.enforceConfigParams.length, "Bad lz params");
        require(params.endPointIds.length == params.minGasEnforceConfig.length, "Bad lz params");

        for (uint256 i = 0; i < params.endPointIds.length; i++) {
            f.setPeer(params.endPointIds[i], params.deployedContracts[i]);
            if (params.receiveLibraries.length > i) {
                f.endpoint.setReceiveLibrary(
                    address(f), params.endPointIds[i], params.receiveLibraries[i], params.gracePeriods[i]
                );
            }
            if (params.sendLibraries.length > i) {
                f.endpoint.setSendLibrary(
                    address(f), params.endPointIds[i], params.sendLibraries[i], params.gracePeriods[i]
                );
            }
            if (params.sendConfigParams[i].config.length > 0) {
                f.endpoint.setConfig(address(f), params.sendLibraries[i], params.sendConfigParams[i].config);
            }
            if (params.receiveConfigParams[i].config.length > 0) {
                f.endpoint.setConfig(address(f), params.receiveLibraries[i], params.receiveConfigParams[i].config);
            }
            if (params.enforceConfigParams[i].config.length > 0) {
                f.setEnforcedOptions(params.enforceConfigParams[i].config);
            }
            if (params.minGasEnforceConfig[i] > 0) {
                EnforcedOptionParam p = EnforcedOptionParam({
                    eid: params.endPointIds[i],
                    msgType: OFTCore.SEND,
                    options: OptionsBuilder.newOptions().addExecutorLzReceiveOption(params.minGasEnforceConfig[i], 0)
                });
                f.setEnforcedOptions(params.enforceConfigParams[i].config);
            }
        }
        f.setDelegate(owner());
        f.transferOwnership(owner());
    }
}
