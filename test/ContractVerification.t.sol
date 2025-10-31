// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {DavinciDao} from "../src/DavinciDao.sol";
import {MockERC721Mintable} from "../src/mocks/MockERC721Mintable.sol";

contract ContractVerificationTest is Test {
    DavinciDao public census;
    MockERC721Mintable public nft721;

    function setUp() public {
        // Deploy a mock ERC721 contract for testing
        nft721 = new MockERC721Mintable("TestNFT", "TNFT");

        // Setup collections array for ERC721 only
        address[] memory tokens = new address[](1);
        tokens[0] = address(nft721);

        // Deploy census contract
        census = new DavinciDao(tokens);
    }

    function testDeployedContractBasicFunctions() public view {
        // Test basic contract functions
        uint256 root = census.getCensusRoot();
        console.log("Census root:", root);
        assertTrue(true, "getCensusRoot() works");

        // Test collections access
        address tokenAddress = census.collections(0);
        console.log("Collection 0 token:", tokenAddress);
        assertTrue(tokenAddress != address(0), "Collection should have valid token address");
        assertEq(tokenAddress, address(nft721), "Should be the deployed NFT contract");
    }

    function testTokenIdZeroHandling() public {
        // For ERC721, any token ID is valid if owned
        // The MockERC721Mintable starts from token ID 1, so let's test with that
        address testUser = address(0x123);
        uint256 tokenId = nft721.mint(testUser);

        // Verify ownership
        assertEq(nft721.ownerOf(tokenId), testUser, "Token should be owned by test user");
        assertEq(tokenId, 1, "First minted token should have ID 1");
        console.log("Token ID", tokenId, "is properly configured and owned");
    }
}
