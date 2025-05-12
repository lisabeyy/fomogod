"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("waitlistEmail");
    if (storedEmail) {
      setSubmitted(true);
    }
  }, []);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#041813] p-4 relative">
      {/* Token price and DEX link */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-center max-w-3xl mb-6 relative z-10">
        <div className="fomogod-heading text-2xl fomogod-green mb-2 sm:mb-0">$FOMOGOD</div>
        <div className="flex items-center gap-4">
          <a
            href={dexUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fomogod-heading text-lg text-[#ffe600] hover:text-[#00e676] transition-colors duration-300 cursor-pointer"
          >
            View on DEX
          </a>
        </div>
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
              className="fomogod-body border-2 border-[#00e676] text-[#00e676] px-4 py-2 rounded-full font-bold hover:bg-[#00e676] hover:text-black transition-all duration-300 cursor-pointer relative z-10"
            >
              Telegram
            </a>
            <a
              href="https://x.com/FOMOGOD_ON_TARA"
              target="_blank"
              rel="noopener noreferrer"
              className="fomogod-body border-2 border-[#ffe600] text-[#ffe600] px-4 py-2 rounded-full font-bold hover:bg-[#ffe600] hover:text-black transition-all duration-300 cursor-pointer relative z-10"
            >
              Twitter
            </a>
          </div>
          <button
            type="button"
            onClick={() => {
              console.log('Button clicked');
              setShowModal(true);
            }}
            className="mt-6 fomogod-heading bg-[#00e676] text-black px-8 py-3 rounded-full text-xl shadow-lg hover:bg-[#ffe600] hover:text-[#222] transition-all duration-300 cursor-pointer relative z-10"
          >
            Stake Coming Soon
          </button>
        </div>
      </div>
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
  );
}
