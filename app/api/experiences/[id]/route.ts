"use server"

import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    
    // Placeholder sin lógica real: la API de experiencias vive en
    // pages/api/tours (Turso).
    
    return NextResponse.json({
      status: 'success',
      data: {
        id: id,
        title: 'Sample Experience',
        description: 'Sample description',
        price: 100
      },
      message: 'Experience details retrieved successfully'
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch experience details'
    }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    
    // Your booking creation logic here
    // This is a placeholder for the actual API route
    
    return NextResponse.json({
      status: 'success',
      data: {
        booking_id: 'booking_' + Date.now(),
        experience_id: id,
        status: 'confirmed',
        ...body
      },
      message: 'Booking created successfully'
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create booking'
    }, { status: 400 })
  }
}