'use client';

import { useState } from 'react';
import { FanzAd, AdAnalytics, WhyThisAd } from '@fanz/ads-client';

export default function DemoPage() {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showWhyAd, setShowWhyAd] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Header with ad placement */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              FANZ Ads Demo
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAnalytics(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                View Analytics
              </button>
              <button
                onClick={() => setShowWhyAd(true)}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Why This Ad?
              </button>
            </div>
          </div>
        </div>
        
        {/* Header Ad Placement */}
        <div className="border-t border-gray-800 bg-gray-900 p-4">
          <div className="container mx-auto">
            <FanzAd 
              placement="HEADER" 
              className="rounded-lg overflow-hidden"
            />
          </div>
        </div>
      </header>

      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-4">
        {/* Main Content Area */}
        <main className="lg:col-span-3 p-6">
          {/* Homepage Hero Ad */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Homepage Hero</h2>
            <FanzAd 
              placement="HOMEPAGE_HERO"
              className="rounded-xl overflow-hidden shadow-lg"
            />
          </section>

          {/* Sample content with native ad */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Content Feed</h2>
            <div className="grid gap-6">
              {/* Sample content cards */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg bg-gray-800 p-6">
                  <h3 className="mb-2 text-lg font-medium">Sample Content {i}</h3>
                  <p className="text-gray-400">
                    This is placeholder content to demonstrate the ad placement system.
                    In a real FANZ platform, this would be creator content, posts, or media.
                  </p>
                </div>
              ))}

              {/* Native Ad Placement */}
              <div className="rounded-lg border-2 border-dashed border-gray-600 p-4">
                <p className="mb-4 text-sm text-gray-400">Homepage Native Ad Placement:</p>
                <FanzAd 
                  placement="HOMEPAGE_NATIVE"
                  className="rounded-lg overflow-hidden"
                />
              </div>

              {/* More sample content */}
              {[4, 5, 6].map((i) => (
                <div key={i} className="rounded-lg bg-gray-800 p-6">
                  <h3 className="mb-2 text-lg font-medium">Sample Content {i}</h3>
                  <p className="text-gray-400">
                    More placeholder content. This demonstrates how ads integrate naturally
                    within content feeds across FANZ platforms.
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Dashboard Widget Demo */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Dashboard Widget Area</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-gray-800 p-4">
                <h3 className="mb-2 font-medium">Creator Stats</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>Views: 12,345</div>
                  <div>Earnings: $1,234</div>
                  <div>Subscribers: 567</div>
                </div>
              </div>
              
              <div className="rounded-lg bg-gray-800 p-4">
                <h3 className="mb-2 font-medium">Recent Activity</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>New subscriber</div>
                  <div>Tip received</div>
                  <div>Content liked</div>
                </div>
              </div>

              {/* Dashboard Widget Ad */}
              <div className="rounded-lg border border-gray-600 p-2">
                <p className="mb-2 text-xs text-gray-500">Dashboard Widget Ad:</p>
                <FanzAd 
                  placement="DASHBOARD_WIDGET"
                  className="rounded overflow-hidden"
                />
              </div>
            </div>
          </section>
        </main>

        {/* Sidebar with Side Panel Ad */}
        <aside className="border-l border-gray-800 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Sidebar</h2>
          
          {/* Side Panel Ad */}
          <div className="mb-6">
            <p className="mb-2 text-sm text-gray-400">Side Panel Ad:</p>
            <FanzAd 
              placement="SIDEPANEL"
              className="rounded-lg overflow-hidden shadow-lg"
            />
          </div>

          {/* Sidebar content */}
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-800 p-4">
              <h3 className="mb-2 font-medium">Trending</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Trending Topic 1</div>
                <div>Trending Topic 2</div>
                <div>Trending Topic 3</div>
              </div>
            </div>
            
            <div className="rounded-lg bg-gray-800 p-4">
              <h3 className="mb-2 font-medium">Suggestions</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Suggested Creator 1</div>
                <div>Suggested Creator 2</div>
                <div>Suggested Creator 3</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer with ad placement */}
      <footer className="border-t border-gray-800 bg-gray-900 p-6">
        <div className="container mx-auto">
          <div className="mb-4">
            <p className="text-sm text-gray-400">Footer Ad:</p>
            <FanzAd 
              placement="FOOTER"
              className="rounded-lg overflow-hidden"
            />
          </div>
          
          <div className="flex flex-col gap-4 text-center text-sm text-gray-500 sm:flex-row sm:justify-between">
            <p>© 2024 FANZ Network. All rights reserved.</p>
            <div className="flex justify-center gap-4 sm:justify-end">
              <a href="#" className="hover:text-gray-300">Privacy</a>
              <a href="#" className="hover:text-gray-300">Terms</a>
              <a href="#" className="hover:text-gray-300">Support</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-4xl w-full rounded-xl bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Ad Analytics</h2>
              <button
                onClick={() => setShowAnalytics(false)}
                className="rounded-lg border border-gray-600 px-3 py-1 text-sm hover:bg-gray-800"
              >
                Close
              </button>
            </div>
            <AdAnalytics />
          </div>
        </div>
      )}

      {/* Why This Ad Modal */}
      {showWhyAd && (
        <WhyThisAd
          adId="demo-ad"
          onClose={() => setShowWhyAd(false)}
        />
      )}
    </div>
  );
}