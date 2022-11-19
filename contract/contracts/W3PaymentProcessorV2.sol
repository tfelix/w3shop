//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./MerkleMultiProof.sol";
import "./W3Shop.sol";
import "./IW3ShopPaymentProcessor.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

/**
 * This contract should be able to accept "any" ERC20, token, convert it to the target currency
 * of the shop owner and then trigger the purchase of the items.
 *
 * This is the improved version that also enables on the fly token swaps via Uniswap.
 */
contract W3PaymentProcessor2 {
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

    // UniswapV3 router
    ISwapRouter public immutable swapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    constructor() {}

    // FIXME Finalize this function with the required uniswap router data.
    /*
    function buyWithToken(address _token, BuyParams calldata _params) external {
        (W3Shop shop, uint256 totalPrice) = performBuyChecks(_params);
        address acceptedCurrency = shop.acceptedCurrency();
        require(acceptedCurrency != BASE_ETHER, "token not accepted");
        require(acceptedCurrency != _token, "invalid token");

        IERC20 token = IERC20(_token);

        // If payed in something else, try to swap via uniswap.

        // when all checks have passed and money was transferred create the
        // shop items.
        shop.buy(msg.sender, _params.amounts, _params.itemIds);
    }

        function buyWithToken(address _token, BuyParams calldata _params) external {
        W3Shop shop = W3Shop(_params.shop);
        address receiver = shop.getPaymentReceiver();

        require(receiver != address(0), "no receiver");
        require(shop.getAcceptedCurrency() == _token, "token not accepted");

        performBuyChecks(shop, _params);

        uint256 totalPrice = getTotalPrice(_params.amounts, _params.prices);

        console.log("Total: %s", totalPrice);

        IERC20 token = IERC20(_token);

        // Increase allowance of the token to the amount that needs to be payed.
        token.safeIncreaseAllowance(address(this), totalPrice);

        // In case the amount is not enough this will revert.
        console.log(
            "Allowance: %s",
            token.allowance(msg.sender, address(this))
        );
        token.safeTransferFrom(msg.sender, receiver, totalPrice);

        // when all checks have passed and money was transferred create the
        // shop items.
        shop.buy(msg.sender, _params.amounts, _params.itemIds);
    }
    */

    /// @notice swapExactOutputSingle swaps a minimum possible amount of DAI for a fixed amount of WETH.
    /// @dev The calling address must approve this contract to spend its DAI for this function to succeed. As the amount of input DAI is variable,
    /// the calling address will need to approve for a slightly higher amount, anticipating some variance.
    /// @param amountOut The exact amount of WETH9 to receive from the swap.
    /// @param amountInMaximum The amount of the token we are willing to spend to receive the specified amount of WETH9.
    /// @return amountIn The amount of the token actually spent in the swap.
    function swapExactOutputSingle(
        IERC20 token,
        W3Shop _shop,
        uint256 amountOut,
        uint256 amountInMaximum
    ) internal returns (uint256 amountIn) {
        // Transfer the specified amount of the token to this contract.
        token.safeTransferFrom(msg.sender, address(this), amountInMaximum);

        // Approve the router to spend the specified `amountInMaximum` of the token.
        // In production, you should choose the maximum amount to spend based on oracles or other data sources to achieve a better swap.
        token.safeApprove(address(swapRouter), amountInMaximum);

        // For this example, we will set the pool fee to 0.3%.
        uint24 poolFee = 3000;

        ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter
            .ExactOutputSingleParams({
                tokenIn: address(token),
                tokenOut: _shop.getAcceptedCurrency(),
                fee: poolFee,
                recipient: address(_shop),
                deadline: block.timestamp,
                amountOut: amountOut,
                amountInMaximum: amountInMaximum,
                sqrtPriceLimitX96: 0
            });

        // Executes the swap returning the amountIn needed to spend to receive the desired amountOut.
        amountIn = swapRouter.exactOutputSingle(params);

        // For exact output swaps, the amountInMaximum may not have all been spent.
        // If the actual amount spent (amountIn) is less than the specified maximum amount, we must refund the msg.sender and approve the swapRouter to spend 0.
        if (amountIn < amountInMaximum) {
            token.safeApprove(address(swapRouter), 0);
            token.safeTransfer(msg.sender, amountInMaximum - amountIn);
        }
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
            leafs[i] = keccak256(
                abi.encodePacked(params.itemIds[i], params.prices[i])
            );
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
