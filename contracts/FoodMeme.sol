// SPDX-License-Identifier: CC-BY-NC-4.0
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {MemeMetadata} from "./MemeMetadata.sol";
import {OFT} from "@layerzerolabs/oft-evm/OFT.sol";

contract FoodMeme is MemeMetadata, OFT, AccessControl {
    string public contractURI;
    bool public initialized;
    bytes32 public constant ROLE_FACTORY = keccak256("ROLE_FACTOR");
    bytes32 public constant ROLE_MAKER = keccak256("ROLE_MAKER");

    error TokenLocked();
    error AlreadyUnlocked();

    event EarlyUnlock(uint256 previousUnlockTime);

    uint256 unlockTime;

    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) Ownable(_delegate) {
        _grantRole(DEFAULT_ADMIN_ROLE, _delegate);
        _grantRole(ROLE_FACTORY, msg.sender);
    }

    modifier initializer(){
        require(!initialized);
        _;
        initialized = true;
    }

    function _update(address from, address to, uint256 value) internal virtual override {
        if(unlockTime > 0 && block.timestamp < unlockTime){
            revert TokenLocked();
        }
        super._update(from, to, value);
    }

    function unlock() onlyRole(ROLE_MAKER){
        if(block.timestamp >= unlockTime){
            revert AlreadyUnlocked();
        }
        emit EarlyUnlock(unlockTime);
        unlockTime = block.timestamp;
    }

    function initialize(address maker) onlyRole(ROLE_FACTORY) initializer(){
        _grantRole(ROLE_MAKER, maker);
    }

    function setMaxSupply(){
        
    }

    function mint() payable {

    }


}
