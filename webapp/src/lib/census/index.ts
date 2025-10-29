import { SubgraphClient, Account, CensusData, CensusRoot } from './graphql';
import {
  buildCensusTree,
  generateProof,
  verifyProof,
  getAccountFromTree,
  packLeaf,
  unpackLeaf,
  CensusTree,
} from './tree';

export {
  // GraphQL client
  SubgraphClient,
  buildCensusTree,
  generateProof,
  verifyProof,
  getAccountFromTree,
  packLeaf,
  unpackLeaf,
};

export type {
  // Types
  Account,
  CensusData,
  CensusTree,
  CensusRoot,
};

/**
 * Main class for census tree reconstruction
 */
export class CensusReconstructor {
  private client: SubgraphClient;

  constructor(subgraphEndpoint: string) {
    this.client = new SubgraphClient(subgraphEndpoint);
  }

  /**
   * Fetch all accounts and build the census tree
   */
  async buildTree(): Promise<CensusTree> {
    const data = await this.client.fetchAllAccounts();
    const tree = buildCensusTree(data.accounts);
    return tree;
  }

  /**
   * Get proof for a specific account
   */
  async getProof(address: string): Promise<{
    address: string;
    weight: bigint;
    proof: bigint[];
    root: bigint;
  } | null> {
    const tree = await this.buildTree();
    const accountInfo = getAccountFromTree(tree, address);

    if (!accountInfo) {
      return null;
    }

    const proof = generateProof(tree, address);

    if (!proof) {
      return null;
    }

    return {
      address: accountInfo.address,
      weight: accountInfo.weight,
      proof,
      root: tree.root,
    };
  }

  /**
   * Get account weight from subgraph
   */
  async getAccountWeight(address: string): Promise<bigint | null> {
    const account = await this.client.getAccount(address);
    return account ? BigInt(account.weight) : null;
  }

  /**
   * Get global statistics
   */
  async getGlobalStats() {
    return await this.client.fetchGlobalStats();
  }
}

/**
 * Convenience function to create a reconstructor instance
 */
export function createCensusReconstructor(subgraphEndpoint: string): CensusReconstructor {
  return new CensusReconstructor(subgraphEndpoint);
}
