"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Globe,
  MapPin,
  AlertTriangle,
  RefreshCw,
  Users,
  Activity,
  Eye,
  Shield,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion } from "motion/react"

interface GeoVisit {
  ip: string
  lat: number
  lng: number
  country: string
  countryCode: string
  city: string
  count: number
  lastVisit: string
  isSuspicious: boolean
  isBlocked: boolean
}

interface CountryStat {
  country: string
  countryCode: string
  visits: number
  uniqueIps: number
  suspicious: number
}

interface GeoData {
  visits: GeoVisit[]
  countryStats: CountryStat[]
  totalLocations: number
  totalVisits: number
}

function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌍"
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export default function TrafficMonitorPage() {
  const [data, setData] = useState<GeoData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(24)
  const [selectedVisit, setSelectedVisit] = useState<GeoVisit | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchGeoData = useCallback(async () => {
    try {
      const response = await fetch(`/api/security/geo-visits?hours=${timeRange}&limit=200`)
      if (!response.ok) throw new Error("Failed to fetch")
      const { data: geoData } = await response.json()
      setData(geoData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error fetching geo data:", error)
      toast.error("Failed to load traffic data")
    } finally {
      setIsLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchGeoData()
    const interval = setInterval(fetchGeoData, 30000)
    return () => clearInterval(interval)
  }, [fetchGeoData])

  const getPointColor = (visit: GeoVisit) => {
    if (visit.isBlocked) return "#FF6B6B"
    if (visit.isSuspicious) return "#0046E2"
    return "#10B981"
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0046E2] to-[#1A5AE8]">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Traffic Monitor</h1>
            <p className="text-[#A1A1AA] mt-1">
              Real-time global traffic visualization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0046E2]/50"
          >
            <option value="1" className="bg-[#1b2d7c]">Last hour</option>
            <option value="6" className="bg-[#1b2d7c]">Last 6 hours</option>
            <option value="24" className="bg-[#1b2d7c]">Last 24 hours</option>
            <option value="168" className="bg-[#1b2d7c]">Last 7 days</option>
          </select>
          <Button
            onClick={() => { setIsLoading(true); fetchGeoData() }}
            className="bg-white/5 border border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0046E2]/10">
              <Eye className="h-5 w-5 text-[#0046E2]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{data?.totalVisits?.toLocaleString() || 0}</p>
              <p className="text-xs text-[#A1A1AA]">Total Visits</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1b2d7c]/10">
              <MapPin className="h-5 w-5 text-[#1b2d7c]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{data?.totalLocations || 0}</p>
              <p className="text-xs text-[#A1A1AA]">Locations</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0046E2]/10">
              <AlertTriangle className="h-5 w-5 text-[#0046E2]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {data?.visits.filter(v => v.isSuspicious).length || 0}
              </p>
              <p className="text-xs text-[#A1A1AA]">Suspicious</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10B981]/10">
              <Activity className="h-5 w-5 text-[#10B981]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {data?.countryStats.length || 0}
              </p>
              <p className="text-xs text-[#A1A1AA]">Countries</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Traffic Map Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-[#0c1929] via-[#0a1628] to-[#071422] border border-white/10 min-h-[400px]"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Global Traffic Map</h2>
            {lastUpdate && (
              <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-2 border-[#0046E2] border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="relative">
              {/* Simple visualization of traffic points */}
              <div className="grid grid-cols-6 gap-2 mb-6">
                {data?.visits.slice(0, 24).map((visit, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedVisit(visit)}
                    className={cn(
                      "p-3 rounded-xl cursor-pointer transition-all hover:scale-105",
                      visit.isBlocked ? "bg-[#FF6B6B]/10 border border-[#FF6B6B]/30" :
                      visit.isSuspicious ? "bg-[#0046E2]/10 border border-[#0046E2]/30" :
                      "bg-[#10B981]/10 border border-[#10B981]/30"
                    )}
                  >
                    <div className="text-center">
                      <span className="text-2xl">{getCountryFlag(visit.countryCode)}</span>
                      <p className="text-xs text-white mt-1 truncate">{visit.city}</p>
                      <p className="text-xs text-[#A1A1AA]">{visit.count}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                  <span className="text-xs text-[#A1A1AA]">Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#0046E2]" />
                  <span className="text-xs text-[#A1A1AA]">Suspicious</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF6B6B]" />
                  <span className="text-xs text-[#A1A1AA]">Blocked</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Selected Visit / Country Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
        >
          {selectedVisit ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Location Details</h2>
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="text-xs text-[#A1A1AA] hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{getCountryFlag(selectedVisit.countryCode)}</span>
                  <div>
                    <p className="text-xl font-bold text-white">{selectedVisit.city}</p>
                    <p className="text-sm text-[#A1A1AA]">{selectedVisit.country}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-[#A1A1AA]">IP Address</p>
                    <code className="text-sm text-[#0046E2] font-mono">{selectedVisit.ip}</code>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-[#A1A1AA]">Total Visits</p>
                    <p className="text-lg font-bold text-white">{selectedVisit.count}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-[#A1A1AA] mb-1">Coordinates</p>
                  <p className="text-sm text-white font-mono">
                    {selectedVisit.lat.toFixed(4)}°, {selectedVisit.lng.toFixed(4)}°
                  </p>
                </div>

                {selectedVisit.isSuspicious && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0046E2]/10 border border-[#0046E2]/30">
                    <AlertTriangle className="h-5 w-5 text-[#0046E2]" />
                    <span className="text-sm text-[#0046E2]">Suspicious Activity</span>
                  </div>
                )}

                {selectedVisit.isBlocked && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30">
                    <Shield className="h-5 w-5 text-[#FF6B6B]" />
                    <span className="text-sm text-[#FF6B6B]">IP Blocked</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Top Countries</h2>
              <div className="space-y-3">
                {data?.countryStats.slice(0, 8).map((stat, i) => (
                  <div
                    key={stat.country}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-2xl">{getCountryFlag(stat.countryCode)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{stat.country}</p>
                      <p className="text-xs text-[#A1A1AA]">{stat.uniqueIps} unique IPs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{stat.visits}</p>
                      {stat.suspicious > 0 && (
                        <p className="text-xs text-[#0046E2]">{stat.suspicious} suspicious</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
