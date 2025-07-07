
import { ExtractedMedicalData } from './types';

export const formatExtractedData = (data: ExtractedMedicalData): string => {
  let formatted = '=== RAW TEXT EXTRACTION ===\n\n';
  
  formatted += '📄 EXTRACTED TEXT:\n';
  formatted += data.rawText;
  formatted += '\n\n';
  
  formatted += '=== EXTRACTION INFO ===\n';
  formatted += `• Method: ${data.extractionMethod}\n`;
  if (data.confidence) {
    formatted += `• Confidence: ${data.confidence}%\n`;
  }
  if (data.processingTime) {
    formatted += `• Processing Time: ${data.processingTime}ms\n`;
  }
  
  formatted += '\n=== END OF EXTRACTION ===';
  
  return formatted;
};
