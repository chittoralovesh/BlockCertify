import { Link, NavLink } from "react-router-dom";
import { useWallet } from "../web3/WalletContext";

const NavItem = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-2 rounded-lg text-sm font-medium transition ${
        isActive
          ? "bg-white/15 text-white"
          : "text-white/80 hover:text-white hover:bg-white/10"
      }`
    }
  >
    {children}
  </NavLink>
);

export default function Navbar() 
{
    const { account, connect, isWrongNetwork, chainId } = useWallet();

    const short = (a) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "");
  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white font-semibold">
          <span className="text-xl">🎓</span>
          <span>CertiChain Vault</span>
        </Link>

      <div className="flex items-center gap-2">
        <NavItem to="/issue">Issue</NavItem>
        <NavItem to="/verify">Verify</NavItem>
        <NavItem to="/certificates">Certificates</NavItem>

        <div className="w-px h-6 bg-white/10 mx-2" />

        {isWrongNetwork ? (
          <div className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-200 text-sm border border-amber-400/20">
              Wrong Network{chainId ? ` (Chain ${chainId})` : ""}
          </div>
        ) : account ? (
          <div className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-200 text-sm border border-emerald-400/20">
              Connected: {short(account)}
          </div>
        ) : (
          <button
            onClick={connect}
            className="px-4 py-2 rounded-xl bg-white text-slate-950 text-sm font-semibold hover:opacity-90"
          >
            Connect Wallet
          </button>
        )}
      </div>
      </div>
    </div>
  );
}