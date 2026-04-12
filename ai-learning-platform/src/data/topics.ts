import { Topic, TopicCategory } from "@/types";

function makeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function createTopics(
  names: string[],
  category: TopicCategory
): Topic[] {
  return names.map((name, index) => ({
    id: makeId(name),
    name,
    category,
    number: index + 1,
  }));
}

const belowAverageTopics: Topic[] = createTopics(
  [
    "Pollution",
    "Global Warming",
    "Deforestation",
    "Forest Fire",
    "Road Accidents",
    "Highway Safety in India",
    "Public Transport",
    "Unemployment",
    "Dowry System",
    "Crime Against Women",
    "Family Planning",
    "Should Smoking be Banned",
    "Tourism",
    "Yoga",
    "Nuclear / Joint Family",
    "Online Shopping",
    "Time Management",
    "Time is the Best Healer",
    "Child is the Father of Man",
    "My Biggest Achievement",
    "My Favourite Teacher",
    "Sports as a Career in India",
    "Cricket / Hockey — National Sport",
    "T20 / One Day Cricket",
    "Indian Actors in Hollywood",
    "Real Estate",
    "Phone",
  ],
  "below-average"
);

const averageTopics: Topic[] = createTopics(
  [
    "Single Parenting",
    "Make in India",
    "Social Networking",
    "e-Governance",
    "Role of Opposition in Democracy",
    "Social Status of Women",
    "DRDO",
    "Inter-Caste Marriage",
    "Road Safety",
    "Lok Sabha / Rajya Sabha",
    "Moral Policing",
    "Religion Fundamentalism",
    "Mercy Killing",
    "Food Security Bill",
    "Namami Gange Project",
    "Ayurveda / Allopathy",
    "Reservation Policy",
    "Medical Tourism",
    "Education Reform",
    "Honour Killing",
    "RTI Act",
    "UIN (Unique Identification Number)",
    "Cross Border Terrorism",
    "ISIS",
    "Jan Lok Pal Bill",
    "FDI",
    "Brain Drain",
    "Organ Donation",
    "Youth in Politics",
    "Article 370",
    "Indian Democracy",
    "NDRF",
    "Distance Education",
    "Unrest in West Asia",
    "MGNREGA",
    "e-Commerce",
    "Media Censorship",
    "Compulsory Military Service",
    "Retirement Age of Politicians",
    "Food Adulteration",
    "Swachh Bharat Abhiyan",
    "Indo-China Relations",
    "INR vs Dollar",
    "E-Waste",
    "Global Energy Crisis",
    "Global Arms Race",
    "Vote Bank Politics",
    "Live-in Relationships",
    "Piracy",
    "Indian Coast Line",
    "Lifestyle Diseases",
    "IT Revolution",
    "Sarva Shiksha Abhiyan",
    "Value Education",
    "Importance of Diet and Nutrition",
    "Corruption in Politics",
    "Rich vs Poor",
    "Golden Quadrilateral",
    "Multitasking",
    "National Security Council",
    "Kashmir Conflict",
    "Ministry of Defence",
    "Dress Code",
    "Two Party Democracy",
    "Oil Spill",
    "Gurukul System in India",
    "Mobile Banking",
    "Nuclear Weapons",
    "Advertisement",
    "Censorship in Indian Cinema",
    "MSP (Minimum Support Price)",
    "Black Money",
    "Outsourcing",
    "Library System",
    "Govt. e-Market Place",
    "Shopping Mall",
    "Skill Development",
    "Health Insurance",
    "Smartphone",
    "Supreme Court",
    "National Parks",
    "Start-ups",
    "Social Distancing",
    "National Disaster Management Plan",
    "Net Banking",
    "Olympics",
    "Changing Weather Pattern",
    "Agri Technologies",
    "Land Mafia",
    "India-Bangladesh Relation",
    "Women's Safety",
    "Indian Postal Services",
    "Journalism",
    "Pollution in Indian Cities",
    "Digital Revolution",
    "Siachen Glacier",
    "Conditions of Farmers in India",
    "AIDS",
    "Education System in India",
    "India 2050",
    "Bharat Ratna",
    "Sex Education",
    "Human Rights",
    "Small Scale Industries",
  ],
  "average"
);

const aboveAverageTopics: Topic[] = createTopics(
  [
    "Special Economic Zone",
    "India and WTO",
    "Tax Reform",
    "Cloning",
    "Land Acquisition",
    "Global Economic Crisis",
    "Centre and State Relations",
    "Strategic Indian Ocean",
    "Stem Cell Research",
    "India's Space Programme",
    "India's Act East Policy",
    "Nanotechnology",
    "Global Planning and India",
    "Demilitarisation of Siachen",
    "Indian Nuclear Programme",
    "Indian Missile Programme",
    "Unipolar World",
    "UCAB (Unlawful Activities Prevention Act)",
    "Fibre Optics",
    "India-CIS Relations",
    "Genetically Modified Food",
    "India's Claim for Permanent UNSC Seat",
    "Artificial Intelligence",
    "Cauvery Basin Dispute",
    "Minimum Wage Policy",
    "Role of NGOs",
    "Corporate Social Responsibility",
    "Greenhouse Effect",
    "Judiciary and Constitutional Reform",
    "Genetic Mutation",
    "Ethical Hacking",
    "India's Foreign Policy",
    "India's Role in UN",
    "Space Warfare",
    "BRICS",
    "AFSPA",
    "Value Based Politics",
    "Cyber Security",
    "Data Security",
    "Robotics",
    "Search Engines and Internet",
    "Taiwan-China Dispute",
    "Social Corporate Behaviour",
    "NATO",
    "Net Banking Security",
    "Chemical Warfare",
    "Chronic Capitalism",
    "Missile Technology Control Regime (MTCR)",
    "NITI Aayog",
    "Weapons of Mass Destruction",
    "India-China Relations",
    "Fiscal Deficit",
    "South China Sea",
    "European Union",
    "Virtual Reality",
    "Computer Hacking",
    "India-Israel Relations",
    "Cryptocurrency",
    "UN Peacekeeping Missions",
    "CAG (Comptroller and Auditor General)",
    "WTO",
    "FDI in Defence",
    "SAARC",
    "Indian Defence Budget",
    "4G and 5G Mobile Communication",
    "India-Bhutan Relations",
    "UNSC",
    "iOS vs Android",
    "India-Pakistan Relations",
    "Climate Change and National Security",
  ],
  "above-average"
);

export const ALL_TOPICS: Topic[] = [
  ...belowAverageTopics,
  ...averageTopics,
  ...aboveAverageTopics,
];

export const TOPICS_BY_CATEGORY = {
  "below-average": belowAverageTopics,
  average: averageTopics,
  "above-average": aboveAverageTopics,
};

export function getTopicById(id: string): Topic | undefined {
  return ALL_TOPICS.find((t) => t.id === id);
}

export function getTopicsByCategory(category: TopicCategory): Topic[] {
  return TOPICS_BY_CATEGORY[category];
}

export function getAdjacentTopics(topicId: string): {
  prev: Topic | null;
  next: Topic | null;
} {
  const index = ALL_TOPICS.findIndex((t) => t.id === topicId);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? ALL_TOPICS[index - 1] : null,
    next: index < ALL_TOPICS.length - 1 ? ALL_TOPICS[index + 1] : null,
  };
}

export const CATEGORY_LABELS: Record<TopicCategory, string> = {
  "below-average": "Below Average",
  average: "Average",
  "above-average": "Above Average",
};

export const CATEGORY_ORDER: TopicCategory[] = [
  "below-average",
  "average",
  "above-average",
];
