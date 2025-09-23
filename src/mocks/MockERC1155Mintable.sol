// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract MockERC1155Mintable is ERC1155 {
    constructor() ERC1155("") {}

    function mint(address to, uint256 id) external {
        _mint(to, id, 1, ""); // treat each id as NFT-like (supply=1 for tests)
    }
}

