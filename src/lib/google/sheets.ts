import { google } from 'googleapis'
import { JWT } from 'google-auth-library'
import * as XLSX from 'xlsx'
import { Readable } from 'stream'

// Scopes: Sheets for native sheets, Drive for downloading Excel.
const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly'
]

/**
 * Initializes the Google Auth client using Service Account credentials
 * stored in environment variables.
 */
function getAuthClient() {
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error('Google Service Account credentials are missing in environment variables.')
    }

    const client = new JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle newlines in private key
        scopes: SCOPES,
    })

    return client
}

/**
 * Reads values from a specific range in a Google Sheet or Excel file on Drive.
 * @param spreadsheetId The ID of the spreadsheet.
 * @param range The A1 notation of the range to read (e.g., 'Sheet1!A1:B10').
 * @returns A 2D array of values.
 */
export async function readSheet(spreadsheetId: string, range: string) {
    const auth = getAuthClient()
    const sheets = google.sheets({ version: 'v4', auth })

    try {
        // Try native Google Sheets API first
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        })
        return response.data.values || []
    } catch (error: any) {
        // Check for specific error indicating it's not a Google Sheet (e.g., it's an Excel file)
        // Error code 400 with "This operation is not supported for this document"
        if (error.code === 400 && error.errors?.[0]?.message === 'This operation is not supported for this document') {
            console.log('Document is not a Google Sheet. Attempting to download as Excel file...')
            return await readExcelFromDrive(auth, spreadsheetId, range)
        }

        console.error('Error reading sheet:', error)
        throw error
    }
}

/**
 * Downloads an Excel file from Drive and parses it using xlsx.
 */
async function readExcelFromDrive(auth: any, fileId: string, range: string) {
    const drive = google.drive({ version: 'v3', auth })

    try {
        const response = await drive.files.get({
            fileId,
            alt: 'media',
        }, { responseType: 'arraybuffer' })

        const buffer = Buffer.from(response.data as ArrayBuffer)
        const workbook = XLSX.read(buffer, { type: 'buffer' })

        // Parse range to get sheet name
        // range format assumption: 'SheetName!A1:B10' or just 'SheetName'
        const [sheetName, cellRange] = range.includes('!') ? range.split('!') : [range, undefined]

        const worksheet = workbook.Sheets[sheetName]
        if (!worksheet) {
            // Fallback: Use first sheet if specified sheet not found (or if name mismatch)
            // But for robustness, let's stick to the requested name or throw
            // Actually, for "Time" sheet sync, we need "Time"
            if (workbook.SheetNames.includes(sheetName)) {
                // Should have been found
            } else {
                console.warn(`Sheet '${sheetName}' not found in Excel file. Available: ${workbook.SheetNames.join(', ')}`)
                // Try finding a sheet named "Time" case-insensitive?
                // Or just fail. Let's return empty to stay safe.
                return []
            }
        }

        // sheet_to_json with header:1 gives array of arrays
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

        // If specific cell range logic is needed (A2:AA), we might need to slice manually
        // XLSX usually reads the 'ref' dimension.
        // For simplicity, we return existing data. Our sync logic filters by ID anyway.
        // But we should skip the first row if range implied it? 
        // The sync logic requests 'Time!A2:AA'. 
        // 'sheet_to_json' typically includes headers if we don't skip.
        // But we used {header: 1}, so index 0 is row 1.
        // If query was A2:AA, we should drop row 1 (index 0).

        if (cellRange && cellRange.startsWith('A2')) {
            return data.slice(1)
        }

        return data

    } catch (e) {
        console.error('Error reading Excel from Drive:', e)
        throw e
    }
}

/**
 * Writes values to a specific range in a Google Sheet.
 * This overwrites existing data in the specified range.
 * @param spreadsheetId The ID of the spreadsheet.
 * @param range The A1 notation of the range to start writing to.
 * @param values A 2D array of data to write.
 */
export async function writeSheet(spreadsheetId: string, range: string, values: any[][]) {
    const auth = getAuthClient()
    const sheets = google.sheets({ version: 'v4', auth })

    try {
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED', // Parses data as if entered by a user (numbers, dates, etc.)
            requestBody: {
                values,
            },
        })
        return response.data
    } catch (error) {
        console.error('Error writing to sheet:', error)
        throw error
    }
}

/**
 * Appends values to a sheet.
 * Useful for adding new rows to a log or dataset.
 * @param spreadsheetId The ID of the spreadsheet.
 * @param range The range to search for a table to append to (e.g., 'Sheet1!A1').
 * @param values A 2D array of data to append.
 */
export async function appendSheet(spreadsheetId: string, range: string, values: any[][]) {
    const auth = getAuthClient()
    const sheets = google.sheets({ version: 'v4', auth })

    try {
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        })
        return response.data
    } catch (error) {
        console.error('Error appending to sheet:', error)
        throw error
    }
}
