'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone,
  PhoneOff,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Mic,
  MicOff,
  Pause,
  Play,
  X,
  Minus,
  Maximize2,
  History,
  Grid3X3,
  Delete,
  CircleDot,
  Volume2,
  Settings,
  User,
  Clock,
  ChevronUp,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDialerStore, type ActiveCall } from '@/stores/dialer-store'
import { toast } from 'sonner'

// Dialpad buttons configuration
const dialpadButtons = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
]

// Format phone number for display
function formatPhoneNumber(number: string): string {
  const cleaned = number.replace(/\D/g, '')
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
  if (cleaned.length <= 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  // International format
  return `+${cleaned.slice(0, cleaned.length - 10)} (${cleaned.slice(-10, -7)}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`
}

// Format duration
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes}m`
  if (hours < 24) return `Hace ${hours}h`
  if (days < 7) return `Hace ${days}d`
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export default function FloatingDialer() {
  const {
    isOpen,
    view,
    position,
    phoneNumber,
    activeCall,
    recentCalls,
    isConnecting,
    open,
    close,
    minimize,
    setView,
    setPosition,
    setPhoneNumber,
    appendDigit,
    deleteDigit,
    clearNumber,
    startCall,
    updateCall,
    endCall,
    toggleMute,
    toggleHold,
    toggleRecording,
  } = useDialerStore()

  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [callTimer, setCallTimer] = useState(0)
  const dialerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Call timer
  useEffect(() => {
    if (activeCall && (activeCall.status === 'active' || activeCall.status === 'in_progress')) {
      timerRef.current = setInterval(() => {
        setCallTimer((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setCallTimer(0)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [activeCall?.status])

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || view === 'incall') return

      // Only handle if not focused on an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return
      }

      if (/^[0-9*#]$/.test(e.key)) {
        appendDigit(e.key)
      } else if (e.key === 'Backspace') {
        deleteDigit()
      } else if (e.key === 'Enter' && phoneNumber.length >= 3) {
        handleMakeCall()
      } else if (e.key === 'Escape') {
        close()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, view, phoneNumber, appendDigit, deleteDigit, close])

  // Dragging functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return

    setIsDragging(true)
    const rect = dialerRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      // Keep within viewport bounds
      const maxX = window.innerWidth - (dialerRef.current?.offsetWidth || 320)
      const maxY = window.innerHeight - (dialerRef.current?.offsetHeight || 480)

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, setPosition])

  // Make call
  const handleMakeCall = async () => {
    if (!phoneNumber || phoneNumber.length < 3) {
      toast.error('Ingresa un número válido')
      return
    }

    try {
      // Create call via API
      const response = await fetch('/api/voice/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
        }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        const call: ActiveCall = {
          id: data.data.id || crypto.randomUUID(),
          callControlId: data.data.call_control_id || data.data.id,
          direction: 'outbound',
          status: 'connecting',
          phoneNumber: phoneNumber,
          startTime: new Date(),
          duration: 0,
          isMuted: false,
          isOnHold: false,
          isRecording: false,
        }

        startCall(call)
        clearNumber()
        toast.success('Iniciando llamada...')
      } else {
        toast.error(data.error || 'Error al iniciar la llamada')
      }
    } catch (error) {
      console.error('Error making call:', error)
      toast.error('Error al conectar la llamada')
    }
  }

  // End call
  const handleEndCall = async () => {
    if (!activeCall) return

    try {
      await fetch(`/api/voice/calls/${activeCall.callControlId}`, {
        method: 'DELETE',
      })

      updateCall({ duration: callTimer })
      endCall()
      toast.info('Llamada finalizada')
    } catch (error) {
      console.error('Error ending call:', error)
      // Still end call locally
      updateCall({ duration: callTimer })
      endCall()
    }
  }

  // Toggle mute
  const handleToggleMute = async () => {
    if (!activeCall) return

    try {
      await fetch(`/api/voice/calls/${activeCall.callControlId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mute' }),
      })

      toggleMute()
    } catch (error) {
      console.error('Error toggling mute:', error)
      toggleMute() // Toggle locally anyway
    }
  }

  // Toggle hold
  const handleToggleHold = async () => {
    if (!activeCall) return

    try {
      await fetch(`/api/voice/calls/${activeCall.callControlId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hold' }),
      })

      toggleHold()
    } catch (error) {
      console.error('Error toggling hold:', error)
      toggleHold() // Toggle locally anyway
    }
  }

  // Call from history
  const handleCallFromHistory = (number: string) => {
    setPhoneNumber(number)
    setView('dialpad')
  }

  // Minimized FAB button
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={open}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#00D68F] text-white shadow-lg shadow-[#00D68F]/30 hover:bg-[#00D68F]/90 transition-colors"
      >
        <Phone className="h-6 w-6" />
        {activeCall && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4757] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF4757]"></span>
          </span>
        )}
      </motion.button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={dialerRef}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 9999,
        }}
        className={`
          w-80 rounded-2xl bg-[#0f1a4a] border border-[#2d3c8a] shadow-2xl overflow-hidden
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        `}
      >
        {/* Header */}
        <div
          onMouseDown={handleMouseDown}
          className="flex items-center justify-between px-4 py-3 bg-[#243178] border-b border-[#2d3c8a]"
        >
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-[#00D68F]" />
            <span className="font-medium text-white">Teléfono</span>
            {isConnecting && (
              <Loader2 className="h-4 w-4 animate-spin text-[#0046E2]" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={minimize}
              className="h-7 w-7 text-[#A1A1AA] hover:text-white"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              className="h-7 w-7 text-[#A1A1AA] hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        {!activeCall && (
          <div className="flex border-b border-[#2d3c8a]">
            <button
              onClick={() => setView('dialpad')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                view === 'dialpad'
                  ? 'text-[#0046E2] border-b-2 border-[#0046E2] bg-[#0046E2]/5'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#243178]'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
              Teclado
            </button>
            <button
              onClick={() => setView('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                view === 'history'
                  ? 'text-[#0046E2] border-b-2 border-[#0046E2] bg-[#0046E2]/5'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#243178]'
              }`}
            >
              <History className="h-4 w-4" />
              Recientes
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {/* Dialpad View */}
          {view === 'dialpad' && !activeCall && (
            <div className="space-y-4">
              {/* Phone Number Display */}
              <div className="flex items-center gap-2 bg-[#243178] rounded-xl px-4 py-3">
                <input
                  type="tel"
                  value={formatPhoneNumber(phoneNumber)}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ingresa un número"
                  className="flex-1 bg-transparent text-xl font-medium text-white text-center focus:outline-none placeholder:text-[#71717A]"
                />
                {phoneNumber && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={deleteDigit}
                    className="h-8 w-8 text-[#A1A1AA] hover:text-white"
                  >
                    <Delete className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {/* Dialpad Grid */}
              <div className="grid grid-cols-3 gap-2">
                {dialpadButtons.map((btn) => (
                  <button
                    key={btn.digit}
                    onClick={() => appendDigit(btn.digit)}
                    className="flex flex-col items-center justify-center h-16 rounded-xl bg-[#243178] hover:bg-[#2d3c8a] transition-colors"
                  >
                    <span className="text-2xl font-medium text-white">{btn.digit}</span>
                    {btn.letters && (
                      <span className="text-[10px] text-[#71717A] tracking-widest">{btn.letters}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Call Button */}
              <div className="flex justify-center pt-2">
                <Button
                  onClick={handleMakeCall}
                  disabled={!phoneNumber || phoneNumber.length < 3}
                  className="h-14 w-14 rounded-full bg-[#00D68F] hover:bg-[#00D68F]/90 text-white shadow-lg shadow-[#00D68F]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Phone className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}

          {/* History View */}
          {view === 'history' && !activeCall && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentCalls.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-[#2d3c8a] mb-3" />
                  <p className="text-[#A1A1AA] text-sm">No hay llamadas recientes</p>
                </div>
              ) : (
                recentCalls.map((call) => (
                  <motion.div
                    key={call.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#243178] hover:bg-[#2d3c8a] transition-colors cursor-pointer group"
                    onClick={() => handleCallFromHistory(call.phoneNumber)}
                  >
                    <div className={`p-2 rounded-full ${
                      call.direction === 'inbound' ? 'bg-[#0046E2]/10' : 'bg-[#00D68F]/10'
                    }`}>
                      {call.direction === 'inbound' ? (
                        <PhoneIncoming className={`h-4 w-4 ${
                          call.direction === 'inbound' ? 'text-[#0046E2]' : 'text-[#00D68F]'
                        }`} />
                      ) : (
                        <PhoneOutgoing className="h-4 w-4 text-[#00D68F]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {call.contactName || formatPhoneNumber(call.phoneNumber)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(new Date(call.timestamp))}</span>
                        <span>•</span>
                        <span>{formatDuration(call.duration)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 text-[#00D68F]"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* In-Call View */}
          {activeCall && (
            <div className="space-y-6">
              {/* Call Info */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-[#243178] flex items-center justify-center mb-4">
                  <User className="h-10 w-10 text-[#A1A1AA]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  {activeCall.contactName || formatPhoneNumber(activeCall.phoneNumber)}
                </h3>
                <div className="flex items-center justify-center gap-2">
                  {activeCall.status === 'connecting' && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#0046E2]" />
                      <span className="text-[#A1A1AA]">Conectando...</span>
                    </>
                  )}
                  {activeCall.status === 'ringing' && (
                    <span className="text-[#0046E2]">Llamando...</span>
                  )}
                  {(activeCall.status === 'active' || activeCall.status === 'in_progress') && (
                    <span className="text-[#00D68F] font-mono text-lg">
                      {formatDuration(callTimer)}
                    </span>
                  )}
                  {activeCall.status === 'held' && (
                    <span className="text-[#0046E2]">En espera</span>
                  )}
                </div>
                {activeCall.isRecording && (
                  <div className="flex items-center justify-center gap-1 mt-2 text-[#FF4757]">
                    <CircleDot className="h-3 w-3 animate-pulse" />
                    <span className="text-xs">Grabando</span>
                  </div>
                )}
              </div>

              {/* Call Controls */}
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={handleToggleMute}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                    activeCall.isMuted
                      ? 'bg-[#FF4757]/20 text-[#FF4757]'
                      : 'bg-[#243178] text-[#A1A1AA] hover:bg-[#2d3c8a]'
                  }`}
                >
                  {activeCall.isMuted ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                  <span className="text-xs">Silenciar</span>
                </button>

                <button
                  onClick={() => setView('dialpad')}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#243178] text-[#A1A1AA] hover:bg-[#2d3c8a] transition-colors"
                >
                  <Grid3X3 className="h-6 w-6" />
                  <span className="text-xs">Teclado</span>
                </button>

                <button
                  onClick={() => {}}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#243178] text-[#A1A1AA] hover:bg-[#2d3c8a] transition-colors"
                >
                  <Volume2 className="h-6 w-6" />
                  <span className="text-xs">Altavoz</span>
                </button>

                <button
                  onClick={handleToggleHold}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                    activeCall.isOnHold
                      ? 'bg-[#0046E2]/20 text-[#0046E2]'
                      : 'bg-[#243178] text-[#A1A1AA] hover:bg-[#2d3c8a]'
                  }`}
                >
                  {activeCall.isOnHold ? (
                    <Play className="h-6 w-6" />
                  ) : (
                    <Pause className="h-6 w-6" />
                  )}
                  <span className="text-xs">Espera</span>
                </button>

                <button
                  onClick={toggleRecording}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                    activeCall.isRecording
                      ? 'bg-[#FF4757]/20 text-[#FF4757]'
                      : 'bg-[#243178] text-[#A1A1AA] hover:bg-[#2d3c8a]'
                  }`}
                >
                  <CircleDot className="h-6 w-6" />
                  <span className="text-xs">Grabar</span>
                </button>

                <button
                  onClick={() => {}}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#243178] text-[#A1A1AA] hover:bg-[#2d3c8a] transition-colors"
                >
                  <User className="h-6 w-6" />
                  <span className="text-xs">Transferir</span>
                </button>
              </div>

              {/* End Call Button */}
              <div className="flex justify-center pt-2">
                <Button
                  onClick={handleEndCall}
                  className="h-14 w-14 rounded-full bg-[#FF4757] hover:bg-[#FF4757]/90 text-white shadow-lg shadow-[#FF4757]/30"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
