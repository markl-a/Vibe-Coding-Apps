/**
 * Location-Based Attendance Tracking
 *
 * This example demonstrates GPS-based attendance features:
 * - Geofencing for office locations
 * - Distance calculation from office
 * - Location validation for check-in/out
 * - Remote work tracking
 * - Location history and analysis
 */

import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

interface Location {
  latitude: number;
  longitude: number;
}

interface OfficeLocation extends Location {
  name: string;
  address: string;
  radius: number; // in meters
}

// Example office locations
const OFFICE_LOCATIONS: OfficeLocation[] = [
  {
    name: 'Headquarters',
    address: '123 Main St, San Francisco, CA',
    latitude: 37.7749,
    longitude: -122.4194,
    radius: 100 // 100 meters
  },
  {
    name: 'Branch Office',
    address: '456 Market St, San Francisco, CA',
    latitude: 37.7849,
    longitude: -122.4094,
    radius: 100
  }
];

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 *
 * @param point1 - First location
 * @param point2 - Second location
 * @returns Distance in meters
 */
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371e3; // Earth's radius in meters
  const lat1 = (point1.latitude * Math.PI) / 180;
  const lat2 = (point2.latitude * Math.PI) / 180;
  const deltaLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const deltaLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a location is within office geofence
 *
 * @param userLocation - User's current location
 * @param offices - List of office locations (optional)
 * @returns Object with validation result and nearest office info
 */
export function validateOfficeLocation(
  userLocation: Location,
  offices: OfficeLocation[] = OFFICE_LOCATIONS
): {
  isValid: boolean;
  nearestOffice: OfficeLocation | null;
  distance: number;
  withinGeofence: boolean;
} {
  let nearestOffice: OfficeLocation | null = null;
  let minDistance = Infinity;
  let withinGeofence = false;

  for (const office of offices) {
    const distance = calculateDistance(userLocation, office);

    if (distance < minDistance) {
      minDistance = distance;
      nearestOffice = office;
    }

    if (distance <= office.radius) {
      withinGeofence = true;
    }
  }

  console.log('Location validation:', {
    nearestOffice: nearestOffice?.name,
    distance: Math.round(minDistance),
    withinGeofence
  });

  return {
    isValid: withinGeofence,
    nearestOffice,
    distance: minDistance,
    withinGeofence
  };
}

/**
 * Check in with location validation
 *
 * @param employeeId - Employee ID
 * @param location - GPS location
 * @param allowRemote - Whether to allow check-in outside office
 * @returns Check-in result with location validation
 */
export async function checkInWithLocation(
  employeeId: string,
  location: Location,
  allowRemote: boolean = false
) {
  try {
    // Validate location
    const validation = validateOfficeLocation(location);

    // If not within geofence and remote work not allowed, reject
    if (!validation.withinGeofence && !allowRemote) {
      throw new Error(
        `Check-in location is ${Math.round(validation.distance)}m away from nearest office. ` +
        `Please check in from office location or enable remote work.`
      );
    }

    const today = startOfDay(new Date());
    const now = new Date();

    // Check for existing check-in
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existing?.checkIn) {
      throw new Error('Already checked in today');
    }

    // Determine work type based on location
    const workType = validation.withinGeofence ? 'OFFICE' : 'REMOTE';

    // Create or update attendance record
    let attendance;
    if (existing) {
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: now,
          checkInLocation: location as any,
          status: 'PRESENT',
          notes: validation.withinGeofence
            ? `Checked in at ${validation.nearestOffice?.name}`
            : `Remote work - ${Math.round(validation.distance)}m from nearest office`
        }
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          employeeId,
          date: today,
          checkIn: now,
          checkInLocation: location as any,
          status: 'PRESENT',
          notes: validation.withinGeofence
            ? `Checked in at ${validation.nearestOffice?.name}`
            : `Remote work - ${Math.round(validation.distance)}m from nearest office`
        }
      });
    }

    console.log('Check-in successful:', {
      employeeId,
      workType,
      location: validation.nearestOffice?.name || 'Remote',
      distance: Math.round(validation.distance)
    });

    return {
      attendance,
      workType,
      validation,
      message: validation.withinGeofence
        ? `Checked in at ${validation.nearestOffice?.name}`
        : 'Checked in for remote work'
    };
  } catch (error) {
    console.error('Check-in with location error:', error);
    throw error;
  }
}

/**
 * Check out with location validation
 *
 * @param employeeId - Employee ID
 * @param location - GPS location
 * @returns Check-out result with location validation
 */
export async function checkOutWithLocation(
  employeeId: string,
  location: Location
) {
  try {
    const validation = validateOfficeLocation(location);
    const today = startOfDay(new Date());
    const now = new Date();

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (!attendance || !attendance.checkIn) {
      throw new Error('Please check in first');
    }

    if (attendance.checkOut) {
      throw new Error('Already checked out today');
    }

    // Calculate work hours
    const totalHours = Math.floor(
      (now.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60)
    );
    const workHours = Math.min(totalHours, 8);
    const overtimeHours = Math.max(totalHours - 8, 0);

    // Update attendance
    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        checkOutLocation: location as any,
        workHours,
        overtimeHours
      }
    });

    console.log('Check-out successful:', {
      employeeId,
      location: validation.nearestOffice?.name || 'Remote',
      workHours,
      overtimeHours
    });

    return {
      attendance: updated,
      validation,
      workHours,
      overtimeHours,
      message: validation.withinGeofence
        ? `Checked out from ${validation.nearestOffice?.name}`
        : 'Checked out from remote location'
    };
  } catch (error) {
    console.error('Check-out with location error:', error);
    throw error;
  }
}

/**
 * Get location history for an employee
 *
 * @param employeeId - Employee ID
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Location history with analysis
 */
export async function getLocationHistory(
  employeeId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const records = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate)
        },
        checkInLocation: {
          not: null
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Analyze location patterns
    const locationAnalysis = records.map(record => {
      const checkInLoc = record.checkInLocation as any;
      const checkOutLoc = record.checkOutLocation as any;

      let checkInValidation = null;
      let checkOutValidation = null;

      if (checkInLoc) {
        checkInValidation = validateOfficeLocation({
          latitude: checkInLoc.latitude,
          longitude: checkInLoc.longitude
        });
      }

      if (checkOutLoc) {
        checkOutValidation = validateOfficeLocation({
          latitude: checkOutLoc.latitude,
          longitude: checkOutLoc.longitude
        });
      }

      return {
        date: record.date,
        checkIn: {
          time: record.checkIn,
          location: checkInLoc,
          validation: checkInValidation,
          office: checkInValidation?.nearestOffice?.name,
          distance: checkInValidation?.distance
        },
        checkOut: {
          time: record.checkOut,
          location: checkOutLoc,
          validation: checkOutValidation,
          office: checkOutValidation?.nearestOffice?.name,
          distance: checkOutValidation?.distance
        },
        workType: checkInValidation?.withinGeofence ? 'OFFICE' : 'REMOTE'
      };
    });

    // Calculate statistics
    const stats = {
      totalDays: records.length,
      officeDays: locationAnalysis.filter(l => l.workType === 'OFFICE').length,
      remoteDays: locationAnalysis.filter(l => l.workType === 'REMOTE').length,
      officeUsage: {} as Record<string, number>
    };

    // Count usage per office
    locationAnalysis.forEach(record => {
      if (record.checkIn.office) {
        stats.officeUsage[record.checkIn.office] =
          (stats.officeUsage[record.checkIn.office] || 0) + 1;
      }
    });

    console.log('Location history:', {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      totalDays: stats.totalDays,
      officeDays: stats.officeDays,
      remoteDays: stats.remoteDays
    });

    return {
      records: locationAnalysis,
      statistics: stats
    };
  } catch (error) {
    console.error('Error getting location history:', error);
    throw error;
  }
}

/**
 * Detect suspicious location patterns
 *
 * @param employeeId - Employee ID
 * @param date - Date to check
 * @returns Suspicious pattern detection results
 */
export async function detectSuspiciousPatterns(
  employeeId: string,
  date: Date
) {
  try {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: dayStart,
          lte: dayEnd
        }
      }
    });

    if (!attendance) {
      return { suspicious: false, reasons: [] };
    }

    const suspicious: string[] = [];

    // Check 1: Check-in and check-out from very different locations
    if (attendance.checkInLocation && attendance.checkOutLocation) {
      const checkInLoc = attendance.checkInLocation as any;
      const checkOutLoc = attendance.checkOutLocation as any;

      const distance = calculateDistance(
        {
          latitude: checkInLoc.latitude,
          longitude: checkInLoc.longitude
        },
        {
          latitude: checkOutLoc.latitude,
          longitude: checkOutLoc.longitude
        }
      );

      // If check-in and check-out locations are more than 5km apart
      if (distance > 5000) {
        suspicious.push(
          `Check-in and check-out locations are ${Math.round(distance / 1000)}km apart`
        );
      }
    }

    // Check 2: Multiple check-ins from unusual locations
    const recentRecords = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: new Date(dayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
        },
        checkInLocation: {
          not: null
        }
      }
    });

    if (recentRecords.length >= 3) {
      const locations = recentRecords
        .filter(r => r.checkInLocation)
        .map(r => {
          const loc = r.checkInLocation as any;
          return { latitude: loc.latitude, longitude: loc.longitude };
        });

      // Calculate variance in locations
      const distances: number[] = [];
      for (let i = 0; i < locations.length - 1; i++) {
        for (let j = i + 1; j < locations.length; j++) {
          distances.push(calculateDistance(locations[i], locations[j]));
        }
      }

      const avgDistance =
        distances.reduce((sum, d) => sum + d, 0) / distances.length;

      // If average distance between check-in locations is very high
      if (avgDistance > 10000) {
        suspicious.push(
          `High variance in check-in locations over the past week (avg ${Math.round(avgDistance / 1000)}km)`
        );
      }
    }

    console.log('Suspicious pattern detection:', {
      date: date.toLocaleDateString(),
      suspicious: suspicious.length > 0,
      patterns: suspicious.length
    });

    return {
      suspicious: suspicious.length > 0,
      reasons: suspicious,
      attendance
    };
  } catch (error) {
    console.error('Error detecting suspicious patterns:', error);
    throw error;
  }
}

/**
 * Get remote work statistics
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @param departmentId - Optional department filter
 * @returns Remote work statistics
 */
export async function getRemoteWorkStatistics(
  startDate: Date,
  endDate: Date,
  departmentId?: string
) {
  try {
    const where: any = {
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate)
      },
      checkInLocation: {
        not: null
      }
    };

    if (departmentId) {
      where.employee = {
        departmentId
      };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Classify each record
    const classified = records.map(record => {
      const loc = record.checkInLocation as any;
      const validation = validateOfficeLocation({
        latitude: loc.latitude,
        longitude: loc.longitude
      });

      return {
        record,
        workType: validation.withinGeofence ? 'OFFICE' : 'REMOTE',
        validation
      };
    });

    const stats = {
      totalRecords: records.length,
      officeWork: classified.filter(c => c.workType === 'OFFICE').length,
      remoteWork: classified.filter(c => c.workType === 'REMOTE').length,
      remotePercentage: 0
    };

    stats.remotePercentage =
      stats.totalRecords > 0
        ? (stats.remoteWork / stats.totalRecords) * 100
        : 0;

    // Group by employee
    const employeeStats = classified.reduce((acc, item) => {
      const empId = item.record.employeeId;
      if (!acc[empId]) {
        acc[empId] = {
          employee: item.record.employee,
          totalDays: 0,
          officeDays: 0,
          remoteDays: 0
        };
      }

      acc[empId].totalDays++;
      if (item.workType === 'OFFICE') {
        acc[empId].officeDays++;
      } else {
        acc[empId].remoteDays++;
      }

      return acc;
    }, {} as Record<string, any>);

    console.log('Remote work statistics:', {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      remotePercentage: stats.remotePercentage.toFixed(2) + '%'
    });

    return {
      period: {
        start: startDate,
        end: endDate
      },
      statistics: stats,
      employeeStatistics: Object.values(employeeStats)
    };
  } catch (error) {
    console.error('Error getting remote work statistics:', error);
    throw error;
  }
}

/**
 * Example usage demonstrating location-based attendance
 */
export async function runGeolocationExample() {
  try {
    console.log('=== Location-Based Attendance Example ===\n');

    const employeeId = 'emp-123'; // Replace with actual employee ID

    // 1. Check location validation
    console.log('1. Validating office location...');
    const officeLocation: Location = {
      latitude: 37.7749,
      longitude: -122.4194
    };
    const remoteLocation: Location = {
      latitude: 37.7849,
      longitude: -122.5194
    };

    validateOfficeLocation(officeLocation);
    validateOfficeLocation(remoteLocation);

    // 2. Check in from office
    console.log('\n2. Checking in from office location...');
    await checkInWithLocation(employeeId, officeLocation, false);

    // 3. Check in from remote location (with remote work allowed)
    console.log('\n3. Checking in from remote location...');
    // await checkInWithLocation(employeeId, remoteLocation, true);

    // 4. Get location history
    console.log('\n4. Getting location history...');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    await getLocationHistory(employeeId, startDate, endDate);

    // 5. Detect suspicious patterns
    console.log('\n5. Detecting suspicious patterns...');
    await detectSuspiciousPatterns(employeeId, new Date());

    // 6. Get remote work statistics
    console.log('\n6. Getting remote work statistics...');
    await getRemoteWorkStatistics(startDate, endDate);

    console.log('\n=== Example completed successfully ===');
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment to run the example
// runGeolocationExample();
