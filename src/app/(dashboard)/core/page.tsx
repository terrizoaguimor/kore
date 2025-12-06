"use client"

import { useState, useRef, useEffect } from "react"
import { useAuthStore } from "@/stores/auth-store"
import {
  Brain,
  Send,
  Sparkles,
  Lightbulb,
  TrendingUp,
  FileText,
  Calendar,
  Users,
  Loader2,
  Bot,
  User,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const suggestions = [
  {
    icon: TrendingUp,
    title: "Marketing Strategy",
    prompt: "What marketing strategy should I use for Q1?",
  },
  {
    icon: FileText,
    title: "Content Ideas",
    prompt: "Generate 5 social media post ideas for our product launch",
  },
  {
    icon: Calendar,
    title: "Meeting Prep",
    prompt: "Help me prepare talking points for my client meeting tomorrow",
  },
  {
    icon: Users,
    title: "Lead Insights",
    prompt: "Analyze our top leads and suggest follow-up strategies",
  },
]

export default function CorePage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I understand you're asking about "${userMessage.content}". As The Core AI, I'm here to help you with insights and strategies across all KORE modules.\n\nThis is a placeholder response. In the full implementation, I would connect to your AI backend to provide intelligent, context-aware responses based on your organization's data across KORE Drive, Pulse, Voice, and Link.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
  }

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <div className="flex h-full flex-col bg-[#0B0B0B]">
      {/* Header */}
      <div className="border-b border-[#1F1F1F] px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00E5FF]/20">
            <Brain className="h-6 w-6 text-[#00E5FF]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">The Core</h1>
            <p className="text-sm text-[#A1A1AA]">Your AI-powered assistant for all things KORE</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            {/* Empty state with suggestions */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00E5FF]/20 to-[#00E5FF]/5 shadow-[0_0_40px_rgba(0,229,255,0.2)]">
                <Brain className="h-10 w-10 text-[#00E5FF]" />
              </div>
              <h2 className="text-2xl font-bold text-white">Ask The Core</h2>
              <p className="mt-2 max-w-md text-[#A1A1AA]">
                I can help you with marketing strategies, content ideas, data insights, and more across all KORE modules.
              </p>
            </motion.div>

            {/* Suggestions Grid */}
            <div className="mt-8 grid w-full max-w-2xl grid-cols-2 gap-4">
              {suggestions.map((suggestion, index) => {
                const Icon = suggestion.icon
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSuggestionClick(suggestion.prompt)}
                    className="group flex items-start gap-3 rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-4 text-left transition-all hover:border-[#00E5FF]/30 hover:shadow-[0_0_20px_rgba(0,229,255,0.1)]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0B0B0B] group-hover:bg-[#00E5FF]/10 transition-colors">
                      <Icon className="h-5 w-5 text-[#A1A1AA] group-hover:text-[#00E5FF] transition-colors" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{suggestion.title}</p>
                      <p className="mt-1 text-sm text-[#A1A1AA] line-clamp-2">{suggestion.prompt}</p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/20">
                      <Bot className="h-5 w-5 text-[#00E5FF]" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-2xl rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-[#00E5FF] text-[#0B0B0B]"
                        : "bg-[#1F1F1F] text-white"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={cn(
                        "mt-2 text-xs",
                        message.role === "user" ? "text-[#0B0B0B]/60" : "text-[#A1A1AA]"
                      )}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1F1F1F]">
                      <User className="h-5 w-5 text-[#A1A1AA]" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/20">
                  <Bot className="h-5 w-5 text-[#00E5FF]" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-[#1F1F1F] px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-[#00E5FF]" />
                  <span className="text-[#A1A1AA]">Thinking...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-[#1F1F1F] p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
          <div className="flex items-center gap-4 rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] p-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask The Core anything..."
              className="flex-1 bg-transparent px-4 py-2 text-white placeholder:text-[#A1A1AA] focus:outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-all",
                input.trim() && !isLoading
                  ? "bg-[#00E5FF] text-[#0B0B0B] hover:bg-[#00E5FF]/90"
                  : "bg-[#2A2A2A] text-[#A1A1AA]"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-[#A1A1AA]">
            The Core can make mistakes. Consider checking important information.
          </p>
        </form>
      </div>
    </div>
  )
}
