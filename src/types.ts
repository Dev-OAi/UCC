export interface CallEntry {
  id: string;
  time: string;
  client: string;
  contact: string;
  callType: string;
  outcome: string;
  nextAction: string;
  followUpDate: string;
}

export interface EmailEntry {
  id: string;
  timeSent: string;
  client: string;
  subject: string;
  emailType: string;
  responseReceived: boolean;
  nextStep: string;
}

export interface MeetingEntry {
  id: string;
  time: string;
  client: string;
  attendees: string;
  meetingType: string;
  summary: string;
  outcome: string;
  nextAction: string;
  followUpDate: string;
}

export interface Metric {
  metric: string;
  number: number | string;
  comments: string;
}

export interface Product {
  id: string;
  name: string;
  summary: string;
  details: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  products: Product[];
}

export interface ProductGuide {
  id: string;
  longTitle: string;
  categories: ProductCategory[];
}

// Scorecard & Lead Management
export enum LeadStatus {
  NEW = 'New',
  RESEARCHING = 'Researching',
  CONTACTED = 'Contacted',
  APPOINTMENT_SET = 'Appointment Set',
  CONVERTED = 'Converted',
  NOT_INTERESTED = 'Not Interested'
}

export enum LeadType {
  PROSPECT = 'Prospect',
  COI = 'COI (Referral Partner)'
}

export interface LeadActivity {
  id: string;
  type: 'Call' | 'Email' | 'Appointment' | 'Note';
  date: string; // ISO string
  notes: string;
}

export interface IndustryProfile {
  lastUpdated: string;
  localOutlook: string; // City/County specific economic perspective
  quarterlyFocus: string; // Current industry conditions/news
  trends: string[];
  risks: string[]; // Industry Risk Analysis
  cashFlowChallenges: string[];
  valuationStats: string; // Business Valuation Statistics (Rule of Thumb)
  benchmarks: { label: string; value: string }[]; // Income statement/Balance sheet benchmarks
  prepQuestions: string[]; // Meeting Prep-Sheet
}

export interface ScorecardMetric {
  id: string;
  name: string;
  target: number;
  type: 'built-in' | 'product';
  isVisible: boolean;
}

export interface BusinessLead {
  id: string;
  businessName: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website?: string;
  email?: string;
  source?: string; // e.g., "Google Maps", "Manual", "Sunbiz"
  status: LeadStatus;
  type: LeadType;
  keyPrincipal?: string;
  industry?: string;
  notes: string;
  activities: LeadActivity[];
  lastUpdated: string;
  introScript?: string;
  bundleScript?: string;
  emailScript?: string;
  productsSold?: string[];

  // Professional Banking Fields
  ein?: string;
  entityType?: string;
  establishedDate?: string;
  revenue?: string;

  // Research Status
  enrichmentStatus?: 'pending' | 'searching' | 'completed' | 'failed';

  // Deep Industry Intelligence
  industryProfile?: IndustryProfile;

  // Associated Entities
  relatedBusinesses?: string[];

  score?: number;
}
