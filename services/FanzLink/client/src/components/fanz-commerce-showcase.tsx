import { Button } from "@/components/ui/button";
import { Store, ArrowRight } from "lucide-react";
import { type Product } from "@shared/schema";

interface FanzCommerceShowcaseProps {
  products: Product[];
}

export function FanzCommerceShowcase({ products }: FanzCommerceShowcaseProps) {
  return (
    <section className="mb-12">
      <div className="bg-white dark:bg-dark-card rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-dark-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Store className="mr-3 text-fanz-purple" data-testid="icon-store" />
              My FanzCommerce Store
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Discover my latest products and exclusive items
            </p>
          </div>
          <Button className="bg-gradient-primary text-white hover:shadow-lg transition-all duration-200" data-testid="button-view-all-products">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div 
              key={product.id}
              className="card-hover bg-gray-50 dark:bg-dark-border rounded-xl p-4 cursor-pointer"
              data-testid={`card-product-${product.id}`}
            >
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-32 object-cover rounded-lg mb-3"
                data-testid={`img-product-${product.id}`}
              />
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1" data-testid={`text-product-name-${product.id}`}>
                {product.name}
              </h4>
              <p className="text-fanz-purple font-bold" data-testid={`text-product-price-${product.id}`}>
                {product.price}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
