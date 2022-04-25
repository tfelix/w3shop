//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./MerkleMultiProof.sol";
import "hardhat/console.sol";

contract W3Shop is ERC1155 {
    using Counters for Counters.Counter;

    modifier onlyShopOwner() {
        require(balanceOf(msg.sender, 0) == 1, "not owner");
        _;
    }

    modifier isShopOpen() {
        require(isOpened, "shop closed");
        _;
    }

    bytes32 public itemsRoot;
    string public shopConfig;

    Counters.Counter private _nextTokenId;
    bool private isOpened = true;

    // Token ID to custom URI mapping
    mapping(uint256 => string) private uris;

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
        _nextTokenId.increment();

        shopConfig = _shopConfig;
        uris[0] = _ownerNftId;
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
        return uris[id];
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId.current();
    }

    function prepareItem(uint256 _id, string memory _uri)
        external
        onlyShopOwner
        isShopOpen
    {
        require(_id == _nextTokenId.current());

        // URI must not be empty
        bytes memory tempUriStr = bytes(uris[_id]);
        require(tempUriStr.length == 0);

        _nextTokenId.increment();
        uris[_id] = _uri;
    }

    function prepareItemBatch(uint256[] calldata _ids, string[] calldata _uris)
        external
        onlyShopOwner
        isShopOpen
    {
        require(_ids.length == _uris.length, "unequal length");

        for (uint256 i = 0; i < _ids.length; i++) {
            require(_ids[i] == _nextTokenId.current(), "id mismatch");

            // URI must not be empty
            bytes memory tempUriStr = bytes(uris[_ids[i]]);
            require(tempUriStr.length == 0, "uri empty");

            _nextTokenId.increment();
            uris[_ids[i]] = _uris[i];
        }
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
            // Calculate the leafs
            leafs[i] = keccak256(abi.encodePacked(itemIds[i], prices[i]));

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

        require(
            MerkleMultiProof.verify(itemsRoot, leafs, proofs, proofFlags),
            "proof"
        );

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
        isOpened = false;
    }
}
