//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

library ArweaveUriAppender {
    function append(string memory data) internal pure returns (string memory) {
        return string(abi.encodePacked("https://arweave.net/", data));
    }
}
