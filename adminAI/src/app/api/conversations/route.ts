import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mockStore";

export async function GET() {
  return NextResponse.json({ success: true, data: mockStore.getConversations() });
}

export async function PATCH(req: Request) {
  try {
    const { conversationId, mode, handoverReason } = await req.json();
    const updated = mockStore.updateConversationMode(conversationId, mode, handoverReason);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
