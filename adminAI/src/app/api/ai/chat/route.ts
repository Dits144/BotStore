import { NextResponse } from "next/server";
import { aiRouter } from "@/services/ai/router";

export async function POST(req: Request) {
  try {
    const { conversationId, message } = await req.json();
    const result = await aiRouter.processIncomingMessage(conversationId, message);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
