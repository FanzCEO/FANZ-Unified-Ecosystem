import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            FANZ Ecosystem
          </h1>
          <p className="text-2xl text-gray-300 mb-8">
            TailwindCSS 4 + React 19 Setup Complete
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
            Testing TailwindCSS 4 with modern gradient, backdrop blur, and responsive design utilities.
          </p>
        </div>

        {/* Test Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center hover:bg-white/20 transition-all duration-300 border border-white/20">
            <div className="text-3xl mb-3">🚀</div>
            <div className="text-white text-lg font-semibold mb-2">TailwindCSS 4</div>
            <div className="text-gray-300 text-sm">Modern utility-first CSS framework</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center hover:bg-white/20 transition-all duration-300 border border-white/20">
            <div className="text-3xl mb-3">⚛️</div>
            <div className="text-white text-lg font-semibold mb-2">React 19</div>
            <div className="text-gray-300 text-sm">Latest React with concurrent features</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center hover:bg-white/20 transition-all duration-300 border border-white/20">
            <div className="text-3xl mb-3">⚡</div>
            <div className="text-white text-lg font-semibold mb-2">Vite 6</div>
            <div className="text-gray-300 text-sm">Lightning fast build tool</div>
          </div>
        </div>

        {/* Test Button */}
        <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
          Setup Complete! 🎉
        </button>

        {/* Status Grid */}
        <div className="grid grid-cols-3 gap-8 mt-16 text-center">
          <div>
            <div className="text-3xl font-bold text-white">✅</div>
            <div className="text-gray-400 text-sm">TailwindCSS 4</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">✅</div>
            <div className="text-gray-400 text-sm">BabylonJS 8.27</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">✅</div>
            <div className="text-gray-400 text-sm">React 19.1</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App