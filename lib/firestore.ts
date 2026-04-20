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
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Trip,
  ItineraryItem,
  VisitedPlace,
  Expense,
} from "@/types/index";

// Trip operations
export async function getTrip(tripId: string): Promise<Trip | null> {
  const tripRef = doc(db, "trips", tripId);
  const tripSnap = await getDoc(tripRef);

  if (tripSnap.exists()) {
    const data = tripSnap.data();
    return {
      ...(data as Trip),
      countries: (data.countries as string[]) ?? ["sg", "my"],
      startDate: (data.startDate as Timestamp).toDate(),
      endDate: (data.endDate as Timestamp).toDate(),
      createdAt: (data.createdAt as Timestamp).toDate(),
    };
  }
  return null;
}

export async function createTrip(trip: Trip): Promise<void> {
  const tripRef = doc(db, "trips", trip.id);
  await setDoc(tripRef, {
    ...trip,
    createdAt: Timestamp.fromDate(trip.createdAt),
    startDate: Timestamp.fromDate(trip.startDate),
    endDate: Timestamp.fromDate(trip.endDate),
  });
}

export async function getTripsForUser(email: string, userId: string): Promise<Trip[]> {
  // Query trips where ownerId is userId OR roles[email] exists
  // Firestore doesn't support easy dynamic key query like resource.data.roles[email]
  // Better approach for SaaS: Use a collection 'members' or a flat array
  // For now, we'll query by ownerId and filter sharing in memory or use a separate collection

  const q = query(collection(db, "trips"), where("ownerId", "==", userId));
  const snap = await getDocs(q);
  const trips = snap.docs.map(d => ({
    ...d.data(),
    id: d.id,
    startDate: (d.data().startDate as Timestamp).toDate(),
    endDate: (d.data().endDate as Timestamp).toDate(),
    createdAt: (d.data().createdAt as Timestamp).toDate(),
  } as Trip));

  return trips;
}

// Itinerary operations
export function subscribeToItinerary(
  tripId: string,
  callback: (items: ItineraryItem[]) => void
) {
  const q = query(
    collection(db, "itinerary"),
    where("tripId", "==", tripId)
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

export async function addItineraryItems(tripId: string, items: Omit<ItineraryItem, "id" | "tripId">[]) {
  const batch = writeBatch(db);

  items.forEach((item) => {
    const docRef = doc(collection(db, "itinerary"));
    const data = Object.fromEntries(
      Object.entries({ ...item, tripId, visited: false }).filter(([, v]) => v !== undefined)
    );
    batch.set(docRef, data);
  });

  await batch.commit();
}

export async function toggleVisited(itemId: string, visited: boolean) {
  const itemRef = doc(db, "itinerary", itemId);
  await updateDoc(itemRef, { visited });
}

// Visited places operations
export function subscribeToVisitedPlaces(
  tripId: string,
  callback: (places: VisitedPlace[]) => void
) {
  const q = query(
    collection(db, "visited_places"),
    where("tripId", "==", tripId)
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
  tripId: string,
  itineraryItemId: string,
  data: Omit<VisitedPlace, "id" | "tripId" | "itineraryItemId">
) {
  const docRef = doc(collection(db, "visited_places"));
  await setDoc(docRef, {
    ...data,
    tripId,
    itineraryItemId,
    visitedAt: Timestamp.fromDate(data.visitedAt),
  });
  return docRef.id;
}

// Expenses operations
export function subscribeToExpenses(
  tripId: string,
  callback: (expenses: Expense[]) => void
) {
  const q = query(
    collection(db, "expenses"),
    where("tripId", "==", tripId),
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
  tripId: string,
  data: Omit<Expense, "id" | "tripId">
) {
  const docRef = doc(collection(db, "expenses"));
  await setDoc(docRef, {
    ...data,
    tripId,
    date: Timestamp.fromDate(data.date),
  });
  return docRef.id;
}

export async function updateTripRoles(tripId: string, email: string, role: "editor" | "viewer" | null) {
  const tripRef = doc(db, "trips", tripId);
  const field = `roles.${email.replace(/\./g, "_")}`; // Firestore keys can't have dots
  if (role === null) {
    await updateDoc(tripRef, { [field]: null });
  } else {
    await updateDoc(tripRef, { [field]: role });
  }
}

export async function deleteItineraryItem(itemId: string) {
  await deleteDoc(doc(db, "itinerary", itemId));
}

export async function deleteVisitedPlace(placeId: string) {
  await deleteDoc(doc(db, "visited_places", placeId));
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
