// app/api/tentor/jurnal-siswa/route.ts
// API route for saving/updating student work (soal/tugas) in journal

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { compressImage, validateImageFile } from '@/lib/image-utils'

export const dynamic = 'force-dynamic'

interface JurnalSiswaRequest {
  sesiSiswaId: string
  siswaId: string
  sesiId: string
  jurnalId?: string
  catatan: string
  fotoFile?: string // base64 encoded
  fotoPathLama?: string
  intent?: 'save' | 'close'
}

/**
 * POST: Save or update student work (jurnal_siswa)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const authRes = await supabase.auth.getUser()
    const userId = authRes.data.user?.id

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: JurnalSiswaRequest = await request.json()
    const {
      sesiSiswaId,
      siswaId,
      sesiId,
      jurnalId,
      catatan,
      fotoFile,
      fotoPathLama,
      intent,
    } = body

    // Validate required fields
    if (!sesiSiswaId || !siswaId || !sesiId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify session ownership
    const sesiCheck = await supabase
      .from('sesi')
      .select('id, tentor_id, status')
      .eq('id', sesiId)
      .eq('tentor_id', userId)
      .maybeSingle()

    if (!sesiCheck) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 403 }
      )
    }

    // Check if session is already closed
    const statusSesi = String(sesiCheck.status || '').toLowerCase()
    if (statusSesi === 'selesai') {
      return NextResponse.json(
        { error: 'Session is already closed' },
        { status: 400 }
      )
    }

    let fotoUrl: string | null = null
    let fotoPath: string | null = null

    // Handle photo upload if provided
    console.log('[DEBUG] fotoFile present:', !!fotoFile, fotoFile ? `length=${fotoFile.length}` : 'null')
    
    if (fotoFile) {
      try {
        // Decode base64
        const base64Data = fotoFile.replace(/^data:image\/\w+;base64,/, '')
        console.log('[DEBUG] base64Data length:', base64Data.length)
        
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: 'image/jpeg' })
        console.log('[DEBUG] blob created, size:', blob.size)

        // Compress image
        const compressed = await compressImage(
          new File([blob], 'photo.jpg', { type: 'image/jpeg' }),
          { maxWidth: 1920, maxHeight: 1920, quality: 0.85, maxSizeMB: 1 }
        )
        console.log('[DEBUG] compressed, size:', compressed.blob.size)

        // Upload to Supabase Storage
        const ext = 'jpg'
        const path = `soal-tugas-siswa/${userId}/${sesiId}/${siswaId}/${Date.now()}.${ext}`
        console.log('[DEBUG] uploading to path:', path)

        const { error: uploadError } = await supabase.storage
          .from('soal-tugas-siswa')
          .upload(path, compressed.blob, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (uploadError) {
          console.error('[DEBUG] upload error:', uploadError)
          throw new Error(`Upload failed: ${uploadError.message}`)
        }
        console.log('[DEBUG] upload success')

        const { data: urlData } = supabase.storage
          .from('soal-tugas-siswa')
          .getPublicUrl(path)

        fotoUrl = urlData.publicUrl
        fotoPath = path
        console.log('[DEBUG] fotoUrl:', fotoUrl)

        // Delete old photo if exists
        if (fotoPathLama) {
          console.log('[DEBUG] deleting old photo:', fotoPathLama)
          await supabase.storage.from('soal-tugas-siswa').remove([fotoPathLama])
        }
      } catch (uploadError) {
        console.error('Photo upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload photo' },
          { status: 500 }
        )
      }
    }

    // Find or create jurnal if not exists
    let jurnalUuid = jurnalId
    if (!jurnalUuid) {
      const jurnalCheck = await supabase
        .from('jurnal')
        .select('id')
        .eq('sesi_id', sesiId)
        .maybeSingle()

      if (jurnalCheck?.data) {
        jurnalUuid = jurnalCheck.data.id
      } else {
        // Create jurnal entry
        const { data: newJurnal, error: jurnalError } = await supabase
          .from('jurnal')
          .insert({
            sesi_id: sesiId,
            tentor_id: userId,
            materi: '-',
          })
          .select('id')
          .single()

        if (jurnalError || !newJurnal) {
          return NextResponse.json(
            { error: 'Failed to create jurnal' },
            { status: 500 }
          )
        }
        jurnalUuid = newJurnal.id
      }
    }

    // Upsert jurnal_siswa
    console.log('[DEBUG] Upserting jurnal_siswa with:', {
      sesi_siswa_id: sesiSiswaId,
      jurnal_id: jurnalUuid,
      soal_tugas_url: fotoUrl,
      soal_tugas_path: fotoPath,
      catatan: catatan || null,
    })
    
    const { data: jurnalSiswa, error: jurnalSiswaError } = await supabase
      .from('jurnal_siswa')
      .upsert(
        {
          sesi_siswa_id: sesiSiswaId,
          jurnal_id: jurnalUuid,
          soal_tugas_url: fotoUrl,
          soal_tugas_path: fotoPath,
          catatan: catatan || null,
        },
        { onConflict: 'sesi_siswa_id,jurnal_id' }
      )
      .select('id')
      .single()

    if (jurnalSiswaError) {
      console.error('Jurnal siswa error:', jurnalSiswaError)
      return NextResponse.json(
        { error: 'Failed to save student work' },
        { status: 500 }
      )
    }
    
    console.log('[DEBUG] jurnal_siswa upserted successfully:', jurnalSiswa)
    console.log('[DEBUG] Final response:', { success: true, jurnalSiswaId: jurnalSiswa.id, fotoUrl, fotoPath })

    return NextResponse.json({
      success: true,
      jurnalSiswaId: jurnalSiswa.id,
      fotoUrl,
      fotoPath,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Delete student work entry
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const authRes = await supabase.auth.getUser()
    const userId = authRes.data.user?.id

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jurnalSiswaId = searchParams.get('id')

    if (!jurnalSiswaId) {
      return NextResponse.json(
        { error: 'Missing jurnal_siswa ID' },
        { status: 400 }
      )
    }

    // Verify ownership via jurnal_siswa -> sesi_siswa -> sesi
    const { data: jurnalSiswa } = await supabase
      .from('jurnal_siswa')
      .select(`
        id,
        sesi_siswa!inner(
          sesi_id
        ),
        jurnal!inner(
          sesi_id
        )
      `)
      .eq('id', jurnalSiswaId)
      .single()

    if (!jurnalSiswa) {
      return NextResponse.json(
        { error: 'Student work not found' },
        { status: 404 }
      )
    }

    // Verify tutor owns the session
    const sesiId = (jurnalSiswa.jurnal as unknown as { sesi_id: string }).sesi_id
    const sesiCheck = await supabase
      .from('sesi')
      .select('tentor_id')
      .eq('id', sesiId)
      .eq('tentor_id', userId)
      .maybeSingle()

    if (!sesiCheck) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete the entry
    const { error: deleteError } = await supabase
      .from('jurnal_siswa')
      .delete()
      .eq('id', jurnalSiswaId)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
