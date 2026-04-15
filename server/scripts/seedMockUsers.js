import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDBWithRetry, disconnectDB } from '../config/db.js';
import FreelancerProfile from '../models/FreelancerProfile.model.js';
import User from '../models/User.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEFAULT_PASSWORD = 'MockUser@123';
const SALT_ROUNDS = 12;

const firstNames = [
  'Aarav',
  'Isha',
  'Vihaan',
  'Anaya',
  'Reyansh',
  'Myra',
  'Kabir',
  'Siya',
  'Advait',
  'Tara',
];

const lastNames = [
  'Sharma',
  'Mehta',
  'Verma',
  'Kapoor',
  'Singh',
  'Iyer',
  'Reddy',
  'Nair',
  'Bansal',
  'Khanna',
];

const branches = [
  'Computer Science and Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Mechanical Engineering',
  'Mathematics and Computing',
  'MBA',
  'MCA',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology',
];

const roleCombos = [
  ['freelancer'],
  ['client', 'freelancer'],
  ['admin', 'freelancer'],
  ['client', 'admin', 'freelancer'],
  ['freelancer'],
  ['client', 'freelancer'],
  ['freelancer'],
  ['client', 'freelancer'],
  ['admin', 'freelancer'],
  ['client', 'freelancer'],
];

const skillSets = [
  ['React', 'Next.js', 'Tailwind CSS', 'TypeScript'],
  ['Node.js', 'Express', 'MongoDB', 'REST APIs'],
  ['UI/UX Design', 'Figma', 'Prototyping', 'Design Systems'],
  ['Python', 'Data Analysis', 'Pandas', 'Automation'],
  ['Java', 'Spring Boot', 'SQL', 'Microservices'],
  ['Flutter', 'Dart', 'Firebase', 'Mobile UI'],
  ['WordPress', 'SEO', 'Content Strategy', 'Analytics'],
  ['Machine Learning', 'TensorFlow', 'NLP', 'Model Tuning'],
  ['DevOps', 'Docker', 'CI/CD', 'AWS'],
  ['Video Editing', 'Motion Graphics', 'After Effects', 'Premiere Pro'],
];

const taglines = [
  'Frontend Engineer crafting fast web experiences',
  'Backend Developer building reliable APIs',
  'Product Designer focused on clean UX',
  'Data Specialist turning data into insights',
  'Full Stack Engineer for scalable products',
  'Mobile App Developer for cross-platform apps',
  'Digital Growth Expert for online presence',
  'AI Enthusiast delivering practical ML solutions',
  'Cloud and DevOps Engineer for smooth deployments',
  'Creative Editor for high-impact visual stories',
];

const experienceLevels = ['beginner', 'intermediate', 'expert'];
const responseTimes = ['within_an_hour', 'within_a_few_hours', 'within_a_day'];
const premiumBadges = ['none', 'silver', 'gold', 'platinum'];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 1) =>
  Number((Math.random() * (max - min) + min).toFixed(decimals));

const buildMockUsers = async () => {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  return Array.from({ length: 10 }).map((_, index) => {
    const firstName = firstNames[index];
    const lastName = lastNames[index];
    const fullName = `${firstName} ${lastName}`;
    const email = `mock.user${index + 1}@muj.manipal.edu`;
    const enrollmentNo = `MUJ2026${String(index + 1).padStart(3, '0')}`;
    const semester = randomInt(2, 8);

    const avatarUrl = `https://i.pravatar.cc/400?img=${index + 11}`;
    const coverImage = `https://picsum.photos/seed/muj-cover-${index + 1}/1200/400`;

    const averageRating = randomFloat(3.2, 5.0, 1);
    const totalReviews = randomInt(5, 140);
    const totalProjects = randomInt(8, 180);
    const completedProjects = randomInt(4, totalProjects);
    const totalEarnings = randomInt(12000, 260000);

    const skills = skillSets[index];

    const userDoc = {
      fullName,
      email,
      password: hashedPassword,
      enrollmentNo,
      branch: branches[index],
      semester,
      roles: roleCombos[index],
      isEmailVerified: true,
      accountStatus: 'active',
      avatar: {
        url: avatarUrl,
        publicId: `mock-avatar-${index + 1}`,
      },
      totalEarnings,
      completedOrders: completedProjects,
      lastLoginAt: new Date(),
    };

    const profileDoc = {
      tagline: taglines[index],
      avatar: avatarUrl,
      coverImage,
      location: 'Jaipur, Rajasthan',
      profileUrl: `mock-${firstName.toLowerCase()}-${lastName.toLowerCase()}-${index + 1}`,
      isAvailable: Math.random() > 0.2,
      responseTime: responseTimes[index % responseTimes.length],
      skills,
      skillsDetailed: skills.map((name, i) => ({
        name,
        level: i % 2 === 0 ? 'advanced' : 'expert',
      })),
      education: [
        {
          institution: 'Manipal University Jaipur',
          degree: 'B.Tech',
          fieldOfStudy: branches[index],
          startYear: 2022,
          endYear: 2026,
          currentlyStudying: true,
          grade: `CGPA ${randomFloat(7.0, 9.6, 1)}`,
          description: 'Strong academic record with active project contributions.',
        },
      ],
      experience: [
        {
          title: 'Freelance Specialist',
          company: 'Independent',
          location: 'Remote',
          startDate: new Date('2023-01-10'),
          currentlyWorking: true,
          description: 'Delivered projects for students, startups, and local businesses.',
          skills,
        },
      ],
      portfolio: [
        {
          title: `${firstName}'s Featured Project`,
          description: 'A production-grade project showcasing problem solving and clean execution.',
          imageUrl: `https://picsum.photos/seed/muj-portfolio-${index + 1}/900/600`,
          projectUrl: `https://example.com/mock-project-${index + 1}`,
          githubUrl: `https://github.com/example/mock-project-${index + 1}`,
          tags: skills.slice(0, 3),
          completedAt: new Date('2025-10-15'),
        },
      ],
      certifications: [
        {
          name: `${skills[0]} Professional Certificate`,
          issuingOrganization: 'Coursera',
          issueDate: new Date('2024-06-01'),
          credentialId: `MOCK-CERT-${index + 1}`,
          credentialUrl: `https://example.com/certificate-${index + 1}`,
        },
      ],
      languages: [
        { name: 'English', proficiency: 'fluent' },
        { name: 'Hindi', proficiency: 'native' },
      ],
      hourlyRate: randomInt(450, 1800),
      experienceLevel: experienceLevels[index % experienceLevels.length],
      about:
        'Detail-oriented freelancer with strong communication, clear timelines, and consistent delivery quality.',
      socialLinks: {
        linkedin: `https://www.linkedin.com/in/mock-user-${index + 1}`,
        github: `https://github.com/mock-user-${index + 1}`,
        website: `https://mock-user-${index + 1}.example.com`,
      },
      mujDetails: {
        enrollmentNo,
        branch: branches[index],
        semester,
        batch: '2022-2026',
        hostel: `Hostel ${String.fromCharCode(65 + (index % 6))}`,
      },
      settings: {
        showEmail: false,
        showPhone: false,
        showEarnings: false,
        profileVisibility: 'public',
        allowMessages: true,
        showOnlineStatus: true,
      },
      averageRating,
      totalReviews,
      totalProjects,
      completedProjects,
      totalEarnings,
      profileViews: randomInt(80, 2200),
      isPremium: index % 4 !== 0,
      premiumBadge: premiumBadges[index % premiumBadges.length],
      premiumExpiresAt: new Date(Date.now() + randomInt(15, 180) * 24 * 60 * 60 * 1000),
    };

    return { userDoc, profileDoc };
  });
};

const seedMockUsers = async () => {
  await connectDBWithRetry();

  try {
    const mockUsers = await buildMockUsers();
    const emails = mockUsers.map(({ userDoc }) => userDoc.email);

    const existingUsers = await User.find({ email: { $in: emails } }).select('_id email').lean();
    const existingUserIds = existingUsers.map((entry) => entry._id);

    if (existingUserIds.length > 0) {
      await FreelancerProfile.deleteMany({ user: { $in: existingUserIds } });
      await User.deleteMany({ _id: { $in: existingUserIds } });
    }

    const createdUsers = await User.insertMany(mockUsers.map((entry) => entry.userDoc), { ordered: true });

    const profileDocs = createdUsers.map((user, index) => ({
      ...mockUsers[index].profileDoc,
      user: user._id,
    }));

    await FreelancerProfile.insertMany(profileDocs, { ordered: true });

    console.log(`Seeded ${createdUsers.length} mock users successfully.`);
    console.log(`Default login password for all seeded users: ${DEFAULT_PASSWORD}`);
    console.log('Seeded emails:');
    createdUsers.forEach((user) => {
      console.log(`- ${user.email} (${user.roles.join(', ')})`);
    });
  } finally {
    await disconnectDB();
  }
};

seedMockUsers().catch((error) => {
  console.error('Failed to seed mock users:', error);
  process.exit(1);
});
