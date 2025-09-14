
import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { SettingsContext } from '../SettingsProvider';

export default function TermsCheck() {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const { settings } = useContext(SettingsContext);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        if (currentUser && !currentUser.terms_accepted) {
          setShowModal(true);
        }
      } catch (error) {
        // Not logged in, do nothing
      }
    };
    checkUser();
  }, []);

  const handleAccept = async () => {
    if (!isChecked) return;
    try {
      await User.updateMyUserData({ terms_accepted: true });
      setShowModal(false);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  if (!showModal) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel rounded-2xl p-8 text-center max-w-lg mx-4 text-[rgb(var(--text-primary))]"
        >
          <h1 className="text-3xl font-bold mb-4">Welcome to Button Blitz!</h1>
          <p className="text-[rgb(var(--text-secondary))] mb-6">
            Before you dive into the chaos, please review and accept our terms and policies.
          </p>
          
          <div className="flex items-center space-x-2 my-6 justify-center">
            <Checkbox id="terms" checked={isChecked} onCheckedChange={setIsChecked} />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have read and agree to the policies.
            </label>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <Link to={createPageUrl('TermsOfService')} target="_blank" className="text-sm text-[rgb(var(--text-accent))] hover:underline">
                Terms of Service
            </Link>
            <Link to={createPageUrl('PrivacyPolicy')} target="_blank" className="text-sm text-[rgb(var(--text-accent))] hover:underline">
                Privacy Policy
            </Link>
          </div>

          <Button
            onClick={handleAccept}
            disabled={!isChecked}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 text-lg font-bold disabled:opacity-50"
          >
            Continue to Game
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
