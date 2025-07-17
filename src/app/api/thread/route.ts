import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRandomQuestion } from '@/lib/questions';
import { generateUniqueUrl } from '@/lib/friendlyUrls';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { authorName } = body;
    const question = getRandomQuestion();
    const shareUrl = await generateUniqueUrl(prisma);
    
    const thread = await prisma.noteThread.create({
      data: {
        question,
        responses: {
          create: {
            drawingData: '',
            shareUrl,
            authorName: authorName || 'Anonymous',
            ownerIndex: 0, // First response is always at index 0
            isUsed: false // Initial response hasn't been used yet
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
    
    await prisma.response.update({
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