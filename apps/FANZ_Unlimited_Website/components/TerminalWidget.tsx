'use client';

import { useEffect, useState } from 'react';

interface TerminalLine {
  text: string;
  type: 'command' | 'output' | 'success' | 'error';
}

export default function TerminalWidget() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const commands = [
      { cmd: '> initializing neural network...', output: 'DONE', success: true },
      { cmd: '> connecting to blockchain...', output: 'CONNECTED', success: true },
      { cmd: '> loading creator profiles...', output: '1,247 profiles loaded', success: true },
      { cmd: '> verifying ownership rights...', output: '100% VERIFIED', success: true },
      { cmd: '> optimizing revenue streams...', output: 'MAX EFFICIENCY', success: true },
      { cmd: '> syncing payment systems...', output: 'SYNCED', success: true },
      { cmd: '> checking platform status...', output: 'ALL SYSTEMS OPERATIONAL', success: true },
    ];

    let currentIndex = 0;

    const runCommand = () => {
      if (currentIndex >= commands.length) {
        currentIndex = 0;
        setLines([]);
      }

      const { cmd, output, success } = commands[currentIndex];

      // Add command
      setLines((prev) => [...prev, { text: cmd, type: 'command' }]);

      // Add output after delay
      setTimeout(() => {
        setLines((prev) => [
          ...prev,
          { text: output, type: success ? 'success' : 'error' },
        ]);

        currentIndex++;

        // Schedule next command
        setTimeout(runCommand, Math.random() * 3000 + 2000);
      }, Math.random() * 1000 + 500);
    };

    const timeout = setTimeout(runCommand, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className={`fixed bottom-4 left-4 z-[300] font-mono text-xs transition-all duration-300 ${
        isMinimized ? 'w-48' : 'w-80 md:w-96'
      }`}
    >
      {/* Terminal Header */}
      <div className="bg-ink-900/95 border-2 border-neon-cyan/40 rounded-t-lg backdrop-blur-lg">
        <div className="flex items-center justify-between px-3 py-2 border-b border-neon-cyan/20">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-neon-pink/60 animate-pulse"></div>
            <span className="text-neon-cyan text-[10px] font-bold">TERMINAL://FANZ</span>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-steel-400 hover:text-neon-cyan transition-colors"
          >
            {isMinimized ? '▢' : '_'}
          </button>
        </div>

        {/* Terminal Body */}
        {!isMinimized && (
          <div className="p-3 h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-neon-cyan/30 scrollbar-track-transparent">
            <div className="space-y-1">
              {lines.map((line, index) => (
                <div
                  key={index}
                  className={`
                    ${line.type === 'command' ? 'text-steel-300' : ''}
                    ${line.type === 'success' ? 'text-acid-lime text-glow-lime' : ''}
                    ${line.type === 'error' ? 'text-neon-pink text-glow-pink' : ''}
                    animate-fadeIn
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {line.text}
                </div>
              ))}
              {lines.length > 0 && (
                <div className="text-neon-cyan animate-pulse">
                  {'>'}_
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-neon-cyan/20 blur-xl rounded-lg -z-10 animate-pulse-glow"></div>
    </div>
  );
}
