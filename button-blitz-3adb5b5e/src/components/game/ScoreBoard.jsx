import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Medal, Heart, Zap, Flame, LogOut, Swords, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MODE_ICONS = {
  chill: { icon: Heart, color: 'text-green-500', bg: 'bg-green-500/10' },
  party: { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  extreme: { icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' }
};

export default function ScoreBoard({ players, currentRound, totalRounds, gameMode = 'party', onQuitGame, onPlayerQuit, currentPlayerIndex }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const ModeIcon = MODE_ICONS[gameMode]?.icon || Swords;

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <Trophy className="w-5 h-5 text-[rgb(var(--text-secondary))]" />;
  };

  return (
    <div className="w-full glass-panel rounded-2xl shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Scores</h2>
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${MODE_ICONS[gameMode]?.bg || 'bg-gray-500/10'}`}>
            <ModeIcon className={`w-4 h-4 ${MODE_ICONS[gameMode]?.color || 'text-gray-400'}`} />
          </div>
          <div className="text-sm font-medium text-[rgb(var(--text-secondary))]">
            {totalRounds === -1 ? `Round ${currentRound}` : `R ${currentRound}/${totalRounds}`}
          </div>
        </div>
      </div>
      
      <div className="space-y-3 mb-6 min-h-[100px]">
        <AnimatePresence>
          {sortedPlayers.map((player, index) => {
            const originalIndex = players.findIndex(p => p.email === player.email);
            const isCurrentPlayer = originalIndex === currentPlayerIndex;
            const isOut = player.status === 'out';
            
            return (
              <motion.div
                key={player.name || player.email}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isOut ? 0.4 : 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  index === 0 && !isOut
                    ? 'bg-yellow-400/20 glow-effect' 
                    : 'bg-[rgba(var(--background-secondary),0.5)]'
                } ${isCurrentPlayer && !isOut ? 'ring-2 ring-[rgb(var(--text-accent))]' : ''}
                ${isOut ? 'grayscale' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  {getRankIcon(index)}
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: isOut ? '#666' : player.color }}
                  />
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium truncate max-w-[120px] ${
                      index === 0 && !isOut ? 'text-yellow-200' : 'text-[rgb(var(--text-primary))]'
                    }`}>
                      {player.name}
                    </span>
                    {isOut && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                        OUT
                      </span>
                    )}
                    {isCurrentPlayer && !isOut && (
                      <motion.span 
                        className="text-xs bg-[rgb(var(--text-accent))]/20 text-[rgb(var(--text-accent))] px-2 py-1 rounded-full"
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity
                        }}
                      >
                        TURN
                      </motion.span>
                    )}
                    {player.completed_round && gameMode === 'online' && (
                       <CheckCircle2 className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`text-lg font-bold ${
                    index === 0 && !isOut ? 'text-yellow-200' : 'text-[rgb(var(--text-primary))]'
                  }`}>
                    {player.score}
                  </div>
                  {onPlayerQuit && originalIndex > 0 && !isOut && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onPlayerQuit(originalIndex)}
                      className="w-6 h-6 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {onQuitGame && (
        <div className="mt-6 pt-4 border-t border-[rgba(var(--border-color))]">
          <Button
            variant="outline"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            onClick={onQuitGame}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Quit Game
          </Button>
        </div>
      )}
    </div>
  );
}