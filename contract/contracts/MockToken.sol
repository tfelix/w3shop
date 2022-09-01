//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * Only to be used for testing to register addresses as shops.
 */
contract MockToken is ERC20 {
    constructor() ERC20("MOK", "Mock Token") {
        _mint(msg.sender, 100000);
    }
}
