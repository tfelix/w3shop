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
 * This contract allows the receiving of the following kind of tokens:
 * - ERC20 and compatibles
 * - ERC1155
 * - ERC777
 *
 * This is the improved version that also enables on the fly token swaps via Uniswap.
 */
contract W3PaymentProcessorV2 is
    IW3ShopPaymentProcessor,
    ReentrancyGuard,
    IERC1155Receiver
{
    using SafeERC20 for IERC20;
    address public constant CURRENCY_ETH = address(0);

    constructor() {}

    function supportsInterface(bytes4 interfaceId)
        external
        view
        returns (bool)
    {
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
        BuyParams memory buyParams = abi.decode(data, (BuyParams));

/*
        (uint256 totalPrice, address receiver, W3Shop shop) = prepareBuy(
            msg.sender,
            buyParams
        );*/

        // when all checks have passed and money was transferred create the
        // shop items.
        // shop.buy(operator, buyParams.amounts, buyParams.itemIds);

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
     * @return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` if transfer is allowed
     */
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external pure returns (bytes4) {
        return 0;
    }

    function buyWithEther(BuyParams calldata _params)
        external
        payable
        nonReentrant
    {
        (uint256 totalPrice, address receiver, W3Shop shop) = prepareBuy(
            CURRENCY_ETH,
            _params
        );
        require(msg.value == totalPrice, "invalid amount");

        // If all checks are okay, forward the ETH to the shop.
        payable(receiver).transfer(msg.value);

        // when all checks have passed and money was transferred create the
        // shop items.
        shop.buy(msg.sender, _params.amounts, _params.itemIds);
    }

    function buyWithToken(address _token, BuyParams calldata _params)
        external
        nonReentrant
    {
        (uint256 totalPrice, address receiver, W3Shop shop) = prepareBuy(
            _token,
            _params
        );

        IERC20 token = IERC20(_token);

        token.safeTransferFrom(msg.sender, receiver, totalPrice);

        // when all checks have passed and money was transferred create the
        // shop items.
        shop.buy(msg.sender, _params.amounts, _params.itemIds);
    }

    function prepareBuy(address expectedCurrency, BuyParams calldata params)
        internal
        view
        returns (
            uint256 totalPrice,
            address receiver,
            W3Shop shop
        )
    {
        shop = W3Shop(params.shop);
        receiver = shop.getPaymentReceiver();

        require(receiver != address(0), "no receiver");
        require(
            shop.getAcceptedCurrency() == expectedCurrency,
            "currency not accepted"
        );

        require(
            params.prices.length == params.amounts.length &&
                params.prices.length == params.itemIds.length,
            "invalid args"
        );

        requireValidMerkleProof(shop, params);

        totalPrice = getTotalPrice(params.amounts, params.prices);
    }

    function getTotalPrice(uint32[] calldata amounts, uint256[] calldata prices)
        internal
        pure
        returns (uint256)
    {
        uint256 totalPrice = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalPrice += prices[i] * amounts[i];
        }

        return totalPrice;
    }

    function requireValidMerkleProof(W3Shop shop, BuyParams calldata params)
        internal
        view
    {
        bytes32[] memory leaves = new bytes32[](params.amounts.length);
        for (uint256 i = 0; i < params.amounts.length; i++) {
            leaves[i] = keccak256(
                bytes.concat(
                    keccak256(abi.encode(params.itemIds[i], params.prices[i]))
                )
            );
        }

        bool hasValidProof = MerkleProof.multiProofVerify(
            params.proofs,
            params.proofFlags,
            shop.getItemsRoot(),
            leaves
        );
        require(hasValidProof, "invalid proof");
    }
}
