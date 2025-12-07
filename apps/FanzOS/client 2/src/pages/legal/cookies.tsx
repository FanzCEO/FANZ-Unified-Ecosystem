export default function Cookies() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-8">
            Cookies Policy
          </h1>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">What Are Cookies</h2>
              <p>
                Cookies are small text files that are placed on your computer or mobile device when 
                you visit our website. They allow us to recognize your device and store some information 
                about your preferences or past actions to improve your experience on our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">How We Use Cookies</h2>
              <p>
                We use cookies to enhance your browsing experience, analyze site traffic, personalize 
                content, and serve targeted advertisements. Cookies help us understand how you interact 
                with our platform and improve our services accordingly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Types of Cookies We Use</h2>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Essential Cookies:</strong> Required for the platform to function properly</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Marketing Cookies:</strong> Used to show relevant advertisements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Third-Party Cookies</h2>
              <p>
                Some cookies are placed by third-party services that appear on our pages. This includes 
                analytics providers, advertising networks, and social media platforms. These cookies 
                are subject to the respective privacy policies of these external services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Managing Cookies</h2>
              <p>
                You can control and/or delete cookies as you wish. You can delete all cookies that 
                are already on your computer and you can set most browsers to prevent them from being 
                placed. However, if you do this, you may have to manually adjust some preferences 
                every time you visit a site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Cookie Consent</h2>
              <p>
                By continuing to use our service, you accept our use of cookies as described in this 
                policy. If you do not agree to our use of cookies, please adjust your browser settings 
                accordingly or discontinue use of our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
              <p>
                If you have any questions about our use of cookies, please contact us at:<br />
                Email: privacy@fanz.com<br />
                Address: 30 N Gould St #45302 Sheridan, Wyoming United States
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}