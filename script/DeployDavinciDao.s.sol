// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {DavinciDaoCensus} from "../src/Davincidao.sol";

contract DeployDavinciDaoScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Example NFT collections - replace with your actual NFT contract addresses
        address[] memory nftContracts = new address[](3);
        DavinciDaoCensus.TokenStandard[] memory standards = new DavinciDaoCensus.TokenStandard[](3);
        
        // Example ERC-721 collections
        nftContracts[0] = 0x1234567890123456789012345678901234567890; // Replace with actual ERC-721 address
        standards[0] = DavinciDaoCensus.TokenStandard.ERC721;
        
        nftContracts[1] = 0x2345678901234567890123456789012345678901; // Replace with actual ERC-721 address
        standards[1] = DavinciDaoCensus.TokenStandard.ERC721;
        
        // Example ERC-1155 collection
        nftContracts[2] = 0x3456789012345678901234567890123456789012; // Replace with actual ERC-1155 address
        standards[2] = DavinciDaoCensus.TokenStandard.ERC1155;

        // Deploy the DavinciDAO Census contract
        DavinciDaoCensus census = new DavinciDaoCensus(nftContracts, standards);

        console.log("DavinciDAO Census deployed at:", address(census));
        console.log("Census root:", census.getCensusRoot());
        
        // Log the configured collections
        for (uint256 i = 0; i < nftContracts.length; i++) {
            (address token, DavinciDaoCensus.TokenStandard standard) = census.collections(i);
            console.log("Collection", i, "- Token:", token, "Standard:", uint8(standard));
        }

        vm.stopBroadcast();
    }
}
