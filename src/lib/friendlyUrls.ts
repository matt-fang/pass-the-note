// Friendly URL generator using 3 random words
import { PrismaClient } from '@prisma/client';
const adjectives = [
  'happy', 'sunny', 'bright', 'quick', 'sweet', 'cool', 'warm', 'fresh', 'smooth', 'soft',
  'funny', 'clever', 'brave', 'kind', 'wise', 'calm', 'bold', 'sharp', 'clear', 'pure',
  'light', 'dark', 'rich', 'deep', 'wild', 'free', 'loud', 'quiet', 'fast', 'slow'
];

const nouns = [
  'cat', 'dog', 'bird', 'fish', 'star', 'moon', 'sun', 'tree', 'rock', 'wave',
  'book', 'song', 'dance', 'dream', 'smile', 'laugh', 'hug', 'kiss', 'hope', 'love',
  'rain', 'snow', 'wind', 'fire', 'water', 'earth', 'sky', 'cloud', 'flower', 'leaf'
];

const verbs = [
  'runs', 'jumps', 'flies', 'swims', 'sings', 'dances', 'plays', 'laughs', 'smiles', 'shines',
  'grows', 'flows', 'glows', 'moves', 'spins', 'hops', 'skips', 'walks', 'climbs', 'slides',
  'bounces', 'floats', 'soars', 'zooms', 'twirls', 'wiggles', 'giggles', 'sparkles', 'glimmers', 'beams'
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateFriendlyUrl(): string {
  const adjective = getRandomElement(adjectives);
  const noun = getRandomElement(nouns);
  const verb = getRandomElement(verbs);
  
  return `${adjective}-${noun}-${verb}`;
}

// Check if a friendly URL already exists in the database
export async function isUrlUnique(url: string, prisma: PrismaClient): Promise<boolean> {
  const existing = await prisma.response.findFirst({
    where: { shareUrl: url }
  });
  return !existing;
}

// Generate a unique friendly URL
export async function generateUniqueUrl(prisma: PrismaClient): Promise<string> {
  let url: string;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    url = generateFriendlyUrl();
    attempts++;
    
    if (attempts >= maxAttempts) {
      // Fallback to adding a number if we can't find a unique combination
      url = `${url}-${Math.floor(Math.random() * 1000)}`;
      break;
    }
  } while (!(await isUrlUnique(url, prisma)));
  
  return url;
}