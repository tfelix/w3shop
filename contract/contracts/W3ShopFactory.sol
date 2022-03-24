//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "./W3Shop.sol";

contract W3ShopFactory {
    event Created(address indexed creator, address shop);

    constructor() {}

    function createShop() public returns (address) {
        address shop = address(new W3Shop(msg.sender));
        emit Created(msg.sender, shop);

        return shop;
    }
}
