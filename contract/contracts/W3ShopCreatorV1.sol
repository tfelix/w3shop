//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "hardhat/console.sol";

import "./W3ShopFactory.sol";
import "./IW3ShopPaymentProcessor.sol";
import "./W3ShopVaultV1.sol";

/**
 * Helper contract that bootstraps the creation of the vault and directly adds it to
 * the generated shop.
 */
contract W3ShopCreatorV1 {
    W3ShopFactory public immutable shopFactory;

    constructor(W3ShopFactory _shopFactory) {
        shopFactory = _shopFactory;
    }

    function createShop(
        address _owner,
        IW3ShopPaymentProcessor _paymentProcessor,
        string calldata _shopConfig,
        string calldata _ownerNftId,
        bytes32 _salt
    ) external returns (W3Shop) {
        W3Shop shop = shopFactory.createShop(
            _owner,
            _paymentProcessor,
            _shopConfig,
            _ownerNftId,
            _salt
        );

        W3ShopVaultV1 vault = new W3ShopVaultV1(shop);
        shop.setVault(vault, _owner);

        return shop;
    }
}
