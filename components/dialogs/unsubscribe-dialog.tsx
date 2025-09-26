'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, UserMinus, Settings } from 'lucide-react';
import { processUnsubscribe, UnsubscribeRequest } from '@/lib/api/user-profile';

interface UnsubscribeData extends UnsubscribeRequest {
  confirmed: boolean;
}

const unsubscribeReasons = [
  { value: 'too_many', label: 'Too many alerts' },
  { value: 'not_relevant', label: 'Alerts not relevant to my area' },
  { value: 'not_accurate', label: 'Alerts not accurate' },
  { value: 'technical_issues', label: 'Technical issues with the service' },
  { value: 'moving_away', label: 'Moving away from Jamaica' },
  { value: 'privacy_concerns', label: 'Privacy concerns' },
  { value: 'other', label: 'Other (please specify)' }
];

export function UnsubscribeDialog() {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [data, setData] = useState<UnsubscribeData>({
    action: 'partial',
    reason: '',
    feedback: '',
    confirmed: false
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUnsubscribe = async () => {
    if (!data.reason) {
      toast({
        title: 'Error',
        description: 'Please select a reason for unsubscribing',
        variant: 'destructive'
      });
      return;
    }

    if (!data.confirmed) {
      toast({
        title: 'Error',
        description: 'Please confirm that you understand the consequences',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      // For now, use a mock user ID - in real implementation, get from auth context
      const userId = 'mock-user-id';
      
      await processUnsubscribe(userId, {
        action: data.action,
        reason: data.reason,
        feedback: data.feedback
      });
      
      toast({
        title: 'Success',
        description: data.action === 'partial' 
          ? 'You will now only receive emergency alerts via email'
          : 'You have been successfully unsubscribed from all alerts'
      });
      
      setOpen(false);
      setConfirmOpen(false);
      
      // Reset form
      setData({
        action: 'partial',
        reason: '',
        feedback: '',
        confirmed: false
      });
      
      // Redirect or refresh page after complete unsubscribe
      if (data.action === 'complete') {
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process unsubscribe request',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    setConfirmOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
            <UserMinus className="h-4 w-4 mr-2" />
            Manage Subscription
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage Your Subscription
            </DialogTitle>
            <DialogDescription>
              Choose how you want to modify your alert subscription.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Subscription Options */}
            <div className="space-y-4">
              <Label className="text-base font-medium">What would you like to do?</Label>
              <RadioGroup
                value={data.action}
                onValueChange={(value) => setData(prev => ({ ...prev, action: value as 'partial' | 'complete' }))}
              >
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="partial" id="partial" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="partial" className="font-medium">
                      Emergency Alerts Only
                    </Label>
                    <p className="text-sm text-gray-600">
                      Keep receiving high-priority emergency alerts via email only. 
                      Turn off routine weather updates and SMS notifications.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 border rounded-lg border-red-200">
                  <RadioGroupItem value="complete" id="complete" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="complete" className="font-medium text-red-700">
                      Complete Unsubscribe
                    </Label>
                    <p className="text-sm text-red-600">
                      Stop receiving all alerts including emergency notifications. 
                      Your account will be deactivated.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Reason Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Why are you {data.action === 'partial' ? 'reducing' : 'leaving'} JamAlert?
              </Label>
              <RadioGroup
                value={data.reason}
                onValueChange={(value) => setData(prev => ({ ...prev, reason: value }))}
              >
                {unsubscribeReasons.map((reason) => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label htmlFor={reason.value} className="text-sm">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Additional Feedback */}
            <div className="space-y-2">
              <Label htmlFor="feedback">
                Additional feedback (optional)
              </Label>
              <Textarea
                id="feedback"
                placeholder="Help us improve by sharing more details about your experience..."
                value={data.feedback}
                onChange={(e) => setData(prev => ({ ...prev, feedback: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Confirmation */}
            <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
              <Checkbox
                id="confirm"
                checked={data.confirmed}
                onCheckedChange={(checked) => setData(prev => ({ ...prev, confirmed: Boolean(checked) }))}
              />
              <div className="space-y-1">
                <Label htmlFor="confirm" className="text-sm font-medium">
                  I understand the consequences
                </Label>
                <p className="text-xs text-gray-600">
                  {data.action === 'partial' 
                    ? 'I understand that I will only receive emergency alerts via email and may miss important weather updates.'
                    : 'I understand that I will no longer receive any safety alerts, including emergency notifications that could be critical for my safety.'
                  }
                </p>
              </div>
            </div>

            {data.action === 'complete' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">
                      Important Safety Notice
                    </h4>
                    <p className="text-xs text-red-700 mt-1">
                      By completely unsubscribing, you will not receive emergency alerts that could be 
                      critical for your safety during floods, severe weather, or other emergencies. 
                      Consider the "Emergency Alerts Only" option instead.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              variant={data.action === 'complete' ? 'destructive' : 'default'}
              disabled={!data.reason || !data.confirmed}
            >
              {data.action === 'partial' ? 'Update Preferences' : 'Unsubscribe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Confirm Your Choice
            </AlertDialogTitle>
            <AlertDialogDescription>
              {data.action === 'partial' 
                ? 'You will only receive emergency alerts via email. All other notifications will be disabled.'
                : 'This will completely remove you from all JamAlert notifications, including emergency alerts. This action cannot be easily undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnsubscribe}
              disabled={loading}
              className={data.action === 'complete' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {loading ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}