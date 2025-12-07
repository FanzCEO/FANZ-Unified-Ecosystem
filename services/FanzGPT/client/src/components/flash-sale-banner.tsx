import { CountdownTimer } from "./countdown-timer";

export function FlashSaleBanner() {
  return (
    <section className="bg-gradient-to-r from-destructive via-primary to-secondary py-3" data-testid="flash-sale-banner">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center space-x-4 text-white">
          <i className="fas fa-fire animate-pulse"></i>
          <span className="font-bold" data-testid="flash-sale-text">FLASH SALE!</span>
          <CountdownTimer />
          <a 
            href="#pricing" 
            className="bg-white text-black px-4 py-1 rounded font-semibold text-sm hover:bg-gray-100 transition-colors"
            data-testid="button-see-deals"
          >
            See Deals
          </a>
        </div>
      </div>
    </section>
  );
}
