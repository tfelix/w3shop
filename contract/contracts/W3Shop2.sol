//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "./MerkleMultiProof.sol";
import "./W3ShopItems.sol";
import "hardhat/console.sol";

contract W3Shop2 {
    W3ShopItems private shopItems;
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

    constructor(
        address _shopItems,
        string memory _shopConfig
    ) ERC1155("") {
        shopConfig = _shopConfig;
        shopItems = W3ShopItems(_shopItems);
    }

    /**
     * _ownerNftId: The Arweave file ID of the shop owner NFT.
     */
    function mintOwnerNft(string memory _ownerNftId) external {
        require(ownerNftId == 0);

        uint256[] itemIds = shopItems.createItems([_ownerNftId]);
        ownerNftId = itemIds[0];
    }

    function prepareItems(string[] calldata _uris)
        external
        onlyShopOwner
        isShopOpen
        returns (uint256[] memory)
    {
        uint256[] memory itemIds = shopItems.createItems(_uris);
        for (uint256 i = 0; i < amounts.length; i++) {
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
    function buy(
        uint256[] calldata amounts,
        uint256[] calldata prices,
        uint256[] calldata itemIds,
        bytes32[] calldata proofs,
        bool[] calldata proofFlags
    ) external payable isShopOpen {
        require(
            prices.length == amounts.length && prices.length == itemIds.length
        );

        uint256 totalPrice = 0;
        bytes32[] memory leafs = new bytes32[](amounts.length);
        for (uint256 i = 0; i < amounts.length; i++) {
            // Check if every item is actually owned by this shop.
            require(existingShopItems[itemIds[i]], "invalid item");

            // Calculate the leafs
            leafs[i] = keccak256(abi.encodePacked(itemIds[i], prices[i]));

            // Calculate the total price
            totalPrice += prices[i] * amounts[i];

            // Sanity check to never mint the special owner NFT.
            require(itemIds[i] != 0);

            // Sanity check that the amount is bigger then 0
            require(amounts[i] > 0);
        }

        require(
            MerkleMultiProof.verify(itemsRoot, leafs, proofs, proofFlags),
            "invalid proof"
        );

        // User must have payed at least the amount that was calculated
        require(msg.value >= totalPrice, "price");

        _mintBatch(msg.sender, itemIds, amounts, "");
    }

    function cashout(address receiver) public onlyShopOwner isShopOpen {
        payable(receiver).transfer(address(this).balance);
    }

    function closeShop(address receiver) public onlyShopOwner isShopOpen {
        cashout(receiver);
        _burn(msg.sender, 0, 1);
        isOpened = false;
    }
}
