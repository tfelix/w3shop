//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "./W3ShopItems.sol";
import "./IW3ShopPaymentProcessor.sol";
import "hardhat/console.sol";

contract W3Shop {
    address public constant CURRENCY_ETH = address(0);

    event NewShopItems(uint256[] ids);

    struct LimitedItem {
        uint32 maxAmount;
        uint256 count;
    }

    W3ShopItems private immutable shopItems;

    /**
     * The token ID that identifies the owner of this shop.
     */
    uint256 private ownerTokenId;

    /**
     * The payment processor that the shop owner wishes to use. It processes
     * all the payments and calls into the shop after payment was received.
     */
    IW3ShopPaymentProcessor private paymentProcessor;

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
     * Also keeps track of the current
     */
    mapping(uint256 => LimitedItem) private existingItems;

    bool private isOpened = true;

    /**
     * The address that will receive the payments.
     */
    address private paymentReceiver;

    /**
     * ERC20/ERC1155 compatible token as accepted currency.
     * Or the 0 address if Ether is accepted.
     */
    address private acceptedCurrency = CURRENCY_ETH;

    modifier onlyShopOwner() {
        require(shopItems.balanceOf(msg.sender, ownerTokenId) > 0, "not owner");
        _;
    }

    modifier isShopOpen() {
        require(isOpened, "shop closed");
        _;
    }

    modifier onlyPaymentProcessor() {
        require(msg.sender == address(paymentProcessor), "only processor");
        _;
    }

    constructor(
        IW3ShopPaymentProcessor _paymentProcessor,
        W3ShopItems _shopItems
    ) {
        paymentProcessor = _paymentProcessor;
        shopItems = _shopItems;
    }

    /**
     * MUST be called after the shop was created to finalize the shops creation.
     * This is done so the shops address can be pre-calculated for setting up the
     * the metadata before the shops creation takes place.
     */
    function initialize(
        string memory _shopConfig,
        uint256 _ownerTokenId,
        address _paymentReceiver
    ) external {
        require(ownerTokenId == 0, "already called");

        ownerTokenId = _ownerTokenId;
        shopConfig = _shopConfig;
        paymentReceiver = _paymentReceiver;

        // Prepare the initial set of item ids after we are
        // a registered shop in the factory.
        prepareItems(5);
    }

    function prepareItems(uint8 _itemCount) private {
        assert(_itemCount > 0 && _itemCount <= 5);

        uint256[] memory itemIds = shopItems.prepareItems(_itemCount);
        for (uint256 i = 0; i < _itemCount; i++) {
            bufferedItemIds[i] = itemIds[i];
        }
    }

    function setItemUris(string[] calldata _uris, uint32[] calldata _maxAmounts)
        external
        isShopOpen
        onlyShopOwner
    {
        require(_uris.length <= 5 && _uris.length > 0, "invalid uri count");
        require(_uris.length == _maxAmounts.length, "invalid uri count");

        uint256[] memory ids = new uint256[](_uris.length);
        for (uint256 i = 0; i < _uris.length; i++) {
            uint256 itemId = bufferedItemIds[i];
            require(itemId != ownerTokenId, "forbidden owner id");
            ids[i] = itemId;

            if (_maxAmounts[i] > 0) {
                existingItems[itemId] = LimitedItem(_maxAmounts[i] + 1, 0);
            } else {
                existingItems[itemId] = LimitedItem(1, 0);
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

    function setAcceptedCurrency(address _acceptedCurrency)
        external
        isShopOpen
        onlyShopOwner
    {
        acceptedCurrency = _acceptedCurrency;
    }

    function getAcceptedCurrency() external view returns (address) {
        return acceptedCurrency;
    }

    function setConfig(string memory _shopConfig)
        external
        isShopOpen
        onlyShopOwner
    {
        shopConfig = _shopConfig;
    }

    function setPaymentReceiver(address _receiver)
        external
        isShopOpen
        onlyShopOwner
    {
        paymentReceiver = _receiver;
    }

    function getPaymentReceiver() external view returns (address) {
        return paymentReceiver;
    }

    function getConfig() external view returns (string memory) {
        return shopConfig;
    }

    function setConfigRoot(string memory _shopConfig, bytes32 _itemsRoot)
        external
        isShopOpen
        onlyShopOwner
    {
        shopConfig = _shopConfig;
        itemsRoot = _itemsRoot;
    }

    function setPaymentProcessor(IW3ShopPaymentProcessor _paymentProcessor)
        external
        isShopOpen
        onlyShopOwner
    {
        paymentProcessor = _paymentProcessor;
    }

    function getPaymentProcessor()
        external
        view
        returns (IW3ShopPaymentProcessor)
    {
        return paymentProcessor;
    }

    function getShopItems() external view returns (W3ShopItems) {
        return shopItems;
    }

    function getOwnerTokenId() external view returns (uint256) {
        return ownerTokenId;
    }

    function setItemsRoot(bytes32 _itemsRoot)
        external
        isShopOpen
        onlyShopOwner
    {
        itemsRoot = _itemsRoot;
    }

    function getItemsRoot() external view returns (bytes32) {
        return itemsRoot;
    }

    function getBufferedItemIds() external view returns (uint256[] memory) {
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
        uint32[] calldata _amounts,
        uint256[] calldata _itemIds
    ) external isShopOpen onlyPaymentProcessor {
        require(_amounts.length == _itemIds.length);

        for (uint256 i = 0; i < _itemIds.length; i++) {
            // Check if every item is actually owned by this shop.
            // The owner item is not an existing shop item! So this also prevents
            // minting additional owner tokens
            requireItemAvailable(_itemIds[i], _amounts[i]);
            existingItems[_itemIds[i]].count += _amounts[i];
        }

        shopItems.mint(_receiver, _itemIds, _amounts);
    }

    function requireItemAvailable(uint256 _itemId, uint256 _amount)
        private
        view
    {
        uint256 maxItemAmount = getMaximumItemCount(_itemId);
        uint256 availableItems = maxItemAmount - existingItems[_itemId].count;

        require(availableItems >= _amount, "sold out");
    }

    function closeShop() external isShopOpen onlyShopOwner {
        shopItems.burnShopOwner(msg.sender, ownerTokenId, 1);
        isOpened = false;
        paymentReceiver = address(0);
    }

    function getItemCount(uint256 _itemId) external view returns (uint256) {
        return existingItems[_itemId].count;
    }

    function getMaximumItemCount(uint256 _itemId)
        public
        view
        returns (uint256)
    {
        uint32 maxItemCount = existingItems[_itemId].maxAmount;

        // if the maxItemCount is 0, the item does not exist yet in the shop. If item
        // is unlimited the maxItemCount is 1.
        if (maxItemCount == 0) {
            revert("item doesnt exist");
        } else if (maxItemCount == 1) {
            return shopItems.MAX_ITEM_COUNT();
        } else {
            return maxItemCount - 1;
        }
    }

    function isShopOwner(address _address)
        external
        view
        isShopOpen
        returns (bool)
    {
        return shopItems.balanceOf(_address, ownerTokenId) > 0;
    }
}
