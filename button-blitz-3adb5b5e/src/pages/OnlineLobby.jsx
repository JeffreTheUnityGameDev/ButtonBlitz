import React, { useState, useEffect, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Game } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Home, Users, Settings, Play, Copy, Check, Share2, LogOut, Info, Globe, Lock, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GameSettings from '../components/game/GameSettings';
import { SettingsContext } from '../components/SettingsProvider';

const PLAYER_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

const TASKS = [
  { type: 'tap_fast', instruction: 'TAP AS FAST AS YOU CAN!', hint: 'More taps = more points!' },
  { type: 'hold_release', instruction: 'HOLD & RELEASE AT 3!', hint: 'Hold for exactly 3 seconds' },
  { type: 'avoid_red', instruction: 'DON\'T TAP RED!', hint: 'Only tap when button is blue' },
  { type: 'simon_says', instruction: 'SIMON SAYS...', hint: 'Only tap when Simon says to!' },
  { type: 'count_down', instruction: 'TAP AT ZERO!', hint: 'Wait for countdown to reach zero' },
  { type: 'stop_the_spinner', instruction: 'STOP IN GREEN ZONE!', hint: 'Tap when spinner is in green area' },
  { type: 'drag_ball', instruction: 'KEEP BALL CENTERED!', hint: 'Drag the ball to keep it in the center' },
  { type: 'color_match', instruction: 'MATCH THE COLOR!', hint: 'Tap when colors match' },
  { type: 'sequence_memory', instruction: 'REPEAT THE SEQUENCE!', hint: 'Remember and repeat the pattern' },
  { type: 'quick_math', instruction: 'SOLVE THE EQUATION!', hint: 'Tap the correct answer' }
];

const getRandomTask = (lastTaskType) => {
    let availableTasks = TASKS;
    if (lastTaskType) {
      availableTasks = TASKS.filter(task => task.type !== lastTaskType);
    }
    const randomIndex = Math.floor(Math.random() * availableTasks.length);
    return availableTasks[randomIndex];
};

export default function OnlineLobbyPage() {
  const [user, setUser] = useState(null);
  const [game, setGame] = useState(null);
  const [mode, setMode] = useState('select'); // select, create_options, public_list, join, lobby
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publicGames, setPublicGames] = useState([]);
  const [isFetchingPublic, setIsFetchingPublic] = useState(false);
  const { settings, playMusic, playSound } = useContext(SettingsContext);

  const location = useLocation();

  useEffect(() => {
    playMusic('menu');
    const initialize = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch {
        // Redirect to home if not logged in
      }
    };
    initialize();
  }, [playMusic]);

  const handleCreateRoom = async (isPublic) => {
    if (!user) return;
    playSound('button_click');
    const newRoomCode = generateRoomCode();
    
    const newGame = {
      room_code: newRoomCode,
      host_email: user.email,
      players: [{ name: user.full_name, email: user.email, score: 0, color: PLAYER_COLORS[0], status: 'active', last_seen: new Date().toISOString() }],
      game_state: 'lobby',
      game_mode: 'online',
      settings: settings, // Use global settings
      is_public: isPublic
    };
    const createdGame = await Game.create(newGame);
    setGame(createdGame);
    setMode('lobby');
  };

  const handleJoinRoomByCode = async (e) => {
    e.preventDefault();
    if (!user || !roomCode) return;
    playSound('button_click');
    try {
      const games = await Game.filter({ room_code: roomCode.toUpperCase(), game_state: 'lobby' });
      if (games.length > 0) {
        await joinGame(games[0]);
      } else {
        setError('Room not found or has already started.');
      }
    } catch (err) {
      setError('Error joining room.');
      console.error(err);
    }
  };

  const joinGame = async (targetGame) => {
    if (targetGame.players.length >= 8) {
      setError('Room is full.');
      return;
    }
    let updatedGame = targetGame;
    if (!targetGame.players.some(p => p.email === user.email)) {
      const updatedPlayers = [...targetGame.players, { name: user.full_name, email: user.email, score: 0, color: PLAYER_COLORS[targetGame.players.length], status: 'active', last_seen: new Date().toISOString() }];
      updatedGame = await Game.update(targetGame.id, { players: updatedPlayers });
    }
    setGame(updatedGame);
    setMode('lobby');
    setError('');
  };

  const fetchPublicGames = useCallback(async () => {
      playSound('ui_click');
      setIsFetchingPublic(true);
      setError('');
      try {
          const games = await Game.filter({ game_state: 'lobby', is_public: true }, '-created_date', 50);
          setPublicGames(games.filter(g => g.players.length < 8));
      } catch (e) {
          setError('Could not fetch public games.');
          console.error(e);
      } finally {
          setIsFetchingPublic(false);
      }
  }, [playSound]);

  useEffect(() => {
      if(mode === 'public_list') {
          fetchPublicGames();
      }
  }, [mode, fetchPublicGames]);


  const handleStartGame = async () => {
    if (!game || user.email !== game.host_email) return;
    
    playSound('button_click');
    const firstTask = getRandomTask(null);
    const updatedPlayers = game.players.map(p => ({...p, completed_round: false}));

    await Game.update(game.id, { 
        game_state: 'playing', 
        current_player_index: 0, 
        round: 1,
        current_task: firstTask,
        players: updatedPlayers
    });
    playMusic('game');
  };

  const handleSettingsChange = async (newSettings) => {
    if (!game || user.email !== game.host_email) return;
    const updatedGame = await Game.update(game.id, { settings: newSettings });
    setGame(updatedGame);
  };

  const handleCopyCode = () => {
    playSound('ui_click');
    navigator.clipboard.writeText(game.room_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleShare = () => {
    playSound('ui_click');
    if(navigator.share) {
      navigator.share({
        title: 'Join my Button Blitz Game!',
        text: `Join my game with code: ${game.room_code}`,
        url: window.location.href,
      });
    } else {
      handleCopyCode();
    }
  };
  
  // Lobby polling effect
  useEffect(() => {
    if (mode !== 'lobby' || !game || !user) return;

    const lobbyInterval = setInterval(async () => {
      try {
        const updatedGame = await Game.get(game.id);
        
        // Host responsibility: kick inactive players
        if (user.email === updatedGame.host_email) {
            const now = Date.now();
            const activePlayers = updatedGame.players.filter(p => {
                const lastSeenTime = new Date(p.last_seen).getTime();
                // Kick if inactive for 20 seconds
                return !(now - lastSeenTime > 20000); 
            });

            if (activePlayers.length < updatedGame.players.length) {
                const finalGame = await Game.update(updatedGame.id, { players: activePlayers });
                setGame(finalGame);
            } else {
                setGame(updatedGame);
            }
        } else {
            // Player just updates their own status
            const myPlayer = updatedGame.players.find(p => p.email === user.email);
            if (myPlayer) {
                myPlayer.last_seen = new Date().toISOString();
                await Game.update(updatedGame.id, { players: updatedGame.players });
            } else {
                // Kicked from game or game deleted, return to menu
                setMode('select');
                setGame(null);
                setError("You were removed from the lobby.");
                return;
            }
            setGame(updatedGame);
        }

        if (updatedGame.game_state === 'playing') {
          window.location.href = createPageUrl(`OnlineGame?gameId=${updatedGame.id}`);
        }
      } catch (e) {
        console.error("Lobby refresh failed", e);
        setError("Connection lost.");
        setMode('select');
        setGame(null);
      }
    }, 5000);

    return () => clearInterval(lobbyInterval);
  }, [mode, game, user]);

  const handleLeaveRoom = async () => {
      if (!game || !user) return;
      playSound('button_click');
      const updatedPlayers = game.players.filter(p => p.email !== user.email);
      
      if (user.email === game.host_email && updatedPlayers.length > 0) {
        // Host is leaving, assign a new host
        await Game.update(game.id, { players: updatedPlayers, host_email: updatedPlayers[0].email });
      } else if (updatedPlayers.length === 0) {
        // Last player is leaving, delete the game
        await Game.delete(game.id);
      } else {
        await Game.update(game.id, { players: updatedPlayers });
      }
      
      setGame(null);
      setMode('select');
  };

  if (!user) return <div className="min-h-screen bg-gradient-to-br from-[rgb(var(--background-start))] to-[rgb(var(--background-end))] flex items-center justify-center text-[rgb(var(--text-primary))]">Loading...</div>;

  const getModeText = (gameMode) => {
    const modes = {
      chill: 'Chill Mode',
      party: 'Party Mode', 
      extreme: 'Extreme Mode'
    };
    return modes[gameMode] || 'Party Mode';
  };

  const getRoundsText = (totalRounds) => {
    return totalRounds === -1 ? 'Endless Game' : `${totalRounds} Rounds`;
  };

  const renderContent = () => {
    switch (mode) {
      case 'select':
        return (
          <motion.div key="select" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
            <h1 className="text-3xl font-bold mb-8">Online Multiplayer</h1>
            <div className="space-y-4">
              <Button onClick={() => { playSound('button_click'); setMode('public_list'); }} className="w-full h-14 text-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white"><Globe className="w-5 h-5 mr-2" />Join Public Game</Button>
              <Button onClick={() => { playSound('button_click'); setMode('join'); }} className="w-full h-14 text-lg bg-[rgba(var(--highlight-bg),0.8)] text-[rgb(var(--highlight-text))]"><Lock className="w-5 h-5 mr-2" />Join with Code</Button>
              <Button onClick={() => { playSound('button_click'); setMode('create_options'); }} className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">Create Room</Button>
              <Link to={createPageUrl('Home')}><Button variant="link" className="text-[rgb(var(--text-secondary))]"><Home className="w-4 h-4 mr-2" />Back to Home</Button></Link>
            </div>
          </motion.div>
        );
      
      case 'create_options':
        return (
          <motion.div key="create_options" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
            <h1 className="text-3xl font-bold mb-8">Create a Room</h1>
            <div className="space-y-4">
              <Button onClick={() => handleCreateRoom(true)} className="w-full h-14 text-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white"><Globe className="w-5 h-5 mr-2" />Public Room</Button>
              <Button onClick={() => handleCreateRoom(false)} className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white"><Lock className="w-5 h-5 mr-2" />Private Room</Button>
              <Button variant="link" onClick={() => { playSound('button_click'); setMode('select'); }} className="text-[rgb(var(--text-secondary))]">Back</Button>
            </div>
          </motion.div>
        );

      case 'public_list':
        return (
          <motion.div key="public_list" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel rounded-2xl shadow-xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Public Games</h1>
              <Button variant="ghost" size="icon" onClick={fetchPublicGames} disabled={isFetchingPublic}><RefreshCw className={`w-5 h-5 ${isFetchingPublic ? 'animate-spin' : ''}`} /></Button>
            </div>
            <div className="space-y-3 min-h-[200px] max-h-[40vh] overflow-y-auto pr-2">
              {isFetchingPublic ? (
                  <div className="flex justify-center items-center h-full"><p>Searching for games...</p></div>
              ) : publicGames.length > 0 ? (
                publicGames.map(g => (
                  <div key={g.id} className="flex items-center justify-between p-3 bg-[rgba(var(--background-secondary),0.5)] rounded-lg">
                    <div>
                      <p className="font-semibold text-lg">{g.host_email.split('@')[0]}'s Game</p>
                      <p className="text-sm text-[rgb(var(--text-secondary))]">Players: {g.players.length}/8</p>
                    </div>
                    <Button onClick={() => { playSound('button_click'); joinGame(g); }}>Join</Button>
                  </div>
                ))
              ) : (
                <div className="flex justify-center items-center h-full text-center">
                    <p className="text-[rgb(var(--text-secondary))]">No public games found. <br/>Why not create one?</p>
                </div>
              )}
            </div>
            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
            <Button variant="link" onClick={() => { playSound('button_click'); setMode('select'); }} className="text-[rgb(var(--text-secondary))] mt-4 w-full">Back</Button>
          </motion.div>
        );

      case 'join':
        return (
          <motion.div key="join" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
            <h1 className="text-3xl font-bold mb-6">Join a Room</h1>
            <form onSubmit={handleJoinRoomByCode} className="space-y-4">
              <Input value={roomCode} onChange={e => setRoomCode(e.target.value)} placeholder="Enter 4-digit code" maxLength="4" className="text-center text-2xl tracking-[1rem] uppercase bg-transparent border-b-2 h-16"/>
              <Button type="submit" className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">Join</Button>
              {error && <p className="text-red-400">{error}</p>}
              <Button variant="link" onClick={() => { playSound('button_click'); setMode('select'); }} className="text-[rgb(var(--text-secondary))]">Back</Button>
            </form>
          </motion.div>
        );
      
      case 'lobby':
        if (!game) { setMode('select'); return null; }
        return (
          <motion.div key="lobby" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="max-w-md w-full mx-auto">
            {!showSettings && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-2xl p-4 mb-4"
              >
                <div className="flex items-center justify-center mb-2">
                  <Info className="w-4 h-4 mr-2 text-[rgb(var(--text-accent))]" />
                  <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">Game Rules</h3>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[rgb(var(--text-secondary))]">
                    <span className="font-medium text-[rgb(var(--text-primary))]">{getModeText(game.settings?.gameMode)}</span> • <span className="font-medium text-[rgb(var(--text-primary))]">{getRoundsText(game.settings?.totalRounds)}</span>
                  </p>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">
                    {game.is_public ? "Public Game" : "Private Game"}
                  </p>
                </div>
              </motion.div>
            )}

            {showSettings ? (
              <GameSettings settings={game.settings} onSettingsChange={handleSettingsChange} onClose={() => setShowSettings(false)} isHost={user.email === game.host_email}/>
            ) : (
              <div className="glass-panel rounded-2xl shadow-xl p-6">
                <div className="text-center mb-6">
                  <p className="text-[rgb(var(--text-secondary))]">{game.is_public ? "Public Game" : "Private Room Code"}</p>
                  <div className="flex items-center justify-center gap-2 my-2">
                    <h2 className="text-5xl font-bold tracking-widest">{game.room_code}</h2>
                    <Button variant="ghost" size="icon" onClick={handleCopyCode}>
                      {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleShare}><Share2 className="w-5 h-5" /></Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center"><Users className="w-5 h-5 mr-2"/>Players ({game.players.length}/8)</h3>
                  {user.email === game.host_email && (
                    <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}><Settings className="w-5 h-5" /></Button>
                  )}
                </div>
                <div className="space-y-3 mb-6 min-h-[160px]">
                  <AnimatePresence>
                    {game.players.map((p, index) => (
                      <motion.div key={p.email} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center space-x-3 p-3 bg-[rgba(var(--background-secondary),0.5)] rounded-lg">
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: p.color }}/>
                        <span className="font-medium text-lg">{p.name} {p.email === game.host_email && "(Host)"}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {user.email === game.host_email ? (
                  <Button onClick={handleStartGame} disabled={game.players.length < 2} className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-teal-500 text-white disabled:opacity-50">
                    <Play className="w-5 h-5 mr-2" /> Start Game
                  </Button>
                ) : (
                  <p className="text-center text-[rgb(var(--text-secondary))]">Waiting for host to start the game...</p>
                )}
                 <Button variant="link" onClick={handleLeaveRoom} className="text-red-400 mt-4 w-full"><LogOut className="w-4 h-4 mr-2" />Leave Room</Button>
              </div>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-[rgb(var(--background-start))] to-[rgb(var(--background-end))] text-[rgb(var(--text-primary))] p-4">
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </div>
  );
}