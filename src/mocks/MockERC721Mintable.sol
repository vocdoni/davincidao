// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockERC721Mintable is ERC721 {
    uint256 private _next;

    constructor(string memory n, string memory s) ERC721(n, s) {}

    function mint(address to) external returns (uint256 id) {
        id = ++_next;
        _safeMint(to, id);
    }
}
