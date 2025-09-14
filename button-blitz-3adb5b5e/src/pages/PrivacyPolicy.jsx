import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[rgb(var(--background-start))] to-[rgb(var(--background-end))] text-[rgb(var(--text-primary))] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" className="mb-8 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 rounded-2xl"
        >
          <div className="flex items-center mb-6">
            <Shield className="w-8 h-8 mr-4 text-[rgb(var(--text-accent))]" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          <div className="prose prose-invert max-w-none text-[rgb(var(--text-secondary))]">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              Your privacy is important to us. It is Button Blitz's policy to respect your privacy regarding any information we may collect from you across our game.
            </p>
            <h2 className="text-[rgb(var(--text-primary))]">1. Information We Collect</h2>
            <p>
              <strong>Account Information:</strong> When you sign up for Button Blitz using a third-party service like Google, we receive your name and email address. We do not collect or store your password.
            </p>
            <p>
              <strong>Gameplay Data:</strong> We collect data related to your in-game activities, such as scores, game outcomes, and player names within a game session. This is used to operate the game features.
            </p>
             <p>
              <strong>Settings:</strong> We store your game settings (like volume, theme, and graphics preferences) in your browser's local storage. This data is not sent to our servers.
            </p>
            <h2 className="text-[rgb(var(--text-primary))]">2. How We Use Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul>
              <li>Operate and maintain the game, including multiplayer functionality.</li>
              <li>Identify you in game lobbies and on leaderboards.</li>
              <li>Improve and personalize your gaming experience.</li>
            </ul>
            <h2 className="text-[rgb(var(--text-primary))]">3. Data Storage and Security</h2>
            <p>
              Your account and gameplay data are stored securely on the base44 platform. We take reasonable measures to protect your information from loss, theft, misuse, and unauthorized access.
            </p>
            <h2 className="text-[rgb(var(--text-primary))]">4. Third-Party Services</h2>
            <p>
              Our game is built on the base44 platform. Their privacy policy may also apply. We do not share your personal information with any other third parties without your consent, except to comply with the law.
            </p>
             <h2 className="text-[rgb(var(--text-primary))]">5. Your Consent</h2>
            <p>
                By using our game, you hereby consent to our Privacy Policy and agree to its terms.
            </p>
            <h2 className="text-[rgb(var(--text-primary))]">Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}