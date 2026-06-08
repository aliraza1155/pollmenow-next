// lib/location.ts
'use client';

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const getCountryFromIPCallable = httpsCallable(functions, 'getCountryFromIP');

export async function getCountryFromIP(): Promise<{ country: string; countryCode: string; city: string | null } | null> {
  try {
    const result = await getCountryFromIPCallable();
    return result.data as { country: string; countryCode: string; city: string | null };
  } catch (err) {
    console.error('Cloud function geolocation failed:', err);
    return null;
  }
}

export async function getBrowserLocation(): Promise<{ country: string | undefined; city: string | undefined; lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          resolve({
            country: data.address?.country,
            city: data.address?.city,
            lat: latitude,
            lng: longitude,
          });
        } catch {
          resolve(null);
        }
      },
      () => resolve(null)
    );
  });
}

export async function detectLocation(): Promise<{ country: string | undefined; city: string | undefined; lat?: number; lng?: number } | null> {
  const gps = await getBrowserLocation();
  if (gps && gps.country) return gps;
  
  const ip = await getCountryFromIP();
  if (ip) {
    // Convert IP result to match the GPS shape (no lat/lng)
    return {
      country: ip.country,
      city: ip.city ?? undefined,
    };
  }
  return null;
}