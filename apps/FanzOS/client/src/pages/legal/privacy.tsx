export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-8">
            Privacy & Age Verification
          </h1>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Age Verification</h2>
              <p>
                Fanz requires all users to be at least 18 years of age. We implement robust age verification 
                measures to ensure compliance with applicable laws and regulations. Users may be required to 
                provide government-issued identification for verification purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account, 
                make a purchase, or contact us for support. This may include your name, email address, 
                payment information, and content you upload to the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
              <p>
                We use the information we collect to provide, maintain, and improve our services, process 
                transactions, send you technical notices and support messages, and communicate with you 
                about products, services, and promotional offers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Information Sharing</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as described in this policy. We may share information with 
                service providers who assist us in operating our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
              <p>
                We implement appropriate technical and organizational security measures to protect your 
                personal information against unauthorized access, alteration, disclosure, or destruction. 
                However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
              <p>
                You have the right to access, update, or delete your personal information. You may also 
                have the right to restrict or object to certain processing of your data, depending on 
                your jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:<br />
                Fanz Unlimited Network (FUN) L.L.C.<br />
                Address: 30 N Gould St #45302 Sheridan, Wyoming United States<br />
                Email: privacy@fanz.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}