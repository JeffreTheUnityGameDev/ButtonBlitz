import React, { useState, useEffect, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Game } from '@/api/entities';
import { User } from '@/api/entities';
import GameButton from '../components/game/GameButton';
import ScoreBoard from '../components/game/ScoreBoard';
import GameComplete from '../components/game/GameComplete';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { SettingsContext } from '../components/SettingsProvider';
import { createPageUrl } from '@/utils';

const TASKS = [
  { type: 'tap_fast', instruction: 'TAP AS FAST AS YOU CAN!', hint: 'More taps = more points!' },
  { type: 'hold_release', instruction: 'HOLD & RELEASE AT 3!', hint: 'Hold for exactly 3 seconds' },
  { type: 'avoid_red', instruction: 'DON\'T TAP RED!', hint: 'Only tap when button is blue' },
  { type: 'simon_says', instruction: 'SIMON SAYS...', hint: 'Only tap when Simon says to!' },
  { type: 'count_down', instruction: 'TAP AT ZERO!', hint: 'Wait for countdown to reach zero' },
  { type: 'stop_the_spinner', instruction: 'STOP IN GREEN ZONE!', hint: 'Tap when spinner is in green area' },
  { type: 'drag_ball', instruction: 'KEEP BALL CENTERED!', hint: 'Drag the ball to keep it in the center' },
  { type: 'sequence_memory', instruction: 'REPEAT THE SEQUENCE!', hint: 'Remember and repeat the pattern' },
  { type: 'tap_the_dots', instruction: 'TAP ALL THE DOTS!', hint: 'Clear them before they disappear' },
  { type: 'color_grid_tap', instruction: 'TAP THE CORRECT COLOR!', hint: 'Only tap the matching color squares' },
  { type: 'rhythm_tap', instruction: 'TAP TO THE RHYTHM!', hint: 'Follow the beat pattern' },
  { type: 'follow_path', instruction: 'TRACE THE LINE!', hint: 'Stay inside the path' },
  { type: 'memory_pattern', instruction: 'REPEAT THE PATTERN!', hint: 'Remember the sequence' },
  { type: 'color_sequence', instruction: 'TAP IN ORDER!', hint: 'Remember the color order' },
  { type: 'balance_challenge', instruction: 'BALANCE THE BALLS!', hint: 'Keep them all centered' }
];

const getRandomTask = (lastTaskType) => {
    let availableTasks = TASKS;
    if (lastTaskType) {
      availableTasks = TASKS.filter(task => task.type !== lastTaskType);
    }
    const randomIndex = Math.floor(Math.random() * availableTasks.length);
    return availableTasks[randomIndex];
};

export default function OnlineGamePage() {
  const [game, setGame] = useState(null);
  const [user, setUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [lastTaskType, setLastTaskType] = useState(null);
  const [endReason, setEndReason] = useState('');
  const { playMusic, playSound, settings } = useContext(SettingsContext);

  const location = useLocation();
  const navigate = useNavigate();
  const gameId = new URLSearchParams(location.search).get('gameId');

  useEffect(() => {
    const initialize = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        const initialGame = await Game.get(gameId);
        setGame(initialGame);
        setLastTaskType(initialGame.current_task?.type);
        if (initialGame.game_state === 'playing') {
          playMusic('game');
        } else {
          playMusic('menu');
        }
      } catch (error) {
        console.error("Initialization failed:", error);
        navigate(createPageUrl('Home'));
      }
    };
    if (gameId) initialize();
  }, [gameId, playMusic, navigate]);

  // Main game loop polling
  useEffect(() => {
    if (!gameId || isGameFinished) return;

    const interval = setInterval(async () => {
      try {
        if (!user) return;

        const updatedGame = await Game.get(gameId);

        // --- HOST LOGIC ---
        if (user.email === updatedGame.host_email) {
            const now = Date.now();
            let players = updatedGame.players.filter(p => {
                const lastSeenTime = new Date(p.last_seen).getTime();
                return !(now - lastSeenTime > 20000);
            });

            let hostMadePlayerUpdate = false;
            if (players.length < updatedGame.players.length) {
                await Game.update(gameId, { players });
                hostMadePlayerUpdate = true;
            }

            const activePlayers = players.filter(p => p.status === 'active');
            const allFinished = activePlayers.length > 0 && activePlayers.every(p => p.completed_round);
            const everyoneOut = activePlayers.length <= 1;

            if (allFinished || everyoneOut) {
                if (everyoneOut) {
                    // End game if only one player left
                    await Game.update(gameId, { game_state: 'finished' });
                    setIsGameFinished(true);
                    playSound('win');
                    playMusic('menu');
                } else {
                    // Continue to next round
                    let nextRound = updatedGame.round + 1;
                    let nextGameState = updatedGame.game_state;
                    let finalTask = updatedGame.current_task;

                    if (updatedGame.settings.totalRounds !== -1 && updatedGame.round >= updatedGame.settings.totalRounds) {
                        nextGameState = 'finished';
                    } else {
                        players = players.map(p => ({...p, completed_round: false }));
                        finalTask = getRandomTask(updatedGame.current_task?.type);
                    }

                    const finalGame = await Game.update(gameId, {
                        players,
                        round: nextRound,
                        game_state: nextGameState,
                        current_task: finalTask,
                    });
                    setGame(finalGame);
                    if (finalGame.game_state === 'finished') {
                        playSound('win');
                        playMusic('menu');
                    }
                    setLastTaskType(finalGame.current_task?.type);
                }
            } else if (hostMadePlayerUpdate) {
                const gameAfterRemoval = await Game.get(gameId);
                setGame(gameAfterRemoval);
            } else {
                setGame(updatedGame);
            }
        } else {
            // --- PLAYER LOGIC ---
            const myPlayerIndex = updatedGame.players.findIndex(p => p.email === user.email);
            if(myPlayerIndex !== -1) {
              const playersCopy = [...updatedGame.players];
              playersCopy[myPlayerIndex] = {
                  ...playersCopy[myPlayerIndex],
                  last_seen: new Date().toISOString()
              };
              await Game.update(gameId, { players: playersCopy });
            }
            setGame(updatedGame);
        }

        // --- COMMON LOGIC - Auto-host promotion ---
        const finalGameCheck = await Game.get(gameId);
        
        if (finalGameCheck.game_state === 'finished' && !isGameFinished) {
            setIsGameFinished(true);
            setGame(finalGameCheck);
            playMusic('menu');
            playSound('win');
            return;
        }

        // Check if host left and auto-promote new host
        const hostExists = finalGameCheck.players.some(p => p.email === finalGameCheck.host_email);
        if (!hostExists && finalGameCheck.players.length > 1) {
          // Auto-promote a new host
          const newHost = finalGameCheck.players[0]; // Promote first remaining player
          const updatedGameWithNewHost = await Game.update(gameId, { 
            host_email: newHost.email 
          });
          setGame(updatedGameWithNewHost);
          
          if (user.email === newHost.email) {
            setEndReason('You are now the host!');
            // Clear the message after a few seconds
            setTimeout(() => setEndReason(''), 3000);
          }
        } else if (!finalGameCheck.players.some(p => p.email === user.email)) {
          // Current user was kicked/left
          setIsGameFinished(true);
          setGame(finalGameCheck);
          setEndReason('You have left the game.');
          playMusic('menu');
          return;
        } else if (finalGameCheck.players.length <= 1) {
          // Not enough players to continue
          setIsGameFinished(true);
          setGame(finalGameCheck);
          setEndReason('Not enough players to continue.');
          playMusic('menu');
          playSound('win');
          return;
        }

        setConnectionStatus('connected');
      } catch (error) {
        setConnectionStatus('disconnected');
        console.error("Failed to update game:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [gameId, user, isGameFinished, playMusic, playSound]);

  const handleTaskComplete = async (points, taskType) => {
    if (!game || !user) return;

    const myPlayerIndex = game.players.findIndex(p => p.email === user.email);
    if (myPlayerIndex === -1 || game.players[myPlayerIndex].completed_round) return;

    const updatedPlayers = [...game.players];
    updatedPlayers[myPlayerIndex] = {
        ...updatedPlayers[myPlayerIndex],
        score: updatedPlayers[myPlayerIndex].score + points,
        completed_round: true,
        last_seen: new Date().toISOString()
    };

    setGame({...game, players: updatedPlayers});
    setLastTaskType(taskType);

    await Game.update(game.id, {
      players: updatedPlayers
    });
  };

  const handlePlayAgain = async () => {
    if (!game || user.email !== game.host_email) return;
    const firstTask = getRandomTask(null);
    
    // Choose a new host randomly from the players who finished the game
    const currentPlayers = game.players;
    const newHost = currentPlayers[Math.floor(Math.random() * currentPlayers.length)];

    const resetPlayers = game.players.map(p => ({
        ...p,
        score: 0,
        completed_round: false,
        status: 'active'
    }));
    await Game.update(game.id, {
        players: resetPlayers,
        game_state: 'playing',
        round: 1,
        host_email: newHost.email,
        current_task: firstTask,
    });
    setEndReason('');
    setIsGameFinished(false);
    playMusic('game');
  };

  if (!game || !user) {
    return (
        <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-[rgb(var(--background-start))] to-[rgb(var(--background-end))] text-[rgb(var(--text-primary))] p-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[rgb(var(--text-primary))]"></div>
            <p className="mt-4 text-[rgb(var(--text-secondary))]">Loading Game...</p>
        </div>
    );
  }

  const myPlayer = game.players.find(p => p.email === user.email);
  const gameActive = game.game_state === 'playing' && myPlayer && !myPlayer.completed_round && myPlayer.status === 'active';

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-[rgb(var(--background-start))] to-[rgb(var(--background-end))] text-[rgb(var(--text-primary))] flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Connection Status */}
      <div className="absolute top-4 right-4">
        {connectionStatus === 'connected' ? (
          <div className="flex items-center text-green-400 text-sm">
            <Wifi className="w-4 h-4 mr-1" />
            Connected
          </div>
        ) : (
          <div className="flex items-center text-red-400 text-sm">
            <WifiOff className="w-4 h-4 mr-1" />
            Reconnecting...
          </div>
        )}
      </div>

      {/* Host promotion notification */}
      <AnimatePresence>
        {endReason && !isGameFinished && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-blue-500/20 text-blue-300 px-6 py-3 rounded-full backdrop-blur-sm border border-blue-500/30 z-50"
          >
            {endReason}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {game.game_state === 'playing' && !isGameFinished && myPlayer && myPlayer.status === 'active' && (
          <motion.div key="playing" className="flex-1 flex flex-col">
            <AnimatePresence>
            {myPlayer?.completed_round && (
                <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-panel rounded-2xl p-8 text-center"
                    >
                         <h2 className="text-2xl font-bold mb-4">Round Finished!</h2>
                         <p className="text-[rgb(var(--text-secondary))]">Waiting for other players...</p>
                         <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--text-primary))] mx-auto"></div>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col lg:flex-row gap-8">
              <div className="flex-1 flex items-center justify-center">
                <GameButton
                  onTaskComplete={handleTaskComplete}
                  currentPlayer={myPlayer}
                  gameActive={gameActive}
                  settings={settings}
                  gameMode="online"
                  syncedTask={game.current_task}
                  lastTaskType={lastTaskType}
                  currentRound={game.round}
                />
              </div>

              <div className="lg:w-80 flex flex-col items-center justify-center">
                 <div className="w-full max-w-md">
                    <ScoreBoard
                      players={game.players}
                      currentRound={game.round}
                      totalRounds={game.settings.totalRounds}
                      gameMode="online"
                    />
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {(game.game_state === 'finished' || isGameFinished) && (
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex items-center justify-center">
            <GameComplete
              players={game.players}
              onPlayAgain={handlePlayAgain}
              isHost={user.email === game.host_email}
              endReason={endReason}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}