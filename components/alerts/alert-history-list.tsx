'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Calendar, Filter, MessageSquare, Star, ThumbsUp, ThumbsDown, Search } from 'lucide-react';
import { getUserAlertHistory, submitAlertFeedback, AlertHistoryItem, AlertFeedback } from '@/lib/api/user-profile';



export function AlertHistoryList() {
  const [alerts, setAlerts] = useState<AlertHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    severity: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [selectedAlert, setSelectedAlert] = useState<AlertHistoryItem | null>(null);
  const [feedback, setFeedback] = useState<AlertFeedback>({
    rating: 5,
    comment: '',
    wasAccurate: true,
    wasHelpful: true
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
  }, [pagination.page, filters]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      // For now, use a mock user ID - in real implementation, get from auth context
      const userId = 'mock-user-id';
      
      const result = await getUserAlertHistory(userId, {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.type && filters.type !== 'all' && { type: filters.type }),
        ...(filters.severity && filters.severity !== 'all' && { severity: filters.severity }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });
      
      setAlerts(result.alerts);
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      }));
    } catch (error) {
      console.error('Load alerts error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load alert history',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!selectedAlert) return;

    try {
      setSubmittingFeedback(true);
      // For now, use a mock user ID - in real implementation, get from auth context
      const userId = 'mock-user-id';
      
      await submitAlertFeedback(userId, selectedAlert.id, feedback);
      
      toast({
        title: 'Success',
        description: 'Thank you for your feedback!'
      });
      
      // Update the alert in the list with the new feedback
      setAlerts(prev => prev.map(alert => 
        alert.id === selectedAlert.id 
          ? { ...alert, feedback }
          : alert
      ));
      
      setSelectedAlert(null);
      resetFeedbackForm();
    } catch (error) {
      console.error('Submit feedback error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        variant: 'destructive'
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const resetFeedbackForm = () => {
    setFeedback({
      rating: 5,
      comment: '',
      wasAccurate: true,
      wasHelpful: true
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flood': return '🌊';
      case 'weather': return '⛈️';
      case 'emergency': return '🚨';
      case 'all_clear': return '✅';
      default: return '📢';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return alert.title.toLowerCase().includes(searchLower) ||
             alert.message.toLowerCase().includes(searchLower);
    }
    return true;
  });

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
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search alerts..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Alert Type</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="flood">Flood</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="all_clear">All Clear</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({ type: 'all', severity: 'all', startDate: '', endDate: '', search: '' })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
              <p className="text-gray-600">
                {filters.search || (filters.type !== 'all') || (filters.severity !== 'all') || filters.startDate || filters.endDate
                  ? 'Try adjusting your filters to see more results.'
                  : 'You haven\'t received any alerts yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{alert.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(alert.createdAt).toLocaleDateString()} at{' '}
                            {new Date(alert.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{alert.message}</p>
                    
                    {alert.feedback && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">Your Feedback</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < alert.feedback!.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            {alert.feedback.wasAccurate ? (
                              <ThumbsUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <ThumbsDown className="h-4 w-4 text-red-600" />
                            )}
                            {alert.feedback.wasAccurate ? 'Accurate' : 'Not Accurate'}
                          </span>
                          <span className="flex items-center gap-1">
                            {alert.feedback.wasHelpful ? (
                              <ThumbsUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <ThumbsDown className="h-4 w-4 text-red-600" />
                            )}
                            {alert.feedback.wasHelpful ? 'Helpful' : 'Not Helpful'}
                          </span>
                        </div>
                        {alert.feedback.comment && (
                          <p className="text-sm text-gray-700 mt-2">{alert.feedback.comment}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!alert.feedback && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAlert(alert);
                            resetFeedbackForm();
                          }}
                          className="flex items-center gap-2"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Provide Feedback
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Provide Alert Feedback</DialogTitle>
                          <DialogDescription>
                            Help us improve by sharing your thoughts on this alert.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Overall Rating</Label>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  onClick={() => setFeedback(prev => ({ ...prev, rating }))}
                                  className="p-1"
                                >
                                  <Star
                                    className={`h-6 w-6 ${
                                      rating <= feedback.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Was this alert accurate?</Label>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant={feedback.wasAccurate ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setFeedback(prev => ({ ...prev, wasAccurate: true }))}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant={!feedback.wasAccurate ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setFeedback(prev => ({ ...prev, wasAccurate: false }))}
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label>Was this alert helpful?</Label>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant={feedback.wasHelpful ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setFeedback(prev => ({ ...prev, wasHelpful: true }))}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant={!feedback.wasHelpful ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setFeedback(prev => ({ ...prev, wasHelpful: false }))}
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="comment">Additional Comments (Optional)</Label>
                            <Textarea
                              id="comment"
                              placeholder="Share any additional thoughts about this alert..."
                              value={feedback.comment}
                              onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                              rows={3}
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                              Cancel
                            </Button>
                            <Button onClick={submitFeedback} disabled={submittingFeedback}>
                              {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} alerts
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}