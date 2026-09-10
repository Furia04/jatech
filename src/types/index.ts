export type CoreMode = "hardware" | "software";

export interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  core: CoreMode | "hybrid";
  badge: string;
  iconName: string;
  specs: string[];
  metrics: { label: string; value: string };
  gridClass: string;
}

export interface Operator {
  id: string;
  callsign: string;
  fullName: string;
  role: string;
  clearanceLevel: string;
  division: "Hardware Lab & Field Ops" | "Software Architecture & AI";
  avatarUrl: string;
  experience: string;
  skills: { name: string; level: number; tag: string }[];
  bio: string;
  status: "ACTIVE_LAB" | "DEPLOYED_FIELD" | "AVAILABLE";
}

export interface MetricItem {
  id: string;
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  sublabel: string;
  decimals?: number;
}

export interface ProcessStage {
  step: string;
  phase: string;
  title: string;
  description: string;
  leadTime: string;
  protocol: string;
  iconName: string;
}
