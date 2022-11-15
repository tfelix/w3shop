//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

/**
 * Handles the earnings of a shop.
 * Must be able to handle the tokens/ETH that was put into it.
 */
interface IW3ShopVault {
    function cashout(address _paymentReceiver) external;
    function getAcceptedCurrency() external view returns (address);
}
