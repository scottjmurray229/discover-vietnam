import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const destinations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/destinations' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    heroVideo: z.string().default(''),
    heroImage: z.string().default(''),
    heroAlt: z.string().optional(),
    tagline: z.string().default(''),
    region: z.enum(['north', 'central', 'south']),
    bestMonths: z.array(z.string()).default([]),
    budgetPerDay: z.object({
      backpacker: z.number().default(0),
      midRange: z.number().default(0),
      luxury: z.number().default(0),
    }).default({}),
    gettingThere: z.string().default(''),
    essentials: z.array(z.object({
      icon: z.string(),
      label: z.string(),
      value: z.string(),
    })).default([]),
    highlights: z.array(z.union([
      z.string(),
      z.object({
        title: z.string(),
        image: z.string().default(''),
        videoSrc: z.string().default(''),
        icon: z.string().default(''),
      }),
    ])).default([]),
    gradientColors: z.string().default('from-purple-900 via-indigo-800 to-violet-900'),
    relatedDestinations: z.array(z.union([
      z.string(),
      z.object({
        slug: z.string(),
        videoSrc: z.string().default(''),
        hook: z.string().default(''),
      }),
    ])).default([]),
    faqItems: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).default([]),
    affiliatePicks: z.array(z.record(z.string(), z.any())).optional(),
  aeoFacts: z.object({
    currency: z.string(),
    plugType: z.string(),
    language: z.string(),
    bestTime: z.string(),
    visaInfo: z.string().optional(),
    timeZone: z.string().optional(),
    emergencyNumber: z.string().optional(),
  }).optional(),
    lastVerified: z.coerce.date().optional(),
    contentStatus: z.enum(['draft', 'review', 'published', 'needs-update']).default('draft'),
    draft: z.boolean().default(true),
    fmContentType: z.string().optional(),
  }).passthrough(),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    pubDate: z.coerce.date(),
    dateModified: z.coerce.date().optional(),
    heroImage: z.string().default(''),
    heroVideo: z.string().default(''),
    author: z.string().default('Scott'),
    tags: z.array(z.string()).default([]),
    category: z.enum([
  'destination', 'outdoor-adventure', 'skiing', 'practical', 'budget',
  'history', 'food', 'festival', 'culture', 'seasonal', 'planning',
  'travel-tips', 'itinerary', 'adventure', 'nature', 'wildlife',
  'architecture', 'nightlife', 'shopping', 'wellness', 'luxury',
  'family', 'solo', 'couples', 'photography', 'diving', 'surfing',
  'hiking', 'camping', 'road-trip', 'city-guide', 'island', 'beach',
  'mountain', 'desert', 'cultural', 'spiritual', 'war-history'
]).optional(),
    relatedDestinations: z.array(z.string()).default([]),
    readingTime: z.number().optional(),
    draft: z.boolean().default(true),
    fmContentType: z.string().optional(),
  }).passthrough(),
});

export const collections = {
  destinations,
  blog,
};
