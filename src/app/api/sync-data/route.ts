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

        // 1. Read Sheet Data
        // Assuming headers are in row 1, so we start reading from row 2 (A2)
        const rows = await readSheet(spreadsheetId, 'Time!A2:AA') // Reading up to col AA (27 cols)

        if (!rows || rows.length === 0) {
            return NextResponse.json({ message: 'No data found in sheet' })
        }

        console.log(`Found ${rows.length} rows. Processing...`)

        // 2. Map Data
        const mapped = rows.map(mapRowToEntry)

        // Log rows that are missing an ID (empty or not a number)
        rows.forEach((row, index) => {
            if (!row[0] || isNaN(parseInt(row[0]))) {
                console.log(`Fila ${index + 2} (A2 offset): Sin ID o dato vacío detectado:`, row)
            }
        })

        const entries = mapped.filter(e => e.id) // Filter out only rows with invalid IDs (required for upsert)

        if (entries.length === 0) {
            console.warn(`All ${rows.length} rows were filtered out. Sample raw row:`, rows[0])
            console.warn(`Sample mapped row:`, mapped[0])
            return NextResponse.json({
                message: 'No valid entries to sync',
                count: 0
            })
        }

        // 3. Upsert to Supabase
        // Use SERVICE_ROLE_KEY to bypass RLS for this system operation
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Batch upsert
        const { error } = await supabase
            .from('time_entries')
            .upsert(entries, {
                onConflict: 'id',
                ignoreDuplicates: false
            })

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            message: 'Sync successful',
            count: entries.length
        })

    } catch (error: any) {
        console.error('Sync error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
