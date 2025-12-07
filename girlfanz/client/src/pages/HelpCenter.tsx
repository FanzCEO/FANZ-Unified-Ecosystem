import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, MessageCircle, BookOpen, GraduationCap, Search } from "lucide-react";
import { Link } from "wouter";

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ghostly Background */}
      <div 
        className="fixed inset-0 opacity-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 1000\"><defs><radialGradient id=\"g\" cx=\"50%\" cy=\"50%\" r=\"50%\"><stop offset=\"0%\" stop-color=\"%23ff00ff\" stop-opacity=\"0.3\"/><stop offset=\"100%\" stop-color=\"%2300ffff\" stop-opacity=\"0.1\"/></radialGradient></defs><rect width=\"100%\" height=\"100%\" fill=\"url(%23g)\"/></svg>')"
        }}
      />
      
      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Help Center
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Get the support you need to make the most of the GirlFanz platform
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="text-center">
              <MessageCircle className="h-10 w-10 text-pink-400 mx-auto mb-2" />
              <CardTitle className="text-white">Support Tickets</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-400 text-sm mb-4">
                Get personalized help from our support team
              </p>
              <Link href="/help/tickets">
                <Button 
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  data-testid="button-support-tickets"
                >
                  View Tickets
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="text-center">
              <BookOpen className="h-10 w-10 text-blue-400 mx-auto mb-2" />
              <CardTitle className="text-white">Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-400 text-sm mb-4">
                Search our AI-powered help articles
              </p>
              <Link href="/wiki">
                <Button 
                  variant="outline"
                  className="w-full border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                  data-testid="button-knowledge-base"
                >
                  Search Articles
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="text-center">
              <GraduationCap className="h-10 w-10 text-green-400 mx-auto mb-2" />
              <CardTitle className="text-white">Tutorials</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-400 text-sm mb-4">
                Step-by-step guides to get started
              </p>
              <Link href="/tutorials">
                <Button 
                  variant="outline"
                  className="w-full border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                  data-testid="button-tutorials"
                >
                  View Tutorials
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="text-center">
              <MessageCircle className="h-10 w-10 text-cyan-400 mx-auto mb-2" />
              <CardTitle className="text-white">Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-400 text-sm mb-4">
                Create a new support ticket
              </p>
              <Link href="/help/contact">
                <Button 
                  variant="outline"
                  className="w-full border-cyan-600 text-cyan-400 hover:bg-cyan-600 hover:text-white"
                  data-testid="button-contact-support"
                >
                  Contact Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Popular Topics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Popular Topics</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2 text-pink-400" />
                  Getting Started
                </CardTitle>
                <CardDescription className="text-gray-400">
                  New to GirlFanz? Learn the basics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Setting up your profile</li>
                  <li>• Verification process</li>
                  <li>• Creating your first content</li>
                  <li>• Understanding payouts</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Search className="h-5 w-5 mr-2 text-blue-400" />
                  Account & Billing
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your account and payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Payment methods</li>
                  <li>• Subscription management</li>
                  <li>• Payout setup</li>
                  <li>• Account security</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Need Help? */}
        <Card className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 border-pink-800/50">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-xl">Still need help?</CardTitle>
            <CardDescription className="text-gray-300">
              Our support team is here to assist you 24/7
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/help/contact">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                data-testid="button-create-ticket"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Create Support Ticket
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}