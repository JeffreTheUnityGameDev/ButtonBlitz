import React, { useState, useEffect, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerSetup from '../components/game/PlayerSetup';
import GameButton from '../components/game/GameButton';
import ScoreBoard from '../components/game/ScoreBoard';
import GameComplete from '../components/game/GameComplete';
import LoadingScreen from '../components/game/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Pause, Play, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { SettingsContext } from '../components/SettingsProvider';

export default function LocalGamePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState('setup');
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [lastTaskType, setLastTaskType] = useState(null);
  const [resumeCountdown, setResumeCountdown] = useState(0);
  const { settings, updateSettings, playMusic, playSound } = useContext(SettingsContext);

  useEffect(() => {
    const timer = setTimeout(() => {
        setIsLoading(false);
        playMusic('menu');
    }, 1500);
    return () => clearTimeout(timer);
  }, [playMusic]);

  useEffect(() => {
    return () => {
      playMusic('menu');
    };
  }, [playMusic]);

  const handleStartGame = useCallback((playerList, gameSettings) => {
    playSound('button_click');
    Object.keys(gameSettings).forEach(key => {
      updateSettings(key, gameSettings[key]);
    });
    setPlayers(playerList.map(p => ({ ...p, score: 0, status: 'active' })));
    setGameState('playing');
    setCurrentPlayerIndex(0);
    setCurrentRound(1);
    setLastTaskType(null);
    playMusic('game');
  }, [playSound, updateSettings, playMusic]);

  const handleTaskComplete = useCallback((points, taskType) => {
    setLastTaskType(taskType);
    
    setPlayers(prev => prev.map((player, index) => 
      index === currentPlayerIndex 
        ? { ...player, score: player.score + points }
        : player
    ));

    const activePlayers = players.filter(p => p.status === 'active');
    if (activePlayers.length <= 1) {
      setGameState('complete');
      playSound('win');
      playMusic('menu');
      return;
    }

    let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    while (players[nextPlayerIndex].status !== 'active') {
      nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
    }
    
    setCurrentPlayerIndex(nextPlayerIndex);
    
    const activePlayerIndices = players.map((p, i) => p.status === 'active' ? i : -1).filter(i => i !== -1);
    const currentActiveIndex = activePlayerIndices.indexOf(currentPlayerIndex);
    const nextActiveIndex = activePlayerIndices.indexOf(nextPlayerIndex);
    
    if (nextActiveIndex <= currentActiveIndex) {
      if (settings.totalRounds === -1) {
        setCurrentRound(prev => prev + 1);
      } else if (currentRound >= settings.totalRounds) {
        setTimeout(() => {
          setGameState('complete');
          playSound('win');
          playMusic('menu');
        }, 1500);
        return;
      } else {
        setCurrentRound(prev => prev + 1);
      }
    }
  }, [currentPlayerIndex, players, settings.totalRounds, currentRound, playSound, playMusic]);

  const handlePlayerQuit = useCallback((playerIndex) => {
    playSound('button_click');
    const updatedPlayers = players.map((p, i) => i === playerIndex ? { ...p, status: 'out' } : p);
    setPlayers(updatedPlayers);

    const activePlayers = updatedPlayers.filter(p => p.status === 'active');

    if (activePlayers.length <= 1 || playerIndex === 0) {
      setGameState('complete');
      playMusic('menu');
      playSound('win');
    } else if (playerIndex === currentPlayerIndex) {
      let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
      while (updatedPlayers[nextPlayerIndex].status !== 'active') {
        nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
      }
      setCurrentPlayerIndex(nextPlayerIndex);
    }
  }, [players, currentPlayerIndex, playSound, playMusic]);
  
  const handlePauseGame = useCallback(() => {
    playSound('button_click');
    setGameState('paused');
    playMusic('menu');
  }, [playSound, playMusic]);

  const handleResumeGame = useCallback(() => {
    playSound('button_click');
    setGameState('playing');
    
    setResumeCountdown(3);
    const countdownInterval = setInterval(() => {
      setResumeCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          playMusic('game');
          playSound('start');
          return 0;
        }
        playSound('countdown_tick');
        return prev - 1;
      });
    }, 1000);
  }, [playSound, playMusic]);

  const handleQuitGame = useCallback(() => {
    playSound('button_click');
    setGameState('complete');
    playMusic('menu');
    playSound('win');
  }, [playSound, playMusic]);

  const handlePlayAgain = useCallback(() => {
    playSound('button_click');
    setPlayers(prev => prev.map(player => ({ ...player, score: 0, status: 'active' })));
    setCurrentPlayerIndex(0);
    setCurrentRound(1);
    setLastTaskType(null);
    setResumeCountdown(0);
    setGameState('playing');
    playMusic('game');
  }, [playSound, playMusic]);

  const handleEndlessStop = useCallback(() => {
    playSound('button_click');
    setGameState('complete');
    playMusic('menu');
    playSound('win');
  }, [playSound, playMusic]);

  const handleBackToSetup = useCallback(() => {
    playSound('button_click');
    setGameState('setup');
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setCurrentRound(1);
    setLastTaskType(null);
    setResumeCountdown(0);
    playMusic('menu');
  }, [playSound, playMusic]);
  
  const mainContainerClass = `min-h-screen min-h-dvh bg-gradient-to-br from-[rgb(var(--background-start))] to-[rgb(var(--background-end))] text-[rgb(var(--text-primary))]`;

  return (
    <div className={mainContainerClass}>
      <AnimatePresence>
        {isLoading && <LoadingScreen key="loader" />}
      </AnimatePresence>
      
      {!isLoading && (
        <div className="relative z-10 min-h-screen min-h-dvh flex flex-col p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {gameState === 'setup' && (
              <motion.div 
                key="setup" 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }} 
                className="flex-1 flex items-center justify-center"
              >
                <PlayerSetup 
                  onStartGame={handleStartGame} 
                  initialSettings={settings}
                />
              </motion.div>
            )}
            
            {(gameState === 'playing' || gameState === 'paused') && (
              <motion.div 
                key="playing" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="flex-1 flex flex-col"
              >
                <div className="flex justify-between items-center mb-4">
                  <Link to={createPageUrl('Home')}>
                    <Button 
                      variant="ghost" 
                      className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]" 
                      onClick={() => {
                        playSound('button_click');
                        playMusic('menu');
                      }}
                      onMouseEnter={() => playSound('menu_hover')}
                    >
                      <Home className="w-5 h-5 mr-2" />
                      Home
                    </Button>
                  </Link>
                  
                  <div className="flex gap-2">
                    {gameState === 'playing' ? (
                      <Button 
                        onClick={handlePauseGame}
                        variant="outline"
                        className="border-[rgba(var(--border-color))] text-[rgb(var(--text-primary))] hover:bg-[rgba(var(--highlight-bg))]"
                        onMouseEnter={() => playSound('menu_hover')}
                      >
                        <Pause className="w-5 h-5 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleResumeGame}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onMouseEnter={() => playSound('menu_hover')}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Resume
                      </Button>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {gameState === 'paused' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="glass-panel rounded-2xl p-8 text-center max-w-sm mx-4"
                      >
                        <h2 className="text-3xl font-bold mb-6 text-[rgb(var(--text-primary))]">Game Paused</h2>
                        <div className="space-y-4">
                          <Button 
                            onClick={handleResumeGame}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                            onMouseEnter={() => playSound('menu_hover')}
                          >
                            <Play className="w-5 h-5 mr-2" />
                            Resume Game
                          </Button>
                          <Button 
                            onClick={handleQuitGame}
                            variant="outline"
                            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20"
                            onMouseEnter={() => playSound('menu_hover')}
                          >
                            Quit Game
                          </Button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 flex items-center justify-center">
                    <GameButton 
                      onTaskComplete={handleTaskComplete} 
                      currentPlayer={players[currentPlayerIndex]} 
                      gameActive={gameState === 'playing' && resumeCountdown === 0} 
                      settings={settings}
                      gameMode="local"
                      lastTaskType={lastTaskType}
                      currentRound={currentRound}
                      isPaused={gameState === 'paused'}
                      resumeCountdown={resumeCountdown}
                    />
                  </div>
                  <div className="lg:w-80 flex flex-col items-center justify-center">
                    <div className="w-full max-w-md">
                      <ScoreBoard 
                        players={players} 
                        currentRound={currentRound} 
                        totalRounds={settings.totalRounds} 
                        onQuitGame={handleQuitGame}
                        onPlayerQuit={handlePlayerQuit}
                        gameMode="local"
                        currentPlayerIndex={currentPlayerIndex}
                      />
                      {settings.totalRounds === -1 && gameState === 'playing' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          className="mt-4"
                        >
                          <button 
                            onClick={handleEndlessStop} 
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors hover:scale-105"
                            onMouseEnter={() => playSound('menu_hover')}
                          >
                            End Game
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {gameState === 'complete' && (
              <motion.div 
                key="complete" 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 1.1 }} 
                className="flex-1 flex items-center justify-center"
              >
                <GameComplete 
                  players={players} 
                  totalRounds={currentRound - 1} 
                  onPlayAgain={handlePlayAgain}
                  isHost={false}
                  onBackToSetup={handleBackToSetup}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}