import { 
  Users, Stethoscope, Heart, Pill, Settings, Home, 
  FileText, LogOut, ChevronDown, User, ClipboardList,
  Activity, Shield, Database, BarChart3
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';

const roleMenus = {
  receptionist: [
    { title: 'Dashboard', url: '/receptionist', icon: Home },
    { title: 'Register Patient', url: '/receptionist/register', icon: Users },
    { title: 'Patient Records', url: '/receptionist/records', icon: FileText },
    { title: 'Appointments', url: '/receptionist/appointments', icon: ClipboardList },
  ],
  doctor: [
    { title: 'Dashboard', url: '/doctor', icon: Home },
    { title: 'Patient List', url: '/doctor/patients', icon: Users },
    { title: 'Consultations', url: '/doctor/consultations', icon: Stethoscope },
    { title: 'Prescriptions', url: '/doctor/prescriptions', icon: FileText },
    { title: 'Pending Approvals', url: '/doctor/approvals', icon: ClipboardList },
  ],
  nurse: [
    { title: 'Dashboard', url: '/nurse', icon: Home },
    { title: 'Assigned Patients', url: '/nurse/patients', icon: Users },
    { title: 'Condition Explanations', url: '/nurse/explanations', icon: Heart },
    { title: 'Monitoring Tasks', url: '/nurse/monitoring', icon: Activity },
  ],
  pharmacist: [
    { title: 'Dashboard', url: '/pharmacist', icon: Home },
    { title: 'Prescriptions', url: '/pharmacist?view=prescriptions', icon: FileText },
    { title: 'Dispensing', url: '/pharmacist?view=dispensing', icon: Pill },
    { title: 'Inventory', url: '/pharmacist?view=inventory', icon: Database },
  ],
  admin: [
    { title: 'Dashboard', url: '/admin', icon: Home },
    { title: 'User Management', url: '/admin/users', icon: Users },
    { title: 'Access Control', url: '/admin/roles', icon: Shield },
    { title: 'System Logs', url: '/admin/audit', icon: FileText },
    { title: 'Analytics', url: '/admin/reports', icon: BarChart3 },
  ],
};

const roleLabels = {
  receptionist: 'Receptionist Portal',
  doctor: 'Doctor Portal',
  nurse: 'Nurse Portal',
  pharmacist: 'Pharmacy Portal',
  admin: 'Admin Portal',
};

const roleIcons = {
  receptionist: Users,
  doctor: Stethoscope,
  nurse: Heart,
  pharmacist: Pill,
  admin: Settings,
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  if (!user) return null;

  const menuItems = roleMenus[user.role] || [];
  const RoleIcon = roleIcons[user.role];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <RoleIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                Medicortex
              </span>
              <span className="text-xs text-muted-foreground">
                {roleLabels[user.role]}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {!collapsed && 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-sidebar-accent text-sidebar-foreground"
                        )}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mt-4 px-2">
            <PrivacyBadge />
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.username}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
