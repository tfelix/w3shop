//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "hardhat/console.sol";
import "./MerkleMultiProof.sol";
import "./W3Shop.sol";
import "./IW3ShopPaymentProcessor.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * The payment processor checks and performs the payment validation.
 * If the validation was successful it forwards the payment to the
 * shops register.
 */
contract W3PaymentProcessorV1 is IW3ShopPaymentProcessor {
    using SafeERC20 for IERC20;
    address public constant CURRENCY_ETH = address(0);

    constructor() {}

    function buyWithEther(BuyParams calldata _params) external payable {
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

    function buyWithToken(address _token, BuyParams calldata _params) external {
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
        bytes32[] memory leafs = new bytes32[](params.amounts.length);
        for (uint256 i = 0; i < params.amounts.length; i++) {
            // Calculate the leafs
            leafs[i] = sha256(abi.encode(params.itemIds[i], params.prices[i]));
        }

        require(
            MerkleMultiProof.verify(
                shop.getItemsRoot(),
                leafs,
                params.proofs,
                params.proofFlags
            ),
            "invalid proof"
        );
    }
}
