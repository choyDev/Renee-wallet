// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken"; // optional if you want a token

// const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// export async function POST(req: Request) {
//   try {
//     const { email, password } = await req.json();

//     if (!email || !password)
//       return NextResponse.json({ error: "Email and password required" }, { status: 400 });

//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user)
//       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

//     const valid = await bcrypt.compare(password, user.password_hash);
//     if (!valid)
//       return NextResponse.json({ error: "Invalid password" }, { status: 401 });

//     const kyc = await prisma.kycverification.findFirst({ where: { userId: user.id } });

//     const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });

//     const res = NextResponse.json({
//       message: "Login successful",
//       user: {
//         id: user.id,
//         email: user.email,
//         name: user.full_name,
//         kycVerified: kyc?.verified || false,
//       },
//     });

//     res.cookies.set("token", token, { httpOnly: true, sameSite: "lax", path: "/" });

//     return res;
//   } catch (err) {
//     console.error("Login error:", err);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios"; // 🔥 Add this for DIDIT API calls

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password)
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });

    // Fetch KYC record
    const kyc = await prisma.kycverification.findFirst({
      where: { userId: user.id },
    });

    // ---------------------------------------------------
    // 🟦 STEP 1 — If NOT VERIFIED → Create DIDIT session
    // ---------------------------------------------------

    if (!kyc || !kyc.verified) {
      
      const diditResponse = await axios.post(
        "https://verification.didit.me/v2/session/",
        {
          workflow_id: process.env.DIDIT_WORKFLOW_ID,
          vendor_data: String(user.id),       // internal user ID
          callback: process.env.DIDIT_WEBHOOK_URL,
        },
        {
          headers: {
            "x-api-key": process.env.DIDIT_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      

      // Return DIDIT URL so frontend redirects user
      return NextResponse.json({
        message: "KYC verification required",
        redirectTo: diditResponse.data.url, // 🔥 DIDIT KYC Interface
        user: {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          kycVerified: kyc?.verified || false,
  
        },
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });


    const res = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        kycVerified: kyc?.verified || false,

      },
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
    });
    console.log("Setting cookie:", token);
    res.headers.append("X-Debug-Cookie", "attempted");

    return res;

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

