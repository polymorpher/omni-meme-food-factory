// SPDX-License-Identifier: CC-BY-NC-4.0
pragma solidity ^0.8.26;

import "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessageLibManager.sol";
import "@layerzerolabs/oapp-evm/interfaces/IOAppOptionsType3.sol";

library Utils {
    struct MemeParams {
        string name;
        string symbol;
        address endpoint;
    }

    struct LzSetConfigParam {
        SetConfigParam[] config;
    }

    struct LzEnforcedOptionParam {
        EnforcedOptionParam[] config;
    }

    struct LzParams {
        uint32[] endPointIds;
        bytes32[] remoteContractAddresses; // addresses in bytes32 form to accommodate non-EVM chains
        address[] sendLibraries;
        address[] receiveLibraries;
        uint256[] gracePeriods;
        uint128[] minGasEnforceConfig;
        LzSetConfigParam[] sendConfigParams;
        LzSetConfigParam[] receiveConfigParams;
        LzEnforcedOptionParam[] enforceConfigParams;
    }

    struct InitParams {
        bool mintable;
        bytes32 imageHash;
        bytes32 recipeHash;
        uint256[] mintChains;
        uint256 masterChain;
        uint256 maxSupply;
        uint256 maxPerMint;
        uint256 minReviewThreshold;
        PriceSettings priceSettings;
        string baseUri;
    }

    // https://docs.layerzero.network/v2/developers/evm/oft/quickstart#token-supply-cap

    uint256 constant OTF_MAX_SUPPLY = 18_446_744_073_709;

    uint256 constant DECIMALS = 10_000;

    enum PriceMode {
        // x = currentSupply + mintQuantity
        ConstantPrice, // unitPrice = c
        LinearPrice, // unitPrice =  b * x + c
        QuadraticPrice // unitPrice = a * a * x + b * x + c

    }

    struct PriceSettings {
        PriceMode mode;
        uint256 a;
        uint256 b;
        uint256 c;
    }

    // TODO: check for risk of arithmetic error here. Probably switch to Q64 or Q96
    function computeUnitPrice(PriceSettings memory s, uint256 quantity, uint256 supply, uint256 maxSupply)
        internal
        pure
        returns (uint256)
    {
        if (s.mode == PriceMode.ConstantPrice) {
            return s.c;
        } else if (s.mode == PriceMode.LinearPrice) {
            return s.b * (quantity + supply) / maxSupply / DECIMALS + s.c / DECIMALS;
        }
        uint256 newSupply = quantity + supply;
        return s.a * s.a * newSupply / DECIMALS / maxSupply / DECIMALS + s.b * newSupply / maxSupply / DECIMALS
            + s.c / DECIMALS;
    }

    struct Review {
        bytes32 hash;
        uint8 rating;
        uint256 balance;
    }
}
