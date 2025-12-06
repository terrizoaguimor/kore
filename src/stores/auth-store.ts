import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Organization, OrganizationMember } from "@/types/database"

interface AuthState {
  user: User | null
  organization: Organization | null
  membership: OrganizationMember | null
  organizations: Organization[]
  isLoading: boolean
  isInitialized: boolean

  setUser: (user: User | null) => void
  setOrganization: (organization: Organization | null) => void
  setMembership: (membership: OrganizationMember | null) => void
  setOrganizations: (organizations: Organization[]) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  switchOrganization: (organizationId: string) => void
  reset: () => void
}

const initialState = {
  user: null,
  organization: null,
  membership: null,
  organizations: [],
  isLoading: true,
  isInitialized: false,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      setOrganization: (organization) => set({ organization }),
      setMembership: (membership) => set({ membership }),
      setOrganizations: (organizations) => set({ organizations }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),

      switchOrganization: (organizationId) => {
        const { organizations } = get()
        const organization = organizations.find((org) => org.id === organizationId)
        if (organization) {
          set({ organization })
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: "cloudhub-auth",
      partialize: (state) => ({
        organization: state.organization,
      }),
    }
  )
)
