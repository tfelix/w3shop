//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./W3ShopFactory.sol";

import "hardhat/console.sol";

contract W3ShopItems is ERC1155, ERC2981 {
    using Counters for Counters.Counter;

    event Buy(address indexed buyer, address indexed shop, uint256[] items);

    uint256 public constant MAX_ITEM_COUNT = type(uint256).max;

    Counters.Counter private nextTokenId;
    W3ShopFactory private shopFactory;

    // Token ID to custom URI mapping
    mapping(uint256 => string) private uris;

    modifier onlyRegisteredShopOrFactory() {
        require(
            shopFactory.isRegisteredShop(msg.sender) ||
                msg.sender == address(shopFactory),
            "not allowed"
        );
        _;
    }

    constructor(W3ShopFactory _factory) ERC1155("") {
        shopFactory = _factory;
        // We must start with 1 as 0 has a special meaning for token IDs.
        nextTokenId.increment();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, ERC2981)
        returns (bool)
    {
        return
            ERC1155.supportsInterface(interfaceId) ||
            ERC2981.supportsInterface(interfaceId);
    }

    /**
     * @dev Sets the royalty information for a specific token id.
     *
     * Requirements:
     *
     * - `receiver` cannot be the zero address.
     * - `feeNumerator` cannot be greater than the fee denominator.
     */
    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external onlyRegisteredShopOrFactory {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
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

    /**
     * Shops can use this method to register new items for selling inside this contract.
     */
    function prepareItems(uint8 n)
        external
        onlyRegisteredShopOrFactory
        returns (uint256[] memory)
    {
        require(n <= 10);
        uint256[] memory createdIds = new uint256[](n);

        for (uint256 i = 0; i < n; i++) {
            createdIds[i] = nextTokenId.current();
            nextTokenId.increment();
        }

        return createdIds;
    }

    /**
     * Shops can use this method to register new items for selling inside this contract.
     */
    function setItemUris(uint256[] calldata _ids, string[] memory _uris)
        external
        onlyRegisteredShopOrFactory
    {
        require(_ids.length == _uris.length, "invalid input");

        for (uint256 i = 0; i < _uris.length; i++) {
            bytes memory tempUriStr = bytes(_uris[i]);
            require(tempUriStr.length > 0, "uri empty");

            bytes storage tempStorageStr = bytes(uris[_ids[i]]);

            require(tempStorageStr.length == 0, "slot used");

            uris[_ids[i]] = _uris[i];
        }
    }

    function mint(
        address _receiver,
        uint256[] calldata _itemIds,
        uint256[] calldata _amounts
    ) external onlyRegisteredShopOrFactory {
        require(_itemIds.length == _amounts.length, "invalid input");

        for (uint256 i = 0; i < _itemIds.length; i++) {
            bytes memory tempUriStr = bytes(uris[_itemIds[i]]);
            require(tempUriStr.length > 0, "non existing item");
        }

        _mintBatch(_receiver, _itemIds, _amounts, "");

        emit Buy(_receiver, msg.sender, _itemIds);
    }

    function burn(
        address _owner,
        uint256 _itemId,
        uint256 _amounts
    ) external onlyRegisteredShopOrFactory {
        _burn(_owner, _itemId, _amounts);
    }
}
