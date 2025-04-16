import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { refreshToken } = await request.json();

    const response = NextResponse.json(
      { status_code: 200, message: 'Logged in successfully' },
      { status: 200 }
    );

    response.cookies.set('token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: error.message + ". Please try again later!" },
      { status: 200 }
    );
  }
}