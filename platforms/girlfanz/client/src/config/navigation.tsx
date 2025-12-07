import { 
  Home, 
  Search, 
  Users, 
  MessageCircle, 
  Video, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  HelpCircle, 
  BookOpen, 
  GraduationCap, 
  Shield,
  BarChart3,
  Upload,
  UserCheck
} from "lucide-react";

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('fan' | 'creator' | 'admin' | 'support')[];
  badge?: number | string;
  description?: string;
  children?: NavigationItem[];
}

// Main navigation configuration - role-based access control
export const mainNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Your personalized home feed'
  },
  {
    id: 'discover',
    label: 'Discover',
    href: '/discover',
    icon: Search,
    description: 'Find new creators and content'
  },
  {
    id: 'following',
    label: 'Following',
    href: '/following',
    icon: Users,
    description: 'Content from creators you follow'
  },
  {
    id: 'messages',
    label: 'Messages',
    href: '/messages',
    icon: MessageCircle,
    badge: 12,
    description: 'Direct messages and conversations'
  },
  {
    id: 'live',
    label: 'Live',
    href: '/live',
    icon: Video,
    description: 'Live streaming and events'
  }
];

// Creator-specific navigation items
export const creatorNavigation: NavigationItem[] = [
  {
    id: 'content',
    label: 'Content',
    href: '/content',
    icon: Upload,
    roles: ['creator', 'admin'],
    description: 'Upload and manage your content'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['creator', 'admin'],
    description: 'Track your performance metrics'
  },
  {
    id: 'earnings',
    label: 'Earnings',
    href: '/earnings',
    icon: DollarSign,
    roles: ['creator', 'admin'],
    description: 'View earnings and request payouts'
  }
];

// Support and help navigation
export const supportNavigation: NavigationItem[] = [
  {
    id: 'help',
    label: 'Help Center',
    href: '/help',
    icon: HelpCircle,
    description: 'Get support and find answers',
    children: [
      {
        id: 'help-tickets',
        label: 'Support Tickets',
        href: '/help/tickets',
        icon: MessageCircle,
        description: 'View and create support tickets'
      },
      {
        id: 'help-contact',
        label: 'Contact Support',
        href: '/help/contact',
        icon: MessageCircle,
        description: 'Get direct help from our team'
      }
    ]
  },
  {
    id: 'wiki',
    label: 'Knowledge Base',
    href: '/wiki',
    icon: BookOpen,
    description: 'AI-powered help articles and guides'
  },
  {
    id: 'tutorials',
    label: 'Tutorials',
    href: '/tutorials',
    icon: GraduationCap,
    description: 'Step-by-step platform guides'
  }
];

// Settings and account navigation
export const accountNavigation: NavigationItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: Users,
    description: 'Manage your profile and preferences'
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Account and platform settings'
  },
  {
    id: 'verification',
    label: 'Verification',
    href: '/verification',
    icon: UserCheck,
    roles: ['creator'],
    description: 'Age and identity verification status'
  }
];

// Admin-only navigation
export const adminNavigation: NavigationItem[] = [
  {
    id: 'moderation',
    label: 'Moderation',
    href: '/moderation',
    icon: Shield,
    roles: ['admin'],
    description: 'Content moderation and review'
  },
  {
    id: 'health',
    label: 'System Health',
    href: '/health',
    icon: TrendingUp,
    roles: ['admin'],
    description: 'Platform health and monitoring'
  }
];

// Combined navigation for easy access
export const allNavigation = [
  ...mainNavigation,
  ...creatorNavigation,
  ...supportNavigation,
  ...accountNavigation,
  ...adminNavigation
];

// Helper function to filter navigation by user role
export function getNavigationForRole(role: 'fan' | 'creator' | 'admin'): NavigationItem[] {
  return allNavigation.filter(item => 
    !item.roles || item.roles.includes(role) || role === 'admin'
  );
}

// Helper function to find navigation item by path
export function findNavigationItem(path: string): NavigationItem | undefined {
  return allNavigation.find(item => item.href === path);
}

// Generate breadcrumb trail for a given path
export function generateBreadcrumbs(path: string): { label: string; href: string }[] {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Home', href: '/dashboard' }];
  
  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const navItem = findNavigationItem(currentPath);
    
    if (navItem) {
      breadcrumbs.push({ label: navItem.label, href: navItem.href });
    } else {
      // Create breadcrumb for unknown paths
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ label, href: currentPath });
    }
  }
  
  return breadcrumbs;
}

// Quick command palette items
export interface QuickCommand {
  id: string;
  label: string;
  href?: string;
  action?: () => void;
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
  group: 'navigation' | 'actions' | 'support';
}

export const quickCommands: QuickCommand[] = [
  // Navigation commands
  {
    id: 'nav-dashboard',
    label: 'Go to Dashboard',
    href: '/dashboard',
    keywords: ['dashboard', 'home', 'feed'],
    icon: Home,
    group: 'navigation'
  },
  {
    id: 'nav-messages',
    label: 'Open Messages',
    href: '/messages',
    keywords: ['messages', 'chat', 'dm', 'direct'],
    icon: MessageCircle,
    group: 'navigation'
  },
  {
    id: 'nav-earnings',
    label: 'View Earnings',
    href: '/earnings',
    keywords: ['earnings', 'money', 'payout', 'income'],
    icon: DollarSign,
    group: 'navigation'
  },
  {
    id: 'nav-help',
    label: 'Get Help',
    href: '/help',
    keywords: ['help', 'support', 'assistance', 'problem'],
    icon: HelpCircle,
    group: 'support'
  },
  {
    id: 'nav-wiki',
    label: 'Search Knowledge Base',
    href: '/wiki',
    keywords: ['wiki', 'knowledge', 'articles', 'guide'],
    icon: BookOpen,
    group: 'support'
  },
  {
    id: 'nav-tutorials',
    label: 'View Tutorials',
    href: '/tutorials',
    keywords: ['tutorials', 'learning', 'guide', 'how-to'],
    icon: GraduationCap,
    group: 'support'
  },
  // Action commands
  {
    id: 'action-upload',
    label: 'Upload Content',
    href: '/content',
    keywords: ['upload', 'content', 'post', 'share'],
    icon: Upload,
    group: 'actions'
  },
  {
    id: 'action-ticket',
    label: 'Create Support Ticket',
    href: '/help/tickets',
    keywords: ['ticket', 'support', 'issue', 'problem', 'bug'],
    icon: MessageCircle,
    group: 'support'
  }
];

// Filter commands by role
export function getCommandsForRole(role: 'fan' | 'creator' | 'admin'): QuickCommand[] {
  if (role === 'fan') {
    return quickCommands.filter(cmd => 
      !cmd.href?.includes('/content') && 
      !cmd.href?.includes('/earnings') &&
      !cmd.href?.includes('/analytics')
    );
  }
  return quickCommands;
}