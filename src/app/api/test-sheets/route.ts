import { NextResponse } from 'next/server'
import { readSheet } from '@/lib/google/sheets'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const spreadsheetId = searchParams.get('id')
    const range = searchParams.get('range') || 'Sheet1!A1:B10'

    if (!spreadsheetId) {
        return NextResponse.json(
            { error: 'Missing spreadsheetId parameter' },
            { status: 400 }
        )
    }

    try {
        const data = await readSheet(spreadsheetId, range)
        return NextResponse.json({ data })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to read sheet' },
            { status: 500 }
        )
    }
}
