
// Image analysis utilities for better OCR recognition
export interface ImageAnalysisResult {
  documentType: 'handwritten' | 'printed' | 'mixed' | 'form' | 'prescription';
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  orientation: number;
  hasStructure: boolean;
  language: string;
  confidence: number;
  recommendations: string[];
}

export const analyzeImageForOCR = async (imageData: string): Promise<ImageAnalysisResult> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = document.createElement('img');
  
  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imagePixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const analysis = performImageAnalysis(imagePixelData, canvas.width, canvas.height);
      resolve(analysis);
    };
    
    img.src = imageData;
  });
};

const performImageAnalysis = (imageData: ImageData, width: number, height: number): ImageAnalysisResult => {
  const data = imageData.data;
  let totalPixels = width * height;
  let darkPixels = 0;
  let edgePixels = 0;
  let uniformRegions = 0;
  let textRegions = 0;
  
  // Analyze pixel patterns to determine document characteristics
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const grayscale = 0.299 * r + 0.587 * g + 0.114 * b;
    
    if (grayscale < 128) darkPixels++;
    
    // Detect edges and text-like patterns
    if (i > width * 4 && i < data.length - width * 4) {
      const x = (i / 4) % width;
      const y = Math.floor(i / 4 / width);
      
      if (x > 1 && x < width - 1) {
        const currentGray = grayscale;
        const leftGray = 0.299 * data[i - 4] + 0.587 * data[i - 3] + 0.114 * data[i - 2];
        const rightGray = 0.299 * data[i + 4] + 0.587 * data[i + 5] + 0.114 * data[i + 6];
        
        if (Math.abs(currentGray - leftGray) > 50 || Math.abs(currentGray - rightGray) > 50) {
          edgePixels++;
        }
      }
    }
  }
  
  const darkRatio = darkPixels / totalPixels;
  const edgeRatio = edgePixels / totalPixels;
  
  // Determine document type based on analysis
  let documentType: ImageAnalysisResult['documentType'] = 'mixed';
  let quality: ImageAnalysisResult['quality'] = 'good';
  const recommendations: string[] = [];
  
  // Handwritten detection (irregular patterns, varied line thickness)
  if (edgeRatio > 0.15 && darkRatio > 0.1 && darkRatio < 0.4) {
    documentType = 'handwritten';
    if (edgeRatio > 0.25) {
      recommendations.push('Handwritten text detected - using specialized handwriting OCR settings');
    }
  }
  
  // Printed text detection (uniform patterns, consistent spacing)
  if (edgeRatio > 0.08 && edgeRatio < 0.15 && darkRatio > 0.05 && darkRatio < 0.25) {
    documentType = 'printed';
    recommendations.push('Printed text detected - using standard OCR settings');
  }
  
  // Prescription detection (small text, medical formatting)
  if (darkRatio > 0.08 && darkRatio < 0.3 && edgeRatio > 0.12) {
    documentType = 'prescription';
    recommendations.push('Medical prescription detected - using medical OCR enhancement');
  }
  
  // Form detection (structured layout, lines, boxes)
  if (edgeRatio > 0.2 && darkRatio < 0.15) {
    documentType = 'form';
    recommendations.push('Form structure detected - using form-aware OCR');
  }
  
  // Quality assessment
  if (edgeRatio < 0.05) {
    quality = 'poor';
    recommendations.push('Low text contrast - consider image enhancement');
  } else if (edgeRatio > 0.3) {
    quality = 'excellent';
    recommendations.push('High quality image - optimal for OCR');
  }
  
  if (darkRatio < 0.02) {
    quality = 'poor';
    recommendations.push('Very light text - increase contrast');
  }
  
  return {
    documentType,
    quality,
    orientation: 0, // Could be enhanced with rotation detection
    hasStructure: documentType === 'form' || documentType === 'prescription',
    language: 'en', // Could be enhanced with language detection
    confidence: Math.min(95, Math.max(60, edgeRatio * 400 + darkRatio * 200)),
    recommendations
  };
};
