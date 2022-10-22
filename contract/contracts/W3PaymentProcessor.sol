//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./MerkleMultiProof.sol";
import "./W3Shop.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * This contract should be able to accept "any" ERC20, token, convert it to the target currency
 * of the shop owner and then trigger the purchase of the items.
 */
contract W3PaymentProcessor {
    using SafeERC20 for IERC20;

    struct BuyParams {
        address payable shop;
        uint256[] amounts;
        uint256[] prices;
        uint256[] itemIds;
        bytes32[] proofs;
        bool[] proofFlags;
    }

    address public constant BASE_ETHER = address(0);

    constructor() {}

    function buyWithEther(BuyParams calldata _params) external payable {
        (W3Shop shop, uint256 totalPrice) = performBuyChecks(_params);
        require(shop.acceptedCurrency() == BASE_ETHER, "ether not accepted");

        require(msg.value >= totalPrice, "invalid amount");
        payable(shop).transfer(msg.value);

        // when all checks have passed and money was transferred create the
        // shop items.
        shop.buy(msg.sender, _params.amounts, _params.itemIds);
    }

    function buyWithSameToken(address _token, BuyParams calldata _params)
        external
    {
        (W3Shop shop, uint256 totalPrice) = performBuyChecks(_params);
        require(shop.acceptedCurrency() == _token, "token not accepted");

        IERC20 token = IERC20(_token);

        // If payed in same currency as shop wants, just transfer the money.
        token.safeIncreaseAllowance(address(this), totalPrice);
        token.safeTransfer(_params.shop, totalPrice);

        // when all checks have passed and money was transferred create the
        // shop items.
        shop.buy(msg.sender, _params.amounts, _params.itemIds);
    }

    function performBuyChecks(BuyParams calldata params)
        internal
        view
        returns (W3Shop, uint256)
    {
        require(
            params.prices.length == params.amounts.length &&
                params.prices.length == params.itemIds.length,
            "invalid args"
        );

        W3Shop shop = W3Shop(params.shop);

        requireValidMerkleProof(shop, params);
        uint256 totalPrice = getTotalPrice(params.amounts, params.prices);

        return (shop, totalPrice);
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
            leafs[i] = sha256(
                abi.encode(params.itemIds[i], params.prices[i])
            );
        }

        require(
            MerkleMultiProof.verify(
                shop.itemsRoot(),
                leafs,
                params.proofs,
                params.proofFlags
            ),
            "invalid proof"
        );
    }
}
