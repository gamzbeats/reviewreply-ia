import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-neutral max-w-none space-y-6 text-foreground/80 leading-relaxed">
          <p>Last updated: March 2026</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">1. Information We Collect</h2>
          <p>We collect information you provide directly, including your name, email address, and restaurant details when you create an account. We also collect review content you paste into our tool for analysis.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">2. How We Use Your Information</h2>
          <p>We use your information to provide our AI-powered review response service, improve our algorithms, and communicate with you about your account. We never sell your personal data to third parties.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">3. Data Storage & Security</h2>
          <p>Your data is stored on secure servers with industry-standard encryption. We use Supabase for database hosting and Clerk for authentication, both of which maintain SOC 2 compliance.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">4. Third-Party Services</h2>
          <p>We use the following third-party services: OpenAI (for AI analysis), Stripe (for payments), Clerk (for authentication), Google Places API (for restaurant search), and SerpAPI (for review fetching).</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">5. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us. You can also export your data or close your account from your dashboard settings.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">6. Cookies</h2>
          <p>We use essential cookies for authentication and session management. We do not use tracking or advertising cookies.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">7. Contact</h2>
          <p>For privacy-related inquiries, please contact us at privacy@reviewreply.ai.</p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
