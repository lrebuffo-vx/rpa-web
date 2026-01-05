import { NextResponse } from 'next/server'
import { readSheet } from '@/lib/google/sheets'
import { createClient } from '@supabase/supabase-js'

// Mapping function to convert Excel row to DB object
function mapRowToEntry(row: any[]) {
    // Helper to parse date from Excel serial number or custom string formats
    const parseExcelDate = (value: any) => {
        if (!value) return null

        // Handle Excel serial number (number of days since 1899-12-30)
        if (typeof value === 'number' && !isNaN(value)) {
            const utc_days = Math.floor(value - 25569)
            const utc_value = utc_days * 86400
            const date_info = new Date(utc_value * 1000)
            return date_info.toISOString()
        }

        if (typeof value === 'string') {
            // Normalize "a.m."/"p.m." to "AM"/"PM" (case insensitive, remove periods)
            let normalized = value.toLowerCase()
                .replace(/a\.m\./g, 'AM')
                .replace(/p\.m\./g, 'PM')
                .trim()

            // Handle DD/MM/YYYY format specifically to avoid MM/DD/YYYY ambiguity
            // Matches: 04/11/2025 or 04/11/2025 09:00 AM
            const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)$/
            const match = normalized.match(ddmmyyyyRegex)

            if (match) {
                const [_, day, month, year, rest] = match
                // Reformat to YYYY-MM-DD for standard parsing
                normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${rest}`
            }

            const date = new Date(normalized)
            if (!isNaN(date.getTime())) {
                return date.toISOString()
            }
        }

        return null
    }

    // Indices based on the user provided list:
    // 0: ID, 1: Date, 2: Date/time, 3: End date/time
    // 4: Project, 5: Who, 6: Description, 7: Project category
    // 8: Company, 9: Task list, 10: Task, 11: Parent task
    // 12: Is sub-task, 13: Is billable, 14: Invoice number
    // 15: Hours, 16: Minutes, 17: Decimal hours
    // 18: Estimated time, 19: Estimated time (Hours), 20: Estimated time (Minutes)
    // 21: Tags, 22: Task tags, 23: First name, 24: Last name
    // 25: User ID, 26: Task ID

    return {
        id: parseInt(row[0]),
        date: parseExcelDate(row[1]),
        start_time: parseExcelDate(row[2]),
        end_time: parseExcelDate(row[3]),
        project_name: row[4],
        user_full_name: row[5],
        description: row[6],
        project_category: row[7],
        company: row[8],
        task_list: row[9],
        task_name: row[10],
        parent_task: row[11],
        is_sub_task: !!row[12],
        is_billable: row[13] === 1 || row[13] === 'Yes', // Handle possible variations
        invoice_number: row[14],
        hours: parseInt(row[15]) || 0,
        minutes: parseInt(row[16]) || 0,
        decimal_hours: parseFloat(row[17]) || 0,
        estimated_time: parseFloat(row[18]) || 0,
        estimated_hours: parseFloat(row[19]) || 0,
        estimated_minutes: parseFloat(row[20]) || 0,
        tags: row[21],
        task_tags: row[22],
        first_name: row[23],
        last_name: row[24],
        external_user_id: parseInt(row[25]),
        external_task_id: parseInt(row[26]),
    }
}

export async function POST() {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID_TIME_ENTRIES
        if (!spreadsheetId) {
            return NextResponse.json(
                { error: 'GOOGLE_SHEET_ID_TIME_ENTRIES not configured' },
                { status: 500 }
            )
        }

        console.log('Starting sync from sheet:', spreadsheetId)

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // --- 1. Sync Time Entries (Hoja 'Time') ---
        const rowsTime = await readSheet(spreadsheetId, 'Time!A2:AA')
        let syncCountTime = 0

        if (rowsTime && rowsTime.length > 0) {
            const mapped = rowsTime.map(mapRowToEntry)
            const entries = mapped.filter(e => e.id)

            if (entries.length > 0) {
                const { error } = await supabase
                    .from('time_entries')
                    .upsert(entries, { onConflict: 'id' })

                if (error) throw new Error(`Error syncing time_entries: ${error.message}`)
                syncCountTime = entries.length
            }
        }

        // --- 2. Sync Planning (Hoja 'Planificacion') ---
        const rowsPlanning = await readSheet(spreadsheetId, 'Planificacion!A2:I')
        let syncCountPlanning = 0

        if (rowsPlanning && rowsPlanning.length > 0) {
            // Mapping based on user list:
            // 0: Periodo, 1: Mes, 2: Nombre, 3: Capacidad (hs), 
            // 4: Actividad, 5: Prioridad Actividad, 6: Tiempo (%), 7: Tiempo (hs)
            const planningEntries = rowsPlanning.map(row => {
                const period = parseInt(row[0])
                const firstName = row[2]
                if (isNaN(period) || !firstName) return null

                return {
                    period,
                    month_name: row[1],
                    first_name: firstName,
                    capacity_hours: parseFloat(row[3]) || 0,
                    activity: row[4],
                    priority: row[5],
                    planned_percentage: parseFloat(row[6]) || 0,
                    planned_hours: parseFloat(row[7]) || 0
                }
            }).filter(Boolean) as any[]

            if (planningEntries.length > 0) {
                const { error } = await supabase
                    .from('planning_entries')
                    .upsert(planningEntries, { onConflict: 'period,first_name,activity' })

                if (error) throw new Error(`Error syncing planning_entries: ${error.message}`)
                syncCountPlanning = planningEntries.length
            }
        }

        return NextResponse.json({
            message: 'Sync successful',
            time_entries_count: syncCountTime,
            planning_entries_count: syncCountPlanning
        })

    } catch (error: any) {
        console.error('Sync error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
