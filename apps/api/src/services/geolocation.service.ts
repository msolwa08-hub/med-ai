import prisma from '../lib/prisma.js';
import { config } from '../config.js';
import type { NearbyDoctor, GeoPoint } from '../types/index.js';
import type { DoctorType } from '@prisma/client';

/**
 * Calculate distance between two geo points using the Haversine formula.
 * Returns distance in kilometers.
 */
export function haversineDistance(a: GeoPoint, b: GeoPoint): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const c =
    2 *
    Math.asin(
      Math.sqrt(
        sinDLat * sinDLat +
          Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
      )
    );

  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find doctors within a given radius of a location.
 *
 * Uses a bounding-box pre-filter on the database (fast index scan) then
 * applies exact Haversine distance calculation in application code.
 *
 * @param location - Patient location
 * @param radiusKm - Search radius in km (default 25)
 * @param doctorType - Optional filter by doctor type
 * @param language - Optional filter by language spoken
 */
export async function findNearbyDoctors(
  location: GeoPoint,
  radiusKm = 25,
  doctorType?: DoctorType,
  language?: string
): Promise<NearbyDoctor[]> {
  // Bounding box for quick DB pre-filter (~1 degree lat = ~111km)
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(toRad(location.lat)));

  // Availability staleness guard: a doctor who toggled available and then
  // disappeared should not stay matchable forever. updatedAt is refreshed by
  // every availability PUT (and any profile change), so it works as a
  // lightweight heartbeat.
  const freshSince = new Date(Date.now() - config.AVAILABILITY_TTL_HOURS * 3600 * 1000);

  const doctors = await prisma.doctor.findMany({
    where: {
      isAvailable: true,
      hpcsaStatus: 'VERIFIED',
      updatedAt: { gte: freshSince },
      currentLat: {
        gte: location.lat - latDelta,
        lte: location.lat + latDelta,
      },
      currentLng: {
        gte: location.lng - lngDelta,
        lte: location.lng + lngDelta,
      },
      ...(doctorType ? { doctorType } : {}),
      ...(language ? { languages: { has: language } } : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      doctorType: true,
      specialization: true,
      rating: true,
      consultationFee: true,
      currentLat: true,
      currentLng: true,
      availabilityRadius: true,
      isAvailable: true,
      languages: true,
    },
  });

  // Apply exact Haversine filter
  const nearby: NearbyDoctor[] = [];

  for (const doctor of doctors) {
    if (doctor.currentLat === null || doctor.currentLng === null) continue;

    const distanceKm = haversineDistance(location, {
      lat: doctor.currentLat,
      lng: doctor.currentLng,
    });

    // Check both the search radius AND the doctor's own availability radius
    if (distanceKm <= radiusKm && distanceKm <= doctor.availabilityRadius) {
      nearby.push({
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        doctorType: doctor.doctorType,
        specialization: doctor.specialization,
        rating: doctor.rating,
        consultationFee: doctor.consultationFee,
        distanceKm: Math.round(distanceKm * 10) / 10,
        isAvailable: doctor.isAvailable,
        languages: doctor.languages,
      });
    }
  }

  // Sort by distance
  return nearby.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Update a doctor's location and availability.
 */
export async function updateDoctorLocation(
  doctorId: string,
  location: GeoPoint,
  isAvailable: boolean
): Promise<void> {
  await prisma.$transaction([
    prisma.doctor.update({
      where: { id: doctorId },
      data: {
        currentLat: location.lat,
        currentLng: location.lng,
        isAvailable,
      },
    }),
    prisma.doctorAvailabilityLog.create({
      data: {
        doctorId,
        lat: location.lat,
        lng: location.lng,
        isAvailable,
      },
    }),
  ]);
}
