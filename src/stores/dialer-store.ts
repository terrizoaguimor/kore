import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CallDirection, CallStatus } from "@/types/voice"

// Call state for active calls
export interface ActiveCall {
  id: string
  callControlId: string
  direction: CallDirection
  status: CallStatus | 'connecting' | 'ringing' | 'active' | 'held'
  phoneNumber: string
  contactName?: string
  startTime: Date
  duration: number
  isMuted: boolean
  isOnHold: boolean
  isRecording: boolean
}

// Recent call for quick dial
export interface RecentCall {
  id: string
  phoneNumber: string
  contactName?: string
  direction: CallDirection
  timestamp: Date
  duration: number
}

// Dialer UI state
export type DialerView = 'minimized' | 'dialpad' | 'incall' | 'history'

interface DialerState {
  // UI State
  isOpen: boolean
  view: DialerView
  position: { x: number; y: number }

  // Dialer Input
  phoneNumber: string
  selectedCallerId: string | null

  // Active Call
  activeCall: ActiveCall | null

  // Call History (last 10)
  recentCalls: RecentCall[]

  // WebRTC State
  isConnected: boolean
  isConnecting: boolean
  audioInputDevice: string | null
  audioOutputDevice: string | null

  // Actions - UI
  open: () => void
  close: () => void
  minimize: () => void
  setView: (view: DialerView) => void
  setPosition: (position: { x: number; y: number }) => void

  // Actions - Dialer
  setPhoneNumber: (number: string) => void
  appendDigit: (digit: string) => void
  deleteDigit: () => void
  clearNumber: () => void
  setCallerId: (callerId: string | null) => void

  // Actions - Call Management
  startCall: (call: ActiveCall) => void
  updateCall: (updates: Partial<ActiveCall>) => void
  endCall: () => void
  toggleMute: () => void
  toggleHold: () => void
  toggleRecording: () => void

  // Actions - History
  addToHistory: (call: RecentCall) => void
  clearHistory: () => void

  // Actions - Audio Devices
  setAudioInputDevice: (deviceId: string | null) => void
  setAudioOutputDevice: (deviceId: string | null) => void

  // Actions - WebRTC Connection
  setConnected: (connected: boolean) => void
  setConnecting: (connecting: boolean) => void
}

export const useDialerStore = create<DialerState>()(
  persist(
    (set, get) => ({
      // Initial UI State
      isOpen: false,
      view: 'dialpad',
      position: { x: 20, y: 20 },

      // Initial Dialer State
      phoneNumber: '',
      selectedCallerId: null,

      // Initial Call State
      activeCall: null,
      recentCalls: [],

      // Initial WebRTC State
      isConnected: false,
      isConnecting: false,
      audioInputDevice: null,
      audioOutputDevice: null,

      // UI Actions
      open: () => set({ isOpen: true, view: get().activeCall ? 'incall' : 'dialpad' }),
      close: () => set({ isOpen: false }),
      minimize: () => set({ view: 'minimized' }),
      setView: (view) => set({ view }),
      setPosition: (position) => set({ position }),

      // Dialer Actions
      setPhoneNumber: (phoneNumber) => set({ phoneNumber }),
      appendDigit: (digit) => set((state) => ({
        phoneNumber: state.phoneNumber + digit
      })),
      deleteDigit: () => set((state) => ({
        phoneNumber: state.phoneNumber.slice(0, -1)
      })),
      clearNumber: () => set({ phoneNumber: '' }),
      setCallerId: (selectedCallerId) => set({ selectedCallerId }),

      // Call Management Actions
      startCall: (call) => set({
        activeCall: call,
        view: 'incall',
        isOpen: true
      }),

      updateCall: (updates) => set((state) => ({
        activeCall: state.activeCall
          ? { ...state.activeCall, ...updates }
          : null
      })),

      endCall: () => {
        const { activeCall } = get()
        if (activeCall) {
          // Add to history
          const recentCall: RecentCall = {
            id: activeCall.id,
            phoneNumber: activeCall.phoneNumber,
            contactName: activeCall.contactName,
            direction: activeCall.direction,
            timestamp: activeCall.startTime,
            duration: activeCall.duration
          }
          set((state) => ({
            activeCall: null,
            view: 'dialpad',
            recentCalls: [recentCall, ...state.recentCalls].slice(0, 10)
          }))
        }
      },

      toggleMute: () => set((state) => ({
        activeCall: state.activeCall
          ? { ...state.activeCall, isMuted: !state.activeCall.isMuted }
          : null
      })),

      toggleHold: () => set((state) => ({
        activeCall: state.activeCall
          ? { ...state.activeCall, isOnHold: !state.activeCall.isOnHold }
          : null
      })),

      toggleRecording: () => set((state) => ({
        activeCall: state.activeCall
          ? { ...state.activeCall, isRecording: !state.activeCall.isRecording }
          : null
      })),

      // History Actions
      addToHistory: (call) => set((state) => ({
        recentCalls: [call, ...state.recentCalls].slice(0, 10)
      })),
      clearHistory: () => set({ recentCalls: [] }),

      // Audio Device Actions
      setAudioInputDevice: (audioInputDevice) => set({ audioInputDevice }),
      setAudioOutputDevice: (audioOutputDevice) => set({ audioOutputDevice }),

      // WebRTC Actions
      setConnected: (isConnected) => set({ isConnected }),
      setConnecting: (isConnecting) => set({ isConnecting }),
    }),
    {
      name: "cloudhub-dialer",
      partialize: (state) => ({
        position: state.position,
        recentCalls: state.recentCalls,
        selectedCallerId: state.selectedCallerId,
        audioInputDevice: state.audioInputDevice,
        audioOutputDevice: state.audioOutputDevice,
      }),
    }
  )
)
