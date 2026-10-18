export const REGISTRY_ADDRESS = '0x569F33bcd31Aec0eC4c5335A6393E87B3E65b7E5';
export const SEPOLIA_CHAIN_ID = 11155111n;
export const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io';
export const SEPOLIA_RPC_URLS = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc.sepolia.org',
  'https://1rpc.io/sepolia',
  'https://sepolia.drpc.org',
];
export const SEPOLIA_RPC_URL = SEPOLIA_RPC_URLS[0];

export function isSepoliaNetwork(chainId) {
  if (chainId === null || chainId === undefined || chainId === '') return false;
  try {
    return BigInt(chainId) === BigInt(SEPOLIA_CHAIN_ID);
  } catch {
    return false;
  }
}

