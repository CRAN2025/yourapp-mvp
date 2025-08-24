import { useState, useEffect } from 'react';
import { ref, onValue, off, query, orderByChild } from 'firebase/database';
import { Calendar, Clock, Smartphone, Monitor, ExternalLink } from 'lucide-react';
import { database } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { formatRelativeTime } from '@/lib/utils/formatting';
import type { Event } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

export default function Orders() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterDevice, setFilterDevice] = useState('all');

  // Load events from Firebase
  useEffect(() => {
    if (!user) return;

    const eventsRef = query(
      ref(database, `events/${user.uid}`),
      orderByChild('timestamp')
    );
    
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const eventsList = Object.entries(data).map(([id, eventData]) => ({
            id,
            ...(eventData as Omit<Event, 'id'>),
          })).reverse(); // Show newest first
          setEvents(eventsList);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error('Error loading events:', error);
        toast({
          title: 'Error',
          description: 'Failed to load order events.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    });

    return () => off(eventsRef, 'value', unsubscribe);
  }, [user, toast]);

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesDevice = filterDevice === 'all' || event.deviceType === filterDevice;
    return matchesType && matchesDevice;
  });

  // Group events by date
  const groupEventsByDate = (events: Event[]) => {
    const groups: { [key: string]: Event[] } = {};
    
    events.forEach((event) => {
      const date = new Date(event.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });
    
    return groups;
  };

  const groupedEvents = groupEventsByDate(filteredEvents);

  const getEventIcon = (type: Event['type']) => {
    switch (type) {
      case 'wa_click':
        return '💬';
      case 'product_view':
        return '👁️';
      case 'store_view':
        return '🏪';
      default:
        return '📊';
    }
  };

  const getEventTitle = (event: Event) => {
    switch (event.type) {
      case 'wa_click':
        return 'WhatsApp Contact';
      case 'product_view':
        return 'Product View';
      case 'store_view':
        return 'Store Visit';
      default:
        return 'Activity';
    }
  };

  const getEventDescription = (event: Event) => {
    switch (event.type) {
      case 'wa_click':
        return event.metadata?.productName 
          ? `Customer clicked WhatsApp for "${event.metadata.productName}"`
          : 'Customer clicked WhatsApp contact';
      case 'product_view':
        return event.metadata?.productName 
          ? `Viewed "${event.metadata.productName}"`
          : 'Product viewed';
      case 'store_view':
        return 'Visited your store page';
      default:
        return 'Activity recorded';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="lg" className="mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Lead Log</h1>
          <p className="text-muted-foreground">Track customer interactions and engagement</p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-event-type">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="wa_click">WhatsApp Clicks</SelectItem>
                <SelectItem value="product_view">Product Views</SelectItem>
                <SelectItem value="store_view">Store Visits</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterDevice} onValueChange={setFilterDevice}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-device-type">
                <SelectValue placeholder="All Devices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Total Events: {filteredEvents.length}</span>
            </div>
          </div>
        </Card>

        {/* Events Timeline */}
        {Object.keys(groupedEvents).length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-16 h-16" />}
            title="No activity yet"
            description="Customer interactions will appear here once your store starts receiving visitors."
            action={{
              label: "View Store",
              onClick: () => window.open(`/store/${user?.uid}`, '_blank'),
            }}
          />
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedEvents).map(([date, dayEvents]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  <Badge variant="outline" className="ml-2">
                    {dayEvents.length} events
                  </Badge>
                </h3>
                
                <div className="space-y-4">
                  {dayEvents.map((event) => (
                    <Card key={event.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-foreground">
                                {getEventTitle(event)}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {event.deviceType === 'mobile' ? (
                                  <Smartphone className="w-4 h-4" />
                                ) : (
                                  <Monitor className="w-4 h-4" />
                                )}
                                <span className="capitalize">{event.deviceType}</span>
                              </div>
                            </div>
                            <p className="text-muted-foreground mb-2">
                              {getEventDescription(event)}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatRelativeTime(event.timestamp)}
                              </div>
                              {event.metadata?.productPrice && (
                                <div>
                                  Product Value: ${event.metadata.productPrice}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
