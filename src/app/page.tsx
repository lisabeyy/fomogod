"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { WalletConnect } from "./components/WalletConnect";
import { useWalletClient } from "wagmi";
import { delegateToFomogod, undelegateFromFomogod, getUserStakeAmount, cancelUndelegate } from "@/lib/staking";
import { ethers } from "ethers";
import { FaTelegram, FaTwitter, FaChartLine, FaServer } from 'react-icons/fa';

const FOMOGOD_VALIDATOR = "0xa6488E0Dd259c48e0d6c0380fF5b08f6ae02a641";

interface UndelegationStatus {
  hasUndelegation: boolean;
  unlockBlock: number;
  estimatedUnlockTime: Date | null;
  canConfirm: boolean;
  amount?: string;
  currentBlock?: number;
  blocksRemaining?: number;
}

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showUndelegateModal, setShowUndelegateModal] = useState(false);
  const [showCancelUndelegateModal, setShowCancelUndelegateModal] = useState(false);
  const [showConfirmUndelegateModal, setShowConfirmUndelegateModal] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isDelegating, setIsDelegating] = useState(false);
  const [isUndelegating, setIsUndelegating] = useState(false);
  const [amount, setAmount] = useState("10000");
  const [delegatedAmount, setDelegatedAmount] = useState("0");
  const [isLoadingStake, setIsLoadingStake] = useState(false);
  const [stakeError, setStakeError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { data: walletClient } = useWalletClient();
  const [undelegationStatus, setUndelegationStatus] = useState<UndelegationStatus | null>(null);
  const [isCancelingUndelegate, setIsCancelingUndelegate] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("waitlistEmail");
    if (storedEmail) {
      setSubmitted(true);
    }
  }, []);

  // Add effect to fetch staked amount when wallet is connected
  useEffect(() => {
    const fetchStakeAmount = async () => {
      if (!walletClient) return;

      try {
        setIsLoadingStake(true);
        setStakeError(null);

        const provider = new ethers.BrowserProvider(walletClient);
        const signer = await provider.getSigner();

        console.log("Fetching stake amount...");
        const result = await getUserStakeAmount(signer, FOMOGOD_VALIDATOR);

        setDelegatedAmount(result.stakedAmount);
        setUndelegationStatus(result.undelegationStatus);

        console.log("Stake amount fetched successfully:", result);
      } catch (error) {
        console.error("Error fetching stake amount:", error);
        setStakeError(error instanceof Error ? error.message : "Failed to fetch stake amount");
        setDelegatedAmount("0");
        setUndelegationStatus(null);
      } finally {
        setIsLoadingStake(false);
      }
    };

    fetchStakeAmount();
  }, [walletClient]);

  // Placeholder for token price fetch

  const dexUrl = "https://fomo.biz/token/0x4AFCfbf183c743362cEE976e5e94a3E5FB729935";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitted(false);
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      setError("Please enter a valid email address.");
      return;
    }
    const storedEmail = localStorage.getItem("waitlistEmail");
    if (storedEmail === email) {
      setError("You are already on the waitlist.");
      return;
    }
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubmitted(true);
        localStorage.setItem("waitlistEmail", email);
        setEmail("");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleDelegate = async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        alert("Please install MetaMask to use this feature.");
        return;
      }

      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        alert("Please enter a valid amount");
        return;
      }

      setIsDelegating(true);

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      if (!signer) {
        throw new Error("Failed to get signer");
      }

      console.log("Starting delegation process...");
      await delegateToFomogod(FOMOGOD_VALIDATOR, amount, signer);

      console.log("Delegation successful");
      setDelegatedAmount(amount);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setShowStakeModal(false);
    } catch (err) {
      console.error("Delegation error:", err);
      alert(err instanceof Error ? err.message : "Delegation failed. Please try again.");
    } finally {
      setIsDelegating(false);
    }
  };

  const handleUndelegate = async () => {
    try {
      if (!walletClient) {
        alert("Please connect your wallet first");
        return;
      }

      setIsUndelegating(true);
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      await undelegateFromFomogod(FOMOGOD_VALIDATOR, delegatedAmount, signer);
      setDelegatedAmount("0");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setShowUndelegateModal(false);
    } catch (err) {
      console.error(err);
      alert("Undelegation failed. Please try again.");
    } finally {
      setIsUndelegating(false);
    }
  };

  const handleCancelUndelegate = async () => {
    try {
      if (!walletClient) {
        alert("Please connect your wallet first");
        return;
      }

      setIsCancelingUndelegate(true);
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      await cancelUndelegate(FOMOGOD_VALIDATOR, signer);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setShowCancelUndelegateModal(false);

      // Refresh stake amount and undelegation status
      const result = await getUserStakeAmount(signer, FOMOGOD_VALIDATOR);
      setDelegatedAmount(result.stakedAmount);
      setUndelegationStatus(result.undelegationStatus);
    } catch (err) {
      console.error(err);
      alert("Failed to cancel undelegation. Please try again.");
    } finally {
      setIsCancelingUndelegate(false);
    }
  };

  const formatTimeRemaining = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days} days ${hours} hours`;
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <WalletConnect />
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#041813] p-4 relative">
        {/* Success Message */}
        {showSuccess && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-[#00e676] text-black px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2">
            <span>🎉</span>
            <span className="fomogod-heading">Transaction Successful!</span>
          </div>
        )}

        {/* Token price and DEX link */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-center max-w-3xl mb-6 relative z-10">
          <div className="fomogod-heading text-2xl fomogod-green mb-2 sm:mb-0">$FOMOGOD</div>
        </div>
        {/* Main content */}
        <div className="flex flex-col md:flex-row items-center gap-10 max-w-6xl w-full relative z-10">
          <div className="flex-shrink-0">
            <Image src="/fomogod2.png" alt="FOMOGOD" width={500} height={500} className="rounded-2xl shadow-lg" priority />
          </div>
          <div className="flex-1 flex flex-col gap-6 fomogod-body">
            <h1 className="fomogod-heading text-4xl md:text-5xl text-white mb-2">Welcome to FOMOGOD</h1>
            <h2 className="fomogod-heading text-2xl text-white mb-4">The God of FOMO on Taraxa</h2>
            <p className="fomogod-body text-lg text-white">
              We&apos;re building a validator node on the Taraxa network, but with a twist:
            </p>
            <ul className="list-disc pl-5 text-lg text-white">
              <li>Every reward generated will be used to <span className="fomogod-green font-bold">buy back and burn $FOMOGOD</span>, forever reducing supply and increasing scarcity.</li>
              <li>A custom smart contract will automate the entire process for <span className="fomogod-yellow font-bold">full transparency</span>.</li>
              <li>And yes! We&apos;re also developing a <span className="fomogod-green font-bold">no-KYC staking gateway</span>, so even US users can delegate to our node safely and easily.</li>
            </ul>
            <div className="flex gap-4 mt-4">
              <a
                href="https://t.me/FomoGod_on_Taraxa"
                target="_blank"
                rel="noopener noreferrer"
                className="fomogod-body border-2 border-[#00e676] text-[#00e676] px-4 py-2 rounded-full font-bold hover:bg-[#00e676] hover:text-black transition-all duration-300 cursor-pointer relative z-10 flex items-center gap-2"
              >
                <FaTelegram className="text-xl" />
                Telegram
              </a>
              <a
                href="https://x.com/FOMOGOD_ON_TARA"
                target="_blank"
                rel="noopener noreferrer"
                className="fomogod-body border-2 border-[#ffe600] text-[#ffe600] px-4 py-2 rounded-full font-bold hover:bg-[#ffe600] hover:text-black transition-all duration-300 cursor-pointer relative z-10 flex items-center gap-2"
              >
                <FaTwitter className="text-xl" />
                Twitter
              </a>
              <a
                href={dexUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="fomogod-body border-2 border-[#00e676] text-[#00e676] px-4 py-2 rounded-full font-bold hover:bg-[#00e676] hover:text-black transition-all duration-300 cursor-pointer relative z-10 flex items-center gap-2"
              >
                <FaChartLine className="text-xl" />
                View on DEX
              </a>
              <a
                href="https://community.taraxa.io/staking/0xa6488E0Dd259c48e0d6c0380fF5b08f6ae02a641"
                target="_blank"
                rel="noopener noreferrer"
                className="fomogod-body border-2 border-[#ffe600] text-[#ffe600] px-4 py-2 rounded-full font-bold hover:bg-[#ffe600] hover:text-black transition-all duration-300 cursor-pointer relative z-10 flex items-center gap-2"
              >
                <FaServer className="text-xl" />
                View Node
              </a>
            </div>
            <div className="flex flex-col gap-4 mt-6">
              {isLoadingStake ? (
                <div className="fomogod-heading text-xl text-[#00e676]">
                  Loading stake amount...
                </div>
              ) : stakeError ? (
                <div className="fomogod-heading text-xl text-red-500">
                  Error: {stakeError}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {Number(delegatedAmount) > 0 && (
                    <div className="fomogod-heading text-xl text-[#00e676]">
                      Currently Staked: {delegatedAmount} $TARA
                    </div>
                  )}

                  {/* Show undelegation status if there is one */}
                  {undelegationStatus?.hasUndelegation && (
                    <div className="bg-[#2a2a2a] p-4 rounded-xl">
                      <h4 className="fomogod-heading text-lg text-[#ffe600] mb-2">Undelegation in Progress</h4>
                      <p className="text-[#ededed]">
                        Undelegation Request for {undelegationStatus.amount} $TARA has been registered and will be confirmed at block {undelegationStatus.unlockBlock} (~{formatTimeRemaining(undelegationStatus.estimatedUnlockTime as Date)})
                      </p>
                      {undelegationStatus.canConfirm ? (
                        <button
                          onClick={() => setShowConfirmUndelegateModal(true)}
                          className="mt-4 fomogod-heading bg-[#00e676] text-black px-6 py-3 rounded-full shadow hover:bg-[#ffe600] hover:text-[#222] transition-all duration-300"
                        >
                          Confirm Undelegation
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowCancelUndelegateModal(true)}
                          className="mt-4 fomogod-heading bg-[#ffe600] text-black px-6 py-3 rounded-full shadow hover:bg-[#00e676] hover:text-white transition-all duration-300"
                        >
                          Cancel Undelegation
                        </button>
                      )}
                    </div>
                  )}

                  {/* Always show stake button */}
                  <button
                    onClick={() => setShowStakeModal(true)}
                    className="fomogod-heading bg-[#00e676] text-black px-8 py-3 rounded-full text-xl shadow-lg hover:bg-[#ffe600] hover:text-[#222] transition-all duration-300 cursor-pointer relative z-10"
                  >
                    {Number(delegatedAmount) > 0 ? "Stake More $TARA" : "Stake $TARA"}
                  </button>

                  {/* Only show undelegate button if there's no pending undelegation */}
                  {Number(delegatedAmount) > 0 && !undelegationStatus?.hasUndelegation && (
                    <button
                      onClick={() => setShowUndelegateModal(true)}
                      className="fomogod-heading bg-[#ffe600] text-black px-8 py-3 rounded-full text-xl shadow-lg hover:bg-[#00e676] hover:text-white transition-all duration-300 cursor-pointer relative z-10"
                    >
                      Undelegate $TARA
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Staking Modal */}
        {showStakeModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] rounded-2xl p-8 shadow-2xl max-w-md w-full flex flex-col items-center relative z-50">
              <h3 className="fomogod-heading text-2xl fomogod-green mb-4">Stake $TARA</h3>

              <div className="w-full space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount in $TARA"
                    className="fomogod-body bg-[#2a2a2a] text-white px-4 py-2 rounded-full border border-[#00e676] focus:outline-none focus:ring-2 focus:ring-[#ffe600] w-full"
                    min="0"
                    step="1"
                  />
                  <span className="fomogod-body text-white whitespace-nowrap">$TARA</span>
                </div>

                <div className="bg-[#2a2a2a] p-4 rounded-xl">
                  <h4 className="fomogod-heading text-lg text-[#ffe600] mb-2">Important Information</h4>
                  <ul className="list-disc pl-5 space-y-2 text-[#ededed]">
                    <li>Staked $TARA will be locked for 7 days</li>
                    <li>You can undelegate at any time</li>
                    <li>Undelegated $TARA will be available after the 7-day lock period</li>
                    <li>Rewards are distributed automatically</li>
                  </ul>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setShowStakeModal(false)}
                    className="flex-1 fomogod-body border-2 border-[#00e676] text-[#00e676] px-6 py-3 rounded-full hover:bg-[#00e676] hover:text-black transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelegate}
                    disabled={isDelegating || !walletClient}
                    className="flex-1 fomogod-heading bg-[#00e676] text-black px-6 py-3 rounded-full shadow hover:bg-[#ffe600] hover:text-[#222] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDelegating ? "Delegating..." : "Confirm Stake"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Undelegate Modal */}
        {showUndelegateModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] rounded-2xl p-8 shadow-2xl max-w-md w-full flex flex-col items-center relative z-50">
              <h3 className="fomogod-heading text-2xl fomogod-green mb-4">Undelegate $TARA</h3>

              <div className="w-full space-y-4">
                <div className="bg-[#2a2a2a] p-4 rounded-xl">
                  <h4 className="fomogod-heading text-lg text-[#ffe600] mb-2">Important Information</h4>
                  <ul className="list-disc pl-5 space-y-2 text-[#ededed]">
                    <li>You are undelegating {delegatedAmount} $TARA</li>
                    <li>Undelegated $TARA will be locked for 7 days</li>
                    <li>After the lock period, you can withdraw your $TARA</li>
                    <li>You will stop earning rewards for undelegated amount</li>
                  </ul>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setShowUndelegateModal(false)}
                    className="flex-1 fomogod-body border-2 border-[#00e676] text-[#00e676] px-6 py-3 rounded-full hover:bg-[#00e676] hover:text-black transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUndelegate}
                    disabled={isUndelegating || !walletClient}
                    className="flex-1 fomogod-heading bg-[#ffe600] text-black px-6 py-3 rounded-full shadow hover:bg-[#00e676] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUndelegating ? "Undelegating..." : "Confirm Undelegate"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Cancel Undelegate Modal */}
        {showCancelUndelegateModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] rounded-2xl p-8 shadow-2xl max-w-md w-full flex flex-col items-center relative z-50">
              <h3 className="fomogod-heading text-2xl fomogod-green mb-4">Cancel Undelegation</h3>

              <div className="w-full space-y-4">
                <div className="bg-[#2a2a2a] p-4 rounded-xl">
                  <h4 className="fomogod-heading text-lg text-[#ffe600] mb-2">Important Information</h4>
                  <ul className="list-disc pl-5 space-y-2 text-[#ededed]">
                    <li>You are canceling the undelegation of {undelegationStatus?.amount} $TARA</li>
                    <li>Your tokens will remain staked with the validator</li>
                    <li>You will continue earning rewards</li>
                    <li>You can undelegate again at any time</li>
                  </ul>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setShowCancelUndelegateModal(false)}
                    className="flex-1 fomogod-body border-2 border-[#00e676] text-[#00e676] px-6 py-3 rounded-full hover:bg-[#00e676] hover:text-black transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCancelUndelegate}
                    disabled={isCancelingUndelegate || !walletClient}
                    className="flex-1 fomogod-heading bg-[#ffe600] text-black px-6 py-3 rounded-full shadow hover:bg-[#00e676] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCancelingUndelegate ? "Canceling..." : "Confirm Cancel"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Modal for waitlist */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] rounded-2xl p-8 shadow-2xl max-w-sm w-full flex flex-col items-center relative z-50">
              <h3 className="fomogod-heading text-2xl fomogod-green mb-2">Get Notified!</h3>
              {submitted ? (
                <p className="fomogod-body text-center mb-4 text-[#ededed]">You are already on the waitlist!</p>
              ) : (
                <p className="fomogod-body text-center mb-4 text-[#ededed]">Enter your email to join the waitlist and be the first to know when staking goes live.</p>
              )}
              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="border border-[#00e676] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ffe600] fomogod-body bg-[#2a2a2a] text-[#ededed]"
                  required
                  disabled={submitted}
                />
                <button type="submit" className="fomogod-heading fomogod-bg-yellow text-black px-4 py-2 rounded-full shadow hover:fomogod-bg-green transition" disabled={submitted}>Join Waitlist</button>
              </form>
              {error && <div className="text-red-600 fomogod-body mt-2">{error}</div>}
              {submitted && <div className="text-green-700 fomogod-body mt-2">You&apos;re on the list!</div>}
              <button
                onClick={() => setShowModal(false)}
                className="mt-4 fomogod-body underline text-sm text-gray-500 hover:text-[#ededed] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
