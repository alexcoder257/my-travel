import { NextResponse } from "next/server";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { readFile } from "fs/promises";
import { join } from "path";

export async function POST() {
  try {
    const templatePath = join(process.cwd(), "public", "templates", "itinerary_template.xlsx");
    const fileBuffer = await readFile(templatePath);
    const blob = new Blob([fileBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const storageRef = ref(storage, "templates/itinerary_template.xlsx");
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);

    return NextResponse.json({ url: downloadUrl });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
