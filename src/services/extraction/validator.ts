
import { ExtractedMedicalData } from './types';

export const validateMedicalData = (data: ExtractedMedicalData): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (!data.rawText || data.rawText.trim().length === 0) {
    issues.push('No text was extracted from the document');
  }
  
  if (data.rawText && data.rawText.length < 10) {
    issues.push('Extracted text seems too short - may indicate poor OCR quality');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};
