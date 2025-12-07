import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { ProfileSection } from "@/components/profile-section";
import { FanzCommerceShowcase } from "@/components/fanz-commerce-showcase";
import { SocialLinksGrid } from "@/components/social-links-grid";
import { FanzBrandsIntegration } from "@/components/fanz-brands-integration";
import { AnalyticsPanel } from "@/components/analytics-panel";
import { Footer } from "@/components/footer";
import { type User, type SocialLink, type Product, type Analytics, type FanzBrand } from "@shared/schema";

export default function Home() {
  // In a real app, you'd get the username from the URL or auth context
  const username = "alexrivera";

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user", username],
  });

  const { data: socialLinks = [], isLoading: socialLinksLoading } = useQuery<SocialLink[]>({
    queryKey: ["/api/social-links", user?.id],
    enabled: !!user?.id,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", user?.id],
    enabled: !!user?.id,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ["/api/analytics", user?.id],
    enabled: !!user?.id,
  });

  const { data: fanzBrands = [], isLoading: fanzBrandsLoading } = useQuery<FanzBrand[]>({
    queryKey: ["/api/fanz-brands", user?.id],
    enabled: !!user?.id,
  });

  if (userLoading || socialLinksLoading || productsLoading || analyticsLoading || fanzBrandsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-fanz-purple" data-testid="loading-spinner"></div>
      </div>
    );
  }

  if (!user || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User not found</h1>
          <p className="text-gray-600 dark:text-gray-300">The requested profile could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ProfileSection user={user} analytics={analytics} />
        <FanzCommerceShowcase products={products} />
        <SocialLinksGrid socialLinks={socialLinks} userId={user.id} />
        <FanzBrandsIntegration fanzBrands={fanzBrands} />
        <AnalyticsPanel analytics={analytics} />
      </main>
      
      <Footer />
    </div>
  );
}
