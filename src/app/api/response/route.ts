import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateUniqueUrl } from '@/lib/friendlyUrls';

export async function POST(request: NextRequest) {
  try {
    const { 
      threadId, 
      drawingData, 
      authorName, 
      positionX, 
      positionY, 
      rotation, // eslint-disable-line @typescript-eslint/no-unused-vars
      noteColor, 
      noteColorSecondary 
    } = await request.json();
    
    if (!threadId || !drawingData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current responses count to determine the owner index for this response
    const currentResponsesCount = await prisma.response.count({
      where: { threadId }
    });
    
    const newShareUrl = await generateUniqueUrl(prisma);
    
    const response = await prisma.response.create({
      data: {
        threadId,
        drawingData,
        authorName: authorName || 'Anonymous',
        shareUrl: newShareUrl,
        ownerIndex: currentResponsesCount, // This response will be at index currentResponsesCount
        isUsed: true, // Mark as used since we're creating the actual response
        positionX: positionX || 0,
        positionY: positionY || 0,
        rotation: 0, // Always 0 rotation for new responses
        noteColor: noteColor || '#B8C5A6',
        noteColorSecondary: noteColorSecondary || '#A8B896'
      }
    });

    return NextResponse.json({ 
      responseId: response.id, 
      shareUrl: newShareUrl 
    });
  } catch (error) {
    console.error('Error creating response:', error);
    return NextResponse.json({ error: 'Failed to create response' }, { status: 500 });
  }
}