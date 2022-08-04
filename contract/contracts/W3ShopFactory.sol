//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./W3Shop.sol";
import "./W3ShopItems.sol";

/**
 * This factory builds your shops and also registers the new shops to be used with the
 * shop item registry.
 */
contract W3ShopFactory {
    event Created(address indexed owner, address shop);

    mapping(address => bool) private registeredShop;
    W3ShopItems public immutable shopItems;

    constructor() {
        shopItems = new W3ShopItems(this);
    }

    function createShop(
        address _owner,
        address _paymentProcessor,
        string calldata _shopConfig,
        string calldata _ownerNftId,
        bytes32 _salt
    ) external returns (address) {
        W3Shop shop = new W3Shop{salt: _salt}(_paymentProcessor, shopItems, _shopConfig);
        registeredShop[address(shop)] = true;
        shop.mintOwnerNft(_owner, _ownerNftId);

        emit Created(_owner, address(shop));

        return address(shop);
    }

    function isRegisteredShop(address _shop) external view returns (bool) {
        return registeredShop[_shop];
    }
}
