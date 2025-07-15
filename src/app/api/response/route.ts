import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { 
      threadId, 
      drawingData, 
      authorName, 
      positionX, 
      positionY, 
      rotation, 
      noteColor, 
      noteColorSecondary 
    } = await request.json();
    
    if (!threadId || !drawingData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newShareUrl = uuidv4();
    
    const response = await prisma.response.create({
      data: {
        threadId,
        drawingData,
        authorName: authorName || 'Anonymous',
        shareUrl: newShareUrl,
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