//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "hardhat/console.sol";

import "./IW3ShopPaymentProcessor.sol";
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
        IW3ShopPaymentProcessor _paymentProcessor,
        string calldata _shopConfig,
        string calldata _ownerNftId,
        bytes32 _salt
    ) external returns (W3Shop) {
        bytes32 hashedSalt = keccak256(abi.encodePacked(_owner, _salt));
        W3Shop shop = new W3Shop{salt: hashedSalt}(_paymentProcessor, shopItems);
        registeredShop[address(shop)] = true;

        uint256 ownerTokenId = shopItems.mintOwnerNft(_owner, _ownerNftId);
        shop.initialize(_shopConfig, ownerTokenId, _owner);

        emit Created(_owner, address(shop));

        return shop;
    }

    function isRegisteredShop(address _shop) external view returns (bool) {
        return registeredShop[_shop];
    }
}
