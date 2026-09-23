import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mockStore";

export async function GET() {
  return NextResponse.json({ success: true, data: mockStore.getProducts() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = mockStore.saveProduct(body);
    return NextResponse.json({ success: true, data: product });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
