import { put, del } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const entryId = formData.get('entryId') as string

    if (!file || !entryId) {
      return NextResponse.json({ error: 'File and entry ID required' }, { status: 400 })
    }

    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    // Create unique filename with entry ID
    const filename = `ledger-entries/${entryId}-${Date.now()}.pdf`

    const blob = await put(filename, file, {
      access: 'private',
    })

    return NextResponse.json({
      pathname: blob.pathname,
      url: blob.url,
      filename: filename,
    })
  } catch (error) {
    console.error('[v0] PDF upload error:', error)
    return NextResponse.json({ error: 'PDF upload failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pathname = searchParams.get('pathname')

    if (!pathname) {
      return NextResponse.json({ error: 'Pathname required' }, { status: 400 })
    }

    // Construct the full URL from pathname
    const url = `https://blob.vercelusercontent.com/${pathname}`
    await del(url)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] PDF delete error:', error)
    return NextResponse.json({ error: 'PDF delete failed' }, { status: 500 })
  }
}
