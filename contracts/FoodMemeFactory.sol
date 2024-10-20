// SPDX-License-Identifier: CC-BY-NC-4.0
pragma solidity ^0.8.26;

import {FoodMeme} from "./FoodMeme.sol";
import {Utils} from "./Utils.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

contract FoodMemeFactory is Ownable {
    using Clones for address;

    address FOOD_MEME_REF;
    string baseUrl;

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

    function predictAddress(Utils.MemeParams memory params) external view returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(params.name, params.symbol, baseUrl, FOOD_MEME_REF));
        bytes memory args = abi.encode(params.name, params.symbol, params.endpoint, owner());
        return FOOD_MEME_REF.predictDeterministicAddressWithImmutableArgs(args, salt, address(this));
    }

    function launch(Utils.MemeParams memory params) external {
        bytes32 salt = keccak256(abi.encodePacked(params.name, params.symbol, baseUrl, FOOD_MEME_REF));
        bytes memory args = abi.encode(params.name, params.symbol, params.endpoint, owner());
        address instance = FOOD_MEME_REF.cloneDeterministicWithImmutableArgs(args, salt);
        emit MemeLaunched(params.name, params.symbol, instance, msg.sender);
    }
}
