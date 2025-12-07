import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlashSaleBanner } from "@/components/flash-sale-banner";
import { CountdownTimer } from "@/components/countdown-timer";

export default function Landing() {
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({});

  const toggleFAQ = (index: number) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const faqItems = [
    {
      question: "What is AI-Generated Content for adult video imports?",
      answer: "AI-Generated Content refers to the titles and descriptions automatically created by our integrated AI for your adult videos. This content is unique, uncensored, SEO-friendly, and optimized to help improve your rankings and attract more traffic to your adult website."
    },
    {
      question: "How does the AI generate titles and descriptions?",
      answer: "The AI generates content based solely on the original title of the video. As a result, the generated descriptions may not always perfectly match the video's content, but they will remain coherent with the title. Every output is unique, uncensored, and optimized for SEO."
    },
    {
      question: "Are the generated titles and descriptions uncensored?",
      answer: "Yes, our system is specifically designed for adult content. The AI-generated titles and descriptions are completely uncensored, allowing you to create content freely without restrictions."
    },
    {
      question: "How can I purchase credits to use the AI?",
      answer: "Credits can be purchased through our credit system. Credits are included with all packages, and additional credits can be bought as needed for continued AI content generation."
    },
    {
      question: "Will AI-generated content improve my website's SEO?",
      answer: "Yes! The AI is designed to create SEO-friendly adult content that includes the most relevant keywords, making it easier for search engines to index and rank your videos higher. This can lead to better visibility and more organic traffic."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Flash Sale Banner */}
      <FlashSaleBanner />

      {/* Hero Section */}
      <section className="py-12 md:py-20 relative overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-6 leading-tight" data-testid="hero-title">
              <span className="gradient-text">Uncensored AI</span><br />
              <span className="text-white">Content Generation</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed px-2" data-testid="hero-description">
              Generate unlimited adult content titles, descriptions, and scripts with our fully uncensored AI. 
              No restrictions, no censorship, maximum conversion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button 
                className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 sm:px-8 py-4 text-base sm:text-lg hover-glow transform hover:scale-105 transition-all w-full sm:w-auto"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-get-started"
              >
                Start Generating Now
                <i className="fas fa-rocket ml-2"></i>
              </Button>
              <Button 
                variant="outline"
                className="border-border text-card-foreground px-6 sm:px-8 py-4 text-base sm:text-lg hover:bg-muted transition-colors w-full sm:w-auto"
                data-testid="button-watch-demo"
              >
                Watch Demo
                <i className="fas fa-play ml-2"></i>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-20 bg-card/50" data-testid="features-section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black gradient-text mb-4" data-testid="features-title">
              AI-Powered Features
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Revolutionary AI technology designed specifically for adult content creation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Feature Cards */}
            <Card className="bg-card border-border hover-glow" data-testid="feature-auto-generated">
              <CardContent className="p-6 md:p-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-4 md:mb-6">
                  <i className="fas fa-magic text-white text-xl md:text-2xl"></i>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Auto-Generated Titles & Descriptions</h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  Save time and boost your SEO with AI-generated titles and descriptions tailored for your adult videos. No more manual writing, our AI creates unique and optimized content automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover-glow" data-testid="feature-uncensored">
              <CardContent className="p-6 md:p-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center mb-4 md:mb-6">
                  <i className="fas fa-unlock-alt text-background text-xl md:text-2xl"></i>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Uncensored AI - No Restrictions</h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  Unlike other solutions, our AI is fully uncensored, allowing you to generate titles and descriptions for adult videos. Get accurate, engaging content without limitations.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover-glow" data-testid="feature-seo-optimized">
              <CardContent className="p-6 md:p-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-secondary to-primary rounded-xl flex items-center justify-center mb-4 md:mb-6">
                  <i className="fas fa-search text-white text-xl md:text-2xl"></i>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">SEO-Optimized for Maximum Traffic</h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  Our AI understands search algorithms and crafts titles and descriptions designed to improve rankings, helping you attract more visitors to your site effortlessly.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover-glow" data-testid="feature-automation">
              <CardContent className="p-6 md:p-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mb-4 md:mb-6">
                  <i className="fas fa-cog text-background text-xl md:text-2xl"></i>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Full Automation - Work on Autopilot</h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  Simply set the autopilot video import and let the AI handle the rest. Content is generated automatically, making content management effortless.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover-glow" data-testid="feature-management">
              <CardContent className="p-6 md:p-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center mb-4 md:mb-6">
                  <i className="fas fa-chart-line text-background text-xl md:text-2xl"></i>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Video Management Overview</h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  Get a clear overview of your videos. See which videos are eligible for AI-generated content and track your progress with streamlined control.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover-glow" data-testid="feature-speed">
              <CardContent className="p-6 md:p-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center mb-4 md:mb-6">
                  <i className="fas fa-bolt text-white text-xl md:text-2xl"></i>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Lightning Fast Generation</h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  Generate adult titles and descriptions in just a few seconds. Save time and focus on other aspects of your site while ensuring SEO-optimized content.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Call-to-Action Section */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-primary/20 via-background to-secondary/20" data-testid="features-cta-section">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black gradient-text mb-6">Start Creating Unlimited Content</h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto px-4">
            Join creators who are already using FanzAssistant to automate their content generation with 1000 free credits to get you started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button 
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 sm:px-8 py-4 text-base sm:text-lg hover-glow transform hover:scale-105 transition-all w-full sm:w-auto"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-start-free"
            >
              Start With 1000 Free Credits
              <i className="fas fa-rocket ml-2"></i>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-card/50" data-testid="faq-section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black gradient-text mb-4">Got Questions?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our AI-powered tool
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {faqItems.map((item, index) => (
              <Card key={index} className="bg-card border-border overflow-hidden" data-testid={`faq-item-${index}`}>
                <button 
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                  onClick={() => toggleFAQ(index)}
                  data-testid={`button-faq-${index}`}
                >
                  <span className="text-lg font-semibold text-white">{item.question}</span>
                  <i className={`fas ${faqOpen[index] ? 'fa-chevron-up' : 'fa-chevron-down'} text-muted-foreground`}></i>
                </button>
                {faqOpen[index] && (
                  <div className="px-8 pb-6 text-muted-foreground leading-relaxed" data-testid={`faq-answer-${index}`}>
                    {item.answer}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/20 via-background to-secondary/20" data-testid="cta-section">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black gradient-text mb-6">Ready to Generate Unlimited Content?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are already using FanzAssistant to automate their content generation and boost their SEO rankings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-8 py-4 text-lg hover-glow transform hover:scale-105 transition-all"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-start-trial"
            >
              Start Your Free Trial
              <i className="fas fa-arrow-right ml-2"></i>
            </Button>
            <Button 
              variant="outline"
              className="border-border text-card-foreground px-8 py-4 text-lg hover:bg-muted transition-colors"
              data-testid="button-contact-sales"
            >
              Contact Sales
              <i className="fas fa-phone ml-2"></i>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12" data-testid="footer">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <i className="fas fa-robot text-white"></i>
                </div>
                <span className="text-xl font-black gradient-text">FanzAssistant</span>
              </div>
              <p className="text-muted-foreground">
                The most advanced AI-powered content generation platform for adult entertainment creators.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">DMCA</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 text-center">
            <p className="text-muted-foreground">
              © 2024 FanzAssistant. All rights reserved. 
              <span className="text-xs block mt-1">This platform is designed for adult content creators (18+).</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
