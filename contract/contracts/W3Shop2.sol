//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./MerkleMultiProof.sol";
import "./W3ShopItems.sol";
import "hardhat/console.sol";

contract W3Shop2 {
    using SafeERC20 for IERC20;

    W3ShopItems private immutable shopItems;
    address private constant CURRENCY_ETH = address(0);

    address private paymentProcessor;

    /**
     * ERC20 compatible token as accepted currency. Or the 0 address if
     * Ether is accepted.
     */
    address public acceptedCurrency = CURRENCY_ETH;

    mapping(uint256 => bool) private existingShopItems;
    bytes32 public itemsRoot;
    string public shopConfig;

    bool private isOpened = true;
    uint256 private ownerNftId;

    modifier onlyShopOwner() {
        require(shopItems.balanceOf(msg.sender, ownerNftId) > 0, "not owner");
        _;
    }

    modifier isShopOpen() {
        require(isOpened, "shop closed");
        _;
    }

    modifier onlyPaymentProcessor() {
        require(msg.sender == paymentProcessor, "only payment processor");
        _;
    }

    constructor(W3ShopItems _shopItems, string memory _shopConfig) {
        shopConfig = _shopConfig;
        shopItems = _shopItems;
    }

    /**
     * _ownerNftId: The Arweave file ID of the shop owner NFT.
     */
    function mintOwnerNft(address _owner, string calldata _ownerNftId)
        external
    {
        require(ownerNftId == 0);

        string[] memory callNftId = new string[](1);
        callNftId[0] = _ownerNftId;

        uint256[] memory itemIds = shopItems.createItems(callNftId);
        ownerNftId = itemIds[0];

        require(itemIds.length == 1);

        uint256[] memory callAmounts = new uint256[](1);
        callAmounts[0] = 1;

        shopItems.mint(_owner, itemIds, callAmounts);
    }

    function prepareItems(string[] calldata _uris)
        external
        onlyShopOwner
        isShopOpen
        returns (uint256[] memory)
    {
        uint256[] memory itemIds = shopItems.createItems(_uris);
        for (uint256 i = 0; i < itemIds.length; i++) {
            existingShopItems[itemIds[i]] = true;
        }

        return itemIds;
    }

    function setShopConfig(string memory _shopConfig)
        public
        onlyShopOwner
        isShopOpen
    {
        shopConfig = _shopConfig;
    }

    function setItemsRoot(bytes32 _itemsRoot) public onlyShopOwner isShopOpen {
        itemsRoot = _itemsRoot;
    }

    /**
     * This function requires the bought items and collections with their prices.
     * It checks if the given prices are correct to the anchored Merkle root and
     * checks if the amount of ETH send equals the required payment.
     * If this works it will batch mint the owner NFTs.
     */
    function buy(uint256[] calldata amounts, uint256[] calldata itemIds)
        external
        isShopOpen
        onlyPaymentProcessor
    {
        require(amounts.length == itemIds.length);

        for (uint256 i = 0; i < amounts.length; i++) {
            // Check if every item is actually owned by this shop.
            require(existingShopItems[itemIds[i]], "invalid id");
            // Sanity check to never mint the special owner NFT.
            require(itemIds[i] != ownerNftId, "invalid mint");
            // Sanity check that the amount is bigger then 0
            require(amounts[i] > 0);
        }

        shopItems.mint(msg.sender, itemIds, amounts);
    }

    function cashout(address _receiver) public onlyShopOwner isShopOpen {
        if (acceptedCurrency == CURRENCY_ETH) {
            // ETH was used for now, so empty the current ETH.
            payable(_receiver).transfer(address(this).balance);
        } else {
            IERC20 token = IERC20(acceptedCurrency);
            uint256 shopBalance = token.balanceOf(address(this));
            token.safeTransfer(_receiver, shopBalance);
        }
    }

    function closeShop(address receiver) external onlyShopOwner isShopOpen {
        cashout(receiver);
        shopItems.burn(msg.sender, ownerNftId, 1);
        isOpened = false;
    }

    // Look deeper into this here https://blog.soliditylang.org/2020/03/26/fallback-receive-split/
    function setAcceptedCurrency(address _receiver, address _desiredERC20)
        public
        onlyShopOwner
        isShopOpen
    {
        cashout(_receiver);
        acceptedCurrency = _desiredERC20;
    }

    /**
     * Function used to receive ETH in case this is the desired currency.
     */
    receive() external payable {}
}
