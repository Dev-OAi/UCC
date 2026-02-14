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
