//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "hardhat/console.sol";
import "./W3Shop.sol";
import "./IW3ShopPaymentProcessor.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * This contract allows the participant to exchange shop items against each other in a safe way.
 *
 * The protocol works in a way that Alice creates an offer, which is a list of items and amounts she
 * wants to receive in exchange for one or multiple items she offers. The hash of the offer and the
 * list of items she want to trade is send to this contract.
 *
 * Offers can expire after some amount of time.
 */
contract W3TradepostV1 is ReentrancyGuard, IERC1155Receiver {
    using SafeERC20 for IERC20;

    mapping(bytes32 => bool) private currentOffers;

    struct OfferData {
        address creator;
        /**
         * The items that are offered.
         */
        uint32[] offerAmounts;
        uint256[] offerItemIds;
        address[] offerShops;
        /**
         * The items agains which should be traded.
         */
        uint32[] tradeAmounts;
        uint256[] tradeItemIds;
        address[] tradeShops;
    }

    constructor() {}

/*
    function redeemOffer(bytes32 _offerHash) {
        // Check if the hash of the offer equals an existing one
    }

    function cancelOffer(bytes32 _offerHash) {
        Offer existingOffer = currentOffers[_offerHash];
    }*/

    function supportsInterface(bytes4 interfaceId)
        external
        view
        returns (bool)
    {
        // FIME
        return false;
    }

    /**
     * @dev Handles the receipt of a single ERC1155 token type. This function is
     * called at the end of a `safeTransferFrom` after the balance has been updated.
     *
     * NOTE: To accept the transfer, this must return
     * `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`
     * (i.e. 0xf23a6e61, or its own function selector).
     *
     * @param operator The address which initiated the transfer (i.e. msg.sender)
     * @param from The address which previously owned the token
     * @param id The ID of the token being transferred
     * @param value The amount of tokens being transferred
     * @param data Additional data with no specified format
     * @return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` if transfer is allowed
     */
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /**
     * @dev Handles the receipt of a multiple ERC1155 token types. This function
     * is called at the end of a `safeBatchTransferFrom` after the balances have
     * been updated.
     *
     * NOTE: To accept the transfer(s), this must return
     * `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`
     * (i.e. 0xbc197c81, or its own function selector).
     *
     * @param operator The address which initiated the batch transfer (i.e. msg.sender)
     * @param from The address which previously owned the token
     * @param ids An array containing ids of each token being transferred (order and length must match values array)
     * @param values An array containing amounts of each token being transferred (order and length must match ids array)
     * @param data Additional data with no specified format
     * @return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` if transfer is allowed
     */
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
