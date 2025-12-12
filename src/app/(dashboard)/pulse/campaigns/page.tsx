"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Megaphone, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CampaignsList, CampaignDialog, CampaignAnalytics } from "@/components/marketing"
import type { MarketingCampaign, MarketingCampaignStatus, CampaignAnalytics as CampaignAnalyticsType } from "@/types/marketing"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

// Demo data for initial development
const demoCampaigns: MarketingCampaign[] = [
  {
    id: '1',
    organization_id: '',
    campaign_no: 'CAMP-001',
    name: 'Promoción Verano 2024',
    description: 'Campaña de email marketing para promociones de verano',
    type: 'email',
    status: 'active',
    start_date: '2024-06-01',
    end_date: '2024-08-31',
    target_audience: { customerType: 'existing' },
    budget: 5000,
    goals: { leads: 500, conversions: 50, revenue: 25000 },
    content: {},
    settings: {},
    metrics: { sent: 12500, delivered: 12200, opened: 4880, clicked: 976, bounced: 300, unsubscribed: 45, leads: 245, conversions: 38 },
    created_by: '',
    created_at: '2024-05-15T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
    deleted_at: null,
  },
  {
    id: '2',
    organization_id: '',
    campaign_no: 'CAMP-002',
    name: 'Lanzamiento Nuevo Producto',
    description: 'Campaña multi-canal para el lanzamiento del nuevo servicio',
    type: 'multi_channel',
    status: 'scheduled',
    start_date: '2024-07-01',
    end_date: '2024-07-31',
    target_audience: { tags: ['premium'] },
    budget: 10000,
    goals: { leads: 1000, conversions: 100, revenue: 50000 },
    content: {},
    settings: {},
    metrics: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0, leads: 0, conversions: 0 },
    created_by: '',
    created_at: '2024-06-20T10:00:00Z',
    updated_at: '2024-06-20T10:00:00Z',
    deleted_at: null,
  },
  {
    id: '3',
    organization_id: '',
    campaign_no: 'CAMP-003',
    name: 'Retención Clientes Q2',
    description: 'Campaña de SMS para fidelización de clientes',
    type: 'sms',
    status: 'completed',
    start_date: '2024-04-01',
    end_date: '2024-06-30',
    target_audience: { customerType: 'lapsed' },
    budget: 3000,
    goals: { leads: 200, conversions: 30, revenue: 15000 },
    content: {},
    settings: {},
    metrics: { sent: 5600, delivered: 5400, opened: 3780, clicked: 756, bounced: 200, unsubscribed: 12, leads: 189, conversions: 28 },
    created_by: '',
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-06-30T10:00:00Z',
    deleted_at: null,
  },
  {
    id: '4',
    organization_id: '',
    campaign_no: 'CAMP-004',
    name: 'Newsletter Mensual',
    description: 'Newsletter informativo mensual',
    type: 'email',
    status: 'draft',
    start_date: null,
    end_date: null,
    target_audience: { interests: ['newsletter'] },
    budget: 500,
    goals: { leads: 50, conversions: 5, revenue: 2500 },
    content: {},
    settings: {},
    metrics: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0, leads: 0, conversions: 0 },
    created_by: '',
    created_at: '2024-06-25T10:00:00Z',
    deleted_at: null,
    updated_at: '2024-06-25T10:00:00Z',
  },
]

const demoAnalytics: CampaignAnalyticsType = {
  campaignId: '1',
  campaignName: 'Promoción Verano 2024',
  metrics: { sent: 12500, delivered: 12200, opened: 4880, clicked: 976, bounced: 300, unsubscribed: 45, leads: 245, conversions: 38 },
  performance: { openRate: 39.0, clickRate: 20.0, conversionRate: 15.5, costPerLead: 20.41, roi: 90.0 },
  goals: { leads: 500, conversions: 50, revenue: 25000 },
  progress: { leadsProgress: 49, conversionsProgress: 76 },
}

export default function CampaignsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(demoCampaigns)
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<CampaignAnalyticsType | null>(null)

  const accentColor = "#FF4757"

  // Load campaigns from Supabase
  useEffect(() => {
    const loadCampaigns = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const response = await fetch('/api/marketing/campaigns', {
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.campaigns && data.campaigns.length > 0) {
              setCampaigns(data.campaigns)
            }
          }
        }
      } catch (error) {
        console.error('Error loading campaigns:', error)
        // Keep demo data on error
      } finally {
        setIsLoading(false)
      }
    }

    loadCampaigns()
  }, [])

  const handleCreateCampaign = () => {
    setSelectedCampaign(null)
    setDialogOpen(true)
  }

  const handleEditCampaign = (campaign: MarketingCampaign) => {
    setSelectedCampaign(campaign)
    setDialogOpen(true)
  }

  const handleSaveCampaign = async (data: Partial<MarketingCampaign>) => {
    try {
      const supabase = createClient()
      const session = await supabase.auth.getSession()

      const isUpdate = !!selectedCampaign?.id
      const url = isUpdate
        ? `/api/marketing/campaigns/${selectedCampaign.id}`
        : '/api/marketing/campaigns'

      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const savedCampaign = await response.json()

        if (isUpdate) {
          setCampaigns(prev => prev.map(c => c.id === savedCampaign.id ? savedCampaign : c))
        } else {
          setCampaigns(prev => [savedCampaign, ...prev])
        }

        toast({
          title: isUpdate ? "Campaña actualizada" : "Campaña creada",
          description: `La campaña "${data.name}" se ha ${isUpdate ? 'actualizado' : 'creado'} correctamente.`,
        })
      } else {
        throw new Error('Failed to save campaign')
      }
    } catch (error) {
      console.error('Error saving campaign:', error)
      // Demo mode: update locally
      if (selectedCampaign) {
        setCampaigns(prev => prev.map(c => c.id === selectedCampaign.id ? { ...c, ...data } as MarketingCampaign : c))
      } else {
        const newCampaign: MarketingCampaign = {
          id: `demo-${Date.now()}`,
          organization_id: '',
          campaign_no: `CAMP-${String(campaigns.length + 1).padStart(3, '0')}`,
          name: data.name || '',
          description: data.description || '',
          type: data.type || 'email',
          status: data.status || 'draft',
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          target_audience: data.target_audience || {},
          budget: data.budget || 0,
          goals: data.goals || {},
          content: data.content || {},
          settings: data.settings || {},
          metrics: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0, leads: 0, conversions: 0 },
          created_by: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        }
        setCampaigns(prev => [newCampaign, ...prev])
      }
      toast({
        title: "Modo Demo",
        description: "Cambios guardados localmente (no conectado a la base de datos).",
      })
    }

    setDialogOpen(false)
    setSelectedCampaign(null)
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta campaña?')) return

    try {
      const supabase = createClient()
      const session = await supabase.auth.getSession()

      const response = await fetch(`/api/marketing/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
      })

      if (response.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== campaignId))
        toast({
          title: "Campaña eliminada",
          description: "La campaña se ha eliminado correctamente.",
        })
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      // Demo mode
      setCampaigns(prev => prev.filter(c => c.id !== campaignId))
      toast({
        title: "Campaña eliminada",
        description: "La campaña se ha eliminado (modo demo).",
      })
    }
  }

  const handleStatusChange = async (campaignId: string, status: MarketingCampaignStatus) => {
    try {
      const supabase = createClient()
      const session = await supabase.auth.getSession()

      const response = await fetch(`/api/marketing/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status } : c))
        toast({
          title: "Estado actualizado",
          description: `La campaña ahora está ${status === 'active' ? 'activa' : status === 'paused' ? 'pausada' : status}.`,
        })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      // Demo mode
      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status } : c))
      toast({
        title: "Estado actualizado (demo)",
        description: `La campaña ahora está ${status === 'active' ? 'activa' : status === 'paused' ? 'pausada' : status}.`,
      })
    }
  }

  const handleViewAnalytics = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId)
    if (!campaign) return

    // For demo, generate analytics from campaign data
    const analytics: CampaignAnalyticsType = {
      campaignId: campaign.id,
      campaignName: campaign.name,
      metrics: campaign.metrics || { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0, leads: 0, conversions: 0 },
      performance: {
        openRate: campaign.metrics?.sent ? Math.round((campaign.metrics.opened / campaign.metrics.sent) * 1000) / 10 : 0,
        clickRate: campaign.metrics?.opened ? Math.round((campaign.metrics.clicked / campaign.metrics.opened) * 1000) / 10 : 0,
        conversionRate: campaign.metrics?.leads ? Math.round((campaign.metrics.conversions / campaign.metrics.leads) * 1000) / 10 : 0,
        costPerLead: campaign.budget && campaign.metrics?.leads ? Math.round((campaign.budget / campaign.metrics.leads) * 100) / 100 : 0,
        roi: campaign.goals?.revenue && campaign.budget ? Math.round(((campaign.goals.revenue - campaign.budget) / campaign.budget) * 1000) / 10 : 0,
      },
      goals: campaign.goals || {},
      progress: {
        leadsProgress: campaign.goals?.leads ? Math.round((campaign.metrics?.leads || 0) / campaign.goals.leads * 100) : 0,
        conversionsProgress: campaign.goals?.conversions ? Math.round((campaign.metrics?.conversions || 0) / campaign.goals.conversions * 100) : 0,
      },
    }

    setAnalyticsData(analytics)
    setShowAnalytics(true)
  }

  return (
    <div className="min-h-full bg-[#0f1a4a] p-6">
      {/* Back Link */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link
          href="/pulse"
          className="inline-flex items-center gap-2 text-[#A1A1AA] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Pulse
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <Megaphone className="h-5 w-5" style={{ color: accentColor }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Campañas de Marketing</h1>
        </div>
        <p className="text-[#A1A1AA]">Crea, gestiona y analiza tus campañas de marketing</p>
      </motion.div>

      {/* Content */}
      {showAnalytics && analyticsData ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => setShowAnalytics(false)}
            className="mb-4 text-[#A1A1AA] hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Campañas
          </Button>
          <CampaignAnalytics analytics={analyticsData} accentColor={accentColor} />
        </motion.div>
      ) : (
        <CampaignsList
          campaigns={campaigns}
          isLoading={isLoading}
          accentColor={accentColor}
          onCreateCampaign={handleCreateCampaign}
          onEditCampaign={handleEditCampaign}
          onDeleteCampaign={handleDeleteCampaign}
          onViewAnalytics={handleViewAnalytics}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Campaign Dialog */}
      <CampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaign={selectedCampaign}
        onSave={handleSaveCampaign}
      />
    </div>
  )
}
