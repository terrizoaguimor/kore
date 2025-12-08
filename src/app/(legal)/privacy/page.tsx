import { Metadata } from "next"
import {
  Shield,
  Lock,
  Eye,
  Database,
  Globe,
  Cookie,
  UserCheck,
  Bell,
  Trash2,
  Mail,
  Server,
  Key
} from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy & Security | KORE",
  description: "Learn how KORE protects your data and privacy",
}

const privacySections = [
  {
    id: "overview",
    icon: Shield,
    title: "Privacy Overview",
    content: `At KORE, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.

We are committed to protecting your personal data and being transparent about what information we collect and how we use it. This policy applies to all KORE services and products.`,
  },
  {
    id: "data-collection",
    icon: Database,
    title: "Information We Collect",
    content: `We collect information you provide directly:

• **Account Information**: Name, email, phone number, company name
• **Profile Data**: Avatar, preferences, settings
• **Content**: Files, documents, messages, and other content you upload
• **Communications**: Support requests, feedback, surveys
• **Payment Information**: Billing details (processed by secure payment providers)

We automatically collect:

• **Usage Data**: Features used, interactions, timestamps
• **Device Information**: Browser type, OS, device identifiers
• **Log Data**: IP addresses, access times, pages viewed
• **Location Data**: General location based on IP (with consent for precise location)`,
  },
  {
    id: "data-use",
    icon: Eye,
    title: "How We Use Your Data",
    content: `We use your information to:

• **Provide Services**: Operate and maintain the platform
• **Personalize Experience**: Customize content and recommendations
• **Communication**: Send service updates, security alerts, support messages
• **Analytics**: Understand usage patterns and improve our services
• **Security**: Detect and prevent fraud, abuse, and security threats
• **Legal Compliance**: Meet regulatory and legal obligations
• **AI Enhancement**: Improve our AI models (with anonymized data only)

We never sell your personal data to third parties.`,
  },
  {
    id: "data-sharing",
    icon: Globe,
    title: "Data Sharing & Third Parties",
    content: `We may share your information with:

• **Service Providers**: Cloud hosting, payment processing, analytics
• **Business Partners**: With your consent for integrations
• **Legal Requirements**: When required by law or to protect rights
• **Business Transfers**: In case of merger, acquisition, or sale

All third-party providers are bound by strict data protection agreements. We conduct regular audits of our partners' security practices.`,
  },
  {
    id: "cookies",
    icon: Cookie,
    title: "Cookies & Tracking",
    content: `We use cookies and similar technologies for:

• **Essential Cookies**: Required for basic functionality
• **Performance Cookies**: Analytics and performance monitoring
• **Functional Cookies**: Remember preferences and settings
• **Marketing Cookies**: Personalized advertising (with consent)

You can manage cookie preferences through your browser settings or our cookie consent tool. Some features may not work properly with cookies disabled.`,
  },
  {
    id: "rights",
    icon: UserCheck,
    title: "Your Rights",
    content: `Depending on your location, you may have the right to:

• **Access**: Request a copy of your personal data
• **Correction**: Update inaccurate information
• **Deletion**: Request deletion of your data ("right to be forgotten")
• **Portability**: Receive your data in a portable format
• **Objection**: Object to certain processing activities
• **Restriction**: Limit how we process your data
• **Withdraw Consent**: Revoke previously given consent

To exercise these rights, contact us at privacy@kore.ai`,
  },
  {
    id: "retention",
    icon: Trash2,
    title: "Data Retention",
    content: `We retain your data for as long as:

• Your account is active
• Needed to provide services
• Required for legal obligations
• Necessary to resolve disputes

After account deletion:
• Personal data is deleted within 30 days
• Backup data is purged within 90 days
• Anonymized analytics may be retained indefinitely
• Legal compliance data retained as required by law`,
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Communications",
    content: `We may contact you about:

• **Service Updates**: Important changes to the platform
• **Security Alerts**: Potential security issues
• **Account Notifications**: Activity related to your account
• **Marketing**: Product news and offers (opt-out available)

You can manage communication preferences in your account settings. Some service-related communications cannot be opted out of.`,
  },
]

const securityFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All data is encrypted in transit and at rest using AES-256 encryption",
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "SOC 2 Type II certified data centers with 24/7 monitoring",
  },
  {
    icon: Key,
    title: "Access Controls",
    description: "Role-based access, MFA, and SSO for enterprise security",
  },
  {
    icon: Shield,
    title: "Regular Audits",
    description: "Annual penetration testing and security assessments",
  },
]

const certifications = [
  { name: "SOC 2 Type II", status: "Certified" },
  { name: "GDPR", status: "Compliant" },
  { name: "CCPA", status: "Compliant" },
  { name: "ISO 27001", status: "In Progress" },
  { name: "HIPAA", status: "Available" },
]

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-[#10B981]/20 to-[#10B981]/5 mb-6">
          <Shield className="h-8 w-8 text-[#10B981]" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Privacy & Security
        </h1>
        <p className="text-lg text-[#A1A1AA] max-w-2xl mx-auto">
          Your data security is our top priority. Learn how we protect your information.
        </p>
        <p className="text-sm text-[#A1A1AA] mt-4">
          Last Updated: December 8, 2025
        </p>
      </div>

      {/* Security Features Grid */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Security at a Glance</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {securityFeatures.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#10B981]/30 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-[#10B981]/20 to-[#10B981]/5 flex items-center justify-center group-hover:from-[#10B981]/30 group-hover:to-[#10B981]/10 transition-all">
                  <feature.icon className="h-6 w-6 text-[#10B981]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-[#A1A1AA]">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="mb-16 p-6 rounded-2xl bg-gradient-to-r from-[#10B981]/10 to-[#00E5FF]/10 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4 text-center">Compliance & Certifications</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {certifications.map((cert, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
            >
              <span className="text-sm font-medium text-white">{cert.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                cert.status === "Certified"
                  ? "bg-[#10B981]/20 text-[#10B981]"
                  : cert.status === "Compliant"
                  ? "bg-[#00E5FF]/20 text-[#00E5FF]"
                  : cert.status === "Available"
                  ? "bg-[#8B5CF6]/20 text-[#8B5CF6]"
                  : "bg-[#FFB830]/20 text-[#FFB830]"
              }`}>
                {cert.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Table of Contents */}
      <div className="mb-12 p-6 rounded-2xl bg-white/5 border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-4">Privacy Policy Sections</h2>
        <nav className="grid sm:grid-cols-2 gap-2">
          {privacySections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#10B981] transition-colors py-1"
            >
              <section.icon className="h-4 w-4" />
              {section.title}
            </a>
          ))}
        </nav>
      </div>

      {/* Privacy Sections */}
      <div className="space-y-12">
        {privacySections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-[#10B981]/20 to-[#10B981]/5 flex items-center justify-center">
                <section.icon className="h-5 w-5 text-[#10B981]" />
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

      {/* Contact Section */}
      <div className="mt-16 p-8 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#00E5FF]/20 to-[#00E5FF]/5 flex items-center justify-center">
            <Mail className="h-6 w-6 text-[#00E5FF]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Questions or Concerns?</h2>
            <p className="text-sm text-[#A1A1AA]">Our privacy team is here to help</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-sm text-[#A1A1AA] mb-1">Data Protection Officer</p>
            <a href="mailto:dpo@kore.ai" className="text-[#00E5FF] hover:underline">dpo@kore.ai</a>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-sm text-[#A1A1AA] mb-1">Privacy Inquiries</p>
            <a href="mailto:privacy@kore.ai" className="text-[#00E5FF] hover:underline">privacy@kore.ai</a>
          </div>
        </div>
      </div>
    </div>
  )
}
