import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PlatformCard from '@/components/PlatformCard';
import TheatricalRibbons from '@/components/TheatricalRibbons';
import ButtonPrimary from '@/components/ButtonPrimary';
import ButtonSecondary from '@/components/ButtonSecondary';

export default function EcosystemPage() {
  return (
    <main className="min-h-screen bg-ink-900">
      <TheatricalRibbons />
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-ink-900 text-white py-24">
        <div className="absolute inset-0 noisy"></div>
        <div className="absolute inset-0 bg-grid opacity-[.05]"></div>
        <div className="absolute inset-0 gradient-overlay-cyber"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-airy text-soft-glow-pink mb-6 drop-shadow-[0_4px_16px_rgba(255,45,161,0.8)]">
              FANZ ECOSYSTEM
            </h1>
            <p className="text-xl md:text-2xl text-white font-sans font-medium tracking-sensual max-w-4xl mx-auto mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              The Complete Network Architecture
            </p>
            <p className="text-lg text-steel-300 max-w-3xl mx-auto mb-8 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              A fully integrated creator economy powered by AI, automation, and rebellion.
              Everything flows through FanzOS, orchestrating 40+ platforms in real time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <ButtonPrimary href="/ecosystem/3d">
                🌐 View 3D Interactive Model
              </ButtonPrimary>
              <ButtonSecondary href="#core-infrastructure">
                Explore Details Below
              </ButtonSecondary>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-neon-pink via-neon-cyan to-acid-lime"></div>
      </section>

      {/* Core Infrastructure */}
      <section id="core-infrastructure" className="relative bg-ink-800 py-20">
        <div className="absolute inset-0 bg-grid-small opacity-[.02]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-12">
            <span className="inline-block font-mono text-xs tracking-widest uppercase text-neon-pink mb-3 drop-shadow-[0_2px_6px_rgba(255,45,161,0.7)]">
              Layer 01
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-sensual text-white text-soft-glow-pink mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Core Infrastructure
            </h2>
            <p className="text-lg text-steel-300 max-w-3xl leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              The brain, nervous system, and command center of the entire network.
              These manage orchestration, automation, identity, data, and executive oversight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PlatformCard
              name="FanzOS"
              description="The operating system of the ecosystem — orchestrates all app logic, automation, and AI flows."
              color="pink"
            />
            <PlatformCard
              name="FanzDash"
              description="Executive & admin command center (approvals, analytics, moderation, system control)."
              color="pink"
            />
            <PlatformCard
              name="FanzSSO"
              description="Unified sign-on for creators & fanz across all platforms."
              color="pink"
            />
            <PlatformCard
              name="TaskSparks (Unified)"
              description="Combines all versions (1–3) into a powerhouse automation engine — manages AI agents, tasks, workflows, and smart triggers between systems."
              color="pink"
            />
            <PlatformCard
              name="FanzHubVault"
              description="Secure database for identity, verification, contracts, forms, 2257/2258 compliance, and legal records."
              color="pink"
            />
            <PlatformCard
              name="FanzMediaCore"
              description="Handles every piece of uploaded content: transcoding, AI moderation, forensic fingerprinting, watermarking, and CDN delivery."
              color="pink"
            />
            <PlatformCard
              name="FanzCRM"
              description="Dedicated creator & brand relationship management. Tracks communication, deals, sponsorships, and support pipelines."
              color="pink"
            />
            <PlatformCard
              name="FanzMoney"
              description="The financial heart — wallet, escrow, payouts, affiliate payments, creator banking, and tip management."
              color="pink"
            />
            <PlatformCard
              name="FanzMobile"
              description="Creator mobile OS — content uploads, Co-Star verification, AI post approvals, financial dashboard, and publishing control in one app."
              color="pink"
            />
          </div>

          {/* FanzForensics Spotlight */}
          <div className="mt-16 p-10 rounded-3xl bg-gradient-to-br from-neon-pink/20 to-neon-cyan/20 border-4 border-neon-pink shadow-[0_0_60px_rgba(255,45,161,0.5)]">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-2xl bg-neon-pink/30 border-4 border-neon-pink flex items-center justify-center flex-shrink-0">
                <span className="text-5xl">🔬</span>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-3xl font-black text-neon-pink mb-4 drop-shadow-[0_2px_10px_rgba(255,45,161,1)]">
                  FanzForensics™ — Military-Grade Content Protection
                </h3>
                <p className="text-lg text-white font-sans leading-relaxed mb-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  Every piece of content uploaded to any FANZ platform is embedded with an <span className="text-neon-cyan font-bold">invisible, forensic-grade digital signature</span> at the binary level. This proprietary technology acts as an unbreakable DNA marker for your content.
                </p>
                <p className="text-lg text-white font-sans leading-relaxed mb-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  If your content is stolen and posted elsewhere—on any platform, anywhere in the world—<span className="text-acid-lime font-bold">FanzForensics can trace it back</span> to the exact upload timestamp, user account, device fingerprint, and IP address. Our AI-powered web crawlers scan billions of pages 24/7, automatically detecting pirated content and issuing DMCA takedown notices within minutes.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-ink-900/60 border-2 border-neon-cyan/40">
                    <p className="font-display text-xl font-bold text-neon-cyan mb-2">Invisible Embedding</p>
                    <p className="text-sm text-steel-300">Binary-level signatures undetectable to the human eye</p>
                  </div>
                  <div className="p-4 rounded-xl bg-ink-900/60 border-2 border-neon-pink/40">
                    <p className="font-display text-xl font-bold text-neon-pink mb-2">AI Web Scanning</p>
                    <p className="text-sm text-steel-300">24/7 monitoring across billions of pages</p>
                  </div>
                  <div className="p-4 rounded-xl bg-ink-900/60 border-2 border-acid-lime/40">
                    <p className="font-display text-xl font-bold text-acid-lime mb-2">Auto DMCA</p>
                    <p className="text-sm text-steel-300">Automated takedown enforcement</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creator & Fan Platforms */}
      <section className="relative bg-ink-900 py-20">
        <div className="absolute inset-0 bg-grid opacity-[.03]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-12">
            <span className="inline-block font-mono text-xs tracking-widest uppercase text-neon-cyan mb-3 drop-shadow-[0_2px_6px_rgba(25,240,255,0.7)]">
              Layer 02
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-sensual text-white text-soft-glow-pink mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Creator & Fan Platforms
            </h2>
            <p className="text-lg text-steel-300 max-w-3xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              The visible side of the empire — each tailored to different audiences or communities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PlatformCard
              name="BoyFanz V4"
              description="Flagship gay creator platform — the pulse of the network."
              color="cyan"
            />
            <PlatformCard
              name="GirlFanz V4"
              description="Female creator ecosystem; glamour, lifestyle, empowerment."
              color="cyan"
            />
            <PlatformCard
              name="DaddyFanz V4"
              description="Mature male vertical; mentorship and sugar dynamics."
              color="cyan"
            />
            <PlatformCard
              name="BearFanz"
              description="Rugged, body-positive energy; inclusive community of masc creators."
              color="cyan"
            />
            <PlatformCard
              name="PupFanz"
              description="Fetish/kink-based creator space with pack identity."
              color="cyan"
            />
            <PlatformCard
              name="CougarFanz"
              description="MILF and mature femme vertical."
              color="cyan"
            />
            <PlatformCard
              name="TransFanz"
              description="Trans and nonbinary creator representation with inclusive design."
              color="cyan"
            />
            <PlatformCard
              name="FemmeFanz"
              description="Feminine expression and gender-fluid artistry."
              color="cyan"
            />
            <PlatformCard
              name="TabooFanz"
              description="The 'edge' platform — experimental, kink, fetish, alternative lifestyles."
              color="cyan"
            />
            <PlatformCard
              name="SouthernFanz / RedneckFanz"
              description="Regional southern creators and Americana culture."
              color="cyan"
            />
            <PlatformCard
              name="FanzUncut"
              description="Explicit, raw, no-censorship zone — for unfiltered adult content."
              color="cyan"
            />
            <PlatformCard
              name="FanzDiscreet"
              description="Anonymous, private creator space for fans who prefer confidentiality."
              color="cyan"
            />
            <PlatformCard
              name="FanzEliteTube"
              description="Premium multi-vertical showcase with VR integration and VIP creator zones."
              color="cyan"
            />
            <PlatformCard
              name="FanzTube"
              description="Free-to-watch teaser and promo content hub."
              color="cyan"
            />
            <PlatformCard
              name="Outlawz Program"
              description="The home for creators banned elsewhere — 'Banned elsewhere? Be legendary here.'"
              color="purple"
              size="large"
            />
          </div>
        </div>
      </section>

      {/* Social & Engagement Layer */}
      <section className="relative bg-ink-800 py-20">
        <div className="absolute inset-0 bg-grid-small opacity-[.02]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-12">
            <span className="inline-block font-mono text-xs tracking-widest uppercase text-acid-lime mb-3 drop-shadow-[0_2px_6px_rgba(200,255,61,0.7)]">
              Layer 03
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-sensual text-white text-soft-glow-pink mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Social & Engagement Layer
            </h2>
            <p className="text-lg text-steel-300 max-w-3xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              Where creators, fans, and brands interact — the social universe of the rebellion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PlatformCard
              name="FanzUniverse"
              description="All-in-one social media world — think Facebook, Fetlife, and Reddit fused. Global + vertical feeds, DMs, Lives, Outlawz feed, and events."
              color="lime"
              size="large"
            />
            <PlatformCard
              name="FanzClubCentral"
              description="Non-adult, safe-mode creator hub for mainstream growth. Acts as the bridge for clean marketing funnels."
              color="lime"
            />
            <PlatformCard
              name="FanzMeet / FanzRoulette"
              description="Video chat, creator roulette, fan interaction portals."
              color="lime"
            />
            <PlatformCard
              name="StarzCards"
              description="Tinder-style swiping between creators & fans."
              color="lime"
            />
            <PlatformCard
              name="FanzLink"
              description="Link-in-bio generator tied to each creator's profile in all verticals."
              color="lime"
            />
            <PlatformCard
              name="Starz Social Dashboard"
              description="Automated social scheduling and AI-assisted content syndication to TikTok, X, IG, and Reddit."
              color="lime"
            />
          </div>
        </div>
      </section>

      {/* Commerce & Monetization */}
      <section className="relative bg-ink-900 py-20">
        <div className="absolute inset-0 bg-grid opacity-[.03]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-12">
            <span className="inline-block font-mono text-xs tracking-widest uppercase text-neon-pink mb-3 drop-shadow-[0_2px_6px_rgba(255,45,161,0.7)]">
              Layer 04
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-sensual text-white text-soft-glow-pink mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Commerce & Monetization Layer
            </h2>
            <p className="text-lg text-steel-300 max-w-3xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              Where creators turn engagement into income and brands into partners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PlatformCard
              name="FanzCommercePod"
              description="Creator-owned shops (POD, dropshipping, merch)."
              color="pink"
            />
            <PlatformCard
              name="FanzFiliate"
              description="Affiliate + influencer system with payout integration to FanzMoney."
              color="pink"
            />
            <PlatformCard
              name="FanziesDropper"
              description="Adult toy dropshipping and branded merch fulfillment."
              color="pink"
            />
            <PlatformCard
              name="FanzWorkMarketplace"
              description="Freelancer marketplace for content managers, photographers, videographers, and agencies."
              color="pink"
            />
            <PlatformCard
              name="FanzDefenderDMCA"
              description="AI-powered DMCA and copyright enforcement."
              color="pink"
            />
            <PlatformCard
              name="FanzProspectus"
              description="Investor and brand-facing showcase of the entire ecosystem."
              color="pink"
            />
          </div>
        </div>
      </section>

      {/* Intelligence & AI Layer */}
      <section className="relative bg-ink-800 py-20">
        <div className="absolute inset-0 bg-grid-small opacity-[.02]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-12">
            <span className="inline-block font-mono text-xs tracking-widest uppercase text-neon-cyan mb-3 drop-shadow-[0_2px_6px_rgba(25,240,255,0.7)]">
              Layer 05
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-sensual text-white text-soft-glow-pink mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Intelligence & AI Layer
            </h2>
            <p className="text-lg text-steel-300 max-w-3xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              The brainpower that personalizes, predicts, and protects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PlatformCard
              name="FanzGPT"
              description="Central AI brain — orchestrates conversation flows, support, and automation across the ecosystem."
              color="cyan"
            />
            <PlatformCard
              name="FanzSpicyAI"
              description="Unfiltered AI model for creative, spicy, and adult-safe interactions."
              color="cyan"
            />
            <PlatformCard
              name="FanzChatbotCommand"
              description="The in-platform AI concierge — navigation, support, and education."
              color="cyan"
            />
            <PlatformCard
              name="FanzForge"
              description="AI website builder for creators — domain setup, site generation, branding, and SEO."
              color="cyan"
            />
            <PlatformCard
              name="FanzVarsity"
              description="Creator education academy — courses on adult content creation, branding, monetization, and safety."
              color="cyan"
            />
            <PlatformCard
              name="AiDashboard"
              description="Creator analytics and AI optimization tools for content and performance insights."
              color="cyan"
            />
          </div>
        </div>
      </section>

      {/* Experience & Entertainment Layer */}
      <section className="relative bg-ink-900 py-20">
        <div className="absolute inset-0 bg-grid opacity-[.03]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-12">
            <span className="inline-block font-mono text-xs tracking-widest uppercase text-acid-lime mb-3 drop-shadow-[0_2px_6px_rgba(200,255,61,0.7)]">
              Layer 06
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-sensual text-white text-soft-glow-pink mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Experience & Entertainment Layer
            </h2>
            <p className="text-lg text-steel-300 max-w-3xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              Media and culture — the FANZ showtime dimension.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PlatformCard
              name="FanzRadio / Podcast"
              description="Creator podcasts, radio, livestreaming, and talk shows."
              color="lime"
            />
            <PlatformCard
              name="FanzReels"
              description="Short-form, TikTok-style video platform (merged into FanzEliteTube)."
              color="lime"
            />
            <PlatformCard
              name="VisionForge"
              description="Template platform for building new verticals or clones quickly."
              color="lime"
            />
            <PlatformCard
              name="FanzLanding V2"
              description="Universal entry point; marketing + onboarding portal for creators and fans."
              color="lime"
            />
          </div>
        </div>
      </section>

      {/* How It All Connects */}
      <section className="relative bg-ink-800 py-20">
        <div className="absolute inset-0 bg-grid-small opacity-[.02]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-sensual text-white text-soft-glow-pink mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              How It All Connects
            </h2>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="p-8 md:p-12 rounded-3xl bg-ink-900/80 border-2 border-neon-pink/30 backdrop-blur-md shadow-[0_0_40px_rgba(255,45,161,0.2)]">
              <div className="font-mono text-sm md:text-base text-steel-300 leading-relaxed space-y-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                <p className="text-white font-sans font-semibold text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  <span className="text-neon-pink">FanzMobile</span> → Uploads content →
                  <span className="text-neon-cyan"> FanzMediaCore</span> → Verifies via
                  <span className="text-acid-lime"> FanzHubVault</span> → Publishes to vertical →
                  Socialized via <span className="text-neon-pink">FanzUniverse</span> →
                  Monetized via <span className="text-neon-cyan">FanzMoney</span> →
                  Managed in <span className="text-acid-lime">FanzCRM</span> →
                  Automated through <span className="text-neon-pink">TaskSparks</span> →
                  Overseen in <span className="text-neon-cyan">FanzDash</span>.
                </p>
                <p className="text-center text-white font-display text-xl mt-8 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  Everything flows through <span className="text-glow-pink">FanzOS</span>,
                  which orchestrates APIs, tasks, and AI agents in real time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="relative bg-ink-900 py-20">
        <div className="absolute inset-0 bg-grid opacity-[.03]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-sensual text-white text-soft-glow-pink mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              The FANZ Group Holdings Ecosystem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-ink-800/80 border-2 border-neon-pink/30 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🧠</span>
                <h3 className="font-display text-xl font-bold text-neon-pink drop-shadow-[0_2px_6px_rgba(255,45,161,0.7)]">Core Brain</h3>
              </div>
              <p className="text-steel-300 font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                FanzOS, FanzDash, TaskSparks, FanzHubVault
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-ink-800/80 border-2 border-neon-cyan/30 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">💬</span>
                <h3 className="font-display text-xl font-bold text-neon-cyan drop-shadow-[0_2px_6px_rgba(25,240,255,0.7)]">Social Heart</h3>
              </div>
              <p className="text-steel-300 font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                FanzUniverse, FanzClubCentral
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-ink-800/80 border-2 border-acid-lime/30 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">💰</span>
                <h3 className="font-display text-xl font-bold text-acid-lime drop-shadow-[0_2px_6px_rgba(200,255,61,0.7)]">Money Engine</h3>
              </div>
              <p className="text-steel-300 font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                FanzMoney
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-ink-800/80 border-2 border-neon-pink/30 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🛡️</span>
                <h3 className="font-display text-xl font-bold text-neon-pink drop-shadow-[0_2px_6px_rgba(255,45,161,0.7)]">Compliance Shield</h3>
              </div>
              <p className="text-steel-300 font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                FanzHubVault + FanzDefenderDMCA
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-ink-800/80 border-2 border-neon-cyan/30 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🤖</span>
                <h3 className="font-display text-xl font-bold text-neon-cyan drop-shadow-[0_2px_6px_rgba(25,240,255,0.7)]">AI Core</h3>
              </div>
              <p className="text-steel-300 font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                FanzGPT + SpicyAI + Forge
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-ink-800/80 border-2 border-acid-lime/30 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">⚡</span>
                <h3 className="font-display text-xl font-bold text-acid-lime drop-shadow-[0_2px_6px_rgba(200,255,61,0.7)]">Creator Frontline</h3>
              </div>
              <p className="text-steel-300 font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                BoyFanz, GirlFanz, DaddyFanz, TabooFanz, and all verticals
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-ink-800/80 border-2 border-neon-pink/30 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎭</span>
                <h3 className="font-display text-xl font-bold text-neon-pink drop-shadow-[0_2px_6px_rgba(255,45,161,0.7)]">Fan Experience</h3>
              </div>
              <p className="text-steel-300 font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                FanzEliteTube, FanzTube, FanzMeet, StarzCards
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-ink-800/80 border-2 border-uv-500/30 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📱</span>
                <h3 className="font-display text-xl font-bold text-uv-500 drop-shadow-[0_2px_6px_rgba(122,44,255,0.7)]">Ecosystem Bridge</h3>
              </div>
              <p className="text-steel-300 font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                FanzMobile — everything, everywhere, connected
              </p>
            </div>
          </div>

          {/* Credits */}
          <div className="mt-16 text-center">
            <div className="inline-block p-8 rounded-2xl bg-ink-800/80 border-2 border-neon-pink/30 backdrop-blur-md">
              <p className="font-display text-lg font-bold text-white mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                Developed by: <span className="text-neon-pink">Joshua Stone</span>
              </p>
              <p className="font-mono text-sm text-steel-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                © 2025 All Rights Reserved
              </p>
              <p className="font-mono text-sm text-steel-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Licensed to <span className="text-neon-cyan">FANZ™ Group Holdings LLC</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
