//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

import "./W3ShopFactory.sol";
import "./W3ShopItems.sol";
import "./IW3ShopPaymentProcessor.sol";
import "./W3ShopVaultV1.sol";

import "hardhat/console.sol";

/**
 * Helper contract that bootstraps the creation of the vault and directly adds it to
 * the generated shop.
 * This saves the user a second TX to sign when the shop is created.
 */
contract W3ShopCreatorV1 is IERC1155Receiver {
    event Created(address indexed owner, address shop);

    W3ShopFactory public immutable shopFactory;
    W3ShopItems public immutable shopItems;

    constructor(W3ShopFactory _shopFactory, W3ShopItems _shopItems) {
        shopFactory = _shopFactory;
        shopItems = _shopItems;
    }

    function createShop(
        address _owner,
        IW3ShopPaymentProcessor _paymentProcessor,
        string calldata _shopConfig,
        string calldata _ownerNftId,
        bytes32 _salt
    ) external returns (W3Shop) {
        // we need to make ourself a owner when we set the vault.
        W3Shop shop = shopFactory.createShop(
            address(this),
            _paymentProcessor,
            _shopConfig,
            _ownerNftId,
            _salt
        );

        W3ShopVaultV1 vault = new W3ShopVaultV1(shop);
        shop.setVault(vault, _owner);

        uint256 ownerTokenId = shop.getOwnerTokenId();

        // Transfer ownership now to the real owner.
        shopItems.safeTransferFrom(address(this), _owner, ownerTokenId, 1, "");

        emit Created(_owner, address(shop));

        return shop;
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256,
        uint256,
        bytes calldata
    ) public virtual returns (bytes4) {
        // we only allow to receive tokens from the shop items contract to not get other unrelated tokens.
        require(
            from == address(0x0) && operator == address(shopFactory),
            "cant receive token"
        );
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] memory,
        uint256[] memory,
        bytes calldata
    ) public virtual returns (bytes4) {
        // we only allow to receive tokens from the shop items contract to not get other unrelated tokens.
        require(
            from == address(0x0) && operator == address(shopFactory),
            "cant receive token"
        );
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId)
        external
        pure
        returns (bool)
    {
        return interfaceId == type(IERC1155).interfaceId;
    }
}
