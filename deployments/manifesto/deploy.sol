// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {SelfUtils} from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";
import {AttestationId} from "@selfxyz/contracts/contracts/constants/AttestationId.sol";
import "../../src/ManifestoCensus.sol";

/// @title Deploy Manifesto Census
/// @notice Deployment script that wires the census contract to Self's IdentityVerificationHub V2
contract DeployManifestoCensus is Script {
    address internal constant CELO_MAINNET_HUB_V2 = 0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF;

    struct DeploymentSettings {
        address hubAddress;
        string scopeSeed;
        uint256 minAge;
        bool ofacEnabled;
        string forbiddenCsv;
        string requiredNationality;
        bool allowPassport;
        bool allowNationalId;
        bool allowAadhaar;
        string manifestoPath;
        string manifestoTitle;
        string manifestoAuthors;
        string manifestoDate;
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        DeploymentSettings memory settings = _loadSettings();

        bytes32[] memory attestationAllowList = _buildAttestationAllowList(
            settings.allowPassport,
            settings.allowNationalId,
            settings.allowAadhaar
        );

        SelfUtils.UnformattedVerificationConfigV2 memory unformatted;
        unformatted.olderThan = settings.minAge;
        unformatted.ofacEnabled = settings.ofacEnabled;
        unformatted.forbiddenCountries = _parseForbiddenCountries(settings.forbiddenCsv);
        string memory manifestoText = vm.readFile(settings.manifestoPath);

        console2.log("\n=== Deploying Manifesto Census ===\n");
        console2.log("Deployer:          ", vm.addr(deployerPrivateKey));
        console2.log("Chain ID:          ", block.chainid);
        console2.log("Hub address:       ", settings.hubAddress);
        console2.log("Scope seed:        ", settings.scopeSeed);
        console2.log("Minimum age:       ", settings.minAge);
        console2.log("OFAC enabled:      ", settings.ofacEnabled);
        console2.log("Required nationality (ISO3 blank=any):", settings.requiredNationality);
        console2.log("Attestation types:", attestationAllowList.length);
        console2.log("Manifesto title:   ", settings.manifestoTitle);
        console2.log("Manifesto file:    ", settings.manifestoPath);
        console2.log("\n");

        vm.startBroadcast(deployerPrivateKey);

        ManifestoCensus.ManifestoMetadata memory metadata;
        metadata.title = settings.manifestoTitle;
        metadata.authors = settings.manifestoAuthors;
        metadata.date = settings.manifestoDate;
        metadata.manifestoText = manifestoText;

        ManifestoCensus census = new ManifestoCensus(
            settings.hubAddress,
            settings.scopeSeed,
            unformatted,
            attestationAllowList,
            settings.requiredNationality,
            metadata
        );

        vm.stopBroadcast();

        console2.log("\n=== Deployment Successful ===\n");
        console2.log("Contract address:", address(census));
        console2.log("Verification Config ID (bytes32):");
        console2.logBytes32(census.verificationConfigId());
        console2.log("Scope:", census.scope());
        console2.log("Start block:", block.number);
        console2.log("\nNext steps:");
        console2.log("1. Update subgraph/subgraph.yaml with the address & startBlock above.");
        console2.log("2. Redeploy the subgraph.");
        console2.log("3. Update webapp/.env -> VITE_CONTRACT_ADDRESS=", address(census));
        console2.log("\n");
    }

    function _loadSettings() internal returns (DeploymentSettings memory settings) {
        settings.hubAddress = vm.envOr("SELF_HUB_V2", CELO_MAINNET_HUB_V2);
        settings.scopeSeed = vm.envOr("SELF_SCOPE_SEED", string("manifesto-clean-streets"));
        settings.minAge = vm.envOr("SELF_MIN_AGE", uint256(16));
        settings.ofacEnabled = vm.envOr("SELF_OFAC_ENABLED", false);
        settings.forbiddenCsv = vm.envOr("SELF_FORBIDDEN_COUNTRIES", string(""));
        settings.requiredNationality = vm.envOr("SELF_REQUIRED_NATIONALITY", string(""));
        settings.allowPassport = vm.envOr("SELF_ALLOW_PASSPORT", true);
        bool legacyNationalIdDefault = vm.envOr("SELF_ALLOW_EU_ID", true);
        settings.allowNationalId = vm.envOr("SELF_ALLOW_NATIONAL_ID", legacyNationalIdDefault);
        settings.allowAadhaar = vm.envOr("SELF_ALLOW_AADHAAR", false);
        settings.manifestoPath = vm.envOr("MANIFESTO_FILE", string("manifests/collective-freedom.md"));
        settings.manifestoTitle = vm.envOr(
            "MANIFESTO_TITLE",
            string("Collective Freedom: A Manifesto for Participation")
        );
        settings.manifestoAuthors = vm.envOr("MANIFESTO_AUTHORS", string("DAVINCI.vote Community"));
        settings.manifestoDate = vm.envOr("MANIFESTO_DATE", string("2025-11-16"));
        return settings;
    }

    function _buildAttestationAllowList(
        bool allowPassport,
        bool allowNationalId,
        bool allowAadhaar
    ) internal pure returns (bytes32[] memory list) {
        uint256 count;
        if (allowPassport) count++;
        if (allowNationalId) count++;
        if (allowAadhaar) count++;
        require(count > 0, "No attestation types enabled");

        list = new bytes32[](count);
        uint256 idx;
        if (allowPassport) {
            list[idx++] = AttestationId.E_PASSPORT;
        }
        if (allowNationalId) {
            list[idx++] = AttestationId.EU_ID_CARD;
        }
        if (allowAadhaar) {
            list[idx++] = AttestationId.AADHAAR;
        }
    }

    function _parseForbiddenCountries(
        string memory csv
    ) internal pure returns (string[] memory parsed) {
        bytes memory data = bytes(csv);
        if (data.length == 0) {
            return new string[](0);
        }

        uint256 count = 1;
        for (uint256 i = 0; i < data.length; i++) {
            if (data[i] == ",") {
                count++;
            }
        }

        parsed = new string[](count);
        bytes memory buffer = new bytes(data.length);
        uint256 bufLen;
        uint256 idx;
        for (uint256 i = 0; i < data.length; i++) {
            bytes1 char = data[i];
            if (char == ",") {
                parsed[idx++] = _bytesToString(buffer, bufLen);
                bufLen = 0;
            } else if (char != " " && char != "\t") {
                buffer[bufLen++] = char;
            }
        }
        parsed[idx] = _bytesToString(buffer, bufLen);
    }

    function _bytesToString(bytes memory buffer, uint256 length) private pure returns (string memory) {
        bytes memory trimmed = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            trimmed[i] = buffer[i];
        }
        return string(trimmed);
    }
}
