import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  deleteField,
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
export function subscribeToTrip(
  tripId: string,
  callback: (trip: Trip | null) => void
) {
  const tripRef = doc(db, "trips", tripId);
  return onSnapshot(tripRef, (snap) => {
    if (!snap.exists()) { callback(null); return; }
    const data = snap.data();
    callback({
      ...(data as Trip),
      id: snap.id,
      countries: (data.countries as string[]) ?? ["sg", "my"],
      startDate: (data.startDate as Timestamp).toDate(),
      endDate: (data.endDate as Timestamp).toDate(),
      createdAt: (data.createdAt as Timestamp).toDate(),
    });
  });
}

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

function mapTripDoc(d: { data: () => Record<string, unknown>; id: string }): Trip {
  const data = d.data();
  return {
    ...(data as unknown as Trip),
    id: d.id,
    startDate: (data.startDate as Timestamp).toDate(),
    endDate: (data.endDate as Timestamp).toDate(),
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
}

export async function getTripsForUser(email: string, userId: string): Promise<Trip[]> {
  // Query 1: trips owned by user
  const ownerQuery = query(collection(db, "trips"), where("ownerId", "==", userId));

  // Query 2: trips where user has a role (viewer or editor)
  const safeEmail = email.replace(/\./g, "_");
  const sharedQuery = query(
    collection(db, "trips"),
    where(`roles.${safeEmail}`, "in", ["editor", "viewer"])
  );

  const [ownerSnap, sharedSnap] = await Promise.all([
    getDocs(ownerQuery),
    getDocs(sharedQuery),
  ]);

  const seen = new Set<string>();
  const trips: Trip[] = [];

  for (const d of [...ownerSnap.docs, ...sharedSnap.docs]) {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      trips.push(mapTripDoc(d as Parameters<typeof mapTripDoc>[0]));
    }
  }

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

export async function updateVisitedPlace(
  placeId: string,
  data: Partial<VisitedPlace>
) {
  const docRef = doc(db, "visited_places", placeId);
  const { visitedAt, ...rest } = data;
  const updateData: Record<string, unknown> = { ...rest };
  if (visitedAt) {
    updateData.visitedAt = Timestamp.fromDate(visitedAt);
  }
  await updateDoc(docRef, updateData);
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
    await updateDoc(tripRef, { [field]: deleteField() });
  } else {
    await updateDoc(tripRef, { [field]: role });
  }
}

export async function deleteTrip(tripId: string) {
  // Xóa trip document
  await deleteDoc(doc(db, "trips", tripId));

  // Xóa toàn bộ itinerary items của trip
  const itinerarySnap = await getDocs(
    query(collection(db, "itinerary"), where("tripId", "==", tripId))
  );
  const batch1 = writeBatch(db);
  itinerarySnap.docs.forEach((d) => batch1.delete(d.ref));
  if (itinerarySnap.docs.length > 0) await batch1.commit();

  // Xóa toàn bộ visited places của trip
  const visitedSnap = await getDocs(
    query(collection(db, "visited_places"), where("tripId", "==", tripId))
  );
  const batch2 = writeBatch(db);
  visitedSnap.docs.forEach((d) => batch2.delete(d.ref));
  if (visitedSnap.docs.length > 0) await batch2.commit();
}

export async function deleteItineraryItem(itemId: string) {
  await deleteDoc(doc(db, "itinerary", itemId));
}

export async function deleteAllItineraryItems(tripId: string) {
  const q = query(
    collection(db, "itinerary"),
    where("tripId", "==", tripId)
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function sortDayByTime(day: number): Promise<void> {
  const q = query(collection(db, "itinerary"), where("day", "==", day));
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as { time?: string; order?: number }),
  }));
  const sorted = [...items].sort((a, b) => {
    const aTime = (a.time?.split("–")[0] ?? "").trim();
    const bTime = (b.time?.split("–")[0] ?? "").trim();
    if (!aTime && !bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;
    return aTime.localeCompare(bTime);
  });
  const batch = writeBatch(db);
  sorted.forEach((item, idx) => {
    batch.update(doc(db, "itinerary", item.id), { order: idx });
  });
  await batch.commit();
}

export async function updateItineraryItem(
  itemId: string,
  data: Partial<import("@/types/index").ItineraryItem>
) {
  const itemRef = doc(db, "itinerary", itemId);
  await updateDoc(itemRef, data);
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
