import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Trip,
  ItineraryItem,
  VisitedPlace,
  Expense,
} from "@/types/index";

const TRIP_ID = "sg-my-2026";

// Trip operations
export async function getOrCreateTrip(): Promise<Trip> {
  const tripRef = doc(db, "trips", TRIP_ID);
  const tripSnap = await getDoc(tripRef);

  if (tripSnap.exists()) {
    const data = tripSnap.data();
    return {
      ...(data as Trip),
      startDate: (data.startDate as Timestamp).toDate(),
      endDate: (data.endDate as Timestamp).toDate(),
      createdAt: (data.createdAt as Timestamp).toDate(),
    };
  }

  const newTrip: Trip = {
    id: TRIP_ID,
    name: "Singapore & Malaysia",
    startDate: new Date("2026-04-29"),
    endDate: new Date("2026-05-04"),
    budget: {
      SGD: 282,
      MYR: 1006,
    },
    exchangeRates: {
      SGD: 19000,
      MYR: 5500,
    },
    createdAt: new Date(),
  };

  await setDoc(tripRef, {
    ...newTrip,
    createdAt: Timestamp.fromDate(newTrip.createdAt),
    startDate: Timestamp.fromDate(newTrip.startDate),
    endDate: Timestamp.fromDate(newTrip.endDate),
  });

  return newTrip;
}

// Itinerary operations
export async function getItinerary(): Promise<ItineraryItem[]> {
  const q = query(
    collection(db, "itinerary"),
    where("tripId", "==", TRIP_ID)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map((doc) => ({
      ...(doc.data() as ItineraryItem),
      id: doc.id,
    }))
    .sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.order - b.order;
    });
}

export function subscribeToItinerary(
  callback: (items: ItineraryItem[]) => void
) {
  const q = query(
    collection(db, "itinerary"),
    where("tripId", "==", TRIP_ID)
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs
      .map((doc) => ({
        ...(doc.data() as ItineraryItem),
        id: doc.id,
      }))
      .sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return a.order - b.order;
      });
    callback(items);
  });
}

export async function addItineraryItems(items: Omit<ItineraryItem, "id">[]) {
  const batch = writeBatch(db);

  items.forEach((item) => {
    const docRef = doc(collection(db, "itinerary"));
    batch.set(docRef, { ...item, visited: false });
  });

  await batch.commit();
}

export async function toggleVisited(itemId: string, visited: boolean) {
  const itemRef = doc(db, "itinerary", itemId);
  await updateDoc(itemRef, { visited });
}

export async function updateItineraryItem(
  itemId: string,
  data: Partial<ItineraryItem>
) {
  const itemRef = doc(db, "itinerary", itemId);
  await updateDoc(itemRef, data);
}

// Visited places operations
export async function getVisitedPlaces(): Promise<VisitedPlace[]> {
  const q = query(
    collection(db, "visited_places"),
    where("tripId", "==", TRIP_ID)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    ...(doc.data() as Omit<VisitedPlace, "id" | "visitedAt">),
    id: doc.id,
    visitedAt: (doc.data().visitedAt as Timestamp).toDate(),
  }));
}

export function subscribeToVisitedPlaces(
  callback: (places: VisitedPlace[]) => void
) {
  const q = query(
    collection(db, "visited_places"),
    where("tripId", "==", TRIP_ID)
  );

  return onSnapshot(q, (snapshot) => {
    const places = snapshot.docs.map((doc) => ({
      ...(doc.data() as Omit<VisitedPlace, "id" | "visitedAt">),
      id: doc.id,
      visitedAt: (doc.data().visitedAt as Timestamp).toDate(),
    }));
    callback(places);
  });
}

export async function addVisitedPlace(
  itineraryItemId: string,
  data: Omit<VisitedPlace, "id" | "tripId" | "itineraryItemId">
) {
  const docRef = doc(collection(db, "visited_places"));
  await setDoc(docRef, {
    ...data,
    tripId: TRIP_ID,
    itineraryItemId,
    visitedAt: Timestamp.fromDate(data.visitedAt),
  });
  return docRef.id;
}

export async function updateVisitedPlace(
  placeId: string,
  data: Partial<VisitedPlace>
) {
  const docRef = doc(db, "visited_places", placeId);
  const updateData = { ...data };
  if (data.visitedAt) {
    updateData.visitedAt = Timestamp.fromDate(data.visitedAt) as any;
  }
  await updateDoc(docRef, updateData);
}

export async function deleteItineraryItem(itemId: string) {
  await deleteDoc(doc(db, "itinerary", itemId));
}

export async function deleteAllItineraryItems() {
  const q = query(
    collection(db, "itinerary"),
    where("tripId", "==", TRIP_ID)
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function deleteVisitedPlace(placeId: string) {
  const docRef = doc(db, "visited_places", placeId);
  await deleteDoc(docRef);
}

// Expense operations
export async function getExpenses(): Promise<Expense[]> {
  const q = query(
    collection(db, "expenses"),
    where("tripId", "==", TRIP_ID),
    orderBy("date", "desc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    ...(doc.data() as Omit<Expense, "id" | "date">),
    id: doc.id,
    date: (doc.data().date as Timestamp).toDate(),
  }));
}

export function subscribeToExpenses(callback: (expenses: Expense[]) => void) {
  const q = query(
    collection(db, "expenses"),
    where("tripId", "==", TRIP_ID),
    orderBy("date", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map((doc) => ({
      ...(doc.data() as Omit<Expense, "id" | "date">),
      id: doc.id,
      date: (doc.data().date as Timestamp).toDate(),
    }));
    callback(expenses);
  });
}

export async function addExpense(
  data: Omit<Expense, "id" | "tripId">
) {
  const docRef = doc(collection(db, "expenses"));
  await setDoc(docRef, {
    ...data,
    tripId: TRIP_ID,
    date: Timestamp.fromDate(data.date),
  });
  return docRef.id;
}

export async function getVisitedPlaceByItemId(
  itineraryItemId: string
): Promise<VisitedPlace | null> {
  const q = query(
    collection(db, "visited_places"),
    where("itineraryItemId", "==", itineraryItemId)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return {
    ...(doc.data() as Omit<VisitedPlace, "id" | "visitedAt">),
    id: doc.id,
    visitedAt: (doc.data().visitedAt as Timestamp).toDate(),
  };
}

export function subscribeToVisitedPlaceByItemId(
  itineraryItemId: string,
  callback: (place: VisitedPlace | null) => void
) {
  const q = query(
    collection(db, "visited_places"),
    where("itineraryItemId", "==", itineraryItemId)
  );
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
    } else {
      const doc = snapshot.docs[0];
      callback({
        ...(doc.data() as Omit<VisitedPlace, "id" | "visitedAt">),
        id: doc.id,
        visitedAt: (doc.data().visitedAt as Timestamp).toDate(),
      });
    }
  });
}
