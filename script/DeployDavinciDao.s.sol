// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {DavinciDaoCensus} from "../src/Davincidao.sol";

contract DeployDavinciDaoScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Configure ERC-721 collections
        // Replace with your actual NFT contract addresses
        address[] memory tokens = new address[](1);

        // Example collections (replace with real addresses)
        tokens[0] = 0x87249fCE8Dd57f6d9DB9Aaaa5FE3A70782230493; // Example ERC-721 collection

        // Deploy the DavinciDAO Census contract
        DavinciDaoCensus census = new DavinciDaoCensus(tokens);

        console.log("=== DavinciDAO Census Deployment ===");
        console.log("Contract deployed at:", address(census));
        console.log("Initial census root:", census.getCensusRoot());
        console.log("Number of collections:", tokens.length);

        // Log configured collections
        for (uint256 i = 0; i < tokens.length; i++) {
            console.log("");
            console.log("Collection", i, ":");
            console.log("  Token address:", tokens[i]);
            console.log("  Standard: ERC721");
        }

        console.log("=== Deployment Complete ===");

        vm.stopBroadcast();
    }
}
