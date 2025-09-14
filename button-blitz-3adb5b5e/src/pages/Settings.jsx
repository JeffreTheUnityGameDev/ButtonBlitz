import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Volume2, VolumeX, Smartphone, Zap, Heart, Flame, Sun, Moon, ArrowLeft, LogOut, Music, Sparkles, SlidersHorizontal, User as UserIcon, Upload, Eye } from 'lucide-react';
import { User } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { SettingsContext } from '../components/SettingsProvider';
import { Slider } from "@/components/ui/slider";

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

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingButton, setUploadingButton] = useState(false);
  const { settings, updateSettings, playSound } = useContext(SettingsContext);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        setDisplayName(currentUser.display_name || currentUser.full_name || '');
      } catch (error) {
        setUser(null);
      }
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    try {
      playSound('button_click');
      await User.logout();
      window.location.href = createPageUrl('Home');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    try {
      playSound('ui_click');
      await User.updateMyUserData({ display_name: displayName.trim() });
      playSound('success');
      setUser(prev => ({ ...prev, display_name: displayName.trim() }));
    } catch (error) {
      console.error('Failed to update name:', error);
      playSound('fail');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingProfile(true);
    try {
      playSound('ui_click');
      const { file_url } = await UploadFile({ file });
      await User.updateMyUserData({ profile_image: file_url });
      setUser(prev => ({ ...prev, profile_image: file_url }));
      playSound('success');
    } catch (error) {
      console.error('Failed to upload profile image:', error);
      playSound('fail');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleButtonImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingButton(true);
    try {
      playSound('ui_click');
      const { file_url } = await UploadFile({ file });
      await User.updateMyUserData({ button_background: file_url });
      setUser(prev => ({ ...prev, button_background: file_url }));
      playSound('success');
    } catch (error) {
      console.error('Failed to upload button image:', error);
      playSound('fail');
    } finally {
      setUploadingButton(false);
    }
  };

  const handleSettingChange = (key, value) => {
    playSound('ui_click');
    updateSettings(key, value);
  };

  if (!settings) return null;

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-[rgb(var(--background-start))] to-[rgb(var(--background-end))] text-[rgb(var(--text-primary))] p-4">
      <div className="max-w-2xl mx-auto pb-12">
        <div className="absolute top-4 left-4">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]" onClick={() => playSound('button_click')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Menu
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 glass-panel rounded-2xl shadow-2xl p-6 sm:p-8"
        >
          <div className="flex items-center justify-center mb-8">
            <Settings className="w-6 h-6 text-[rgb(var(--text-accent))] mr-3" />
            <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))]">Settings</h1>
          </div>

          <div className="space-y-8">
            {/* Profile Section */}
            {user && (
              <div>
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4 flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-[rgb(var(--text-accent))]" />
                  Profile
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-[rgba(var(--background-secondary),0.3)] rounded-xl">
                    <Label className="text-sm font-medium text-[rgb(var(--text-secondary))]">Display Name</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your display name"
                        className="bg-transparent border-[rgba(var(--border-color),var(--border-opacity))] text-[rgb(var(--text-primary))]"
                        maxLength={20}
                      />
                      <Button
                        onClick={handleSaveName}
                        disabled={saving || !displayName.trim() || displayName === (user.display_name || user.full_name)}
                        className="bg-[rgb(var(--text-accent))] hover:opacity-90 text-white"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                    <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                      This name will be shown to other players in online games
                    </p>
                  </div>

                  <div className="p-4 bg-[rgba(var(--background-secondary),0.3)] rounded-xl">
                    <Label className="text-sm font-medium text-[rgb(var(--text-secondary))]">Profile Picture</Label>
                    <div className="flex items-center gap-4 mt-2">
                      {user.profile_image && (
                        <img
                          src={user.profile_image}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover border-2 border-[rgba(var(--border-color),var(--border-opacity))]"
                        />
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageUpload}
                          className="hidden"
                          id="profile-upload"
                        />
                        <label htmlFor="profile-upload">
                          <Button
                            as="span"
                            disabled={uploadingProfile}
                            className="cursor-pointer bg-[rgb(var(--text-accent))] hover:opacity-90 text-white"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadingProfile ? 'Uploading...' : 'Upload Picture'}
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[rgba(var(--background-secondary),0.3)] rounded-xl">
                    <Label className="text-sm font-medium text-[rgb(var(--text-secondary))]">Custom Button Background</Label>
                    <div className="flex items-center gap-4 mt-2">
                      {user.button_background && (
                        <div className="w-16 h-16 rounded-full border-2 border-[rgba(var(--border-color),var(--border-opacity))] overflow-hidden">
                          <img
                            src={user.button_background}
                            alt="Button Background"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleButtonImageUpload}
                          className="hidden"
                          id="button-upload"
                        />
                        <label htmlFor="button-upload">
                          <Button
                            as="span"
                            disabled={uploadingButton}
                            className="cursor-pointer bg-[rgb(var(--text-accent))] hover:opacity-90 text-white"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadingButton ? 'Uploading...' : 'Upload Background'}
                          </Button>
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                      This image will appear on your game button during play
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Theme Toggle */}
            <div>
              <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4 flex items-center">
                {settings.theme === 'light' ? (
                  <Sun className="w-5 h-5 mr-2 text-[rgb(var(--text-accent))]" />
                ) : settings.theme === 'high-contrast' ? (
                  <Eye className="w-5 h-5 mr-2 text-[rgb(var(--text-accent))]" />
                ) : (
                  <Moon className="w-5 h-5 mr-2 text-[rgb(var(--text-accent))]" />
                )} 
                Appearance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.button
                  onClick={() => handleSettingChange('theme', 'dark')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    settings.theme === 'dark'
                      ? 'border-[rgb(var(--text-accent))] bg-[rgba(var(--highlight-bg),var(--highlight-opacity))]'
                      : 'border-[rgba(var(--border-color),var(--border-opacity))] hover:border-[rgba(var(--text-accent),0.5)]'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-900 to-purple-950 flex items-center justify-center shadow-lg">
                      <Moon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-center font-semibold text-[rgb(var(--text-primary))]">Dark</div>
                </motion.button>

                <motion.button
                  onClick={() => handleSettingChange('theme', 'light')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    settings.theme === 'light'
                      ? 'border-[rgb(var(--text-accent))] bg-[rgba(var(--highlight-bg),var(--highlight-opacity))]'
                      : 'border-[rgba(var(--border-color),var(--border-opacity))] hover:border-[rgba(var(--text-accent),0.5)]'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center shadow-lg">
                      <Sun className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-center font-semibold text-[rgb(var(--text-primary))]">Light</div>
                </motion.button>

                <motion.button
                  onClick={() => handleSettingChange('theme', 'high-contrast')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    settings.theme === 'high-contrast'
                      ? 'border-[rgb(var(--text-accent))] bg-[rgba(var(--highlight-bg),var(--highlight-opacity))]'
                      : 'border-[rgba(var(--border-color),var(--border-opacity))] hover:border-[rgba(var(--text-accent),0.5)]'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-black to-white flex items-center justify-center shadow-lg">
                      <Eye className="w-6 h-6 text-yellow-500" />
                    </div>
                  </div>
                  <div className="text-center font-semibold text-[rgb(var(--text-primary))]">High Contrast</div>
                </motion.button>
              </div>
            </div>
            
            {/* Audio Settings */}
            <div>
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">Audio</h3>
                <div className="space-y-6 p-4 bg-[rgba(var(--background-secondary),0.3)] rounded-xl">
                    <div className="grid gap-2">
                        <Label className="flex items-center"><SlidersHorizontal className="w-4 h-4 mr-2"/>Master Volume</Label>
                        <Slider value={[settings.masterVolume]} max={1} step={0.01} onValueChange={(value) => handleSettingChange('masterVolume', value[0])} />
                        <div className="text-xs text-[rgb(var(--text-tertiary))]">{Math.round(settings.masterVolume * 100)}%</div>
                    </div>
                    <div className="grid gap-2">
                        <Label className="flex items-center"><Music className="w-4 h-4 mr-2"/>Music Volume</Label>
                        <Slider value={[settings.musicVolume]} max={1} step={0.01} onValueChange={(value) => handleSettingChange('musicVolume', value[0])} />
                        <div className="text-xs text-[rgb(var(--text-tertiary))]">{Math.round(settings.musicVolume * 100)}%</div>
                    </div>
                    <div className="grid gap-2">
                        <Label className="flex items-center"><Volume2 className="w-4 h-4 mr-2"/>Sound Effects Volume</Label>
                        <Slider value={[settings.sfxVolume]} max={1} step={0.01} onValueChange={(value) => handleSettingChange('sfxVolume', value[0])} />
                        <div className="text-xs text-[rgb(var(--text-tertiary))]">{Math.round(settings.sfxVolume * 100)}%</div>
                    </div>
                </div>
            </div>

            {/* Default Game Settings */}
            <div>
              <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">Default Game Rules</h3>
               <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-[rgb(var(--text-primary))] mb-2">Game Mode</h4>
                  <div className="space-y-3">
                    {Object.entries(GAME_MODES).map(([key, mode]) => {
                      const Icon = mode.icon;
                      return (
                        <motion.button
                          key={key}
                          onClick={() => handleSettingChange('gameMode', key)}
                          className={`w-full p-4 rounded-xl border-2 transition-all ${
                            settings.gameMode === key
                              ? 'border-[rgb(var(--text-accent))] bg-[rgba(var(--highlight-bg),var(--highlight-opacity))]'
                              : 'border-[rgba(var(--border-color),var(--border-opacity))] hover:border-[rgba(var(--text-accent),0.5)]'
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-center">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${mode.color} flex items-center justify-center mr-4 shadow-lg`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-[rgb(var(--text-primary))]">{mode.name}</div>
                              <div className="text-sm text-[rgb(var(--text-secondary))]">{mode.description}</div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-[rgb(var(--text-primary))] mb-2">Game Length</h4>
                  <Select value={String(settings.totalRounds)} onValueChange={(value) => handleSettingChange('totalRounds', parseInt(value))}>
                    <SelectTrigger className="w-full bg-[rgba(var(--background-secondary),0.3)] border-[rgba(var(--border-color),var(--border-opacity))] text-[rgb(var(--text-primary))] hover:bg-[rgba(var(--background-secondary),0.5)]">
                      <SelectValue placeholder="Select game length" />
                    </SelectTrigger>
                    <SelectContent className="bg-[rgba(var(--background-secondary),0.95)] border-[rgba(var(--border-color),var(--border-opacity))] backdrop-blur-lg">
                      {ROUND_OPTIONS.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={String(option.value)}
                          className="text-[rgb(var(--text-primary))] data-[highlighted]:bg-[rgba(var(--highlight-bg),var(--highlight-opacity))]"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
               </div>
            </div>

            {/* Experience Settings */}
            <div>
              <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">Experience</h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-[rgba(var(--background-secondary),0.3)] rounded-xl hover:bg-[rgba(var(--background-secondary),0.5)] transition-colors">
                  <div className="flex items-center">
                    <Sparkles className="w-5 h-5 text-[rgb(var(--text-accent))] mr-3" />
                    <div>
                      <Label className="font-semibold text-[rgb(var(--text-primary))] cursor-pointer">Graphics Quality</Label>
                      <div className="text-sm text-[rgb(var(--text-secondary))]">Higher quality = more effects</div>
                    </div>
                  </div>
                   <Select value={settings.graphics} onValueChange={(value) => handleSettingChange('graphics', value)}>
                    <SelectTrigger className="w-32 bg-transparent border-none">
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent className="bg-[rgba(var(--background-secondary),0.95)] border-[rgba(var(--border-color),var(--border-opacity))] backdrop-blur-lg">
                        <SelectItem value="high" className="text-[rgb(var(--text-primary))] data-[highlighted]:bg-[rgba(var(--highlight-bg),var(--highlight-opacity))]">High</SelectItem>
                        <SelectItem value="medium" className="text-[rgb(var(--text-primary))] data-[highlighted]:bg-[rgba(var(--highlight-bg),var(--highlight-opacity))]">Medium</SelectItem>
                        <SelectItem value="low" className="text-[rgb(var(--text-primary))] data-[highlighted]:bg-[rgba(var(--highlight-bg),var(--highlight-opacity))]">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 bg-[rgba(var(--background-secondary),0.3)] rounded-xl hover:bg-[rgba(var(--background-secondary),0.5)] transition-colors">
                  <div className="flex items-center">
                    <Smartphone className="w-5 h-5 text-[rgb(var(--text-accent))] mr-3" />
                    <div>
                      <Label className="font-semibold text-[rgb(var(--text-primary))] cursor-pointer">Vibration</Label>
                      <div className="text-sm text-[rgb(var(--text-secondary))]">Haptic feedback on mobile</div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.vibrationEnabled}
                    onCheckedChange={(checked) => handleSettingChange('vibrationEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[rgba(var(--background-secondary),0.3)] rounded-xl hover:bg-[rgba(var(--background-secondary),0.5)] transition-colors">
                  <div className="flex items-center">
                    <span className="text-lg mr-3">💡</span>
                    <div>
                      <Label className="font-semibold text-[rgb(var(--text-primary))] cursor-pointer">Show Hints</Label>
                      <div className="text-sm text-[rgb(var(--text-secondary))]">Display helpful tips during games</div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.showHints}
                    onCheckedChange={(checked) => handleSettingChange('showHints', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Account Management */}
            {user && (
              <div className="pt-4 border-t border-[rgba(var(--border-color),var(--border-opacity))]">
                <div className="text-center mb-4">
                  <p className="text-[rgb(var(--text-secondary))]">Signed in as</p>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    {user.profile_image && (
                      <img
                        src={user.profile_image}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <p className="font-semibold text-[rgb(var(--text-primary))]">{user.display_name || user.full_name}</p>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
            
            {/* Legal */}
            <div className="pt-4 border-t border-[rgba(var(--border-color),var(--border-opacity))] text-center">
                <p className="text-sm text-[rgb(var(--text-secondary))]">
                    By playing, you agree to our
                </p>
                <div className="flex justify-center gap-4 mt-2">
                    <Link to={createPageUrl('TermsOfService')} className="text-sm text-[rgb(var(--text-accent))] hover:underline">Terms of Service</Link>
                    <Link to={createPageUrl('PrivacyPolicy')} className="text-sm text-[rgb(var(--text-accent))] hover:underline">Privacy Policy</Link>
                </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}