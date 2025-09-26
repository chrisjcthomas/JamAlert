'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';
import { getUserProfile, updateUserProfile, UserProfile } from '@/lib/api/user-profile';



const parishes = [
  'kingston', 'st_andrew', 'st_thomas', 'portland', 'st_mary', 'st_ann',
  'trelawny', 'st_james', 'hanover', 'westmoreland', 'st_elizabeth',
  'manchester', 'clarendon', 'st_catherine'
];

export function UserProfileForm() {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    parish: '',
    address: '',
    emailAlerts: true,
    smsAlerts: false,
    emergencyOnly: false,
    accessibilitySettings: {
      highContrast: false,
      largeFont: false,
      textToSpeech: false,
      fontSize: 'medium',
      colorScheme: 'default',
      reduceMotion: false,
      screenReaderOptimized: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      // For now, use a mock user ID - in real implementation, get from auth context
      const userId = 'mock-user-id';
      const profileData = await getUserProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error('Load profile error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // For now, use a mock user ID - in real implementation, get from auth context
      const userId = 'mock-user-id';
      await updateUserProfile(userId, profile);
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Save profile error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateAccessibilitySettings = (field: string, value: boolean) => {
    setProfile(prev => ({
      ...prev,
      accessibilitySettings: {
        highContrast: false,
        largeFont: false,
        textToSpeech: false,
        fontSize: 'medium' as const,
        colorScheme: 'default' as const,
        reduceMotion: false,
        screenReaderOptimized: false,
        ...prev.accessibilitySettings,
        [field]: value
      }
    }));
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal details and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => updateProfile('firstName', e.target.value)}
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => updateProfile('lastName', e.target.value)}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => updateProfile('email', e.target.value)}
              placeholder="Enter your email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => updateProfile('phone', e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parish" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Parish
            </Label>
            <Select value={profile.parish} onValueChange={(value) => updateProfile('parish', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your parish" />
              </SelectTrigger>
              <SelectContent>
                {parishes.map((parish) => (
                  <SelectItem key={parish} value={parish}>
                    {parish.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address (Optional)</Label>
            <Textarea
              id="address"
              value={profile.address || ''}
              onChange={(e) => updateProfile('address', e.target.value)}
              placeholder="Enter your address"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to receive alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Alerts</Label>
              <p className="text-sm text-gray-600">
                Receive alerts via email
              </p>
            </div>
            <Switch
              checked={profile.emailAlerts}
              onCheckedChange={(checked) => updateProfile('emailAlerts', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">SMS Alerts</Label>
              <p className="text-sm text-gray-600">
                Receive alerts via text message
              </p>
            </div>
            <Switch
              checked={profile.smsAlerts}
              onCheckedChange={(checked) => updateProfile('smsAlerts', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Emergency Only</Label>
              <p className="text-sm text-gray-600">
                Only receive high-priority emergency alerts
              </p>
            </div>
            <Switch
              checked={profile.emergencyOnly}
              onCheckedChange={(checked) => updateProfile('emergencyOnly', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accessibility Settings</CardTitle>
          <CardDescription>
            Customize the interface to meet your accessibility needs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">High Contrast Mode</Label>
              <p className="text-sm text-gray-600">
                Use high contrast colors for better visibility
              </p>
            </div>
            <Switch
              checked={profile.accessibilitySettings?.highContrast || false}
              onCheckedChange={(checked) => updateAccessibilitySettings('highContrast', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Large Font</Label>
              <p className="text-sm text-gray-600">
                Use larger text for better readability
              </p>
            </div>
            <Switch
              checked={profile.accessibilitySettings?.largeFont || false}
              onCheckedChange={(checked) => updateAccessibilitySettings('largeFont', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Text-to-Speech</Label>
              <p className="text-sm text-gray-600">
                Enable text-to-speech for alerts
              </p>
            </div>
            <Switch
              checked={profile.accessibilitySettings?.textToSpeech || false}
              onCheckedChange={(checked) => updateAccessibilitySettings('textToSpeech', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}