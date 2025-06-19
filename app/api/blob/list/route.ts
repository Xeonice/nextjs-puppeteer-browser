import { NextRequest, NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const prefix = searchParams.get('prefix') || 'screenshot';

    const { blobs } = await list({
      limit,
      prefix
    });

    const response = NextResponse.json({
      success: true,
      blobs: blobs.map(blob => ({
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        pathname: blob.pathname,
        uploadedAt: blob.uploadedAt
      })),
      count: blobs.length
    });

    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    return response;

  } catch (error) {
    console.error('Blob list error:', error);
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to list blobs', 
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
    
    errorResponse.headers.set('Content-Type', 'application/json; charset=utf-8');
    return errorResponse;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      const errorResponse = NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
      errorResponse.headers.set('Content-Type', 'application/json; charset=utf-8');
      return errorResponse;
    }

    await del(url);

    const response = NextResponse.json({
      success: true,
      message: 'Blob deleted successfully',
      deletedUrl: url
    });

    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    return response;

  } catch (error) {
    console.error('Blob delete error:', error);
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to delete blob', 
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
    
    errorResponse.headers.set('Content-Type', 'application/json; charset=utf-8');
    return errorResponse;
  }
} 