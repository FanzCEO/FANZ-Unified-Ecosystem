import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    id: "getting-started",
    question: "How do I get started with FANZ Forge?",
    answer: "Simply create a new project by clicking 'New Project' and choose from our creator-focused templates. Our AI will guide you through the setup process."
  },
  {
    id: "templates",
    question: "What templates are available?",
    answer: "We offer templates for Creator Paywalls with DM systems, CRUD Admin Panels, Content Marketplaces, and more. Each template is designed specifically for the creator economy."
  },
  {
    id: "ai-assistance",
    question: "How does the AI assistance work?",
    answer: "Our AI agent helps you build features, write code, and solve problems. Just describe what you want in natural language and it will generate the appropriate code."
  },
  {
    id: "deployment",
    question: "How do I deploy my application?",
    answer: "Once your project is ready, click the Deploy button. We handle the entire deployment process including hosting, SSL certificates, and custom domains."
  },
  {
    id: "pricing",
    question: "What are the pricing plans?",
    answer: "We offer a free plan with 3 projects and basic templates. Pro plans include unlimited projects, advanced templates, and priority support."
  },
  {
    id: "compliance",
    question: "What compliance features are included?",
    answer: "Our templates include built-in 2257 compliance, GDPR tools, age verification, and content moderation features required for creator platforms."
  }
];

const contactOptions = [
  {
    icon: "fas fa-envelope",
    title: "Email Support",
    description: "Get help via email",
    action: "support@fanzforge.com",
    color: "primary"
  },
  {
    icon: "fas fa-comments",
    title: "Live Chat",
    description: "Chat with our team",
    action: "Start Chat",
    color: "secondary"
  },
  {
    icon: "fas fa-book",
    title: "Documentation",
    description: "Browse our guides",
    action: "View Docs",
    color: "accent"
  }
];

export default function Help() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="mb-4"
            data-testid="button-back"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
          <p className="text-muted-foreground">
            Get help with FANZ Forge and find answers to common questions.
          </p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
              <Input
                placeholder="Search for help..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Options */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {contactOptions.map((option, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className={`w-12 h-12 bg-${option.color}/20 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <i className={`${option.icon} text-${option.color} text-lg`}></i>
                </div>
                <h3 className="font-semibold mb-2">{option.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid={`button-${option.title.toLowerCase().replace(' ', '-')}`}
                >
                  {option.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Find quick answers to the most common questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            {filteredFaqs.length === 0 && searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                <i className="fas fa-search text-2xl mb-4"></i>
                <p>No help articles found for "{searchQuery}"</p>
                <p className="text-sm mt-2">Try a different search term or contact support.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Start Guide</CardTitle>
              <CardDescription>
                Learn the basics in 5 minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" data-testid="button-quick-start">
                <i className="fas fa-play mr-2"></i>
                Start Tutorial
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Video Tutorials</CardTitle>
              <CardDescription>
                Watch step-by-step guides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" data-testid="button-video-tutorials">
                <i className="fas fa-video mr-2"></i>
                Watch Videos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}