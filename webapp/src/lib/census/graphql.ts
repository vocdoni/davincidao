import { GraphQLClient, gql } from 'graphql-request';

export interface Account {
  id: string;
  address: string;
  weight: string;
  lastUpdatedAt: string;
  lastUpdatedBlock: string;
  firstInsertedBlock: string;
  firstInsertedAt: string;
  treeIndex: string;
}

export interface CensusData {
  accounts: Account[];
  totalWeight: bigint;
}

const ACCOUNTS_QUERY = gql`
  query GetAccounts($first: Int!, $skip: Int!) {
    accounts(
      first: $first
      skip: $skip
      orderBy: treeIndex
      orderDirection: asc
      where: { weight_gt: "0" }
    ) {
      id
      address
      weight
      lastUpdatedAt
      lastUpdatedBlock
      firstInsertedBlock
      firstInsertedAt
      treeIndex
    }
  }
`;

const GLOBAL_STATS_QUERY = gql`
  query GetGlobalStats {
    globalStats(id: "global") {
      totalDelegations
      totalAccounts
      totalWeight
      lastUpdatedAt
    }
  }
`;

const CENSUS_ROOTS_QUERY = gql`
  query GetCensusRoots($first: Int!) {
    censusRoots(
      first: $first
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      root
      updater
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

export interface CensusRoot {
  id: string;
  root: string;
  updater: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export class SubgraphClient {
  private client: GraphQLClient;

  constructor(endpoint: string) {
    this.client = new GraphQLClient(endpoint);
  }

  /**
   * Fetch all accounts with weight > 0 from the subgraph
   * Uses pagination to handle large datasets
   */
  async fetchAllAccounts(): Promise<CensusData> {
    const allAccounts: Account[] = [];
    let skip = 0;
    const pageSize = 100;

    while (true) {
      const response = await this.client.request<{ accounts: Account[] }>(
        ACCOUNTS_QUERY,
        { first: pageSize, skip }
      );

      if (response.accounts.length === 0) {
        break;
      }

      allAccounts.push(...response.accounts);
      skip += pageSize;

      if (response.accounts.length < pageSize) {
        break;
      }
    }

    // Calculate total weight
    const totalWeight = allAccounts.reduce(
      (sum, account) => sum + BigInt(account.weight),
      0n
    );

    return {
      accounts: allAccounts,
      totalWeight,
    };
  }

  /**
   * Fetch global statistics
   */
  async fetchGlobalStats() {
    const response = await this.client.request<{
      globalStats: {
        totalDelegations: string;
        totalAccounts: string;
        totalWeight: string;
        lastUpdatedAt: string;
      } | null;
    }>(GLOBAL_STATS_QUERY);

    return response.globalStats;
  }

  /**
   * Get a specific account by address
   */
  async getAccount(address: string): Promise<Account | null> {
    const query = gql`
      query GetAccount($id: ID!) {
        account(id: $id) {
          id
          address
          weight
          lastUpdatedAt
          lastUpdatedBlock
          firstInsertedBlock
          firstInsertedAt
          treeIndex
        }
      }
    `;

    const response = await this.client.request<{ account: Account | null }>(
      query,
      { id: address.toLowerCase() }
    );

    return response.account;
  }

  /**
   * Fetch census root history (up to 64 most recent)
   */
  async fetchCensusRoots(limit: number = 64): Promise<CensusRoot[]> {
    const response = await this.client.request<{
      censusRoots: CensusRoot[];
    }>(CENSUS_ROOTS_QUERY, { first: limit });

    return response.censusRoots;
  }
}
