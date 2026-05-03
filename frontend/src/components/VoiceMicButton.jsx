import { useState, useEffect } from "react"
import { Mic, MicOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/services/api"

// GLOBAL VOICE HANDLER
let globalMediaRecorder = null
let globalAudioChunks = []
export let globalActiveMicId = null

// Event bus to sync UI states across multiple mic buttons
const listeners = new Set()
const syncRecordingState = (micId) => {
  globalActiveMicId = micId
  listeners.forEach(fn => fn(micId))
}

export const startRecording = async (micId) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    globalMediaRecorder = new MediaRecorder(stream)
    globalAudioChunks = []

    globalMediaRecorder.ondataavailable = (e) => {
      globalAudioChunks.push(e.data)
    }

    globalMediaRecorder.start()
    syncRecordingState(micId)
  } catch (err) {
    console.error("Microphone access denied:", err)
    alert("Microphone access denied or missing.")
  }
}

export const stopRecording = async (callback) => {
  if (!globalMediaRecorder) return

  return new Promise((resolve) => {
    globalMediaRecorder.onstop = async () => {
      const blob = new Blob(globalAudioChunks, { type: "audio/webm" })
      const formData = new FormData()
      formData.append("audio", blob, "voice.webm")

      try {
        const res = await api.post("/api/voice/extract", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
        const textVal = res.data?.text || res.data?.data?.text;
        
        if (!textVal || (typeof textVal === "string" && textVal.trim() === "")) {
          alert("Voice not captured. Please speak clearly.")
        } else {
          callback(textVal)
        }
      } catch (err) {
        console.error(err)
        alert("Voice processing failed")
      } finally {
        if (globalMediaRecorder && globalMediaRecorder.stream) {
          globalMediaRecorder.stream.getTracks().forEach(track => track.stop())
        }
        globalMediaRecorder = null
        resolve()
      }
    }

    globalMediaRecorder.stop()
    syncRecordingState(null)
  })
}

/**
 * VoiceMicButton
 * 
 * Props:
 *  - onExtractionSuccess: callback(text) called when voice is processed
 *  - buttonText: label for the large button variant
 *  - small: if true, renders a small icon-only button
 *  - voiceEnabled: boolean — if false, renders nothing. 
 *      The parent (ConsultationPage) fetches this from admin settings 
 *      and passes it down. This avoids stale module-level caches.
 */
export function VoiceMicButton({ 
  onExtractionSuccess, 
  buttonText = "Dictate",
  small = false,
  voiceEnabled = true   // controlled by parent — no internal fetching
}) {
  const [myId] = useState(() => Math.random().toString(36).substr(2, 9))
  const [activeMicId, setActiveMicId] = useState(globalActiveMicId)
  const [processing, setProcessing] = useState(false)

  const recording = activeMicId === myId

  useEffect(() => {
    listeners.add(setActiveMicId)
    return () => listeners.delete(setActiveMicId)
  }, [])

  const handleVoice = async () => {
    if (processing) return
    if (globalActiveMicId !== myId) {
      await startRecording(myId)
    } else {
      setProcessing(true)
      await stopRecording(onExtractionSuccess)
      setProcessing(false)
    }
  }

  // If voice is disabled by admin — render nothing at all
  if (!voiceEnabled) return null

  if (small) {
    return (
      <button 
         type="button"
         onClick={handleVoice} 
         disabled={processing}
         className={`p-1.5 rounded-full ${recording ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-500'} transition-all flex items-center justify-center`}
         title={recording ? "Recording..." : processing ? "Processing AI..." : "Start Dictation"}
      >
         {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 
          recording ? <MicOff className="w-3.5 h-3.5" /> : 
          <Mic className="w-3.5 h-3.5" />}
      </button>
    )
  }

  return (
    <Button 
      type="button" 
      onClick={handleVoice}
      variant={recording ? "destructive" : "secondary"}
      disabled={processing}
      className={`gap-2 ${recording ? 'animate-pulse' : ''}`}
    >
      {processing ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Processing AI...</>
      ) : recording ? (
        <><MicOff className="w-4 h-4" /> Stop Recording</>
      ) : (
        <><Mic className="w-4 h-4" /> {buttonText}</>
      )}
    </Button>
  )
}
