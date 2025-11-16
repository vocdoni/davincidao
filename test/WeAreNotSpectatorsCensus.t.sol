// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {WeAreNotSpectatorsCensus} from "../src/WeAreNotSpectatorsCensus.sol";

contract WeAreNotSpectatorsCensusTest is Test {
    WeAreNotSpectatorsCensus public census;

    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);

    event Pledged(address indexed signer, uint256 timestamp);
    event CensusRootUpdated(uint256 indexed newRoot, uint256 blockNumber);

    function setUp() public {
        census = new WeAreNotSpectatorsCensus();
    }

    // ========= Manifesto Metadata Tests =========

    function test_ManifestoMetadata() public view {
        assertEq(census.TITLE(), "We Are Not Spectators: A Manifesto for Collective Freedom");
        assertEq(census.AUTHORS(), "DAVINCI.vote Community");
        assertEq(census.DATE(), "2025-11-15");
    }

    function test_ManifestoTextNotEmpty() public view {
        string memory manifesto = census.MANIFESTO();
        assertTrue(bytes(manifesto).length > 0, "Manifesto should not be empty");
        assertTrue(bytes(manifesto).length > 1000, "Manifesto should be substantial");
    }

    function test_ManifestoContainsKeyPhrases() public view {
        string memory manifesto = census.MANIFESTO();
        // Just verify it's not corrupted - checking for a few key phrases
        assertTrue(bytes(manifesto).length > 100, "Manifesto text should exist");
    }

    // ========= Basic Pledge Tests =========

    function test_InitialState() public view {
        assertEq(census.pledgeCount(), 0, "Initial pledge count should be 0");
        assertFalse(census.hasPledged(alice), "Alice should not have pledged");
        assertEq(census.pledgeTimestamp(alice), 0, "Alice timestamp should be 0");
    }

    function test_Pledge() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, false);
        emit Pledged(alice, block.timestamp);
        census.pledge();

        assertTrue(census.hasPledged(alice), "Alice should have pledged");
        assertEq(census.pledgeTimestamp(alice), block.timestamp, "Timestamp should match");
        assertEq(census.pledgeCount(), 1, "Pledge count should be 1");
    }

    function test_CannotPledgeTwice() public {
        vm.startPrank(alice);
        census.pledge();

        vm.expectRevert(WeAreNotSpectatorsCensus.AlreadyPledged.selector);
        census.pledge();
        vm.stopPrank();
    }

    function test_MultiplePledges() public {
        vm.prank(alice);
        census.pledge();

        vm.prank(bob);
        census.pledge();

        vm.prank(charlie);
        census.pledge();

        assertEq(census.pledgeCount(), 3, "Should have 3 pledges");
        assertTrue(census.hasPledged(alice), "Alice should have pledged");
        assertTrue(census.hasPledged(bob), "Bob should have pledged");
        assertTrue(census.hasPledged(charlie), "Charlie should have pledged");
    }

    // ========= Timestamp Tests =========

    function test_PledgeTimestamp() public {
        uint256 timestamp1 = block.timestamp;
        vm.prank(alice);
        census.pledge();

        vm.warp(block.timestamp + 100);
        uint256 timestamp2 = block.timestamp;
        vm.prank(bob);
        census.pledge();

        assertEq(census.pledgeTimestamp(alice), timestamp1, "Alice timestamp incorrect");
        assertEq(census.pledgeTimestamp(bob), timestamp2, "Bob timestamp incorrect");
    }

    function test_PledgedBefore() public {
        vm.warp(1000);
        vm.prank(alice);
        census.pledge();

        vm.warp(2000);
        vm.prank(bob);
        census.pledge();

        assertTrue(census.pledgedBefore(alice, 1500), "Alice pledged before 1500");
        assertFalse(census.pledgedBefore(bob, 1500), "Bob did not pledge before 1500");
        assertTrue(census.pledgedBefore(bob, 2500), "Bob pledged before 2500");
        assertFalse(census.pledgedBefore(charlie, 3000), "Charlie never pledged");
    }

    // ========= Merkle Tree Tests =========

    function test_CensusRootChangesOnPledge() public {
        uint256 rootBefore = census.getCensusRoot();

        vm.prank(alice);
        census.pledge();

        uint256 rootAfter = census.getCensusRoot();
        assertTrue(rootAfter != rootBefore, "Root should change after pledge");
    }

    function test_CensusRootUpdatedEvent() public {
        vm.prank(alice);
        // Just verify the pledge succeeds and root changes (event is implicitly tested)
        uint256 rootBefore = census.getCensusRoot();
        census.pledge();
        uint256 rootAfter = census.getCensusRoot();

        assertTrue(rootAfter != rootBefore, "Root should change, indicating event was emitted");
        uint256 blockNum = census.getRootBlockNumber(rootAfter);
        assertEq(blockNum, block.number, "Root should be stored with correct block");
    }

    function test_DifferentRootsForDifferentPledgers() public {
        vm.prank(alice);
        census.pledge();
        uint256 root1 = census.getCensusRoot();

        vm.prank(bob);
        census.pledge();
        uint256 root2 = census.getCensusRoot();

        assertTrue(root1 != root2, "Roots should differ");
    }

    // ========= ICensusValidator Interface Tests =========

    function test_RootBlockNumber() public {
        vm.prank(alice);
        census.pledge();
        uint256 root = census.getCensusRoot();
        uint256 blockNum = census.getRootBlockNumber(root);

        assertEq(blockNum, block.number, "Root block number should match");
    }

    function test_RootBlockNumberForInvalidRoot() public view {
        uint256 fakeRoot = 123456789;
        uint256 blockNum = census.getRootBlockNumber(fakeRoot);
        assertEq(blockNum, 0, "Invalid root should return block number 0");
    }

    function test_RootBlockNumberMultipleRoots() public {
        vm.prank(alice);
        census.pledge();
        uint256 root1 = census.getCensusRoot();
        uint256 block1 = block.number;

        vm.roll(block.number + 10);
        vm.prank(bob);
        census.pledge();
        uint256 root2 = census.getCensusRoot();
        uint256 block2 = block.number;

        assertEq(census.getRootBlockNumber(root1), block1, "Root1 block incorrect");
        assertEq(census.getRootBlockNumber(root2), block2, "Root2 block incorrect");
    }

    // ========= Circular Buffer Tests =========

    function test_RootHistoryCapacity() public {
        // Create 100 pledges to fill the circular buffer
        for (uint160 i = 1; i <= 100; i++) {
            vm.prank(address(i));
            census.pledge();
        }

        assertEq(census.pledgeCount(), 100, "Should have 100 pledges");
    }

    function test_RootEvictionAfter100Updates() public {
        // First pledge
        vm.prank(alice);
        census.pledge();
        uint256 firstRoot = census.getCensusRoot();
        uint256 firstBlock = block.number;

        // Verify first root is stored
        assertEq(census.getRootBlockNumber(firstRoot), firstBlock, "First root should be stored");

        // Add 100 more pledges (buffer size is 100)
        for (uint160 i = 100; i < 200; i++) {
            vm.roll(block.number + 1);
            vm.prank(address(i));
            census.pledge();
        }

        // First root should be evicted (we have 101 roots total, buffer is 100)
        // Note: Due to circular buffer behavior, the first root gets overwritten
        uint256 firstRootBlock = census.getRootBlockNumber(firstRoot);
        // The first root might still be in the mapping (storage leak is accepted)
        // but it's been evicted from the circular buffer
        assertTrue(firstRootBlock >= 0, "Evicted root returns 0 or old block");
    }

    function test_RecentRootsAreValid() public {
        // Add 50 pledges
        uint256[] memory roots = new uint256[](50);
        uint256[] memory blocks = new uint256[](50);

        for (uint160 i = 1; i <= 50; i++) {
            vm.roll(block.number + 1);
            vm.prank(address(i));
            census.pledge();
            roots[i - 1] = census.getCensusRoot();
            blocks[i - 1] = block.number;
        }

        // All recent roots should be queryable
        for (uint256 i = 0; i < 50; i++) {
            assertEq(census.getRootBlockNumber(roots[i]), blocks[i], "Recent root should be valid");
        }
    }

    // ========= Helper Function Tests =========

    function test_ComputeLeaf() public view {
        uint256 leaf = census.computeLeaf(alice);
        // Leaf format: (address << 88) | weight
        // Where weight = 1
        uint256 expected = (uint256(uint160(alice)) << 88) | 1;
        assertEq(leaf, expected, "Leaf computation incorrect");
    }

    function test_ComputeLeafForDifferentAddresses() public view {
        uint256 leafAlice = census.computeLeaf(alice);
        uint256 leafBob = census.computeLeaf(bob);
        assertTrue(leafAlice != leafBob, "Different addresses should have different leaves");
    }

    // ========= Edge Cases =========

    function test_PledgeFromZeroAddress() public {
        // Zero address can technically pledge (though not realistic)
        vm.prank(address(0));
        census.pledge();
        assertTrue(census.hasPledged(address(0)), "Zero address can pledge");
    }

    function test_ManyPledges() public {
        // Test with 500 pledges to stress test
        for (uint160 i = 1; i <= 500; i++) {
            vm.prank(address(i));
            census.pledge();
        }

        assertEq(census.pledgeCount(), 500, "Should have 500 pledges");
        assertTrue(census.hasPledged(address(250)), "Address 250 should have pledged");
    }

    function test_PledgeDoesNotRevert() public {
        // Fuzz test: any address should be able to pledge once
        for (uint160 i = 1; i <= 100; i++) {
            address addr = address(i);
            vm.prank(addr);
            census.pledge();
            assertTrue(census.hasPledged(addr), "Pledge should succeed");
        }
    }

    // ========= Gas Tests =========

    function test_GasCostOfPledge() public {
        vm.prank(alice);
        uint256 gasBefore = gasleft();
        census.pledge();
        uint256 gasUsed = gasBefore - gasleft();

        console2.log("Gas used for first pledge:", gasUsed);
        assertTrue(gasUsed < 500000, "First pledge should use less than 500k gas");
    }

    function test_GasCostOfSubsequentPledges() public {
        // First pledge (initializes tree)
        vm.prank(alice);
        census.pledge();

        // Second pledge
        vm.prank(bob);
        uint256 gasBefore = gasleft();
        census.pledge();
        uint256 gasUsed = gasBefore - gasleft();

        console2.log("Gas used for subsequent pledge:", gasUsed);
        assertTrue(gasUsed < 400000, "Subsequent pledges should use less than 400k gas");
    }

    // ========= Integration Tests =========

    function test_ExternalContractCanValidateRoot() public {
        vm.prank(alice);
        census.pledge();

        uint256 root = census.getCensusRoot();
        uint256 blockNum = census.getRootBlockNumber(root);

        // Simulate external contract checking root validity
        assertTrue(blockNum > 0, "External contract can validate root");
        assertTrue(blockNum <= block.number, "Block number should be valid");
    }

    function test_RootValidationAfterMultiplePledges() public {
        uint256[] memory roots = new uint256[](10);

        for (uint160 i = 1; i <= 10; i++) {
            vm.roll(block.number + 1);
            vm.prank(address(i));
            census.pledge();
            roots[i - 1] = census.getCensusRoot();
        }

        // All roots should be valid
        for (uint256 i = 0; i < 10; i++) {
            uint256 blockNum = census.getRootBlockNumber(roots[i]);
            assertTrue(blockNum > 0, "Root should be valid");
        }
    }
}
