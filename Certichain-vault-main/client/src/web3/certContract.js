import Web3 from "web3";
import CertificateArtifact from "../Certificate.json";

export const CONTRACT_ADDRESS = "0xe982E462b094850F12AF94d21D470e21bE9D0E9C";

// Accept common local dev chain IDs
export const ALLOWED_CHAIN_IDS = [1337, 5777, 31337]; // Ganache/Hardhat common

export function getEthereum() {
  if (typeof window === "undefined") return null;
  return window.ethereum || null;
}

export async function connectWallet() {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("MetaMask (or wallet) not detected.");

  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  return accounts?.[0] || null;
}

export async function getChainId() {
  const ethereum = getEthereum();
  if (!ethereum) return null;

  const chainIdHex = await ethereum.request({ method: "eth_chainId" });
  return parseInt(chainIdHex, 16);
}

export function getWeb3() {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("Wallet not detected.");
  return new Web3(ethereum);
}

export function getCertificateContract(web3) {
  // ABI is inside CertificateArtifact.abi
  const abi = CertificateArtifact?.abi ?? CertificateArtifact;
  if (!abi) throw new Error("ABI not found in Certificate.json");

  return new web3.eth.Contract(abi, CONTRACT_ADDRESS);
}