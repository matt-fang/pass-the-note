import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRandomQuestion } from '@/lib/questions';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { authorName } = body;
    const question = getRandomQuestion();
    const shareUrl = uuidv4();
    
    const thread = await prisma.noteThread.create({
      data: {
        question,
        responses: {
          create: {
            drawingData: '',
            shareUrl,
            authorName: authorName || 'Anonymous'
          }
        }
      },
      include: {
        responses: true
      }
    });
    
    return NextResponse.json({ 
      threadId: thread.id, 
      question,
      shareUrl 
    });
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { shareUrl, authorName } = await request.json();
    
    const response = await prisma.response.update({
      where: { shareUrl },
      data: {
        authorName: authorName || 'Anonymous'
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating thread:', error);
    return NextResponse.json({ error: 'Failed to update thread' }, { status: 500 });
  }
}