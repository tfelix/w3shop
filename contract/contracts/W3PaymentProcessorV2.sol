//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "hardhat/console.sol";
import "./W3Shop.sol";
import "./IW3ShopPaymentProcessor.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * This contract allows the receiving of the following kind of tokens:
 * - ERC20
 * - ERC777
 *
 * This is the improved version that also enables on the fly token swaps via Uniswap.
 */
contract W3PaymentProcessorV2 is
    IW3ShopPaymentProcessor,
    ReentrancyGuard,
    IERC777Recipient
{
    using SafeERC20 for IERC20;
    address public constant CURRENCY_ETH = address(0);

    constructor() {}

    /**
     * @dev Called by an {IERC777} token contract whenever tokens are being
     * moved or created into a registered account (`to`). The type of operation
     * is conveyed by `from` being the zero address or not.
     *
     * This call occurs _after_ the token contract's state is updated, so
     * {IERC777-balanceOf}, etc., can be used to query the post-operation state.
     *
     * This function may revert to prevent the operation from being executed.
     */
    function tokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external {
        BuyParams memory params = abi.decode(userData, (BuyParams));

        (uint256 totalPrice, address receiver, W3Shop shop) = prepareBuy(
            CURRENCY_ETH,
            params
        );

        require(amount == totalPrice, "invalid amount");

        // when all checks have passed and money was transferred create the
        // shop items.
        shop.buy(msg.sender, params.amounts, params.itemIds);
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

    function prepareBuy(address expectedCurrency, BuyParams memory params)
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

    function getTotalPrice(uint32[] memory amounts, uint256[] memory prices)
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

    function requireValidMerkleProof(W3Shop shop, BuyParams memory params)
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
