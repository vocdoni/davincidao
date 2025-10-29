// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {DavinciDao} from "../src/DavinciDao.sol";

/// @notice Deployment script for DavinciDAO census contract
/// @dev Usage:
///      forge script script/DeployDavinciDao.s.sol:DeployDavinciDao \
///        --rpc-url <RPC_URL> \
///        --private-key <PRIVATE_KEY> \
///        --broadcast \
///        --verify
contract DeployDavinciDao is Script {
    function run() external {
        // Read NFT collection addresses from environment or use defaults
        address[] memory collections = new address[](1);

        // Default: Use existing test NFT collection
        collections[0] = vm.envOr(
            "COLLECTION_ADDRESS",
            address(0x7c61Ae9629664D1CEEc8Abc0fD17CB0866d86d89)
        );

        console2.log("===========================================================");
        console2.log("          DavinciDAO Census Deployment Script");
        console2.log("===========================================================\n");

        console2.log("Configuration:");
        console2.log("  NFT Collections: %d", collections.length);
        for (uint256 i = 0; i < collections.length; i++) {
            console2.log("    [%d] %s", i, collections[i]);
        }

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console2.log("\n  Deployer: %s", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contract
        console2.log("\nDeploying DavinciDao...");
        DavinciDao census = new DavinciDao(collections);
        console2.log("  Contract deployed at: %s", address(census));

        // Verify configuration
        console2.log("\nVerifying deployment...");
        uint256 numCollections = 0;
        while (true) {
            try census.collections(numCollections) returns (address token) {
                console2.log("  Collection[%d]: %s", numCollections, token);
                numCollections++;
            } catch {
                break;
            }
        }

        // Check initial state
        uint256 currentRoot = census.getCensusRoot();
        console2.log("\n  Initial census root: %d", currentRoot);
        console2.log("  (Root auto-updates with on-chain Merkle tree construction)");

        vm.stopBroadcast();

        console2.log("\n===========================================================");
        console2.log("                  Deployment Complete!");
        console2.log("===========================================================\n");

        console2.log("Next steps:");
        console2.log("1. Update webapp .env with new contract address:");
        console2.log("   VITE_CONTRACT_ADDRESS=%s", address(census));
        console2.log("\n2. (Optional) Configure subgraph for historical root indexing:");
        console2.log("   - Update subgraph.yaml with new contract address");
        console2.log("   - Deploy to The Graph");
        console2.log("\nNote: The Merkle tree builds ON-CHAIN automatically!");
        console2.log("===========================================================\n");
    }
}
