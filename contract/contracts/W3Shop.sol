//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./MerkleMultiProof.sol";
import "./W3ShopItems.sol";
import "hardhat/console.sol";

contract W3Shop {
    using SafeERC20 for IERC20;
    address private constant CURRENCY_ETH = address(0);

    event NewShopItems(uint256[] ids);

    W3ShopItems private immutable shopItems;

    /**
     * The token ID that identifies the owner of this shop.
     */
    uint256 private ownerTokenId;

    address private paymentProcessor;

    /**
     * ERC20/ERC1155 compatible token as accepted currency.
     * Or the 0 address if Ether is accepted.
     */
    address private acceptedCurrency = CURRENCY_ETH;

    /**
     * Contains the  root hash of the merkle tree.
     */
    bytes32 private itemsRoot;

    /**
     * Arweave (starts with ar://<ID>) or IPFS (starts with ipfs://<ID>) URI that
     * points to the config of this shop.
     */
    string private shopConfig;

    /**
     * Buffer that is filled with reserved next item IDs so we can be sure these
     * IDs are reserved for this shop. Important to know IDs beforehand when
     * creating NFT metadata.
     */
    uint256[] private bufferedItemIds = new uint256[](5);

    /**
     * This also determines the maximum number of items.
     * If set to 1 it means an item can be sold unlimited.
     * If its set to a number n > 1, it can only be sold n - 1 times.
     */
    mapping(uint256 => uint256) private existingItems;

    /**
     * Contains the the current count of the item with this ID. Important
     * to limit item buys for certain items. It is only counted for limited
     * items. Unlimited item counts must be found otherwise e.g. by
     * indexing the chain data.
     */
    mapping(uint256 => uint256) private itemCount;

    bool private isOpened = true;

    modifier onlyShopOwner() {
        require(shopItems.balanceOf(msg.sender, ownerTokenId) > 0, "not owner");
        _;
    }

    modifier isShopOpen() {
        require(isOpened, "shop closed");
        _;
    }

    modifier onlyPaymentProcessor() {
        require(msg.sender == paymentProcessor, "only processor");
        _;
    }

/**
 * Es kann sinn machen die shop config nicht im ctor zu setzen, dann wäre die shop id vorab
 * bekannt und man könnte diese schon innerhalb der shopConfig setzen für Shops bei denen man zunächst
 * kein SC wallet benötigt.
 */
    constructor(
        address _paymentProcessor,
        W3ShopItems _shopItems,
        string memory _shopConfig
    ) {
        paymentProcessor = _paymentProcessor;
        shopConfig = _shopConfig;
        shopItems = _shopItems;

        // Prepare the initial set of item ids after we are
        // a registered shop in the factory.
        prepareItems(5);
    }

    function setOwnerTokenId(uint256 _ownerToken) public {
        require(ownerTokenId == 0);
        ownerTokenId = _ownerToken;
    }

    function prepareItems(uint8 _itemCount) private {
        assert(_itemCount > 0 && _itemCount <= 5);

        uint256[] memory itemIds = shopItems.prepareItems(_itemCount);
        for (uint256 i = 0; i < _itemCount; i++) {
            bufferedItemIds[i] = itemIds[i];
        }
    }

    function setItemUris(
        string[] calldata _uris,
        uint256[] calldata _maxAmounts
    ) external isShopOpen onlyShopOwner {
        require(_uris.length <= 5 && _uris.length > 0, "invalid uri count");
        require(_uris.length == _maxAmounts.length, "invalid maxAmount");

        uint256[] memory ids = new uint256[](_uris.length);
        for (uint256 i = 0; i < _uris.length; i++) {
            uint256 itemId = bufferedItemIds[i];
            require(itemId != ownerTokenId, "no owner id");
            ids[i] = itemId;

            if (_maxAmounts[i] > 0) {
                existingItems[itemId] = _maxAmounts[i] + 1;
            } else {
                existingItems[itemId] = 1;
            }
        }

        shopItems.setItemUris(ids, _uris);
        prepareItems(uint8(_uris.length));

        emit NewShopItems(ids);
    }

    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external onlyShopOwner {
        shopItems.setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function setConfig(string memory _shopConfig)
        public
        isShopOpen
        onlyShopOwner
    {
        shopConfig = _shopConfig;
    }

    function getConfig() public view returns (string memory) {
        return shopConfig;
    }

    function setConfigRoot(string memory _shopConfig, bytes32 _itemsRoot)
        public
        isShopOpen
        onlyShopOwner
    {
        shopConfig = _shopConfig;
        itemsRoot = _itemsRoot;
    }

    function setPaymentProcessor(address _paymentProcessor)
        public
        isShopOpen
        onlyShopOwner
    {
        paymentProcessor = _paymentProcessor;
    }

    function getPaymentProcessor() public view returns (address) {
        return paymentProcessor;
    }

    function getOwnerTokenId() public view returns (uint256) {
        return ownerTokenId;
    }

    function setItemsRoot(bytes32 _itemsRoot) public isShopOpen onlyShopOwner {
        itemsRoot = _itemsRoot;
    }

    function getItemsRoot() public view returns (bytes32) {
        return itemsRoot;
    }

    function getBufferedItemIds() public view returns (uint256[] memory) {
        return bufferedItemIds;
    }

    /**
     * This function requires the bought items and collections with their prices.
     * It checks if the given prices are correct to the anchored Merkle root and
     * checks if the amount of ETH send equals the required payment.
     * If this works it will batch mint the owner NFTs.
     */
    function buy(
        address _receiver,
        uint256[] calldata _amounts,
        uint256[] calldata _itemIds
    ) external isShopOpen onlyPaymentProcessor {
        require(_amounts.length == _itemIds.length);

        for (uint256 i = 0; i < _itemIds.length; i++) {
            // Check if every item is actually owned by this shop.
            // The owner item is not an existing shop item! So this also prevents
            // minting additional owner tokens
            requireItemAvailable(_itemIds[i], _amounts[i]);
            itemCount[_itemIds[i]] += _amounts[i];
        }

        shopItems.mint(_receiver, _itemIds, _amounts);
    }

    function requireItemAvailable(uint256 _itemId, uint256 _amount)
        private
        view
    {
        uint256 maxItemAmount = getMaximumItemCount(_itemId);
        require(
            maxItemAmount >= _amount &&
                maxItemAmount - _amount >= itemCount[_itemId],
            "sold out"
        );
    }

    function cashout(address _receiver) public isShopOpen onlyShopOwner {
        if (acceptedCurrency == CURRENCY_ETH) {
            // ETH was used for now, so empty the current ETH.
            payable(_receiver).transfer(address(this).balance);
        } else {
            // FIXME handle ERC1155 tokens safely too
            IERC20 token = IERC20(acceptedCurrency);
            uint256 shopBalance = token.balanceOf(address(this));
            token.safeTransfer(_receiver, shopBalance);
        }
    }

    function closeShop(address _receiver) external isShopOpen onlyShopOwner {
        cashout(_receiver);
        shopItems.burnShopOwner(msg.sender, ownerTokenId, 1);
        isOpened = false;
    }

    function getItemCount(uint256 _itemId) public view returns (uint256) {
        return itemCount[_itemId];
    }

    function getMaximumItemCount(uint256 _itemId)
        public
        view
        returns (uint256)
    {
        uint256 maxItemCount = existingItems[_itemId];

        if (maxItemCount == 0) {
            // this item does actually not exist in this shop.
            revert("item non-exist");
        } else if (maxItemCount == 1) {
            return shopItems.MAX_ITEM_COUNT();
        } else {
            return maxItemCount - 1;
        }
    }

    function setAcceptedCurrency(address _receiver, address _acceptedCurrency)
        public
        isShopOpen
        onlyShopOwner
    {
        cashout(_receiver);
        acceptedCurrency = _acceptedCurrency;
    }

    function getAcceptedCurrency() public view returns (address) {
        return acceptedCurrency;
    }

    function isShopOwner(address _address) public view returns (bool) {
        return shopItems.balanceOf(_address, ownerTokenId) > 0;
    }

    /**
     * Function used to receive ETH in case this is the desired currency.
     */
    receive() external payable {}
}
