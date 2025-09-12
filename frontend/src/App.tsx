import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// 🚀 FANZ Unified Frontend Launcher
// Single entry point to all 13 consolidated platforms

// Import unified components
import { EcosystemHeader } from './components/EcosystemHeader';
import { EcosystemSidebar } from './components/EcosystemSidebar';
import { EcosystemFooter } from './components/EcosystemFooter';
import { UnifiedAuth } from './components/UnifiedAuth';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

// Platform components (lazy loaded for performance)
import { lazy, Suspense } from 'react';

const FanzDashboard = lazy(() => import('./platforms/FanzDashboard'));
const FanzSocial = lazy(() => import('./platforms/FanzSocial'));
const FanzTube = lazy(() => import('./platforms/FanzTube'));
const FanzCommerce = lazy(() => import('./platforms/FanzCommerce'));
const FanzSpicyAI = lazy(() => import('./platforms/FanzSpicyAI'));
const FanzMedia = lazy(() => import('./platforms/FanzMedia'));
const FanzLanding = lazy(() => import('./platforms/FanzLanding'));
const FanzFiliate = lazy(() => import('./platforms/FanzFiliate'));
const FanzHub = lazy(() => import('./platforms/FanzHub'));
const StarzCards = lazy(() => import('./platforms/StarzCards'));
const ClubCentral = lazy(() => import('./platforms/ClubCentral'));
const MigrationHQ = lazy(() => import('./platforms/MigrationHQ'));
const FanzOS = lazy(() => import('./platforms/FanzOS'));

// Unified Analytics
const UnifiedAnalytics = lazy(() => import('./components/UnifiedAnalytics'));
const UnifiedWallet = lazy(() => import('./components/UnifiedWallet'));
const UnifiedSettings = lazy(() => import('./components/UnifiedSettings'));
const UnifiedProfile = lazy(() => import('./components/UnifiedProfile'));

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// 🎯 Platform Configuration
const PLATFORM_CONFIG = {
  fanz: {
    name: 'Fanz',
    description: 'Social networking and community features',
    icon: '💬',
    color: '#3B82F6',
    component: FanzSocial,
    requiresAuth: true,
  },
  fanztube: {
    name: 'FanzTube',
    description: 'Video streaming and content management',
    icon: '🎬',
    color: '#EF4444',
    component: FanzTube,
    requiresAuth: true,
  },
  fanzcommerce: {
    name: 'FanzCommerce',
    description: 'E-commerce and marketplace',
    icon: '🛒',
    color: '#10B981',
    component: FanzCommerce,
    requiresAuth: true,
  },
  fanzspicyai: {
    name: 'FanzSpicy AI',
    description: 'AI-powered content creation',
    icon: '🤖',
    color: '#8B5CF6',
    component: FanzSpicyAI,
    requiresAuth: true,
  },
  fanzmedia: {
    name: 'FanzMedia',
    description: 'Media processing and CDN',
    icon: '📱',
    color: '#F59E0B',
    component: FanzMedia,
    requiresAuth: true,
  },
  fanzdash: {
    name: 'FanzDash',
    description: 'Unified dashboard and analytics',
    icon: '📊',
    color: '#06B6D4',
    component: FanzDashboard,
    requiresAuth: true,
  },
  fanzlanding: {
    name: 'FanzLanding',
    description: 'Landing pages and marketing',
    icon: '🎯',
    color: '#EC4899',
    component: FanzLanding,
    requiresAuth: false,
  },
  fanzfiliate: {
    name: 'FanzFiliate',
    description: 'Affiliate marketing and referrals',
    icon: '💰',
    color: '#84CC16',
    component: FanzFiliate,
    requiresAuth: true,
  },
  fanzhub: {
    name: 'FanzHub',
    description: 'Content storage and management',
    icon: '🗂️',
    color: '#6366F1',
    component: FanzHub,
    requiresAuth: true,
  },
  starzcards: {
    name: 'StarzCards',
    description: 'Digital collectibles and NFTs',
    icon: '🃏',
    color: '#F97316',
    component: StarzCards,
    requiresAuth: true,
  },
  clubcentral: {
    name: 'ClubCentral',
    description: 'Private clubs and group management',
    icon: '🏛️',
    color: '#14B8A6',
    component: ClubCentral,
    requiresAuth: true,
  },
  migrationhq: {
    name: 'MigrationHQ',
    description: 'Data migration and platform tools',
    icon: '🔄',
    color: '#64748B',
    component: MigrationHQ,
    requiresAuth: true,
  },
  fanzos: {
    name: 'FanzOS',
    description: 'Core operating system',
    icon: '⚙️',
    color: '#374151',
    component: FanzOS,
    requiresAuth: true,
  },
};

// 🔐 Authentication Context
interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  platformAccess: any[];
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// 🔐 Auth Provider
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [platformAccess, setPlatformAccess] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('fanz_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_GATEWAY_URL}/api/user/unified-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Ecosystem': 'fanz-unified',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.profile.basic);
        setPlatformAccess(data.profile.platforms || []);
      } else {
        localStorage.removeItem('fanz_token');
        localStorage.removeItem('fanz_refresh_token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('fanz_token');
      localStorage.removeItem('fanz_refresh_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_GATEWAY_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ecosystem': 'fanz-unified',
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('fanz_token', data.tokens.accessToken);
        localStorage.setItem('fanz_refresh_token', data.tokens.refreshToken);
        
        setUser(data.user);
        setPlatformAccess(data.platformAccess || []);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('fanz_token');
      if (token) {
        await fetch(`${process.env.REACT_APP_API_GATEWAY_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Ecosystem': 'fanz-unified',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('fanz_token');
      localStorage.removeItem('fanz_refresh_token');
      setUser(null);
      setPlatformAccess([]);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    platformAccess,
    login,
    logout,
    checkAuth,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 🎨 Main App Layout
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <div className=\"min-h-screen bg-gray-50 flex flex-col\">
      {/* Global Header */}
      <EcosystemHeader 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className=\"flex-1 flex overflow-hidden\">
        {/* Sidebar */}
        {isAuthenticated && (
          <EcosystemSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            platforms={Object.entries(PLATFORM_CONFIG)}
          />
        )}
        
        {/* Main Content */}
        <main className=\"flex-1 overflow-auto bg-white\">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      
      {/* Global Footer */}
      <EcosystemFooter />
      
      {/* Toast Notifications */}
      <Toaster 
        position=\"top-right\"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
};

// 🛡️ Protected Route Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  platform?: string;
}> = ({ children, platform }) => {
  const { isAuthenticated, platformAccess, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to=\"/auth\" replace />;
  }

  // Check platform access if specified
  if (platform) {
    const hasAccess = platformAccess.some(
      (access: any) => access.platform === platform && access.isActive
    );
    
    if (!hasAccess) {
      return (
        <div className=\"flex items-center justify-center h-64\">
          <div className=\"text-center\">
            <h2 className=\"text-2xl font-bold text-gray-900 mb-2\">Access Required</h2>
            <p className=\"text-gray-600\">
              You need access to {PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]?.name} to view this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// 🏠 Landing Page Component
const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to=\"/dashboard\" replace />;
  }

  return (
    <div className=\"min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900\">
      <div className=\"relative z-10 flex flex-col items-center justify-center min-h-screen px-4\">
        <div className=\"text-center mb-12\">
          <h1 className=\"text-6xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent\">
            FANZ Ecosystem
          </h1>
          <p className=\"text-2xl text-gray-300 mb-8\">
            The Complete Creator Economy Platform
          </p>
          <p className=\"text-lg text-gray-400 max-w-2xl mx-auto mb-12\">
            13 unified platforms, zero feature loss. Experience the future of creator economy 
            with seamless cross-platform integration, unified analytics, and advanced AI tools.
          </p>
        </div>

        {/* Platform Grid */}
        <div className=\"grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12 max-w-6xl\">
          {Object.entries(PLATFORM_CONFIG).map(([key, platform]) => (
            <div
              key={key}
              className=\"bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center hover:bg-white/20 transition-all duration-300\"
            >
              <div className=\"text-3xl mb-2\">{platform.icon}</div>
              <div className=\"text-white text-sm font-medium\">{platform.name}</div>
              <div className=\"text-gray-300 text-xs\">{platform.description}</div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className=\"flex flex-col sm:flex-row gap-4\">
          <button
            onClick={() => window.location.href = '/auth'}
            className=\"bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl\"
          >
            Get Started
          </button>
          <button
            onClick={() => window.location.href = '/about'}
            className=\"bg-white/10 backdrop-blur-lg text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20\"
          >
            Learn More
          </button>
        </div>

        {/* Stats */}
        <div className=\"grid grid-cols-3 gap-8 mt-16 text-center\">
          <div>
            <div className=\"text-3xl font-bold text-white\">13</div>
            <div className=\"text-gray-400\">Unified Platforms</div>
          </div>
          <div>
            <div className=\"text-3xl font-bold text-white\">64%</div>
            <div className=\"text-gray-400\">Complexity Reduction</div>
          </div>
          <div>
            <div className=\"text-3xl font-bold text-white\">0</div>
            <div className=\"text-gray-400\">Feature Loss</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 📱 Main App Component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Landing Page */}
            <Route path=\"/\" element={<LandingPage />} />
            
            {/* Authentication */}
            <Route 
              path=\"/auth\" 
              element={
                <AppLayout>
                  <UnifiedAuth />
                </AppLayout>
              } 
            />

            {/* Protected Routes */}
            <Route 
              path=\"/dashboard\" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Suspense fallback={<LoadingScreen />}>
                      <FanzDashboard />
                    </Suspense>
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Platform Routes */}
            {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
              <Route
                key={key}
                path={`/${key}/*`}
                element={
                  config.requiresAuth ? (
                    <ProtectedRoute platform={key}>
                      <AppLayout>
                        <Suspense fallback={<LoadingScreen />}>
                          <config.component />
                        </Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  ) : (
                    <AppLayout>
                      <Suspense fallback={<LoadingScreen />}>
                        <config.component />
                      </Suspense>
                    </AppLayout>
                  )
                }
              />
            ))}

            {/* Unified Features */}
            <Route 
              path=\"/analytics\" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Suspense fallback={<LoadingScreen />}>
                      <UnifiedAnalytics />
                    </Suspense>
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path=\"/wallet\" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Suspense fallback={<LoadingScreen />}>
                      <UnifiedWallet />
                    </Suspense>
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path=\"/settings\" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Suspense fallback={<LoadingScreen />}>
                      <UnifiedSettings />
                    </Suspense>
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path=\"/profile\" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Suspense fallback={<LoadingScreen />}>
                      <UnifiedProfile />
                    </Suspense>
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Catch all - redirect to dashboard if authenticated, otherwise to landing */}
            <Route 
              path=\"*\" 
              element={<Navigate to=\"/\" replace />} 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

// 🎯 Export platform configuration for use in other components
export { PLATFORM_CONFIG };
export type { AuthContextType };