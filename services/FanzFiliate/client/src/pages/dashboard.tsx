import StatsOverview from "@/components/dashboard/stats-overview";
import OfferMarketplace from "@/components/dashboard/offer-marketplace";
import QuickActions from "@/components/dashboard/quick-actions";
import PayoutInfo from "@/components/dashboard/payout-info";
import RecentActivity from "@/components/dashboard/recent-activity";
import CompetitiveAdvantages from "@/components/dashboard/competitive-advantages";
import FunEcosystem from "@/components/dashboard/fun-ecosystem";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6" data-testid="dashboard-page">
      <StatsOverview />
      
      <CompetitiveAdvantages />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OfferMarketplace />
        </div>
        
        <div className="space-y-6">
          <QuickActions />
          <PayoutInfo />
        </div>
      </div>
      
      <FunEcosystem />
      
      <RecentActivity />
    </div>
  );
}
