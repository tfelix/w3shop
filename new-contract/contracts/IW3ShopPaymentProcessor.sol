//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface IW3ShopPaymentProcessor {
    struct BuyParams {
        address payable shop;
        uint32[] amounts;
        uint256[] prices;
        uint256[] itemIds;
        bytes32[] proofs;
        bool[] proofFlags;
    }

    /**
     * @dev Handles the buy process if ETH is used as a currency inside the shop.
     */
    function buyWithEther(BuyParams calldata _params) external payable;

    /**
     * @dev Handles the buy process if an arbitrary token is used for the shop.
     */
    function buyWithToken(address _token, BuyParams calldata _params) external;
}
