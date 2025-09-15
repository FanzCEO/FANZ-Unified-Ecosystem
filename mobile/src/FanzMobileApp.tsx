import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// 📱 FANZ Mobile App
// Complete React Native application for creators and fans

interface User {
  id: string;
  username: string;
  email: string;
  type: 'creator' | 'fan' | 'admin';
  verified: boolean;
  subscription?: {
    tier: 'basic' | 'premium' | 'vip';
    expiresAt: Date;
  };
  wallet?: {
    address: string;
    chain: string;
    balance: number;
  };
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
    ageVerified: boolean;
  };
}

interface AppConfig {
  apiBaseUrl: string;
  streamingUrl: string;
  web3Config: {
    networks: string[];
    defaultChain: string;
  };
  features: {
    streaming: boolean;
    nft: boolean;
    staking: boolean;
    analytics: boolean;
  };
  theme: {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      text: string;
      accent: string;
    };
    platform: 'BoyFanz' | 'GirlFanz' | 'DaddyFanz' | 'PupFanz' | 'TransFanz' | 'CougarFanz';
  };
}

interface StreamingSession {
  id: string;
  creatorId: string;
  title: string;
  viewerCount: number;
  isLive: boolean;
  category: string;
  thumbnailUrl: string;
  price?: number;
  isSubscriptionRequired: boolean;
}

interface NotificationPayload {
  type: 'stream_started' | 'new_message' | 'tip_received' | 'nft_sold' | 'system';
  title: string;
  body: string;
  data: Record<string, any>;
}

export class FanzMobileService {
  private apiBaseUrl: string;
  private authToken: string | null = null;
  private currentUser: User | null = null;
  private webSocket: WebSocket | null = null;

  constructor(config: AppConfig) {
    this.apiBaseUrl = config.apiBaseUrl;
    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    // Initialize Firebase services
    await this.initializeFirebase();
    
    // Setup push notifications
    await this.setupPushNotifications();
    
    // Initialize WebSocket connection
    this.initializeWebSocket();
    
    // Setup deep linking
    this.setupDeepLinking();
  }

  private async initializeFirebase(): Promise<void> {
    // Initialize Firebase Analytics
    await analytics().setAnalyticsCollectionEnabled(true);
    
    // Initialize Crashlytics
    await crashlytics().setCrashlyticsCollectionEnabled(true);
    
    console.log('📱 Firebase services initialized');
  }

  private async setupPushNotifications(): Promise<void> {
    try {
      // Request permission for notifications
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        // Get FCM token
        const fcmToken = await messaging().getToken();
        console.log('FCM Token:', fcmToken);
        
        // Store token for backend
        await this.storeFCMToken(fcmToken);
        
        // Handle foreground notifications
        messaging().onMessage(async (remoteMessage) => {
          this.handleForegroundNotification(remoteMessage as NotificationPayload);
        });
        
        // Handle background/quit state notifications
        messaging().onNotificationOpenedApp((remoteMessage) => {
          this.handleNotificationOpen(remoteMessage as NotificationPayload);
        });
        
        // Handle notification that opened app from quit state
        const initialNotification = await messaging().getInitialNotification();
        if (initialNotification) {
          this.handleNotificationOpen(initialNotification as NotificationPayload);
        }
      }
    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
  }

  private initializeWebSocket(): void {
    if (this.webSocket) {
      this.webSocket.close();
    }

    const wsUrl = `${this.apiBaseUrl.replace('http', 'ws')}/ws`;
    this.webSocket = new WebSocket(wsUrl);

    this.webSocket.onopen = () => {
      console.log('🔌 WebSocket connected');
      if (this.authToken) {
        this.webSocket?.send(JSON.stringify({
          type: 'auth',
          token: this.authToken
        }));
      }
    };

    this.webSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error('WebSocket message parsing failed:', error);
      }
    };

    this.webSocket.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      // Reconnect after 3 seconds
      setTimeout(() => this.initializeWebSocket(), 3000);
    };

    this.webSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private setupDeepLinking(): void {
    // Handle incoming links when app is running
    Linking.addEventListener('url', this.handleDeepLink);
    
    // Handle link that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink({ url });
      }
    });
  }

  private handleDeepLink = ({ url }: { url: string }): void => {
    console.log('Deep link received:', url);
    
    // Parse FANZ URLs: fanz://creator/username, fanz://stream/id, fanz://nft/id
    const urlParts = url.replace('fanz://', '').split('/');
    const [type, id] = urlParts;
    
    switch (type) {
      case 'creator':
        this.navigateToCreator(id);
        break;
      case 'stream':
        this.navigateToStream(id);
        break;
      case 'nft':
        this.navigateToNFT(id);
        break;
      case 'token':
        this.navigateToToken(id);
        break;
      default:
        console.log('Unknown deep link type:', type);
    }
  };

  // Authentication methods
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        this.authToken = data.token;
        this.currentUser = data.user;
        
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('currentUser', JSON.stringify(data.user));
        
        // Track login event
        await analytics().logLogin({ method: 'email' });
        
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async logout(): Promise<void> {
    this.authToken = null;
    this.currentUser = null;
    
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('currentUser');
    
    if (this.webSocket) {
      this.webSocket.close();
    }
    
    // Track logout event
    await analytics().logEvent('logout');
  }

  async register(userData: {
    email: string;
    password: string;
    username: string;
    type: 'creator' | 'fan';
    dateOfBirth: Date;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Age verification check
      const age = this.calculateAge(userData.dateOfBirth);
      if (age < 18) {
        return { success: false, error: 'Must be 18 or older to register' };
      }

      const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          ageVerified: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Track registration event
        await analytics().logSignUp({ method: 'email' });
        
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Content streaming methods
  async getActiveStreams(): Promise<StreamingSession[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/streams/active`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch active streams:', error);
      return [];
    }
  }

  async joinStream(streamId: string): Promise<{ success: boolean; streamUrl?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/streams/${streamId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Track stream view event
        await analytics().logEvent('stream_view', {
          stream_id: streamId,
          creator_id: data.creatorId,
        });
        
        return { success: true, streamUrl: data.streamUrl };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Failed to join stream:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async sendTip(streamId: string, amount: number, message?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/streams/${streamId}/tip`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, message }),
      });

      const data = await response.json();

      if (response.ok) {
        // Track tip event
        await analytics().logEvent('tip_sent', {
          stream_id: streamId,
          amount: amount,
          currency: 'USD',
        });
        
        return { success: true };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Failed to send tip:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // NFT and Web3 methods
  async connectWallet(walletType: 'metamask' | 'walletconnect'): Promise<{ success: boolean; address?: string; error?: string }> {
    try {
      // This would integrate with actual wallet libraries
      // For now, we'll simulate the connection
      const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
      
      const response = await fetch(`${this.apiBaseUrl}/web3/connect-wallet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: mockAddress,
          walletType,
          chain: 'polygon',
        }),
      });

      if (response.ok) {
        // Track wallet connection
        await analytics().logEvent('wallet_connected', {
          wallet_type: walletType,
          chain: 'polygon',
        });
        
        return { success: true, address: mockAddress };
      } else {
        return { success: false, error: 'Failed to connect wallet' };
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async mintNFT(contentId: string, metadata: any): Promise<{ success: boolean; tokenId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/web3/mint-nft`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          metadata,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Track NFT mint event
        await analytics().logEvent('nft_minted', {
          content_id: contentId,
          token_id: data.tokenId,
        });
        
        return { success: true, tokenId: data.tokenId };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('NFT minting failed:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Analytics methods
  async getCreatorAnalytics(timeRange: '7d' | '30d' | '90d'): Promise<any> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/analytics/creator?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch creator analytics:', error);
      return null;
    }
  }

  // Notification handlers
  private async storeFCMToken(token: string): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/users/fcm-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fcmToken: token }),
      });
    } catch (error) {
      console.error('Failed to store FCM token:', error);
    }
  }

  private handleForegroundNotification(notification: NotificationPayload): void {
    // Show in-app notification
    Alert.alert(
      notification.title,
      notification.body,
      [
        { text: 'Dismiss', style: 'cancel' },
        { text: 'View', onPress: () => this.handleNotificationAction(notification) },
      ]
    );
  }

  private handleNotificationOpen(notification: NotificationPayload): void {
    this.handleNotificationAction(notification);
  }

  private handleNotificationAction(notification: NotificationPayload): void {
    switch (notification.type) {
      case 'stream_started':
        this.navigateToStream(notification.data.streamId);
        break;
      case 'new_message':
        this.navigateToChat(notification.data.chatId);
        break;
      case 'tip_received':
        this.navigateToEarnings();
        break;
      case 'nft_sold':
        this.navigateToNFT(notification.data.tokenId);
        break;
    }
  }

  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'stream_update':
        // Update stream viewer count, chat messages, etc.
        break;
      case 'tip_received':
        // Show tip animation/notification
        break;
      case 'new_follower':
        // Show follower notification
        break;
      case 'nft_activity':
        // Update NFT status
        break;
    }
  }

  // Navigation helpers
  private navigateToCreator(username: string): void {
    // Navigation logic would be implemented here
    console.log('Navigate to creator:', username);
  }

  private navigateToStream(streamId: string): void {
    console.log('Navigate to stream:', streamId);
  }

  private navigateToNFT(tokenId: string): void {
    console.log('Navigate to NFT:', tokenId);
  }

  private navigateToToken(tokenAddress: string): void {
    console.log('Navigate to token:', tokenAddress);
  }

  private navigateToChat(chatId: string): void {
    console.log('Navigate to chat:', chatId);
  }

  private navigateToEarnings(): void {
    console.log('Navigate to earnings');
  }

  // Utility methods
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

// Main App Component
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const FanzMobileApp: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);
  
  const fanzService = new FanzMobileService({
    apiBaseUrl: __DEV__ ? 'http://localhost:3000/api' : 'https://api.fanz.com',
    streamingUrl: __DEV__ ? 'ws://localhost:3001' : 'wss://streaming.fanz.com',
    web3Config: {
      networks: ['ethereum', 'polygon', 'binance'],
      defaultChain: 'polygon',
    },
    features: {
      streaming: true,
      nft: true,
      staking: true,
      analytics: true,
    },
    theme: {
      colors: {
        primary: '#FF0080', // Neon Pink (GirlFanz default)
        secondary: '#00FFFF',
        background: '#000011',
        surface: '#111122',
        text: '#FFFFFF',
        accent: '#FF0040',
      },
      platform: 'GirlFanz',
    },
  });

  useEffect(() => {
    initializeApp();
    
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setAppState(nextAppState);
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const initializeApp = async () => {
    try {
      // Check for saved authentication
      const savedToken = await AsyncStorage.getItem('authToken');
      const savedUser = await AsyncStorage.getItem('currentUser');
      
      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }
      
      // Set up crash reporting with user context
      if (user) {
        await crashlytics().setUserId(user.id);
        await crashlytics().setAttributes({
          userType: user.type,
          platform: 'mobile',
        });
      }
      
    } catch (error) {
      console.error('App initialization failed:', error);
      await crashlytics().recordError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const result = await fanzService.login(email, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const handleLogout = async () => {
    await fanzService.logout();
    setUser(null);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000011" />
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>FANZ</Text>
          <Text style={styles.loadingSubtext}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Provider store={/* Redux store would go here */ {} as any}>
      <PersistGate loading={null} persistor={/* Redux persistor would go here */ {} as any}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#000011" />
          <NavigationContainer>
            {user ? (
              <Tab.Navigator
                screenOptions={{
                  tabBarStyle: styles.tabBar,
                  tabBarActiveTintColor: '#FF0080',
                  tabBarInactiveTintColor: '#666',
                  headerStyle: styles.header,
                  headerTintColor: '#FFFFFF',
                }}
              >
                <Tab.Screen name="Feed" component={FeedScreen} />
                <Tab.Screen name="Discover" component={DiscoverScreen} />
                <Tab.Screen name="Live" component={LiveStreamScreen} />
                <Tab.Screen name="NFTs" component={NFTScreen} />
                <Tab.Screen name="Profile" component={ProfileScreen} />
              </Tab.Navigator>
            ) : (
              <Stack.Navigator
                screenOptions={{
                  headerStyle: styles.header,
                  headerTintColor: '#FFFFFF',
                  cardStyle: styles.screen,
                }}
              >
                <Stack.Screen 
                  name="Welcome" 
                  component={WelcomeScreen} 
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
              </Stack.Navigator>
            )}
          </NavigationContainer>
        </SafeAreaView>
      </PersistGate>
    </Provider>
  );
};

// Placeholder screen components
const FeedScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Feed Screen</Text>
  </View>
);

const DiscoverScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Discover Screen</Text>
  </View>
);

const LiveStreamScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Live Stream Screen</Text>
  </View>
);

const NFTScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>NFT Marketplace Screen</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Profile Screen</Text>
  </View>
);

const WelcomeScreen = () => (
  <View style={styles.welcomeScreen}>
    <Text style={styles.welcomeTitle}>Welcome to FANZ</Text>
    <Text style={styles.welcomeSubtitle}>The Ultimate Creator Economy Platform</Text>
  </View>
);

const LoginScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Login Screen</Text>
  </View>
);

const RegisterScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Register Screen</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000011',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000011',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF0080',
    marginBottom: 10,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  tabBar: {
    backgroundColor: '#111122',
    borderTopColor: '#333',
    paddingBottom: Platform.OS === 'ios' ? 20 : 5,
  },
  header: {
    backgroundColor: '#111122',
    borderBottomColor: '#333',
  },
  screen: {
    flex: 1,
    backgroundColor: '#000011',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  welcomeScreen: {
    flex: 1,
    backgroundColor: '#000011',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF0080',
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default FanzMobileApp;