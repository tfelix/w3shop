//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./MerkleMultiProof.sol";
import "./W3Shop.sol";
import "./IW3ShopVault.sol";
import "./IW3ShopPaymentProcessor.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * The payment processor checks and performs the payment validation.
 * If the validation was successful it forwards the payment to the
 * shops register.
 */
contract W3PaymentProcessor is IW3ShopPaymentProcessor {
    using SafeERC20 for IERC20;
    address public constant CURRENCY_ETH = address(0);

    constructor() {}

    function buyWithEther(BuyParams calldata _params) external payable {
        W3Shop shop = W3Shop(_params.shop);
        IW3ShopVault vault = shop.getVault();

        require(
            vault.getAcceptedCurrency() == CURRENCY_ETH,
            "eth not accepted"
        );

        performBuyChecks(shop, _params);

        uint256 totalPrice = getTotalPrice(_params.amounts, _params.prices);
        require(msg.value >= totalPrice, "invalid amount");

        // If all checks are okay, forward the ETH to the shop.
        payable(address(vault)).transfer(msg.value);

        // when all checks have passed and money was transferred create the
        // shop items.
        shop.buy(msg.sender, _params.amounts, _params.itemIds);
    }

    function buyWithToken(address _token, BuyParams calldata _params) external {
        W3Shop shop = W3Shop(_params.shop);
        IW3ShopVault vault = shop.getVault();

        require(vault.getAcceptedCurrency() == _token, "token not accepted");

        performBuyChecks(shop, _params);

        uint256 totalPrice = getTotalPrice(_params.amounts, _params.prices);
        IERC20 token = IERC20(_token);

        // If payed in same currency as shop wants, just transfer the money.
        token.safeIncreaseAllowance(address(this), totalPrice);

        // In case the amount is not enough this will revert.
        token.safeTransfer(_params.shop, totalPrice);

        // when all checks have passed and money was transferred create the
        // shop items.
        shop.buy(msg.sender, _params.amounts, _params.itemIds);
    }

    function performBuyChecks(W3Shop shop, BuyParams calldata params)
        internal
        view
    {
        require(
            params.prices.length == params.amounts.length &&
                params.prices.length == params.itemIds.length,
            "invalid args"
        );

        requireValidMerkleProof(shop, params);
    }

    function getTotalPrice(
        uint256[] calldata amounts,
        uint256[] calldata prices
    ) internal pure returns (uint256) {
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
