//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "./IW3ShopPaymentProcessor.sol";

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title Implementation of the W3Shop protocoll, a decentralized, self-owned web shop.
 *
 * @notice It allows customer to buy ownership rights of digital items in the form of NFTs. The
 * way this contract is setup those NFTs can be used together with Bundlr or Arweave/IPFS
 * to host the payload and decrypt its content if a user ownes the NFT.
 */
contract W3Shop is ERC165, ERC2981, ERC1155Burnable {
    using Counters for Counters.Counter;
    /// @dev Constant that is used that ETH as currency and not a token should be used.
    address public constant CURRENCY_ETH = address(0);

    uint256 private constant MAX_ITEM_COUNT = type(uint256).max;

    /// @dev The token id that determines ownership over this shop.
    uint256 private constant OWNER_TOKEN_ID = 0;

    event AddedShopItems(uint256[] ids);
    event Buy(address indexed buyer, address indexed shop, uint256[] items);

    struct PreparedItem {
        uint32 maxItemCount;
        uint256 currentCount;
    }

    struct InitParams {
        address owner;
        string name;
        string ownerMetaUri;
        string shopConfig;
        string shopContractUri;
        IW3ShopPaymentProcessor paymentProcessor;
        address paymentReceiver;
    }

    /**
     * @dev The payment processor that the shop owner wishes to use. It processes
     * all the payments and calls into the shop after payment was received.
     */
    IW3ShopPaymentProcessor private paymentProcessor;

    /**
     * @dev Contains the  root hash of the merkle tree for the items that are sold.
     */
    bytes32 private itemsRoot;

    /**
     * @dev Arweave (starts with ar://<ID>) or IPFS (starts with ipfs://<ID>) URI that
     * points to the config of this shop.
     */
    string private shopConfig;

    /**
     * @dev This also determines the maximum number of items.  If set to 1 it means an item
     * can be sold unlimited times.
     * If its set to a number n > 1, it can only be sold n - 1 times. Also tracks the current
     * item count.
     */
    mapping(uint256 => PreparedItem) private preparedItems;

    /**
     * @dev Token ID to custom URI mapping (we need a own one for each token)
     */
    mapping(uint256 => string) private uris;

    /**
     * @dev Flag that indicates if the shop if open or closed. A closed shop won't process anymore
     * item buys, but existing, bought items can still be traded or decrypted.
     */
    bool private isOpen = true;

    /**
     * @dev The address that will receive the payments in ETH or tokens.
     */
    address private paymentReceiver;

    Counters.Counter private nextTokenId;

    /**
     * @dev ERC20/ERC1155 compatible token as accepted currency. Or the 0x0 address
     * if Ether is accepted.
     */
    address private acceptedCurrency = CURRENCY_ETH;

    /**
     * @dev Contract name, mainly for OpenSea / Marketplaces
     */
    string public name = "W3Shop Digital Items";

    /**
     * @dev Contract symbol, mainly for OpenSea / Marketplaces. It is the same accross
     * all shops.
     */
    string public symbol = "W3SITM";

    /**
     * @dev OpenSea / Marketplaces query this metadata that can be used to
     */
    string private contractUri;

    modifier onlyShopOwner() {
        require(balanceOf(msg.sender, OWNER_TOKEN_ID) > 0, "not owner");
        _;
    }

    modifier isShopOpen() {
        require(isOpen, "shop closed");
        _;
    }

    modifier onlyPaymentProcessor() {
        require(msg.sender == address(paymentProcessor), "only processor");
        _;
    }

    constructor() ERC1155("") {
        // nop
    }

    function contractURI() public view returns (string memory) {
        return contractUri;
    }

    function setContractURI(string calldata _contractUri)
        external
        onlyShopOwner
    {
        contractUri = _contractUri;
    }

    function setName(string calldata _name) external onlyShopOwner {
        name = _name;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, ERC2981, ERC165)
        returns (bool)
    {
        return
            ERC1155.supportsInterface(interfaceId) ||
            ERC2981.supportsInterface(interfaceId) ||
            ERC165.supportsInterface(interfaceId);
    }

    /**
     * @dev MUST be called after the shop was created to finalize the shops creation.
     * This is done so the shops address can be pre-calculated for setting up the
     * the metadata before the shops creation takes place.
     */
    function initialize(InitParams calldata _params) external {
        require(nextTokenId.current() == 0, "already initialized");
        nextTokenId.increment();

        name = _params.name;
        shopConfig = _params.shopConfig;
        paymentProcessor = _params.paymentProcessor;
        paymentReceiver = _params.paymentReceiver;
        contractUri = _params.shopContractUri;

        // Mint the owner NFT
        uris[OWNER_TOKEN_ID] = _params.ownerMetaUri;

        _mint(_params.owner, OWNER_TOKEN_ID, 1, "");
    }

    /**
     * @dev Shops can use this method to register new items for selling inside this contract.
     *
     * After the metadata was generated and uploaded this method can be used to prepare the items
     * for selling within this shop contract.
     */
    function prepareItems(
        string[] calldata _uris,
        uint32[] calldata _maxAmounts
    ) external onlyShopOwner {
        require(_uris.length <= 5 && _uris.length > 0, "invalid uri count");
        require(_uris.length == _maxAmounts.length, "unequal length");
        require(nextTokenId.current() > 0);

        // Keep track of created IDs, for the event
        uint256[] memory createdIds = new uint256[](_uris.length);

        for (uint256 i = 0; i < _uris.length; i++) {
            bytes memory tempUriStr = bytes(_uris[i]);
            require(tempUriStr.length > 0, "uri empty");

            bytes storage tempStorageStr = bytes(uris[nextTokenId.current()]);
            require(tempStorageStr.length == 0, "slot used");

            uint256 currentId = nextTokenId.current();
            createdIds[i] = currentId;
            uris[currentId] = _uris[i];

            // Must be one less than max so we can use 1 as our "flag".
            require(_maxAmounts[i] < type(uint32).max);

            uint32 maxItemCount;
            if (_maxAmounts[i] == 0) {
                maxItemCount = 1;
            } else {
                maxItemCount = _maxAmounts[i] + 1;
            }

            // Requrie unused slot here too
            require(preparedItems[currentId].maxItemCount == 0);

            preparedItems[currentId] = PreparedItem(maxItemCount, 0);
            nextTokenId.increment();
        }

        emit AddedShopItems(createdIds);
    }

    /**
     * @dev Sets the royalty information for a specific token id.
     *
     * Requirements:
     * - `receiver` cannot be the zero address.
     * - `feeNumerator` cannot be greater than the fee denominator.
     */
    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external onlyShopOwner {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    /**
     * @dev Returns the URI for every token.
     */
    function uri(uint256 id)
        public
        view
        virtual
        override
        returns (string memory)
    {
        return uris[id];
    }

    function setAcceptedCurrency(address _acceptedCurrency)
        external
        onlyShopOwner
    {
        acceptedCurrency = _acceptedCurrency;
    }

    function getAcceptedCurrency() external view returns (address) {
        return acceptedCurrency;
    }

    function setPaymentReceiver(address _receiver) external onlyShopOwner {
        paymentReceiver = _receiver;
    }

    function getPaymentReceiver() external view returns (address) {
        return paymentReceiver;
    }

    function setConfig(string memory _shopConfig) external onlyShopOwner {
        shopConfig = _shopConfig;
    }

    function getConfig() external view returns (string memory) {
        return shopConfig;
    }

    /**
     * @dev Sets both the shopConfig and the Merkle root of the sold items. Its useful because after a
     * change to the shop, usually both values needs to be updated. Saves one TX.
     */
    function setConfigRoot(string memory _shopConfig, bytes32 _itemsRoot)
        external
        onlyShopOwner
    {
        shopConfig = _shopConfig;
        itemsRoot = _itemsRoot;
    }

    function setPaymentProcessor(IW3ShopPaymentProcessor _paymentProcessor)
        external
        onlyShopOwner
    {
        require(address(_paymentProcessor) != address(0), "invalid proc");
        paymentProcessor = _paymentProcessor;
    }

    function getPaymentProcessor()
        external
        view
        returns (IW3ShopPaymentProcessor)
    {
        return paymentProcessor;
    }

    function setItemsRoot(bytes32 _itemsRoot) external onlyShopOwner {
        itemsRoot = _itemsRoot;
    }

    function getItemsRoot() external view returns (bytes32) {
        return itemsRoot;
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
            // Item must be already prepared
            bytes storage tempUriStr = bytes(uris[_itemIds[i]]);
            require(tempUriStr.length != 0, "item not prepared");

            // Check if every item is actually owned by this shop.
            // The owner item is not an existing shop item! So this also prevents
            // minting additional owner tokens
            requireItemAvailable(_itemIds[i], _amounts[i]);
            preparedItems[_itemIds[i]].currentCount += _amounts[i];
        }

        _mintBatch(_receiver, _itemIds, conversion(_amounts), "");

        emit Buy(_receiver, msg.sender, _itemIds);
    }

    function conversion(uint32[] calldata array8)
        private
        pure
        returns (uint256[] memory)
    {
        uint256[] memory array256 = new uint256[](array8.length);
        for (uint256 i = 0; i < array8.length; i++) {
            array256[i] = array8[i];
        }

        return array256;
    }

    function requireItemAvailable(uint256 _itemId, uint256 _amount)
        private
        view
    {
        uint256 maxItemAmount = getMaximumItemCount(_itemId);
        uint256 availableItems = maxItemAmount -
            preparedItems[_itemId].currentCount;

        require(availableItems > _amount, "sold out");
    }

    function closeShop() external onlyShopOwner {
        _burn(msg.sender, OWNER_TOKEN_ID, 1);
        isOpen = false;
        paymentReceiver = address(0);
    }

    function getCurrentItemCount(uint256 _itemId)
        external
        view
        returns (uint256)
    {
        return preparedItems[_itemId].currentCount;
    }

    function getMaximumItemCount(uint256 _itemId)
        public
        view
        returns (uint256)
    {
        uint32 maxItemCount = preparedItems[_itemId].maxItemCount;
        require(maxItemCount != 0);

        if (maxItemCount == 1) {
            return MAX_ITEM_COUNT;
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
        return balanceOf(_address, OWNER_TOKEN_ID) > 0;
    }
}
