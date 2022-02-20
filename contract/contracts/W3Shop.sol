//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "hardhat/console.sol";

contract W3Shop is ERC1155 {
    modifier onlyShopOwner() {
        require(balanceOf(msg.sender, 0) == 1, "not owner");
        _;
    }

    modifier isShopOpen() {
        require(isOpened, "shop closed");
        _;
    }

    bool private isOpened = true;
    bytes32 public offerRoot;

    constructor(string memory uri_) ERC1155(uri_) {
        // Mint the owner NFT of the shop to the deployer.
        _mint(msg.sender, 0, 1, "");
    }

    /**
     * This function requires the bought items and collections with their prices.
     * It checks if the given prices are correct to the anchored Merkle root and
     * checks if the amount of ETH send equals the required payment.
     * If this works it will batch mint the owner NFTs.
     */
    function buy(
        uint256 amounts,
        uint256 prices,
        uint256 itemIds,
        bytes32[] memory proof
    ) public payable isShopOpen {
        // require(price.length == amounts.length && price.length == itemIds.length, "invalid data lengths");
        bytes32 leaf = keccak256(abi.encodePacked(prices, itemIds));

        // Verify if the given data is valid and in the merkle root
        require(verify(offerRoot, leaf, proof), "invalid buy data");

        // Calculate the total price
        uint256 totalPrice = prices * amounts;

        require(msg.value >= totalPrice, "payed too less");
        // Sanity check to never mint the special owner NFT.
        require(itemIds != 0, "invalid item id");

        // _mintBatch(msg.sender, );
        _mint(msg.sender, itemIds, amounts, "");
    }

    function setOfferRoot(bytes32 newOffersRoot)
        public
        onlyShopOwner
        isShopOpen
    {
        offerRoot = newOffersRoot;
    }

    function cashout() public onlyShopOwner isShopOpen {
        payable(msg.sender).transfer(address(this).balance);
    }

    function closeShop() public onlyShopOwner isShopOpen {
        cashout();
        _burn(msg.sender, 0, 1);
        isOpened = false;
    }

    // TODO maybe put this into a own contract to save memory here.
    function verify(
        bytes32 root,
        bytes32 leaf,
        bytes32[] memory proof
    ) public pure returns (bool) {
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
