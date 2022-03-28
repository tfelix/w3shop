//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "./MerkleMultiProof.sol";
import "hardhat/console.sol";

contract W3Shop is ERC1155 {
    string constant INVALID = "invalid";

    modifier onlyShopOwner() {
        require(balanceOf(msg.sender, 0) == 1, "not owner");
        _;
    }

    modifier isShopOpen() {
        require(_isOpened, "shop closed");
        _;
    }

    bool private _isOpened = true;
    bytes32 public offerRoot;
    // Token ID to custom URI mapping
    mapping(uint256 => string) private _uris;

    // string memory uri_ handle the NFT URI somehow, we need URI per shop.
    constructor(address owner) ERC1155("") {
        // Mint the owner NFT of the shop to the deployer.
        _mint(owner, 0, 1, "");
    }

    /**
     * @dev See {IERC1155MetadataURI-uri}.
     *
     * This implementation returns the same URI for *all* token types. It relies
     * on the token type ID substitution mechanism
     * https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     *
     * Clients calling this function must replace the `\{id\}` substring with the
     * actual token type ID.
     */
    function uri(uint256 id)
        public
        view
        virtual
        override
        returns (string memory)
    {
        return _uris[id];
    }

    /**
     * This function requires the bought items and collections with their prices.
     * It checks if the given prices are correct to the anchored Merkle root and
     * checks if the amount of ETH send equals the required payment.
     * If this works it will batch mint the owner NFTs.
     */
    function buy(
        uint256[] memory amounts,
        uint256[] memory prices,
        uint256[] memory itemIds,
        bytes32[][] memory proof // that probably will make issues
    ) public payable isShopOpen {
        require(
            prices.length == amounts.length && prices.length == itemIds.length,
            INVALID
        );

        uint256 totalPrice = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            // Verify if the given data is valid and in the merkle root
            bytes32 leaf = keccak256(abi.encodePacked(prices[i], itemIds[i]));
            require(verify(offerRoot, leaf, proof[i]), INVALID);

            // Calculate the total price
            totalPrice += prices[i] * amounts[i];

            // Sanity check to never mint the special owner NFT.
            require(itemIds[i] != 0, INVALID);
        }

        require(msg.value >= totalPrice, INVALID);

        _mintBatch(msg.sender, itemIds, amounts, "");
    }

    /**
     * This function requires the bought items and collections with their prices.
     * It checks if the given prices are correct to the anchored Merkle root and
     * checks if the amount of ETH send equals the required payment.
     * If this works it will batch mint the owner NFTs.
     */
    function buyMulti(
        uint256[] memory amounts,
        uint256[] memory prices,
        uint256[] memory itemIds,
        bytes32[] memory proofs,
        bool[] memory proofFlag
    ) public payable isShopOpen {
        require(
            prices.length == amounts.length && prices.length == itemIds.length,
            INVALID
        );

        uint256 totalPrice = 0;
        bytes32[] memory leafs = new bytes32[](amounts.length);
        for (uint256 i = 0; i < amounts.length; i++) {
            // Calculate the leafs
            leafs[i] = keccak256(abi.encodePacked(prices[i], itemIds[i]));

            // Calculate the total price
            totalPrice += prices[i] * amounts[i];

            // Sanity check to never mint the special owner NFT.
            require(itemIds[i] != 0, INVALID);

            // Sanity check that the amount is bigger then 0
            require(amounts[i] > 0, INVALID);
        }

        require(
            MerkleMultiProof.verifyMultiProof(
                offerRoot,
                leafs,
                proofs,
                proofFlag
            ),
            INVALID
        );

        // User must have payed at least the amount that was calculated
        require(msg.value >= totalPrice, INVALID);

        _mintBatch(msg.sender, itemIds, amounts, "");
    }

    function setOfferRoot(bytes32 newOffersRoot)
        public
        onlyShopOwner
        isShopOpen
    {
        offerRoot = newOffersRoot;
    }

    function cashout(address receiver) public onlyShopOwner isShopOpen {
        payable(receiver).transfer(address(this).balance);
    }

    function closeShop() public onlyShopOwner isShopOpen {
        cashout(msg.sender);
        _burn(msg.sender, 0, 1);
        _isOpened = false;
    }

    function verify(
        bytes32 root,
        bytes32 leaf,
        bytes32[] memory proof
    ) private pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash <= proofElement) {
                // Hash(current computed hash + current element of the proof)
                computedHash = keccak256(
                    abi.encodePacked(computedHash, proofElement)
                );
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = keccak256(
                    abi.encodePacked(proofElement, computedHash)
                );
            }
        }

        // Check if the computed hash (root) is equal to the provided root
        return computedHash == root;
    }
}
