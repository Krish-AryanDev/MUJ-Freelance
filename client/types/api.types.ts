/**
 * Generic API contracts used across service layer and React Query hooks.
 */

export type Id = string;
export type ISODateString = string;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SuccessResponse<TData> {
  success: true;
  statusCode: number;
  message: string;
  data: TData;
  meta?: PaginationMeta;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: ValidationIssue[];
  errorCode?: string;
}

export type ApiResponse<TData> = SuccessResponse<TData> | ErrorResponse;

export interface PaginatedPayload<TItem> {
  items: TItem[];
  pagination: PaginationMeta;
}

export interface ApiListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RequestConfig {
  method: HttpMethod;
  url: string;
  withCredentials?: boolean;
  headers?: Record<string, string>;
}

export interface MutationState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message?: string;
}

export interface SocketEvent<TPayload> {
  event: string;
  payload: TPayload;
}
