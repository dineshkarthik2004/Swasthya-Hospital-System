import { useState, useCallback, useRef } from "react";

export function useVoiceInput(onResultCallback, onErrorCallback) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Restart silence timer each time we get audio/results
  const resetSilenceTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      console.log("[VoiceInput] Silence detected. Stopping recording automatically.");
      stopListening();
    }, 5000); // 5 seconds of silence
  }, []);

  const initializeRecognition = useCallback(() => {
    // Need to safely check without throwing errors
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      if (onErrorCallback) onErrorCallback("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return null;
    }

    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Based on previous HTML codebase

    recognition.onstart = () => {
      console.log("[VoiceInput] Microphone active");
      setIsListening(true);
      resetSilenceTimeout();
    };

    recognition.onspeechend = () => {
       console.log("[VoiceInput] Speech ended event");
    }

    recognition.onresult = (event) => {
      resetSilenceTimeout();
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (onResultCallback) {
        onResultCallback({ finalTranscript, interimTranscript });
      }
    };

    recognition.onerror = (event) => {
      console.error("[VoiceInput] Speech recognition error:", event.error);
      setIsListening(false);
      let errorMsg = "Microphone error.";
      if (event.error === 'not-allowed') errorMsg = "Microphone access denied. Please allow permissions.";
      if (event.error === 'no-speech') errorMsg = "No speech detected. Please try again.";
      if (event.error === 'network') errorMsg = "Network error occurred during speech recognition.";
      
      if (onErrorCallback) onErrorCallback(errorMsg);
    };

    recognition.onend = () => {
      console.log("[VoiceInput] Speech recognition ended");
      setIsListening(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    return recognition;
  }, [onResultCallback, onErrorCallback, resetSilenceTimeout]);

  const startListening = useCallback(() => {
    if (isListening) return;
    
    // Stop any existing recognition instance just in case
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
    
    const recognition = initializeRecognition();
    if (recognition) {
      recognitionRef.current = recognition;
      try {
          recognition.start();
      } catch (err) {
          console.error("Could not start recognition", err);
      }
    }
  }, [initializeRecognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return { isListening, startListening, stopListening, toggleListening };
}
