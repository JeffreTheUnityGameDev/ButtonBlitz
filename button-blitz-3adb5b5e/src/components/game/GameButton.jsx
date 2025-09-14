
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsContext } from '../SettingsProvider';

const TASKS = [
  { type: 'tap_fast', instruction: 'TAP FAST!', hint: 'More taps = more points!' },
  { type: 'hold_release', instruction: 'HOLD & RELEASE!', hint: 'Release at the right time!' },
  { type: 'avoid_red', instruction: 'DON\'T TAP RED!', hint: 'Only tap when the button is blue' },
  { type: 'simon_says', instruction: 'SIMON SAYS...', hint: 'Only tap when Simon says to!' },
  { type: 'count_down', instruction: 'TAP AT ZERO!', hint: 'Wait for the countdown!' },
  { type: 'stop_the_spinner', instruction: 'STOP IN GREEN!', hint: 'Tap when the spinner is in the green area' },
  { type: 'drag_ball', instruction: 'CENTER THE BALL!', hint: 'Drag the ball to the center' },
  { type: 'sequence_memory', instruction: 'REPEAT SEQUENCE!', hint: 'Remember and repeat the pattern' },
  { type: 'tap_the_dots', instruction: 'TAP ALL DOTS!', hint: 'Clear them before they disappear' },
  { type: 'color_sequence', instruction: 'TAP COLORS IN ORDER!', hint: 'Remember the color order' },
  { type: 'swipe_direction', instruction: 'SWIPE!', hint: 'Swipe in the correct direction' },
  { type: 'button_mash', instruction: 'MASH NOW!', hint: 'Tap as fast as possible!' },
  { type: 'color_flash', instruction: 'WHAT COLOR?', hint: 'Remember the flashed color' },
  { type: 'reaction_test', instruction: 'WAIT FOR GREEN!', hint: 'Tap when screen turns green' },
  { type: 'follow_leader', instruction: 'COPY SEQUENCE!', hint: 'Repeat the taps shown' },
  { type: 'memory_cards', instruction: 'MATCH PAIRS!', hint: 'Find matching cards' },
  { type: 'rhythm_tap', instruction: 'TAP THE RHYTHM!', hint: 'Follow the beat pattern' },
  { type: 'shape_match', instruction: 'ALIGN SHAPES!', hint: 'Tap when shapes line up' },
  { type: 'speed_tap', instruction: 'PRECISE TIMING!', hint: 'Tap at the exact moment' },
  { type: 'balance_challenge', instruction: 'GATHER ORBS!', hint: 'Drag all orbs to the center' }
];

export default function GameButton({ 
  onTaskComplete, 
  currentPlayer, 
  gameActive, 
  settings, 
  onUpdateActivity, 
  syncedTask, 
  gameMode = 'local', 
  lastTaskType, 
  currentRound = 1,
  isPaused = false,
  resumeCountdown = 0
}) {
  const [currentTask, setCurrentTask] = useState(null);
  const [taskState, setTaskState] = useState('waiting');
  const [taskData, setTaskData] = useState({});
  const [buttonColor, setButtonColor] = useState('rgb(59, 130, 246)');
  const [hint, setHint] = useState('');
  const [ballPosition, setBallPosition] = useState({ x: 0, y: 0 }); // Used for drag_ball (ball pos) and balance_challenge (pointer pos)
  const [userPointerPosition, setUserPointerPosition] = useState({ x: 0, y: 0 }); // Raw clientX/Y for swipe/drag detection
  const [isDragging, setIsDragging] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [holdDuration, setHoldDuration] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [pointAnimations, setPointAnimations] = useState([]);
  const [taskDuration, setTaskDuration] = useState(5000);
  const [screenShake, setScreenShake] = useState(false);
  const [particles, setParticles] = useState([]);
  const [screenFlash, setScreenFlash] = useState(null);
  
  const { playSound } = useContext(SettingsContext);

  const taskTimerRef = useRef(null);
  const taskActiveRef = useRef(false);
  const buttonRef = useRef(null);
  const sequenceTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const holdTimerRef = useRef(null);
  const memoryPatternTimeoutRef = useRef(null); // Not used currently, but kept for consistency
  const colorSequenceTimeoutRef = useRef(null); // Not used currently, but kept for consistency
  const rhythmBeatIntervalRef = useRef(null);
  const balanceCheckIntervalRef = useRef(null);

  const taskDataRef = useRef(taskData);
  const ballPositionRef = useRef(ballPosition); // For drag_ball / balance_challenge magnet

  useEffect(() => {
    taskDataRef.current = taskData;
  }, [taskData]);

  useEffect(() => {
    ballPositionRef.current = ballPosition;
  }, [ballPosition]);

  const vibrate = useCallback(() => {
    if (settings?.vibrationEnabled && navigator.vibrate) navigator.vibrate(50);
  }, [settings?.vibrationEnabled]);

  const updateActivity = useCallback((activity) => {
    if (onUpdateActivity) onUpdateActivity(activity);
  }, [onUpdateActivity]);

  const clearAllTimers = useCallback(() => {
    clearTimeout(taskTimerRef.current);
    clearTimeout(sequenceTimerRef.current);
    clearInterval(countdownRef.current);
    clearInterval(holdTimerRef.current);
    clearInterval(rhythmBeatIntervalRef.current);
    clearTimeout(memoryPatternTimeoutRef.current);
    clearTimeout(colorSequenceTimeoutRef.current);
    clearInterval(balanceCheckIntervalRef.current);
    countdownRef.current = null; // Clear interval IDs to prevent accidental reuse
    holdTimerRef.current = null;
    rhythmBeatIntervalRef.current = null;
    balanceCheckIntervalRef.current = null;
    taskTimerRef.current = null;
  }, []);

  const createParticles = useCallback((count, color = '#FFD700') => {
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 50 - 25,
      y: Math.random() * 50 - 25,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200,
      color,
      life: 1
    }));
    setParticles(prev => [...prev, ...newParticles]);
    
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 2000);
  }, []);

  const animatePoints = useCallback((points) => {
    const newAnimation = {
      id: Date.now() + Math.random(),
      points: `+${points}`,
      x: Math.random() * 50 - 25,
      y: -20,
    };
    setPointAnimations(prev => [...prev, newAnimation]);
    setTimeout(() => {
      setPointAnimations(prev => prev.filter(p => p.id !== newAnimation.id));
    }, 1500);
  }, []);

  const triggerScreenFlash = useCallback((color, duration = 300) => {
    setScreenFlash(color);
    setTimeout(() => setScreenFlash(null), duration);
  }, []);

  const handleTaskSuccess = useCallback((points) => {
    if (!taskActiveRef.current) return;
    taskActiveRef.current = false;
    playSound('success');
    setTaskState('success');
    setButtonColor('rgb(16, 185, 129)');
    updateActivity(`✅ Scored ${points} points!`);
    animatePoints(points);
    createParticles(30, '#10B981');
    setScreenShake(true);
    triggerScreenFlash('rgba(16, 185, 129, 0.2)');
    setTimeout(() => setScreenShake(false), 200);
    clearAllTimers();
    
    setTimeout(() => {
      onTaskComplete(points, currentTask?.type);
      setCurrentTask(null);
      setTaskState('waiting');
      setTaskData({});
      setBallPosition({ x: 0, y: 0 });
      setUserPointerPosition({ x: 0, y: 0 });
      setTimeLeft(0);
      setHoldDuration(0);
      setTapCount(0);
    }, 1500);
  }, [onTaskComplete, updateActivity, currentTask?.type, playSound, clearAllTimers, animatePoints, createParticles, triggerScreenFlash]);

  const handleTaskFailure = useCallback(() => {
    if (!taskActiveRef.current) return;
    taskActiveRef.current = false;
    playSound('fail');
    setTaskState('failure');
    setButtonColor('rgb(239, 68, 68)');
    updateActivity('❌ Failed the challenge');
    setScreenShake(true);
    triggerScreenFlash('rgba(239, 68, 68, 0.2)');
    setTimeout(() => setScreenShake(false), 300);
    clearAllTimers();
    
    setTimeout(() => {
      onTaskComplete(0, currentTask?.type);
      setCurrentTask(null);
      setTaskState('waiting');
      setTaskData({});
      setBallPosition({ x: 0, y: 0 });
      setUserPointerPosition({ x: 0, y: 0 });
      setTimeLeft(0);
      setHoldDuration(0);
      setTapCount(0);
    }, 1500);
  }, [onTaskComplete, updateActivity, currentTask?.type, playSound, clearAllTimers, triggerScreenFlash]);

  const getRandomTask = useCallback(() => {
    let availableTasks = TASKS;
    if (lastTaskType) {
      availableTasks = TASKS.filter(task => task.type !== lastTaskType);
    }
    const randomIndex = Math.floor(Math.random() * availableTasks.length);
    return availableTasks[randomIndex];
  }, [lastTaskType]);

  const getSpeedMultiplier = useCallback(() => {
    const roundMultiplier = 1 + Math.min(currentRound / 15, 1) * 0.4;
    
    let modeMultiplier = 1.0;
    if (settings?.gameMode === 'extreme') modeMultiplier = 1.3;
    if (settings?.gameMode === 'chill') modeMultiplier = 0.8;

    return roundMultiplier * modeMultiplier;
  }, [currentRound, settings?.gameMode]);

  const getDynamicTimer = useCallback(() => {
    if (settings?.gameMode === 'extreme') return 2000;
    if (settings?.gameMode === 'party') return 3000;
    return 5000; // chill
  }, [settings?.gameMode]);

  const startInteractionTimer = useCallback((duration) => {
    setTimeLeft(duration);
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 50;
        if (newTime <= 1000 && newTime > 950) playSound('countdown_tick');
        return Math.max(0, newTime);
      });
    }, 50);
    
    taskTimerRef.current = setTimeout(() => {
      if (taskActiveRef.current) handleTaskFailure();
    }, duration);
  }, [playSound, handleTaskFailure]);

  const startGame = useCallback(() => {
    if (!gameActive || taskActiveRef.current || isPaused || resumeCountdown > 0) return;
    taskActiveRef.current = true;

    let selectedTask;
    if (gameMode === 'online' && syncedTask) {
      selectedTask = syncedTask;
    } else {
      selectedTask = getRandomTask();
    }
    
    setCurrentTask(selectedTask);
    setTaskState('active');
    setButtonColor('rgb(59, 130, 246)');
    setHint(settings?.showHints ? selectedTask.hint : '');
    updateActivity(`🎯 Playing: ${selectedTask.instruction}`);
    setTapCount(0);
    setBallPosition({ x: 0, y: 0 }); // Reset ball position for new task
    setUserPointerPosition({ x: 0, y: 0 }); // Reset pointer position
    
    let taskSpecificData = {};
    
    const baseDuration = getDynamicTimer();
    const speedMultiplier = getSpeedMultiplier();
    const duration = Math.max(1000, baseDuration / speedMultiplier);
    setTaskDuration(duration);

    clearAllTimers();

    const tasksWithDelayedTimer = ['sequence_memory', 'color_sequence', 'follow_leader', 'memory_cards'];
    
    // For tasks with initial showing/memorizing phase, set timer later
    if (tasksWithDelayedTimer.includes(selectedTask.type)) {
      setTimeLeft(0); 
    } else {
      // Start timer immediately for other tasks
      startInteractionTimer(duration);
    }

    switch(selectedTask.type) {
      case 'simon_says': {
        const says = Math.random() > 0.3;
        const simonActions = ['TAP!', 'PRESS!', 'HIT!', 'TOUCH!', 'CLICK!'];
        const noSimonActions = ['WAIT!', 'DON\'T MOVE!', 'STOP!', 'FREEZE!'];
        
        const action = says ? 
          simonActions[Math.floor(Math.random() * simonActions.length)] : 
          noSimonActions[Math.floor(Math.random() * noSimonActions.length)];
        
        taskSpecificData = { says, action, tapped: false };
        break;
      }

      case 'avoid_red': {
        taskSpecificData = { isRed: false, correctTaps: 0 };
        setButtonColor('rgb(59, 130, 246)');
        
        const flashSpeed = Math.max(400, 800 / speedMultiplier);
        const flashInterval = setInterval(() => {
          if (!taskActiveRef.current) {
            clearInterval(flashInterval);
            return;
          }
          setTaskData(prev => {
            const newIsRed = Math.random() > 0.6;
            setButtonColor(newIsRed ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)');
            return { ...prev, isRed: newIsRed };
          });
        }, flashSpeed);
        
        // This task has its own success condition, but a failure condition by timeout
        taskTimerRef.current = setTimeout(() => {
          if (taskActiveRef.current) {
            clearInterval(flashInterval);
            const points = Math.max(50, (taskDataRef.current.correctTaps || 0) * 15);
            handleTaskSuccess(points);
          }
        }, duration);
        break;
      }

      case 'tap_fast':
      case 'button_mash': {
        taskSpecificData = { tapCount: 0 };
        // These tasks complete by timeout
        taskTimerRef.current = setTimeout(() => {
          if (taskActiveRef.current) {
            const finalTapCount = taskDataRef.current.tapCount || 0;
            const points = Math.max(10, finalTapCount * 3);
            handleTaskSuccess(points);
          }
        }, duration);
        break;
      }

      case 'hold_release': {
        const holdTargetTime = Math.random() * 3 + 1.5; // 1.5-4.5 seconds
        taskSpecificData = { startTime: null, holding: false, targetTime: parseFloat(holdTargetTime.toFixed(1)) };
        break;
      }

      case 'count_down': {
        const startCount = Math.floor(Math.random() * 4) + 3; // 3-6
        const countSpeed = Math.max(300, (Math.random() * 500 + 600) / speedMultiplier);
        taskSpecificData = { count: startCount, originalCount: startCount };
        const countInterval = setInterval(() => {
          setTaskData(prev => {
            if (prev.count <= 0) {
              clearInterval(countInterval);
              return prev;
            }
            playSound('countdown_tick');
            return { ...prev, count: prev.count - 1 };
          });
        }, countSpeed);
        break;
      }

      case 'swipe_direction': {
        const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        const targetDirection = directions[Math.floor(Math.random() * directions.length)];
        taskSpecificData = { targetDirection, swiped: false, startTouch: null };
        break;
      }

      case 'color_flash': {
        const flashColors = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B'];
        const flashColor = flashColors[Math.floor(Math.random() * flashColors.length)];
        taskSpecificData = { flashColor, showingFlash: true, answered: false };
        
        setTimeout(() => {
          if (taskActiveRef.current) {
            setButtonColor(flashColor);
            playSound('ding');
          }
        }, 500);
        
        setTimeout(() => {
          if (taskActiveRef.current) {
            setButtonColor('rgb(100, 116, 139)'); // Neutral color after flash
            setTaskData(prev => ({ ...prev, showingFlash: false }));
          }
        }, 1000); // Color visible for 500ms
        break;
      }

      case 'reaction_test': {
        taskSpecificData = { showGreen: false };
        const reactionDelay = Math.random() * 3000 + 1000;
        setTimeout(() => {
          if (taskActiveRef.current) {
            setTaskData(prev => ({ ...prev, showGreen: true }));
            setButtonColor('rgb(34, 197, 94)');
            playSound('ding');
          }
        }, reactionDelay);
        break;
      }

      case 'stop_the_spinner': {
        const spinnerSpeed = Math.max(3, 12 / speedMultiplier); // Max speed increased for more challenge
        taskSpecificData = { rotation: 0, spinnerSpeed, stopped: false };
        break;
      }

      case 'drag_ball': {
        taskSpecificData = { ballX: 0, ballY: 0, targetReached: false };
        // This task has its own success condition, but a failure condition by timeout
        taskTimerRef.current = setTimeout(() => {
          if (taskActiveRef.current) {
            handleTaskFailure();
          }
        }, duration);
        break;
      }
      
      case 'tap_the_dots': {
        const numDots = Math.floor(Math.random() * 3) + 3;
        const dots = Array.from({ length: numDots }).map(() => ({
          id: Math.random(),
          x: Math.random() * 150 - 75, // within button area
          y: Math.random() * 150 - 75, // within button area
          size: Math.random() * 10 + 20,
        }));
        taskSpecificData = { dots, originalDotCount: numDots, tappedDots: new Set() };
        // This task has its own success condition, but a failure condition by timeout
        taskTimerRef.current = setTimeout(() => {
          if (taskActiveRef.current) {
            handleTaskFailure();
          }
        }, duration);
        break;
      }

      case 'sequence_memory': {
        const sequenceLength = Math.min(3 + Math.floor(currentRound / 3), 6);
        const sequence = Array.from({ length: sequenceLength }).map(() => Math.floor(Math.random() * 4));
        taskSpecificData = { 
          sequence, 
          userSequence: [], 
          showingSequence: true, 
          currentStep: 0,
          sequenceColors: ['#EF4444', '#10B981', '#3B82F6', '#F59E0B'] // Red, Green, Blue, Yellow
        };
        
        const showSequenceStep = (index) => {
          if (index < sequence.length && taskActiveRef.current) {
            const color = taskSpecificData.sequenceColors[sequence[index]];
            setButtonColor(color);
            playSound('ding');
            setTimeout(() => {
              if (taskActiveRef.current) setButtonColor('rgb(59, 130, 246)');
            }, 400);
            sequenceTimerRef.current = setTimeout(() => showSequenceStep(index + 1), 700);
          } else if (taskActiveRef.current) {
            setTaskData(prev => ({ ...prev, showingSequence: false }));
            startInteractionTimer(duration); // Start timer after sequence shown
          }
        };
        showSequenceStep(0);
        break;
      }

      case 'color_sequence': {
        const colorSeqLength = Math.min(3 + Math.floor(currentRound / 4), 5);
        const colorSeq = Array.from({ length: colorSeqLength }).map(() => Math.floor(Math.random() * 4));
        taskSpecificData = { 
          sequence: colorSeq, 
          userSequence: [], 
          showingSequence: true, 
          currentStep: 0,
          colors: ['#EF4444', '#10B981', '#3B82F6', '#F59E0B']
        };
        
        const showColorStep = (index) => {
          if (index < colorSeq.length && taskActiveRef.current) {
            const color = taskSpecificData.colors[colorSeq[index]];
            setButtonColor(color);
            playSound('positive_tap');
            setTimeout(() => {
              if (taskActiveRef.current) setButtonColor('rgb(59, 130, 246)');
            }, 500);
            sequenceTimerRef.current = setTimeout(() => showColorStep(index + 1), 800);
          } else if (taskActiveRef.current) {
            setTaskData(prev => ({ ...prev, showingSequence: false }));
            startInteractionTimer(duration); // Start timer after sequence shown
          }
        };
        showColorStep(0);
        break;
      }

      case 'follow_leader': {
        const leaderLength = Math.min(3 + Math.floor(currentRound / 5), 5);
        const leaderSequence = Array.from({ length: leaderLength }).map(() => ({
          x: Math.random() * 100 - 50,
          y: Math.random() * 100 - 50,
          delay: 500
        }));
        taskSpecificData = { 
          sequence: leaderSequence, 
          userSequence: [], 
          showingSequence: true, 
          currentStep: 0 
        };
        
        const showLeaderStep = (index) => {
          if (index < leaderSequence.length && taskActiveRef.current) {
            playSound('positive_tap');
            setTaskData(prev => ({ ...prev, currentStep: index }));
            sequenceTimerRef.current = setTimeout(() => showLeaderStep(index + 1), 700);
          } else if (taskActiveRef.current) {
            setTaskData(prev => ({ ...prev, showingSequence: false, currentStep: 0 }));
            startInteractionTimer(duration); // Start timer after sequence shown
          }
        };
        showLeaderStep(0);
        break;
      }

      case 'memory_cards': {
        const numPairs = Math.min(2 + Math.floor(currentRound / 6), 4);
        const cardSymbols = ['⭐', '❤️', '🔥', '💎', '🍀', '💡']; // Expanded symbols for more pairs
        const availableSymbols = cardSymbols.slice(0, numPairs);
        const cards = [];
        for (let i = 0; i < numPairs; i++) {
          cards.push(
            { id: i * 2, symbol: availableSymbols[i], matched: false, flipped: false, index: i * 2 },
            { id: i * 2 + 1, symbol: availableSymbols[i], matched: false, flipped: false, index: i * 2 + 1 }
          );
        }
        // Shuffle cards
        for (let i = cards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        taskSpecificData = { 
          cards, 
          flippedCards: [], 
          matches: 0,
          totalPairs: numPairs,
          showingAll: true
        };
        
        // Show all cards briefly, then hide and start game
        sequenceTimerRef.current = setTimeout(() => {
          if (taskActiveRef.current) {
            setTaskData(prev => ({ 
              ...prev, 
              showingAll: false,
              cards: prev.cards.map(card => ({ ...card, flipped: false }))
            }));
            startInteractionTimer(duration); // Start timer after cards are hidden
          }
        }, 2000);
        break;
      }

      case 'rhythm_tap': {
        const bpm = Math.max(80, 120 - Math.floor(currentRound / 2));
        const beatInterval = 60 / bpm * 1000;
        taskSpecificData = { 
          bpm, 
          beatInterval, 
          beats: [], 
          nextBeat: Date.now() + beatInterval,
          correctTaps: 0,
          totalBeats: 8
        };
        
        let beatCount = 0;
        rhythmBeatIntervalRef.current = setInterval(() => {
          if (!taskActiveRef.current || beatCount >= taskDataRef.current.totalBeats) {
            clearInterval(rhythmBeatIntervalRef.current);
            if (taskActiveRef.current) {
              const points = Math.max(20, taskDataRef.current.correctTaps * 15);
              handleTaskSuccess(points);
            }
            return;
          }
          
          playSound('beep');
          setTaskData(prev => ({ 
            ...prev, 
            nextBeat: Date.now() + beatInterval,
            beats: [...prev.beats, Date.now()]
          }));
          beatCount++;
        }, beatInterval);
        break;
      }

      case 'shape_match': {
        const shapes = ['●', '■', '▲', '♦'];
        const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
        taskSpecificData = { 
          shapes, 
          targetShape, 
          currentShape: shapes[0], 
          shapeIndex: 0,
          aligned: false
        };
        
        const shapeInterval = setInterval(() => {
          if (!taskActiveRef.current) {
            clearInterval(shapeInterval);
            return;
          }
          setTaskData(prev => {
            const nextIndex = (prev.shapeIndex + 1) % shapes.length;
            return {
              ...prev,
              shapeIndex: nextIndex,
              currentShape: shapes[nextIndex],
              aligned: shapes[nextIndex] === prev.targetShape
            };
          });
        }, 800);
        break;
      }

      case 'speed_tap': {
        const speedTapTargetTime = Math.random() * 2 + 2; // 2-4 seconds
        taskSpecificData = { 
          targetTime: speedTapTargetTime, 
          showTarget: false, 
          tapped: false 
        };
        
        setTimeout(() => {
          if (taskActiveRef.current) {
            setTaskData(prev => ({ ...prev, showTarget: true }));
            setButtonColor('rgb(34, 197, 94)');
            playSound('ding');
          }
        }, speedTapTargetTime * 1000);
        break;
      }

      case 'balance_challenge': {
        const numOrbs = Math.min(3 + Math.floor(currentRound / 4), 6);
        const orbs = Array.from({ length: numOrbs }).map((_, i) => ({
          id: i,
          x: Math.random() * 150 - 75, // within button area
          y: Math.random() * 150 - 75, // within button area
          vx: (Math.random() - 0.5) * 4, // faster initial velocity
          vy: (Math.random() - 0.5) * 4,
          collected: false
        }));
        taskSpecificData = { orbs, collected: 0, totalOrbs: numOrbs };
        
        // Physics simulation
        balanceCheckIntervalRef.current = setInterval(() => {
          if (!taskActiveRef.current) {
            clearInterval(balanceCheckIntervalRef.current);
            return;
          }
          
          setTaskData(prev => {
            const magnetX = ballPositionRef.current.x;
            const magnetY = ballPositionRef.current.y;
            const attractionStrength = 0.05; // How strongly orbs are pulled to magnet
            const repulsionStrength = 0.5; // How strongly orbs repel each other
            const drag = 0.98; // Friction

            const updatedOrbs = prev.orbs.map(orb => {
              if (orb.collected) return orb;
              
              let newX = orb.x;
              let newY = orb.y;
              let newVx = orb.vx;
              let newVy = orb.vy;

              // Attraction to magnet (user pointer)
              const dxToMagnet = magnetX - newX;
              const dyToMagnet = magnetY - newY;
              const distToMagnet = Math.sqrt(dxToMagnet * dxToMagnet + dyToMagnet * dyToMagnet);

              if (distToMagnet > 5) { // Only attract if not too close
                newVx += dxToMagnet * attractionStrength;
                newVy += dyToMagnet * attractionStrength;
              }

              // Orb-orb repulsion
              prev.orbs.forEach(otherOrb => {
                if (orb.id !== otherOrb.id && !otherOrb.collected) {
                  const dx = orb.x - otherOrb.x;
                  const dy = orb.y - otherOrb.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist < 40 && dist > 0) { // Repel if close
                    newVx += (dx / dist) * repulsionStrength;
                    newVy += (dy / dist) * repulsionStrength;
                  }
                }
              });

              // Apply drag
              newVx *= drag;
              newVy *= drag;

              // Update position
              newX += newVx;
              newY += newVy;
              
              // Bounce off boundaries (e.g., button edge, simplified to a square)
              const boundary = 120; // roughly inner radius
              if (newX > boundary) { newX = boundary; newVx = -Math.abs(newVx); }
              if (newX < -boundary) { newX = -boundary; newVx = Math.abs(newVx); }
              if (newY > boundary) { newY = boundary; newVy = -Math.abs(newVy); }
              if (newY < -boundary) { newY = -boundary; newVy = Math.abs(newVy); }

              // Check if collected (close enough to magnet)
              if (distToMagnet < 20) { // smaller radius for collection
                playSound('pop');
                return { ...orb, collected: true };
              }
              
              return { ...orb, x: newX, y: newY, vx: newVx, vy: newVy };
            });
            
            const newCollected = updatedOrbs.filter(orb => orb.collected).length;
            if (newCollected === prev.totalOrbs) {
              handleTaskSuccess(100 + newCollected * 20);
            }
            
            return { ...prev, orbs: updatedOrbs, collected: newCollected };
          });
        }, 50); // physics update every 50ms
        
        // This task has its own success condition, but a failure condition by timeout
        taskTimerRef.current = setTimeout(() => {
          if (taskActiveRef.current) {
            handleTaskFailure();
          }
        }, duration);
        break;
      }

      default:
        break;
    }
    
    setTaskData(taskSpecificData);
    playSound('start');
  }, [
    gameActive, 
    settings?.showHints, 
    updateActivity, 
    handleTaskSuccess, 
    handleTaskFailure, 
    getRandomTask, 
    gameMode, 
    syncedTask, 
    getSpeedMultiplier, 
    getDynamicTimer,
    playSound,
    isPaused,
    resumeCountdown,
    clearAllTimers,
    currentRound,
    startInteractionTimer
  ]);

  // Hold timer
  useEffect(() => {
    if (currentTask?.type === 'hold_release' && taskData.holding && taskData.startTime) { 
      holdTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - taskData.startTime) / 1000;
        setHoldDuration(elapsed);
      }, 50);
    } else {
      clearInterval(holdTimerRef.current);
      if (!taskData.holding) { 
        setHoldDuration(0);
      }
    }
    return () => clearInterval(holdTimerRef.current);
  }, [currentTask?.type, taskData.holding, taskData.startTime]); 

  // Spinner animation for 'stop_the_spinner'
  useEffect(() => {
    if (currentTask?.type === 'stop_the_spinner' && taskState === 'active' && !taskData.stopped) {
      let animationFrame;
      const animateSpinner = () => {
        setTaskData(prev => ({
          ...prev,
          rotation: (prev.rotation + prev.spinnerSpeed) % 360
        }));
        animationFrame = requestAnimationFrame(animateSpinner);
      };
      animationFrame = requestAnimationFrame(animateSpinner);
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [currentTask?.type, taskState, taskData.stopped, taskData.spinnerSpeed]);

  const handleTap = useCallback((e) => {
    if (taskState !== 'active' || !taskActiveRef.current || !currentTask) return;
    
    vibrate();

    switch(currentTask.type) {
      case 'avoid_red':
        if (taskDataRef.current.isRed) {
          playSound('negative_tap');
          handleTaskFailure();
        } else {
          setTaskData(prev => ({ ...prev, correctTaps: (prev.correctTaps || 0) + 1 }));
          playSound('positive_tap');
          createParticles(3, '#10B981');
        }
        break;
      
      case 'simon_says':
        if (taskDataRef.current.tapped) return; // Prevent multiple taps
        if (taskDataRef.current.says) {
          handleTaskSuccess(100);
        } else {
          handleTaskFailure();
        }
        setTaskData(prev => ({...prev, tapped: true}));
        break;
        
      case 'count_down':
        if (taskDataRef.current.count <= 0) {
          handleTaskSuccess(120);
        } else {
          handleTaskFailure();
        }
        break;

      case 'stop_the_spinner':
        if (!taskDataRef.current.stopped) {
          const { rotation } = taskDataRef.current;
          // Green zone is from 330° to 30° (60° total)
          const inGreenZone = rotation >= 330 || rotation <= 30;

          if (inGreenZone) {
            setTaskData(prev => ({ ...prev, stopped: true }));
            handleTaskSuccess(150);
          } else {
            handleTaskFailure();
          }
        }
        break;

      case 'tap_the_dots': {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const tapX = e.touches ? (e.touches[0].clientX - rect.left - rect.width / 2) : (e.clientX - rect.left - rect.width / 2);
        const tapY = e.touches ? (e.touches[0].clientY - rect.top - rect.height / 2) : (e.clientY - rect.top - rect.height / 2);

        let tappedDot = null;
        const newDots = taskDataRef.current.dots.filter(dot => {
            const dist = Math.sqrt((tapX - dot.x)**2 + (tapY - dot.y)**2);
            if (dist < dot.size && !taskDataRef.current.tappedDots.has(dot.id)) {
                tappedDot = dot;
                return false; // Remove this dot
            }
            return true; // Keep this dot
        });

        if (tappedDot) {
            playSound('positive_tap');
            createParticles(5, '#3B82F6');
            setTaskData(prev => ({
                ...prev, 
                dots: newDots,
                tappedDots: new Set([...prev.tappedDots, tappedDot.id])
            }));
            
            if (newDots.length === 0) {
                handleTaskSuccess(100 + (taskDataRef.current.originalDotCount * 10));
            }
        } else {
            playSound('negative_tap');
        }
        break;
      }

      case 'reaction_test':
        if (taskDataRef.current.showGreen) { 
          handleTaskSuccess(130);
        } else {
          handleTaskFailure();
        }
        break;

      case 'sequence_memory': {
        if (taskDataRef.current.showingSequence) return;
        
        // Determine which color was tapped based on button area
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const tapX = e.touches ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const tapY = e.touches ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
        
        // Divide button into 4 quadrants for 4 colors (0:TL, 1:TR, 2:BL, 3:BR)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        let colorIndex;
        if (tapX < centerX && tapY < centerY) colorIndex = 0; // Top-left
        else if (tapX >= centerX && tapY < centerY) colorIndex = 1; // Top-right
        else if (tapX < centerX && tapY >= centerY) colorIndex = 2; // Bottom-left
        else colorIndex = 3; // Bottom-right
        
        const expectedColor = taskDataRef.current.sequence[taskDataRef.current.userSequence.length];
        
        if (colorIndex === expectedColor) {
          playSound('positive_tap');
          const newUserSequence = [...taskDataRef.current.userSequence, colorIndex];
          setTaskData(prev => ({ ...prev, userSequence: newUserSequence }));
          
          // Flash the correct color on the button itself briefly
          const colorToFlash = taskDataRef.current.sequenceColors[colorIndex];
          setButtonColor(colorToFlash);
          setTimeout(() => setButtonColor('rgb(59, 130, 246)'), 150);
          
          if (newUserSequence.length === taskDataRef.current.sequence.length) {
            handleTaskSuccess(100 + taskDataRef.current.sequence.length * 20);
          }
        } else {
          handleTaskFailure();
        }
        break;
      }

      case 'color_sequence': {
        if (taskDataRef.current.showingSequence) return;
        
        // Same quadrant logic as sequence_memory
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const tapX = e.touches ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const tapY = e.touches ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        let colorIndex;
        if (tapX < centerX && tapY < centerY) colorIndex = 0;
        else if (tapX >= centerX && tapY < centerY) colorIndex = 1;
        else if (tapX < centerX && tapY >= centerY) colorIndex = 2;
        else colorIndex = 3;
        
        const expectedColorIndex = taskDataRef.current.sequence[taskDataRef.current.userSequence.length];
        
        if (colorIndex === expectedColorIndex) {
          playSound('positive_tap');
          const newUserSeq = [...taskDataRef.current.userSequence, colorIndex];
          setTaskData(prev => ({ ...prev, userSequence: newUserSeq }));
          
          const colorToFlash = taskDataRef.current.colors[colorIndex];
          setButtonColor(colorToFlash);
          setTimeout(() => setButtonColor('rgb(59, 130, 246)'), 150);
          
          if (newUserSeq.length === taskDataRef.current.sequence.length) {
            handleTaskSuccess(120 + taskDataRef.current.sequence.length * 25);
          }
        } else {
          handleTaskFailure();
        }
        break;
      }

      case 'color_flash':
        if (taskDataRef.current.showingFlash || taskDataRef.current.answered) { // Fail if tapped too early or already answered
          handleTaskFailure();
        } else {
          // If tapped after flash, assume they remembered
          handleTaskSuccess(140);
        }
        setTaskData(prev => ({ ...prev, answered: true }));
        break;

      case 'follow_leader': {
        if (taskDataRef.current.showingSequence) return;
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const clickX = e.touches ? (e.touches[0].clientX - rect.left - rect.width / 2) : (e.clientX - rect.left - rect.width / 2);
        const clickY = e.touches ? (e.touches[0].clientY - rect.top - rect.height / 2) : (e.clientY - rect.top - rect.height / 2);
        
        const expectedStep = taskDataRef.current.sequence[taskDataRef.current.userSequence.length];
        const distance = Math.sqrt((clickX - expectedStep.x)**2 + (clickY - expectedStep.y)**2);
        
        if (distance < 50) { // Tolerance for tap location
          playSound('positive_tap');
          const newUserSeq = [...taskDataRef.current.userSequence, { x: clickX, y: clickY }];
          setTaskData(prev => ({ ...prev, userSequence: newUserSeq }));
          
          if (newUserSeq.length === taskDataRef.current.sequence.length) {
            handleTaskSuccess(110 + taskDataRef.current.sequence.length * 15);
          }
        } else {
          handleTaskFailure();
        }
        break;
      }

      case 'rhythm_tap':
        const now = Date.now();
        // Check against the expected time for the NEXT beat (which is nextBeat)
        // or against the time of the LAST beat, and check tolerance.
        // If nextBeat represents the *target* for the current tap, this is OK.
        // Let's assume taskData.nextBeat is the timestamp of the *next expected tap*.
        const timeDiff = Math.abs(now - taskDataRef.current.nextBeat);
        
        if (timeDiff < taskDataRef.current.beatInterval / 4) { // Tolerance based on a quarter of beat interval
          playSound('positive_tap');
          setTaskData(prev => ({ ...prev, correctTaps: prev.correctTaps + 1 }));
          createParticles(5, '#10B981');
        } else {
          playSound('negative_tap');
        }
        break;

      case 'shape_match':
        if (taskDataRef.current.aligned) {
          handleTaskSuccess(120);
        } else {
          handleTaskFailure();
        }
        break;

      case 'speed_tap':
        if (taskDataRef.current.showTarget && !taskDataRef.current.tapped) {
          setTaskData(prev => ({ ...prev, tapped: true }));
          handleTaskSuccess(160);
        } else if (!taskDataRef.current.showTarget) { // Tapped too early
          handleTaskFailure();
        }
        break;

      default:
        break;
    }
  }, [taskState, currentTask, playSound, vibrate, handleTaskSuccess, handleTaskFailure, createParticles, setButtonColor]);

  const handleCardTap = useCallback((cardIndex) => {
    if (taskState !== 'active' || !taskActiveRef.current || !currentTask || currentTask.type !== 'memory_cards') return;
    if (taskDataRef.current.showingAll) return;

    const cards = taskDataRef.current.cards;
    const clickedCard = cards[cardIndex];

    if (!clickedCard || clickedCard.matched || clickedCard.flipped) return; // Already matched or flipped

    playSound('tap');
    
    // Flip the card
    const newCards = cards.map((card, idx) => 
      idx === cardIndex ? { ...card, flipped: true } : card
    );
    
    const newFlippedCards = [...taskDataRef.current.flippedCards, cardIndex];
    
    if (newFlippedCards.length === 2) {
      const [firstIndex, secondIndex] = newFlippedCards;
      const firstCard = newCards[firstIndex];
      const secondCard = newCards[secondIndex];

      if (firstCard.symbol === secondCard.symbol) {
        // Match!
        newCards[firstIndex] = { ...firstCard, matched: true };
        newCards[secondIndex] = { ...secondCard, matched: true };
        playSound('success');
        
        const newMatches = taskDataRef.current.matches + 1;
        setTaskData(prev => ({ 
          ...prev, 
          cards: newCards, 
          flippedCards: [], 
          matches: newMatches 
        }));

        if (newMatches === taskDataRef.current.totalPairs) {
          handleTaskSuccess(150 + taskDataRef.current.totalPairs * 30);
        }
      } else {
        // No match, flip back after delay
        playSound('fail');
        setTaskData(prev => ({ ...prev, cards: newCards, flippedCards: newFlippedCards })); // Show both flipped briefly
        sequenceTimerRef.current = setTimeout(() => {
          if (taskActiveRef.current) {
            setTaskData(prev => ({ 
              ...prev, 
              cards: prev.cards.map((card, idx) => 
                (idx === firstIndex || idx === secondIndex) ? { ...card, flipped: false } : card
              ), 
              flippedCards: [] 
            }));
          }
        }, 1000);
      }
    } else {
      setTaskData(prev => ({ ...prev, cards: newCards, flippedCards: newFlippedCards }));
    }
  }, [taskState, currentTask, playSound, handleTaskSuccess, handleTaskFailure]);

  const handleButtonPress = useCallback(() => {
    if (taskState !== 'active' || !taskActiveRef.current || !currentTask) return;

    if (['tap_fast', 'button_mash'].includes(currentTask.type)) {
      const newTapCount = tapCount + 1;
      setTapCount(newTapCount);
      setTaskData(prev => ({ ...prev, tapCount: newTapCount }));
      playSound('tap');
      vibrate();
      createParticles(3, '#60A5FA');
      return;
    }

    if (['hold_release'].includes(currentTask.type)) {
       if (!taskDataRef.current.holding) {
          setTaskData(prev => ({ ...prev, holding: true, startTime: Date.now() }));
       }
       return;
    }
    
    // For other tasks, a press is a tap.
    // If not a mash or hold, trigger generic tap for mouse events.
    // Touch events are handled via handleEnd from handleTap.
  }, [taskState, currentTask, playSound, vibrate, tapCount, createParticles]);

  const handleButtonRelease = useCallback(() => {
    if (!taskActiveRef.current || currentTask?.type !== 'hold_release') return;
    
    if (taskDataRef.current.holding) {
      setTaskData(prev => ({ ...prev, holding: false }));
      const elapsed = holdDuration;
      const target = taskDataRef.current.targetTime;
      
      const diff = Math.abs(elapsed - target);
      if (diff < 0.4) { // Increased tolerance slightly
        handleTaskSuccess(150 - Math.round(diff * 100));
      } else {
        handleTaskFailure();
      }
    }
  }, [currentTask?.type, holdDuration, handleTaskSuccess, handleTaskFailure]);

  const handleStart = useCallback((e) => {
    if (!gameActive || taskState !== 'active' || !taskActiveRef.current || isPaused || resumeCountdown > 0) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    setUserPointerPosition({ x: clientX, y: clientY });

    if (buttonRef.current && (currentTask?.type === 'drag_ball' || currentTask?.type === 'balance_challenge')) {
      const rect = buttonRef.current.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonCenterY = rect.top + rect.height / 2;

      setBallPosition({
        x: clientX - buttonCenterX,
        y: clientY - buttonCenterY
      });
    }

    if (!['drag_ball', 'swipe_direction', 'balance_challenge'].includes(currentTask?.type)) {
      // For tasks that react to a "press" (like hold_release, mash games)
      // or a simple click if it's a mouse event.
      // For touch, the 'tap' will usually be processed on `handleEnd`.
      if (e.type === 'mousedown') {
        handleButtonPress();
      }
    }
  }, [gameActive, taskState, isPaused, resumeCountdown, currentTask, handleButtonPress, setBallPosition, setUserPointerPosition]);

  const handleMove = useCallback((e) => {
    if (!isDragging || !gameActive || taskState !== 'active' || !taskActiveRef.current || isPaused || resumeCountdown > 0) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Update raw pointer position
    setUserPointerPosition({ x: clientX, y: clientY });

    // Update game-specific draggable element position
    if (buttonRef.current && (currentTask?.type === 'drag_ball' || currentTask?.type === 'balance_challenge')) {
      const rect = buttonRef.current.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonCenterY = rect.top + rect.height / 2;

      setBallPosition({
        x: clientX - buttonCenterX,
        y: clientY - buttonCenterY
      });
    }
  }, [isDragging, gameActive, taskState, isPaused, resumeCountdown, currentTask, setBallPosition, setUserPointerPosition]);

  const handleEnd = useCallback((e) => {
    if (!isDragging && currentTask?.type !== 'hold_release') { // If not dragging a ball, and not a hold/release, it's a simple tap
      if (gameActive && taskState === 'active' && !isPaused && resumeCountdown === 0) {
        const rect = buttonRef.current?.getBoundingClientRect();
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const mockEvent = { clientX, clientY, touches: e.changedTouches };
        handleTap(mockEvent);
      }
    }

    setIsDragging(false);
    
    // Only reset userPointerPosition if not in a dragging game
    if (!['drag_ball', 'balance_challenge'].includes(currentTask?.type)) {
      setUserPointerPosition({ x: 0, y: 0 });
    }

    if (!gameActive || taskState !== 'active' || !taskActiveRef.current || isPaused || resumeCountdown > 0) {
      if (currentTask?.type === 'hold_release' && taskDataRef.current.holding) {
          handleButtonRelease();
      }
      return;
    }

    if (currentTask?.type === 'hold_release' && taskDataRef.current.holding) {
      handleButtonRelease();
    } else if (currentTask?.type === 'drag_ball') {
      const distanceToCenter = Math.sqrt(ballPositionRef.current.x**2 + ballPositionRef.current.y**2);
      if (distanceToCenter < 25) { 
        handleTaskSuccess(150);
      } else {
        handleTaskFailure();
      }
    } else if (currentTask?.type === 'swipe_direction') {
      const finalX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const finalY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

      const deltaX = finalX - userPointerPosition.x;
      const deltaY = finalY - userPointerPosition.y;

      const minSwipeDistance = 50;
      let swipedDirection = null;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        swipedDirection = deltaX > 0 ? 'RIGHT' : 'LEFT';
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
        swipedDirection = deltaY > 0 ? 'DOWN' : 'UP';
      }

      if (swipedDirection === taskDataRef.current.targetDirection) {
        handleTaskSuccess(130);
      } else {
        handleTaskFailure();
      }
    }
    
  }, [isDragging, gameActive, taskState, isPaused, resumeCountdown, currentTask, taskDataRef, handleButtonRelease, handleTaskSuccess, handleTaskFailure, handleTap, ballPositionRef, userPointerPosition]);

  const getButtonText = () => {
    if (resumeCountdown > 0) return `${resumeCountdown}`;
    if (taskState === 'waiting') return "GET READY...";
    if (taskState === 'success') return "SUCCESS! 🎉";
    if (taskState === 'failure') return "FAILED ❌";
    if (!currentTask) return '...';

    switch(currentTask.type) {
      case 'count_down': 
        return taskData.count > 0 ? taskData.count.toString() : 'TAP NOW!';
      case 'simon_says': 
        return `SIMON SAYS ${taskData.action}`;
      case 'tap_fast':
      case 'button_mash':
        return `TAPS: ${tapCount}`;
      case 'hold_release':
        if (taskData.holding) return `HOLDING... ${holdDuration.toFixed(1)}s`;
        return `HOLD FOR ${taskData.targetTime}s`;
      case 'avoid_red':
        return taskData.isRed ? 'DON\'T TAP!' : 'SAFE TO TAP!';
      case 'swipe_direction':
        return `SWIPE ${taskData.targetDirection}`;
      case 'color_flash':
        if (taskData.showingFlash) return 'WATCH!';
        if (taskData.answered) return 'ANSWERED!';
        return 'WHAT COLOR?';
      case 'reaction_test':
        return taskData.showGreen ? 'TAP NOW!' : 'WAIT FOR GREEN...';
      case 'tap_the_dots':
        return `DOTS LEFT: ${taskData.dots?.length || 0}`;
      case 'stop_the_spinner':
        return taskData.stopped ? 'STOPPED!' : 'STOP IN GREEN!';
      case 'drag_ball':
        return 'DRAG TO CENTER!';
      case 'sequence_memory':
        return taskData.showingSequence ? `WATCH!` : 'COPY IT!';
      case 'color_sequence':
        return taskData.showingSequence ? `WATCH COLORS!` : 'COPY SEQUENCE!';
      case 'follow_leader':
        return taskData.showingSequence ? `WATCH!` : 'COPY IT!';
      case 'memory_cards':
        return taskData.showingAll ? 'MEMORIZE!' : 'MATCH PAIRS!';
      case 'rhythm_tap':
        return `RHYTHM: ${taskData.correctTaps}/${taskData.totalBeats}`;
      case 'shape_match':
        return `TARGET: ${taskData.targetShape} | NOW: ${taskData.currentShape}`;
      case 'speed_tap':
        return taskData.showTarget ? 'TAP NOW!' : 'WAIT...';
      case 'balance_challenge':
        return `ORBS: ${taskData.collected}/${taskData.totalOrbs}`;
      default: 
        return currentTask.instruction;
    }
  };

  useEffect(() => {
    if (gameActive && taskState === 'waiting' && !isPaused && resumeCountdown === 0) {
      const timer = setTimeout(() => {
        startGame();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameActive, taskState, isPaused, resumeCountdown, startGame]);

  const buttonSize = "w-72 h-72 sm:w-80 sm:h-80";
  const radius = 150;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft > 0 && taskDuration > 0 ? (timeLeft / taskDuration) * circumference : 0;
  
  const glowOpacity = taskState === 'active' && timeLeft > 0 && !isPaused && resumeCountdown === 0 ? (1 - timeLeft/taskDuration) * 0.5 : 0;
  const glowColor = timeLeft < 1000 ? '239, 68, 68' : '34, 197, 94';

  return (
    <div className={`relative ${buttonSize} select-none ${screenShake ? 'animate-bounce' : ''}`}>
      {/* Screen Flash Effect */}
      <AnimatePresence>
        {screenFlash && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="fixed inset-0 z-[100] pointer-events-none"
                style={{ backgroundColor: screenFlash }}
            />
        )}
      </AnimatePresence>

      {/* Resume Countdown */}
      <AnimatePresence>
        {resumeCountdown > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 rounded-full"
          >
            <div className="text-8xl font-bold text-white">{resumeCountdown}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Circular Timer with Red Progress */}
      <AnimatePresence>
        {taskState === 'active' && timeLeft > 0 && resumeCountdown === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <svg className="w-full h-full" viewBox="0 0 320 320" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx="160"
                cy="160"
                r={radius}
                stroke="rgba(var(--panel-bg), 0.3)"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Progress circle - red when time is running out */}
              <motion.circle
                cx="160"
                cy="160"
                r={radius}
                stroke={timeLeft < 1000 ? "rgb(239, 68, 68)" : "rgb(var(--text-accent))"}
                strokeWidth="8"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - progress }}
                transition={{ duration: 0.05, ease: 'linear' }}
                style={{
                  filter: timeLeft < 1000 ? `drop-shadow(0 0 10px rgb(239, 68, 68))` : 'none'
                }}
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Particles */}
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 1, x: particle.x, y: particle.y, scale: 1 }}
            animate={{ 
              opacity: 0, 
              x: particle.x + particle.vx * 0.01, 
              y: particle.y + particle.vy * 0.01,
              scale: 0
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full pointer-events-none"
            style={{ 
              backgroundColor: particle.color,
              boxShadow: `0 0 10px ${particle.color}`
            }}
          />
        ))}
      </AnimatePresence>
      
      {/* Point Animations */}
      <AnimatePresence>
        {pointAnimations.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: p.y, x: p.x, scale: 1 }}
            animate={{ opacity: 0, y: p.y - 100, scale: 1.5 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 text-4xl font-bold text-yellow-300 pointer-events-none"
            style={{ 
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              filter: 'drop-shadow(0 0 10px rgba(255,255,0,0.5))'
            }}
          >
            {p.points}
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div
        ref={buttonRef}
        className={`relative flex items-center justify-center rounded-full transition-all duration-300 ease-in-out text-white text-2xl sm:text-3xl font-bold text-center px-4 ${buttonSize} ${gameActive && !isPaused && resumeCountdown === 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
        style={{ 
          backgroundColor: buttonColor,
          overflow: 'hidden',
          backgroundImage: currentPlayer?.button_background ? `url(${currentPlayer.button_background})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: `0 0 35px rgba(${glowColor}, ${glowOpacity})`,
          filter: settings?.graphics === 'high' ? `brightness(${taskState === 'active' ? 1.1 : 1})` : 'none'
        }}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd} // Important for drag-like interactions
        onMouseMove={handleMove}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onTouchMove={handleMove}
        whileHover={gameActive && !isPaused && resumeCountdown === 0 ? { scale: 1.05 } : {}}
        whileTap={gameActive && !isPaused && resumeCountdown === 0 ? { scale: 0.95 } : {}}
      >
        <AnimatePresence>
          {(taskState === 'success' || taskState === 'failure') && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: taskState === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)' }}
            />
          )}
        </AnimatePresence>

        {/* Enhanced Spinner for 'stop_the_spinner' */}
        {currentTask?.type === 'stop_the_spinner' && taskState === 'active' && (
          <>
            <div className="absolute inset-0 rounded-full overflow-hidden">
              {/* This represents a 60-degree green zone centered at 0 degrees (top) */}
              <div 
                className="absolute w-full h-full bg-transparent"
                style={{
                  background: 'conic-gradient(rgba(34, 197, 94, 0.4) 330deg, transparent 30deg)',
                }}
              />
            </div>
            {/* Spinner pointer */}
            <motion.div
              className="absolute w-2 h-20 bg-white rounded-full origin-bottom"
              style={{ 
                rotate: taskData.rotation, 
                top: 'calc(50% - 100px)', // Position from center for a longer pointer
                left: 'calc(50% - 4px)',
                height: '100px', // Length of the pointer
                filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.7))'
              }}
            />
            <div className="w-4 h-4 bg-white rounded-full absolute z-10"></div> {/* Center dot */}
          </>
        )}

        {/* Ball for 'drag_ball' */}
        {currentTask?.type === 'drag_ball' && taskState === 'active' && (
          <motion.div
            className="absolute w-12 h-12 bg-gray-300 rounded-full border-2 border-white shadow-lg"
            style={{ 
              x: ballPosition.x, 
              y: ballPosition.y 
            }}
            animate={{
              boxShadow: Math.sqrt(ballPosition.x**2 + ballPosition.y**2) < 25 ? 
                '0 0 20px rgba(16, 185, 129, 0.8)' : 
                '0 0 10px rgba(255, 255, 255, 0.5)'
            }}
          />
        )}

        {/* Dots for 'tap_the_dots' */}
        {currentTask?.type === 'tap_the_dots' && taskState === 'active' && (
          <AnimatePresence>
            {taskData.dots?.map(dot => (
              <motion.div
                key={dot.id}
                className="absolute rounded-full bg-blue-500 border-2 border-white shadow-lg"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.6)'
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                style={{
                  width: dot.size * 2,
                  height: dot.size * 2,
                  x: dot.x - dot.size,
                  y: dot.y - dot.size,
                }}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Enhanced Sequence Memory Visualization (uses quadrants) */}
        {currentTask?.type === 'sequence_memory' && taskState === 'active' && (
          <div className="absolute inset-4 grid grid-cols-2 gap-2">
            {taskData.sequenceColors?.map((color, index) => (
              <motion.div
                key={index}
                className="rounded-lg border-2 border-white/30 flex items-center justify-center text-xl font-bold"
                style={{ 
                  backgroundColor: taskData.showingSequence && index === taskData.sequence?.[taskData.currentStep] ? color : 
                    taskData.userSequence?.includes(index) ? `${color}80` : 'rgba(255,255,255,0.1)'
                }}
                animate={{
                  scale: taskData.showingSequence && index === taskData.sequence?.[taskData.currentStep] ? 1.1 : 1,
                  opacity: taskData.showingSequence ? (index === taskData.sequence?.[taskData.currentStep] ? 1 : 0.3) : 1
                }}
              >
                {!taskData.showingSequence && (index + 1)}
              </motion.div>
            ))}
          </div>
        )}

        {/* Color Sequence Visualization (uses quadrants) */}
        {currentTask?.type === 'color_sequence' && taskState === 'active' && (
          <div className="absolute inset-4 grid grid-cols-2 gap-2">
            {taskData.colors?.map((color, index) => (
              <motion.div
                key={index}
                className="rounded-lg border-2 border-white/30 flex items-center justify-center text-xl font-bold"
                style={{ 
                  backgroundColor: taskData.showingSequence && index === taskData.sequence?.[taskData.currentStep] ? color : 
                    (taskData.userSequence && taskData.userSequence[taskData.userSequence.length-1] === index && !taskData.showingSequence) ? color : 'rgba(255,255,255,0.1)'
                }}
                animate={{
                  scale: taskData.showingSequence && index === taskData.sequence?.[taskData.currentStep] ? 1.1 : 1,
                  opacity: taskData.showingSequence ? (index === taskData.sequence?.[taskData.currentStep] ? 1 : 0.3) : 1
                }}
              >
                {!taskData.showingSequence && (index + 1)}
              </motion.div>
            ))}
          </div>
        )}

        {/* Follow Leader Visualization */}
        {currentTask?.type === 'follow_leader' && taskState === 'active' && (
          <>
            {taskData.sequence?.map((step, index) => (
              <motion.div
                key={index}
                className="absolute w-8 h-8 bg-yellow-400 rounded-full border-2 border-white"
                style={{ x: step.x, y: step.y }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: index <= taskData.currentStep ? 1 : 0,
                  opacity: index <= taskData.currentStep ? 1 : 0,
                  boxShadow: index === taskData.currentStep ? '0 0 15px rgba(251, 191, 36, 0.8)' : 'none'
                }}
                transition={{ delay: index * 0.7 }}
              />
            ))}
          </>
        )}

        {/* Memory Cards Visualization */}
        {currentTask?.type === 'memory_cards' && taskState === 'active' && (
          <div className="absolute inset-4 grid grid-cols-2 gap-2">
            {taskData.cards?.map((card, index) => (
              <motion.div
                key={card.id}
                className="bg-white/20 rounded-lg border border-white/30 flex items-center justify-center text-2xl font-bold"
                style={{ 
                  backgroundColor: card.matched ? 'rgba(16, 185, 129, 0.8)' : (card.flipped ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'),
                  color: card.matched ? 'white' : 'inherit'
                }}
                animate={{ 
                  scale: card.flipped || taskData.showingAll ? 1 : 0.9
                }}
                onClick={() => handleCardTap(card.index)} // Custom handler for card taps
              >
                {(card.flipped || card.matched || taskData.showingAll) ? card.symbol : '?'}
              </motion.div>
            ))}
          </div>
        )}

        {/* Balance Challenge Orbs */}
        {currentTask?.type === 'balance_challenge' && taskState === 'active' && (
          <>
            {taskData.orbs?.map(orb => (
              <motion.div
                key={orb.id}
                className="absolute w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full border border-white"
                style={{
                  x: orb.x,
                  y: orb.y,
                  opacity: orb.collected ? 0 : 1,
                  filter: 'drop-shadow(0 0 5px rgba(236, 72, 153, 0.6))'
                }}
                animate={{
                  scale: orb.collected ? 0 : 1,
                  rotate: orb.collected ? 180 : 0
                }}
              />
            ))}
            {/* Center target for collection */}
            <motion.div 
              className="absolute w-16 h-16 border-4 border-dashed border-green-400 rounded-full opacity-60 flex items-center justify-center" 
              style={{ x: -32, y: -32 }} 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1.1 }}
              transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
            />
          </>
        )}

        <motion.div 
          key={getButtonText()} 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="relative z-10 text-center leading-tight"
          style={{ 
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            color: currentPlayer?.button_background ? 'white' : 'inherit'
          }}
        >
          {getButtonText()}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {hint && taskState === 'active' && settings?.showHints && resumeCountdown === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 glass-panel text-[rgb(var(--text-primary))] text-sm px-4 py-2 rounded-full whitespace-nowrap shadow-lg border border-[rgba(var(--border-color),var(--border-opacity))]"
          >
            💡 {hint}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
