//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./W3ShopFactory2.sol";

import "hardhat/console.sol";

contract W3ShopItems is ERC1155 {
    using Counters for Counters.Counter;

    Counters.Counter private nextTokenId;
    W3ShopFactory2 private shopFactory;

    // Token ID to custom URI mapping
    mapping(uint256 => string) private uris;

    modifier onlyRegisteredShop() {
        require(shopFactory.isRegisteredShop(msg.sender), "not shop");
        _;
    }

    constructor(address _factory) ERC1155("") {
        shopFactory = W3ShopFactory2(_factory);
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
    function createItems(string[] calldata _uris)
        external
        onlyRegisteredShop
        returns (uint256[] memory)
    {
        uint256[] memory createdIds = new uint256[](_uris.length);

        for (uint256 i = 0; i < _uris.length; i++) {
            uint256 id = nextTokenId.current();

            nextTokenId.increment();

            bytes memory tempUriStr = bytes(_uris[i]);
            require(tempUriStr.length > 0, "uri empty");

            uris[id] = _uris[i];
            createdIds[i] = id;
        }

        return createdIds;
    }

    function mint(address _receiver) external onlyRegisteredShop {

        _mintBatch(msg.sender, itemIds, amounts, "");
    }
}
