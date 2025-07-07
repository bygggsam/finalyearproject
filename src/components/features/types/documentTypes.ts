
import { StructuredText } from '@/services/aiTextStructuring';

export interface HandwrittenDocument {
  id: string;
  patientName: string;
  documentType: 'case_history' | 'consultation_notes' | 'prescription' | 'other';
  fileName: string;
  uploadDate: Date;
  status: 'uploaded' | 'need_scanning' | 'scanned' | 'analyzing' | 'processing' | 'digitized' | 'completed';
  inputFormat: 'handwritten_scan' | 'handwritten_photo' | 'existing_scan';
  originalFile?: File;
  imageUrl?: string;
  ocrResult?: {
    text: string;
    confidence: number;
    method: string;
    processingTime: number;
    metadata?: {
      medicalTermsFound?: string[];
      medicalAccuracy?: number;
      wordCount?: number;
      characterCount?: number;
    };
  };
  aiStructuredResult?: StructuredText;
  formattedText?: string;
  extractedContent?: string;
  processingProgress?: number;
  processingStage?: string;
  imageAnalysis?: any;
  scanningStage?: 'need_scanning' | 'already_scanned';
}
