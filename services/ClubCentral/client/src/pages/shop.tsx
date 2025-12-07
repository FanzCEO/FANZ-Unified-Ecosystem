import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ShoppingBag, Plus, Package, Download, Truck, DollarSign, Edit, Trash2 } from "lucide-react";

export default function Shop() {
  const { user } = useAuth();
  const [showCreateProduct, setShowCreateProduct] = useState(false);

  // Simulated products
  const products = [
    {
      id: 1,
      name: "Exclusive Photo Set",
      description: "50 high-resolution photos from my latest shoot",
      type: "digital",
      price: 19.99,
      imageUrl: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=400",
      sales: 145,
    },
    {
      id: 2,
      name: "Branded T-Shirt",
      description: "Premium quality cotton tee with my logo",
      type: "physical",
      price: 29.99,
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
      sales: 89,
    },
    {
      id: 3,
      name: "Video Bundle",
      description: "Collection of 10 exclusive videos",
      type: "digital",
      price: 49.99,
      imageUrl: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=400",
      sales: 234,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white cyber-grid relative overflow-hidden">
      <div className="scan-line"></div>
      <Sidebar />
      <MobileNav />

      <div className="lg:pl-64 pb-20 lg:pb-0">
        {/* Header */}
        <header className="neon-card border-b border-primary/20 backdrop-blur-sm bg-black/50 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary neon-text text-glow-animated flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" />
                My Shop
              </h1>
              <p className="text-sm text-secondary">
                Sell digital content and physical merchandise
              </p>
            </div>
            <Button
              onClick={() => setShowCreateProduct(true)}
              variant="gradient"
              className="neon-glow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold text-foreground">{products.length}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold text-foreground">468</p>
                  </div>
                  <div className="bg-secondary/10 p-3 rounded-lg">
                    <ShoppingBag className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold text-foreground">$14,352</p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Orders</p>
                    <p className="text-2xl font-bold text-foreground">7</p>
                  </div>
                  <div className="bg-orange-500/10 p-3 rounded-lg">
                    <Truck className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Types Filter */}
          <div className="flex gap-3 mb-6">
            <Button variant="gradient" className="neon-glow">
              All Products
            </Button>
            <Button variant="neon-outline">
              <Download className="w-4 h-4 mr-2" />
              Digital
            </Button>
            <Button variant="neon-outline">
              <Package className="w-4 h-4 mr-2" />
              Physical
            </Button>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="bg-card border-border neon-card overflow-hidden group">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      product.type === "digital"
                        ? "bg-primary text-black"
                        : "bg-secondary text-black"
                    }`}>
                      {product.type === "digital" ? (
                        <><Download className="w-3 h-3 inline mr-1" />Digital</>
                      ) : (
                        <><Package className="w-3 h-3 inline mr-1" />Physical</>
                      )}
                    </span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-primary">${product.price}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.sales} sales
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="neon-outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Create Product Modal (simplified) */}
          {showCreateProduct && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-2xl bg-card border-border neon-card">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Product Name</label>
                      <Input placeholder="Enter product name..." className="bg-input border-border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <Textarea placeholder="Describe your product..." className="bg-input border-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Price ($)</label>
                        <Input type="number" placeholder="9.99" className="bg-input border-border" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Type</label>
                        <select className="w-full px-3 py-2 bg-input border border-border rounded-md">
                          <option>Digital</option>
                          <option>Physical</option>
                          <option>Dropship</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="gradient" className="flex-1 neon-glow">
                        Create Product
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreateProduct(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
