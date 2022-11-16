//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./W3ShopFactory.sol";

import "hardhat/console.sol";

contract W3ShopItems is ERC1155, ERC2981, ERC1155Burnable {
    using Counters for Counters.Counter;

    event Buy(address indexed buyer, address indexed shop, uint256[] items);

    uint256 public constant MAX_ITEM_COUNT = type(uint256).max;

    Counters.Counter private nextTokenId;
    W3ShopFactory private shopFactory;

    // Token ID to custom URI mapping
    mapping(uint256 => string) private uris;

    modifier onlyRegisteredShop() {
        require(shopFactory.isRegisteredShop(msg.sender), "not allowed");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == address(shopFactory), "not allowed");
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
    ) external onlyRegisteredShop {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    /**
     * @dev Returns the URI for every token.
     *
     * Because of the way how upload the usage data to Arweave, every token needs its own URI.
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
     * @dev Shops can use this method to register new items for selling inside this contract.
     *
     * This reserves the upcoming next item URIs to be used with this shop. These item ids can
     * be used to prepare NFT metadata files to be uploaded to Arweave.
     */
    function prepareItems(uint8 n)
        external
        onlyRegisteredShop
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
     * @dev Shops can use this method to register new items for selling inside this contract.
     *
     * After the metadata was generated and uploaded this method can be used to prepare the items
     * for selling within this shop contract.
     */
    function setItemUris(uint256[] calldata _ids, string[] memory _uris)
        external
        onlyRegisteredShop
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
        uint32[] calldata _amounts
    ) external onlyRegisteredShop {
        require(_itemIds.length == _amounts.length, "invalid input");

        for (uint256 i = 0; i < _itemIds.length; i++) {
            bytes memory tempUriStr = bytes(uris[_itemIds[i]]);
            require(tempUriStr.length > 0, "non existing item");
        }

        _mintBatch(_receiver, _itemIds, conversion(_amounts), "");

        emit Buy(_receiver, msg.sender, _itemIds);
    }

    function conversion(uint32[] calldata array8)
        private
        pure
        returns (uint256[] memory array256)
    {
        for (uint256 i = 0; i < array8.length; i++) {
            array256[i] = array8[i];
        }

        return array256;
    }

    /**
     * @dev Only mint owner NFTs from the shop factory.
     *
     * This saves some gas during creation of the shop and buy of normal items
     * as some checks can be simplified.
     */
    function mintOwnerNft(address _receiver, string calldata _itemUri)
        external
        onlyFactory
        returns (uint256)
    {
        uint256 itemId = nextTokenId.current();
        nextTokenId.increment();

        uris[itemId] = _itemUri;

        _mint(_receiver, itemId, 1, "");

        return itemId;
    }

    /**
     * Special method for shops, so during a closing down the owner token is directly burned without
     * checking user ownershop.
     */
    function burnShopOwner(
        address _owner,
        uint256 _itemId,
        uint256 _amounts
    ) external onlyRegisteredShop {
        _burn(_owner, _itemId, _amounts);
    }
}
