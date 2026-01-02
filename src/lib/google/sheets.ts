import { google } from 'googleapis'
import { JWT } from 'google-auth-library'

// Scopes required for reading and writing to Google Sheets
const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
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
 * Reads values from a specific range in a Google Sheet.
 * @param spreadsheetId The ID of the spreadsheet.
 * @param range The A1 notation of the range to read (e.g., 'Sheet1!A1:B10').
 * @returns A 2D array of values.
 */
export async function readSheet(spreadsheetId: string, range: string) {
    const auth = getAuthClient()
    const sheets = google.sheets({ version: 'v4', auth })

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        })
        return response.data.values || []
    } catch (error) {
        console.error('Error reading sheet:', error)
        throw error
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
