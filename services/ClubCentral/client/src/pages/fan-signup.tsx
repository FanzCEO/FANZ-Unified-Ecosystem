import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Heart, Star, Crown, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function FanSignup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    interests: "",
    favoriteCategories: [] as string[],
  });

  const categories = [
    "Fitness & Health", "Music & Audio", "Art & Design", "Gaming", 
    "Lifestyle", "Comedy", "Education", "Technology", "Food & Cooking",
    "Fashion", "Travel", "Photography", "Adult Content"
  ];

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteCategories: prev.favoriteCategories.includes(category)
        ? prev.favoriteCategories.filter(c => c !== category)
        : [...prev.favoriteCategories, category]
    }));
  };

  const handleSubmit = () => {
    // For now, just redirect to the fan login flow
    window.location.href = '/api/login?type=fan';
  };

  return (
    <div className="min-h-screen bg-black text-white cyber-grid relative overflow-hidden">
      {/* Scanning line animation */}
      <div className="scan-line"></div>

      {/* Header */}
      <header className="border-b border-border/20 backdrop-blur-sm bg-black/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="text-secondary hover:text-secondary/80">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary neon-text" data-testid="text-logo">
              FANZClub
            </h1>
            <Link href="/api/login">
              <Button variant="outline" className="neon-button border-primary text-primary">
                <Crown className="w-4 h-4 mr-2" />
                Creator Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 1 ? 'bg-primary border-primary text-black' : 'border-gray-600 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-12 h-1 ${step > 1 ? 'bg-primary' : 'bg-gray-600'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 2 ? 'bg-primary border-primary text-black' : 'border-gray-600 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-12 h-1 ${step > 2 ? 'bg-primary' : 'bg-gray-600'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 3 ? 'bg-primary border-primary text-black' : 'border-gray-600 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>

          {step === 1 && (
            <Card className="neon-card border-border/30" data-testid="card-step-1">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-primary neon-text flex items-center justify-center gap-2">
                  <Users className="w-6 h-6" />
                  Welcome to FANZClub
                </CardTitle>
                <p className="text-gray-300">Join thousands of fans discovering amazing creators</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="bg-input border-border text-white mt-2 neon-border-animated"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    data-testid="input-email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-white">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      className="bg-input border-border text-white mt-2"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-white">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      className="bg-input border-border text-white mt-2"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => setStep(2)}
                  className="w-full gradient-bg hover:opacity-90 transition-all duration-300 neon-glow"
                  disabled={!formData.email || !formData.firstName}
                  data-testid="button-next-step-1"
                >
                  Continue
                  <Heart className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="neon-card border-border/30" data-testid="card-step-2">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-secondary neon-text flex items-center justify-center gap-2">
                  <Star className="w-6 h-6" />
                  What interests you?
                </CardTitle>
                <p className="text-gray-300">Help us recommend the perfect creators for you</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant="outline"
                      onClick={() => toggleCategory(category)}
                      className={`text-sm p-3 h-auto text-left transition-all duration-300 ${
                        formData.favoriteCategories.includes(category)
                          ? 'bg-primary/20 border-primary text-primary neon-glow'
                          : 'border-border hover:border-primary/50 text-gray-300'
                      }`}
                      data-testid={`button-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
                <div>
                  <Label htmlFor="interests" className="text-white">Tell us more about your interests (optional)</Label>
                  <Textarea
                    id="interests"
                    placeholder="I love fitness content, especially yoga and strength training..."
                    className="bg-input border-border text-white mt-2 min-h-[100px]"
                    value={formData.interests}
                    onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                    data-testid="textarea-interests"
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 border-border text-gray-300 hover:text-white"
                    data-testid="button-back-step-2"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 gradient-bg hover:opacity-90 transition-all duration-300 neon-glow"
                    data-testid="button-next-step-2"
                  >
                    Almost Done
                    <Star className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="neon-card border-border/30" data-testid="card-step-3">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-accent neon-text flex items-center justify-center gap-2">
                  <Crown className="w-6 h-6" />
                  You're all set!
                </CardTitle>
                <p className="text-gray-300">Ready to discover amazing creators and exclusive content?</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/20 p-6 rounded-lg border border-primary/20">
                  <h3 className="text-lg font-semibold text-primary mb-4">What you get as a fan:</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-primary" />
                      Access to exclusive creator content
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-secondary" />
                      Direct messaging with your favorite creators
                    </li>
                    <li className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-accent" />
                      Support creators with tips and subscriptions
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Join an exclusive community of fans
                    </li>
                  </ul>
                </div>
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-400">
                    Selected interests: {formData.favoriteCategories.join(", ") || "None"}
                  </p>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => setStep(2)}
                      variant="outline"
                      className="flex-1 border-border text-gray-300 hover:text-white"
                      data-testid="button-back-step-3"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="flex-1 gradient-bg hover:opacity-90 transition-all duration-300 neon-glow text-lg py-3"
                      data-testid="button-complete-signup"
                    >
                      Complete Signup
                      <Heart className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits Section */}
          <div className="mt-12 text-center">
            <h3 className="text-lg font-semibold text-white mb-6">Why join FANZClub?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="neon-card p-4 float-animation">
                <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="text-primary font-semibold">Direct Connection</h4>
                <p className="text-sm text-gray-400">Connect directly with creators you love</p>
              </div>
              <div className="neon-card p-4 float-animation" style={{animationDelay: '0.5s'}}>
                <Crown className="w-8 h-8 text-secondary mx-auto mb-2" />
                <h4 className="text-secondary font-semibold">Exclusive Content</h4>
                <p className="text-sm text-gray-400">Access premium content first</p>
              </div>
              <div className="neon-card p-4 float-animation" style={{animationDelay: '1s'}}>
                <Star className="w-8 h-8 text-accent mx-auto mb-2" />
                <h4 className="text-accent font-semibold">Support Creators</h4>
                <p className="text-sm text-gray-400">Help creators earn 100% of revenue</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}