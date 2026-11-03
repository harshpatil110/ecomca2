/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import { SEPOLIA_CHAIN_ID, isSepoliaNetwork } from '../blockchain/registryConfig';

const MetaMaskContext = createContext({
  account: '',
  chainId: null,
  isConnecting: false,
  isSepolia: false,
  connectWallet: async () => {},
  switchNetwork: async () => {},
});

export function MetaMaskProvider({ children }) {
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const syncAccount = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_accounts', []);
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount('');
      }

      const net = await provider.getNetwork();
      setChainId(Number(net.chainId));
    } catch {
      // Ignore initial sync failure
    }
  }, []);

  useEffect(() => {
    syncAccount();

    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount('');
      }
    };

    const handleChainChanged = (hexChainId) => {
      setChainId(parseInt(hexChainId, 16));
    };

    window.ethereum.on?.('accountsChanged', handleAccountsChanged);
    window.ethereum.on?.('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [syncAccount]);

  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed.');
    }
    setIsConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
      }
      const net = await provider.getNetwork();
      setChainId(Number(net.chainId));
      return accounts[0];
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    const hexChain = `0x${Number(SEPOLIA_CHAIN_ID).toString(16)}`;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChain }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hexChain,
              chainName: 'Sepolia Test Network',
              rpcUrls: ['https://rpc.sepolia.org'],
              nativeCurrency: { name: 'Sepolia ETH', symbol: 'SEP', decimals: 18 },
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            },
          ],
        });
      }
    }
  }, []);

  const isSepolia = chainId ? isSepoliaNetwork(chainId) : false;

  return (
    <MetaMaskContext.Provider
      value={{
        account,
        chainId,
        isConnecting,
        isSepolia,
        connectWallet,
        switchNetwork,
      }}
    >
      {children}
    </MetaMaskContext.Provider>
  );
}

export function useMetaMask() {
  const context = useContext(MetaMaskContext);
  // Safe fallback if used outside Provider
  if (!context) {
    return {
      account: '',
      chainId: null,
      isConnecting: false,
      isSepolia: false,
      connectWallet: async () => {},
      switchNetwork: async () => {},
    };
  }
  return context;
}
