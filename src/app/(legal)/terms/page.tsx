import { Metadata } from "next"
import { FileText, Shield, Users, AlertTriangle, Scale, Globe, Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms and Conditions | KORE",
  description: "Terms and Conditions for using KORE platform",
}

const sections = [
  {
    id: "acceptance",
    icon: FileText,
    title: "1. Acceptance of Terms",
    content: `By accessing and using KORE ("the Platform"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.

These Terms of Service ("Terms") govern your access to and use of KORE's services, including our website, APIs, applications, and any other software or services offered by KORE.`,
  },
  {
    id: "services",
    icon: Globe,
    title: "2. Description of Services",
    content: `KORE provides an integrated business platform that includes:

• **The Core**: AI-powered assistant and automation
• **KORE Link**: Customer Relationship Management (CRM)
• **KORE Voice**: Telephony and communication services
• **KORE Meet**: Video conferencing and meetings
• **KORE Pulse**: Marketing automation and analytics
• **KORE Drive**: File storage and collaboration
• **KORE Planning**: Project and task management

We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.`,
  },
  {
    id: "accounts",
    icon: Users,
    title: "3. User Accounts",
    content: `To access certain features of the Platform, you must register for an account. When you register:

• You must provide accurate and complete information
• You are responsible for maintaining the security of your account credentials
• You must notify us immediately of any unauthorized use of your account
• You are responsible for all activities that occur under your account
• You must be at least 18 years old or have parental consent

We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    id: "acceptable-use",
    icon: Shield,
    title: "4. Acceptable Use Policy",
    content: `You agree not to use the Platform to:

• Violate any applicable laws or regulations
• Infringe upon the rights of others
• Transmit malware, viruses, or harmful code
• Attempt to gain unauthorized access to our systems
• Harass, abuse, or harm other users
• Send spam or unsolicited communications
• Engage in fraudulent activities
• Reverse engineer or attempt to extract source code
• Use the service for illegal purposes
• Resell or redistribute the service without authorization`,
  },
  {
    id: "data",
    icon: Shield,
    title: "5. Data and Privacy",
    content: `Your privacy is important to us. Our collection and use of personal data is governed by our Privacy Policy. By using our services, you consent to:

• The collection and processing of your data as described in our Privacy Policy
• The storage of your data on secure servers
• The use of cookies and similar technologies
• Data transfers in accordance with applicable laws

You retain ownership of all data you upload to the Platform. We claim no intellectual property rights over your content.`,
  },
  {
    id: "payment",
    icon: Scale,
    title: "6. Payment Terms",
    content: `For paid services:

• Fees are billed in advance on a monthly or annual basis
• All fees are non-refundable except as required by law
• We may change our prices with 30 days notice
• You are responsible for all applicable taxes
• Failed payments may result in service suspension
• Cancellation takes effect at the end of the current billing period

Free tier limitations and features are subject to change.`,
  },
  {
    id: "liability",
    icon: AlertTriangle,
    title: "7. Limitation of Liability",
    content: `THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW:

• We disclaim all warranties, express or implied
• We are not liable for any indirect, incidental, or consequential damages
• Our total liability is limited to the amount you paid us in the past 12 months
• We are not responsible for third-party services or content

Some jurisdictions do not allow the exclusion of certain warranties, so some of the above may not apply to you.`,
  },
  {
    id: "termination",
    icon: AlertTriangle,
    title: "8. Termination",
    content: `Either party may terminate this agreement at any time:

• You may cancel your account through settings or by contacting support
• We may suspend or terminate your access for violations of these terms
• Upon termination, your right to use the service ceases immediately
• We may retain certain data as required by law or for legitimate business purposes
• Provisions that by their nature should survive termination will remain in effect`,
  },
  {
    id: "changes",
    icon: FileText,
    title: "9. Changes to Terms",
    content: `We may modify these Terms at any time. When we do:

• We will post the updated terms on our website
• We will update the "Last Updated" date
• Material changes will be notified via email or in-app notification
• Continued use after changes constitutes acceptance of new terms

We encourage you to review these Terms periodically.`,
  },
  {
    id: "contact",
    icon: Mail,
    title: "10. Contact Information",
    content: `If you have any questions about these Terms, please contact us:

**Email**: legal@kore.ai
**Address**: 123 Innovation Drive, Tech City, TC 12345
**Support**: support@kore.ai

For urgent legal matters, please include "URGENT" in your subject line.`,
  },
]

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-[#00E5FF]/20 to-[#00E5FF]/5 mb-6">
          <FileText className="h-8 w-8 text-[#00E5FF]" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Terms and Conditions
        </h1>
        <p className="text-lg text-[#A1A1AA] max-w-2xl mx-auto">
          Please read these terms carefully before using our services.
        </p>
        <p className="text-sm text-[#A1A1AA] mt-4">
          Last Updated: December 8, 2025
        </p>
      </div>

      {/* Table of Contents */}
      <div className="mb-12 p-6 rounded-2xl bg-white/5 border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-4">Table of Contents</h2>
        <nav className="grid sm:grid-cols-2 gap-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#00E5FF] transition-colors py-1"
            >
              <section.icon className="h-4 w-4" />
              {section.title}
            </a>
          ))}
        </nav>
      </div>

      {/* Sections */}
      <div className="space-y-12">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-[#00E5FF]/20 to-[#00E5FF]/5 flex items-center justify-center">
                <section.icon className="h-5 w-5 text-[#00E5FF]" />
              </div>
              <h2 className="text-2xl font-bold text-white pt-1">{section.title}</h2>
            </div>
            <div className="pl-14">
              <div className="prose prose-invert prose-sm max-w-none">
                {section.content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-[#A1A1AA] leading-relaxed whitespace-pre-line mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Agreement Notice */}
      <div className="mt-16 p-6 rounded-2xl bg-gradient-to-r from-[#00E5FF]/10 to-[#8B5CF6]/10 border border-white/10">
        <p className="text-center text-[#A1A1AA]">
          By using KORE, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
        </p>
      </div>
    </div>
  )
}
