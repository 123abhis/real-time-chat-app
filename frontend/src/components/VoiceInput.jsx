import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const VoiceInput = ({ onTextReceived }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptText = result[0].transcript;
        
        setTranscript(transcriptText);
        
        if (result.isFinal) {
          onTextReceived(transcriptText);
          stopListening();
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Don't show error for aborted (user stopped) or no-speech (no audio detected)
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          toast.error(`Speech recognition error: ${event.error}`);
        }
        
        stopListening();
      };
      
      recognitionRef.current.onend = () => {
        // Don't restart automatically
        stopListening();
      };
    } else {
      toast.error('Speech recognition is not supported in your browser');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onTextReceived]);

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setIsProcessing(true);
      toast.success('Listening... Speak now');
      
      // Set a timeout to automatically stop after 5 seconds
      timeoutRef.current = setTimeout(() => {
        if (isListening) {
          stopListening();
          toast.info('Voice input timed out. Please try again.');
        }
      }, 5000);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast.error('Failed to start speech recognition');
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsListening(false);
    setIsProcessing(false);
  };

  return (
    <div className="flex items-center gap-2">
      {isProcessing ? (
        <button 
          className="btn btn-circle btn-sm btn-error" 
          onClick={stopListening}
          disabled={!isListening}
        >
          {isListening ? <MicOff size={16} /> : <Loader2 size={16} className="animate-spin" />}
        </button>
      ) : (
        <button 
          className="btn btn-circle btn-sm btn-primary" 
          onClick={startListening}
          title="Voice input"
        >
          <Mic size={16} />
        </button>
      )}
      {transcript && (
        <div className="text-xs text-gray-500 italic">
          {transcript}
        </div>
      )}
    </div>
  );
};

export default VoiceInput; 