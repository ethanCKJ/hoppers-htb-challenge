import {NextRequest, NextResponse} from "next/server";
import sql from "@/app/lib/postgres_client";
import bcrypt from "bcrypt";
import {PostgresError} from "postgres";

type UserSignupRequest = {
  email: string;
  password: string;
  name: string;
  phone: string;
}

/**
 * Create a new user
 * @param request
 * @constructor
 */
export async function POST(request: NextRequest){
  try {
    const {email, password, name, phone} = await request.json();
    console.log('user request from', email);

    // Hash the password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    await sql`INSERT INTO users (email, password_hash, name, phone) VALUES (${email}, ${passwordHash}, ${name}, ${phone})`;
    console.log('Successfully created new user')
    return NextResponse.json({message: 'User created successfully'}, {status: 201});
  } catch (e: PostgresError) {
    console.error(e);
    // User already exists
    if (e.code === "23505"){
    return NextResponse.json({error: 'Email or phone already exists'}, {status: 409});
    }
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500});
  }
}