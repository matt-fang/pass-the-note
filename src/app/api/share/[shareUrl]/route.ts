import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareUrl: string }> }
) {
  try {
    const { shareUrl } = await params;
    const response = await prisma.response.findUnique({
      where: { shareUrl },
      include: {
        thread: {
          include: {
            responses: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    });

    if (!response) {
      return NextResponse.json({ error: 'Share URL not found' }, { status: 404 });
    }

    // Check if this shareUrl has already been responded to
    const nextResponse = await prisma.response.findFirst({
      where: {
        threadId: response.threadId,
        createdAt: { gt: response.createdAt }
      }
    });

    return NextResponse.json({
      thread: response.thread,
      canEdit: !nextResponse,
      nextShareUrl: nextResponse?.shareUrl || null
    });
  } catch (error) {
    console.error('Error fetching shared thread:', error);
    return NextResponse.json({ error: 'Failed to fetch shared thread' }, { status: 500 });
  }
}