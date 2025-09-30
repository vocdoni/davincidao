// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DavinciDaoCensus} from "../src/Davincidao.sol";
import {MockERC721Mintable} from "../src/mocks/MockERC721Mintable.sol";

contract DavinciDaoMultiCollectionTest is Test {
    DavinciDaoCensus public census;
    MockERC721Mintable public nft721_1;
    MockERC721Mintable public nft721_2;

    // Test addresses
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);

    function setUp() public {
        // Deploy two different ERC721 collections
        nft721_1 = new MockERC721Mintable("TestNFT721_1", "T721_1");
        nft721_2 = new MockERC721Mintable("TestNFT721_2", "T721_2");

        // Setup collections array with two ERC721 collections
        address[] memory tokens = new address[](2);

        // Collection 0: First ERC721 collection
        tokens[0] = address(nft721_1);

        // Collection 1: Second ERC721 collection
        tokens[1] = address(nft721_2);

        // Deploy census contract
        census = new DavinciDaoCensus(tokens);

        // Mint tokens to alice from both collections
        // First ERC721 collection tokens
        nft721_1.mint(alice); // tokenId 1
        nft721_1.mint(alice); // tokenId 2
        nft721_1.mint(alice); // tokenId 3

        // Second ERC721 collection tokens
        nft721_2.mint(alice); // tokenId 1
        nft721_2.mint(alice); // tokenId 2
    }

    /// @notice Test delegation across multiple ERC721 collections
    function testMultiCollectionDelegation() public {
        vm.startPrank(alice);

        uint256[] memory emptyProof = new uint256[](0);

        // Delegate token from first collection to bob
        uint256[] memory collection1Ids = new uint256[](1);
        collection1Ids[0] = 1;
        census.delegate(bob, 0, collection1Ids, emptyProof);

        // Delegate token from second collection to bob
        uint256[] memory collection2Ids = new uint256[](1);
        collection2Ids[0] = 1;
        uint256[] memory bobProof = new uint256[](1);
        bobProof[0] = 618970019642690137449562113; // Bob's leaf as sibling
        census.delegate(bob, 1, collection2Ids, bobProof);

        // Verify bob's total weight (should be 2: 1 from each collection)
        (uint88 bobWeight,) = census.getDelegations(bob);
        assertEq(bobWeight, 2);

        vm.stopPrank();
    }

    /// @notice Test unique token identifiers across collections
    function testUniqueTokenIdentifiers() public {
        vm.startPrank(alice);

        uint256[] memory emptyProof = new uint256[](0);

        // Delegate token ID 1 from collection 0 to bob
        uint256[] memory collection1Ids = new uint256[](1);
        collection1Ids[0] = 1;
        census.delegate(bob, 0, collection1Ids, emptyProof);

        // Delegate token ID 1 from collection 1 to charlie (same token ID, different collection)
        uint256[] memory collection2Ids = new uint256[](1);
        collection2Ids[0] = 1;
        census.delegate(charlie, 1, collection2Ids, emptyProof);

        // Verify token delegations are tracked separately per collection
        address[] memory delegates1 = census.getTokenDelegations(0, collection1Ids);
        assertEq(delegates1[0], bob);

        address[] memory delegates2 = census.getTokenDelegations(1, collection2Ids);
        assertEq(delegates2[0], charlie);

        // Verify that token keys are unique (same token ID in different collections)
        // This is implicitly tested by the fact that both delegations work independently

        vm.stopPrank();
    }


    /// @notice Test validation works correctly for ERC721 collections
    function testValidationPerCollectionType() public {
        vm.startPrank(alice);

        uint256[] memory emptyProof = new uint256[](0);

        // ERC721: Non-existent token ID should fail with ownership check
        uint256[] memory invalidIds = new uint256[](1);
        invalidIds[0] = 999; // Token that doesn't exist
        vm.expectRevert();
        census.delegate(bob, 0, invalidIds, emptyProof);

        // Same for second collection
        vm.expectRevert();
        census.delegate(bob, 1, invalidIds, emptyProof);

        vm.stopPrank();
    }

    /// @notice Test delegation across collections to different delegates
    function testMultiCollectionMultiDelegate() public {
        vm.startPrank(alice);

        uint256[] memory emptyProof = new uint256[](0);

        // Delegate tokens from first collection to bob
        uint256[] memory collection1Ids = new uint256[](2);
        collection1Ids[0] = 1;
        collection1Ids[1] = 2;
        census.delegate(bob, 0, collection1Ids, emptyProof);

        // Delegate tokens from second collection to charlie
        uint256[] memory collection2Ids = new uint256[](2);
        collection2Ids[0] = 1;
        collection2Ids[1] = 2;
        census.delegate(charlie, 1, collection2Ids, emptyProof);

        // Verify weights
        (uint88 bobWeight,) = census.getDelegations(bob);
        (uint88 charlieWeight,) = census.getDelegations(charlie);
        assertEq(bobWeight, 2); // 2 tokens from first collection
        assertEq(charlieWeight, 2); // 2 tokens from second collection

        // Verify token delegations
        address[] memory delegates1 = census.getTokenDelegations(0, collection1Ids);
        assertEq(delegates1[0], bob);
        assertEq(delegates1[1], bob);

        address[] memory delegates2 = census.getTokenDelegations(1, collection2Ids);
        assertEq(delegates2[0], charlie);
        assertEq(delegates2[1], charlie);

        vm.stopPrank();
    }

    /// @notice Test updateDelegation across different collections
    function testUpdateDelegationMultiCollection() public {
        vm.startPrank(alice);

        uint256[] memory emptyProof = new uint256[](0);

        // First delegate token from first collection to bob
        uint256[] memory collection1Ids = new uint256[](1);
        collection1Ids[0] = 1;
        census.delegate(bob, 0, collection1Ids, emptyProof);

        // First delegate token from second collection to bob
        uint256[] memory collection2Ids = new uint256[](1);
        collection2Ids[0] = 1;
        uint256[] memory bobProof = new uint256[](1);
        bobProof[0] = 618970019642690137449562113; // Bob's leaf as sibling
        census.delegate(bob, 1, collection2Ids, bobProof);

        // Verify bob has weight 2
        (uint88 bobWeight,) = census.getDelegations(bob);
        assertEq(bobWeight, 2);

        // Update delegation from first collection from bob to charlie
        DavinciDaoCensus.ProofInput[] memory fromProofs = new DavinciDaoCensus.ProofInput[](1);
        fromProofs[0] = DavinciDaoCensus.ProofInput({account: bob, siblings: new uint256[](1)});
        fromProofs[0].siblings[0] = 0; // Simplified for test

        census.updateDelegation(charlie, 0, collection1Ids, fromProofs, emptyProof);

        // Verify weights after update
        (bobWeight,) = census.getDelegations(bob);
        (uint88 charlieWeight,) = census.getDelegations(charlie);
        assertEq(bobWeight, 1); // Only token from second collection remains
        assertEq(charlieWeight, 1); // Token from first collection moved to charlie

        vm.stopPrank();
    }

    /// @notice Test getNFTids across multiple collections
    function testGetNFTidsMultiCollection() public {
        vm.startPrank(alice);

        uint256[] memory emptyProof = new uint256[](0);

        // Delegate some tokens from both collections
        uint256[] memory collection1Ids = new uint256[](2);
        collection1Ids[0] = 1;
        collection1Ids[1] = 2;
        census.delegate(bob, 0, collection1Ids, emptyProof);

        uint256[] memory collection2Ids = new uint256[](1);
        collection2Ids[0] = 1;
        uint256[] memory bobProof = new uint256[](1);
        bobProof[0] = 618970019642690137449562114; // Bob's leaf as sibling
        census.delegate(bob, 1, collection2Ids, bobProof);

        // Test getNFTids for first collection
        uint256[] memory candidateIds1 = new uint256[](3);
        candidateIds1[0] = 1; // Delegated
        candidateIds1[1] = 2; // Delegated
        candidateIds1[2] = 3; // Not delegated

        uint256[] memory delegatedIds1 = census.getNFTids(0, candidateIds1);
        assertEq(delegatedIds1.length, 2);
        assertEq(delegatedIds1[0], 1);
        assertEq(delegatedIds1[1], 2);

        // Test getNFTids for second collection
        uint256[] memory candidateIds2 = new uint256[](2);
        candidateIds2[0] = 1; // Delegated
        candidateIds2[1] = 2; // Not delegated

        uint256[] memory delegatedIds2 = census.getNFTids(1, candidateIds2);
        assertEq(delegatedIds2.length, 1);
        assertEq(delegatedIds2[0], 1);

        vm.stopPrank();
    }

    /// @notice Test collections array access for multi-collection setup
    function testCollectionsArrayAccess() public view {
        // Test accessing first ERC721 collection
        address token0 = census.collections(0);
        assertEq(token0, address(nft721_1));

        // Test accessing second ERC721 collection
        address token1 = census.collections(1);
        assertEq(token1, address(nft721_2));
    }

    /// @notice Test that token keys are truly unique across collections
    function testTokenKeyUniqueness() public {
        vm.startPrank(alice);

        uint256[] memory emptyProof = new uint256[](0);

        // Delegate token ID 1 from first collection to bob
        uint256[] memory collection1Ids = new uint256[](1);
        collection1Ids[0] = 1;
        census.delegate(bob, 0, collection1Ids, emptyProof);

        // Delegate token ID 1 from second collection to charlie
        uint256[] memory collection2Ids = new uint256[](1);
        collection2Ids[0] = 1;
        census.delegate(charlie, 1, collection2Ids, emptyProof);

        // Verify that each token is delegated to the correct person
        address[] memory delegates1 = census.getTokenDelegations(0, collection1Ids);
        assertEq(delegates1[0], bob);

        address[] memory delegates2 = census.getTokenDelegations(1, collection2Ids);
        assertEq(delegates2[0], charlie);

        // This proves that the token keys are unique across collections
        // because the same logic would fail if keys collided

        vm.stopPrank();
    }
}
