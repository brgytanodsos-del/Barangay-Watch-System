import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../db/index';
import * as response from '../utils/response';
// NOTE: Analytics now read from PostgreSQL (source of truth) not Firestore

export const getDashboardAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin' && userRole !== 'superadmin' && userRole !== 'tanod') {
      return response.error(res, "Administrative clearance required", "FORBIDDEN", 403);
    }

    let verified_residents = 0;
    let total_tanods = 0;
    let active_alerts = 0;
    const alertsByTypeMap: Record<string, number> = {};
    const alertsHistoryMap: Record<string, number> = {};

    try {
      // 1. Users overview — PostgreSQL
      const usersRes = await pool.query(
        "SELECT role, status FROM users WHERE status IN ('verified','active','approved')"
      );
      for (const u of usersRes.rows) {
        if (u.role === 'resident') verified_residents++;
        if (u.role === 'tanod') total_tanods++;
      }

      // 2. Alerts overview, types and history — PostgreSQL
      const alertsRes = await pool.query(
        "SELECT type, status, created_at FROM alerts"
      );
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      for (const a of alertsRes.rows) {
        // Active alerts
        if (['pending','active','responding'].includes(a.status)) {
          active_alerts++;
        }
        // Alert types
        if (a.type) {
          alertsByTypeMap[a.type] = (alertsByTypeMap[a.type] || 0) + 1;
        }
        // History
        const ts = a.created_at ? new Date(a.created_at).getTime() : 0;
        if (ts && ts >= sevenDaysAgo) {
          const dateStr = new Date(ts).toISOString().split('T')[0];
          alertsHistoryMap[dateStr] = (alertsHistoryMap[dateStr] || 0) + 1;
        }
      }
    } catch (dbErr: any) {
      console.error("[Analytics] PostgreSQL Fetch Error:", dbErr.message);
    }

    const alertsByTypeRows = Object.keys(alertsByTypeMap).map(type => ({
      type,
      count: alertsByTypeMap[type]
    })).sort((a, b) => b.count - a.count);

    const alertsHistoryRows = Object.keys(alertsHistoryMap).map(day => ({
      day,
      count: alertsHistoryMap[day]
    })).sort((a, b) => a.day.localeCompare(b.day));

    console.log(`[Analytics] Serving dashboard data. Residents: ${verified_residents}, Tanods: ${total_tanods}, ActiveAlerts: ${active_alerts}`);

    return response.success(res, {
      overview: { verified_residents, total_tanods, active_alerts },
      alertsByType: alertsByTypeRows,
      alertsHistory: alertsHistoryRows
    });

  } catch (err: any) {
    console.error("Analytics Dashboard Error:", err);
    return response.error(res, "Failed to compile tactical analytics. Data link unstable.", "SERVER_ERROR", 500);
  }
};

export const getHeatmapData = async (req: AuthRequest, res: Response) => {
  try {
    const heatmap: any[] = [];
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    try {
      const result = await pool.query(
        "SELECT id, type, location, created_at FROM alerts WHERE created_at > $1",
        [new Date(thirtyDaysAgo).toISOString()]
      );
      for (const a of result.rows) {
        let loc = a.location;
        if (typeof loc === 'string') loc = JSON.parse(loc);
        const lat = loc?.lat ?? loc?.latitude;
        const lng = loc?.lng ?? loc?.longitude;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          heatmap.push({
            id: a.id,
            type: a.type || 'UNKNOWN',
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            timestamp: new Date(a.created_at).getTime()
          });
        }
      }
    } catch (e: any) {
      console.error("[Heatmap] PostgreSQL query error:", e.message);
    }

    return res.json(heatmap);
  } catch (err: any) {
    console.error("Heatmap Analytics Error:", err);
    return response.error(res, err.message);
  }
};
