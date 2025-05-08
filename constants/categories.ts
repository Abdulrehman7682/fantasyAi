// filepath: /Users/wazeed/Downloads/App/FantasyAI/constants/categories.ts
import { Ionicons } from '@expo/vector-icons'; // Assuming Ionicons is used for iconName type

// Define Category type
export interface Category {
  id: string;
  title: string;
  description: string;
  iconName: keyof typeof Ionicons['glyphMap']; // Or a more specific type if icons are limited
  colors: string[];
  group: string;
  subTasks?: string[];
}

// Define and export the categories array
export const categories: Category[] = [
    {
      id: '1',
      title: 'Self-Growth',
      description: 'Become a better version of yourself',
      iconName: 'medal-outline',
      colors: ['#10B981', '#34D399'],
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
      colors: ['#F59E0B', '#FBBF24'],
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
      colors: ['#8B5CF6', '#A78BFA'],
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
      colors: ['#EF4444', '#F87171'],
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
      colors: ['#22C55E', '#4ADE80'],
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
      colors: ['#6366F1', '#818CF8'],
      group: 'Professional',
      subTasks: [
        'Help me prepare for a performance review.',
        'How can I improve my time management skills?',
        'Draft a professional email asking for feedback.',
      ]
    },
    {
      id: '6',
      title: 'Emails and Communication',
      description: 'Craft emails in seconds',
      iconName: 'mail-outline',
      colors: ['#0EA5E9', '#38BDF8'],
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
      colors: ['#EC4899', '#F472B6'],
      group: 'Personal'
    },
    {
      id: '8',
      title: 'Mental Health',
      description: 'Calm your mind and reduce stress',
      iconName: 'medical-outline',
      colors: ['#3B82F6', '#60A5FA'],
      group: 'Health'
    },
    {
      id: '9',
      title: 'Finance',
      description: 'Manage your money efficiently',
      iconName: 'cash-outline',
      colors: ['#14B8A6', '#2DD4BF'],
      group: 'Professional'
    },
    {
      id: '10',
      title: 'Education',
      description: 'Learn new skills and concepts',
      iconName: 'book-outline',
      colors: ['#D946EF', '#E879F9'],
      group: 'Professional'
    },
    {
      id: '11',
      title: 'Creativity',
      description: 'Unlock your creative potential',
      iconName: 'color-palette-outline',
      colors: ['#A855F7', '#C084FC'],
      group: 'Personal'
    },
    {
      id: '12',
      title: 'Productivity',
      description: 'Get more done in less time',
      iconName: 'timer-outline',
      colors: ['#F43F5E', '#FB7185'],
      group: 'Professional'
    },
    {
      id: '14',
      title: 'Travel Planner',
      description: 'Plan your next adventure',
      iconName: 'airplane-outline',
      colors: ['#06B6D4', '#22D3EE'],
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
      colors: ['#059669', '#10B981'],
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
      colors: ['#F97316', '#FB923C'],
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
      colors: ['#7C3AED', '#9333EA'],
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
      colors: ['#EA580C', '#F97316'],
      group: 'Learning'
    },
    {
      id: '19',
      title: 'Tutoring',
      description: 'Get help with any subject',
      iconName: 'school-outline',
      colors: ['#0891B2', '#06B6D4'],
      group: 'Learning'
    },
    {
      id: '20',
      title: 'Writing Assistance',
      description: 'Improve your writing skills',
      iconName: 'pencil-outline',
      colors: ['#DC2626', '#EF4444'],
      group: 'Professional'
    },
    {
      id: '21',
      title: 'Social Media',
      description: 'Craft engaging posts & captions',
      iconName: 'share-social-outline',
      colors: ['#0E7490', '#0891B2'],
      group: 'Professional'
    },
    {
      id: '22',
      title: 'Decision Support',
      description: 'Make informed choices',
      iconName: 'bulb-outline',
      colors: ['#D97706', '#F59E0B'],
      group: 'Personal'
    },
    {
      id: '23',
      title: 'Meal Planner',
      description: 'Personalized recipes & meal plans',
      iconName: 'restaurant-outline',
      colors: ['#F472B6', '#EC4899'],
      group: 'Lifestyle'
    },
    {
      id: '24',
      title: 'Personal Stylist',
      description: 'Shopping advice & style tips',
      iconName: 'shirt-outline',
      colors: ['#A78BFA', '#8B5CF6'],
      group: 'Lifestyle'
    }
];
