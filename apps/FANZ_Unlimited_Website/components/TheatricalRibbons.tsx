'use client';

export default function TheatricalRibbons() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
      {/* Diagonal ribbon - top left to bottom right - Pink Glass */}
      <div
        className="absolute w-[200vw] h-[40px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 45, 161, 0.12) 20%, rgba(255, 45, 161, 0.15) 50%, rgba(255, 45, 161, 0.12) 80%, transparent 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 45, 161, 0.2)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 20px rgba(255, 45, 161, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          transform: 'rotate(25deg) translateX(-50%)',
          top: '15%',
          left: '-50%',
          animation: 'ribbon-slide-right 25s linear infinite',
        }}
      />

      {/* Diagonal ribbon - top right to bottom left - Cyan Glass */}
      <div
        className="absolute w-[200vw] h-[35px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(25, 240, 255, 0.12) 20%, rgba(25, 240, 255, 0.15) 50%, rgba(25, 240, 255, 0.12) 80%, transparent 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(25, 240, 255, 0.2)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 20px rgba(25, 240, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          transform: 'rotate(-20deg) translateX(50%)',
          top: '35%',
          right: '-50%',
          animation: 'ribbon-slide-left 30s linear infinite',
        }}
      />

      {/* Diagonal ribbon - middle - Lime Glass */}
      <div
        className="absolute w-[200vw] h-[30px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(200, 255, 61, 0.12) 20%, rgba(200, 255, 61, 0.15) 50%, rgba(200, 255, 61, 0.12) 80%, transparent 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(200, 255, 61, 0.2)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 20px rgba(200, 255, 61, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          transform: 'rotate(15deg) translateX(-50%)',
          top: '55%',
          left: '-50%',
          animation: 'ribbon-slide-right 35s linear infinite',
        }}
      />

      {/* Diagonal ribbon - bottom - Pink/Cyan Gradient Glass */}
      <div
        className="absolute w-[200vw] h-[45px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 45, 161, 0.12) 20%, rgba(25, 240, 255, 0.15) 50%, rgba(255, 45, 161, 0.12) 80%, transparent 100%)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 45, 161, 0.2)',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 0 25px rgba(255, 45, 161, 0.15), 0 0 40px rgba(25, 240, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          transform: 'rotate(-25deg) translateX(50%)',
          bottom: '15%',
          right: '-50%',
          animation: 'ribbon-slide-left 28s linear infinite',
        }}
      />

      {/* Horizontal ribbon - top - Rainbow Gradient Glass */}
      <div
        className="absolute w-full h-[25px]"
        style={{
          background: 'linear-gradient(90deg, rgba(255, 45, 161, 0.1) 0%, rgba(25, 240, 255, 0.12) 50%, rgba(200, 255, 61, 0.1) 100%)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 0 15px rgba(255, 45, 161, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          top: '0',
          animation: 'ribbon-pulse 4s ease-in-out infinite',
        }}
      />

      {/* Vertical accent ribbon - left side - Cyan/Pink Glass */}
      <div
        className="absolute w-[30px] h-[150vh]"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(25, 240, 255, 0.1) 30%, rgba(255, 45, 161, 0.12) 70%, transparent 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(25, 240, 255, 0.15)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 20px rgba(25, 240, 255, 0.12), inset 1px 0 0 rgba(255, 255, 255, 0.1)',
          left: '10%',
          top: '-25%',
          animation: 'ribbon-slide-down 40s linear infinite',
        }}
      />

      {/* Vertical accent ribbon - right side - Lime/Pink Glass */}
      <div
        className="absolute w-[25px] h-[150vh]"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(200, 255, 61, 0.1) 30%, rgba(255, 45, 161, 0.12) 70%, transparent 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(200, 255, 61, 0.15)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 20px rgba(200, 255, 61, 0.12), inset 1px 0 0 rgba(255, 255, 255, 0.1)',
          right: '15%',
          top: '-25%',
          animation: 'ribbon-slide-down 45s linear infinite',
          animationDelay: '5s',
        }}
      />
    </div>
  );
}
