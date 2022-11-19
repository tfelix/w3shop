//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "hardhat/console.sol";
import "../W3ShopItems.sol";

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

    function mintOwnerToken(W3ShopItems _items) external {
        _items.mintOwnerNft(msg.sender, "test");
    }
}