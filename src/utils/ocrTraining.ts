
import Tesseract from 'tesseract.js';
import { ImageAnalysisResult } from './imageAnalysis';

export interface OCRTrainingConfig {
  documentType: string;
  psm: number;
  oem: number;
  whitelist: string;
  blacklist: string;
  variables: Record<string, string>;
}

export const getOptimalOCRConfig = (analysis: ImageAnalysisResult): OCRTrainingConfig => {
  const baseConfig: OCRTrainingConfig = {
    documentType: analysis.documentType,
    psm: 6, // SINGLE_UNIFORM_BLOCK
    oem: 1, // LSTM_ONLY
    whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?:;()-/°% ',
    blacklist: '',
    variables: {
      preserve_interword_spaces: '1',
      tessedit_enable_dict_correction: '1'
    }
  };

  // Customize based on document type
  switch (analysis.documentType) {
    case 'handwritten':
      return {
        ...baseConfig,
        psm: 4, // SINGLE_COLUMN
        variables: {
          ...baseConfig.variables,
          tessedit_enable_bigram_correction: '1',
          tessedit_fix_fuzzy_spaces: '1',
          textord_heavy_nr: '1',
          classify_enable_learning: '1',
          classify_enable_adaptive_matcher: '1',
          textord_debug_tabfind: '0',
          textord_min_linesize: '2.5',
          tessedit_char_unblacklist: '|'
        }
      };

    case 'printed':
      return {
        ...baseConfig,
        psm: 6, // SINGLE_UNIFORM_BLOCK
        variables: {
          ...baseConfig.variables,
          tessedit_enable_dict_correction: '1',
          load_system_dawg: '1',
          load_freq_dawg: '1'
        }
      };

    case 'prescription':
      return {
        ...baseConfig,
        psm: 4, // SINGLE_COLUMN
        whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,()-/: mg mcg ml units tab cap bid tid qid prn',
        variables: {
          ...baseConfig.variables,
          user_words_suffix: 'medical',
          tessedit_enable_bigram_correction: '1',
          classify_enable_learning: '1'
        }
      };

    case 'form':
      return {
        ...baseConfig,
        psm: 11, // SPARSE_TEXT
        variables: {
          ...baseConfig.variables,
          textord_tabfind_find_tables: '1',
          textord_tablefind_good_width: '3',
          textord_tablefind_good_height: '3'
        }
      };

    default:
      return baseConfig;
  }
};

export const enhanceImageForOCR = async (imageData: string, analysis: ImageAnalysisResult): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = document.createElement('img');
  
  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imagePixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const enhanced = applyEnhancements(imagePixelData, analysis);
      ctx.putImageData(enhanced, 0, 0);
      
      resolve(canvas.toDataURL('image/png', 0.95));
    };
    
    img.src = imageData;
  });
};

const applyEnhancements = (imageData: ImageData, analysis: ImageAnalysisResult): ImageData => {
  const data = imageData.data;
  const enhanced = new ImageData(new Uint8ClampedArray(data), imageData.width, imageData.height);
  const enhancedData = enhanced.data;
  
  // Apply enhancements based on document type and quality
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];
    
    // Convert to grayscale
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Apply specific enhancements based on document type
    if (analysis.documentType === 'handwritten') {
      // Enhance contrast for handwritten text
      const contrast = analysis.quality === 'poor' ? 2.5 : 2.0;
      const brightness = analysis.quality === 'poor' ? 20 : 10;
      gray = Math.max(0, Math.min(255, (gray - 128) * contrast + 128 + brightness));
      
      // Apply adaptive thresholding for handwritten text
      const threshold = analysis.quality === 'poor' ? 140 : 130;
      gray = gray > threshold ? 255 : 0;
    } else if (analysis.documentType === 'prescription') {
      // Special enhancement for medical prescriptions
      const contrast = 2.8;
      const brightness = 15;
      gray = Math.max(0, Math.min(255, (gray - 128) * contrast + 128 + brightness));
      
      const threshold = 135;
      gray = gray > threshold ? 255 : 0;
    } else {
      // Standard enhancement for printed text
      const contrast = analysis.quality === 'poor' ? 2.2 : 1.8;
      const brightness = analysis.quality === 'poor' ? 15 : 5;
      gray = Math.max(0, Math.min(255, (gray - 128) * contrast + 128 + brightness));
      
      const threshold = 128;
      gray = gray > threshold ? 255 : 0;
    }
    
    enhancedData[i] = gray;     // R
    enhancedData[i + 1] = gray; // G
    enhancedData[i + 2] = gray; // B
    enhancedData[i + 3] = alpha; // A
  }
  
  return enhanced;
};
