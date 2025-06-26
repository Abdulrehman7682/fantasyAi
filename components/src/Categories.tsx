import { Ionicons } from '@expo/vector-icons';

export interface Category {
  id: string;
  title: string;
  description: string;
  iconName: keyof typeof Ionicons['glyphMap']; // Or a more specific type if icons are limited
  colors: string[];
  group: string;
  subTasks?: string[];
}
export const categories: Category[] = [
  {
    id: '1',
    title: 'Self-Growth',
    description: 'Become a better version of yourself',
    iconName: 'medal-outline',
    colors: ['#10B981', '#34D399'], // Updated Gradient
    group: 'Personal',
    subTasks: [
      'Help me set a goal for this week.',
      'Suggest a book about overcoming procrastination.',
      'Give me a 5-minute mindfulness exercise.',
    ]
  },
  {
    id: '2',
    title: 'Lifestyle',
    description: 'Fill your life with purpose and joy',
    iconName: 'sunny-outline',
    colors: ['#F59E0B', '#FBBF24'], // Updated Gradient
    group: 'Personal',
    subTasks: [
      'Suggest a new hobby based on my interests.',
      'Give me ideas for a relaxing weekend.',
      'How can I incorporate more joy into my daily routine?',
    ]
  },
  {
    id: '3',
    title: 'Spirituality',
    description: 'Enrich your life with wisdom',
    iconName: 'sparkles-outline',
    colors: ['#8B5CF6', '#A78BFA'], // Updated Gradient
    group: 'Personal',
    subTasks: [
      'Explain the concept of mindfulness.',
      'Share a quote about inner peace.',
      'Suggest a simple meditation technique.',
    ]
  },
  {
    id: '4',
    title: 'Fitness',
    description: 'Achieve your fitness goals',
    iconName: 'fitness-outline',
    colors: ['#EF4444', '#F87171'], // Updated Gradient
    group: 'Health',
    subTasks: [
      'Create a 15-minute home workout plan.',
      'What are the benefits of stretching daily?',
      'Suggest healthy post-workout snacks.',
    ]
  },
  {
    id: '13',
    title: 'Nutrition',
    description: 'Eat healthy and feel great',
    iconName: 'nutrition-outline',
    colors: ['#22C55E', '#4ADE80'], // Updated Gradient
    group: 'Health',
    subTasks: [
      'Give me ideas for healthy breakfasts.',
      'Explain the benefits of drinking more water.',
      'Suggest ways to reduce sugar intake.',
    ]
  },
  {
    id: '5',
    title: 'Career',
    description: 'Get your work done faster',
    iconName: 'briefcase-outline',
    colors: ['#6366F1', '#818CF8'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Help me prepare for a performance review.',
      'How can I improve my time management skills?',
      'Draft a professional email asking for feedback.',
    ]
  },
  {
    id: '6',
    title: 'Emails and Communication', // Ensure title matches map key
    description: 'Craft emails in seconds',
    iconName: 'mail-outline',
    colors: ['#0EA5E9', '#38BDF8'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Draft a follow-up email after a meeting.',
      'Help me write a polite decline email.',
      'Give tips for clear and concise communication.',
    ]
  },
  {
    id: '7',
    title: 'Relationships',
    description: 'Build stronger connections',
    iconName: 'heart-outline',
    colors: ['#EC4899', '#F472B6'], // Updated Gradient
    group: 'Personal',
    subTasks: [
      'How can I improve communication with my partner?',
      'Suggest ways to resolve conflicts healthily.',
      'Give tips for maintaining long-distance relationships.',
    ]
  },
  {
    id: '8',
    title: 'Mental Health',
    description: 'Calm your mind and reduce stress',
    iconName: 'medical-outline',
    colors: ['#3B82F6', '#60A5FA'], // Updated Gradient
    group: 'Health',
    subTasks: [
      'Suggest techniques to manage anxiety.',
      'How can I practice self-compassion?',
      'Give me tips for improving sleep quality.',
    ]
  },
  {
    id: '9',
    title: 'Finance',
    description: 'Manage your money efficiently',
    iconName: 'cash-outline',
    colors: ['#14B8A6', '#2DD4BF'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Help me create a simple monthly budget.',
      'Explain the basics of investing.',
      'Suggest ways to save money on groceries.',
    ]
  },
  {
    id: '10',
    title: 'Education',
    description: 'Learn new skills and concepts',
    iconName: 'book-outline',
    colors: ['#D946EF', '#E879F9'], // Updated Gradient
    group: 'Learning', // Changed group to Learning
    subTasks: [
      'Explain the concept of [topic].',
      'Suggest resources for learning [skill].',
      'Help me create a study plan.',
    ]
  },
  {
    id: '11',
    title: 'Creativity',
    description: 'Unlock your creative potential',
    iconName: 'color-palette-outline',
    colors: ['#A855F7', '#C084FC'], // Updated Gradient
    group: 'Personal',
    subTasks: [
      'Give me a creative writing prompt.',
      'Suggest ways to overcome creative blocks.',
      'How can I find inspiration for my art?',
    ]
  },
  {
    id: '12',
    title: 'Productivity',
    description: 'Get more done in less time',
    iconName: 'timer-outline',
    colors: ['#F43F5E', '#FB7185'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Help me prioritize my tasks for today.',
      'Suggest tools for better time management.',
      'How can I avoid distractions while working?',
    ]
  },
  // --- New Assistants Start ---
  {
    id: '14',
    title: 'Travel Planner',
    description: 'Plan your next adventure',
    iconName: 'airplane-outline',
    colors: ['#06B6D4', '#22D3EE'], // Updated Gradient
    group: 'Lifestyle',
    subTasks: [
      'Suggest destinations for a weekend trip.',
      'Create a packing list for a beach vacation.',
      'Find budget-friendly travel tips.',
    ]
  },
  {
    id: '15',
    title: 'Resume Builder',
    description: 'Craft professional resumes & letters',
    iconName: 'document-text-outline',
    colors: ['#059669', '#10B981'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Help me write a summary for my resume.',
      'What are common resume mistakes to avoid?',
      'Draft a cover letter template.',
    ]
  },
  {
    id: '16',
    title: 'Industry Research',
    description: 'Analyze market trends & insights',
    iconName: 'analytics-outline',
    colors: ['#F97316', '#FB923C'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Summarize recent trends in the tech industry.',
      'Find statistics about renewable energy growth.',
      'Who are the key competitors in the e-commerce market?',
    ]
  },
  {
    id: '17',
    title: 'Interview Prep',
    description: 'Ace your next job interview',
    iconName: 'chatbubbles-outline',
    colors: ['#7C3AED', '#9333EA'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Give me common behavioral interview questions.',
      'Help me practice the STAR method for answering questions.',
      'What questions should I ask the interviewer?',
    ]
  },
  {
    id: '18',
    title: 'Language Learning',
    description: 'Master a new language',
    iconName: 'language-outline',
    colors: ['#EA580C', '#F97316'], // Updated Gradient
    group: 'Learning',
    subTasks: [
      'Translate "[phrase]" to [language].',
      'Give me tips for practicing speaking skills.',
      'Suggest resources for learning vocabulary.',
    ]
  },
  {
    id: '19',
    title: 'Tutoring',
    description: 'Get help with any subject',
    iconName: 'school-outline',
    colors: ['#0891B2', '#06B6D4'], // Updated Gradient
    group: 'Learning',
    subTasks: [
      'Explain the Pythagorean theorem.',
      'Help me understand [historical event].',
      'Quiz me on [subject topic].',
    ]
  },
  {
    id: '20',
    title: 'Writing Assistance',
    description: 'Improve your writing skills',
    iconName: 'pencil-outline',
    colors: ['#DC2626', '#EF4444'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Proofread this paragraph for errors.',
      'Suggest alternative phrasing for "[sentence]".',
      'Help me brainstorm ideas for an essay.',
    ]
  },
  {
    id: '21',
    title: 'Social Media',
    description: 'Craft engaging posts & captions',
    iconName: 'share-social-outline',
    colors: ['#0E7490', '#0891B2'], // Updated Gradient
    group: 'Professional',
    subTasks: [
      'Write a catchy caption for a photo of [subject].',
      'Suggest hashtags for a post about [topic].',
      'Give ideas for engaging Instagram stories.',
    ]
  },
  {
    id: '22',
    title: 'Decision Support',
    description: 'Make informed choices',
    iconName: 'bulb-outline',
    colors: ['#D97706', '#F59E0B'], // Updated Gradient
    group: 'Personal',
    subTasks: [
      'Help me weigh the pros and cons of [decision].',
      'What factors should I consider when choosing [option A] vs [option B]?',
      'Give me a framework for making difficult decisions.',
    ]
  },
  {
    id: '23',
    title: 'Meal Planner',
    description: 'Personalized recipes & meal plans',
    iconName: 'restaurant-outline',
    colors: ['#F472B6', '#EC4899'], // Pink/Rose Gradient
    group: 'Lifestyle',
    subTasks: [
      'Suggest a healthy dinner recipe using chicken.',
      'Create a meal plan for a vegetarian diet.',
      'Give me ideas for quick and easy lunches.',
    ]
  },
  {
    id: '24',
    title: 'Personal Stylist',
    description: 'Shopping advice & style tips',
    iconName: 'shirt-outline',
    colors: ['#A78BFA', '#8B5CF6'], // Purple Gradient
    group: 'Lifestyle',
    subTasks: [
      'What should I wear for a job interview?',
      'Suggest outfits for a casual weekend.',
      'Give tips for building a capsule wardrobe.',
    ]
  }
  // --- Additional Assistants End ---
  // --- New Assistants End ---
];

export const prompts = [
  { title: "Tell me a joke", category: "Funny" },
  { title: "Why did the chicken cross the road?", category: "Funny" },
  { title: "Funniest thing that happened today?", category: "Funny" },
  
  { title: "Give me daily motivation", category: "Motivational" },
  { title: "How to stay consistent?", category: "Motivational" },
  { title: "Quote to start my day", category: "Motivational" },

  { title: "Write a romantic poem", category: "Romantic" },
  { title: "Best romantic gift ideas?", category: "Romantic" },
  { title: "Cute message for my partner", category: "Romantic" },

  { title: "Tell me a sad story", category: "Sad" },
  { title: "Make me emotional", category: "Sad" },
  { title: "Heartbreaking moment in history", category: "Sad" },

  { title: "Give me random facts", category: "Other" },
  { title: "Surprise me with something cool", category: "Other" },
  { title: "What’s something most people don’t know?", category: "Other" },
];