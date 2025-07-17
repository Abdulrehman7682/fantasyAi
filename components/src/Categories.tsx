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
  // E-Mail
  { title: "📧   Write an email to promote the sale", category: "📧   E-Mail", prompt: 'Create an email using the given information.\n\n Product: Skincare Set\nCustomer Persona: Proffessional Women, ages 35\nUnique Selling Point: All-natural\nDesired Action: Purchase Skincare Set'},
  { title: "📰   Newsletter template", category: "📧   E-Mail", prompt: 'Write a newsletter for crypto market trend. The newsletter is in e-mail format' },
  { title: "😡   Mail response for any angry clients", category: "📧   E-Mail", prompt: 'You need to write a posting, persuasive and polite response mail to the angry customer e-mail.\nMail: I have used your product and I did not like it at all'},
  { title: "✉️   Email subject lines for high open rates", category: "📧   E-Mail", prompt: 'Create email subject lines for high open rates. Make catchy creative and clickable subject line suggestion for the Email' },
  { title: "📣   Mass marketing email", category: "📧   E-Mail", prompt: 'I have a personal care company and I going to send a mass marketing email for the face mask product. This email should be persuasive, informative, creative.' },
  { title: "🎨   Text formalize prettifier and fixer", category: "📧   E-Mail", prompt:'Act as a text formalizer Prettifier and fixer. My first text is \'Hi I am free tommorow from 9 to 4, can we meet at the office and talk about the project? i have questions\'' },
  { title: "🤖   Email responder (friendly / professional)", category: "📧   E-Mail", prompt:'Considering the text I gave as an example, reply to an email sent to me separately in a friend text, a professinal text, and a welcoming text.' },

  // Business & Marketing
  { title: "📩   E-Mail generator", category: "💼   Business & Marketing", prompt:'Sell me this pen! Think creatively, concisely, smartly, shortly. ' },
  { title: "📱   Social Media manager", category: "💼   Business & Marketing", prompt:'\"I need help managing the presence of an organization in Twitter in order to increase brand awareness\"' },
  { title: "💡   Business idea", category: "💼   Business & Marketing", prompt:'Can you suggest 3 business ideas that I can start without investment? Give a different answer every time I ask.' },
  { title: "📈   Digital marketing strategy", category: "💼   Business & Marketing", prompt:'I want to sell shoes, how are digital marketing srategies determined and how are these strategies applied? Can you briefly explain in 1 Paragraph?' },
  { title: "🔍   SEO generator", category: "💼   Business & Marketing", prompt: 'Can you write me a short SEO friendly blog paragraph about the lifestyle of lions?' },
  { title: "📊   Slide presentation", category: "💼   Business & Marketing", prompt: 'By asking questions about the theme, where will it be used, you will prepare a Professional Slide Presentation with this information.' },
  { title: "📝   Prepare a professional business plan", category: "💼   Business & Marketing", prompt: 'Ask about my product and target country. You will create introduction, Phases for implementation, Differentiation from Copetitors, CONSs and PROs of the Business, Risks, Opportunities.' },
  { title: "📦   All-in-one marketing", category: "💼   Business & Marketing", prompt: 'Ask about my product. You will create descritption and pain points of the Targe Audience, Marketing Copy, Script for Social Media Video ad, List of Keywords for SEO.' },
  { title: "🧠   Social media caption generator", category: "💼   Business & Marketing", prompt:'Act as a Social Media Caption inspiration Generator. According to the information I have given, you will offer me 10 captions.\n\nConcept: Fitness and wellness Tupe and Platform: instagram Post\nCall to Action: Profile Click Emoji: Yes' },
  { title: "💰   Make $100 a day", category: "💼   Business & Marketing", prompt:'You are asuccessful entrepreneur. Tell me a strategy to make $100 a day with unique and easy ways. Explain how to scale after you tell me the strategy.' },
  { title: "👨‍💼   CEO (Virtual CEO Consultant)", category: "💼   Business & Marketing", prompt:'Act as CEO consultant. I will present you with business scenarios & challenges. Your role is to provide strategic advice, decisions,a nd solutions that a typical CEO would make. Your answers should reflect high-level executive thinking, considering the long-term impact, stakeholders, and overall company goals. You can start by asking me the topic.' },
  { title: "💼   Business Tax Advisor", category: "💼   Business & Marketing", prompt:'You are a successful tax advisor. Tell me how to manage my taxes as an entrepreneur. Ask me questions one at a time to clarify important points that will affect the tax management. Go step by step and simplify your explanation for me to understand easily.' },

  // Education
  { title: "🔬   Science chat", category: "📚   Education", prompt: 'Act like a professor. Every time I write you fyi, you will give me new information. You will present interesting information from basic sciences such as history and physics.' },
  { title: "👨‍🏫   English Teacher", category: "📚   Education", prompt: 'Act as an English teacher. Lessons should focus on pronunciation of English words, phrases and sentences. Briefly summarize the topic in maximum of two paragraphs.\nTopic: Adjective.' },
  { title: "🌐   Translator", category: "📚   Education", prompt: 'I will speak to you in any language and you will detect the language, translate it and answer in the corrected and improved version of my text, in English. My first sentence is "Hola"' },
  { title: "➗   Math Teacher", category: "📚   Education", prompt: 'I want you to act as a math teacher. I will provide some mathematical equations or concepts, and it will be your job to calculate them. My first request is "346 x 569"' },
  { title: "📄   Create a short essay on any topic", category: "📚   Education", prompt: 'Create a short essay on Glycemic Index.  It must be introduction, development, conclusion, shorter than 400 characters.' },
  { title: "📚   Citation Generator for any style", category: "📚   Education", prompt: 'You will write APA style citation.\nAuthor(s): Joe Schank\nTitle of entry: Where is AI?\nTitle of encyclopedia: AI In The World\nPublisher: AI Society\nPublication date: 01/22/2007' },
  { title: "🎓   Course generator on any topic", category: "📚   Education", prompt: 'You will write APA style citation.\nAuthor(s): Joe Schank\nTitle of entry: Where is AI?\nTitle of encyclopedia: AI In The World\nPublisher: AI Society\nPublication date: 01/22/2007' },

  // Art
  { title: "📖   Write J.K.Rowling-style short story", category: "🎨   Art", prompt: 'Write J. K. Rowling-style short story. Let it be a single paragraph and the story length should not exceed 400 characters.' },
  { title: "🎵   Write Travis Scott-style song lyrics", category: "🎨   Art", prompt: 'Write Travis Scott-style song lyrics' },
  { title: "🎶   Create a playlist similar to your favorite song", category: "🎨   Art", prompt: 'Act as a song recommender. I will provide you with a song and you will create a playlist of 10 songs that are similar to the given song. My first song is "Eminem - Business".' },
  { title: "🧙   Storyteller", category: "🎨   Art", prompt: 'What would happen if a non-technological person found himself in the world of high technology?' },
  { title: "📘   Book recommendation", category: "🎨   Art", prompt: 'Recommend 3 book story for me' },
  { title: "📝   Poem generator", category: "🎨   Art", prompt: 'Act as a poet. You will create poems that evoke emotions and have the power to stir people’s soul. Make sure your words convey the emotion you are trying to express in beautiful but meaningful ways. You can also come up with short verses that are still powerful enough to leave an imprint in readers’ minds. My first request is:\n"I need a poem about love."' },
  { title: "🎬   Movie and series critic", category: "🎨   Art", prompt: 'Act as Movie and Series critic. You will develop an engaging and creative review. You can cover topics like plot, themes and tone, acting and characters, direction, score, cinematography, production design, special effects, editing, pace, dialog. The most important aspect though is to emphasize how the movie has made you feel. You can also be critical about the movie. Please avoid spoilers.Movie: Everything Everywhere all at once' },
  { title: "🎤   Song generate according to your mood", category: "🎨   Art", prompt: 'You will suggest me 5 songs in accordance with the information I have given,\n\nMood: Millionaire\nGenre: Hip-Hop' },
  { title: "📺   Write a south park episode", category: "🎨   Art", prompt: 'Act like a screenwriter. I expect you to write a South Park episode using the information I gave you.\nGuest Cast: Elon Musk\nEpisode Subject: End of the world' },

  // Travel
  { title: "🧳   Vacation planner", category: "✈️   Travel" },
  { title: "🍱   Local foods", category: "✈️   Travel" },
  { title: "🗓️   Best time to visit", category: "✈️   Travel" },
  { title: "🏄   Activities", category: "✈️   Travel" },
  { title: "💵   Budgeting tips", category: "✈️   Travel" },
  { title: "📅   Prepare Itinerary", category: "✈️   Travel" },
  { title: "🛂   Cultural Legal Advisor For Safe Travels", category: "✈️   Travel" },
  { title: "🕰️   Time-Travel Machine", category: "✈️   Travel" },

  // Relationship
  { title: "💑   Dating Tips", category: "💑   Relationship" },
  { title: "🧠   Relationship Therapist", category: "💑   Relationship" },
  { title: "❤️   Sex Therapist", category: "💑   Relationship" },
  { title: "👗   Outfit Advisor for Upcoming Date", category: "💑   Relationship" },
  { title: "🎮   Game Generator for Couples", category: "💑   Relationship" },
  { title: "📊   Calculation of Relationship Score", category: "💑   Relationship" },
  { title: "💬   Deep Question to Ask to Partner", category: "💑   Relationship" },
  { title: "👫   Is My Relationship Healthy Or Not", category: "💑   Relationship" },

  // Social
  { title: "🎁   Gift Advice", category: "🗣️   Social" },
  { title: "🎉   Event suggestion", category: "🗣️   Social" },
  { title: "💘   Win someone's heart on a dating app", category: "🗣️   Social" },
  { title: "🧥   Personal stylist", category: "🗣️   Social" },
  { title: "👕   Outfit idea for event", category: "🗣️   Social" },
  { title: "💬   New topic to open a conversation", category: "🗣️   Social" },
  { title: "🎂   Birthday Message", category: "🗣️   Social" },

  // Health & Nutrition
  { title: "🧘   Life Coach", category: "🥗   Health & Nutrition" },
  { title: "🥗   Dietitian", category: "🥗   Health & Nutrition" },
  { title: "🏋️   Abs-Boosting workouts program", category: "🥗   Health & Nutrition" },
  { title: "🧘‍♀️   Yoga Poses", category: "🥗   Health & Nutrition" },
  { title: "🥙   Vegan Lunch", category: "🥗   Health & Nutrition" },
  { title: "🍽️   How many calories should I eat in a day?", category: "🥗   Health & Nutrition" },
  { title: "🎥   Youtube Channel about Health, Nutrition and Sports", category: "🥗   Health & Nutrition" },
  { title: "📅   Training Plan Generator", category: "🥗   Health & Nutrition" },

  // Greetings
  { title: "🎄   Merry Christmas", category: "🎁   Greetings" },
  { title: "👩‍👧   Happy Mother's Day", category: "🎁   Greetings" },
  { title: "🎉   Happy Birthday", category: "🎁   Greetings" },
  { title: "💘   Happy Valentine's Day", category: "🎁   Greetings" },
  { title: "💍   Happy Anniversary", category: "🎁   Greetings" },
  { title: "🦃   Happy Thanksgiving", category: "🎁   Greetings" },
  { title: "🎃   Happy Halloween", category: "🎁   Greetings" },
  { title: "🌍   Greetings in 101 languages", category: "🎁   Greetings" },
];
