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
        bytes32[] memory leafs,
        bytes32[] memory proofs,
        bool[] memory proofFlags
    ) public pure returns (bool) {
        bool hasValidProof = MerkleProof.multiProofVerify(
            proofs,
            proofFlags,
            root,
            leafs
        );

        return hasValidProof;
    }
}
