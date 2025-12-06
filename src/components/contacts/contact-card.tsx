"use client"

import {
  User,
  Building2,
  Mail,
  Phone,
  Star,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Contact, ContactEmail, ContactPhone, ContactAddress } from "@/types/database"

interface ContactWithDetails extends Contact {
  emails?: ContactEmail[]
  phones?: ContactPhone[]
  addresses?: ContactAddress[]
}

interface ContactCardProps {
  contact: ContactWithDetails
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleStar: () => void
}

export function ContactCard({
  contact,
  onClick,
  onEdit,
  onDelete,
  onToggleStar,
}: ContactCardProps) {
  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(" ")
  const displayName = fullName || contact.organization || "Unnamed Contact"
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (contact.organization || "?")[0].toUpperCase()

  const primaryEmail = contact.emails?.find((e) => e.is_primary) || contact.emails?.[0]
  const primaryPhone = contact.phones?.find((p) => p.is_primary) || contact.phones?.[0]

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={contact.photo_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{displayName}</h3>
                  {contact.is_starred && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                  )}
                </div>

                {contact.organization && fullName && (
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {contact.job_title ? `${contact.job_title} at ${contact.organization}` : contact.organization}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onToggleStar}>
                    <Star
                      className={cn(
                        "mr-2 h-4 w-4",
                        contact.is_starred && "fill-yellow-400 text-yellow-400"
                      )}
                    />
                    {contact.is_starred ? "Remove star" : "Add star"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-2 space-y-1">
              {primaryEmail && (
                <a
                  href={`mailto:${primaryEmail.email}`}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  {primaryEmail.email}
                </a>
              )}
              {primaryPhone && (
                <a
                  href={`tel:${primaryPhone.phone}`}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  {primaryPhone.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
