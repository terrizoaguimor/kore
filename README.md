<p align="center">
  <img src="public/favicon.svg" width="80" height="80" alt="KORE Logo">
</p>

<h1 align="center">KORE</h1>

<p align="center">
  <strong>El origen de todo. | The origin of everything.</strong>
</p>

<p align="center">
  Suite completa de CRM Marketing | Complete CRM Marketing Suite
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#modules">Modules</a> •
  <a href="#license">License</a>
</p>

---

## Overview

KORE is a comprehensive, all-in-one business platform that combines CRM, marketing automation, file management, collaboration tools, and communication features into a single, powerful solution.

Built with modern technologies and designed for scalability, KORE provides everything your business needs to manage customer relationships, execute marketing campaigns, and collaborate effectively.

## Features

### Core Modules

- **Files** - Cloud file storage with sharing, versioning, and collaboration
- **Calendar** - Event management, scheduling, and team calendars
- **Contacts** - Contact management with groups and custom fields
- **Talk** - Real-time chat and video conferencing
- **Office** - Document, spreadsheet, and presentation editors (in-house, no external dependencies)
- **Tasks** - Kanban boards and task management
- **Notes** - Rich text note-taking

### Business Modules

- **Link (CRM)** - Complete CRM with leads, deals, companies, contacts, and invoices
- **Pulse (Marketing)** - Email marketing, social media management, campaigns, and analytics
- **Voice** - VoIP calls, WhatsApp Business integration, call logs, and voicemail

### Platform Features

- Multi-tenant architecture
- Role-based access control
- Real-time collaboration
- Dark/Light theme support
- Internationalization (English & Spanish)
- Interactive particle effects UI
- Responsive design

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Rich Text Editor**: [TipTap](https://tiptap.dev/)
- **Animations**: [Motion](https://motion.dev/)
- **i18n**: [next-intl](https://next-intl-docs.vercel.app/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/terrizoaguimor/kore.git
cd kore
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` with Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Modules

### Files
Cloud storage with drag-and-drop upload, file preview, sharing links, and version history.

### Calendar
Full-featured calendar with day/week/month views, event creation, reminders, and calendar sharing.

### Contacts
Contact management with custom fields, groups, import/export, and integration with other modules.

### Talk
Real-time messaging with channels, direct messages, file sharing, and video calls.

### Office
In-house document editing suite:
- **Documents**: TipTap-based rich text editor
- **Spreadsheets**: Custom spreadsheet with formula support (SUM, AVERAGE, COUNT, MIN, MAX)
- **Presentations**: Slide editor with drag-and-drop elements

### Link (CRM)
Complete CRM system:
- Lead management and scoring
- Deal pipeline with stages
- Company profiles
- Contact relationships
- Invoice generation

### Pulse (Marketing)
Marketing automation platform:
- Email campaigns with templates
- Social media scheduling
- Audience segmentation
- Campaign analytics
- A/B testing

### Voice
Communication hub:
- VoIP calling
- WhatsApp Business integration
- Call logs and analytics
- Voicemail management

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── admin/             # Admin panel
│   └── api/               # API routes
├── components/
│   ├── ui/                # Base UI components (shadcn)
│   ├── layout/            # Layout components
│   ├── files/             # File module components
│   ├── calendar/          # Calendar components
│   ├── contacts/          # Contact components
│   ├── talk/              # Chat/Video components
│   ├── office/            # Document editors
│   ├── voice/             # Voice/WhatsApp components
│   ├── link/              # CRM components
│   └── pulse/             # Marketing components
├── lib/                   # Utilities and configurations
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
├── types/                 # TypeScript types
└── i18n/                  # Internationalization
```

## Contributing

This is a proprietary project. For inquiries about contributing or licensing, please contact the author.

## Author

**Mario Gutierrez**
- GitHub: [@terrizoaguimor](https://github.com/terrizoaguimor)

## License

Copyright © 2024 Mario Gutierrez. All rights reserved.

See [LICENSE](LICENSE) for more information.

---

<p align="center">
  Made with ❤️ by Mario Gutierrez
</p>
