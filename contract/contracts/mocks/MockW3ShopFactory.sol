//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "hardhat/console.sol";

/**
 * Only to be used for testing to register addresses as shops.
 */
contract MockW3ShopFactory {
    mapping(address => bool) private registeredShop;

    constructor() {}

    function registerAddress(address _addr) external {
        registeredShop[_addr] = true;
    }

    function isRegisteredShop(address _shop) external view returns (bool) {
        return registeredShop[_shop];
    }
}
