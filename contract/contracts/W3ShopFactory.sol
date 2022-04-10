//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "./W3Shop.sol";

contract W3ShopFactory {
    event Created(address indexed owner, address shop);

    constructor() {}

    function createShop(
        address owner,
        string memory shopConfig,
        string memory ownerNftId,
        bytes32 salt
    ) public returns (address) {
        address shop = address(new W3Shop{salt: salt}(owner, shopConfig, ownerNftId));
        emit Created(owner, shop);

        return shop;
    }
}
