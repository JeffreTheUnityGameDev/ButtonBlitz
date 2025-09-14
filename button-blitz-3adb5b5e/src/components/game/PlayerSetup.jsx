
import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Play, Users, Settings, ArrowLeft } from 'lucide-react';
import GameSettings from './GameSettings';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { SettingsContext } from '../SettingsProvider';


const PLAYER_COLORS = [
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export default function PlayerSetup({ onStartGame, initialSettings }) {
  const [players, setPlayers] = useState([
    { name: 'Player 1', color: PLAYER_COLORS[0], score: 0 },
    { name: 'Player 2', color: PLAYER_COLORS[1], score: 0 }
  ]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const { settings: globalSettings, updateSettings, playSound } = useContext(SettingsContext);
  const [localSettings, setLocalSettings] = useState(initialSettings);

  const handleSettingsChange = (newSettings) => {
      setLocalSettings(newSettings);
      updateSettings(newSettings); // Also update global context
  };

  const addPlayer = () => {
    if (newPlayerName.trim() && players.length < 8) {
      playSound('ui_click');
      setPlayers(prev => [...prev, {
        name: newPlayerName.trim(),
        color: PLAYER_COLORS[prev.length % PLAYER_COLORS.length],
        score: 0
      }]);
      setNewPlayerName('');
    }
  };

  const updatePlayerName = (index, name) => {
    setPlayers(prev => prev.map((player, i) =>
      i === index ? { ...player, name } : player
    ));
  };

  const removePlayer = (index) => {
    if (players.length > 2) {
      setPlayers(prev => prev.filter((_, i) => i !== index).map((player, i) => ({
        ...player,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length]
      })));
    }
  };
  
  const canStartGame = players.every(p => p.name.trim().length > 0) && players.length >= 2;

  const handleStartGame = () => {
    if (canStartGame) {
      playSound('button_click');
      onStartGame(players, localSettings);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto relative">
       <div className="absolute top-0 left-0">
         <Link to={createPageUrl('Home')}>
           <Button variant="ghost" className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
             <ArrowLeft className="w-5 h-5 mr-2" />
             Back to Menu
           </Button>
         </Link>
       </div>
       <div className="mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
            Button Blitz
          </h1>
          <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text-primary))] mb-3">
            CHAOS
          </h2>
          <p className="text-base sm:text-lg text-[rgb(var(--text-secondary))]">
            One button, multiple players, endless fun.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!showSettings ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="glass-panel rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-[rgb(var(--text-accent))] mr-2" />
                  <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">Players ({players.length}/8)</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(true)}
                  className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgba(var(--highlight-bg))]"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <AnimatePresence>
                  {players.map((player, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center space-x-3"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 shadow-md"
                        style={{ backgroundColor: player.color }}
                      />
                      <Input
                        placeholder={`Player ${index + 1}`}
                        value={player.name}
                        onChange={(e) => updatePlayerName(index, e.target.value)}
                        className="flex-1 bg-[rgba(var(--background-secondary),0.5)] border-[rgba(var(--border-color))] focus:border-[rgb(var(--text-accent))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] text-lg h-12"
                        maxLength={15}
                      />
                      {players.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePlayer(index)}
                          className="text-red-400 hover:bg-red-500/10 hover:text-red-300 w-10 h-10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {players.length < 8 && (
                <div className="flex space-x-2 mb-6">
                  <Input
                    placeholder="Add player..."
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                    className="flex-1 bg-[rgba(var(--background-secondary),0.5)] border-[rgba(var(--border-color))] focus:border-[rgb(var(--text-accent))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] text-lg h-12"
                    maxLength={15}
                  />
                  <Button 
                    onClick={addPlayer} 
                    disabled={!newPlayerName.trim()}
                    className="bg-[rgb(var(--text-accent))] hover:opacity-90 text-white w-12 h-12"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  onClick={handleStartGame}
                  disabled={!canStartGame}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 transition-transform text-white py-4 text-lg font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start the Chaos!
                </Button>
              </motion.div>

            </motion.div>
          ) : (
            <GameSettings
              settings={localSettings}
              onSettingsChange={handleSettingsChange}
              onClose={() => setShowSettings(false)}
              isHost={true} // In local game, you are always the host
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
