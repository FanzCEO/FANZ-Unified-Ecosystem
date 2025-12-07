import { Button } from "@/components/ui/button";
import { FolderSync, Music, Video, Gamepad2 } from "lucide-react";
import { type FanzBrand } from "@shared/schema";

interface FanzBrandsIntegrationProps {
  fanzBrands: FanzBrand[];
}

const getBrandIcon = (brandName: string) => {
  const icons = {
    FanzMusic: Music,
    FanzVideo: Video,
    FanzGaming: Gamepad2,
  };
  return icons[brandName as keyof typeof icons] || Music;
};

export function FanzBrandsIntegration({ fanzBrands }: FanzBrandsIntegrationProps) {
  return (
    <section className="mb-12">
      <div className="bg-gradient-primary rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2" data-testid="text-fanz-brands-title">
            FolderSync with Fanz Brands
          </h2>
          <p className="text-white/80 mb-6">
            Connect your FanzLink with all your Fanz Brand accounts for seamless management
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {fanzBrands.map((brand) => {
              const IconComponent = getBrandIcon(brand.brandName);
              
              return (
                <div 
                  key={brand.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
                  data-testid={`card-brand-${brand.brandName.toLowerCase()}`}
                >
                  <IconComponent className="text-2xl mb-2" />
                  <h4 className="font-semibold" data-testid={`text-brand-name-${brand.brandName.toLowerCase()}`}>
                    {brand.brandName}
                  </h4>
                  <p className="text-sm text-white/70" data-testid={`text-brand-status-${brand.brandName.toLowerCase()}`}>
                    {brand.isConnected === "true" ? "Connected" : "Not Connected"}
                  </p>
                </div>
              );
            })}
          </div>
          
          <Button 
            className="bg-white text-fanz-purple px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            data-testid="button-sync-brands"
          >
            <FolderSync className="mr-2 h-4 w-4" />
            FolderSync All Brands
          </Button>
        </div>
      </div>
    </section>
  );
}
