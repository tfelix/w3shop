//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "./W3Shop.sol";
import "./W3ShopRegistry.sol";

contract W3ShopFactory {
    event Created(address indexed owner, address shop);

    W3ShopRegistry private registry;

    constructor(address _registry) {
      registry = W3ShopRegistry(_registry);
      registry.setFactory(address(this));
    }

    function createShop(
        address _owner,
        string memory _shopConfig,
        string memory _ownerNftId,
        bytes32 _salt
    ) external returns (address) {
        address shop = address(new W3Shop{salt: _salt}(_owner, _shopConfig, _ownerNftId));
        registry.registerShop(shop);

        emit Created(_owner, shop);

        return shop;
    }
}
