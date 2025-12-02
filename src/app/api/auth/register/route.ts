import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { full_name, email, password } = await req.json();

    if (!full_name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        full_name,
        email,
        password_hash,
        role: "user",
      },
    });

    return NextResponse.json({
      message: "User registered successfully",
      user: { id: user.id, email: user.email },
    });
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
