//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "hardhat/console.sol";

/**
 * This is only a wrapper to the OpenZeppelin library that is used internally for testing
 * the multiproof code.
 */
library MerkleMultiProof {
    function verify(
        bytes32 root,
        uint256[] memory itemIds,
        uint256[] memory itemPrices,
        bytes32[] memory proofs,
        bool[] memory proofFlags
    ) public pure returns (bool) {
        require(itemIds.length == itemPrices.length);

        bytes32[] memory leafs = new bytes32[](itemIds.length);
        // Calculate the leafs
        for (uint256 i = 0; i < itemIds.length; i++) {
            leafs[i] = keccak256(
                bytes.concat(
                    keccak256(abi.encode(itemIds[i], itemPrices[i]))
                )
            );
        }

        bool hasValidProof = MerkleProof.multiProofVerify(
            proofs,
            proofFlags,
            root,
            leafs
        );

        return hasValidProof;
    }
}
