// ============================================
// TENANT ISOLATION UTILITIES
// Centralized functions for multi-tenant security
// ============================================

import { createClient } from "@/lib/supabase/server"

export interface TenantContext {
  userId: string
  organizationId: string
  organizationSlug: string
  organizationName: string
  role: "owner" | "admin" | "member" | "guest"
  isAdmin: boolean
  isOwner: boolean
}

export interface TenantValidationResult {
  isValid: boolean
  context?: TenantContext
  error?: string
}

/**
 * Get the current user's tenant context
 * Returns null if user is not authenticated or doesn't belong to an organization
 */
export async function getTenantContext(): Promise<TenantValidationResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { isValid: false, error: "Unauthorized" }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Get user's organization membership with org details
    const { data: membership, error } = await sb
      .from("organization_members")
      .select(`
        organization_id,
        role,
        organizations (
          id,
          slug,
          name
        )
      `)
      .eq("user_id", user.id)
      .single()

    if (error || !membership) {
      return { isValid: false, error: "No organization found" }
    }

    const role = membership.role as TenantContext["role"]

    return {
      isValid: true,
      context: {
        userId: user.id,
        organizationId: membership.organization_id,
        organizationSlug: membership.organizations?.slug || "",
        organizationName: membership.organizations?.name || "",
        role,
        isAdmin: role === "owner" || role === "admin",
        isOwner: role === "owner",
      },
    }
  } catch (error) {
    console.error("[Tenant] Error getting context:", error)
    return { isValid: false, error: "Internal error" }
  }
}

/**
 * Validate that a resource belongs to the user's organization
 */
export async function validateResourceAccess(
  table: string,
  resourceId: string,
  organizationIdColumn: string = "organization_id"
): Promise<{ hasAccess: boolean; resource?: Record<string, unknown> }> {
  const { isValid, context } = await getTenantContext()

  if (!isValid || !context) {
    return { hasAccess: false }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: resource } = await sb
    .from(table)
    .select("*")
    .eq("id", resourceId)
    .eq(organizationIdColumn, context.organizationId)
    .single()

  return {
    hasAccess: !!resource,
    resource,
  }
}

/**
 * Get a Supabase query builder pre-filtered by organization
 */
export async function getOrgFilteredQuery(table: string) {
  const { isValid, context } = await getTenantContext()

  if (!isValid || !context) {
    throw new Error("Unauthorized")
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  return {
    query: sb.from(table).select("*").eq("organization_id", context.organizationId),
    context,
    supabase: sb,
  }
}

/**
 * Create a helper object for tenant-isolated database operations
 */
export async function createTenantClient() {
  const { isValid, context, error } = await getTenantContext()

  if (!isValid || !context) {
    return { error: error || "Unauthorized", context: null, db: null }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  return {
    error: null,
    context,
    db,
    // Helper methods
    select: (table: string, columns: string = "*") =>
      db.from(table).select(columns).eq("organization_id", context.organizationId),

    insert: (table: string, data: Record<string, unknown>) =>
      db.from(table).insert({ ...data, organization_id: context.organizationId }),

    update: (table: string, id: string, data: Record<string, unknown>) =>
      db
        .from(table)
        .update(data)
        .eq("id", id)
        .eq("organization_id", context.organizationId),

    delete: (table: string, id: string) =>
      db
        .from(table)
        .delete()
        .eq("id", id)
        .eq("organization_id", context.organizationId),
  }
}

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse() {
  return { success: false, error: "Unauthorized" }
}

/**
 * Standard not found response
 */
export function notFoundResponse() {
  return { success: false, error: "Resource not found or access denied" }
}
