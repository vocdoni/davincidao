// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DavinciDaoCensus} from "../src/Davincidao.sol";
import {MockERC721Mintable} from "../src/mocks/MockERC721Mintable.sol";

contract DavinciDaoComprehensiveTest is Test {
    DavinciDaoCensus public census;
    MockERC721Mintable public nft;
    
    // Test addresses matching the generated test data
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    address public dave = address(0x4);
    
    function setUp() public {
        // Deploy mock NFT
        nft = new MockERC721Mintable("TestNFT", "TNFT");
        
        // Setup collections array
        address[] memory tokens = new address[](1);
        DavinciDaoCensus.TokenStandard[] memory standards = new DavinciDaoCensus.TokenStandard[](1);
        tokens[0] = address(nft);
        standards[0] = DavinciDaoCensus.TokenStandard.ERC721;
        
        // Deploy census contract
        census = new DavinciDaoCensus(tokens, standards);
        
        // Mint NFTs to alice for delegation
        nft.mint(alice); // tokenId 1
        nft.mint(alice); // tokenId 2
        nft.mint(alice); // tokenId 3
        nft.mint(alice); // tokenId 4
        nft.mint(alice); // tokenId 5
    }
    
    /// @notice Test basic operations scenario with valid proofs
    function testBasicOperationsWithValidProofs() public {
        vm.startPrank(alice);
        
        // Step 1: Insert Bob with weight 1 (first insertion)
        uint256[] memory ids1 = new uint256[](1);
        ids1[0] = 1;
        uint256[] memory emptyProof = new uint256[](0);
        
        census.delegate(bob, 0, ids1, emptyProof);
        
        // Verify Bob's state
        (uint88 bobWeight,) = census.getDelegations(bob);
        assertEq(bobWeight, 1);
        assertEq(census.getAccountAt(0), bob);
        assertEq(census.getCensusRoot(), 618970019642690137449562113);
        
        // Step 2: Insert Charlie with weight 1
        uint256[] memory ids2 = new uint256[](1);
        ids2[0] = 2;
        
        census.delegate(charlie, 0, ids2, emptyProof);
        
        // Verify Charlie's state
        (uint88 charlieWeight,) = census.getDelegations(charlie);
        assertEq(charlieWeight, 1);
        assertEq(census.getAccountAt(0), bob);
        assertEq(census.getAccountAt(1), charlie);
        assertEq(census.getCensusRoot(), 8161107922390560826582004614572049481782314150751446169603744326598204661278);
        
        // Step 3: Update Bob's weight from 1 to 2 (weight update with proof)
        uint256[] memory ids3 = new uint256[](1);
        ids3[0] = 3;
        
        // Valid proof for Bob's weight update (from generated test data)
        uint256[] memory bobProof = new uint256[](1);
        bobProof[0] = 928455029464035206174343169; // Charlie's leaf as sibling
        
        census.delegate(bob, 0, ids3, bobProof);
        
        // Verify Bob's updated state
        (bobWeight,) = census.getDelegations(bob);
        assertEq(bobWeight, 2);
        assertEq(census.getAccountAt(0), bob); // Same index
        assertEq(census.getAccountAt(1), charlie); // Charlie unchanged
        assertEq(census.getCensusRoot(), 3532267341030419376075674574137994815411390233154156156025472591284815686455);
        
        vm.stopPrank();
    }
    
    /// @notice Test delegation update scenario with valid proofs
    function testDelegationUpdateWithValidProofs() public {
        vm.startPrank(alice);
        
        // Step 1: Insert Bob with weight 2
        uint256[] memory ids1 = new uint256[](2);
        ids1[0] = 1;
        ids1[1] = 2;
        uint256[] memory emptyProof = new uint256[](0);
        
        census.delegate(bob, 0, ids1, emptyProof);
        
        // Verify initial state
        (uint88 bobWeight,) = census.getDelegations(bob);
        assertEq(bobWeight, 2);
        assertEq(census.getAccountAt(0), bob);
        assertEq(census.getCensusRoot(), 618970019642690137449562114);
        
        // Step 2: Insert Charlie with weight 1
        uint256[] memory ids2 = new uint256[](1);
        ids2[0] = 3;
        
        census.delegate(charlie, 0, ids2, emptyProof);
        
        // Verify state after Charlie's insertion
        (uint88 charlieWeight,) = census.getDelegations(charlie);
        assertEq(charlieWeight, 1);
        assertEq(census.getAccountAt(0), bob);
        assertEq(census.getAccountAt(1), charlie);
        assertEq(census.getCensusRoot(), 3532267341030419376075674574137994815411390233154156156025472591284815686455);
        
        // Step 3: Move 1 token from Bob to Charlie using updateDelegation
        uint256[] memory idsToMove = new uint256[](1);
        idsToMove[0] = 2; // Move token 2 from Bob to Charlie
        
        // Prepare proofs for the delegation update
        DavinciDaoCensus.ProofInput[] memory fromProofs = new DavinciDaoCensus.ProofInput[](1);
        fromProofs[0] = DavinciDaoCensus.ProofInput({
            account: bob,
            siblings: new uint256[](1)
        });
        fromProofs[0].siblings[0] = 928455029464035206174343169; // Charlie's leaf as sibling
        
        uint256[] memory toProof = new uint256[](1);
        toProof[0] = 618970019642690137449562113; // Bob's updated leaf as sibling
        
        census.updateDelegation(charlie, 0, idsToMove, fromProofs, toProof);
        
        // Verify final state
        (bobWeight,) = census.getDelegations(bob);
        (charlieWeight,) = census.getDelegations(charlie);
        assertEq(bobWeight, 1); // Bob: 2 -> 1
        assertEq(charlieWeight, 2); // Charlie: 1 -> 2
        assertEq(census.getAccountAt(0), bob); // Same positions
        assertEq(census.getAccountAt(1), charlie);
        assertEq(census.getCensusRoot(), 10010187978910846503809757043533079569703578884393642925997553846060879524280);
        
        vm.stopPrank();
    }
    
    /// @notice Test removal and reinsertion scenario
    function testRemovalAndReinsertionWithValidProofs() public {
        vm.startPrank(alice);
        
        // Step 1: Insert Bob with weight 1
        uint256[] memory ids1 = new uint256[](1);
        ids1[0] = 1;
        uint256[] memory emptyProof = new uint256[](0);
        
        census.delegate(bob, 0, ids1, emptyProof);
        
        // Step 2: Insert Charlie with weight 1
        uint256[] memory ids2 = new uint256[](1);
        ids2[0] = 2;
        
        census.delegate(charlie, 0, ids2, emptyProof);
        
        // Verify initial state
        assertEq(census.getAccountAt(0), bob);
        assertEq(census.getAccountAt(1), charlie);
        assertEq(census.getCensusRoot(), 8161107922390560826582004614572049481782314150751446169603744326598204661278);
        
        // Step 3: Remove Bob (undelegate all his tokens)
        DavinciDaoCensus.ProofInput[] memory proofs = new DavinciDaoCensus.ProofInput[](1);
        proofs[0] = DavinciDaoCensus.ProofInput({
            account: bob,
            siblings: new uint256[](1)
        });
        proofs[0].siblings[0] = 928455029464035206174343169; // Charlie's leaf as sibling
        
        census.undelegate(0, ids1, proofs);
        
        // Verify Bob's removal
        (uint88 bobWeight,) = census.getDelegations(bob);
        (uint88 charlieWeight,) = census.getDelegations(charlie);
        assertEq(bobWeight, 0);
        assertEq(charlieWeight, 1);
        assertEq(census.getAccountAt(0), address(0)); // Bob's position cleared
        assertEq(census.getAccountAt(1), charlie); // Charlie unchanged
        
        // Step 4: Insert Alice with weight 1 (new insertion after removal)
        uint256[] memory ids3 = new uint256[](1);
        ids3[0] = 3;
        
        census.delegate(alice, 0, ids3, emptyProof);
        
        // Verify Alice's insertion
        (uint88 aliceWeight,) = census.getDelegations(alice);
        assertEq(aliceWeight, 1);
        assertEq(census.getAccountAt(0), address(0)); // Still cleared (Bob's old position)
        assertEq(census.getAccountAt(1), charlie); // Charlie unchanged
        assertEq(census.getAccountAt(2), alice); // Alice gets new position
        
        vm.stopPrank();
    }
    
    /// @notice Test reverse index consistency across operations
    function testReverseIndexConsistency() public {
        vm.startPrank(alice);
        
        uint256[] memory emptyProof = new uint256[](0);
        
        // Insert multiple accounts
        uint256[] memory ids1 = new uint256[](1);
        ids1[0] = 1;
        census.delegate(bob, 0, ids1, emptyProof);
        
        uint256[] memory ids2 = new uint256[](1);
        ids2[0] = 2;
        census.delegate(charlie, 0, ids2, emptyProof);
        
        uint256[] memory ids3 = new uint256[](1);
        ids3[0] = 3;
        census.delegate(dave, 0, ids3, emptyProof);
        
        // Verify reverse index
        assertEq(census.getAccountAt(0), bob);
        assertEq(census.getAccountAt(1), charlie);
        assertEq(census.getAccountAt(2), dave);
        assertEq(census.getAccountAt(3), address(0)); // Empty
        
        // Verify weights
        (uint88 bobWeight,) = census.getDelegations(bob);
        (uint88 charlieWeight,) = census.getDelegations(charlie);
        (uint88 daveWeight,) = census.getDelegations(dave);
        
        assertEq(bobWeight, 1);
        assertEq(charlieWeight, 1);
        assertEq(daveWeight, 1);
        
        vm.stopPrank();
    }
    
    /// @notice Test edge cases and error conditions
    function testEdgeCases() public {
        vm.startPrank(alice);
        
        // Test delegation to zero address (should fail)
        uint256[] memory ids = new uint256[](1);
        ids[0] = 1;
        uint256[] memory emptyProof = new uint256[](0);
        
        vm.expectRevert(DavinciDaoCensus.ZeroAddress.selector);
        census.delegate(address(0), 0, ids, emptyProof);
        
        // Test delegation of non-owned token (should fail)
        vm.stopPrank();
        vm.startPrank(bob); // Bob doesn't own any tokens
        
        vm.expectRevert(abi.encodeWithSelector(DavinciDaoCensus.NotTokenOwner.selector, 1));
        census.delegate(charlie, 0, ids, emptyProof);
        
        vm.stopPrank();
        vm.startPrank(alice);
        
        // Test double delegation (should fail)
        census.delegate(bob, 0, ids, emptyProof);
        
        vm.expectRevert(abi.encodeWithSelector(DavinciDaoCensus.AlreadyDelegated.selector, 1));
        census.delegate(charlie, 0, ids, emptyProof);
        
        vm.stopPrank();
    }
    
    /// @notice Test getAccountAt function edge cases
    function testGetAccountAtEdgeCases() public {
        // Test empty tree
        assertEq(census.getAccountAt(0), address(0));
        assertEq(census.getAccountAt(100), address(0));
        
        vm.startPrank(alice);
        
        // Add one account
        uint256[] memory ids = new uint256[](1);
        ids[0] = 1;
        uint256[] memory emptyProof = new uint256[](0);
        
        census.delegate(bob, 0, ids, emptyProof);
        
        // Test valid and invalid indices
        assertEq(census.getAccountAt(0), bob);
        assertEq(census.getAccountAt(1), address(0));
        assertEq(census.getAccountAt(999), address(0));
        
        vm.stopPrank();
    }
    
    /// @notice Test getTokenDelegations function
    function testGetTokenDelegations() public {
        vm.startPrank(alice);
        
        uint256[] memory emptyProof = new uint256[](0);
        
        // Delegate tokens 1 and 3 to bob, token 2 to charlie
        uint256[] memory ids1 = new uint256[](1);
        ids1[0] = 1;
        census.delegate(bob, 0, ids1, emptyProof);
        
        uint256[] memory ids2 = new uint256[](1);
        ids2[0] = 2;
        census.delegate(charlie, 0, ids2, emptyProof);
        
        uint256[] memory ids3 = new uint256[](1);
        ids3[0] = 3;
        uint256[] memory bobProof = new uint256[](1);
        bobProof[0] = 928455029464035206174343169; // Charlie's leaf as sibling
        census.delegate(bob, 0, ids3, bobProof);
        
        // Test getTokenDelegations
        uint256[] memory queryIds = new uint256[](4);
        queryIds[0] = 1;
        queryIds[1] = 2;
        queryIds[2] = 3;
        queryIds[3] = 4; // Not delegated
        
        address[] memory delegates = census.getTokenDelegations(0, queryIds);
        
        assertEq(delegates.length, 4);
        assertEq(delegates[0], bob);     // Token 1 -> Bob
        assertEq(delegates[1], charlie); // Token 2 -> Charlie
        assertEq(delegates[2], bob);     // Token 3 -> Bob
        assertEq(delegates[3], address(0)); // Token 4 -> Not delegated
        
        vm.stopPrank();
    }
    
    /// @notice Test getNFTids function
    function testGetNFTids() public {
        vm.startPrank(alice);
        
        uint256[] memory emptyProof = new uint256[](0);
        
        // Delegate tokens 1, 2, 3 to bob
        uint256[] memory ids = new uint256[](3);
        ids[0] = 1;
        ids[1] = 2;
        ids[2] = 3;
        census.delegate(bob, 0, ids, emptyProof);
        
        // Test getNFTids - should return tokens alice has delegated and still owns
        uint256[] memory candidateIds = new uint256[](5);
        candidateIds[0] = 1;
        candidateIds[1] = 2;
        candidateIds[2] = 3;
        candidateIds[3] = 4; // Not delegated
        candidateIds[4] = 5; // Not delegated
        
        uint256[] memory delegatedIds = census.getNFTids(0, candidateIds);
        
        assertEq(delegatedIds.length, 3);
        assertEq(delegatedIds[0], 1);
        assertEq(delegatedIds[1], 2);
        assertEq(delegatedIds[2], 3);
        
        vm.stopPrank();
    }
    
    /// @notice Test computeLeaf function
    function testComputeLeaf() public {
        vm.startPrank(alice);
        
        uint256[] memory emptyProof = new uint256[](0);
        
        // Initially, bob has no weight
        uint256 leafBefore = census.computeLeaf(bob);
        assertEq(leafBefore, 618970019642690137449562112); // Bob's address with weight 0
        
        // Delegate token to bob
        uint256[] memory ids = new uint256[](1);
        ids[0] = 1;
        census.delegate(bob, 0, ids, emptyProof);
        
        // Now bob should have weight 1
        uint256 leafAfter = census.computeLeaf(bob);
        assertEq(leafAfter, 618970019642690137449562113); // Bob's address with weight 1
        
        vm.stopPrank();
    }
    
    /// @notice Test constructor edge cases
    function testConstructorEdgeCases() public {
        // Test empty arrays (should fail)
        address[] memory emptyTokens = new address[](0);
        DavinciDaoCensus.TokenStandard[] memory emptyStandards = new DavinciDaoCensus.TokenStandard[](0);
        
        vm.expectRevert("bad config");
        new DavinciDaoCensus(emptyTokens, emptyStandards);
        
        // Test mismatched array lengths (should fail)
        address[] memory tokens = new address[](1);
        tokens[0] = address(nft);
        DavinciDaoCensus.TokenStandard[] memory standards = new DavinciDaoCensus.TokenStandard[](2);
        standards[0] = DavinciDaoCensus.TokenStandard.ERC721;
        standards[1] = DavinciDaoCensus.TokenStandard.ERC721;
        
        vm.expectRevert("bad config");
        new DavinciDaoCensus(tokens, standards);
    }
    
    /// @notice Test invalid collection index
    function testInvalidCollectionIndex() public {
        vm.startPrank(alice);
        
        uint256[] memory ids = new uint256[](1);
        ids[0] = 1;
        uint256[] memory emptyProof = new uint256[](0);
        
        // Test with invalid collection index (should fail)
        vm.expectRevert(DavinciDaoCensus.InvalidCollection.selector);
        census.delegate(bob, 999, ids, emptyProof);
        
        vm.expectRevert(DavinciDaoCensus.InvalidCollection.selector);
        census.getTokenDelegations(999, ids);
        
        vm.expectRevert(DavinciDaoCensus.InvalidCollection.selector);
        census.getNFTids(999, ids);
        
        vm.stopPrank();
    }
    
    /// @notice Test event emissions
    function testEventEmissions() public {
        vm.startPrank(alice);
        
        uint256[] memory ids = new uint256[](1);
        ids[0] = 1;
        uint256[] memory emptyProof = new uint256[](0);
        
        // Test Delegated event
        vm.expectEmit(true, true, true, true);
        emit DavinciDaoCensus.Delegated(alice, bob, 0, 1);
        
        census.delegate(bob, 0, ids, emptyProof);
        
        // Events are also tested in other comprehensive tests with valid proofs
        
        vm.stopPrank();
    }
    
    /// @notice Test undelegate edge cases
    function testUndelegateEdgeCases() public {
        vm.startPrank(alice);
        
        uint256[] memory ids = new uint256[](1);
        ids[0] = 1;
        uint256[] memory emptyProof = new uint256[](0);
        
        // Test undelegating non-delegated token (should fail)
        DavinciDaoCensus.ProofInput[] memory proofs = new DavinciDaoCensus.ProofInput[](1);
        proofs[0] = DavinciDaoCensus.ProofInput({
            account: bob,
            siblings: emptyProof
        });
        
        vm.expectRevert(abi.encodeWithSelector(DavinciDaoCensus.NotDelegated.selector, 1));
        census.undelegate(0, ids, proofs);
        
        // Delegate first
        census.delegate(bob, 0, ids, emptyProof);
        
        // Test undelegating token you don't own
        vm.stopPrank();
        vm.startPrank(bob);
        
        vm.expectRevert(abi.encodeWithSelector(DavinciDaoCensus.NotTokenOwner.selector, 1));
        census.undelegate(0, ids, proofs);
        
        vm.stopPrank();
    }
    
    /// @notice Test updateDelegation edge cases
    function testUpdateDelegationEdgeCases() public {
        vm.startPrank(alice);
        
        uint256[] memory ids = new uint256[](1);
        ids[0] = 1;
        uint256[] memory emptyProof = new uint256[](0);
        
        // Test updating to zero address (should fail)
        DavinciDaoCensus.ProofInput[] memory fromProofs = new DavinciDaoCensus.ProofInput[](0);
        
        vm.expectRevert(DavinciDaoCensus.ZeroAddress.selector);
        census.updateDelegation(address(0), 0, ids, fromProofs, emptyProof);
        
        // Test updating non-owned token (should fail)
        vm.stopPrank();
        vm.startPrank(bob);
        
        vm.expectRevert(abi.encodeWithSelector(DavinciDaoCensus.NotTokenOwner.selector, 1));
        census.updateDelegation(charlie, 0, ids, fromProofs, emptyProof);
        
        vm.stopPrank();
    }
    
    /// @notice Test collections array access
    function testCollectionsAccess() public {
        // Test accessing collections array
        (address token, DavinciDaoCensus.TokenStandard standard) = census.collections(0);
        assertEq(token, address(nft));
        assertEq(uint256(standard), uint256(DavinciDaoCensus.TokenStandard.ERC721));
    }
    
    /// @notice Test weightOf mapping access
    function testWeightOfAccess() public {
        vm.startPrank(alice);
        
        // Initially zero
        assertEq(census.weightOf(bob), 0);
        
        // After delegation
        uint256[] memory ids = new uint256[](1);
        ids[0] = 1;
        uint256[] memory emptyProof = new uint256[](0);
        
        census.delegate(bob, 0, ids, emptyProof);
        assertEq(census.weightOf(bob), 1);
        
        vm.stopPrank();
    }
    
    /// @notice Test tokenDelegate mapping access
    function testTokenDelegateAccess() public {
        vm.startPrank(alice);
        
        uint256[] memory ids = new uint256[](1);
        ids[0] = 1;
        uint256[] memory emptyProof = new uint256[](0);
        
        // Initially no delegate
        assertEq(census.tokenDelegate(keccak256(abi.encodePacked(uint256(0), uint256(1)))), address(0));
        
        // After delegation
        census.delegate(bob, 0, ids, emptyProof);
        assertEq(census.tokenDelegate(keccak256(abi.encodePacked(uint256(0), uint256(1)))), bob);
        
        vm.stopPrank();
    }
}
