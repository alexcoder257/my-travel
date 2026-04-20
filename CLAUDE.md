# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev`: Start Next.js development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Database & Scripts
- `npx ts-node scripts/seed-itinerary.ts`: Seed Firestore with itinerary data for Singapore & Malaysia trip

## Architecture & Data Model

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (for trip photos)
- **Styling**: Tailwind CSS 4, shadcn/ui, Framer Motion
- **State Management**: React Context (`TripDataContext`)

### Core Architecture
- `contexts/TripDataContext.tsx`: The single source of truth for all Firestore real-time data. It uses persistent listeners to minimize Firestore reads and ensures consistent state across pages.
- `lib/firestore.ts`: Contains all Firestore operations, subscriptions, and database logic.
- `lib/storage.ts`: Handles image upload, compression (to 1200px JPEG), and Firebase Storage management.

### Data Types (`types/index.ts`)
- `Trip`: Metadata about the journey (dates, budgets, exchange rates).
- `ItineraryItem`: Planned activities for each day.
- `VisitedPlace`: Records of actual visits, including costs and photos.
- `Expense`: Ad-hoc expenses categorized by type.

### Key Directories
- `app/`: Next.js App Router pages (Dashboard, Itinerary, Checklist, Expenses).
- `components/`: UI components, including `shadcn/ui` in `components/ui/`.
- `lib/`: Business logic, Firebase services, and utility functions.
- `scripts/`: Maintenance and data seeding scripts.

### Business Logic
- **Currency**: Primarily handles SGD, MYR, and VND. Exchange rates are stored in the `Trip` document but have hardcoded defaults in `lib/firestore.ts`.
- **Image Processing**: Images are compressed client-side before upload to Firebase Storage.
