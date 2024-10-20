// SPDX-License-Identifier: CC-BY-NC-4.0
pragma solidity ^0.8.28;

interface MemeMetadata {
    function contractURI() external view returns (string memory);
}