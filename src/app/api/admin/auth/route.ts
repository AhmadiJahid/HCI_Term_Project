import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { passcode } = body;

        const adminPasscode = process.env.ADMIN_PASSCODE || "admin123";

        if (passcode === adminPasscode) {
            // Set auth cookie
            const cookieStore = await cookies();
            cookieStore.set("admin_auth", "authenticated", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 60 * 60 * 24, // 24 hours
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}

export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete("admin_auth");
    return NextResponse.json({ success: true });
}
