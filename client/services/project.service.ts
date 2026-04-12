import type { AxiosResponse } from 'axios';

import { apiClient } from '../lib/axios';
import type { ApiResponse } from '../types/api.types';
import type {
  CreateProjectRequest,
  CreateProposalRequest,
  Project,
  ProjectAttachment,
  ProjectStatus,
  Proposal,
  UpdateProjectRequest,
} from '../types/project.types';
import { getErrorMessage } from '../utils/helpers';

interface BackendUserSummary {
  id?: string;
  _id?: string;
  fullName?: string;
  avatar?: {
    url?: string;
  };
}

interface BackendProject {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  category: Project['category'];
  skillsRequired?: string[];
  tags?: string[];
  budget: {
    min: number;
    max: number;
    type?: 'fixed' | 'hourly';
    currency?: 'INR';
  };
  deadline: string;
  attachments?: Array<{ name?: string; fileName?: string; url: string; publicId?: string }>;
  proposalCount?: number;
  status: ProjectStatus;
  client?: BackendUserSummary;
  selectedFreelancer?: BackendUserSummary | null;
  createdAt: string;
  updatedAt: string;
}

interface BackendProposal {
  id?: string;
  _id?: string;
  project?: string | { _id?: string; id?: string; title?: string };
  freelancer?: BackendUserSummary;
  coverLetter: string;
  bidAmount: number;
  deliveryDays?: number;
  estimatedDays?: number;
  status: Proposal['status'];
  createdAt: string;
  updatedAt: string;
}

interface ProjectsPayload {
  projects: BackendProject[];
}

interface ProjectPayload {
  project: BackendProject;
}

interface ProposalsPayload {
  proposals: BackendProposal[];
}

interface ProposalPayload {
  proposal: BackendProposal;
}

interface ProjectsFilters {
  page?: number;
  limit?: number;
  category?: Project['category'];
  budgetMin?: number;
  budgetMax?: number;
  skills?: string;
  status?: ProjectStatus;
  search?: string;
  sort?: 'newest' | 'budget-high' | 'budget-low';
}

const normalizeUserSummary = (user?: BackendUserSummary | null): Pick<Project['client'], 'id' | 'fullName' | 'avatar'> => ({
  id: user?.id ?? user?._id ?? '',
  fullName: user?.fullName ?? 'Unknown User',
  avatar: {
    url: user?.avatar?.url ?? '',
  },
});

const normalizeProject = (project: BackendProject): Project => {
  const normalizedId = project.id ?? project._id;

  if (!normalizedId) {
    throw new Error('Project id missing in response');
  }

  const normalizedAttachments: ProjectAttachment[] = Array.isArray(project.attachments)
    ? project.attachments.map((item) => ({
        name: item.name ?? item.fileName ?? 'Attachment',
        url: item.url,
        publicId: item.publicId,
      }))
    : [];

  return {
    id: normalizedId,
    title: project.title,
    description: project.description,
    category: project.category,
    skillsRequired: project.skillsRequired ?? project.tags ?? [],
    budget: {
      min: Number(project.budget?.min ?? 0),
      max: Number(project.budget?.max ?? 0),
      type: project.budget?.type === 'hourly' ? 'hourly' : 'fixed',
      currency: 'INR',
    },
    deadline: project.deadline,
    status: project.status,
    proposalCount: Number(project.proposalCount ?? 0),
    client: normalizeUserSummary(project.client),
    selectedFreelancer: project.selectedFreelancer ? normalizeUserSummary(project.selectedFreelancer) : null,
    attachments: normalizedAttachments,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
};

const normalizeProposal = (proposal: BackendProposal): Proposal => {
  const normalizedId = proposal.id ?? proposal._id;

  if (!normalizedId) {
    throw new Error('Proposal id missing in response');
  }

  const projectField = proposal.project;
  const projectId =
    typeof projectField === 'string' ? projectField : projectField?.id ?? projectField?._id ?? '';
  const projectTitle = typeof projectField === 'string' ? undefined : projectField?.title;

  return {
    id: normalizedId,
    project: projectId,
    projectTitle,
    freelancer: normalizeUserSummary(proposal.freelancer),
    coverLetter: proposal.coverLetter,
    bidAmount: Number(proposal.bidAmount),
    deliveryDays: Number(proposal.deliveryDays ?? proposal.estimatedDays ?? 1),
    status: proposal.status,
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
  };
};

const unwrapResponse = <TData>(response: AxiosResponse<ApiResponse<TData>>): TData => {
  const payload = response.data;

  if (!payload.success) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data;
};

const getAllProjects = async (filters: ProjectsFilters = {}): Promise<ApiResponse<{ projects: Project[] }>> => {
  try {
    const response = await apiClient.get<ApiResponse<ProjectsPayload>>('/projects', {
      params: filters,
    });

    if (!response.data.success) {
      return response.data as ApiResponse<{ projects: Project[] }>;
    }

    return {
      ...response.data,
      data: {
        projects: response.data.data.projects.map(normalizeProject),
      },
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch projects'));
  }
};

const getProjectById = async (id: string): Promise<Project> => {
  try {
    const response = await apiClient.get<ApiResponse<ProjectPayload>>(`/projects/${id}`);
    const data = unwrapResponse(response);
    return normalizeProject(data.project);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch project details'));
  }
};

const createProject = async (payload: CreateProjectRequest): Promise<Project> => {
  try {
    const response = await apiClient.post<ApiResponse<ProjectPayload>>('/projects', payload);
    const data = unwrapResponse(response);
    return normalizeProject(data.project);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to create project'));
  }
};

const updateProject = async (id: string, payload: UpdateProjectRequest): Promise<Project> => {
  try {
    const response = await apiClient.put<ApiResponse<ProjectPayload>>(`/projects/${id}`, payload);
    const data = unwrapResponse(response);
    return normalizeProject(data.project);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update project'));
  }
};

const deleteProject = async (id: string): Promise<void> => {
  try {
    await apiClient.delete<ApiResponse<null>>(`/projects/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to delete project'));
  }
};

const getClientProjects = async (): Promise<Project[]> => {
  try {
    const response = await apiClient.get<ApiResponse<ProjectsPayload>>('/projects/my');
    const data = unwrapResponse(response);
    return data.projects.map(normalizeProject);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch your projects'));
  }
};

const submitProposal = async (projectId: string, payload: CreateProposalRequest): Promise<Proposal> => {
  try {
    const response = await apiClient.post<ApiResponse<ProposalPayload>>(`/projects/${projectId}/proposals`, payload);
    const data = unwrapResponse(response);
    return normalizeProposal(data.proposal);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to submit proposal'));
  }
};

const getProjectProposals = async (projectId: string): Promise<Proposal[]> => {
  try {
    const response = await apiClient.get<ApiResponse<ProposalsPayload>>(`/projects/${projectId}/proposals`);
    const data = unwrapResponse(response);
    return data.proposals.map(normalizeProposal);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch proposals'));
  }
};

const acceptProposal = async (projectId: string, proposalId: string): Promise<Project> => {
  try {
    const response = await apiClient.put<ApiResponse<ProjectPayload>>(
      `/projects/${projectId}/proposals/${proposalId}/accept`,
    );
    const data = unwrapResponse(response);
    return normalizeProject(data.project);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to accept proposal'));
  }
};

const closeProject = async (id: string): Promise<Project> => {
  try {
    const response = await apiClient.put<ApiResponse<ProjectPayload>>(`/projects/${id}/close`);
    const data = unwrapResponse(response);
    return normalizeProject(data.project);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to close project'));
  }
};

const getFreelancerProposals = async (): Promise<Proposal[]> => {
  try {
    const response = await apiClient.get<ApiResponse<ProposalsPayload>>('/projects/proposals/my');
    const data = unwrapResponse(response);
    return data.proposals.map(normalizeProposal);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch your proposals'));
  }
};

export const projectService = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getClientProjects,
  submitProposal,
  getProjectProposals,
  acceptProposal,
  closeProject,
  getFreelancerProposals,
};

export type { ProjectsFilters };