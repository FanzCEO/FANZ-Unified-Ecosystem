import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageSquare, Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message Sent",
      description: "We've received your message and will respond within 24 hours.",
    });
    
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-df-obsidian">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl neon-heading mb-4">Contact Us</h1>
          <p className="text-df-fog text-lg">Get in touch with our support team</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-df-brick border-df-steel" data-testid="card-contact-email">
            <CardHeader>
              <div className="w-12 h-12 bg-df-obsidian rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-df-cyan" />
              </div>
              <CardTitle className="text-df-snow">Email Support</CardTitle>
              <CardDescription className="text-df-fog">We'll respond within 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <a href="mailto:support@daddiesfanz.com" className="text-df-cyan hover:underline" data-testid="link-support-email">
                support@daddiesfanz.com
              </a>
            </CardContent>
          </Card>

          <Card className="bg-df-brick border-df-steel" data-testid="card-contact-hours">
            <CardHeader>
              <div className="w-12 h-12 bg-df-obsidian rounded-full flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-df-gold" />
              </div>
              <CardTitle className="text-df-snow">Business Hours</CardTitle>
              <CardDescription className="text-df-fog">Available to assist you</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-df-fog text-sm">Mon-Fri: 9AM - 6PM EST</p>
              <p className="text-df-fog text-sm">Sat-Sun: 10AM - 4PM EST</p>
            </CardContent>
          </Card>

          <Card className="bg-df-brick border-df-steel" data-testid="card-contact-live-chat">
            <CardHeader>
              <div className="w-12 h-12 bg-df-obsidian rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-df-cyan" />
              </div>
              <CardTitle className="text-df-snow">Live Chat</CardTitle>
              <CardDescription className="text-df-fog">Chat with our team</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-df-cyan hover:bg-df-cyan/90 text-df-obsidian" data-testid="button-start-chat">
                Start Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-df-brick border-df-steel">
          <CardHeader>
            <CardTitle className="text-2xl text-df-snow">Send Us a Message</CardTitle>
            <CardDescription className="text-df-fog">
              Fill out the form below and we'll get back to you as soon as possible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-df-snow">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    required
                    className="bg-df-obsidian border-df-steel text-df-snow"
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-df-snow">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="bg-df-obsidian border-df-steel text-df-snow"
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-df-snow">Subject</Label>
                <Select required>
                  <SelectTrigger className="bg-df-obsidian border-df-steel text-df-snow" data-testid="select-subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="technical">Technical Support</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="creator">Creator Support</SelectItem>
                    <SelectItem value="verification">Verification Issue</SelectItem>
                    <SelectItem value="report">Report Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-df-snow">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us how we can help..."
                  rows={6}
                  required
                  className="bg-df-obsidian border-df-steel text-df-snow"
                  data-testid="input-message"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-df-cyan hover:bg-df-cyan/90 text-df-obsidian font-semibold"
                disabled={isSubmitting}
                data-testid="button-submit-contact"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Card className="bg-df-brick border-df-steel">
            <CardHeader>
              <CardTitle className="text-df-snow">Creator Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-df-fog text-sm">For creator-specific questions:</p>
              <a href="mailto:creators@daddiesfanz.com" className="text-df-cyan hover:underline block" data-testid="link-creator-email">
                creators@daddiesfanz.com
              </a>
            </CardContent>
          </Card>

          <Card className="bg-df-brick border-df-steel">
            <CardHeader>
              <CardTitle className="text-df-snow">Legal & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-df-fog text-sm">For legal and compliance matters:</p>
              <a href="mailto:legal@daddiesfanz.com" className="text-df-cyan hover:underline block" data-testid="link-legal-contact-email">
                legal@daddiesfanz.com
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
