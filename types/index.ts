export interface Trip {
  id: string;
  name: string;
  countries: string[]; // e.g. ['sg','my']
  startDate: Date;
  endDate: Date;
  budget: {
    SGD: number;
    MYR: number;
  };
  exchangeRates: {
    SGD: number;
    MYR: number;
  };
  createdAt: Date;
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  day: number;
  date: string;
  time: string;
  location: string;
  activity: string;
  estimatedPrice: {
    amount: number;
    currency: "SGD" | "MYR" | "VND";
  };
  visited: boolean;
  notes: string;
  order: number;
  mapUrl?: string;
  category?: "food" | "place" | "transport" | "other";
}

export interface VisitedPlace {
  id: string;
  tripId: string;
  itineraryItemId: string;
  foodCost: {
    amount: number;
    currency: "SGD" | "MYR" | "VND";
  };
  transportCost: {
    amount: number;
    currency: "SGD" | "MYR" | "VND";
  };
  imageUrls: string[];
  notes: string;
  visitedAt: Date;
}

export interface Expense {
  id: string;
  tripId: string;
  category: "food" | "transport" | "activity" | "shopping" | "other";
  amount: number;
  currency: "SGD" | "MYR" | "VND";
  description: string;
  date: Date;
  imageUrl?: string;
}

export interface CurrencyRate {
  currency: "SGD" | "MYR";
  toVND: number;
  updatedAt: Date;
}
