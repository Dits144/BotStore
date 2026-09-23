import { NextResponse } from "next/server";
import { whatsappService } from "@/services/whatsapp/client";

export async function GET() {
  const status = whatsappService.getStatus();
  return NextResponse.json({ success: true, data: status });
}

export async function POST() {
  try {
    // Start socket initialization if not already connected
    whatsappService.initializeSocket();
    const status = whatsappService.getStatus();
    return NextResponse.json({ success: true, data: status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
