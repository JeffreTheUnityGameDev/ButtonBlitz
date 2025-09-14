import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Users, Wifi, LogIn, Settings } from 'lucide-react';
import { User } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { SettingsContext } from '../components/SettingsProvider';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { settings, playMusic, playSound } = useContext(SettingsContext);

  useEffect(() => {
    playMusic('menu');
    const checkUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [playMusic]);

  const handleLogin = async () => {
    try {
      playSound('button_click');
      await User.login();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleButtonClick = () => {
    playSound('button_click');
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-[rgb(var(--background-start))] to-[rgb(var(--background-end))] text-[rgb(var(--text-primary))] p-4">
      {/* Settings Button */}
      <div className="absolute top-4 right-4">
        <Link to={createPageUrl('Settings')}>
          <Button variant="ghost" className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]" onClick={handleButtonClick}>
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
          Button Blitz
        </h1>
        <h2 className="text-4xl sm:text-6xl font-bold text-[rgb(var(--text-primary))]">
          CHAOS
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-panel rounded-2xl shadow-xl p-8 max-w-sm w-full"
      >
        <h3 className="text-2xl font-bold text-center mb-6 text-[rgb(var(--text-primary))]">Choose Your Game</h3>
        <div className="space-y-4">
          <Link to={createPageUrl('LocalGame')} className="w-full">
            <Button className="w-full h-16 text-lg bg-[rgba(var(--highlight-bg),var(--highlight-opacity))] hover:bg-[rgba(var(--highlight-bg),0.8)] text-[rgb(var(--highlight-text))] border-2 border-[rgba(var(--border-color),var(--border-opacity))]" onClick={handleButtonClick}>
              <Users className="w-6 h-6 mr-3" />
              Local Game
            </Button>
          </Link>

          {loading ? (
            <div className="w-full h-16 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--text-primary))]"></div>
            </div>
          ) : user ? (
            <Link to={createPageUrl('OnlineLobby')} className="w-full">
              <Button className="w-full h-16 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 transition-transform text-white" onClick={handleButtonClick}>
                <Wifi className="w-6 h-6 mr-3" />
                Online Multiplayer
              </Button>
            </Link>
          ) : (
            <Button onClick={handleLogin} className="w-full h-16 text-lg bg-gradient-to-r from-green-500 to-teal-500 hover:scale-105 transition-transform text-white">
              <LogIn className="w-6 h-6 mr-3" />
              Login for Online Play
            </Button>
          )}
        </div>
        {user && (
          <div className="text-center text-xs text-[rgb(var(--text-secondary))] mt-4 flex items-center justify-center gap-2">
            {user.profile_image && (
              <img
                src={user.profile_image}
                alt="Profile"
                className="w-4 h-4 rounded-full object-cover"
              />
            )}
            <span>Logged in as {user.display_name || user.full_name}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}