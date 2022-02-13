//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "hardhat/console.sol";

contract W3Shop is ERC1155 {
    modifier onlyShopOwner() {
        require(balanceOf(msg.sender, 0) == 1, "Not the shop owner");
        _;
    }

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
    function buy() public payable returns (uint256) {
        uint256 a = 1; // local variable
        uint256 b = 2;
        uint256 result = a + b;
        return result;
    }

    function cashout() public onlyShopOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}
