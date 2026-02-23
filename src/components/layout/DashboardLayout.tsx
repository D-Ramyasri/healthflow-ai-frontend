import { ReactNode, useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getNotifications } from '@/lib/api';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export function DashboardLayout({ 
  children, 
  title, 
  subtitle, 
  searchQuery = '', 
  onSearchChange,
  showSearch = true 
}: DashboardLayoutProps) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState<Set<number>>(new Set());
  const [allNotifications, setAllNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  // Fetch real notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user?.role) {
        try {
          setLoadingNotifications(true);
          const notifications = await getNotifications(user.role, 20);
          setAllNotifications(notifications);

          // If user is nurse and there's a recent doctor consultation notification,
          // dispatch a workflow update event so pages (e.g., NurseDashboard) can refresh.
          if (user.role === 'nurse' && notifications.some(n => n.type === 'consultation')) {
            try {
              window.dispatchEvent(new CustomEvent('workflow:update', { detail: { source: 'notification', type: 'doctor.notes_complete' } }));
            } catch (e) {
              console.warn('Failed to dispatch workflow:update event', e);
            }
          }

          // If user is doctor and there's a nurse summary notification,
          // dispatch workflow update so doctor dashboard refreshes pending approvals.
          if (user.role === 'doctor' && notifications.some(n => n.type === 'nurse')) {
            try {
              window.dispatchEvent(new CustomEvent('workflow:update', { detail: { source: 'notification', type: 'nurse.summary_complete' } }));
            } catch (e) {
              console.warn('Failed to dispatch workflow:update event', e);
            }
          }
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
          setAllNotifications([]);
        } finally {
          setLoadingNotifications(false);
        }
      }
    };

    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.role]);

  const recentNotifications = allNotifications.slice(0, 3);
  const unreadCount = allNotifications.length - notificationsRead.size;

  const markAllAsRead = () => {
    const allIds = new Set(allNotifications.map(n => n.id));
    setNotificationsRead(allIds);
  };

  const getNotificationBgClass = (color: string, isRead: boolean): string => {
    const baseClasses: Record<string, string> = {
      'blue': isRead ? 'bg-blue-50/50' : 'bg-blue-50',
      'green': isRead ? 'bg-green-50/50' : 'bg-green-50',
      'purple': isRead ? 'bg-purple-50/50' : 'bg-purple-50',
      'indigo': isRead ? 'bg-indigo-50/50' : 'bg-indigo-50',
      'pink': isRead ? 'bg-pink-50/50' : 'bg-pink-50',
      'red': isRead ? 'bg-red-50/50' : 'bg-red-50',
      'yellow': isRead ? 'bg-yellow-50/50' : 'bg-yellow-50',
      'gray': isRead ? 'bg-gray-50/50' : 'bg-gray-50',
    };
    return baseClasses[color] || baseClasses['gray'];
  };

  const getNotificationDotClass = (color: string): string => {
    const classes: Record<string, string> = {
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'purple': 'bg-purple-500',
      'indigo': 'bg-indigo-500',
      'pink': 'bg-pink-500',
      'red': 'bg-red-500',
      'yellow': 'bg-yellow-500',
      'gray': 'bg-gray-500',
    };
    return classes[color] || classes['gray'];
  };

  const getNotificationTextClass = (color: string): string => {
    const classes: Record<string, string> = {
      'blue': 'text-blue-900',
      'green': 'text-green-900',
      'purple': 'text-purple-900',
      'indigo': 'text-indigo-900',
      'pink': 'text-pink-900',
      'red': 'text-red-900',
      'yellow': 'text-yellow-900',
      'gray': 'text-gray-900',
    };
    return classes[color] || classes['gray'];
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="h-full px-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                <div>
                  <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {showSearch && (
                  <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search patients, records..."
                      className="w-64 pl-9 pr-9 bg-muted/50 border-transparent focus:border-primary"
                      value={searchQuery}
                      onChange={(e) => onSearchChange?.(e.target.value)}
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6"
                        onClick={() => onSearchChange?.('')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
                
                <Popover open={showNotifications} onOpenChange={setShowNotifications}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Recent Notifications</h4>
                      <div className="space-y-3">
                        {loadingNotifications ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Loading notifications...</p>
                        ) : allNotifications.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No notifications yet</p>
                        ) : (
                          recentNotifications.map((notification) => {
                            const isRead = notificationsRead.has(notification.id);
                            return (
                              <div key={notification.id} className={`flex items-start gap-3 p-3 rounded-lg bg-muted/50 ${isRead ? 'opacity-60' : ''}`}>
                                <div className={`w-2 h-2 rounded-full ${getNotificationDotClass(notification.color)} mt-2 flex-shrink-0`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{notification.title}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="sm"
                        onClick={() => {
                          setShowNotifications(false);
                          setShowAllNotifications(true);
                        }}
                      >
                        View All Notifications
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Dialog open={showAllNotifications} onOpenChange={setShowAllNotifications}>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>All Notifications</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {loadingNotifications ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Loading notifications...</p>
                      ) : allNotifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No notifications available</p>
                      ) : (
                        <>
                          <div className="space-y-3">
                            {allNotifications.map((notification) => {
                              const isRead = notificationsRead.has(notification.id);
                              return (
                                <div key={notification.id} className={`flex items-start gap-3 p-4 rounded-lg ${getNotificationBgClass(notification.color, isRead)} border ${isRead ? 'border-opacity-30' : ''} ${isRead ? 'opacity-60' : ''}`}>
                                  <div className={`w-3 h-3 rounded-full ${getNotificationDotClass(notification.color)} mt-1 flex-shrink-0`} />
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${getNotificationTextClass(notification.color)} ${isRead ? 'line-through' : ''}`}>{notification.title}</p>
                                    <p className={`text-xs text-gray-600 ${isRead ? 'line-through' : ''}`}>{notification.message}</p>
                                    <p className={`text-xs text-gray-500 mt-1 ${isRead ? 'line-through' : ''}`}>{notification.time}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="flex justify-between items-center pt-4 border-t">
                            <p className="text-sm text-muted-foreground">Showing {allNotifications.length} notifications ({unreadCount} unread)</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={markAllAsRead}
                              disabled={unreadCount === 0}
                            >
                              Mark All as Read
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
