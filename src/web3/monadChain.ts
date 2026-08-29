export interface ChainConfig {
  id: number;
  hexId: string;
  name: string;
  network: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: { http: string[] };
    public: { http: string[] };
  };
  blockExplorers: {
    default: { name: string; url: string };
  };
}

export const MONAD_TESTNET: ChainConfig = {
  id: 10143,
  hexId: '0x279f',
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        import.meta.env.VITE_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz',
      ],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'MonadExplorer',
      url: import.meta.env.VITE_MONAD_EXPLORER || 'https://testnet.monadexplorer.com',
    },
  },
};
