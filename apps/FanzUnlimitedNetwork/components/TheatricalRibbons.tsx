'use client';

export default function TheatricalRibbons() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
      {/* Diagonal ribbon - top left to bottom right - Pink */}
      <div
        className="absolute w-[200vw] h-[40px] opacity-20"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #FF2DA1 20%, #FF2DA1 80%, transparent 100%)',
          boxShadow: '0 0 30px rgba(255, 45, 161, 0.6), 0 0 60px rgba(255, 45, 161, 0.3)',
          transform: 'rotate(25deg) translateX(-50%)',
          top: '15%',
          left: '-50%',
          animation: 'ribbon-slide-right 25s linear infinite',
        }}
      />

      {/* Diagonal ribbon - top right to bottom left - Cyan */}
      <div
        className="absolute w-[200vw] h-[35px] opacity-15"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #19F0FF 20%, #19F0FF 80%, transparent 100%)',
          boxShadow: '0 0 30px rgba(25, 240, 255, 0.6), 0 0 60px rgba(25, 240, 255, 0.3)',
          transform: 'rotate(-20deg) translateX(50%)',
          top: '35%',
          right: '-50%',
          animation: 'ribbon-slide-left 30s linear infinite',
        }}
      />

      {/* Diagonal ribbon - middle - Lime */}
      <div
        className="absolute w-[200vw] h-[30px] opacity-12"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #C8FF3D 20%, #C8FF3D 80%, transparent 100%)',
          boxShadow: '0 0 30px rgba(200, 255, 61, 0.6), 0 0 60px rgba(200, 255, 61, 0.3)',
          transform: 'rotate(15deg) translateX(-50%)',
          top: '55%',
          left: '-50%',
          animation: 'ribbon-slide-right 35s linear infinite',
        }}
      />

      {/* Diagonal ribbon - bottom - Pink/Cyan Gradient */}
      <div
        className="absolute w-[200vw] h-[45px] opacity-18"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #FF2DA1 20%, #19F0FF 50%, #FF2DA1 80%, transparent 100%)',
          boxShadow: '0 0 40px rgba(255, 45, 161, 0.5), 0 0 80px rgba(25, 240, 255, 0.4)',
          transform: 'rotate(-25deg) translateX(50%)',
          bottom: '15%',
          right: '-50%',
          animation: 'ribbon-slide-left 28s linear infinite',
        }}
      />

      {/* Horizontal ribbon - top - Gradient */}
      <div
        className="absolute w-full h-[25px] opacity-10"
        style={{
          background: 'linear-gradient(90deg, #FF2DA1 0%, #19F0FF 50%, #C8FF3D 100%)',
          boxShadow: '0 0 30px rgba(255, 45, 161, 0.4)',
          top: '0',
          animation: 'ribbon-pulse 4s ease-in-out infinite',
        }}
      />

      {/* Vertical accent ribbon - left side */}
      <div
        className="absolute w-[30px] h-[150vh] opacity-8"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #19F0FF 30%, #FF2DA1 70%, transparent 100%)',
          boxShadow: '0 0 40px rgba(25, 240, 255, 0.5)',
          left: '10%',
          top: '-25%',
          animation: 'ribbon-slide-down 40s linear infinite',
        }}
      />

      {/* Vertical accent ribbon - right side */}
      <div
        className="absolute w-[25px] h-[150vh] opacity-8"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #C8FF3D 30%, #FF2DA1 70%, transparent 100%)',
          boxShadow: '0 0 40px rgba(200, 255, 61, 0.5)',
          right: '15%',
          top: '-25%',
          animation: 'ribbon-slide-down 45s linear infinite',
          animationDelay: '5s',
        }}
      />
    </div>
  );
}
