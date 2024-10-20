// SPDX-License-Identifier: CC-BY-NC-4.0
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {MemeMetadata} from "./MemeMetadata.sol";
import {Utils} from "./Utils.sol";
import {OFT} from "@layerzerolabs/oft-evm/OFT.sol";

contract FoodMeme is MemeMetadata, OFT, AccessControl {
    string public contractURI;
    bool public initialized;

    // TODO: this is local to the current chain. We should sync global max supply
    uint256 public maxSupply = 1_000_000_000 * 1e18;

    uint256 public maxPerMint = 100 * 1e18;

    // TOOD: this is local to the current chain. We should have some globally synced, oracle-based dynamic price adjustment mechanism later
    Utils.PriceSettings public priceSettings;

    bytes32 public constant ROLE_FACTORY = keccak256("ROLE_FACTOR");
    bytes32 public constant ROLE_MAKER = keccak256("ROLE_MAKER");

    error TokenLocked();
    error AlreadyUnlocked();
    error InsufficientPayment();
    error MaxSupplyExceeded();
    error PerMintAmountExceeded();

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
        _grantRole(ROLE_MAKER, msg.sender);
    }

    modifier initializer(){
        require(!initialized);
        _;
        initialized = true;
    }

    function _update(address from, address to, uint256 value) internal virtual override {
        if (unlockTime > 0 && block.timestamp < unlockTime) {
            revert TokenLocked();
        }
        super._update(from, to, value);
    }

    function unlock() external onlyRole(ROLE_MAKER) {
        if (block.timestamp >= unlockTime) {
            revert AlreadyUnlocked();
        }
        emit EarlyUnlock(unlockTime);
        unlockTime = block.timestamp;
    }

    function initialize(address maker) external onlyRole(ROLE_FACTORY) initializer {
        _grantRole(ROLE_MAKER, maker);
    }

    function setMaxSupply(uint256 _maxSupply) public onlyRole(ROLE_MAKER) {
        maxSupply = _maxSupply;
    }

    function setMaxPerMint(uint256 _maxPerMint) public onlyRole(ROLE_MAKER) {
        maxPerMint = _maxPerMint;
    }

    function setPriceSettings(Utils.PriceSettings memory _priceSettings) public onlyRole(ROLE_MAKER){
        priceSettings = _priceSettings;
    }

    function mint(uint256 quantity, address recipient) payable external {
        if (totalSupply() + quantity > maxSupply) {
            revert MaxSupplyExceeded();
        }
        if (quantity > maxPerMint) {
            revert PerMintAmountExceeded();
        }
        uint256 price = Utils.computeUnitPrice(priceSettings, quantity, totalSupply());
        if (!(msg.value >= price * quantity)) {
            revert InsufficientPayment();
        }
        _mint(recipient, quantity);
    }
}
