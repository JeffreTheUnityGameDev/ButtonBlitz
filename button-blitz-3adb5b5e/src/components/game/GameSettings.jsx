
import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Zap, Heart, Flame, X, Sparkles, Smartphone } from 'lucide-react';
import { SettingsContext } from '../SettingsProvider';

const GAME_MODES = {
  chill: { name: 'Chill Mode', icon: Heart, color: 'from-green-400 to-emerald-500', description: 'Relaxed timing, friendly competition' },
  party: { name: 'Party Mode', icon: Zap, color: 'from-blue-400 to-purple-500', description: 'Perfect balance of fun and challenge' },
  extreme: { name: 'Extreme Mode', icon: Flame, color: 'from-red-400 to-orange-500', description: 'Fast-paced, high-pressure chaos!' }
};

const ROUND_OPTIONS = [
  { value: 5, label: '5 Rounds - Quick Game' },
  { value: 10, label: '10 Rounds - Standard' },
  { value: 15, label: '15 Rounds - Extended' },
  { value: 20, label: '20 Rounds - Marathon' },
  { value: -1, label: 'Endless - Until You Stop' }
];

export default function GameSettings({ settings, onSettingsChange, onClose, isHost }) {
  const { settings: globalSettings, updateSettings: updateGlobalSettings } = useContext(SettingsContext);

  const currentSettings = onSettingsChange ? settings : globalSettings;
  const readOnly = onSettingsChange && !isHost;

  const updateSetting = (key, value) => {
    // If this is the main settings page, update global settings
    // Otherwise, if it's in-game settings, update local game settings
    const newSettings = { ...currentSettings, [key]: value };
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    } else {
      updateGlobalSettings(key, value);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-panel rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-[rgb(var(--text-accent))] mr-2 sm:mr-3" />
          <h2 className="text-xl sm:text-2xl font-bold text-[rgb(var(--text-primary))]">Game Settings</h2>
        </div>
        {onClose && (
            <Button 
            variant="ghost" 
            onClick={onClose} 
            className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgba(var(--highlight-bg))] h-8 w-8 sm:h-10 sm:w-10 rounded-full"
            >
            <X className="w-5 h-5"/>
            </Button>
        )}
      </div>
      
      {readOnly && (
          <div className="bg-yellow-500/10 text-yellow-300 text-sm p-3 rounded-lg mb-4 text-center">
              Only the host can change game settings.
          </div>
      )}

      <div className="space-y-6 sm:space-y-8">
        
        {/* Game Mode Selection */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-[rgb(var(--text-primary))] mb-3 sm:mb-4">Game Mode</h3>
          <div className="space-y-3">
            {Object.entries(GAME_MODES).map(([key, mode]) => {
              const Icon = mode.icon;
              return (
                <motion.button
                  key={key}
                  onClick={() => !readOnly && updateSetting('gameMode', key)}
                  className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    currentSettings.gameMode === key
                      ? 'border-[rgb(var(--text-accent))] bg-[rgba(var(--highlight-bg))]'
                      : 'border-[rgba(var(--border-color))] hover:border-[rgba(var(--text-accent),0.5)]'
                  } ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                  whileHover={!readOnly ? { scale: 1.01 } : {}}
                  whileTap={!readOnly ? { scale: 0.99 } : {}}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r ${mode.color} flex items-center justify-center mr-3 sm:mr-4 shadow-lg`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm sm:text-base text-[rgb(var(--text-primary))]">{mode.name}</div>
                      <div className="text-xs sm:text-sm text-[rgb(var(--text-secondary))]">{mode.description}</div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Round Settings */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-[rgb(var(--text-primary))] mb-3 sm:mb-4">Game Length</h3>
          <Select disabled={readOnly} value={String(currentSettings.totalRounds)} onValueChange={(value) => updateSetting('totalRounds', parseInt(value))}>
            <SelectTrigger className="w-full bg-[rgba(var(--background-secondary),0.3)] border-[rgba(var(--border-color))] text-[rgb(var(--text-primary))] hover:bg-[rgba(var(--background-secondary),0.5)] disabled:opacity-70 disabled:cursor-not-allowed">
              <SelectValue placeholder="Select game length" />
            </SelectTrigger>
            <SelectContent className="bg-[rgba(var(--background-secondary),0.95)] border-[rgba(var(--border-color))] backdrop-blur-lg">
              {ROUND_OPTIONS.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={String(option.value)}
                  className="text-[rgb(var(--text-primary))] data-[highlighted]:bg-[rgba(var(--highlight-bg))]"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Experience Settings */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-[rgb(var(--text-primary))] mb-3 sm:mb-4">Experience</h3>
          
          <div className={`flex items-center justify-between p-3 sm:p-4 bg-[rgba(var(--background-secondary),0.3)] rounded-xl transition-colors ${readOnly ? 'opacity-70' : 'hover:bg-[rgba(var(--background-secondary),0.5)]'}`}>
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 text-[rgb(var(--text-accent))] mr-3" />
              <div>
                <Label className="font-semibold text-[rgb(var(--text-primary))] cursor-pointer">Graphics Quality</Label>
                <div className="text-xs sm:text-sm text-[rgb(var(--text-secondary))]">Reduce for better performance</div>
              </div>
            </div>
             <Select disabled={readOnly} value={currentSettings.graphics} onValueChange={(value) => updateSetting('graphics', value)}>
              <SelectTrigger className="w-32 bg-transparent border-none disabled:cursor-not-allowed">
                <SelectValue/>
              </SelectTrigger>
              <SelectContent className="bg-[rgba(var(--background-secondary),0.95)] border-[rgba(var(--border-color))] backdrop-blur-lg">
                  <SelectItem value="high" className="text-[rgb(var(--text-primary))] data-[highlighted]:bg-[rgba(var(--highlight-bg))]">High</SelectItem>
                  <SelectItem value="medium" className="text-[rgb(var(--text-primary))] data-[highlighted]:bg-[rgba(var(--highlight-bg))]">Medium</SelectItem>
                  <SelectItem value="low" className="text-[rgb(var(--text-primary))] data-[highlighted]:bg-[rgba(var(--highlight-bg))]">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={`flex items-center justify-between p-3 sm:p-4 bg-[rgba(var(--background-secondary),0.3)] rounded-xl transition-colors ${readOnly ? 'opacity-70' : 'hover:bg-[rgba(var(--background-secondary),0.5)]'}`}>
            <div className="flex items-center">
              <Smartphone className="w-5 h-5 text-[rgb(var(--text-accent))] mr-3" />
              <div>
                <Label className="font-semibold text-[rgb(var(--text-primary))] cursor-pointer">Vibration</Label>
                <div className="text-xs sm:text-sm text-[rgb(var(--text-secondary))]">Haptic feedback on mobile</div>
              </div>
            </div>
            <Switch
              disabled={readOnly}
              checked={currentSettings.vibrationEnabled}
              onCheckedChange={(checked) => updateSetting('vibrationEnabled', checked)}
            />
          </div>

          <div className={`flex items-center justify-between p-3 sm:p-4 bg-[rgba(var(--background-secondary),0.3)] rounded-xl transition-colors ${readOnly ? 'opacity-70' : 'hover:bg-[rgba(var(--background-secondary),0.5)]'}`}>
            <div className="flex items-center">
              <span className="text-lg mr-3">💡</span>
              <div>
                <Label className="font-semibold text-[rgb(var(--text-primary))] cursor-pointer">Show Hints</Label>
                <div className="text-xs sm:text-sm text-[rgb(var(--text-secondary))]">Display helpful tips during games</div>
              </div>
            </div>
            <Switch
              disabled={readOnly}
              checked={currentSettings.showHints}
              onCheckedChange={(checked) => updateSetting('showHints', checked)}
            />
          </div>
        </div>

      </div>

      {onClose && (
        <div className="mt-6 sm:mt-8">
            <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 font-semibold rounded-xl shadow-lg"
            >
            Done
            </Button>
        </div>
      )}
    </motion.div>
  );
}
