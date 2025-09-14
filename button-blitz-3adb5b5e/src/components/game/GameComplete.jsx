
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, Crown, Medal, RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ConfettiPiece = ({ x, y, rotate, color }) => (
    <motion.div
        style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: '8px',
            height: '16px',
            backgroundColor: color,
            opacity: 0,
        }}
        animate={{
            top: '120%',
            opacity: [1, 1, 0],
            x: `calc(${x}% + ${Math.random() * 200 - 100}px)`, // Spread horizontally
            rotate: rotate + (Math.random() * 360 - 180), // More rotation
        }}
        transition={{
            duration: Math.random() * 2 + 2, // 2 to 4 seconds
            ease: "linear",
        }}
    />
);

const Confetti = () => {
    const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']; // Tailwind colors
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
                <ConfettiPiece
                    key={i}
                    x={Math.random() * 100}
                    y={-10 - Math.random() * 20} // Start above the screen
                    rotate={Math.random() * 360}
                    color={colors[i % colors.length]}
                />
            ))}
        </div>
    );
};

export default function GameComplete({ players, onPlayAgain, isHost, onBackToSetup, endReason }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0] || { name: 'Nobody', color: '#888', score: 0 };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-8 h-8 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <Trophy className="w-5 h-5 text-[rgb(var(--text-secondary))]" />;
  };

  const handleAction = onPlayAgain || onBackToSetup;

  return (
    <div className="w-full max-w-md mx-auto text-center relative">
      <AnimatePresence>{winner && <Confetti />}</AnimatePresence>
      <motion.div
        initial={{ scale: 0, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="mb-8"
      >
        <div className="text-7xl mb-4">🎉</div>
        <h1 className="text-4xl font-bold text-[rgb(var(--text-primary))] mb-2">
          Game Over!
        </h1>
        {endReason ? (
            <p className="text-lg text-yellow-300">{endReason}</p>
        ) : (
            <p className="text-lg text-[rgb(var(--text-secondary))]">
            And the winner is...
            </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel rounded-2xl shadow-xl p-6 mb-8"
      >
        <div className="mb-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="relative inline-block"
          >
            <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [-5, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2, repeatType: 'mirror' }}
                className="text-6xl mb-2"
            >
                👑
            </motion.div>
            <div
              className="inline-flex items-center px-6 py-2 rounded-lg text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: winner.color }}
            >
              {winner.name}
            </div>
            <div className="text-4xl font-bold text-[rgb(var(--text-primary))] mt-3">
              {winner.score} pts
            </div>
          </motion.div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-[rgb(var(--text-secondary))] text-left mb-2">Final Scores</h3>
          {sortedPlayers.map((player, index) => (
            <motion.div
              key={player.name || player.email}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-lg ${
                index === 0 ? 'bg-yellow-400/20' : 'bg-[rgba(var(--background-secondary),0.5)]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 text-center">{getRankIcon(index)}</div>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: player.color }}
                />
                <span className={`font-medium ${index === 0 ? 'text-yellow-200' : 'text-[rgb(var(--text-primary))]'}`}>
                  {player.name}
                </span>
              </div>
              <div className={`text-lg font-bold ${index === 0 ? 'text-yellow-200' : 'text-[rgb(var(--text-primary))]'}`}>
                {player.score}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {isHost !== undefined ? ( // Online game
          isHost && !endReason?.includes('left the game') && ( // Only show if host didn't leave
            <Button
              onClick={handleAction}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-bold rounded-xl shadow-lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Play Again
            </Button>
          )
        ) : ( // Local game
          <Button
            onClick={onPlayAgain}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-bold rounded-xl shadow-lg"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Play Again
          </Button>
        )}
        <Link to={createPageUrl('Home')} className="flex-1">
            <Button
              variant="outline"
              className="w-full border-2 border-[rgba(var(--border-color))] text-[rgb(var(--text-primary))] hover:bg-[rgba(var(--highlight-bg))] py-4 text-lg font-bold rounded-xl"
            >
              <Home className="w-5 h-5 mr-2" />
              Main Menu
            </Button>
        </Link>
      </motion.div>
    </div>
  );
}
