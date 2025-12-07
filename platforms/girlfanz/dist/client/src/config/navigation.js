"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickCommands = exports.allNavigation = exports.adminNavigation = exports.accountNavigation = exports.supportNavigation = exports.creatorNavigation = exports.mainNavigation = void 0;
exports.getNavigationForRole = getNavigationForRole;
exports.findNavigationItem = findNavigationItem;
exports.generateBreadcrumbs = generateBreadcrumbs;
exports.getCommandsForRole = getCommandsForRole;
const lucide_react_1 = require("lucide-react");
// Main navigation configuration - role-based access control
exports.mainNavigation = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: lucide_react_1.Home,
        description: 'Your personalized home feed'
    },
    {
        id: 'discover',
        label: 'Discover',
        href: '/discover',
        icon: lucide_react_1.Search,
        description: 'Find new creators and content'
    },
    {
        id: 'following',
        label: 'Following',
        href: '/following',
        icon: lucide_react_1.Users,
        description: 'Content from creators you follow'
    },
    {
        id: 'messages',
        label: 'Messages',
        href: '/messages',
        icon: lucide_react_1.MessageCircle,
        badge: 12,
        description: 'Direct messages and conversations'
    },
    {
        id: 'live',
        label: 'Live',
        href: '/live',
        icon: lucide_react_1.Video,
        description: 'Live streaming and events'
    }
];
// Creator-specific navigation items
exports.creatorNavigation = [
    {
        id: 'content',
        label: 'Content',
        href: '/content',
        icon: lucide_react_1.Upload,
        roles: ['creator', 'admin'],
        description: 'Upload and manage your content'
    },
    {
        id: 'analytics',
        label: 'Analytics',
        href: '/analytics',
        icon: lucide_react_1.BarChart3,
        roles: ['creator', 'admin'],
        description: 'Track your performance metrics'
    },
    {
        id: 'earnings',
        label: 'Earnings',
        href: '/earnings',
        icon: lucide_react_1.DollarSign,
        roles: ['creator', 'admin'],
        description: 'View earnings and request payouts'
    }
];
// Support and help navigation
exports.supportNavigation = [
    {
        id: 'help',
        label: 'Help Center',
        href: '/help',
        icon: lucide_react_1.HelpCircle,
        description: 'Get support and find answers',
        children: [
            {
                id: 'help-tickets',
                label: 'Support Tickets',
                href: '/help/tickets',
                icon: lucide_react_1.MessageCircle,
                description: 'View and create support tickets'
            },
            {
                id: 'help-contact',
                label: 'Contact Support',
                href: '/help/contact',
                icon: lucide_react_1.MessageCircle,
                description: 'Get direct help from our team'
            }
        ]
    },
    {
        id: 'wiki',
        label: 'Knowledge Base',
        href: '/wiki',
        icon: lucide_react_1.BookOpen,
        description: 'AI-powered help articles and guides'
    },
    {
        id: 'tutorials',
        label: 'Tutorials',
        href: '/tutorials',
        icon: lucide_react_1.GraduationCap,
        description: 'Step-by-step platform guides'
    }
];
// Settings and account navigation
exports.accountNavigation = [
    {
        id: 'profile',
        label: 'Profile',
        href: '/profile',
        icon: lucide_react_1.Users,
        description: 'Manage your profile and preferences'
    },
    {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: lucide_react_1.Settings,
        description: 'Account and platform settings'
    },
    {
        id: 'verification',
        label: 'Verification',
        href: '/verification',
        icon: lucide_react_1.UserCheck,
        roles: ['creator'],
        description: 'Age and identity verification status'
    }
];
// Admin-only navigation
exports.adminNavigation = [
    {
        id: 'moderation',
        label: 'Moderation',
        href: '/moderation',
        icon: lucide_react_1.Shield,
        roles: ['admin'],
        description: 'Content moderation and review'
    },
    {
        id: 'health',
        label: 'System Health',
        href: '/health',
        icon: lucide_react_1.TrendingUp,
        roles: ['admin'],
        description: 'Platform health and monitoring'
    }
];
// Combined navigation for easy access
exports.allNavigation = [
    ...exports.mainNavigation,
    ...exports.creatorNavigation,
    ...exports.supportNavigation,
    ...exports.accountNavigation,
    ...exports.adminNavigation
];
// Helper function to filter navigation by user role
function getNavigationForRole(role) {
    return exports.allNavigation.filter(item => !item.roles || item.roles.includes(role) || role === 'admin');
}
// Helper function to find navigation item by path
function findNavigationItem(path) {
    return exports.allNavigation.find(item => item.href === path);
}
// Generate breadcrumb trail for a given path
function generateBreadcrumbs(path) {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', href: '/dashboard' }];
    let currentPath = '';
    for (const segment of segments) {
        currentPath += `/${segment}`;
        const navItem = findNavigationItem(currentPath);
        if (navItem) {
            breadcrumbs.push({ label: navItem.label, href: navItem.href });
        }
        else {
            // Create breadcrumb for unknown paths
            const label = segment.charAt(0).toUpperCase() + segment.slice(1);
            breadcrumbs.push({ label, href: currentPath });
        }
    }
    return breadcrumbs;
}
exports.quickCommands = [
    // Navigation commands
    {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        href: '/dashboard',
        keywords: ['dashboard', 'home', 'feed'],
        icon: lucide_react_1.Home,
        group: 'navigation'
    },
    {
        id: 'nav-messages',
        label: 'Open Messages',
        href: '/messages',
        keywords: ['messages', 'chat', 'dm', 'direct'],
        icon: lucide_react_1.MessageCircle,
        group: 'navigation'
    },
    {
        id: 'nav-earnings',
        label: 'View Earnings',
        href: '/earnings',
        keywords: ['earnings', 'money', 'payout', 'income'],
        icon: lucide_react_1.DollarSign,
        group: 'navigation'
    },
    {
        id: 'nav-help',
        label: 'Get Help',
        href: '/help',
        keywords: ['help', 'support', 'assistance', 'problem'],
        icon: lucide_react_1.HelpCircle,
        group: 'support'
    },
    {
        id: 'nav-wiki',
        label: 'Search Knowledge Base',
        href: '/wiki',
        keywords: ['wiki', 'knowledge', 'articles', 'guide'],
        icon: lucide_react_1.BookOpen,
        group: 'support'
    },
    {
        id: 'nav-tutorials',
        label: 'View Tutorials',
        href: '/tutorials',
        keywords: ['tutorials', 'learning', 'guide', 'how-to'],
        icon: lucide_react_1.GraduationCap,
        group: 'support'
    },
    // Action commands
    {
        id: 'action-upload',
        label: 'Upload Content',
        href: '/content',
        keywords: ['upload', 'content', 'post', 'share'],
        icon: lucide_react_1.Upload,
        group: 'actions'
    },
    {
        id: 'action-ticket',
        label: 'Create Support Ticket',
        href: '/help/tickets',
        keywords: ['ticket', 'support', 'issue', 'problem', 'bug'],
        icon: lucide_react_1.MessageCircle,
        group: 'support'
    }
];
// Filter commands by role
function getCommandsForRole(role) {
    if (role === 'fan') {
        return exports.quickCommands.filter(cmd => {
            var _a, _b, _c;
            return !((_a = cmd.href) === null || _a === void 0 ? void 0 : _a.includes('/content')) &&
                !((_b = cmd.href) === null || _b === void 0 ? void 0 : _b.includes('/earnings')) &&
                !((_c = cmd.href) === null || _c === void 0 ? void 0 : _c.includes('/analytics'));
        });
    }
    return exports.quickCommands;
}
