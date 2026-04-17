import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, writeBatch, doc } from "firebase/firestore";

const TRIP_ID = "sg-my-2026";

// Exact data from Excel "Lịch trình chi tiết" sheet
// Key: `${day}-${order}` | activity = col1, notes = col7 (Ghi chú) + col3/4/5 (khoảng cách, thời gian, phí)
const viData: Record<string, { activity: string; notes: string }> = {
  // ===== NGÀY 1 — 29/4 =====
  "1-1": {
    activity: "✈️ Hanoi → Singapore (Scoot)",
    notes: "~2.700 km | 4h20m",
  },
  "1-2": {
    activity: "🛄 Lấy hành lý T1",
    notes: "Mua SIM tại Travelex/CHEERS | Gửi hành lý sớm | 20 phút",
  },
  "1-3": {
    activity: "💎 Jewel Changi Airport",
    notes: "Ăn Food Court B2 — Canopy Park T5 có vé (k cần thiết) | Trong sân bay | Đi bộ | Miễn phí",
  },
  "1-4": {
    activity: "🚇 MRT → Khách sạn",
    notes: "⚠️ BẮT BUỘC đổi tàu ở Tanah Merah — Mua EZLink tại máy GTM ở Changi | 16,3 km | ~30 phút | ~$3,78 SGD",
  },
  "1-5": {
    activity: "🍢 Old Chang Kee",
    notes: "Gà chiên + bạch tuộc sốt phô mai — Ăn nhẹ trước bữa chính | 200m từ MRT | 2 phút",
  },
  "1-6": {
    activity: "🏨 ibis budget Singapore Pearl",
    notes: "Check-in, cất đồ | 500m | 6 phút",
  },
  "1-7": {
    activity: "🐸 Geylang Lor 9 Fresh Frog Porridge",
    notes: "⭐ Cháo ếch + hàu chiên trứng — Món must-try! | 800m | 10 phút",
  },

  // ===== NGÀY 2 — 30/4 =====
  "2-1": {
    activity: "☕ Ya Kun Kaya Toast",
    notes: "Kaya toast + trứng lòng đào + kopi — Breakfast kinh điển SG | 5,7 km | 15 phút MRT | ~$3,18 SGD",
  },
  "2-2": {
    activity: "🏛️ Fort Canning + Old Hill Street Police Station",
    notes: "📸 Toà nhà cầu vồng — Fort Canning Park xanh mát | 700m | Đi bộ 15 phút | Miễn phí",
  },
  "2-3": {
    activity: "🎨 National Gallery Singapore",
    notes: "Non-ASEAN: $20/người — ~1.5h xem highlight | 800m | Đi bộ 10 phút | Miễn phí (ASEAN)",
  },
  "2-4": {
    activity: "🏮 Chinatown — Ăn trưa",
    notes: "⭐ Tian Tian Hainanese Chicken Rice — 🍧 Mei Heong Yuen Dessert | 2,5 km | 8 phút MRT | ~$2,38 SGD",
  },
  "2-5": {
    activity: "🕌 Kampong Glam (Sultan Mosque + Haji Lane + Bugis)",
    notes: "⭐ Gộp 3 điểm cùng khu — đi bộ cả cụm | 🕌 Sultan Mosque | 🎨 Haji Lane street art | 🛍️ Bugis Street giá rẻ | 3 km | 10 phút | ~$2,58 SGD",
  },
  "2-6": {
    activity: "🍜 3 Meals a Day",
    notes: "⭐ Mì trộn Sichuan siêu cay — Quán viral trong Sim Lim Square | 750m | Đi bộ 10 phút",
  },
  "2-7": {
    activity: "🛌 Nghỉ tại khách sạn",
    notes: "😴 NGHỈ 1.5 TIẾNG — tránh nóng chiều | 🔋 Sạc pin, tắm nước mát | 🚿 Thay đồ mát buổi tối | 6 km | 22 phút MRT | ~$3,18 SGD",
  },
  "2-8": {
    activity: "🦁 MRT → Merlion + Marina Bay sunset",
    notes: "⭐ Chụp Merlion + MBS hoàng hôn — Sunset SG ~19:04 — View đẹp nhất 18:30–19:30 | 10 km | 20 phút MRT + 1h chụp | ~$3,38 SGD",
  },
  "2-9": {
    activity: "🦀 Keng Eng Kee Seafood",
    notes: "⭐ Chili Crab must-try! Đặt bàn trước 7pm | 6 km | 18 phút MRT | ~$3,18 SGD",
  },
  "2-10": {
    activity: "🚇 MRT → ibis budget",
    notes: "Về nghỉ, chuẩn bị qua KL | 10 km | 22 phút MRT | ~$3,38 SGD",
  },

  // ===== NGÀY 3 — 1/5 =====
  "3-1": {
    activity: "🥟 Swee Choon Tim Sum",
    notes: "⭐ Dim sum nổi tiếng SG — Mở 7:00 — 4:00 sáng | 2,5 km | 10 phút MRT | ~$2,58 SGD",
  },
  "3-2": {
    activity: "🏠 Peranakan Houses (Koon Seng Road)",
    notes: "Nhà Peranakan đầy màu sắc — Điểm chụp ảnh nổi tiếng | 7 km | 25 phút MRT + đi bộ | ~$3,38 SGD",
  },
  "3-3": {
    activity: "🏨 Check out ibis",
    notes: "Trả phòng, lấy hành lý | 5 km | 15 phút MRT | ~$2,98 SGD",
  },
  "3-4": {
    activity: "🚇 ibis → Tai Seng MRT",
    notes: "Đến sớm 30 phút chờ bus | 2 km | 15 phút | ~$2,18 SGD",
  },
  "3-5": {
    activity: "🚌 Bus: SG → KL (Ghế 2B, 2C)",
    notes: "Nghỉ ngơi trên xe | 350 km | 5h28m | Đã mua vé",
  },
  "3-6": {
    activity: "🚗 Grab: TBS → Hotel",
    notes: "Check-in 1000 Miles Hotel | 13 km | ~24 phút | ~15 MYR",
  },
  "3-7": {
    activity: "🍜 Ăn tối Chinatown KL",
    notes: "Ăn đường phố Petaling Street — Chợ đêm sôi động sau 18h | 500m | Đi bộ",
  },

  // ===== NGÀY 4 — 2/5 =====
  "4-1": {
    activity: "🚗 Grab → Chow Kit",
    notes: "Chụp ảnh phố cổ, tường art | 3 km | 10 phút | ~8 MYR",
  },
  "4-2": {
    activity: "🍳 Restoran Yut Kee",
    notes: "⭐ Roti babi, Hainanese chicken chop — Kopi trứng — Nhà hàng lịch sử | Tại Chow Kit | Đi bộ 3 phút",
  },
  "4-3": {
    activity: "🍧 Cheevit Cheeva",
    notes: "⭐ Bingsu + dessert Thái — Không gian chụp ảnh siêu đẹp | 4 km | 12 phút | ~10 MYR",
  },
  "4-4": {
    activity: "🕌 Putrajaya Mosque (Masjid Putra)",
    notes: "⭐ Thánh đường hồng iconic — Mượn áo choàng miễn phí nếu cần | Quãng đường xa nhất trong ngày | 30 km | 35 phút | ~30 MYR",
  },
  "4-5": {
    activity: "🏙️ KLCC Park + Petronas Twin Towers",
    notes: "Chụp ảnh Petronas từ công viên — Suria KLCC mall ngay dưới | 30 km | 35 phút | ~30 MYR",
  },
  "4-6": {
    activity: "🍜 Oriental Kopi",
    notes: "Quán đông — xếp hàng 30–60p — Đồ ăn Malaysia authentic | Tại KLCC | Đi bộ",
  },
  "4-7": {
    activity: "🧋 Bungkus Kawkaw",
    notes: "⭐ Trà sữa kéo — Packaging cute — mua làm quà | Gần KLCC | Đi bộ",
  },
  "4-8": {
    activity: "⛲ Nhạc nước KLCC",
    notes: "Show ánh sáng + nhạc nước — Đẹp nhất ban đêm | Tại KLCC Park | Miễn phí",
  },
  "4-9": {
    activity: "🚗 Grab → Khách sạn",
    notes: "5 km | 15 phút | ~12 MYR",
  },

  // ===== NGÀY 5 — 3/5 =====
  "5-1": {
    activity: "☕ Ho Kow Hainam Kopitiam",
    notes: "⭐ MUST-TRY sáng — Kopi, Kaya butter toast, nasi lemak — Mở 7:00 | 1,5 km | 10 phút | ~8 MYR",
  },
  "5-2": {
    activity: "🏯 Chùa Thiên Hậu (Thean Hou Temple)",
    notes: "⭐ Chùa đẹp nhất KL — 📸 Tầng trên nhìn skyline — 🪷 Yên tĩnh buổi sáng | 6 km | 15–20 phút | ~15 MYR",
  },
  "5-3": {
    activity: "🕌 Masjid Wilayah Persekutuan",
    notes: "⭐ \"Blue Mosque\" của KL — 👚 Mượn áo choàng miễn phí — ⏰ Non-Muslim: 10–12h / 15–16h / 17:30–18:30 | 10 km | 25 phút | ~22 MYR",
  },
  "5-4": {
    activity: "🍚 Heun Kee Clay Pot",
    notes: "⭐ Claypot chicken rice cháy gạo — Must-try KL — hàng chục năm tuổi | 8 km | 20 phút | ~20 MYR",
  },
  "5-5": {
    activity: "🛌 Nghỉ tại khách sạn",
    notes: "😴 Nghỉ trưa — Dưỡng sức cho Bukit Bintang tối | 2,5 km | 10 phút | ~10 MYR",
  },
  "5-6": {
    activity: "📚 BookXcess Rex KL",
    notes: "⭐ Nhà sách độc đáo — Không gian cực đẹp chụp ảnh — Sách giảm giá + quán cafe bên trong | 1 km | 5–8 phút | ~8 MYR",
  },
  "5-7": {
    activity: "☕ KLCG Confectionery & Bakery",
    notes: "Bánh ngọt + cafe thư giãn — Trước khi food tour tối | 3 km | 10–15 phút | ~10 MYR",
  },
  "5-8": {
    activity: "🍢 Jalan Alor Food Street / Night Market",
    notes: "⭐ Sôi động nhất sau 19h — Wong Ah Wah BBQ wings must-try! | 2 km | 8 phút | ~8 MYR",
  },
  "5-9": {
    activity: "🍜 Win Heng Seng (Bukit Bintang)",
    notes: "⭐ Char Koay Kak + chicken rice lừng danh — Ăn thêm kiểu tráng miệng | 500m | Đi bộ 5 phút",
  },
  "5-10": {
    activity: "🚗 Grab → Hotel",
    notes: "Nghỉ, chuẩn bị ngày cuối | 2 km | 8–12 phút | ~8 MYR",
  },

  // ===== NGÀY 6 — 4/5 =====
  "6-1": {
    activity: "🥛 Kim Soya Bean",
    notes: "⭐ Đậu nành + bánh quẩy chiên — Mở sáng sớm, đông local | 200m | Đi bộ 3 phút",
  },
  "6-2": {
    activity: "🛕 Sri Mahamariamman Temple",
    notes: "⭐ Đền Hindu cổ nhất KL (1873) — Gopuram rực rỡ — 👟 Cởi giày, mặc kín | 100m | Đi bộ 2 phút | Miễn phí",
  },
  "6-3": {
    activity: "🎨 Kwai Chai Hong",
    notes: "⭐ Hẻm nghệ thuật street art — 📸 Sáng sớm vắng, ảnh đẹp — Có cafe trong hẻm | 200m | Đi bộ 3 phút | Miễn phí",
  },
  "6-4": {
    activity: "🏮 Jalan Petaling (Petaling Street)",
    notes: "Cendol, Ais Kacang, Tau Fu Fa — Souvenir: nam châm, keychain | 200m | Đi bộ 3 phút",
  },
  "6-5": {
    activity: "🏛️ Central Market (Pasar Seni)",
    notes: "⭐ Batik, pewter, chocolate, milk tea — Mua quà cuối trip | 400m | Đi bộ 7 phút | Miễn phí",
  },
  "6-6": {
    activity: "📸 Nostalgia Newsphoto",
    notes: "⭐ Photoshoot phong cách báo chí xưa — Chụp + in ảnh giấy ngay tại chỗ | 300m | Đi bộ 5 phút | ~50 MYR (photoshoot cặp)",
  },
  "6-7": {
    activity: "🏛️ Merdeka Square + Bangunan Sultan Abdul Samad",
    notes: "Quảng trường Độc lập 1957 — Kiến trúc Moorish — KL City Gallery (I❤️KL) | 500m | Đi bộ 8 phút | Miễn phí",
  },
  "6-8": {
    activity: "🍜 Baba Can Book (Nyonya)",
    notes: "⭐ Nyonya laksa, ayam pongteh, kuih-muih truyền thống | 800m | Walk 10 phút / Grab 5 phút",
  },
  "6-9": {
    activity: "🚗 Grab → TRX Mall",
    notes: "Mall mới & cao cấp nhất KL | 3 km | 10–15 phút | ~12 MYR",
  },
  "6-10": {
    activity: "🍦 Tofu G Gelato / Korean Premium Ice Cream",
    notes: "⭐ Tofu G Gelato signature flavor — Kem tráng miệng cuối trip | Tại mall",
  },
  "6-11": {
    activity: "🚗 Grab → Hotel (checkout)",
    notes: "Check out + pack đồ — ⚠️ Book Grab sớm cho sân bay | 3 km | 10–15 phút | ~10 MYR",
  },
  "6-12": {
    activity: "🚗 Grab → KLIA/KLIA2",
    notes: "⚠️ Có thể kẹt xe chiều — Đến trước 2,5 tiếng | 60 km | ~55–75 phút | ~65 MYR",
  },
  "6-13": {
    activity: "✈️ Bay về Việt Nam",
    notes: "Kết thúc chuyến đi! 🎉",
  },
};

export async function GET() {
  try {
    const snapshot = await getDocs(
      query(collection(db, "itinerary"), where("tripId", "==", TRIP_ID))
    );

    const batch = writeBatch(db);
    let updated = 0;
    const missed: string[] = [];

    snapshot.docs.forEach((document) => {
      const data = document.data();
      const key = `${data.day}-${data.order}`;
      const vi = viData[key];
      if (vi) {
        batch.update(doc(db, "itinerary", document.id), {
          activity: vi.activity,
          notes: vi.notes,
        });
        updated++;
      } else {
        missed.push(key);
      }
    });

    await batch.commit();

    return NextResponse.json({
      message: `✅ Đã cập nhật ${updated}/${snapshot.size} mục`,
      updated,
      total: snapshot.size,
      missed,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
