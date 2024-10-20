// SPDX-License-Identifier: CC-BY-NC-4.0
pragma solidity ^0.8.26;

library Utils {
    struct MemeParams {
        string name;
        string symbol;
        address endpoint;
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
    function computeUnitPrice(PriceSettings memory s, uint256 quantity, uint256 supply)
        internal
        pure
        returns (uint256)
    {
        if (s.mode == PriceMode.ConstantPrice) {
            return s.c;
        } else if (s.mode == PriceMode.LinearPrice) {
            return s.b * (quantity + supply) + s.c;
        }
        uint256 newSupply = quantity + supply;
        return s.a * s.a * newSupply + s.b * newSupply + s.c;
    }

    struct Review {
        bytes32 hash;
        uint8 rating;
        uint256 balance;
    }
}
