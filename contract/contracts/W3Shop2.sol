//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "./W3ShopRegistry.sol";
import "./MerkleMultiProof.sol";
import "hardhat/console.sol";

contract W3Shop {
    modifier onlyShopOwner() {
        uint256 tokenId = tokenIdToRegistryId[0];
        require(
            registry.balanceOf(msg.sender, tokenIdToRegistryId[0]) >= 1,
            "not owner"
        );
        _;
    }

    modifier isShopOpen() {
        require(isOpen, "shop closed");
        _;
    }

    bool private isOpen = true;
    bytes32 public itemsRoot;
    string public shopConfig;

    W3ShopRegistry private registry;

    // Map to correlate the local shop tokens to the registry token.
    mapping(uint256 => uint256) tokenIdToRegistryId;

    /**
     * _ownerNftId: The Arweave file ID of the shop owner NFT.
     */
    constructor(
        address _registry,
        address _owner,
        string memory _shopConfig,
        string memory _ownerNftId
    ) {
        // Mint the owner NFT of the shop to the deployer.
        _mint(_owner, 0, 1, "");
        shopConfig = _shopConfig;
        registry = W3ShopRegistry(registry);
    }

    function _mint(
        address receiver,
        uint256 tokenId,
        uint256 amount,
        string memory uri
    ) private {
        uint256 newToken = registry.createItem(receiver, uri, 0, 1, 0);
        tokenIdToRegistryId[tokenId] = newToken;
    }

    function setShopData(string memory _shopConfig, bytes32 _itemsRoot)
        public
        onlyShopOwner
        isShopOpen
    {
        shopConfig = _shopConfig;
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
            // Calculate the leafs
            leafs[i] = keccak256(abi.encodePacked(prices[i], itemIds[i]));

            // Calculate the total price
            totalPrice += prices[i] * amounts[i];

            // Sanity check to never mint the special owner NFT.
            require(itemIds[i] != 0);

            // Sanity check that the amount is bigger then 0
            require(amounts[i] > 0);

            // Check if the URI is properly setup.
            bytes memory tempUriStr = bytes(uris[itemIds[i]]);
            require(tempUriStr.length > 0);
        }

        require(MerkleMultiProof.verify(itemsRoot, leafs, proofs, proofFlags));

        // User must have payed at least the amount that was calculated
        require(msg.value >= totalPrice);

        _mintBatch(msg.sender, itemIds, amounts, "");
    }

    function cashout(address receiver) public onlyShopOwner isShopOpen {
        payable(receiver).transfer(address(this).balance);
    }

    function closeShop(address receiver) public onlyShopOwner isShopOpen {
        cashout(receiver);
        _burn(msg.sender, 0, 1);
        isOpen = false;
    }
}
