// SPDX-License-Identifier: CC-BY-NC-4.0
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {MemeMetadata} from "./MemeMetadata.sol";
import {Utils} from "./Utils.sol";
import {OFT} from "@layerzerolabs/oft-evm/OFT.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract FoodMeme is MemeMetadata, OFT, AccessControl {
    string public contractURI;
    bool public isInitialized;

    mapping(address => Utils.Review) public reviews;
    uint256 public numReviewers;
    uint256 public ratingTotal;

    bytes32 public imageHash;
    bytes32 public recipeHash;

    // TODO: combine settings into single state var

    // TODO: this is local to the current chain. We should sync global max supply
    uint256 public maxSupply = 1_000_000_000 * 1e18;

    uint256 public maxPerMint = 100 * 1e18;

    uint256 public minReviewThreshold = 5 * 1e18;

    uint256 public unlockTime;

    bool public mintable;
    uint256 public masterChainId;
    uint256[] public mintChainIds;

    // TOOD: this is local to the current chain. We should have some globally synced, oracle-based dynamic price adjustment mechanism later
    Utils.PriceSettings public priceSettings;

    bytes32 public constant ROLE_FACTORY = keccak256("ROLE_FACTOR");
    bytes32 public constant ROLE_MAKER = keccak256("ROLE_MAKER");

    error TokenLocked();
    error AlreadyUnlocked();
    error InsufficientPayment();
    error MaxSupplyExceeded();
    error BelowMinReviewThreshold();
    error PerMintAmountExceeded();
    error NoReview();
    error AlreadyInitialized();
    error NotInitialized();
    error NotMasterChain();
    error NotMintChain();
    error MintDisabled();

    event EarlyUnlock(uint256 previousUnlockTime);
    event MintPaused();
    event MintResumed();

    modifier initializer() {
        if (isInitialized) {
            revert AlreadyInitialized();
        }
        _;
        isInitialized = true;
    }

    modifier initialized() {
        if (!isInitialized) {
            revert NotInitialized();
        }
        _;
    }

    modifier masterChainOnly() {
        if (block.chainid != masterChainId) {
            revert NotMasterChain();
        }
        _;
    }

    modifier mintChainOnly() {
        bool isMintChain = false;
        for (uint256 i = 0; i < mintChainIds.length; i++) {
            if (mintChainIds[i] == block.chainid) {
                isMintChain = true;
                break;
            }
        }
        if (!isMintChain) {
            revert NotMintChain();
        }
        _;
    }

    constructor(string memory _name, string memory _symbol, address _lzEndpoint, address _delegate)
    OFT(_name, _symbol, _lzEndpoint, _delegate)
    Ownable(_delegate)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, _delegate);
        _grantRole(ROLE_FACTORY, msg.sender);
        _grantRole(ROLE_MAKER, msg.sender);
    }

    function _update(address from, address to, uint256 value) internal virtual override initialized {
        if (unlockTime > 0 && block.timestamp < unlockTime) {
            revert TokenLocked();
        }
        super._update(from, to, value);
    }

    function unlock() external onlyRole(ROLE_MAKER) initialized {
        if (block.timestamp >= unlockTime) {
            revert AlreadyUnlocked();
        }
        emit EarlyUnlock(unlockTime);
        unlockTime = block.timestamp;
    }

    function pauseMinting() external onlyRole(ROLE_MAKER) initialized masterChainOnly {
        emit MintPaused();
        mintable = false;
    }

    function resumeMinting() external onlyRole(ROLE_MAKER) initialized masterChainOnly {
        emit MintResumed();
        mintable = true;
    }

    function initialize(address maker, Utils.InitParams memory params) external onlyRole(ROLE_FACTORY) initializer {
        _grantRole(ROLE_MAKER, maker);
        if (params.maxSupply > 0) {
            maxSupply = params.maxSupply;
        }
        if (params.maxPerMint > 0) {
            maxPerMint = params.maxPerMint;
        }
        if (params.minReviewThreshold > 0) {
            minReviewThreshold = params.minReviewThreshold;
        }
        mintable = params.mintable;
        imageHash = params.imageHash;
        recipeHash = params.recipeHash;
        mintChainIds = params.mintChains;
        masterChainId = params.masterChain;
        setPriceSettings(params.priceSettings);
        contractURI = string.concat(params.baseUri, Strings.toHexString(address(this)));
    }

    function setMasterChainId(uint256 _masterChainId) public onlyRole(ROLE_MAKER) {
        masterChainId = _masterChainId;
    }

    function setMaxSupply(uint256 _maxSupply) public masterChainOnly onlyRole(ROLE_MAKER) {
        maxSupply = _maxSupply;
    }

    function setMaxPerMint(uint256 _maxPerMint) public masterChainOnly onlyRole(ROLE_MAKER) {
        maxPerMint = _maxPerMint;
    }

    function setMinReviewThreshold(uint256 _minReviewThreshold) public masterChainOnly onlyRole(ROLE_MAKER) {
        minReviewThreshold = _minReviewThreshold;
    }

    function setPriceSettings(Utils.PriceSettings memory _priceSettings) public masterChainOnly onlyRole(ROLE_MAKER) {
        priceSettings = _priceSettings;
    }

    function mint(uint256 quantity, address recipient) external payable mintChainOnly {
        if (!mintable) {
            revert MintDisabled();
        }
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
        // TODO: when there are more than 1 mint chains, we should use layer zero messages to sync supply increment to master chain. Per-chain price setting should still be allowed.
        // TODO: also note the total supply should be propagated to all chains, if we still want to have supply control - and very important to do that, in the case which the bounding curve (unit price) is linear or quadratic,
    }

    function hasReviewed(address user) public view masterChainOnly returns (bool) {
        return uint256(reviews[user].hash) == 0 && reviews[user].rating == 0;
    }

    function review(Utils.Review memory r) external initialized masterChainOnly {
        // TODO: we could allow review to be called from non-master chain, then use layer zero message to sync the review data (with balance set to the balance on the source chain) to master chain and store the record on master chain
        if (balanceOf(msg.sender) < minReviewThreshold) {
            revert BelowMinReviewThreshold();
        }
        if (!hasReviewed(msg.sender)) {
            ratingTotal += r.rating;
            numReviewers += 1;
        } else {
            ratingTotal -= reviews[msg.sender].rating;
            ratingTotal += r.rating;
        }
        r.balance = balanceOf(msg.sender);
        reviews[msg.sender] = r;
    }

    function deleteReview() external initialized masterChainOnly {
        // TODO: same as above. Remove masterChainOnly. Sync the deletion of review to master chain instead
        if (!hasReviewed(msg.sender)) {
            revert NoReview();
        }
        delete reviews[msg.sender];
        numReviewers -= 1;
    }

    function getAverageRating() external view masterChainOnly returns (uint256) {
        if (numReviewers == 0) {
            return 0;
        }
        return ratingTotal * Utils.DECIMALS / numReviewers / 255;
    }
}
