//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

/**
 * Central ERC1155 registry that holds all purchased shop NFTs.
 */
contract W3ShopRegistry is ERC1155 {
    using Counters for Counters.Counter;

    modifier isFactory() {
        require(msg.sender == factoryContract, "not factory");
        _;
    }

    modifier isAllowedShop() {
        require(allowedShops[msg.sender] == true, "not a shop");
        _;
    }

    // Token ID to custom URI mapping
    mapping(uint256 => string) private uris;

    // Which shops are allowed to access the registry.
    mapping(address => bool) private allowedShops;

    mapping(uint256 => uint256) private maxAllowedTokenCounts;

    // Only the factory contract is allowed to set allowed shops.
    address private factoryContract = address(0);

    Counters.Counter private tokenCount;

    constructor(
        address _owner,
        string memory _shopConfig,
        string memory _ownerNftId
    ) ERC1155("") {}

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
    function uri(uint256 _id)
        public
        view
        virtual
        override
        returns (string memory)
    {
        return uris[_id];
    }

    /**
     * Only works once and should be set when the
     */
    function setFactory(address _factoryContract) external {
        require(factoryContract == address(0));
        factoryContract = _factoryContract;
    }

    function registerShop(address shopAddress) external isFactory {
        allowedShops[shopAddress] = true;
    }

    function createItem(
        address _receiver,
        string calldata _uri,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _maxAllowed
    ) external isAllowedShop returns (uint256) {
        if (_tokenId == 0) {
            tokenCount.increment();
            _tokenId = tokenCount.current();
        }

        // If max amount was not set before we set it. Otherwise we enforce that not more than this
        // tokens can be minted.
        uint256 maxAllowedTokenCount = maxAllowedTokenCounts[_tokenId];
        if (maxAllowedTokenCount == 0 && _maxAllowed != 0) {
            maxAllowedTokenCounts[_tokenId] = _maxAllowed;
            maxAllowedTokenCount = _maxAllowed;
        }

        require(maxAllowedTokenCount == _maxAllowed);
        require(maxAllowedTokenCount + _amount <= maxAllowedTokenCount);

        _mint(_receiver, _tokenId, _amount, "");

        // Set the URI if not set. Require that the URI was provided in the call.
        require(bytes(_uri).length > 0);
        if (!isUriSet(_tokenId)) {
            uris[_tokenId] = _uri;
        }

        return _tokenId;
    }

    function isUriSet(uint256 tokenId) private view returns (bool) {
        // We need this as a trick to check if the string is empty before setting it
        require(tokenId > 0);
        bytes memory tempUriStr = bytes(uris[tokenId]);

        return tempUriStr.length > 0;
    }
}
