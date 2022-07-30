//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./W3Shop2.sol";

/**
 * This factory builds your shops and also registers the new shops to be used with the
 * shop item registry.
 */
contract W3ShopFactory2 {
    event Created(address indexed owner, address shop);

    mapping(address => bool) registeredShop;

    constructor() {}

    function createShop(
        address _owner,
        string calldata _shopConfig,
        string calldata _ownerNftId,
        bytes32 _salt
    ) external returns (address) {
        W3Shop2 shop = new W3Shop2{salt: _salt}(_shopConfig);
        registeredShop[shop] = true;
        shop.mintOwnerNft(_owner, _ownerNftId);

        emit Created(_owner, shop);

        return shop;
    }

    function isRegisteredShop(address _shop) external view returns (bool) {
        return registeredShop[_shop];
    }
}
