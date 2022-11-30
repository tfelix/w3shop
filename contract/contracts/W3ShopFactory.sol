//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "./IW3ShopPaymentProcessor.sol";
import "./W3Shop.sol";

/**
 * This factory builds your shops and also registers the new shops to be used with the
 * shop item registry.
 */
contract W3ShopFactory {
    event CreatedShop(address indexed owner, address shop);

    mapping(address => bool) private createdShop;

    function createShop(
        W3Shop.InitParams calldata _params,
        bytes32 _salt
    ) external returns (W3Shop) {
        bytes32 hashedSalt = keccak256(abi.encodePacked(_params.owner, _salt));
        W3Shop shop = new W3Shop{salt: hashedSalt}();

        require(!createdShop[address(shop)]);
        createdShop[address(shop)] = true;

        shop.initialize(_params);

        emit CreatedShop(_params.owner, address(shop));

        return shop;
    }

    function isW3Shop(address _shop) external view returns (bool) {
        return createdShop[_shop];
    }
}
