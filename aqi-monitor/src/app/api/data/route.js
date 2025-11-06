import { getData, setData } from '@/lib/sensorData';
import { NextResponse } from 'next/server';

// Handle GET requests - return sensor data
export async function GET() {
  const data = getData();
  return NextResponse.json(data);
}
// Handle POST requests - receive data from ESP32
export async function POST(request) {
    try {
      const body = await request.json();
      const updatedData = setData(body);
      
      console.log('Received sensor data:', updatedData);
      
      return NextResponse.json({ 
        status: 'success', 
        message: 'Data received' 
      });
    } catch (error) {
      console.error('Error parsing data:', error);
      return NextResponse.json(
        { status: 'error', message: 'Invalid JSON' },
        { status: 400 }
      );
    }
  }
  