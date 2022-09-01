//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./MerkleMultiProof.sol";
import "./W3ShopItems.sol";
import "hardhat/console.sol";

contract W3Shop {
    using SafeERC20 for IERC20;

    event ReservedItems(uint256[] ids);
    event NewShopItems(uint256[] ids);

    W3ShopItems private immutable shopItems;
    address private constant CURRENCY_ETH = address(0);

    address public paymentProcessor;

    /**
     * ERC20 compatible token as accepted currency. Or the 0 address if
     * Ether is accepted.
     */
    address public acceptedCurrency = CURRENCY_ETH;

    mapping(uint256 => bool) private existingShopItems;
    mapping(uint256 => bool) private reservedShopItems;

    bytes32 public itemsRoot;
    string public shopConfig;

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
     * _ownerNftId: The Arweave file ID of the shop owner NFT.
     */
    function mintOwnerNft(address _owner, string calldata _ownerNftId)
        external
    {
        require(ownerTokenId == 0);

        string[] memory callNftId = new string[](1);
        callNftId[0] = _ownerNftId;

        uint256[] memory itemIds = shopItems.prepareItems(1);
        ownerTokenId = itemIds[0];

        shopItems.setItemUris(itemIds, callNftId);

        uint256[] memory callAmounts = new uint256[](1);
        callAmounts[0] = 1;

        shopItems.mint(_owner, itemIds, callAmounts);
    }

    function prepareItems(uint8 _itemCount)
        external
        isShopOpen
        onlyShopOwner
        returns (uint256[] memory)
    {
        uint256[] memory itemIds = shopItems.prepareItems(_itemCount);
        for (uint256 i = 0; i < itemIds.length; i++) {
            reservedShopItems[itemIds[i]] = true;
        }

        emit ReservedItems(itemIds);

        return itemIds;
    }

    function setItemUris(uint256[] calldata _ids, string[] calldata _uris)
        external
        isShopOpen
        onlyShopOwner
    {
        for (uint256 i = 0; i < _ids.length; i++) {
            uint256 itemId = _ids[i];
            require(itemId != ownerTokenId, "no owner id");
            require(existingShopItems[itemId] == false, "item already exists");
            require(reservedShopItems[itemId] == true, "item not reserved");

            delete reservedShopItems[itemId];

            existingShopItems[itemId] = true;
        }

        shopItems.setItemUris(_ids, _uris);

        emit NewShopItems(_ids);
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
            require(existingShopItems[_itemIds[i]], "item does not exist");
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
