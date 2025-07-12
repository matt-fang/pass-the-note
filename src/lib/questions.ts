export const deepQuestions = [
  "What's a childhood memory that still makes you smile?",
  "If you could have dinner with anyone, living or dead, who would it be and why?",
  "What's something you've learned about yourself this year?",
  "What would you do if you knew you couldn't fail?",
  "What's the best advice someone has ever given you?",
  "What are you most grateful for right now?",
  "If you could change one thing about the world, what would it be?",
  "What's a fear you've overcome or are working to overcome?",
  "What makes you feel most alive?",
  "What's something you wish people knew about you?",
  "What's a moment that changed your perspective on life?",
  "If you could master any skill instantly, what would it be?",
  "What's something you've always wanted to try but haven't yet?",
  "What does success mean to you?",
  "What's the most important lesson you've learned from a mistake?",
  "If you could give your younger self one piece of advice, what would it be?",
  "What's something that always makes you laugh?",
  "What's a goal you're working toward right now?",
  "What's something you admire about your closest friends?",
  "What's a small act of kindness that had a big impact on you?"
];

export function getRandomQuestion(): string {
  return deepQuestions[Math.floor(Math.random() * deepQuestions.length)];
}