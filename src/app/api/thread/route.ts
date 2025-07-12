import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRandomQuestion } from '@/lib/questions';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
  try {
    const question = getRandomQuestion();
    const shareUrl = uuidv4();
    
    const thread = await prisma.noteThread.create({
      data: {
        question,
        responses: {
          create: {
            drawingData: '',
            shareUrl,
            authorName: 'Original Question'
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