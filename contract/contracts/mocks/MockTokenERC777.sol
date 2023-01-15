//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";

// In order to properly test ERC777 you need to deploy the registry
// https://forum.openzeppelin.com/t/simple-erc777-token-example/746

/**
 * Only to be used for testing to register addresses as shops.
 */
contract MockTokenERC777 is ERC777 {
    constructor() ERC777("W3TEST", "W3TEST", new address[](0)) {
        _mint(msg.sender, 100000, "", "");
    }
}
