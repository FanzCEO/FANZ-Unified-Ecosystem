import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function HealthcareResources() {
  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="absolute inset-0 bg-grid opacity-[.03]" style={{ backgroundSize: '32px 32px' }}></div>
        <div className="max-w-7xl mx-auto px-6 py-32 relative z-10">
          <div className="text-center">
            <BadgeUnderground className="mb-6">Support & Wellness</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              Healthcare Resources
            </h1>
            <p className="text-steel-300 max-w-3xl mx-auto text-lg mb-8">
              Support services and crisis resources for the FANZ community
            </p>
            <div className="inline-block px-6 py-3 rounded-xl bg-neon-pink/10 border border-neon-pink/50 backdrop-blur-sm">
              <p className="text-neon-pink font-display text-sm">You are not alone. Help is available 24/7.</p>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      <section className="relative bg-ink-800 py-24">
        <div className="absolute inset-0 bg-grid opacity-[.02]" style={{ backgroundSize: '48px 48px' }}></div>
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="prose prose-invert max-w-none">

            {/* Crisis Support - Enhanced */}
            <div className="relative p-10 rounded-3xl bg-ink-900/80 border-2 border-neon-pink/50 shadow-[0_0_30px_rgba(255,45,161,0.3)] backdrop-blur-md mb-12 animate-neonbuzz">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/5 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-6xl animate-pulse">🚨</span>
                  <div>
                    <h2 className="font-display text-4xl text-white mb-2 text-glow">Crisis Support</h2>
                    <p className="text-neon-pink font-display text-sm uppercase tracking-wider">Available 24/7</p>
                  </div>
                </div>

                <p className="text-steel-300 mb-8 text-lg">
                  If you or someone you know is in immediate danger or experiencing a mental health crisis, please reach out to these resources immediately.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-ink-800 to-ink-900 border border-neon-pink/40 hover:border-neon-pink hover:shadow-[0_0_20px_rgba(255,45,161,0.4)] transition-all duration-300">
                    <div className="absolute inset-0 bg-neon-pink/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-white font-display text-2xl group-hover:text-glow transition">988 Suicide & Crisis Lifeline</h3>
                        <span className="text-3xl">☎️</span>
                      </div>
                      <p className="text-steel-300 mb-4 text-sm">24/7 free and confidential support</p>
                      <div className="p-4 rounded-lg bg-neon-pink/10 border border-neon-pink/50 mb-3">
                        <p className="text-neon-pink font-mono text-2xl font-bold text-center tracking-wider animate-pulse">
                          988
                        </p>
                      </div>
                      <p className="text-steel-300 text-sm text-center">
                        Call or Text | Chat: <a href="https://988lifeline.org" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:text-glow transition underline decoration-neon-cyan/50">988lifeline.org</a>
                      </p>
                    </div>
                  </div>

                  <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-ink-800 to-ink-900 border border-neon-cyan/40 hover:border-neon-cyan hover:shadow-[0_0_20px_rgba(25,240,255,0.4)] transition-all duration-300">
                    <div className="absolute inset-0 bg-neon-cyan/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-white font-display text-2xl group-hover:text-glow transition">Crisis Text Line</h3>
                        <span className="text-3xl">💬</span>
                      </div>
                      <p className="text-steel-300 mb-4 text-sm">Free 24/7 crisis support via text</p>
                      <div className="p-4 rounded-lg bg-neon-cyan/10 border border-neon-cyan/50 mb-3">
                        <p className="text-neon-cyan font-mono text-xl font-bold text-center tracking-wider">
                          Text HOME to 741741
                        </p>
                      </div>
                      <p className="text-steel-300 text-sm text-center">Confidential support from trained crisis counselors</p>
                    </div>
                  </div>

                  <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-ink-800 to-ink-900 border border-white/20 hover:border-neon-pink hover:shadow-[0_0_20px_rgba(255,45,161,0.3)] transition-all duration-300 md:col-span-2">
                    <div className="absolute inset-0 bg-neon-pink/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-4xl">🚑</span>
                          <h3 className="text-white font-display text-2xl group-hover:text-glow transition">Emergency Services</h3>
                        </div>
                        <p className="text-steel-300 text-sm">For immediate life-threatening emergencies</p>
                      </div>
                      <div className="p-4 rounded-lg bg-neon-pink/10 border border-neon-pink/50">
                        <p className="text-neon-pink font-mono text-3xl font-bold tracking-wider animate-pulse">911</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mental Health Support - Enhanced */}
            <div className="relative p-10 rounded-3xl bg-ink-900/80 border border-acid-lime/30 backdrop-blur-md mb-12 hover:border-acid-lime/50 transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-tr from-acid-lime/5 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-5xl">🧠</span>
                  <h2 className="font-display text-4xl text-white text-glow">Mental Health Support</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="group p-6 rounded-xl bg-ink-800/50 border border-white/10 hover:border-acid-lime/50 hover:bg-ink-800 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-display text-xl group-hover:text-acid-lime transition">SAMHSA National Helpline</h3>
                      <span className="text-2xl">📞</span>
                    </div>
                    <p className="text-steel-300 text-sm mb-4">Treatment referral and information service (24/7)</p>
                    <div className="p-3 rounded-lg bg-acid-lime/10 border border-acid-lime/30 mb-2">
                      <p className="text-acid-lime font-mono text-center font-bold">1-800-662-4357</p>
                    </div>
                    <p className="text-steel-300 text-xs text-center">
                      <a href="https://www.samhsa.gov" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:text-glow transition">samhsa.gov</a>
                    </p>
                  </div>

                  <div className="group p-6 rounded-xl bg-ink-800/50 border border-white/10 hover:border-acid-lime/50 hover:bg-ink-800 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-display text-xl group-hover:text-acid-lime transition">NAMI HelpLine</h3>
                      <span className="text-2xl">🤝</span>
                    </div>
                    <p className="text-steel-300 text-sm mb-4">National Alliance on Mental Illness</p>
                    <div className="p-3 rounded-lg bg-acid-lime/10 border border-acid-lime/30 mb-2">
                      <p className="text-acid-lime font-mono text-center font-bold">1-800-950-6264</p>
                    </div>
                    <p className="text-steel-300 text-xs text-center">Text: NAMI to 741741</p>
                  </div>

                  <div className="group p-6 rounded-xl bg-ink-800/50 border border-white/10 hover:border-neon-cyan/50 hover:bg-ink-800 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-display text-xl group-hover:text-neon-cyan transition">BetterHelp</h3>
                      <span className="text-2xl">💻</span>
                    </div>
                    <p className="text-steel-300 text-sm mb-4">Affordable online counseling and therapy</p>
                    <div className="p-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
                      <p className="text-neon-cyan text-xs text-center">
                        <a href="https://www.betterhelp.com" target="_blank" rel="noopener noreferrer" className="hover:text-glow transition font-mono">betterhelp.com</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Substance Abuse & Recovery - Enhanced */}
            <div className="relative p-10 rounded-3xl bg-ink-900/80 border border-neon-cyan/30 backdrop-blur-md mb-12 hover:border-neon-cyan/50 transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-bl from-neon-cyan/5 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-5xl">🌟</span>
                  <h2 className="font-display text-4xl text-white text-glow">Substance Abuse & Recovery</h2>
                </div>

                <div className="space-y-4">
                  <div className="group p-6 rounded-xl bg-gradient-to-r from-neon-pink/10 via-ink-800/50 to-ink-800/50 border border-neon-pink/40 hover:border-neon-pink hover:shadow-[0_0_15px_rgba(255,45,161,0.3)] transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">⭐</span>
                          <h3 className="text-white font-display text-xl group-hover:text-neon-pink transition">RecoveryFanz Community</h3>
                        </div>
                        <p className="text-steel-300 text-sm mb-2">FANZ platform dedicated to recovery support and sobriety</p>
                        <a href="https://recoveryfanz.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">recoveryfanz.com →</a>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="group p-5 rounded-xl bg-ink-800/50 border border-white/10 hover:border-neon-cyan/50 hover:bg-ink-800 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🍃</span>
                        <h3 className="text-white font-display text-lg group-hover:text-neon-cyan transition">AA</h3>
                      </div>
                      <p className="text-steel-300 text-xs mb-2">Alcoholics Anonymous meetings and support</p>
                      <a href="https://www.aa.org" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:text-glow transition text-xs font-mono">aa.org</a>
                    </div>

                    <div className="group p-5 rounded-xl bg-ink-800/50 border border-white/10 hover:border-neon-cyan/50 hover:bg-ink-800 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">💪</span>
                        <h3 className="text-white font-display text-lg group-hover:text-neon-cyan transition">NA</h3>
                      </div>
                      <p className="text-steel-300 text-xs mb-2">Narcotics Anonymous drug recovery support</p>
                      <a href="https://www.na.org" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:text-glow transition text-xs font-mono">na.org</a>
                    </div>

                    <div className="group p-5 rounded-xl bg-ink-800/50 border border-white/10 hover:border-acid-lime/50 hover:bg-ink-800 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🔬</span>
                        <h3 className="text-white font-display text-lg group-hover:text-acid-lime transition">SMART Recovery</h3>
                      </div>
                      <p className="text-steel-300 text-xs mb-2">Science-based addiction recovery</p>
                      <a href="https://www.smartrecovery.org" target="_blank" rel="noopener noreferrer" className="text-acid-lime hover:text-glow transition text-xs font-mono">smartrecovery.org</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LGBTQ+ Resources - Enhanced */}
            <div className="relative p-10 rounded-3xl bg-ink-900/80 border border-neon-pink/30 backdrop-blur-md mb-12 hover:border-neon-pink/50 transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/5 via-neon-cyan/5 to-acid-lime/5 rounded-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-5xl">🏳️‍🌈</span>
                  <h2 className="font-display text-4xl text-white text-glow">LGBTQ+ Support</h2>
                </div>

                <div className="space-y-4">
                  <div className="group p-6 rounded-xl bg-ink-800/50 border border-neon-pink/30 hover:border-neon-pink hover:shadow-[0_0_15px_rgba(255,45,161,0.2)] transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">💛</span>
                          <h3 className="text-white font-display text-xl group-hover:text-neon-pink transition">The Trevor Project</h3>
                        </div>
                        <p className="text-steel-300 text-sm mb-3">Crisis intervention for LGBTQ+ youth (ages 13-24)</p>
                        <div className="flex flex-wrap gap-3">
                          <div className="px-4 py-2 rounded-lg bg-neon-pink/10 border border-neon-pink/50">
                            <p className="text-neon-pink font-mono font-bold">Call: 1-866-488-7386</p>
                          </div>
                          <div className="px-4 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/50">
                            <p className="text-neon-cyan font-mono font-bold">Text: START to 678-678</p>
                          </div>
                        </div>
                      </div>
                      <span className="text-4xl">☎️</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group p-6 rounded-xl bg-ink-800/50 border border-neon-cyan/30 hover:border-neon-cyan hover:bg-ink-800 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">🏳️‍⚧️</span>
                        <h3 className="text-white font-display text-xl group-hover:text-neon-cyan transition">Trans Lifeline</h3>
                      </div>
                      <p className="text-steel-300 text-sm mb-3">Peer support hotline for transgender community</p>
                      <div className="space-y-2">
                        <div className="px-3 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
                          <p className="text-neon-cyan font-mono text-sm">US: 1-877-565-8860</p>
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
                          <p className="text-neon-cyan font-mono text-sm">CA: 1-877-330-6366</p>
                        </div>
                      </div>
                    </div>

                    <div className="group p-6 rounded-xl bg-ink-800/50 border border-acid-lime/30 hover:border-acid-lime hover:bg-ink-800 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">🌈</span>
                        <h3 className="text-white font-display text-xl group-hover:text-acid-lime transition">PFLAG</h3>
                      </div>
                      <p className="text-steel-300 text-sm mb-3">Support for LGBTQ+ people and their families</p>
                      <a href="https://pflag.org" target="_blank" rel="noopener noreferrer" className="text-acid-lime hover:text-glow transition font-mono">pflag.org →</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Domestic Violence & Sexual Assault - Enhanced */}
            <div className="relative p-10 rounded-3xl bg-ink-900/80 border-2 border-neon-pink/40 backdrop-blur-md mb-12 hover:border-neon-pink/60 hover:shadow-[0_0_30px_rgba(255,45,161,0.2)] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/5 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-5xl">🛡️</span>
                  <h2 className="font-display text-4xl text-white text-glow">Domestic Violence & Sexual Assault</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group p-6 rounded-xl bg-gradient-to-br from-ink-800 to-ink-900 border border-neon-pink/40 hover:border-neon-pink hover:shadow-[0_0_20px_rgba(255,45,161,0.3)] transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">💜</span>
                          <h3 className="text-white font-display text-xl group-hover:text-neon-pink transition">National DV Hotline</h3>
                        </div>
                        <p className="text-steel-300 text-sm mb-4">24/7 confidential support</p>
                        <div className="space-y-2">
                          <div className="px-4 py-2 rounded-lg bg-neon-pink/10 border border-neon-pink/50">
                            <p className="text-neon-pink font-mono font-bold">Call: 1-800-799-7233</p>
                          </div>
                          <div className="px-4 py-2 rounded-lg bg-neon-pink/10 border border-neon-pink/50">
                            <p className="text-neon-pink font-mono font-bold">Text: START to 88788</p>
                          </div>
                        </div>
                      </div>
                      <span className="text-4xl">📞</span>
                    </div>
                  </div>

                  <div className="group p-6 rounded-xl bg-gradient-to-br from-ink-800 to-ink-900 border border-neon-cyan/40 hover:border-neon-cyan hover:shadow-[0_0_20px_rgba(25,240,255,0.3)] transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">🫂</span>
                          <h3 className="text-white font-display text-xl group-hover:text-neon-cyan transition">RAINN</h3>
                        </div>
                        <p className="text-steel-300 text-sm mb-4">National Sexual Assault Hotline</p>
                        <div className="px-4 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/50 mb-2">
                          <p className="text-neon-cyan font-mono font-bold">Call: 1-800-656-4673</p>
                        </div>
                        <p className="text-steel-300 text-xs">Online Chat: <a href="https://hotline.rainn.org" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:text-glow transition">hotline.rainn.org</a></p>
                      </div>
                      <span className="text-4xl">💬</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sex Worker Support - Enhanced */}
            <div className="relative p-10 rounded-3xl bg-ink-900/80 border border-acid-lime/30 backdrop-blur-md mb-12 hover:border-acid-lime/50 transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-tl from-acid-lime/5 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-5xl">✊</span>
                  <h2 className="font-display text-4xl text-white text-glow">Sex Worker Support & Resources</h2>
                </div>

                <div className="space-y-4">
                  <div className="group p-6 rounded-xl bg-gradient-to-r from-neon-pink/10 via-ink-800/50 to-ink-800/50 border border-neon-pink/40 hover:border-neon-pink hover:shadow-[0_0_15px_rgba(255,45,161,0.3)] transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">🆘</span>
                          <h3 className="text-white font-display text-xl group-hover:text-neon-pink transition">National Human Trafficking Hotline</h3>
                        </div>
                        <p className="text-steel-300 text-sm mb-3">24/7 confidential support in 200+ languages</p>
                        <div className="flex gap-3 flex-wrap">
                          <div className="px-4 py-2 rounded-lg bg-neon-pink/10 border border-neon-pink/50">
                            <p className="text-neon-pink font-mono font-bold">Call: 1-888-373-7888</p>
                          </div>
                          <div className="px-4 py-2 rounded-lg bg-neon-pink/10 border border-neon-pink/50">
                            <p className="text-neon-pink font-mono font-bold">Text: 233733</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group p-6 rounded-xl bg-ink-800/50 border border-acid-lime/30 hover:border-acid-lime hover:bg-ink-800 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">📢</span>
                        <h3 className="text-white font-display text-xl group-hover:text-acid-lime transition">SWOP</h3>
                      </div>
                      <p className="text-steel-300 text-sm mb-2">Sex Workers Outreach Project - Advocacy and support</p>
                      <a href="https://swopusa.org" target="_blank" rel="noopener noreferrer" className="text-acid-lime hover:text-glow transition font-mono">swopusa.org →</a>
                    </div>

                    <div className="group p-6 rounded-xl bg-ink-800/50 border border-neon-cyan/30 hover:border-neon-cyan hover:bg-ink-800 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">🤝</span>
                        <h3 className="text-white font-display text-xl group-hover:text-neon-cyan transition">Desiree Alliance</h3>
                      </div>
                      <p className="text-steel-300 text-sm mb-2">Sex worker-led advocacy organization</p>
                      <a href="https://www.desireealliance.org" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:text-glow transition font-mono">desireealliance.org →</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Assistance & Healthcare - Enhanced */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="relative p-8 rounded-3xl bg-ink-900/80 border border-neon-cyan/30 backdrop-blur-md hover:border-neon-cyan/50 transition-colors duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-4xl">💰</span>
                    <h2 className="font-display text-3xl text-white text-glow">Financial Assistance</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="group p-5 rounded-xl bg-ink-800/50 border border-neon-cyan/30 hover:border-neon-cyan hover:bg-ink-800 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🆘</span>
                        <h3 className="text-white font-display text-lg group-hover:text-neon-cyan transition">211 (United Way)</h3>
                      </div>
                      <p className="text-steel-300 text-sm mb-2">Housing, food, utilities, healthcare</p>
                      <div className="px-3 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 inline-block">
                        <p className="text-neon-cyan font-mono font-bold">Dial: 211</p>
                      </div>
                    </div>

                    <div className="group p-5 rounded-xl bg-ink-800/50 border border-white/10 hover:border-neon-cyan/50 hover:bg-ink-800 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🤲</span>
                        <h3 className="text-white font-display text-lg group-hover:text-neon-cyan transition">Modest Needs</h3>
                      </div>
                      <p className="text-steel-300 text-sm mb-2">Short-term financial assistance for emergencies</p>
                      <a href="https://www.modestneeds.org" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:text-glow transition font-mono text-sm">modestneeds.org →</a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative p-8 rounded-3xl bg-ink-900/80 border border-acid-lime/30 backdrop-blur-md hover:border-acid-lime/50 transition-colors duration-300">
                <div className="absolute inset-0 bg-gradient-to-tl from-acid-lime/5 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-4xl">🏥</span>
                    <h2 className="font-display text-3xl text-white text-glow">Healthcare Access</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="group p-5 rounded-xl bg-ink-800/50 border border-acid-lime/30 hover:border-acid-lime hover:bg-ink-800 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">💊</span>
                        <h3 className="text-white font-display text-lg group-hover:text-acid-lime transition">Planned Parenthood</h3>
                      </div>
                      <p className="text-steel-300 text-sm mb-2">Sexual health, STI testing, reproductive healthcare</p>
                      <a href="https://www.plannedparenthood.org" target="_blank" rel="noopener noreferrer" className="text-acid-lime hover:text-glow transition font-mono text-sm">plannedparenthood.org →</a>
                    </div>

                    <div className="group p-5 rounded-xl bg-ink-800/50 border border-white/10 hover:border-acid-lime/50 hover:bg-ink-800 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🩺</span>
                        <h3 className="text-white font-display text-lg group-hover:text-acid-lime transition">HRSA Health Centers</h3>
                      </div>
                      <p className="text-steel-300 text-sm mb-2">Find affordable healthcare near you</p>
                      <a href="https://findahealthcenter.hrsa.gov" target="_blank" rel="noopener noreferrer" className="text-acid-lime hover:text-glow transition font-mono text-sm">findahealthcenter.hrsa.gov →</a>
                    </div>

                    <div className="group p-5 rounded-xl bg-ink-800/50 border border-white/10 hover:border-acid-lime/50 hover:bg-ink-800 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">💉</span>
                        <h3 className="text-white font-display text-lg group-hover:text-acid-lime transition">RxAssist</h3>
                      </div>
                      <p className="text-steel-300 text-sm mb-2">Patient assistance for prescription medications</p>
                      <a href="https://www.rxassist.org" target="_blank" rel="noopener noreferrer" className="text-acid-lime hover:text-glow transition font-mono text-sm">rxassist.org →</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FANZ Support - Enhanced */}
            <div className="relative p-10 rounded-3xl bg-gradient-to-br from-neon-pink/10 via-ink-900/80 to-neon-cyan/10 border-2 border-neon-pink/50 backdrop-blur-md shadow-[0_0_40px_rgba(255,45,161,0.3)]">
              <div className="absolute inset-0 bg-grid opacity-[.05] rounded-3xl pointer-events-none" style={{ backgroundSize: '20px 20px' }}></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl">💜</span>
                  <h2 className="font-display text-4xl text-white text-glow">FANZ Support</h2>
                </div>
                <p className="text-steel-300 mb-6 text-lg">
                  If you need assistance or have questions about platform resources, our team is here to help.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-xl bg-ink-900/50 border border-neon-pink/30">
                    <p className="text-steel-300 text-sm mb-1">Email Support</p>
                    <a href="mailto:support@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono font-bold">support@fanzunlimited.com</a>
                  </div>
                  <div className="p-5 rounded-xl bg-ink-900/50 border border-neon-cyan/30">
                    <p className="text-steel-300 text-sm mb-1">Phone Support</p>
                    <p className="text-neon-cyan font-mono font-bold">(945) 998-9033</p>
                  </div>
                  <div className="p-5 rounded-xl bg-ink-900/50 border border-white/20">
                    <p className="text-steel-300 text-sm mb-1">Mailing Address</p>
                    <p className="text-white font-mono text-sm">30 N Gould St #45302<br/>Sheridan, WY 82801</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
