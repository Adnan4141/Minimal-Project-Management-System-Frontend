# Frontend - Project Management System

Modern Next.js 15 frontend application with React 18, TypeScript, and Redux Toolkit for the Project Management System.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 18
- **Language:** TypeScript
- **State Management:** Redux Toolkit with RTK Query
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Forms:** React Hook Form with Zod validation
- **OAuth:** @react-oauth/google, react-facebook-login
- **Charts:** Recharts
- **Real-time:** Socket.IO Client

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

Application will be available at `http://localhost:3000`

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── dashboard/    # Dashboard page
│   ├── projects/     # Project pages (list, detail, create)
│   ├── tasks/        # Task pages (list, detail, kanban)
│   ├── teams/        # Team management pages
│   ├── time-log/     # Time logging page
│   ├── reports/      # Reports & analytics
│   └── login/        # Authentication pages
├── components/       # React components
│   ├── auth/         # Authentication components
│   ├── layout/       # Layout components (Header, Sidebar)
│   ├── providers/    # Context providers
│   └── ui/           # Reusable UI components
├── lib/              # Utilities and configurations
│   ├── api/          # RTK Query API slices
│   ├── slices/       # Redux slices
│   ├── hooks.ts      # Custom hooks
│   └── utils.ts      # Helper functions
├── hooks/            # Custom React hooks
├── config/           # Configuration files
└── types/            # TypeScript type definitions
```

## Key Features

- ✅ User authentication (email/password + OAuth)
- ✅ Role-based dashboard (Admin, Manager, Member)
- ✅ Project management with progress tracking
- ✅ Sprint management with numbered sprints
- ✅ Task management with status workflow
- ✅ Kanban board with drag-and-drop
- ✅ Time logging and tracking
- ✅ Team member management
- ✅ Reports and analytics
- ✅ Real-time updates
- ✅ Responsive design

## Pages

- **Dashboard** (`/dashboard`) - Overview with stats and recent activity
- **Projects** (`/projects`) - Project list with filters
- **Project Detail** (`/projects/[id]`) - Project details, sprints, progress
- **Tasks** (`/tasks`) - Task list with filters
- **Task Detail** (`/tasks/[id]`) - Full task details, comments, time logs
- **Kanban** (`/tasks/kanban`) - Drag-and-drop task board
- **Teams** (`/teams`) - Team member management
- **Time Log** (`/time-log`) - Personal time tracking
- **Reports** (`/reports`) - Analytics and reports (Admin/Manager)

## Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_API_PREFIX=/api

# OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
```

## State Management

Uses Redux Toolkit with RTK Query for:
- **Auth State:** User session, tokens, permissions
- **API Caching:** Automatic caching and invalidation
- **Optimistic Updates:** Better UX with instant feedback

## UI Components

Built with Radix UI primitives:
- Button, Card, Input, Textarea, Select
- Modal, Dropdown, Badge
- Toast notifications
- Loading states

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

## Authentication Flow

1. User logs in via email/password or OAuth
2. Backend returns access token + refresh token
3. Tokens stored in Redux state and localStorage
4. Access token sent with each API request
5. Automatic token refresh on expiration

## License

Private project - All rights reserved

