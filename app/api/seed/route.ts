import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  writeBatch,
  Timestamp,
} from "firebase/firestore";

const TRIP_ID = "sg-my-2026";

const itineraryData = [
  // Day 1: Wed 29/4 - Singapore Arrival
  { day: 1, date: "2026-04-29", time: "12:50", location: "Hanoi", activity: "✈️ Depart for Singapore (Scoot)", estimatedPrice: { amount: 0, currency: "SGD" }, notes: "Flight to Singapore Changi", order: 1 },
  { day: 1, date: "2026-04-29", time: "17:10", location: "Singapore Changi Airport T1", activity: "🛄 Collect baggage & get SIM card", estimatedPrice: { amount: 0, currency: "SGD" }, notes: "Get SIM at Travelex/Cheers, drop luggage", order: 2 },
  { day: 1, date: "2026-04-29", time: "17:30", location: "Jewel Changi Airport", activity: "💎 Explore Jewel (Rain Vortex, photos)", estimatedPrice: { amount: 20, currency: "SGD" }, notes: "Food Court B2, Solce Studio (free photobooth)", order: 3 },
  { day: 1, date: "2026-04-29", time: "19:30", location: "Changi → Aljunied MRT", activity: "🚇 MRT to Hotel", category: "transport", estimatedPrice: { amount: 3.78, currency: "SGD" }, notes: "[CG] Changi T2 -> [EW] Tanah Merah (Transfer) -> [EW] Aljunied -> Walk 8 min", order: 4 },
  { day: 1, date: "2026-04-29", time: "20:00", location: "Old Chang Kee, Geylang", activity: "🍢 Old Chang Kee (fried chicken + cuttlefish)", estimatedPrice: { amount: 10, currency: "SGD" }, notes: "Fried chicken + cuttlefish poutine - appetizer, walk 2 min from MRT", order: 5 },
  { day: 1, date: "2026-04-29", time: "20:30", location: "ibis budget Singapore Pearl", activity: "🏨 Check-in to ibis Pearl", estimatedPrice: { amount: 0, currency: "SGD" }, notes: "21 Lorong 14 Geylang", order: 6 },
  { day: 1, date: "2026-04-29", time: "21:00", location: "Geylang Lorong 9", activity: "🐸 Dinner: Fresh Frog Porridge", estimatedPrice: { amount: 35, currency: "SGD" }, notes: "Frog congee + oyster omelette - MUST TRY! Walk from hotel", order: 7 },

  // Day 2: Thu 30/4
  { day: 2, date: "2026-04-30", time: "07:30", location: "Dhoby Ghaut", activity: "☕ Breakfast: Ya Kun Kaya Toast", estimatedPrice: { amount: 12, currency: "SGD" }, notes: "Kaya toast + soft boiled eggs + kopi | [EW] Aljunied -> [NS] Dhoby Ghaut", order: 1 },
  { day: 2, date: "2026-04-30", time: "08:30", location: "Fort Canning Park", activity: "🏛️ Fort Canning + Old Hill Street Police Station", estimatedPrice: { amount: 0, currency: "SGD" }, notes: "Walk from Dhoby Ghaut ~5 min. Rainbow building photo spot!", order: 2 },
  { day: 2, date: "2026-04-30", time: "10:00", location: "National Gallery Singapore", activity: "🎨 National Gallery Singapore", estimatedPrice: { amount: 0, currency: "SGD" }, notes: "ASEAN citizens free | Non-ASEAN: $20/person | ~1.5h for highlights", order: 3 },
  { day: 2, date: "2026-04-30", time: "11:30", location: "Chinatown Complex", activity: "🏮 Lunch: Tian Tian + Mei Heong Yuen Dessert", estimatedPrice: { amount: 25, currency: "SGD" }, notes: "Hainanese chicken rice + dessert | [DT] City Hall -> [DT] Chinatown", order: 4 },
  { day: 2, date: "2026-04-30", time: "13:15", location: "Kampong Glam cluster", activity: "🕌 Kampong Glam (Sultan Mosque + Haji Lane + Bugis)", estimatedPrice: { amount: 15, currency: "SGD" }, notes: "Street art, Haji Lane shopping, Sultan Mosque | [DT] Chinatown -> [DT] Bugis", order: 5 },
  { day: 2, date: "2026-04-30", time: "15:00", location: "Sim Lim Square Tầng 2", activity: "🍜 3 Meals a Day (viral Sichuan noodles)", estimatedPrice: { amount: 20, currency: "SGD" }, notes: "Spicy Sichuan ramen inside Sim Lim Square | Walk ~10 min from Bugis", order: 6 },
  { day: 2, date: "2026-04-30", time: "16:00", location: "ibis budget Singapore Pearl", activity: "🛌 Afternoon rest at hotel", estimatedPrice: { amount: 0, currency: "SGD" }, notes: "Avoid afternoon heat. Recharge for evening!", order: 7 },
  { day: 2, date: "2026-04-30", time: "17:30", location: "Merlion Park", activity: "🦁 Merlion Park + Marina Bay Sunset", estimatedPrice: { amount: 0, currency: "SGD" }, notes: "Best photos 18:30-19:30 | Sunset ~19:04 | MRT: Aljunied → Raffles Place → Walk", order: 8 },
  { day: 2, date: "2026-04-30", time: "19:30", location: "Keng Eng Kee, Queenstown", activity: "🦀 Dinner: Chili Crab at Keng Eng Kee", estimatedPrice: { amount: 70, currency: "SGD" }, notes: "MUST-TRY! Book 7pm slot in advance | MRT: Raffles Place → Queenstown", order: 9 },
  { day: 2, date: "2026-04-30", time: "21:30", location: "ibis budget Singapore Pearl", activity: "🚇 Return to hotel", estimatedPrice: { amount: 3.38, currency: "SGD" }, notes: "Prepare for KL tomorrow", order: 10 },

  // Day 3: Fri 1/5 - Singapore to Malaysia
  { day: 3, date: "2026-05-01", time: "07:30", location: "183 Jalan Besar", activity: "🥟 Breakfast: Swee Choon Dim Sum", estimatedPrice: { amount: 25, currency: "SGD" }, notes: "Famous dim sum, opens 7:00 AM | MRT: Aljunied → Jalan Besar", order: 1 },
  { day: 3, date: "2026-05-01", time: "08:30", location: "Koon Seng Road", activity: "🏠 Peranakan Houses (colorful shophouses)", estimatedPrice: { amount: 0, currency: "SGD" }, notes: "Colorful heritage Peranakan houses, great photo spot | MRT: Jalan Besar → Dakota", order: 2 },
  { day: 3, date: "2026-05-01", time: "10:30", location: "ibis budget Singapore Pearl", activity: "🏨 Check out & collect luggage", estimatedPrice: { amount: 0, currency: "SGD" }, notes: "MRT: Dakota → Aljunied", order: 3 },
  { day: 3, date: "2026-05-01", time: "11:00", location: "Tai Seng MRT", activity: "🚇 Head to bus pickup point", estimatedPrice: { amount: 2.18, currency: "SGD" }, notes: "Walk 10 min → Paya Lebar MRT → Tai Seng (1 stop Circle Line)", order: 4 },
  { day: 3, date: "2026-05-01", time: "12:00", location: "Tai Seng MRT → Terminal Bersepadu Selatan", activity: "🚌 Bus: Singapore → Kuala Lumpur (Seat 2B, 2C)", estimatedPrice: { amount: 414000, currency: "VND" }, notes: "5h28m journey | Booked on EasyBook | Arrive TBS ~17:28", order: 5 },
  { day: 3, date: "2026-05-01", time: "17:30", location: "1000 Miles Hotel, KL Chinatown", activity: "🚗 Grab: TBS → 1000 Miles Hotel", estimatedPrice: { amount: 15, currency: "MYR" }, notes: "13 km, ~24 min | No. 17 & 19 Jln Tun H S Lee, Chinatown", order: 6 },
  { day: 3, date: "2026-05-01", time: "18:30", location: "Petaling Street, Chinatown KL", activity: "🍜 Dinner: Petaling Street Street Food", estimatedPrice: { amount: 50, currency: "MYR" }, notes: "Madras Lane Hawker or Kim Lian Kee (Hokkien Mee) | Night market after 18h", order: 7 },

  // Day 4: Sat 2/5
  { day: 4, date: "2026-05-02", time: "09:00", location: "Chow Kit", activity: "🚗 Grab → Chow Kit + morning walk", estimatedPrice: { amount: 8, currency: "MYR" }, notes: "3 km, 10 min | Old shophouses, street art, wet market", order: 1 },
  { day: 4, date: "2026-05-02", time: "10:00", location: "1 Jalan Kamunting, Chow Kit", activity: "🍳 Breakfast: Yut Kee (since 1928)", estimatedPrice: { amount: 50, currency: "MYR" }, notes: "Roti babi, Hainanese chicken chop, egg kopi | Historic restaurant!", order: 2 },
  { day: 4, date: "2026-05-02", time: "11:00", location: "Cheevit Cheeva KL", activity: "🍧 Dessert: Cheevit Cheeva (Thai Bingsu)", estimatedPrice: { amount: 60, currency: "MYR" }, notes: "Instagram-worthy space | Bingsu + Thai desserts | ~10 MYR Grab from Chow Kit", order: 3 },
  { day: 4, date: "2026-05-02", time: "13:00", location: "Masjid Putra, Putrajaya", activity: "🕌 Putrajaya Pink Mosque (Masjid Putra)", estimatedPrice: { amount: 30, currency: "MYR" }, notes: "30 km, 35 min Grab | Pink mosque on lake | Borrow abaya if needed | FREE entry", order: 4 },
  { day: 4, date: "2026-05-02", time: "15:30", location: "KLCC Park", activity: "🏙️ KLCC Park + Petronas Twin Towers", estimatedPrice: { amount: 30, currency: "MYR" }, notes: "30 km, 35 min Grab | Free photos from park | Suria KLCC mall below", order: 5 },
  { day: 4, date: "2026-05-02", time: "18:00", location: "Suria KLCC", activity: "🍜 Dinner: Oriental Kopi", estimatedPrice: { amount: 50, currency: "MYR" }, notes: "Queue 30-60 min, arrive early! Authentic Malaysian cuisine", order: 6 },
  { day: 4, date: "2026-05-02", time: "20:00", location: "KLCC area", activity: "🧋 Teh Tarik: Bungkus Kawkaw", estimatedPrice: { amount: 25, currency: "MYR" }, notes: "Pulled tea in cute packaging — great souvenir", order: 7 },
  { day: 4, date: "2026-05-02", time: "20:30", location: "KLCC Esplanade", activity: "⛲ KLCC Musical Fountain Show (free)", estimatedPrice: { amount: 0, currency: "MYR" }, notes: "Shows at 20:00 / 21:00 / 22:00 | Beautiful lights + music", order: 8 },
  { day: 4, date: "2026-05-02", time: "21:00", location: "1000 Miles Hotel", activity: "🚗 Grab back to hotel", estimatedPrice: { amount: 12, currency: "MYR" }, notes: "5 km, 15 min", order: 9 },

  // Day 5: Sun 3/5
  { day: 5, date: "2026-05-03", time: "07:30", location: "1 Lebuh Ampang", activity: "☕ Breakfast: Ho Kow Hainam Kopitiam (since 1956)", estimatedPrice: { amount: 35, currency: "MYR" }, notes: "Kopi, butter toast, nasi lemak — MUST TRY! Opens 7:00 | Grab ~8 MYR", order: 1 },
  { day: 5, date: "2026-05-03", time: "08:30", location: "65 Persiaran Endah, Robson Heights", activity: "🏯 Thean Hou Temple (6-tier Chinese temple)", estimatedPrice: { amount: 15, currency: "MYR" }, notes: "Best Chinese temple in KL | Rooftop skyline views | Grab 15 MYR from Ho Kow", order: 2 },
  { day: 5, date: "2026-05-03", time: "10:15", location: "Jalan Tuanku Abdul Halim", activity: "🕌 Masjid Wilayah (Blue Mosque)", estimatedPrice: { amount: 22, currency: "MYR" }, notes: "Ottoman-Mughal architecture | Non-Muslim: 10-12h / 15-16h / 17:30-18:30 | Grab 22 MYR", order: 3 },
  { day: 5, date: "2026-05-03", time: "11:45", location: "185 Jalan Pudu", activity: "🍚 Lunch: Heun Kee Claypot Chicken Rice", estimatedPrice: { amount: 80, currency: "MYR" }, notes: "Famous crispy-bottom claypot rice — decades-old institution | Grab 20 MYR", order: 4 },
  { day: 5, date: "2026-05-03", time: "13:30", location: "1000 Miles Hotel", activity: "🛌 Afternoon rest", estimatedPrice: { amount: 10, currency: "MYR" }, notes: "Avoid midday heat. Grab ~10 MYR back | Recharge for evening food tour!", order: 5 },
  { day: 5, date: "2026-05-03", time: "16:00", location: "Jalan Sultan, Rex KL", activity: "📚 BookXcess Rex KL (iconic bookstore)", estimatedPrice: { amount: 8, currency: "MYR" }, notes: "4th floor of renovated Rex cinema | Amazing photos, discounted books + cafe inside", order: 6 },
  { day: 5, date: "2026-05-03", time: "17:50", location: "Jalan Ampang", activity: "☕ Cafe: KLCG Confectionery & Bakery", estimatedPrice: { amount: 40, currency: "MYR" }, notes: "Classic pastries + coffee | Relax before the night food tour", order: 7 },
  { day: 5, date: "2026-05-03", time: "19:00", location: "Jalan Alor, Bukit Bintang", activity: "🍢 Jalan Alor Food Street Night Market", estimatedPrice: { amount: 100, currency: "MYR" }, notes: "Wong Ah Wah BBQ chicken wings — MUST TRY! Lively after 19h | Grab ~8 MYR", order: 8 },
  { day: 5, date: "2026-05-03", time: "20:30", location: "183 Jalan Bukit Bintang", activity: "🍜 Win Heng Seng (Char Koay Kak)", estimatedPrice: { amount: 25, currency: "MYR" }, notes: "Legendary char koay kak + chicken rice | Walk 5 min from Jalan Alor", order: 9 },
  { day: 5, date: "2026-05-03", time: "21:00", location: "1000 Miles Hotel", activity: "🚗 Grab back to hotel", estimatedPrice: { amount: 8, currency: "MYR" }, notes: "Prepare for final day", order: 10 },

  // Day 6: Mon 4/5 - Last day
  { day: 6, date: "2026-05-04", time: "07:30", location: "Jalan Hang Lekir, Chinatown", activity: "🥛 Breakfast: Kim Soya Bean", estimatedPrice: { amount: 30, currency: "MYR" }, notes: "Fresh soy milk + fried dough sticks | Walk 3 min from hotel", order: 1 },
  { day: 6, date: "2026-05-04", time: "08:15", location: "163 Jalan Tun H S Lee", activity: "🛕 Sri Mahamariamman Temple (1873)", estimatedPrice: { amount: 0, currency: "MYR" }, notes: "Oldest Hindu temple in KL | Colorful gopuram | Remove shoes | Walk 2 min", order: 2 },
  { day: 6, date: "2026-05-04", time: "08:45", location: "Lorong Panggung, Chinatown", activity: "🎨 Kwai Chai Hong (Street Art Alley)", estimatedPrice: { amount: 0, currency: "MYR" }, notes: "6 stunning 3D murals of 1960s Chinatown | Early morning = less crowds + better photos", order: 3 },
  { day: 6, date: "2026-05-04", time: "09:30", location: "Petaling Street", activity: "🏮 Petaling Street Shopping + Snacks", estimatedPrice: { amount: 20, currency: "MYR" }, notes: "Cendol, Ais Kacang, Tau Fu Fa | Souvenirs: magnets, keychains", order: 4 },
  { day: 6, date: "2026-05-04", time: "10:15", location: "Jalan Hang Kasturi", activity: "🏛️ Central Market / Pasar Seni (1888)", estimatedPrice: { amount: 0, currency: "MYR" }, notes: "Art Deco building | Batik, pewter, chocolate, milk tea | Last souvenir shopping!", order: 5 },
  { day: 6, date: "2026-05-04", time: "11:00", location: "Nostalgia Newsphoto Studio", activity: "📸 Nostalgia Newsphoto — Vintage Couple Photoshoot", estimatedPrice: { amount: 50, currency: "MYR" }, notes: "Vintage newspaper-style photoshoot | Prints on-site | Opens 11:00 (Tue-Thu: 11h-18h)", order: 6 },
  { day: 6, date: "2026-05-04", time: "11:45", location: "Dataran Merdeka", activity: "🏛️ Merdeka Square + Sultan Abdul Samad Building", estimatedPrice: { amount: 0, currency: "MYR" }, notes: "Independence Square 1957 | Moorish architecture | 95m flagpole | I❤️KL City Gallery nearby", order: 7 },
  { day: 6, date: "2026-05-04", time: "12:30", location: "Chinatown", activity: "🍜 Lunch: Baba Can Book (Nyonya cuisine)", estimatedPrice: { amount: 60, currency: "MYR" }, notes: "Authentic Peranakan/Nyonya: laksa, ayam pongteh, traditional kuih | Walk ~10 min", order: 8 },
  { day: 6, date: "2026-05-04", time: "13:30", location: "TRX Mall", activity: "🚗 Grab → TRX Mall (newest premium mall)", estimatedPrice: { amount: 12, currency: "MYR" }, notes: "Tun Razak Exchange — newest, most premium mall in KL | 3 km, 10-15 min", order: 9 },
  { day: 6, date: "2026-05-04", time: "13:45", location: "TRX Mall", activity: "🍦 Tofu G Gelato (signature tofu flavor)", estimatedPrice: { amount: 30, currency: "MYR" }, notes: "Tofu gelato + Korean premium ice cream | Opens 11:00-23:00 | Final dessert treat!", order: 10 },
  { day: 6, date: "2026-05-04", time: "14:30", location: "1000 Miles Hotel", activity: "🚗 Grab back to hotel — check out", estimatedPrice: { amount: 10, currency: "MYR" }, notes: "Pack luggage, settle bill | Book Grab to airport NOW", order: 11 },
  { day: 6, date: "2026-05-04", time: "15:00", location: "KLIA / KLIA2", activity: "🚗 Grab → Airport (check flight terminal!)", estimatedPrice: { amount: 65, currency: "MYR" }, notes: "60 km, 55-75 min | Arrive 2.5h before 19:00 flight | May have traffic", order: 12 },
  { day: 6, date: "2026-05-04", time: "19:00", location: "KLIA", activity: "✈️ Return flight to Hanoi — Trip ends!", estimatedPrice: { amount: 0, currency: "MYR" }, notes: "Check-in, immigration, duty-free if time permits. 🎉", order: 13 },
];

export async function GET() {
  try {
    // Check if already seeded
    const existing = await getDocs(
      query(collection(db, "itinerary"), where("tripId", "==", TRIP_ID))
    );
    if (!existing.empty) {
      return NextResponse.json({
        message: `Already seeded — ${existing.size} items exist. Delete them first to re-seed.`,
        count: existing.size,
      });
    }

    // Create trip document
    await setDoc(doc(db, "trips", TRIP_ID), {
      id: TRIP_ID,
      name: "Singapore & Malaysia",
      startDate: Timestamp.fromDate(new Date("2026-04-29")),
      endDate: Timestamp.fromDate(new Date("2026-05-04")),
      budget: { SGD: 282, MYR: 1006 },
      exchangeRates: { SGD: 19000, MYR: 5500 },
      createdAt: Timestamp.now(),
    });

    // Seed itinerary in batches of 500
    const batch = writeBatch(db);
    itineraryData.forEach((item) => {
      const docRef = doc(collection(db, "itinerary"));
      batch.set(docRef, { ...item, tripId: TRIP_ID, visited: false });
    });
    await batch.commit();

    return NextResponse.json({
      message: "✅ Database seeded successfully!",
      count: itineraryData.length,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
