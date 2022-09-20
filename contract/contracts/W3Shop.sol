//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./MerkleMultiProof.sol";
import "./W3ShopItems.sol";
import "hardhat/console.sol";

contract W3Shop {
    using SafeERC20 for IERC20;

    event NewShopItems(uint256[] ids);

    W3ShopItems private immutable shopItems;
    address private constant CURRENCY_ETH = address(0);

    address public paymentProcessor;

    /**
     * ERC20 compatible token as accepted currency. Or the 0 address if
     * Ether is accepted.
     */
    address public acceptedCurrency = CURRENCY_ETH;

    bytes32 public itemsRoot;
    string public shopConfig;
    uint256[] public bufferedItemIds = new uint256[](5);

    mapping(uint256 => bool) private existingShopItems;

    bool private isOpened = true;
    uint256 public ownerTokenId;

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

    constructor(
        address _paymentProcessor,
        W3ShopItems _shopItems,
        string memory _shopConfig
    ) {
        paymentProcessor = _paymentProcessor;
        shopConfig = _shopConfig;
        shopItems = _shopItems;
    }

    /**
     * Inside here we are now a registered shop and can interact with the
     * ShopItems contract.
     *
     * _ownerNftId: The Arweave file ID of the shop owner NFT.
     */
    function mintOwnerNft(address _owner, string calldata _ownerNftId)
        external
    {
        require(ownerTokenId == 0);

        // Prepare the initial item ids after we are a registered shop
        prepareItems(5);

        string[] memory callNftId = new string[](1);
        callNftId[0] = _ownerNftId;

        uint256[] memory itemIds = new uint256[](1);
        ownerTokenId = bufferedItemIds[0];
        itemIds[0] = ownerTokenId;

        uint256[] memory callAmounts = new uint256[](1);
        callAmounts[0] = 1;

        shopItems.setItemUris(itemIds, callNftId);
        shopItems.mint(_owner, itemIds, callAmounts);
        prepareItems(1);
    }

    function prepareItems(uint8 _itemCount) internal {
        assert(_itemCount > 0 && _itemCount <= 5);

        uint256[] memory itemIds = shopItems.prepareItems(_itemCount);
        for (uint256 i = 0; i < _itemCount; i++) {
            bufferedItemIds[i] = itemIds[i];
        }
    }

    function setItemUris(string[] calldata _uris)
        external
        isShopOpen
        onlyShopOwner
    {
        require(_uris.length <= 5 && _uris.length > 0, "invalid uri count");

        uint256[] memory ids = new uint256[](_uris.length);
        for (uint256 i = 0; i < _uris.length; i++) {
            uint256 itemId = bufferedItemIds[i];
            require(itemId != ownerTokenId, "no owner id");
            ids[i] = itemId;
            existingShopItems[itemId] = true;
        }

        shopItems.setItemUris(ids, _uris);
        prepareItems(uint8(_uris.length));

        emit NewShopItems(ids);
    }

    function setConfig(string memory _shopConfig)
        public
        isShopOpen
        onlyShopOwner
    {
        shopConfig = _shopConfig;
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

    function setItemsRoot(bytes32 _itemsRoot) public isShopOpen onlyShopOwner {
        itemsRoot = _itemsRoot;
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
            require(existingShopItems[_itemIds[i]], "item non-exist");
        }

        shopItems.mint(_receiver, _itemIds, _amounts);
    }

    function cashout(address _receiver) public isShopOpen onlyShopOwner {
        if (acceptedCurrency == CURRENCY_ETH) {
            // ETH was used for now, so empty the current ETH.
            payable(_receiver).transfer(address(this).balance);
        } else {
            IERC20 token = IERC20(acceptedCurrency);
            uint256 shopBalance = token.balanceOf(address(this));
            token.safeTransfer(_receiver, shopBalance);
        }
    }

    function closeShop(address _receiver) external isShopOpen onlyShopOwner {
        cashout(_receiver);
        shopItems.burn(msg.sender, ownerTokenId, 1);
        isOpened = false;
    }

    function setAcceptedCurrency(address _receiver, address _desiredERC20)
        public
        isShopOpen
        onlyShopOwner
    {
        cashout(_receiver);
        acceptedCurrency = _desiredERC20;
    }

    /**
     * Function used to receive ETH in case this is the desired currency.
     * Look deeper into this here https://blog.soliditylang.org/2020/03/26/fallback-receive-split/
     */
    receive() external payable {}
}
