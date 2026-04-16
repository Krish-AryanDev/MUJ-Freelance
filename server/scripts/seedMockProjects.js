import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDBWithRetry, disconnectDB } from '../config/db.js';
import Project from '../models/Project.model.js';
import User from '../models/User.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const projectBlueprints = [
  {
    title: 'MUJ Campus Event Booking Portal Revamp',
    description:
      'Need a complete redesign and implementation of our event booking portal for MUJ clubs. The portal should support event listings, booking, QR pass generation, and admin moderation. Focus on responsive UI and smooth user experience.',
    category: 'WEB_DEVELOPMENT',
    skillsRequired: ['Next.js', 'React', 'Node.js', 'MongoDB'],
    budget: { min: 25000, max: 45000, type: 'fixed' },
    deadlineDays: 18,
    proposalCount: 3,
  },
  {
    title: 'Food Delivery Android App for Hostel Blocks',
    description:
      'Build a cross-platform app for hostel food pre-orders with payment integration, order tracking, and vendor dashboard. Must include modern UI, push notifications, and smooth checkout flow.',
    category: 'APP_DEVELOPMENT',
    skillsRequired: ['Flutter', 'Firebase', 'Dart', 'REST API'],
    budget: { min: 30000, max: 60000, type: 'fixed' },
    deadlineDays: 25,
    proposalCount: 5,
  },
  {
    title: 'Redesign MUJ Startup Incubation Landing Page',
    description:
      'Looking for a UI/UX designer to redesign our startup incubation landing page with premium visual hierarchy and mobile-first approach. Deliver high-fidelity screens and design system tokens.',
    category: 'UI_UX_DESIGN',
    skillsRequired: ['Figma', 'UI/UX', 'Wireframing', 'Design System'],
    budget: { min: 12000, max: 22000, type: 'fixed' },
    deadlineDays: 10,
    proposalCount: 4,
  },
  {
    title: 'Create Promotional Posters for MUJ Tech Fest',
    description:
      'Need a graphic designer to create poster and social media creatives for our annual tech fest. Assets should follow branding guidelines and include 10 static + 5 story creatives.',
    category: 'GRAPHIC_DESIGN',
    skillsRequired: ['Photoshop', 'Illustrator', 'Branding', 'Social Media Design'],
    budget: { min: 8000, max: 15000, type: 'fixed' },
    deadlineDays: 7,
    proposalCount: 2,
  },
  {
    title: 'Short-form Video Edits for Placement Cell Campaign',
    description:
      'Need an editor for short-form reels and announcement videos for placement cell updates. Should deliver engaging edits with subtitles, transitions, and optimized export formats.',
    category: 'VIDEO_EDITING',
    skillsRequired: ['Premiere Pro', 'After Effects', 'Motion Graphics', 'Reels Editing'],
    budget: { min: 10000, max: 18000, type: 'fixed' },
    deadlineDays: 9,
    proposalCount: 1,
  },
  {
    title: 'SEO Content Batch for MUJ Community Blog',
    description:
      'Require a content writer for 20 SEO-friendly blog posts covering student life, internships, and tech trends. Content must be original, structured, and optimized for readability.',
    category: 'CONTENT_WRITING',
    skillsRequired: ['SEO Writing', 'Research', 'Blogging', 'Copywriting'],
    budget: { min: 7000, max: 14000, type: 'fixed' },
    deadlineDays: 14,
    proposalCount: 6,
  },
  {
    title: 'Digital Marketing Plan for Student Marketplace Launch',
    description:
      'Need a digital marketing expert to define ad strategy, campaign funnel, and growth plan for a new student marketplace launch. Include analytics setup and KPI tracking recommendations.',
    category: 'DIGITAL_MARKETING',
    skillsRequired: ['Meta Ads', 'Google Ads', 'Analytics', 'Growth Strategy'],
    budget: { min: 15000, max: 30000, type: 'fixed' },
    deadlineDays: 16,
    proposalCount: 3,
  },
  {
    title: 'Student Survey Dashboard with Insights and Filters',
    description:
      'Develop an analytics dashboard for student survey data with trend charts, branch filters, semester segmentation, and export support. Should be optimized for quick load on large datasets.',
    category: 'DATA_ANALYTICS',
    skillsRequired: ['Python', 'Pandas', 'Data Visualization', 'Dashboard'],
    budget: { min: 20000, max: 38000, type: 'fixed' },
    deadlineDays: 20,
    proposalCount: 2,
  },
  {
    title: 'Photography Shoot for Graduation Ceremony',
    description:
      'Looking for a photographer for graduation ceremony coverage including candid and stage moments. Deliver edited high-resolution photos with a 48-hour turnaround.',
    category: 'PHOTOGRAPHY',
    skillsRequired: ['Event Photography', 'Photo Editing', 'Lightroom', 'Color Correction'],
    budget: { min: 9000, max: 16000, type: 'fixed' },
    deadlineDays: 5,
    proposalCount: 2,
  },
  {
    title: 'AI Chatbot Prototype for Admission Queries',
    description:
      'Build a prototype chatbot to answer common admission questions using FAQ context. Should support multilingual prompts and include basic admin panel for response tuning.',
    category: 'AI_ML',
    skillsRequired: ['Python', 'LLM APIs', 'NLP', 'FastAPI'],
    budget: { min: 28000, max: 52000, type: 'fixed' },
    deadlineDays: 22,
    proposalCount: 4,
  },
];

const toFutureDate = (daysAhead) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
};

const seedMockProjects = async () => {
  await connectDBWithRetry();

  try {
    const titles = projectBlueprints.map((project) => project.title);

    await Project.deleteMany({ title: { $in: titles } });

    const clients = await User.find({
      email: { $regex: /^mock\.user\d+@muj\.manipal\.edu$/i },
      roles: 'client',
      accountStatus: { $in: ['active', 'pending_verification'] },
    })
      .select('_id fullName email')
      .limit(50)
      .lean();

    if (!clients.length) {
      throw new Error(
        'No eligible mock clients found. Run "npm --prefix server run seed:mock-users" first.',
      );
    }

    const docs = projectBlueprints.map((project, index) => {
      const client = clients[index % clients.length];

      return {
        client: client._id,
        title: project.title,
        description: project.description,
        category: project.category,
        tags: project.skillsRequired,
        skillsRequired: project.skillsRequired,
        budget: {
          min: project.budget.min,
          max: project.budget.max,
          type: project.budget.type,
          currency: 'INR',
        },
        deadline: toFutureDate(project.deadlineDays),
        attachments: [],
        status: 'open',
        proposalCount: project.proposalCount,
      };
    });

    const inserted = await Project.insertMany(docs, { ordered: true });

    console.log(`Seeded ${inserted.length} mock projects successfully.`);
    console.log(`Using ${clients.length} existing mock client profile(s).`);
    console.log('Inserted project titles:');
    inserted.forEach((project, index) => {
      const owner = clients[index % clients.length];
      console.log(`- ${project.title} (client: ${owner.email})`);
    });
  } finally {
    await disconnectDB();
  }
};

seedMockProjects().catch((error) => {
  console.error('Failed to seed mock projects:', error);
  process.exit(1);
});
