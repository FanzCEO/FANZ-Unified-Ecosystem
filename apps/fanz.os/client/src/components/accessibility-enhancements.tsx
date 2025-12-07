
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Type, 
  Contrast, 
  MousePointer,
  Keyboard,
  Mic,
  MessageCircle
} from "lucide-react";

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  voiceNav: boolean;
  screenReader: boolean;
  keyboardNav: boolean;
  subtitles: boolean;
  audioDescription: boolean;
  fontSize: number;
  colorBlindSupport: boolean;
}

export function AccessibilityToolbar() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    voiceNav: false,
    screenReader: false,
    keyboardNav: true,
    subtitles: false,
    audioDescription: false,
    fontSize: 16,
    colorBlindSupport: false
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Apply accessibility settings to document
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
    
    if (settings.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    if (settings.reducedMotion) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }

    if (settings.colorBlindSupport) {
      document.body.classList.add('colorblind-support');
    } else {
      document.body.classList.remove('colorblind-support');
    }
  }, [settings]);

  const updateSetting = (key: keyof AccessibilitySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-3 bg-blue-600 hover:bg-blue-700"
        aria-label="Open accessibility options"
      >
        <Eye className="w-5 h-5" />
      </Button>

      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Accessibility Options</h3>
            
            <div className="space-y-4">
              {/* Visual Adjustments */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Visual</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white">High Contrast</label>
                    <Switch
                      checked={settings.highContrast}
                      onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white">Large Text</label>
                    <Switch
                      checked={settings.largeText}
                      onCheckedChange={(checked) => updateSetting('largeText', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white">Colorblind Support</label>
                    <Switch
                      checked={settings.colorBlindSupport}
                      onCheckedChange={(checked) => updateSetting('colorBlindSupport', checked)}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-white mb-2 block">
                      Font Size: {settings.fontSize}px
                    </label>
                    <Slider
                      value={[settings.fontSize]}
                      onValueChange={([value]) => updateSetting('fontSize', value)}
                      min={12}
                      max={24}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Motion & Navigation */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Navigation</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white">Reduced Motion</label>
                    <Switch
                      checked={settings.reducedMotion}
                      onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white">Voice Navigation</label>
                    <Switch
                      checked={settings.voiceNav}
                      onCheckedChange={(checked) => updateSetting('voiceNav', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white">Keyboard Navigation</label>
                    <Switch
                      checked={settings.keyboardNav}
                      onCheckedChange={(checked) => updateSetting('keyboardNav', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Audio & Captions */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Audio</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white">Auto Subtitles</label>
                    <Switch
                      checked={settings.subtitles}
                      onCheckedChange={(checked) => updateSetting('subtitles', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white">Audio Description</label>
                    <Switch
                      checked={settings.audioDescription}
                      onCheckedChange={(checked) => updateSetting('audioDescription', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white">Screen Reader Support</label>
                    <Switch
                      checked={settings.screenReader}
                      onCheckedChange={(checked) => updateSetting('screenReader', checked)}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setIsOpen(false)}
                className="w-full mt-4"
                variant="outline"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Voice Command Interface
export function VoiceCommandInterface() {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState('');

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setLastCommand(transcript);
        
        // Process voice commands
        if (transcript.toLowerCase().includes('go to dashboard')) {
          window.location.href = '/dashboard';
        } else if (transcript.toLowerCase().includes('new message')) {
          window.location.href = '/messages';
        } else if (transcript.toLowerCase().includes('upload content')) {
          window.location.href = '/upload';
        }
      };

      recognition.start();
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <Button
        onClick={startListening}
        className={`rounded-full p-3 ${isListening ? 'bg-red-600' : 'bg-blue-600'}`}
        aria-label="Voice commands"
      >
        <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
      </Button>
      
      {lastCommand && (
        <div className="absolute bottom-16 right-0 bg-gray-800 text-white p-2 rounded text-xs">
          "{lastCommand}"
        </div>
      )}
    </div>
  );
}

// Live Chat Support Widget
export function LiveSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  return (
    <div className="fixed bottom-32 right-4 z-40">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-3 bg-green-600 hover:bg-green-700"
        aria-label="Live support chat"
      >
        <MessageCircle className="w-5 h-5" />
      </Button>

      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 h-96 bg-gray-900 border-gray-700">
          <CardContent className="p-4 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Live Support</h3>
            
            <div className="flex-1 bg-gray-800 rounded p-3 mb-4 overflow-y-auto">
              <div className="text-sm text-gray-300">
                <p className="mb-2">👋 Hi! I'm here to help with any questions about FansLab.</p>
                <p className="mb-2">🔐 Need help with verification?</p>
                <p className="mb-2">💰 Questions about payments?</p>
                <p>📱 Technical support?</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-gray-700"
              />
              <Button size="sm">Send</Button>
            </div>

            <div className="text-xs text-gray-400 mt-2 text-center">
              Average response time: &lt; 2 minutes
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
