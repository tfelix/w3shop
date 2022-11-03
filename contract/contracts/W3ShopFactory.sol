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
        address _calculatedShopAddress,
        string calldata _shopConfig,
        string calldata _ownerNftId,
        bytes32 _salt
    ) external returns (address) {
        // We first need to register the shops address here so inside its CTOR we
        // can already access the W3ShopItems (which access this state)
        registeredShop[_calculatedShopAddress] = true;

        uint256 ownerTokenId = mintOwnerNft(_owner, _ownerNftId);

        W3Shop shop = new W3Shop{salt: _salt}(
            _paymentProcessor,
            shopItems,
            _shopConfig
        );
        shop.setOwnerTokenId(ownerTokenId);

        // Safety check if the externally calculated shop address matches the one in
        // here. Otherwise revert as this must match!
        require(_calculatedShopAddress == address(shop), "invalid shop addr");

        emit Created(_owner, address(shop));

        return address(shop);
    }

    function isRegisteredShop(address _shop) external view returns (bool) {
        return registeredShop[_shop];
    }

    function mintOwnerNft(address _owner, string calldata _ownerNftId)
        private
        returns (uint256)
    {
        string[] memory callNftId = new string[](1);
        callNftId[0] = _ownerNftId;

        uint256[] memory itemIds = shopItems.prepareItems(1);
        uint256[] memory callAmounts = new uint256[](1);
        callAmounts[0] = 1;

        // Directly set item URIs on the shop but not on this shops flag. This
        // later prevents minting new shop owner NFTs.
        shopItems.setItemUris(itemIds, callNftId);
        shopItems.mint(_owner, itemIds, callAmounts);

        return itemIds[0];
    }
}
