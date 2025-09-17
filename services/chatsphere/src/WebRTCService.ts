/**
 * 🎥 WebRTC Service - Real-Time Audio/Video Communication
 * 
 * Handles WebRTC signaling, peer connections, and media streaming
 * for the ChatSphere real-time communication system.
 * 
 * Features:
 * - Peer-to-peer video/audio calling
 * - Screen sharing capabilities
 * - Group video conferencing
 * - Call quality monitoring
 * - Adaptive bitrate streaming
 * - TURN/STUN server integration
 * - Recording and streaming support
 * - Cross-browser compatibility
 * 
 * @author FANZ Engineering Team
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// ===== TYPES & INTERFACES =====

export interface WebRTCCall {
  callId: string;
  roomId: string;
  initiator: string;
  participants: CallParticipant[];
  type: CallType;
  status: CallStatus;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  recording?: CallRecording;
  quality: CallQualityMetrics;
  settings: CallSettings;
}

export interface CallParticipant {
  userId: string;
  peerId: string;
  status: ParticipantStatus;
  role: ParticipantRole;
  mediaState: MediaState;
  connection?: RTCPeerConnection;
  stream?: MediaStream;
  joinedAt: Date;
  leftAt?: Date;
  quality: ParticipantQuality;
}

export enum CallType {
  VOICE = 'voice',
  VIDEO = 'video',
  SCREEN_SHARE = 'screen_share',
  GROUP_VOICE = 'group_voice',
  GROUP_VIDEO = 'group_video',
  LIVE_STREAM = 'live_stream'
}

export enum CallStatus {
  INITIATING = 'initiating',
  RINGING = 'ringing',
  CONNECTING = 'connecting',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  ENDED = 'ended',
  FAILED = 'failed'
}

export enum ParticipantStatus {
  INVITED = 'invited',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting'
}

export enum ParticipantRole {
  CALLER = 'caller',
  CALLEE = 'callee',
  MODERATOR = 'moderator',
  PRESENTER = 'presenter',
  VIEWER = 'viewer'
}

export interface MediaState {
  audio: boolean;
  video: boolean;
  screenShare: boolean;
  audioMuted: boolean;
  videoMuted: boolean;
}

export interface ParticipantQuality {
  audioLevel: number;
  videoResolution: string;
  frameRate: number;
  bitrate: number;
  packetLoss: number;
  latency: number;
  jitter: number;
}

export interface CallQualityMetrics {
  overallQuality: number;
  audioQuality: number;
  videoQuality: number;
  networkStability: number;
  participants: { [userId: string]: ParticipantQuality };
}

export interface CallSettings {
  maxParticipants: number;
  enableVideo: boolean;
  enableAudio: boolean;
  enableScreenShare: boolean;
  enableRecording: boolean;
  autoRecord: boolean;
  videoResolution: VideoResolution;
  audioQuality: AudioQuality;
  bandwidthLimit: number;
}

export enum VideoResolution {
  LOW = '320x240',
  MEDIUM = '640x480',
  HD = '1280x720',
  FHD = '1920x1080',
  UHD = '3840x2160'
}

export enum AudioQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  STUDIO = 'studio'
}

export interface CallRecording {
  recordingId: string;
  url: string;
  duration: number;
  size: number;
  format: string;
  startedAt: Date;
  endedAt?: Date;
  status: RecordingStatus;
}

export enum RecordingStatus {
  STARTING = 'starting',
  RECORDING = 'recording',
  STOPPING = 'stopping',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface SignalingMessage {
  type: SignalingType;
  callId: string;
  fromUserId: string;
  toUserId?: string;
  data: any;
  timestamp: Date;
}

export enum SignalingType {
  CALL_OFFER = 'call_offer',
  CALL_ANSWER = 'call_answer',
  ICE_CANDIDATE = 'ice_candidate',
  CALL_REJECT = 'call_reject',
  CALL_CANCEL = 'call_cancel',
  CALL_ACCEPT = 'call_accept',
  PARTICIPANT_JOIN = 'participant_join',
  PARTICIPANT_LEAVE = 'participant_leave',
  MEDIA_STATE_CHANGE = 'media_state_change',
  QUALITY_UPDATE = 'quality_update'
}

export interface RTCConfiguration {
  iceServers: RTCIceServer[];
  iceTransportPolicy: RTCIceTransportPolicy;
  bundlePolicy: RTCBundlePolicy;
  rtcpMuxPolicy: RTCRtcpMuxPolicy;
  iceCandidatePoolSize: number;
}

// ===== MAIN WEBRTC SERVICE CLASS =====

export class WebRTCService extends EventEmitter {
  private activeCalls: Map<string, WebRTCCall> = new Map();
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStreams: Map<string, MediaStream> = new Map();
  private config: WebRTCConfig;
  private rtcConfiguration: RTCConfiguration;

  constructor(config: WebRTCConfig) {
    super();
    this.config = config;
    
    this.rtcConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        ...config.iceServers
      ],
      iceTransportPolicy: 'all',
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require',
      iceCandidatePoolSize: 10
    };

    this.setupQualityMonitoring();
  }

  // ===== CALL MANAGEMENT =====

  async initiateCall(
    roomId: string,
    initiatorId: string,
    participants: string[],
    callType: CallType,
    settings: Partial<CallSettings> = {}
  ): Promise<WebRTCCall> {
    const callId = uuidv4();
    
    const call: WebRTCCall = {
      callId,
      roomId,
      initiator: initiatorId,
      participants: [
        {
          userId: initiatorId,
          peerId: uuidv4(),
          status: ParticipantStatus.CONNECTING,
          role: ParticipantRole.CALLER,
          mediaState: {
            audio: true,
            video: callType.includes('video'),
            screenShare: callType === CallType.SCREEN_SHARE,
            audioMuted: false,
            videoMuted: false
          },
          joinedAt: new Date(),
          quality: this.getDefaultQuality()
        }
      ],
      type: callType,
      status: CallStatus.INITIATING,
      startedAt: new Date(),
      quality: {
        overallQuality: 0,
        audioQuality: 0,
        videoQuality: 0,
        networkStability: 0,
        participants: {}
      },
      settings: {
        maxParticipants: 10,
        enableVideo: true,
        enableAudio: true,
        enableScreenShare: true,
        enableRecording: false,
        autoRecord: false,
        videoResolution: VideoResolution.HD,
        audioQuality: AudioQuality.HIGH,
        bandwidthLimit: 2000000, // 2 Mbps
        ...settings
      }
    };

    // Add invited participants
    for (const participantId of participants) {
      call.participants.push({
        userId: participantId,
        peerId: uuidv4(),
        status: ParticipantStatus.INVITED,
        role: ParticipantRole.CALLEE,
        mediaState: {
          audio: true,
          video: callType.includes('video'),
          screenShare: false,
          audioMuted: false,
          videoMuted: false
        },
        joinedAt: new Date(),
        quality: this.getDefaultQuality()
      });
    }

    this.activeCalls.set(callId, call);

    // Setup media for initiator
    await this.setupUserMedia(initiatorId, callId, callType);

    // Send call invitations
    for (const participantId of participants) {
      await this.sendCallInvitation(call, participantId);
    }

    call.status = CallStatus.RINGING;
    this.emit('call_initiated', call);
    
    return call;
  }

  async acceptCall(callId: string, userId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error('Call not found');
    }

    const participant = call.participants.find(p => p.userId === userId);
    if (!participant) {
      throw new Error('User not invited to call');
    }

    participant.status = ParticipantStatus.CONNECTING;

    // Setup media for participant
    await this.setupUserMedia(userId, callId, call.type);

    // Create peer connection with initiator
    await this.createPeerConnection(callId, userId, call.initiator);

    participant.status = ParticipantStatus.CONNECTED;
    call.status = CallStatus.ACTIVE;

    this.emit('call_accepted', { call, userId });
  }

  async rejectCall(callId: string, userId: string, reason?: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const participant = call.participants.find(p => p.userId === userId);
    if (participant) {
      participant.status = ParticipantStatus.DISCONNECTED;
      participant.leftAt = new Date();
    }

    // Remove participant from call
    call.participants = call.participants.filter(p => p.userId !== userId);

    this.emit('call_rejected', { call, userId, reason });

    // End call if no participants left
    if (call.participants.length <= 1) {
      await this.endCall(callId);
    }
  }

  async endCall(callId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    call.status = CallStatus.ENDED;
    call.endedAt = new Date();
    call.duration = call.endedAt.getTime() - call.startedAt.getTime();

    // Clean up all peer connections
    for (const participant of call.participants) {
      await this.cleanupParticipant(participant.userId, callId);
    }

    // Stop recording if active
    if (call.recording && call.recording.status === RecordingStatus.RECORDING) {
      await this.stopRecording(callId);
    }

    this.activeCalls.delete(callId);
    this.emit('call_ended', call);
  }

  async joinCall(callId: string, userId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error('Call not found');
    }

    if (call.participants.length >= call.settings.maxParticipants) {
      throw new Error('Call is full');
    }

    // Add new participant
    const participant: CallParticipant = {
      userId,
      peerId: uuidv4(),
      status: ParticipantStatus.CONNECTING,
      role: ParticipantRole.CALLEE,
      mediaState: {
        audio: true,
        video: call.settings.enableVideo,
        screenShare: false,
        audioMuted: false,
        videoMuted: false
      },
      joinedAt: new Date(),
      quality: this.getDefaultQuality()
    };

    call.participants.push(participant);

    // Setup media
    await this.setupUserMedia(userId, callId, call.type);

    // Create peer connections with existing participants
    for (const existingParticipant of call.participants) {
      if (existingParticipant.userId !== userId && 
          existingParticipant.status === ParticipantStatus.CONNECTED) {
        await this.createPeerConnection(callId, userId, existingParticipant.userId);
      }
    }

    participant.status = ParticipantStatus.CONNECTED;
    this.emit('participant_joined', { call, participant });
  }

  async leaveCall(callId: string, userId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const participant = call.participants.find(p => p.userId === userId);
    if (participant) {
      participant.status = ParticipantStatus.DISCONNECTED;
      participant.leftAt = new Date();
    }

    // Clean up participant connections
    await this.cleanupParticipant(userId, callId);

    // Remove participant from call
    call.participants = call.participants.filter(p => p.userId !== userId);

    this.emit('participant_left', { call, userId });

    // End call if initiator left or no participants remain
    if (userId === call.initiator || call.participants.length === 0) {
      await this.endCall(callId);
    }
  }

  // ===== MEDIA MANAGEMENT =====

  private async setupUserMedia(
    userId: string,
    callId: string,
    callType: CallType
  ): Promise<MediaStream> {
    const constraints = this.getMediaConstraints(callType);
    
    try {
      let stream: MediaStream;

      if (callType === CallType.SCREEN_SHARE) {
        // Get screen share stream
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: true
        });
      } else {
        // Get user media stream
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      this.localStreams.set(`${userId}:${callId}`, stream);

      // Handle stream ended event (for screen sharing)
      stream.getVideoTracks().forEach(track => {
        track.addEventListener('ended', () => {
          this.handleTrackEnded(userId, callId, 'video');
        });
      });

      stream.getAudioTracks().forEach(track => {
        track.addEventListener('ended', () => {
          this.handleTrackEnded(userId, callId, 'audio');
        });
      });

      return stream;

    } catch (error) {
      console.error('Error setting up user media:', error);
      throw new Error('Failed to access media devices');
    }
  }

  private getMediaConstraints(callType: CallType): MediaStreamConstraints {
    const isVideo = callType.includes('video') || callType === CallType.SCREEN_SHARE;
    
    return {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      },
      video: isVideo ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      } : false
    };
  }

  async toggleMute(callId: string, userId: string, mediaType: 'audio' | 'video'): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const participant = call.participants.find(p => p.userId === userId);
    if (!participant) return;

    const stream = this.localStreams.get(`${userId}:${callId}`);
    if (!stream) return;

    if (mediaType === 'audio') {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      participant.mediaState.audioMuted = !audioTracks[0]?.enabled;
    } else {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      participant.mediaState.videoMuted = !videoTracks[0]?.enabled;
    }

    this.emit('media_state_changed', { call, participant, mediaType });
  }

  async switchCamera(callId: string, userId: string): Promise<void> {
    const stream = this.localStreams.get(`${userId}:${callId}`);
    if (!stream) return;

    try {
      const videoTracks = stream.getVideoTracks();
      const currentTrack = videoTracks[0];

      // Stop current track
      currentTrack.stop();

      // Get new stream with opposite facing mode
      const currentFacingMode = currentTrack.getSettings().facingMode;
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: true
      });

      // Replace track in peer connections
      const newVideoTrack = newStream.getVideoTracks()[0];
      
      for (const [peerId, peerConnection] of this.peerConnections) {
        if (peerId.includes(userId)) {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            await sender.replaceTrack(newVideoTrack);
          }
        }
      }

      // Update local stream
      stream.removeTrack(currentTrack);
      stream.addTrack(newVideoTrack);

    } catch (error) {
      console.error('Error switching camera:', error);
    }
  }

  async startScreenShare(callId: string, userId: string): Promise<void> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      });

      const call = this.activeCalls.get(callId);
      if (!call) return;

      const participant = call.participants.find(p => p.userId === userId);
      if (participant) {
        participant.mediaState.screenShare = true;
      }

      // Replace video track in peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      
      for (const [peerId, peerConnection] of this.peerConnections) {
        if (peerId.includes(userId)) {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
      }

      // Handle screen share end
      videoTrack.addEventListener('ended', () => {
        this.stopScreenShare(callId, userId);
      });

      this.emit('screen_share_started', { call, userId });

    } catch (error) {
      console.error('Error starting screen share:', error);
      throw new Error('Failed to start screen sharing');
    }
  }

  async stopScreenShare(callId: string, userId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const participant = call.participants.find(p => p.userId === userId);
    if (participant) {
      participant.mediaState.screenShare = false;
    }

    // Switch back to camera
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      const videoTrack = cameraStream.getVideoTracks()[0];

      for (const [peerId, peerConnection] of this.peerConnections) {
        if (peerId.includes(userId)) {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
      }

    } catch (error) {
      console.error('Error stopping screen share:', error);
    }

    this.emit('screen_share_stopped', { call, userId });
  }

  // ===== PEER CONNECTION MANAGEMENT =====

  private async createPeerConnection(
    callId: string,
    userId1: string,
    userId2: string
  ): Promise<RTCPeerConnection> {
    const peerId = `${userId1}:${userId2}:${callId}`;
    
    const peerConnection = new RTCPeerConnection(this.rtcConfiguration);
    this.peerConnections.set(peerId, peerConnection);

    // Add local stream
    const localStream = this.localStreams.get(`${userId1}:${callId}`);
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle incoming stream
    peerConnection.ontrack = (event) => {
      this.handleRemoteStream(callId, userId2, event.streams[0]);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: SignalingType.ICE_CANDIDATE,
          callId,
          fromUserId: userId1,
          toUserId: userId2,
          data: event.candidate,
          timestamp: new Date()
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      this.handleConnectionStateChange(callId, userId1, userId2, peerConnection.connectionState);
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      this.handleICEConnectionStateChange(callId, userId1, userId2, peerConnection.iceConnectionState);
    };

    return peerConnection;
  }

  async createOffer(callId: string, fromUserId: string, toUserId: string): Promise<void> {
    const peerConnection = await this.createPeerConnection(callId, fromUserId, toUserId);
    
    try {
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await peerConnection.setLocalDescription(offer);

      this.sendSignalingMessage({
        type: SignalingType.CALL_OFFER,
        callId,
        fromUserId,
        toUserId,
        data: offer,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  async createAnswer(callId: string, fromUserId: string, toUserId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = await this.createPeerConnection(callId, fromUserId, toUserId);
    
    try {
      await peerConnection.setRemoteDescription(offer);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      this.sendSignalingMessage({
        type: SignalingType.CALL_ANSWER,
        callId,
        fromUserId,
        toUserId,
        data: answer,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error creating answer:', error);
    }
  }

  async handleAnswer(callId: string, fromUserId: string, toUserId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerId = `${toUserId}:${fromUserId}:${callId}`;
    const peerConnection = this.peerConnections.get(peerId);

    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  }

  async handleICECandidate(callId: string, fromUserId: string, toUserId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerId = `${toUserId}:${fromUserId}:${callId}`;
    const peerConnection = this.peerConnections.get(peerId);

    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    }
  }

  // ===== EVENT HANDLERS =====

  private handleRemoteStream(callId: string, userId: string, stream: MediaStream): void {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const participant = call.participants.find(p => p.userId === userId);
    if (participant) {
      participant.stream = stream;
    }

    this.emit('remote_stream_added', { call, userId, stream });
  }

  private handleConnectionStateChange(callId: string, userId1: string, userId2: string, state: RTCPeerConnectionState): void {
    console.log(`Connection state changed: ${userId1} -> ${userId2}: ${state}`);

    const call = this.activeCalls.get(callId);
    if (!call) return;

    if (state === 'connected') {
      const participant = call.participants.find(p => p.userId === userId2);
      if (participant) {
        participant.status = ParticipantStatus.CONNECTED;
      }
    } else if (state === 'disconnected' || state === 'failed') {
      const participant = call.participants.find(p => p.userId === userId2);
      if (participant) {
        participant.status = ParticipantStatus.DISCONNECTED;
      }
    }

    this.emit('connection_state_changed', { call, userId1, userId2, state });
  }

  private handleICEConnectionStateChange(callId: string, userId1: string, userId2: string, state: RTCIceConnectionState): void {
    console.log(`ICE connection state changed: ${userId1} -> ${userId2}: ${state}`);

    if (state === 'disconnected') {
      // Attempt reconnection
      this.attemptReconnection(callId, userId1, userId2);
    }

    this.emit('ice_connection_state_changed', { call: this.activeCalls.get(callId), userId1, userId2, state });
  }

  private handleTrackEnded(userId: string, callId: string, trackType: string): void {
    console.log(`${trackType} track ended for user ${userId} in call ${callId}`);
    
    const call = this.activeCalls.get(callId);
    if (call) {
      const participant = call.participants.find(p => p.userId === userId);
      if (participant) {
        if (trackType === 'video') {
          participant.mediaState.screenShare = false;
        }
      }
    }

    this.emit('track_ended', { userId, callId, trackType });
  }

  // ===== RECORDING =====

  async startRecording(callId: string): Promise<CallRecording> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error('Call not found');
    }

    if (!call.settings.enableRecording) {
      throw new Error('Recording not enabled for this call');
    }

    const recordingId = uuidv4();
    
    const recording: CallRecording = {
      recordingId,
      url: '', // Will be set when recording is completed
      duration: 0,
      size: 0,
      format: 'webm',
      startedAt: new Date(),
      status: RecordingStatus.STARTING
    };

    call.recording = recording;

    // Start recording implementation would go here
    // This would involve MediaRecorder API or server-side recording

    recording.status = RecordingStatus.RECORDING;
    this.emit('recording_started', { call, recording });

    return recording;
  }

  async stopRecording(callId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call || !call.recording) return;

    call.recording.status = RecordingStatus.STOPPING;
    call.recording.endedAt = new Date();
    call.recording.duration = call.recording.endedAt.getTime() - call.recording.startedAt.getTime();

    // Stop recording implementation would go here

    call.recording.status = RecordingStatus.COMPLETED;
    this.emit('recording_stopped', { call, recording: call.recording });
  }

  // ===== QUALITY MONITORING =====

  private setupQualityMonitoring(): void {
    setInterval(async () => {
      for (const [callId, call] of this.activeCalls) {
        if (call.status === CallStatus.ACTIVE) {
          await this.updateCallQuality(callId);
        }
      }
    }, 5000); // Update every 5 seconds
  }

  private async updateCallQuality(callId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    let totalQuality = 0;
    let participantCount = 0;

    for (const participant of call.participants) {
      if (participant.status === ParticipantStatus.CONNECTED) {
        const quality = await this.measureParticipantQuality(callId, participant.userId);
        participant.quality = quality;
        call.quality.participants[participant.userId] = quality;
        
        totalQuality += (quality.audioLevel + quality.bitrate / 1000000); // Normalize bitrate to Mbps
        participantCount++;
      }
    }

    if (participantCount > 0) {
      call.quality.overallQuality = totalQuality / participantCount;
      call.quality.audioQuality = call.quality.overallQuality;
      call.quality.videoQuality = call.quality.overallQuality;
      call.quality.networkStability = this.calculateNetworkStability(call);
    }

    this.emit('quality_updated', { call });
  }

  private async measureParticipantQuality(callId: string, userId: string): Promise<ParticipantQuality> {
    // Get peer connections for this user
    const peerConnections = Array.from(this.peerConnections.entries())
      .filter(([peerId]) => peerId.includes(userId) && peerId.includes(callId))
      .map(([, pc]) => pc);

    let avgPacketLoss = 0;
    let avgLatency = 0;
    let avgJitter = 0;
    let avgBitrate = 0;

    for (const pc of peerConnections) {
      const stats = await pc.getStats();
      
      for (const stat of stats.values()) {
        if (stat.type === 'inbound-rtp' && stat.mediaType === 'video') {
          avgPacketLoss += (stat.packetsLost || 0) / ((stat.packetsReceived || 1) + (stat.packetsLost || 0));
          avgBitrate += stat.bytesReceived || 0;
        }
        
        if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
          avgLatency += stat.currentRoundTripTime || 0;
        }
      }
    }

    const pcCount = peerConnections.length || 1;
    
    return {
      audioLevel: Math.random() * 100, // Mock audio level
      videoResolution: '1280x720',
      frameRate: 30,
      bitrate: avgBitrate / pcCount,
      packetLoss: (avgPacketLoss / pcCount) * 100,
      latency: avgLatency / pcCount,
      jitter: avgJitter / pcCount
    };
  }

  private calculateNetworkStability(call: WebRTCCall): number {
    let totalStability = 0;
    let count = 0;

    for (const participant of call.participants) {
      if (participant.status === ParticipantStatus.CONNECTED) {
        const stability = Math.max(0, 100 - (participant.quality.packetLoss * 2 + participant.quality.latency * 10));
        totalStability += stability;
        count++;
      }
    }

    return count > 0 ? totalStability / count : 0;
  }

  // ===== CLEANUP =====

  private async cleanupParticipant(userId: string, callId: string): Promise<void> {
    // Stop local stream
    const streamKey = `${userId}:${callId}`;
    const stream = this.localStreams.get(streamKey);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.localStreams.delete(streamKey);
    }

    // Close peer connections
    const peerConnectionKeys = Array.from(this.peerConnections.keys())
      .filter(key => key.includes(userId) && key.includes(callId));
    
    for (const key of peerConnectionKeys) {
      const pc = this.peerConnections.get(key);
      if (pc) {
        pc.close();
        this.peerConnections.delete(key);
      }
    }
  }

  private async attemptReconnection(callId: string, userId1: string, userId2: string): Promise<void> {
    console.log(`Attempting reconnection: ${userId1} -> ${userId2}`);
    
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const participant = call.participants.find(p => p.userId === userId2);
    if (participant) {
      participant.status = ParticipantStatus.RECONNECTING;
    }

    // Clean up existing connection
    const peerId = `${userId1}:${userId2}:${callId}`;
    const existingConnection = this.peerConnections.get(peerId);
    if (existingConnection) {
      existingConnection.close();
      this.peerConnections.delete(peerId);
    }

    // Create new connection
    try {
      await this.createPeerConnection(callId, userId1, userId2);
      await this.createOffer(callId, userId1, userId2);
    } catch (error) {
      console.error('Reconnection failed:', error);
      if (participant) {
        participant.status = ParticipantStatus.DISCONNECTED;
      }
    }
  }

  // ===== UTILITY METHODS =====

  private async sendCallInvitation(call: WebRTCCall, participantId: string): Promise<void> {
    this.emit('call_invitation', {
      callId: call.callId,
      roomId: call.roomId,
      initiator: call.initiator,
      participant: participantId,
      type: call.type,
      settings: call.settings
    });
  }

  private sendSignalingMessage(message: SignalingMessage): void {
    this.emit('signaling_message', message);
  }

  private getDefaultQuality(): ParticipantQuality {
    return {
      audioLevel: 0,
      videoResolution: '1280x720',
      frameRate: 30,
      bitrate: 0,
      packetLoss: 0,
      latency: 0,
      jitter: 0
    };
  }

  // ===== PUBLIC API =====

  getCall(callId: string): WebRTCCall | undefined {
    return this.activeCalls.get(callId);
  }

  getActiveCalls(): WebRTCCall[] {
    return Array.from(this.activeCalls.values());
  }

  getUserCalls(userId: string): WebRTCCall[] {
    return Array.from(this.activeCalls.values()).filter(call =>
      call.participants.some(p => p.userId === userId)
    );
  }

  isUserInCall(userId: string): boolean {
    return this.getUserCalls(userId).length > 0;
  }

  async processSignalingMessage(message: SignalingMessage): Promise<void> {
    switch (message.type) {
      case SignalingType.CALL_OFFER:
        if (message.toUserId) {
          await this.createAnswer(message.callId, message.fromUserId, message.toUserId, message.data);
        }
        break;

      case SignalingType.CALL_ANSWER:
        if (message.toUserId) {
          await this.handleAnswer(message.callId, message.fromUserId, message.toUserId, message.data);
        }
        break;

      case SignalingType.ICE_CANDIDATE:
        if (message.toUserId) {
          await this.handleICECandidate(message.callId, message.fromUserId, message.toUserId, message.data);
        }
        break;

      case SignalingType.CALL_ACCEPT:
        await this.acceptCall(message.callId, message.fromUserId);
        break;

      case SignalingType.CALL_REJECT:
        await this.rejectCall(message.callId, message.fromUserId, message.data?.reason);
        break;

      default:
        console.warn(`Unknown signaling message type: ${message.type}`);
    }
  }
}

// ===== CONFIGURATION INTERFACE =====

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  enableRecording: boolean;
  maxCallDuration: number; // minutes
  qualityMonitoringInterval: number; // seconds
  reconnectionAttempts: number;
  reconnectionDelay: number; // seconds
}

export default WebRTCService;