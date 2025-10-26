import { useState, useEffect, useRef } from 'react';
import { livekitApi } from '../services/api';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { Room, RoomEvent, Track } from 'livekit-client';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [conversationLog, setConversationLog] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');

  const roomRef = useRef<Room | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const roomNameRef = useRef<string>('');

  useEffect(() => {
    setRoomName(`room-${Date.now()}`);
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        addLog('🎤 Listening for your voice...');
      };

      recognition.onresult = async (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setCurrentTranscript(interimTranscript);

        if (finalTranscript) {
          const question = finalTranscript.trim();
          addLog(`👤 You: ${question}`);
          setCurrentTranscript('');
          
          try {
            const currentRoomName = roomNameRef.current;
            if (!currentRoomName) {
              addLog('Room not initialized');
              return;
            }
            
            const response = await livekitApi.processSpeech(currentRoomName, question);
            const aiResponse = response.data.response;
            addLog(`AI: ${aiResponse}`);
            
            speakResponse(aiResponse);
          } catch (error) {
            addLog('Error processing your question');
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          addLog(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (isConnected && !isMuted) {
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
    
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleConnect = async () => {
    if (!roomName || !participantName || !customerPhone) {
      alert('Please fill in all fields');
      return;
    }

    setIsConnecting(true);
    try {
      const response = await livekitApi.getToken(roomName, participantName, customerPhone);
      const { token, url } = response.data;

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          audioElementRef.current = audioElement;
          document.body.appendChild(audioElement);
          addLog(`🔊 Receiving audio from ${participant.identity}`);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
        addLog('🔇 Audio track unsubscribed');
      });

      room.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        addLog('📞 Disconnected from call');
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        addLog(`👤 ${participant.identity} joined the call`);
      });

      await room.connect(url, token);
      setIsConnected(true);
      roomNameRef.current = roomName;
      addLog(`✅ Connected to room: ${roomName}`);
      addLog(`📱 Phone: ${customerPhone}`);
      addLog('🎙️ You can now speak to the AI receptionist');

      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true);
      addLog('🎤 Microphone enabled');

      // Start speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
        }
      }

    } catch (error) {
      console.error('Error connecting:', error);
      addLog(`❌ Connection error: ${error}`);
      alert('Failed to connect. Please check your credentials and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (roomRef.current) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      await livekitApi.endCall(roomName);
      roomRef.current.disconnect();
      roomRef.current = null;
      
      if (audioElementRef.current) {
        audioElementRef.current.remove();
        audioElementRef.current = null;
      }
      
      setIsConnected(false);
      setIsListening(false);
      setCurrentTranscript('');
      roomNameRef.current = '';
      addLog('📞 Call ended');
    }
  };

  const toggleMute = async () => {
    if (roomRef.current) {
      const newMutedState = !isMuted;
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState);
      setIsMuted(newMutedState);
      addLog(newMutedState ? '🔇 Microphone muted' : '🎤 Microphone unmuted');
    }
  };

  const addLog = (message: string) => {
    setConversationLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const speakResponse = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Voice Test</h1>
        <p className="mt-2 text-gray-600">
          Test the AI receptionist with a live voice call
        </p>
      </div>

      {!isConnected && (
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Start a Call</h2>
          
          <div>
            <label htmlFor="participantName" className="block text-sm font-medium text-gray-700">
              Your Name
            </label>
            <input
              type="text"
              id="participantName"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2 border"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2 border"
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700">
              Room Name (auto-generated)
            </label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2 border bg-gray-50"
              readOnly
            />
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <Phone className="h-5 w-5" />
            <span>{isConnecting ? 'Connecting...' : 'Start Call'}</span>
          </button>
        </div>
      )}

      {isConnected && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Call Active</h2>
              <p className="text-sm text-gray-600">Room: {roomName}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-600">Connected</span>
            </div>
          </div>

          {isListening && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-700">Listening...</span>
              </div>
              {currentTranscript && (
                <p className="text-sm text-gray-700 italic">"{currentTranscript}"</p>
              )}
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={toggleMute}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg font-medium transition-colors ${
                isMuted
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              onClick={handleDisconnect}
              className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <PhoneOff className="h-5 w-5" />
              <span>End Call</span>
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Call Log</h2>
        <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
          {conversationLog.length === 0 ? (
            <p className="text-gray-500 text-center">No activity yet. Start a call to see logs.</p>
          ) : (
            <div className="space-y-2">
              {conversationLog.map((log, index) => (
                <div key={index} className="text-sm text-gray-700 font-mono">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Test</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Fill in your name and phone number</li>
          <li>Click "Start Call" to connect to the AI receptionist</li>
          <li>Allow microphone access when prompted</li>
          <li>Speak your question clearly (e.g., "What are your business hours?")</li>
          <li>The AI will respond with an answer if it knows, or escalate to a supervisor</li>
          <li>Check the Dashboard to see any escalated requests</li>
        </ol>
      </div>
    </div>
  );
}
