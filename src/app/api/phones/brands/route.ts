import { NextResponse } from 'next/server';

const POPULAR_BRANDS = [
  'Apple',
  'Samsung',
  'Motorola',
  'Xiaomi',
  'Google',
  'Huawei',
  'Honor',
  'Realme',
  'LG',
  'Sony',
  'Nokia',
  'TCL',
  'ZTE',
  'Infinix',
  'Tecno',
];

export async function GET() {
  return NextResponse.json({ brands: POPULAR_BRANDS, source: 'local_database' });
}
