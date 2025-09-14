import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TermsOfServicePage() {
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
            <FileText className="w-8 h-8 mr-4 text-[rgb(var(--text-accent))]" />
            <h1 className="text-3xl font-bold">Terms of Service</h1>
          </div>
          <div className="prose prose-invert max-w-none text-[rgb(var(--text-secondary))]">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>Please read these Terms of Service carefully before using the Button Blitz game.</p>
            <h2 className="text-[rgb(var(--text-primary))]">1. Acceptance of Terms</h2>
            <p>
              By accessing and playing our game, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, then you may not access the game.
            </p>
            <h2 className="text-[rgb(var(--text-primary))]">2. User Conduct</h2>
            <p>
              You agree not to use the game to:
            </p>
            <ul>
              <li>Engage in any activity that is unlawful, harmful, or abusive.</li>
              <li>Choose a player name that is offensive, obscene, or infringing on any third party's rights.</li>
              <li>Attempt to disrupt or interfere with the game's servers or networks.</li>
              <li>Use any cheats, exploits, or other unauthorized methods to gain an unfair advantage.</li>
            </ul>
            <h2 className="text-[rgb(var(--text-primary))]">3. Accounts</h2>
            <p>
              When you create an account with us, you must provide information that is accurate and complete. You are responsible for safeguarding your account and for any activities or actions under your account. We are not liable for any loss or damage arising from your failure to comply with the above.
            </p>
            <h2 className="text-[rgb(var(--text-primary))]">4. Termination</h2>
            <p>
              We may terminate or suspend your access to our game immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            <h2 className="text-[rgb(var(--text-primary))]">5. Disclaimer</h2>
            <p>
                The game is provided on an "AS IS" and "AS AVAILABLE" basis. We do not warrant that the service will be uninterrupted, secure, or error-free.
            </p>
            <h2 className="text-[rgb(var(--text-primary))]">6. Changes to Terms</h2>
            <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}