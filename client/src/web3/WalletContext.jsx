// src/web3/WalletContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ALLOWED_CHAIN_IDS,
  getEthereum,
  connectWallet,
  getChainId,
  getWeb3,
  getCertificateContract,
} from "./certContract";

export const WalletContext = createContext(null);

// ✅ Hook used by Navbar/Home/Issue/etc.
export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used inside <WalletProvider />");
  }
  return ctx;
}

// ✅ Named export WalletProvider (your index.js expects this)
export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const web3 = useMemo(() => {
    try {
      // Only create web3 if wallet exists
      const eth = getEthereum();
      if (!eth) return null;
      return getWeb3();
    } catch {
      return null;
    }
  }, [account, chainId]);

  const contract = useMemo(() => {
    if (!web3) return null;
    try {
      return getCertificateContract(web3);
    } catch {
      return null;
    }
  }, [web3]);

  async function refreshChainId() {
    const cid = await getChainId();
    setChainId(cid);
    return cid;
  }

  async function connect() {
    try {
      setIsConnecting(true);
      setError("");

      const acc = await connectWallet();
      setAccount(acc);

      const cid = await refreshChainId();
      if (cid && !ALLOWED_CHAIN_IDS.includes(cid)) {
        setError(
          `Wrong network (chainId=${cid}). Switch to Ganache/Hardhat Localhost. Allowed: ${ALLOWED_CHAIN_IDS.join(
            ", "
          )}`
        );
      }
    } catch (e) {
      setError(e?.message || "Wallet connection failed.");
    } finally {
      setIsConnecting(false);
    }
  }

  useEffect(() => {
    const eth = getEthereum();
    if (!eth) return;

    // On load: read already connected accounts
    (async () => {
      try {
        const accounts = await eth.request({ method: "eth_accounts" });
        if (accounts?.length) setAccount(accounts[0]);
        await refreshChainId();
      } catch {
        // ignore
      }
    })();

    const onAccountsChanged = (accounts) => {
      setAccount(accounts?.[0] || null);
    };

    const onChainChanged = () => {
      // safer to reload to avoid stale web3 state
      window.location.reload();
    };

    eth.on("accountsChanged", onAccountsChanged);
    eth.on("chainChanged", onChainChanged);

    return () => {
      eth.removeListener("accountsChanged", onAccountsChanged);
      eth.removeListener("chainChanged", onChainChanged);
    };
  }, []);

  const value = {
    account,
    chainId,
    error,
    isConnecting,
    isWalletInstalled: !!getEthereum(),
    web3,
    contract,
    connect,
    allowedChains: ALLOWED_CHAIN_IDS,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

// ✅ Keep default export too, so both styles work:
export default WalletProvider;