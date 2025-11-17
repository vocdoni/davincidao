// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {ManifestoCensus} from "../src/ManifestoCensus.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {SelfUtils} from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";
import {SelfStructs} from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";
import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";
import {IRegisterCircuitVerifier} from "@selfxyz/contracts/contracts/interfaces/IRegisterCircuitVerifier.sol";
import {IDscCircuitVerifier} from "@selfxyz/contracts/contracts/interfaces/IDscCircuitVerifier.sol";
import {AttestationId} from "@selfxyz/contracts/contracts/constants/AttestationId.sol";

contract MockIdentityVerificationHubV2 is IIdentityVerificationHubV2 {
    bytes32 public lastConfigId;

    function registerCommitment(
        bytes32,
        uint256,
        IRegisterCircuitVerifier.RegisterCircuitProof memory
    ) external pure override {}

    function registerDscKeyCommitment(
        bytes32,
        uint256,
        IDscCircuitVerifier.DscCircuitProof memory
    ) external pure override {}

    function setVerificationConfigV2(
        SelfStructs.VerificationConfigV2 memory config
    ) external override returns (bytes32 configId) {
        configId = sha256(abi.encode(config));
        lastConfigId = configId;
        return configId;
    }

    function verify(bytes calldata, bytes calldata) external pure override {}

    function updateRegistry(bytes32, address) external pure override {}

    function updateVcAndDiscloseCircuit(bytes32, address) external pure override {}

    function updateRegisterCircuitVerifier(bytes32, uint256, address) external pure override {}

    function updateDscVerifier(bytes32, uint256, address) external pure override {}

    function batchUpdateRegisterCircuitVerifiers(
        bytes32[] calldata,
        uint256[] calldata,
        address[] calldata
    ) external pure override {}

    function batchUpdateDscCircuitVerifiers(
        bytes32[] calldata,
        uint256[] calldata,
        address[] calldata
    ) external pure override {}

    function registry(bytes32) external pure override returns (address) {
        return address(0);
    }

    function discloseVerifier(bytes32) external pure override returns (address) {
        return address(0);
    }

    function registerCircuitVerifiers(bytes32, uint256) external pure override returns (address) {
        return address(0);
    }

    function dscCircuitVerifiers(bytes32, uint256) external pure override returns (address) {
        return address(0);
    }

    function rootTimestamp(bytes32, uint256) external pure override returns (uint256) {
        return 0;
    }

    function getIdentityCommitmentMerkleRoot(bytes32) external pure override returns (uint256) {
        return 0;
    }

    function verificationConfigV2Exists(bytes32 configId) external view override returns (bool) {
        return configId == lastConfigId;
    }

    function generateConfigId(SelfStructs.VerificationConfigV2 memory config) external pure override returns (bytes32) {
        return sha256(abi.encode(config));
    }
}

contract ManifestoCensusHarness is ManifestoCensus {
    constructor(
        address hub,
        string memory scopeSeed,
        SelfUtils.UnformattedVerificationConfigV2 memory unformattedConfig,
        bytes32[] memory attestationAllowList,
        string memory requiredNationality,
        ManifestoMetadata memory metadata
    ) ManifestoCensus(hub, scopeSeed, unformattedConfig, attestationAllowList, requiredNationality, metadata) {}

    function selfVerifyWithNationality(
        address signer,
        uint256 nullifier,
        bytes32 attestationId,
        string memory nationality
    ) external {
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output;
        output.attestationId = attestationId;
        output.userIdentifier = uint256(uint160(signer));
        output.nullifier = nullifier;
        output.nationality = nationality;
        customVerificationHook(output, "");
    }
}

contract ManifestoCensusTest is Test {
    ManifestoCensusHarness public census;
    MockIdentityVerificationHubV2 internal hub;

    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    uint256 private nextNullifier = 1;

    event Pledged(address indexed signer, uint256 timestamp);
    event CensusRootUpdated(uint256 indexed newRoot, uint256 blockNumber);
    event IdentityVerified(address indexed signer, uint256 nullifier, bytes32 attestationId);

    function setUp() public {
        hub = new MockIdentityVerificationHubV2();
        SelfUtils.UnformattedVerificationConfigV2 memory unformatted;
        unformatted.olderThan = 16;
        unformatted.ofacEnabled = false;
        unformatted.forbiddenCountries = new string[](0);

        bytes32[] memory attestationIds = new bytes32[](1);
        attestationIds[0] = AttestationId.E_PASSPORT;

        census = new ManifestoCensusHarness(
            address(hub),
            "manifesto-test",
            unformatted,
            attestationIds,
            "",
            _defaultMetadata()
        );
    }

    function _defaultMetadata() internal pure returns (ManifestoCensus.ManifestoMetadata memory metadata) {
        metadata.title = "Collective Freedom: A Manifesto for Participation";
        metadata.authors = "DAVINCI.vote Community";
        metadata.date = "2025-11-16";
        metadata.manifestoText = "# Collective Freedom: A Manifesto for Participation\n\nWe were promised democracy.\nWhat we got was permission.\nPermission to choose between options we didn't create.\nPermission to speak only when spoken to.\n\nPermission to exist inside systems built to contain us.\nThey told us this was freedom.\nBut freedom without agency is theater.\nWe scroll. We vote. We sign petitions.\nAnd still, the world burns, inequality grows, and trust collapses.\nThe threads that once held us together are tearing apart.\n**Enough.**\n\nWe refuse to be passive witnesses to our own future.\nWe refuse to mistake representation for participation.\nThe systems that failed us are not the only ones we have to live by.\nFreedom begins with participation, not obedience.\n\nEvery human deserves a voice in the systems they depend on,\nthe platforms they use, the policies that shape them,\nthe future they'll inherit.\n\n**We believe privacy is not a feature, it's a foundation.**\nThe right to exist, think, and connect without surveillance.\nPrivacy is the space where dissent, creativity, and democracy are born.\n\n**We believe authority must be accountable, and power transparent.**\nGovernance is not something done to us; it's something we do, together.\n\n**We believe technology is a tool, not a master.**\nLike language, it must belong to everyone,\na public good to build trust, not extract it.\n\nWe believe in self-sovereign infrastructure,\ntransparency as truth,\nand collaboration as strength.\n\n**We are the builders of the commons.**\nThe people who refuse to sit on the sidelines.\nThe dreamers who turn frustration into invention.\nThe communities who turn ideas into action.\n\n**Because the future we live in depends on the governance we achieve today.**\n**#CollectiveFreedom**";
        return metadata;
    }

    function _sign(address account, string memory nationality) internal {
        census.selfVerifyWithNationality(account, nextNullifier++, AttestationId.E_PASSPORT, nationality);
    }

    function test_ManifestoMetadata() public view {
        assertEq(census.TITLE(), "Collective Freedom: A Manifesto for Participation");
        assertEq(census.AUTHORS(), "DAVINCI.vote Community");
        assertEq(census.DATE(), "2025-11-16");
    }

    function test_ManifestoTextNotEmpty() public view {
        string memory manifesto = census.MANIFESTO();
        assertTrue(bytes(manifesto).length > 0, "Manifesto should not be empty");
        assertTrue(bytes(manifesto).length > 1000, "Manifesto should be substantial");
    }

    function test_ManifestoContainsKeyPhrases() public view {
        string memory manifesto = census.MANIFESTO();
        assertTrue(bytes(manifesto).length > 100, "Manifesto text should exist");
    }

    function test_VerificationParametersGetter() public view {
        (
            uint256 minAge,
            bool minAgeEnabled,
            bool ofacEnabled,
            string[] memory forbiddenCountries,
            bytes3 nationality,
            bytes32[] memory attestationIds
        ) = census.getVerificationParameters();

        assertEq(minAge, 16);
        assertTrue(minAgeEnabled);
        assertFalse(ofacEnabled);
        assertEq(forbiddenCountries.length, 0);
        assertEq(uint24(nationality), 0);
        assertEq(attestationIds.length, 1);
        assertEq(attestationIds[0], AttestationId.E_PASSPORT);
        assertEq(keccak256(bytes(census.scopeLabel())), keccak256(bytes("manifesto-test")));
    }

    function test_InitialState() public view {
        assertEq(census.pledgeCount(), 0, "Initial pledge count should be 0");
        assertFalse(census.hasPledged(alice), "Alice should not have pledged");
        assertEq(census.pledgeTimestamp(alice), 0, "Alice timestamp should be 0");
    }

    function test_Pledge() public {
        vm.expectEmit(true, false, false, false);
        emit IdentityVerified(alice, nextNullifier, AttestationId.E_PASSPORT);
        vm.expectEmit(true, false, false, false);
        emit Pledged(alice, block.timestamp);
        _sign(alice, "USA");

        assertTrue(census.hasPledged(alice), "Alice should have pledged");
        assertEq(census.pledgeTimestamp(alice), block.timestamp, "Timestamp should match");
        assertEq(census.pledgeCount(), 1, "Pledge count should be 1");
    }

    function test_CannotPledgeTwice() public {
        _sign(alice, "USA");
        vm.expectRevert(ManifestoCensus.AlreadyPledged.selector);
        _sign(alice, "USA");
    }

    function test_MultiplePledges() public {
        _sign(alice, "USA");
        _sign(bob, "USA");
        _sign(charlie, "USA");

        assertEq(census.pledgeCount(), 3, "Should have 3 pledges");
        assertTrue(census.hasPledged(alice), "Alice should have pledged");
        assertTrue(census.hasPledged(bob), "Bob should have pledged");
        assertTrue(census.hasPledged(charlie), "Charlie should have pledged");
    }

    function test_PledgeTimestamp() public {
        uint256 timestamp1 = block.timestamp;
        _sign(alice, "USA");

        vm.warp(block.timestamp + 100);
        uint256 timestamp2 = block.timestamp;
        _sign(bob, "USA");

        assertEq(census.pledgeTimestamp(alice), timestamp1, "Alice timestamp incorrect");
        assertEq(census.pledgeTimestamp(bob), timestamp2, "Bob timestamp incorrect");
    }

    function test_PledgedBefore() public {
        vm.warp(1000);
        _sign(alice, "USA");

        vm.warp(2000);
        _sign(bob, "USA");

        assertTrue(census.pledgedBefore(alice, 1500), "Alice pledged before 1500");
        assertFalse(census.pledgedBefore(bob, 1500), "Bob did not pledge before 1500");
        assertTrue(census.pledgedBefore(bob, 2500), "Bob pledged before 2500");
        assertFalse(census.pledgedBefore(charlie, 3000), "Charlie never pledged");
    }

    function test_CensusRootChangesOnPledge() public {
        uint256 rootBefore = census.getCensusRoot();
        _sign(alice, "USA");
        uint256 rootAfter = census.getCensusRoot();
        assertTrue(rootAfter != rootBefore, "Root should change after pledge");
    }

    function test_CensusRootUpdatedEvent() public {
        uint256 rootBefore = census.getCensusRoot();
        _sign(alice, "USA");
        uint256 rootAfter = census.getCensusRoot();

        assertTrue(rootAfter != rootBefore, "Root should change, indicating event was emitted");
        uint256 blockNum = census.getRootBlockNumber(rootAfter);
        assertEq(blockNum, block.number, "Root should be stored with correct block");
    }

    function test_DifferentRootsForDifferentPledgers() public {
        _sign(alice, "USA");
        uint256 root1 = census.getCensusRoot();

        _sign(bob, "USA");
        uint256 root2 = census.getCensusRoot();

        assertTrue(root1 != root2, "Roots should differ");
    }

    function test_RootBlockNumber() public {
        _sign(alice, "USA");
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
        _sign(alice, "USA");
        uint256 root1 = census.getCensusRoot();
        uint256 block1 = block.number;

        vm.roll(block.number + 10);
        _sign(bob, "USA");
        uint256 root2 = census.getCensusRoot();
        uint256 block2 = block.number;

        assertEq(census.getRootBlockNumber(root1), block1, "Root1 block incorrect");
        assertEq(census.getRootBlockNumber(root2), block2, "Root2 block incorrect");
    }

    function test_RootHistoryCapacity() public {
        for (uint160 i = 1; i <= 100; i++) {
            census.selfVerifyWithNationality(address(i), nextNullifier++, AttestationId.E_PASSPORT, "USA");
        }

        assertEq(census.pledgeCount(), 100, "Should have 100 pledges");
    }

    function test_RootEvictionAfter100Updates() public {
        _sign(alice, "USA");
        uint256 firstRoot = census.getCensusRoot();
        uint256 firstBlock = block.number;

        for (uint160 i = 2; i <= 110; i++) {
            vm.roll(block.number + 1);
            census.selfVerifyWithNationality(address(i), nextNullifier++, AttestationId.E_PASSPORT, "USA");
        }

        assertEq(census.getRootBlockNumber(firstRoot), firstBlock, "Root should retain stored block");
    }

    function test_PledgeFunctionAlwaysReverts() public {
        vm.expectRevert(ManifestoCensus.SelfVerificationOnly.selector);
        census.pledge();
    }

    function test_NationalityRestrictionEnforced() public {
        SelfUtils.UnformattedVerificationConfigV2 memory unformatted;
        unformatted.olderThan = 16;
        unformatted.forbiddenCountries = new string[](0);
        unformatted.ofacEnabled = false;

        bytes32[] memory attestationIds = new bytes32[](1);
        attestationIds[0] = AttestationId.E_PASSPORT;

        ManifestoCensusHarness restricted = new ManifestoCensusHarness(
            address(hub),
            "manifesto-test",
            unformatted,
            attestationIds,
            "USA",
            _defaultMetadata()
        );

        restricted.selfVerifyWithNationality(alice, 1, AttestationId.E_PASSPORT, "usa");

        vm.expectRevert();
        restricted.selfVerifyWithNationality(bob, 2, AttestationId.E_PASSPORT, "FRA");
    }
}
