import type { Metadata } from 'next'
import './globals.css'
import LoadingScreen from '@/components/LoadingScreen'
import HolographicOverlay from '@/components/HolographicOverlay'
import NeonParticles from '@/components/NeonParticles'
import MatrixRain from '@/components/MatrixRain'
import CursorTrail from '@/components/CursorTrail'
import ScrollProgress from '@/components/ScrollProgress'
import CyberpunkHUD from '@/components/CyberpunkHUD'
import AudioVisualizerBars from '@/components/AudioVisualizerBars'
import HexagonalGrid from '@/components/HexagonalGrid'
import ElectricSparks from '@/components/ElectricSparks'
import VHSDistortion from '@/components/VHSDistortion'
import TerminalWidget from '@/components/TerminalWidget'
import EnergyBeams from '@/components/EnergyBeams'
import FilmGrain from '@/components/FilmGrain'
import FloatingBadges from '@/components/FloatingBadges'

export const metadata: Metadata = {
  title: 'FANZ Unlimited - Creator-Owned Platform',
  description: 'The neon backbone for creators—own it all, keep it all.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        {/* Loading screen with ASCII art */}
        <LoadingScreen />

        {/* Background layers (z-index: 1-5) */}
        <HexagonalGrid />
        <AudioVisualizerBars />
        <MatrixRain />
        <NeonParticles />

        {/* Holographic chromatic aberration overlay (z-index: 99-101) */}
        <HolographicOverlay />

        {/* Energy beams connecting elements (z-index: 110) */}
        <EnergyBeams />

        {/* Film grain overlay (z-index: 115) */}
        <FilmGrain />

        {/* VHS distortion effects (z-index: 120) */}
        <VHSDistortion />

        {/* Floating achievement badges (z-index: 125) */}
        <FloatingBadges />

        {/* Cyberpunk HUD with data readouts (z-index: 150) */}
        <CyberpunkHUD />

        {/* Interactive effects (z-index: 200+) */}
        <CursorTrail />
        <ElectricSparks />

        {/* Terminal widget (z-index: 300) */}
        <TerminalWidget />

        {/* Scroll progress indicator (z-index: 9998) */}
        <ScrollProgress />

        {/* Main content */}
        {children}
      </body>
    </html>
  )
}
