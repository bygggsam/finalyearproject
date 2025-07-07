
export interface ExtractedMedicalData {
  rawText: string;
  confidence?: number;
  processingTime?: number;
  extractionMethod: 'raw_text' | 'structured';
}
