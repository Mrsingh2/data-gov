export type Role = 'GUEST' | 'REGISTERED' | 'OWNER' | 'ADMIN';
export type Visibility = 'PUBLIC' | 'PRIVATE';
export type AccessClassification = 'OPEN' | 'REGISTERED' | 'RESTRICTED';
export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ProtectionStrategy = 'MASK' | 'ANONYMIZE' | 'SYNTHETIC';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Dataset {
  id: string;
  title: string;
  description: string;
  tags: string[];
  visibility: Visibility;
  accessClassification: AccessClassification;
  viewCount: number;
  downloadCount: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; name: string; email: string };
  dataVersions?: DataVersion[];
  columnRules?: ColumnProtectionRule[];
  _count?: { dataVersions: number; accessRequests: number };
  userAccess?: {
    hasGrant: boolean;
    requestStatus: AccessRequestStatus | null;
    isOwner: boolean;
  };
}

export interface DataVersion {
  id: string;
  datasetId: string;
  versionNumber: number;
  fileName: string;
  fileSizeBytes: number;
  rowCount: number;
  columnNames: string[];
  isLatest: boolean;
  changeNote?: string;
  createdAt: string;
}

export interface MetadataVersion {
  id: string;
  datasetId: string;
  versionNumber: number;
  title: string;
  description: string;
  tags: string[];
  visibility: Visibility;
  accessClassification: AccessClassification;
  changeNote?: string;
  createdAt: string;
}

export interface ColumnProtectionRule {
  id: string;
  datasetId: string;
  columnName: string;
  strategy: ProtectionStrategy;
  isActive: boolean;
}

export interface RowProtectionRule {
  id: string;
  datasetId: string;
  field: string;
  operator: string;
  value: string;
  isActive: boolean;
}

export interface ColumnStat {
  name: string;
  isProtected: boolean;
  nullCount: number;
  uniqueCount: number | null;
  type: string;
  min: number | null;
  max: number | null;
  mean: number | null;
  stdDev: number | null;
  topValues: { value: string; count: number }[];
  message?: string;
}

export interface PreviewData {
  datasetId: string;
  versionId: string;
  rowCount: number;
  columns: ColumnStat[];
  hasFullAccess: boolean;
}

export interface AccessRequest {
  id: string;
  userId: string;
  datasetId: string;
  message?: string;
  status: AccessRequestStatus;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
  user?: { id: string; name: string; email: string };
  dataset?: { id: string; title: string };
}

export interface Download {
  id: string;
  userId: string;
  datasetId: string;
  dataVersionId?: string;
  downloadedAt: string;
  dataset?: { id: string; title: string; visibility: Visibility };
  dataVersion?: { versionNumber: number; fileName: string };
}

export interface Kpi {
  totalPublicDatasets: number;
  totalViews: number;
  totalDownloads: number;
  totalUsers: number;
  recentDatasets: Partial<Dataset>[];
}

export interface PaginatedResponse<T> {
  datasets?: T[];
  total: number;
  page: number;
  limit: number;
}
