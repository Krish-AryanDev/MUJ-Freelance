/**
 * Project and proposal related contracts for Upwork-like workflows.
 */

import type { Id, ISODateString } from './api.types';
import type { GigCategory } from './gig.types';
import type { User } from './user.types';

export type ProjectStatus = 'open' | 'in-progress' | 'in_progress' | 'completed' | 'cancelled' | 'closed';
export type ProposalStatus = 'pending' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';

export type BudgetType = 'fixed' | 'hourly';

export interface ProjectBudget {
  type: BudgetType;
  min: number;
  max: number;
  currency: 'INR';
}

export interface ProjectAttachment {
  name: string;
  url: string;
  publicId?: string;
}

export interface Project {
  id: Id;
  title: string;
  description: string;
  category: GigCategory;
  skillsRequired: string[];
  budget: ProjectBudget;
  deadline: ISODateString;
  status: ProjectStatus;
  proposalCount: number;
  client: Pick<User, 'id' | 'fullName' | 'avatar'>;
  attachments: ProjectAttachment[];
  selectedFreelancer?: Pick<User, 'id' | 'fullName' | 'avatar'> | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Proposal {
  id: Id;
  project: Id;
  projectTitle?: string;
  freelancer: Pick<User, 'id' | 'fullName' | 'avatar'>;
  coverLetter: string;
  bidAmount: number;
  deliveryDays: number;
  status: ProposalStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  category: GigCategory;
  skillsRequired: string[];
  budget: ProjectBudget;
  deadline: ISODateString;
  attachments?: ProjectAttachment[];
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: ProjectStatus;
}

export interface CreateProposalRequest {
  coverLetter: string;
  bidAmount: number;
  deliveryDays: number;
}
