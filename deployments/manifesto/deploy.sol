// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import "../../src/WeAreNotSpectatorsCensus.sol";

/// @title Deploy We Are Not Spectators Manifesto Census
/// @notice Deployment script for WeAreNotSpectatorsManifestoCensus contract
/// @dev Run with: forge script deployments/manifesto/deploy.sol --rpc-url $RPC_URL --broadcast --verify
contract DeployManifestoCensus is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console2.log("\n=== Deploying #WeAreNotSpectators Manifesto Census ===\n");
        console2.log("Deployer:", vm.addr(deployerPrivateKey));
        console2.log("Chain ID:", block.chainid);
        console2.log("Block number:", block.number);
        console2.log("\n");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contract (no constructor arguments needed)
        WeAreNotSpectatorsCensus census = new WeAreNotSpectatorsCensus();

        vm.stopBroadcast();

        console2.log("\n=== Deployment Successful ===\n");
        console2.log("Contract address:", address(census));
        console2.log("\nNext steps:");
        console2.log("1. Update subgraph/subgraph.yaml:");
        console2.log("   - address:", address(census));
        console2.log("   - startBlock:", block.number);
        console2.log("\n2. Deploy subgraph:");
        console2.log("   cd subgraph && npx graph codegen && npx graph build");
        console2.log("   npx graph deploy --studio we-are-not-spectators-manifesto");
        console2.log("\n3. Update webapp/.env:");
        console2.log("   VITE_CONTRACT_ADDRESS=", address(census));
        console2.log("\n");
    }
}
