import { Link } from "react-router-dom";
import { useWallet } from "../web3/WalletContext";

export default function Home() {
  const { account, isWrongNetwork } = useWallet();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 text-white">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-pink-500/10 p-10">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-black tracking-tight">CertiChain Vault</h1>
            <p className="mt-4 text-white/75 leading-relaxed">
              Issue tamper-resistant digital certificates anchored on blockchain and verify them instantly
              through a public verification link or QR code.
            </p>

            <div className="mt-6 flex gap-3 flex-wrap">
              <Link
                to="/issue"
                className="rounded-xl bg-white text-slate-950 px-5 py-3 font-semibold hover:opacity-90"
              >
                Issue Certificate
              </Link>
              <Link
                to="/verify"
                className="rounded-xl bg-slate-950 border border-white/10 px-5 py-3 font-semibold hover:border-white/25"
              >
                Verify Certificate
              </Link>
              <Link
                to="/certificates"
                className="rounded-xl bg-white/5 border border-white/10 px-5 py-3 font-semibold hover:border-white/25"
              >
                View Certificates
              </Link>
            </div>

            <div className="mt-6 text-sm text-white/60">
              {account ? (
                <>
                  Connected wallet:{" "}
                  <span className="font-mono text-white/80">{account}</span>
                  {isWrongNetwork ? (
                    <span className="ml-2 text-amber-300">
                      (Wrong network — switch to Ganache Local 1337)
                    </span>
                  ) : (
                    <span className="ml-2 text-emerald-300">(Ganache Local)</span>
                  )}
                </>
              ) : (
                <>Connect your wallet to issue certificates.</>
              )}
            </div>
          </div>

          <div className="w-full sm:w-[360px] rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="text-sm text-white/60 uppercase tracking-wider">
              Platform Highlights
            </div>

            <div className="mt-4 space-y-4">
              <Card
                title="Immutable Records"
                desc="Certificate metadata is anchored on-chain to prevent tampering."
              />
              <Card
                title="Instant Verification"
                desc="Verify by certificate ID, link, or QR scan."
              />
              <Card
                title="Secure Document Proof"
                desc="PDF stored on IPFS (Pinata) and hashed for integrity checks."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, desc }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm text-white/70">{desc}</div>
    </div>
  );
}