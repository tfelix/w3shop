//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;
// pragma solidity =0.7.6;
pragma abicoder v2;

import "hardhat/console.sol";
import "./MerkleMultiProof.sol";
import "./W3Shop.sol";

// import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
// import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

/**
 * This contract should be able to accept "any" ERC20, token, convert it to the target currency
 * of the shop owner and then trigger the purchase of the items.
 */
contract PaymentProcessor {
    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant BASE_ETHER = address(0);

    constructor() {}

    function buy(
        address payable shopAddr,
        uint256[] calldata amounts,
        uint256[] calldata prices,
        uint256[] calldata itemIds,
        bytes32[] calldata proofs,
        bool[] calldata proofFlags
    ) external payable {
        require(
            prices.length == amounts.length && prices.length == itemIds.length
        );

        W3Shop shop = W3Shop(shopAddr);
        // Perform the merkle proof
        requireValidMerkleProof(
            W3Shop(shop),
            amounts,
            prices,
            itemIds,
            proofs,
            proofFlags
        );

        // calculate the total price
        uint256 totalPrice = getTotalPrice(amounts, prices);

        checkReceivedMoney(shop, totalPrice);
        // User must have payed at least the amount that was calculated
        require(msg.value >= totalPrice, "price");
    }

    function checkReceivedMoney(W3Shop _shop, uint256 _totalPrice) internal {
        if (_shop.acceptedCurrency() == BASE_ETHER) {
            require(msg.value >= _totalPrice, "payment amount");
            // TODO maybe send back too much eth?
            payable(_shop).transfer(msg.value);
        } else {
            // Perform ERC20 routine and convert into desired currencry
            revert("supports only ETH");
        }
    }

    function getTotalPrice(
        uint256[] calldata amounts,
        uint256[] calldata prices
    ) internal pure returns (uint256) {
        uint256 totalPrice = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            // Calculate the total price
            totalPrice += prices[i] * amounts[i];
        }

        return totalPrice;
    }

    function requireValidMerkleProof(
        W3Shop shop,
        uint256[] calldata amounts,
        uint256[] calldata prices,
        uint256[] calldata itemIds,
        bytes32[] calldata proofs,
        bool[] calldata proofFlags
    ) internal view {
        bytes32[] memory leafs = new bytes32[](amounts.length);
        for (uint256 i = 0; i < amounts.length; i++) {
            // Calculate the leafs
            leafs[i] = keccak256(abi.encodePacked(itemIds[i], prices[i]));
        }

        require(
            MerkleMultiProof.verify(
                shop.itemsRoot(),
                leafs,
                proofs,
                proofFlags
            ),
            "invalid proof"
        );
    }
}
