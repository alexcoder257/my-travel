export const MRT_LINES: Record<string, { color: string; textColor: string; name: string }> = {
  EW: { color: "#009645", textColor: "#ffffff", name: "East West Line" },
  NS: { color: "#d42e12", textColor: "#ffffff", name: "North South Line" },
  NE: { color: "#821da4", textColor: "#ffffff", name: "North East Line" },
  CC: { color: "#fa9e0d", textColor: "#ffffff", name: "Circle Line" },
  DT: { color: "#005ec4", textColor: "#ffffff", name: "Downtown Line" },
  TE: { color: "#9d5b25", textColor: "#ffffff", name: "Thomson-East Coast Line" },
  CG: { color: "#009645", textColor: "#ffffff", name: "Changi Branch" },
  CE: { color: "#fa9e0d", textColor: "#ffffff", name: "Circle Line Extension" },
};

export interface MRTStep {
  line?: keyof typeof MRT_LINES;
  station: string;
  type: "start" | "transfer" | "end" | "walk";
}

export function parseMRTPath(notes: string): MRTStep[] | null {
  // Pattern: [EW] Aljunied -> [EW] Tanah Merah (Transfer) -> [CG] Changi
  if (!notes.includes("->") && !notes.includes("→")) return null;

  // Cải tiến: Chỉ split ở các dấu -> hoặc → mà không nằm trong ngoặc đơn
  // Tuy nhiên để đơn giản và hiệu quả hơn, ta sẽ clean từng segment sau khi split
  const segments = notes.split(/->|→/).map(s => s.trim());
  const steps: MRTStep[] = [];

  segments.forEach((segment, index) => {
    // 1. Loại bỏ phần sau dấu gạch đứng, chấm phẩy hoặc các lưu ý
    let cleanSegment = segment.split(/[|;|⚠️]/)[0].trim();

    // 2. Xử lý trường hợp segment chứa dấu đóng ngoặc thừa (do split nhầm -> bên trong ngoặc)
    if (cleanSegment.includes(")") && !cleanSegment.includes("(")) {
      cleanSegment = cleanSegment.split(")")[1] || "";
    }

    // 3. Lấy mã Line [EW], [DT]...
    const lineMatch = cleanSegment.match(/\[([A-Z]{2,10})\]/);
    const line = lineMatch ? (lineMatch[1] as string) : undefined;

    // 4. Lấy tên ga: xóa mã line, xóa nội dung trong ngoặc đơn, và giới hạn độ dài
    let station = cleanSegment
      .replace(/\[[A-Z]{2,10}\]/, "")
      .replace(/\(.*\)/g, "")
      .replace(/MRT:?/, "")
      .trim();

    // Nếu station quá dài (hơn 30 ký tự), đây có thể là một đoạn text note chứ không phải tên ga
    if (station.length > 30) {
      station = station.substring(0, 27) + "...";
    }

    if (!station || station === "...") return;

    const isTransfer = cleanSegment.toLowerCase().includes("transfer") || cleanSegment.toLowerCase().includes("đổi tàu");
    const isWalk = cleanSegment.toLowerCase().includes("walk") || cleanSegment.toLowerCase().includes("đi bộ");

    let type: MRTStep["type"] = "transfer";
    if (index === 0) type = "start";
    else if (index === segments.length - 1) type = "end";
    else if (isTransfer) type = "transfer";
    else if (isWalk) type = "walk";

    const finalLine = (line === "PLACE" || (!line && type === "end")) ? undefined : line;
    steps.push({ line: finalLine as any, station, type });
  });

  return steps.length > 1 ? steps : null;
}
