import { NextResponse } from "next/server";
import { whatsappService } from "@/services/whatsapp/client";

export async function POST() {
  try {
    await whatsappService.disconnect();
    return NextResponse.json({ success: true, message: "WhatsApp disconnected" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
