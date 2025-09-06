export interface UploadedFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  uploadIndex: number;
}

export interface SourceLink {
  filename: string;
  url: string;
}

export interface CustomMetadata {
  sensitivity: 'internal' | 'external';
  source_type: string;
  [key: string]: any;
}

export interface AdditionalField {
  id: string;
  key: string;
  value: string;
}

export interface UpsertFormState {
  files: UploadedFile[];
  sourceLinks: { [filename: string]: string };
  customMetadata: CustomMetadata;
  additionalFields: AdditionalField[];
}

export interface UpsertRecordsRequest {
  files: FormData;
  source_links: { [filename: string]: string };
  custom_metadata: CustomMetadata;
}

export interface UpsertRecordsResponse {
  success: boolean;
  message: string;
  records_created?: number;
  errors?: string[];
}