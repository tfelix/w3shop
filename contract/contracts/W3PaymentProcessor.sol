//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./MerkleMultiProof.sol";
import "./W3Shop.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

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

    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant BASE_ETHER = address(0);
    // UniswapV3 router
    ISwapRouter public immutable swapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

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

    // FIXME Finalize this function with the required uniswap router data.
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
    ) external returns (uint256 amountIn) {
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
                tokenOut: _shop.acceptedCurrency(),
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

        requireValidMerkleProof2(shop, params);

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

    function requireValidMerkleProof2(W3Shop shop, BuyParams calldata params)
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
                shop.itemsRoot(),
                leafs,
                params.proofs,
                params.proofFlags
            ),
            "invalid proof"
        );
    }
}
