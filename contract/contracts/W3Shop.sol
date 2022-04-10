//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "./MerkleMultiProof.sol";
import "./ArweaveUriAppender.sol";
import "hardhat/console.sol";

contract W3Shop is ERC1155 {
    modifier onlyShopOwner() {
        require(balanceOf(msg.sender, 0) == 1, "not owner");
        _;
    }

    modifier isShopOpen() {
        require(_isOpened, "shop closed");
        _;
    }

    bool private _isOpened = true;
    bytes32 public itemsRoot;
    string public shopConfig;

    // Token ID to custom URI mapping
    mapping(uint256 => string) private _uris;

    /**
     * _ownerNftId: The Arweave file ID of the shop owner NFT.
     */
    constructor(
        address _owner,
        string memory _shopConfig,
        string memory _ownerNftId
    ) ERC1155("") {
        // Mint the owner NFT of the shop to the deployer.
        _mint(_owner, 0, 1, "");
        shopConfig = _shopConfig;
        _uris[0] = _ownerNftId;
    }

    /**
     * @dev See {IERC1155MetadataURI-uri}.
     *
     * This implementation returns the same URI for *all* token types. It relies
     * on the token type ID substitution mechanism
     * https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     *
     * Clients calling this function must replace the `\{id\}` substring with the
     * actual token type ID.
     */
    function uri(uint256 id)
        public
        view
        virtual
        override
        returns (string memory)
    {
        return ArweaveUriAppender.append(_uris[id]);
    }

    function prepareItem(uint256 id, string memory _uri)
        public
        onlyShopOwner
        isShopOpen
    {
        // We need this as a trick to check if the string is empty before setting it
        require(id > 0);
        bytes memory tempUriStr = bytes(_uris[id]);
        require(tempUriStr.length == 0);

        // You can not leave ids empty and are required to fill them one after another.
        tempUriStr = bytes(_uris[id - 1]);
        require(tempUriStr.length > 0);

        _uris[id] = _uri;
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
        uint256[] memory amounts,
        uint256[] memory prices,
        uint256[] memory itemIds,
        bytes32[] memory proofs,
        bool[] memory proofFlags
    ) public payable isShopOpen {
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
            bytes memory tempUriStr = bytes(_uris[itemIds[i]]);
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
        _isOpened = false;
    }
}
