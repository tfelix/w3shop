//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "./IW3ShopVault.sol";
import "./W3Shop.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract W3ShopVaultV1 is IW3ShopVault {
    using SafeERC20 for IERC20;
    address public constant CURRENCY_ETH = address(0);

    W3Shop private immutable shop;

    /**
     * ERC20/ERC1155 compatible token as accepted currency.
     * Or the 0 address if Ether is accepted.
     */
    address private acceptedCurrency = CURRENCY_ETH;

    modifier onlyShopOwner() {
        require(shop.isShopOwner(msg.sender), "not owner");
        _;
    }

    constructor(W3Shop _shop) {
        shop = _shop;
    }

    function cashout(address _receiver) public onlyShopOwner {
        if (acceptedCurrency == CURRENCY_ETH) {
            payable(_receiver).transfer(address(this).balance);
        } else {
            IERC20 token = IERC20(acceptedCurrency);
            uint256 shopBalance = token.balanceOf(address(this));
            token.safeTransfer(_receiver, shopBalance);
        }
    }

    function setAcceptedCurrency(address _receiver, address _acceptedCurrency)
        external
        onlyShopOwner
    {
        cashout(_receiver);
        acceptedCurrency = _acceptedCurrency;
    }

    function getAcceptedCurrency() external view returns (address) {
        return acceptedCurrency;
    }

    receive() external payable {}
}
