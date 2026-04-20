import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email, tripName, role, inviterName } = await req.json();

  if (!email || !tripName || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const roleLabel = role === "editor" ? "chỉnh sửa" : "xem";

  const { error } = await resend.emails.send({
    from: "Roamboo <onboarding@resend.dev>",
    to: email,
    subject: `${inviterName || "Ai đó"} mời bạn ${roleLabel} chuyến đi "${tripName}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2d5016; font-size: 24px; margin: 0;">🐼 Roamboo</h1>
          <p style="color: #666; font-size: 14px; margin: 4px 0 0;">Travel with love</p>
        </div>

        <div style="background: #f0f7e6; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px; font-size: 16px; color: #1a1a1a;">
            <strong>${inviterName || "Ai đó"}</strong> đã mời bạn ${roleLabel} chuyến đi:
          </p>
          <h2 style="margin: 0; font-size: 22px; color: #2d5016;">${tripName}</h2>
          <span style="display: inline-block; margin-top: 12px; padding: 4px 12px; background: #2d5016; color: white; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
            ${role === "editor" ? "Editor" : "Viewer"}
          </span>
        </div>

        <div style="text-align: center;">
          <a href="https://roamboo.vercel.app" style="display: inline-block; padding: 12px 32px; background: #2d5016; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Mở Roamboo
          </a>
        </div>

        <p style="margin-top: 24px; font-size: 12px; color: #999; text-align: center;">
          Đăng nhập bằng email <strong>${email}</strong> để truy cập chuyến đi.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
