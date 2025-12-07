import { useState, useEffect } from "react";

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 1,
    hours: 12,
    minutes: 48,
    seconds: 7
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev;
        
        // Countdown logic
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
          seconds = 59;
        } else {
          // Reset when countdown reaches zero
          days = 1;
          hours = 12;
          minutes = 48;
          seconds = 7;
        }
        
        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex items-center space-x-2 text-sm font-mono" data-testid="countdown-timer">
      <div className="bg-black/20 px-2 py-1 rounded" data-testid="countdown-days">
        <span>{formatNumber(timeLeft.days)}</span>
        <span className="text-xs block">DAYS</span>
      </div>
      <div className="bg-black/20 px-2 py-1 rounded" data-testid="countdown-hours">
        <span>{formatNumber(timeLeft.hours)}</span>
        <span className="text-xs block">HOURS</span>
      </div>
      <div className="bg-black/20 px-2 py-1 rounded" data-testid="countdown-minutes">
        <span>{formatNumber(timeLeft.minutes)}</span>
        <span className="text-xs block">MIN</span>
      </div>
      <div className="bg-black/20 px-2 py-1 rounded" data-testid="countdown-seconds">
        <span>{formatNumber(timeLeft.seconds)}</span>
        <span className="text-xs block">SEC</span>
      </div>
    </div>
  );
}
