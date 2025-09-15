/**
 * 📱 Advanced Live Stream Screen - FANZ Mobile
 * Real-time streaming with WebRTC, chat, tips, and interactive features
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Animated,
  PanResponder,
  Modal,
  Dimensions,
  StyleSheet
} from 'react-native';
import { RTCView, RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices } from 'react-native-webrtc';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import { BlurView } from '@react-native-blur/blur';

const { width, height } = Dimensions.get('window');

interface LiveStream {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  title: string;
  description: string;
  category: string;
  viewerCount: number;
  isLive: boolean;
  startedAt: string;
  price?: number;
  isSubscriptionRequired: boolean;
  platform: string;
  tags: string[];
  chatEnabled: boolean;
  tipsEnabled: boolean;
  qualityOptions: ('144p' | '240p' | '360p' | '480p' | '720p' | '1080p')[];
  currentQuality: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: string;
  type: 'message' | 'tip' | 'subscription' | 'system';
  tipAmount?: number;
  isCreator?: boolean;
  isModerator?: boolean;
}

interface TipOption {
  amount: number;
  emoji: string;
  label: string;
  color: string;
}

interface StreamSettings {
  quality: string;
  volume: number;
  chatVisible: boolean;
  fullScreen: boolean;
  nightMode: boolean;
}

export const AdvancedLiveStreamScreen: React.FC<{ streamId?: string }> = ({ streamId }) => {
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [settings, setSettings] = useState<StreamSettings>({
    quality: '720p',
    volume: 100,
    chatVisible: true,
    fullScreen: false,
    nightMode: false
  });
  const [showTipModal, setShowTipModal] = useState(false);
  const [selectedTipAmount, setSelectedTipAmount] = useState<number | null>(null);
  const [customTipAmount, setCustomTipAmount] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('good');

  const remoteStreamRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const chatScrollRef = useRef<ScrollView>(null);

  // Animation values
  const [chatOpacity] = useState(new Animated.Value(1));
  const [controlsOpacity] = useState(new Animated.Value(1));
  const [tipAnimations] = useState(new Map<string, Animated.Value>());

  const tipOptions: TipOption[] = [
    { amount: 5, emoji: '❤️', label: 'Love', color: '#ff69b4' },
    { amount: 10, emoji: '🔥', label: 'Fire', color: '#ff6b6b' },
    { amount: 25, emoji: '💎', label: 'Diamond', color: '#00d4ff' },
    { amount: 50, emoji: '👑', label: 'Crown', color: '#ffd700' },
    { amount: 100, emoji: '🚀', label: 'Rocket', color: '#9b59b6' },
    { amount: 0, emoji: '💰', label: 'Custom', color: '#4ecdc4' }
  ];

  useEffect(() => {
    if (streamId) {
      initializeStream();
      setupWebRTC();
    }

    return () => {
      cleanup();
    };
  }, [streamId]);

  const initializeStream = async () => {
    try {
      // Mock stream data - in real app, fetch from API
      const mockStream: LiveStream = {
        id: streamId || 'stream-1',
        creatorId: 'creator-1',
        creatorName: 'Amazing Creator',
        creatorAvatar: 'https://picsum.photos/100/100?random=1',
        title: 'Live Streaming Session 🔥',
        description: 'Welcome to my amazing live stream! Come chat and have fun!',
        category: 'Entertainment',
        viewerCount: Math.floor(Math.random() * 5000) + 100,
        isLive: true,
        startedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        price: Math.random() > 0.5 ? Math.floor(Math.random() * 50) + 10 : undefined,
        isSubscriptionRequired: Math.random() > 0.6,
        platform: 'FanzLab',
        tags: ['live', 'entertainment', 'creator'],
        chatEnabled: true,
        tipsEnabled: true,
        qualityOptions: ['360p', '480p', '720p', '1080p'],
        currentQuality: '720p'
      };

      setStream(mockStream);
      setIsConnecting(false);

      // Load initial chat messages
      loadChatMessages();

    } catch (error) {
      console.error('Failed to initialize stream:', error);
      Alert.alert('Error', 'Failed to load stream');
    }
  };

  const setupWebRTC = async () => {
    try {
      // Initialize peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // Add TURN servers for production
        ],
      };

      peerConnectionRef.current = new RTCPeerConnection(configuration);

      // Handle remote stream
      peerConnectionRef.current.onaddstream = (event) => {
        remoteStreamRef.current = event.stream;
      };

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to remote peer via signaling server
          console.log('ICE candidate:', event.candidate);
        }
      };

      // Handle connection state changes
      peerConnectionRef.current.onconnectionstatechange = () => {
        const state = peerConnectionRef.current?.connectionState;
        console.log('Connection state:', state);
        
        if (state === 'connected') {
          setConnectionQuality('excellent');
        } else if (state === 'connecting') {
          setConnectionQuality('good');
        } else if (state === 'failed') {
          setConnectionQuality('poor');
        }
      };

      console.log('WebRTC setup completed');

    } catch (error) {
      console.error('WebRTC setup failed:', error);
    }
  };

  const loadChatMessages = () => {
    // Mock chat messages
    const mockMessages: ChatMessage[] = Array.from({ length: 50 }, (_, index) => ({
      id: `msg-${index}`,
      userId: `user-${index % 10}`,
      username: `User${index % 10 + 1}`,
      avatar: `https://picsum.photos/40/40?random=${index % 10}`,
      message: [
        'Great stream! 🔥',
        'Amazing content!',
        'Love this! ❤️',
        'Keep it up!',
        'So talented! 💎',
        'This is awesome!',
        'Perfect quality! 👌',
        'More please! 🚀'
      ][index % 8],
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      type: Math.random() > 0.1 ? 'message' : 'tip',
      tipAmount: Math.random() > 0.1 ? undefined : Math.floor(Math.random() * 100) + 5,
      isCreator: index % 20 === 0,
      isModerator: index % 15 === 0
    }));

    setChatMessages(mockMessages);
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !stream) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: 'current-user',
      username: 'You',
      avatar: 'https://picsum.photos/40/40?random=current',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'message',
      isCreator: false,
      isModerator: false
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate API call to send message
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendTip = async (amount: number, message?: string) => {
    if (!stream) return;

    try {
      // Create tip animation
      const animValue = new Animated.Value(0);
      const tipId = `tip-${Date.now()}`;
      tipAnimations.set(tipId, animValue);

      // Add tip to chat
      const tipMessage: ChatMessage = {
        id: `tip-${Date.now()}`,
        userId: 'current-user',
        username: 'You',
        avatar: 'https://picsum.photos/40/40?random=current',
        message: message || `Sent $${amount} tip! 💰`,
        timestamp: new Date().toISOString(),
        type: 'tip',
        tipAmount: amount,
        isCreator: false,
        isModerator: false
      };

      setChatMessages(prev => [...prev, tipMessage]);

      // Animate tip effect
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        tipAnimations.delete(tipId);
      });

      setShowTipModal(false);
      setSelectedTipAmount(null);
      setCustomTipAmount('');

      Alert.alert('Success', `Tip of $${amount} sent successfully!`);

    } catch (error) {
      console.error('Failed to send tip:', error);
      Alert.alert('Error', 'Failed to send tip');
    }
  };

  const toggleFullScreen = () => {
    setSettings(prev => ({ ...prev, fullScreen: !prev.fullScreen }));
    
    // Hide/show controls and chat
    Animated.parallel([
      Animated.timing(controlsOpacity, {
        toValue: settings.fullScreen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(chatOpacity, {
        toValue: settings.fullScreen && settings.chatVisible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleChat = () => {
    setSettings(prev => ({ ...prev, chatVisible: !prev.chatVisible }));
    
    Animated.timing(chatOpacity, {
      toValue: settings.chatVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const changeQuality = (quality: string) => {
    setSettings(prev => ({ ...prev, quality }));
    // In real app, change stream quality via WebRTC
    Alert.alert('Quality Changed', `Stream quality set to ${quality}`);
  };

  const cleanup = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const renderStreamInfo = () => (
    <LinearGradient
      colors={['rgba(0,0,0,0.8)', 'transparent']}
      style={styles.streamInfoOverlay}
    >
      <View style={styles.streamInfo}>
        <View style={styles.creatorInfo}>
          <FastImage
            source={{ uri: stream?.creatorAvatar }}
            style={styles.creatorAvatar}
          />
          <View style={styles.creatorDetails}>
            <Text style={styles.creatorName}>{stream?.creatorName}</Text>
            <Text style={styles.streamTitle}>{stream?.title}</Text>
          </View>
        </View>

        <View style={styles.streamStats}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statValue}>{stream?.viewerCount}</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: '#e74c3c' }]}>
            <Text style={styles.liveText}>🔴 LIVE</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  const renderControls = () => (
    <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.controlsBackground}
      >
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleChat}>
            <Text style={styles.controlIcon}>💬</Text>
            <Text style={styles.controlLabel}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={() => setShowTipModal(true)}>
            <Text style={styles.controlIcon}>💰</Text>
            <Text style={styles.controlLabel}>Tip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>📤</Text>
            <Text style={styles.controlLabel}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>⚙️</Text>
            <Text style={styles.controlLabel}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleFullScreen}>
            <Text style={styles.controlIcon}>
              {settings.fullScreen ? '↙️' : '↗️'}
            </Text>
            <Text style={styles.controlLabel}>
              {settings.fullScreen ? 'Exit' : 'Full'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderChat = () => (
    <Animated.View style={[styles.chatContainer, { opacity: chatOpacity }]}>
      <BlurView style={styles.chatBackground} blurType="dark" blurAmount={10}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>Chat ({chatMessages.length})</Text>
          <TouchableOpacity onPress={toggleChat}>
            <Text style={styles.chatCloseIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={chatScrollRef}
          style={styles.chatMessages}
          showsVerticalScrollIndicator={false}
        >
          {chatMessages.map((message) => (
            <View key={message.id} style={styles.chatMessage}>
              <FastImage
                source={{ uri: message.avatar }}
                style={styles.messageAvatar}
              />
              <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                  <Text style={[
                    styles.messageUsername,
                    message.isCreator && { color: '#ffd700' },
                    message.isModerator && { color: '#00d4ff' }
                  ]}>
                    {message.username}
                    {message.isCreator && ' 👑'}
                    {message.isModerator && ' ⭐'}
                  </Text>
                  {message.tipAmount && (
                    <Text style={styles.tipBadge}>${message.tipAmount}</Text>
                  )}
                </View>
                <Text style={styles.messageText}>{message.message}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.chatInput}>
          <TextInput
            style={styles.messageInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#8892b0"
            multiline
            maxLength={200}
          />
          <TouchableOpacity
            style={[styles.sendButton, { opacity: newMessage.trim() ? 1 : 0.5 }]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Text style={styles.sendIcon}>📤</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );

  const renderTipModal = () => (
    <Modal
      visible={showTipModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTipModal(false)}
    >
      <View style={styles.modalOverlay}>
        <BlurView style={styles.modalBackground} blurType="dark" blurAmount={10}>
          <View style={styles.tipModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Tip 💰</Text>
              <TouchableOpacity onPress={() => setShowTipModal(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tipOptions}>
              {tipOptions.map((option) => (
                <TouchableOpacity
                  key={option.amount}
                  style={[
                    styles.tipOption,
                    { borderColor: option.color },
                    selectedTipAmount === option.amount && { backgroundColor: option.color + '20' }
                  ]}
                  onPress={() => {
                    if (option.amount === 0) {
                      setSelectedTipAmount(0);
                    } else {
                      setSelectedTipAmount(option.amount);
                      sendTip(option.amount);
                    }
                  }}
                >
                  <Text style={styles.tipEmoji}>{option.emoji}</Text>
                  <Text style={[styles.tipLabel, { color: option.color }]}>
                    {option.amount === 0 ? 'Custom' : `$${option.amount}`}
                  </Text>
                  <Text style={styles.tipDescription}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedTipAmount === 0 && (
              <View style={styles.customTipContainer}>
                <TextInput
                  style={styles.customTipInput}
                  value={customTipAmount}
                  onChangeText={setCustomTipAmount}
                  placeholder="Enter custom amount..."
                  placeholderTextColor="#8892b0"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.customTipButton}
                  onPress={() => {
                    const amount = parseFloat(customTipAmount);
                    if (amount > 0) {
                      sendTip(amount);
                    }
                  }}
                >
                  <Text style={styles.customTipButtonText}>Send Tip</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </BlurView>
      </View>
    </Modal>
  );

  if (isConnecting || !stream) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Connecting to stream...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Video Stream */}
      <View style={styles.videoContainer}>
        {remoteStreamRef.current ? (
          <RTCView
            streamURL={remoteStreamRef.current.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.placeholderText}>📹 Live Stream</Text>
            <Text style={styles.placeholderSubtext}>Connecting...</Text>
          </View>
        )}

        {/* Stream Info Overlay */}
        {renderStreamInfo()}

        {/* Controls Overlay */}
        {renderControls()}

        {/* Connection Quality Indicator */}
        <View style={[
          styles.qualityIndicator,
          { backgroundColor: connectionQuality === 'excellent' ? '#4caf50' : connectionQuality === 'good' ? '#ff9800' : '#f44336' }
        ]}>
          <Text style={styles.qualityText}>
            {connectionQuality === 'excellent' ? '●●●' : connectionQuality === 'good' ? '●●○' : '●○○'}
          </Text>
        </View>

        {/* Tip Animations */}
        {Array.from(tipAnimations.entries()).map(([id, animValue]) => (
          <Animated.View
            key={id}
            style={[
              styles.tipAnimation,
              {
                opacity: animValue,
                transform: [
                  {
                    translateY: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -100],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.tipAnimationText}>💰 +$</Text>
          </Animated.View>
        ))}
      </View>

      {/* Chat */}
      {settings.chatVisible && renderChat()}

      {/* Tip Modal */}
      {renderTipModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 18,
    color: '#ccd6f6'
  },
  videoContainer: {
    flex: 1,
    position: 'relative'
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#000'
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e'
  },
  placeholderText: {
    fontSize: 24,
    color: '#ccd6f6',
    marginBottom: 8
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#8892b0'
  },
  streamInfoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 16
  },
  streamInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#00d4ff'
  },
  creatorDetails: {
    flex: 1
  },
  creatorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2
  },
  streamTitle: {
    fontSize: 14,
    color: '#ccd6f6'
  },
  streamStats: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8
  },
  statIcon: {
    fontSize: 12,
    marginRight: 4
  },
  statValue: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600'
  },
  liveText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold'
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  controlsBackground: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 20
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  controlButton: {
    alignItems: 'center',
    minWidth: 60
  },
  controlIcon: {
    fontSize: 20,
    marginBottom: 4
  },
  controlLabel: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600'
  },
  qualityIndicator: {
    position: 'absolute',
    top: 60,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  qualityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  },
  tipAnimation: {
    position: 'absolute',
    top: height / 2,
    left: width / 2,
    transform: [{ translateX: -50 }]
  },
  tipAnimationText: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  chatContainer: {
    position: 'absolute',
    right: 16,
    top: 100,
    bottom: 150,
    width: width * 0.6,
    maxWidth: 300
  },
  chatBackground: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden'
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white'
  },
  chatCloseIcon: {
    fontSize: 18,
    color: '#8892b0'
  },
  chatMessages: {
    flex: 1,
    paddingHorizontal: 12
  },
  chatMessage: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-start'
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    marginTop: 2
  },
  messageContent: {
    flex: 1
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  messageUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ccd6f6',
    marginRight: 8
  },
  tipBadge: {
    fontSize: 10,
    color: 'white',
    backgroundColor: '#4caf50',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: 'bold'
  },
  messageText: {
    fontSize: 12,
    color: 'white',
    lineHeight: 16
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)'
  },
  messageInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    color: 'white',
    fontSize: 14,
    maxHeight: 80
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00d4ff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendIcon: {
    fontSize: 16
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  tipModal: {
    backgroundColor: 'rgba(22, 33, 62, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.7
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white'
  },
  modalCloseIcon: {
    fontSize: 20,
    color: '#8892b0'
  },
  tipOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  tipOption: {
    width: '30%',
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  tipEmoji: {
    fontSize: 24,
    marginBottom: 4
  },
  tipLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2
  },
  tipDescription: {
    fontSize: 12,
    color: '#8892b0'
  },
  customTipContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  customTipInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    color: 'white',
    fontSize: 16
  },
  customTipButton: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12
  },
  customTipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default AdvancedLiveStreamScreen;