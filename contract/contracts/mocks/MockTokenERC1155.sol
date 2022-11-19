//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/**
 * Only to be used for testing to register addresses as shops.
 */
contract MockTokenERC1155 is ERC1155 {
    constructor() ERC1155("") {
        _mint(msg.sender, 1, 100000, "");
    }
}
