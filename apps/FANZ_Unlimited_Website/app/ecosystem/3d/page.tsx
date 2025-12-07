'use client';

import dynamic from 'next/dynamic';

const QuantumEcosystem = dynamic(() => import('@/components/QuantumEcosystem'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full border-4 border-neon-pink border-t-transparent animate-spin mx-auto mb-6"></div>
        <p className="font-display text-2xl text-white text-glow-pink mb-2">Initializing Quantum Space...</p>
        <p className="font-mono text-sm text-steel-300">Loading 42 platforms</p>
      </div>
    </div>
  )
});

export default function Ecosystem3DPage() {
  return <QuantumEcosystem />;
}
