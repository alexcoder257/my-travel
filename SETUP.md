# Travel Tracker App - Setup Guide

A Next.js application to track your travel itinerary, expenses, and visited places with Firebase integration.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment (optional):**
   - Copy `.env.local.example` to `.env.local`
   - Firebase config is already embedded in the code, no setup needed

3. **Seed the database:**
   ```bash
   npx ts-node scripts/seed-itinerary.ts
   ```
   
   This command will:
   - Create a trip document in Firestore
   - Add all 30+ itinerary items for the Singapore & Malaysia trip
   - Set up the database structure

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Features

### Dashboard
- View trip overview with dates
- Track progress (activities completed)
- Monitor budget vs actual spending in SGD and MYR
- See total spending in VND
- View next upcoming activity
- Quick links to other sections

### Itinerary View
- See all 6 days of planned activities
- Group by day with dates
- View estimated prices for each activity
- Mark activities as visited with checkmarks
- Add notes to activities

### Checklist (Main Feature)
- Select unvisited activities
- Upload photos to Firebase Storage
- Record actual prices paid
- Add notes about your visit
- View photos grid of visited places
- Delete/edit visited place records

### Expenses Tracker
- Quick add expense form
- Track spending by category (food, transport, activity, shopping, other)
- View budget vs actual for Singapore and Malaysia
- See category breakdown
- Currency support: SGD, MYR, VND
- Real-time calculations with automatic conversion

## 🏗️ Project Structure

```
src/
├── app/                      # Next.js app router pages
│   ├── page.tsx             # Dashboard
│   ├── itinerary/           # Itinerary view
│   ├── checklist/           # Visited places tracking
│   ├── expenses/            # Expense management
│   └── layout.tsx           # Root layout with navbar
├── components/              # React components
│   ├── Navbar.tsx          # Navigation bar
│   ├── ItineraryCard.tsx   # Activity card component
│   ├── PhotoUpload.tsx     # Photo upload handler
│   ├── ExpenseForm.tsx     # Quick expense form
│   └── ui/                 # shadcn/ui components
├── lib/                     # Utilities and services
│   ├── firebase.ts         # Firebase initialization
│   ├── firestore.ts        # Database operations
│   ├── storage.ts          # Image upload & compression
│   └── utils.ts            # Helper functions
├── hooks/                   # Custom React hooks
│   ├── useTrip.ts          # Trip data management
│   ├── useItinerary.ts     # Itinerary management
│   └── useExpenses.ts      # Expense calculations
├── types/                   # TypeScript interfaces
│   └── index.ts            # Type definitions
└── scripts/                 # Utility scripts
    └── seed-itinerary.ts   # Database seeding script
```

## 🗄️ Firestore Schema

### Collections

**trips**
- `id`: trip ID (sg-my-2026)
- `name`: "Singapore & Malaysia"
- `startDate`, `endDate`: Timestamps
- `budget`: { SGD: 282, MYR: 1006 }
- `exchangeRates`: { SGD: 19000, MYR: 5500 } (VND conversion rates)

**itinerary**
- `tripId`: Reference to trip
- `day`: Day number (1-6)
- `date`: "2026-04-29" format
- `time`: "12:50" format
- `location`: Place name
- `activity`: Activity description
- `estimatedPrice`: { amount: number, currency: "SGD"|"MYR"|"VND" }
- `visited`: boolean
- `notes`: string
- `order`: Order within the day

**visited_places**
- `tripId`: Reference to trip
- `itineraryItemId`: Reference to itinerary item
- `actualPrice`: { amount: number, currency: string }
- `imageUrls`: Array of Firebase Storage URLs
- `notes`: string
- `visitedAt`: Timestamp
- `location`: Optional geolocation { lat, lng }

**expenses**
- `tripId`: Reference to trip
- `category`: "food" | "transport" | "activity" | "shopping" | "other"
- `amount`: number
- `currency`: "SGD" | "MYR" | "VND"
- `description`: string
- `date`: Timestamp
- `imageUrl`: Optional receipt photo

## 📸 Firebase Storage

Images are stored in:
```
gs://bucket/trips/{tripId}/places/{placeId}/{filename}
```

Images are automatically:
- Compressed to max 1200px width
- Converted to JPEG format
- Saved with quality 0.8

## 💡 Usage Tips

1. **First Run**: Run the seed script to populate 30+ activities for all 6 days

2. **Tracking Progress**: 
   - Go to Checklist, select an activity
   - Upload at least one photo
   - Enter actual price spent
   - Add any notes
   - Save

3. **Budget Monitoring**:
   - Dashboard shows budget vs actual at a glance
   - Expenses page shows detailed breakdown
   - Currency automatically converts to VND

4. **Photos**:
   - Uploaded to Firebase Storage automatically
   - Can upload multiple photos per place
   - Images are compressed before upload
   - Click delete (X) to remove visited place record

## 🔐 Security

- Firebase rules should be set in Firestore console to protect data
- Images in Storage are publicly readable (from Firebase URL)
- Consider adding authentication if needed for multi-user support

## 📊 Data Conversion

Exchange rates (hardcoded, modify in `lib/firestore.ts`):
- 1 SGD = 19,000 VND
- 1 MYR = 5,500 VND

Update these in `Trip` document if rates change.

## 🚢 Deployment

### Vercel (Recommended)
```bash
vercel
```

### Other Platforms
```bash
npm run build
npm start
```

## 🐛 Troubleshooting

**"Itinerary not loading"**
- Run the seed script: `npx ts-node scripts/seed-itinerary.ts`
- Check Firestore console for data

**"Photos not uploading"**
- Check Firebase Storage rules in console
- Verify CORS is configured in Firebase
- Check browser console for errors

**"Budget calculations wrong"**
- Verify exchange rates in `lib/firestore.ts`
- Check all expenses have valid currency

## 📝 Notes

- All times and dates from the original Excel itinerary
- Estimated prices from the travel planning spreadsheet
- Photos are your own when you visit
- Expenses track actual spending vs budget

Enjoy tracking your Singapore & Malaysia adventure! 🎉
