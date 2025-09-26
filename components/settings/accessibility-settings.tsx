'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Eye, Type, Volume2, Palette, Save } from 'lucide-react';
import { getUserProfile, updateUserProfile } from '@/lib/api/user-profile';

interface AccessibilitySettings {
  highContrast: boolean;
  largeFont: boolean;
  textToSpeech: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorScheme: 'default' | 'high-contrast' | 'dark' | 'light';
  reduceMotion: boolean;
  screenReaderOptimized: boolean;
}

export function AccessibilitySettings() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeFont: false,
    textToSpeech: false,
    fontSize: 'medium',
    colorScheme: 'default',
    reduceMotion: false,
    screenReaderOptimized: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Apply settings to the document
    applySettings();
  }, [settings]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // For now, use a mock user ID - in real implementation, get from auth context
      const userId = 'mock-user-id';
      const profile = await getUserProfile(userId);
      
      if (profile.accessibilitySettings) {
        setSettings(prev => ({
          ...prev,
          ...profile.accessibilitySettings
        }));
      }
    } catch (error) {
      console.error('Load accessibility settings error:', error);
      // Load from localStorage as fallback
      const savedSettings = localStorage.getItem('accessibility-settings');
      if (savedSettings) {
        try {
          setSettings(prev => ({
            ...prev,
            ...JSON.parse(savedSettings)
          }));
        } catch (e) {
          console.error('Error parsing saved settings:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      // For now, use a mock user ID - in real implementation, get from auth context
      const userId = 'mock-user-id';
      
      await updateUserProfile(userId, {
        accessibilitySettings: settings
      });
      
      toast({
        title: 'Success',
        description: 'Accessibility settings saved successfully'
      });
      
      // Always save to localStorage as backup
      localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Save accessibility settings error:', error);
      // Save to localStorage as fallback
      localStorage.setItem('accessibility-settings', JSON.stringify(settings));
      toast({
        title: 'Settings saved locally',
        description: 'Settings saved to your device. They will sync when connection is restored.',
      });
    } finally {
      setSaving(false);
    }
  };

  const applySettings = () => {
    const root = document.documentElement;
    
    // Apply font size
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '20px'
    };
    root.style.fontSize = fontSizeMap[settings.fontSize];
    
    // Apply color scheme
    if (settings.highContrast || settings.colorScheme === 'high-contrast') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (settings.colorScheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply motion preferences
    if (settings.reduceMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }
    
    // Apply large font class
    if (settings.largeFont) {
      root.classList.add('large-font');
    } else {
      root.classList.remove('large-font');
    }
    
    // Screen reader optimizations
    if (settings.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }
  };

  const updateSetting = (key: keyof AccessibilitySettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const testTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        'This is a test of the text-to-speech feature. If you can hear this, the feature is working correctly.'
      );
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: 'Not supported',
        description: 'Text-to-speech is not supported in your browser',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Accessibility Settings
        </CardTitle>
        <CardDescription>
          Customize the interface to meet your accessibility needs. These settings will be applied immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Visual Settings
          </h3>
          
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">High Contrast Mode</Label>
                <p className="text-sm text-gray-600">
                  Use high contrast colors for better visibility
                </p>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Color Scheme</Label>
              <Select 
                value={settings.colorScheme} 
                onValueChange={(value) => updateSetting('colorScheme', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="high-contrast">High Contrast</SelectItem>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                  <SelectItem value="light">Light Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Reduce Motion</Label>
                <p className="text-sm text-gray-600">
                  Minimize animations and transitions
                </p>
              </div>
              <Switch
                checked={settings.reduceMotion}
                onCheckedChange={(checked) => updateSetting('reduceMotion', checked)}
              />
            </div>
          </div>
        </div>

        {/* Text Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Type className="h-5 w-5" />
            Text Settings
          </h3>
          
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Large Font</Label>
                <p className="text-sm text-gray-600">
                  Use larger text for better readability
                </p>
              </div>
              <Switch
                checked={settings.largeFont}
                onCheckedChange={(checked) => updateSetting('largeFont', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Font Size</Label>
              <Select 
                value={settings.fontSize} 
                onValueChange={(value) => updateSetting('fontSize', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra-large">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Audio Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Settings
          </h3>
          
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Text-to-Speech</Label>
                <p className="text-sm text-gray-600">
                  Enable text-to-speech for alerts and content
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testTextToSpeech}
                  disabled={!('speechSynthesis' in window)}
                >
                  Test
                </Button>
                <Switch
                  checked={settings.textToSpeech}
                  onCheckedChange={(checked) => updateSetting('textToSpeech', checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Screen Reader Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Screen Reader Settings</h3>
          
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Screen Reader Optimized</Label>
                <p className="text-sm text-gray-600">
                  Optimize interface for screen readers with enhanced ARIA labels
                </p>
              </div>
              <Switch
                checked={settings.screenReaderOptimized}
                onCheckedChange={(checked) => updateSetting('screenReaderOptimized', checked)}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={saveSettings} disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Accessibility Tips */}
        <div className="bg-blue-50 rounded-lg p-4 mt-6">
          <h4 className="font-medium text-blue-900 mb-2">Accessibility Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use keyboard navigation: Tab to move forward, Shift+Tab to move backward</li>
            <li>• Press Enter or Space to activate buttons and links</li>
            <li>• Use arrow keys to navigate within menus and lists</li>
            <li>• Enable your browser's zoom feature for additional text scaling</li>
            <li>• Consider using a screen reader like NVDA, JAWS, or VoiceOver for full accessibility</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}