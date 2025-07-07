
import Tesseract from 'tesseract.js';
import { ImageAnalysisResult } from '@/utils/imageAnalysis';
import { trainedExtractor, TrainedExtractionResult } from './trainedExtractor';
import { chatGPTEnhancer } from './chatgptEnhancer';

export interface OCRResult {
  text: string;
  confidence: number;
  method: 'tesseract' | 'enhanced' | 'ai-assisted' | 'medical-optimized' | 'trained-ai-enhanced';
  processingTime: number;
  metadata: {
    tesseractResult?: string;
    aiEnhancedResult?: string;
    medicalTermsFound?: string[];
    combinedScore?: number;
    wordCount?: number;
    characterCount?: number;
    medicalAccuracy?: number;
    recognizedElements?: TrainedExtractionResult['recognizedElements'];
    structuredData?: any;
  };
}

export interface AdvancedOCRConfig {
  useTesseract: boolean;
  enhanceImage: boolean;
  combinationStrategy: 'best' | 'weighted' | 'consensus';
  confidenceThreshold: number;
  medicalMode?: boolean;
  useTrainedExtractor?: boolean;
}

export class AdvancedOCREngine {
  private tesseractWorker?: Tesseract.Worker;
  private isInitialized = false;
  private medicalTerms = [
    'diagnosis', 'symptoms', 'treatment', 'medication', 'dosage', 'prescription',
    'patient', 'doctor', 'clinic', 'hospital', 'blood pressure', 'temperature',
    'heart rate', 'mg', 'ml', 'tablets', 'capsules', 'injection', 'surgery',
    'examination', 'history', 'allergies', 'chronic', 'acute', 'pain', 'fever',
    'paracetamol', 'ibuprofen', 'aspirin', 'amoxicillin', 'metformin', 'hypertension',
    'diabetes', 'malaria', 'typhoid', 'pneumonia', 'tuberculosis', 'HIV', 'AIDS'
  ];

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    console.log('🚀 Initializing Enhanced Medical OCR Engine...');
    
    try {
      // Use local Tesseract worker to avoid CDN issues
      this.tesseractWorker = await Tesseract.createWorker('eng', 1, {
        logger: () => {},
        workerPath: '/node_modules/tesseract.js/dist/worker.min.js',
        langPath: '/node_modules/tesseract.js/dist/lang-data',
        corePath: '/node_modules/tesseract.js/dist/tesseract-core-simd.wasm.js'
      });
      
      // Optimized parameters for medical handwritten documents
      await this.tesseractWorker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:()[]/-+= °%',
        preserve_interword_spaces: '1',
        tessedit_enable_dict_correction: '1',
        tessedit_enable_bigram_correction: '1',
        classify_enable_learning: '1',
        classify_enable_adaptive_matcher: '1',
        textord_heavy_nr: '1',
        textord_min_linesize: '0.5',
        tessedit_fix_fuzzy_spaces: '1',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK
      });
      
      this.isInitialized = true;
      console.log('✅ Enhanced Medical OCR Engine initialized');
    } catch (error) {
      console.warn('⚠️ Tesseract initialization failed, using fallback:', error);
      this.isInitialized = true;
    }
  }

  async processImage(
    imageUrl: string,
    analysis: ImageAnalysisResult,
    config: AdvancedOCRConfig = {
      useTesseract: true,
      enhanceImage: true,
      combinationStrategy: 'best',
      confidenceThreshold: 70,
      medicalMode: true,
      useTrainedExtractor: true
    },
    onProgress?: (progress: number, stage: string) => void
  ): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      console.log('🏥 Starting Enhanced Medical OCR Processing...');
      
      if (!imageUrl) {
        throw new Error('Image URL is required for OCR processing');
      }
      
      onProgress?.(5, 'Initializing OCR Engine');
      await this.initialize();
      
      onProgress?.(10, 'Preprocessing Image');
      const enhancedImage = await this.advancedImagePreprocessing(imageUrl);
      
      onProgress?.(25, 'Multi-Pass OCR Extraction');
      const rawText = await this.performMultiPassOCR(enhancedImage, onProgress);
      
      onProgress?.(60, 'Medical Text Enhancement');
      const enhancedText = await this.enhanceMedicalText(rawText);
      
      onProgress?.(75, 'Structuring Medical Data');
      const structuredData = await this.structureMedicalData(enhancedText);
      
      onProgress?.(90, 'Final Processing');
      const finalText = this.assembleFinalMedicalText(enhancedText, structuredData);
      const confidence = this.calculateMedicalConfidence(finalText, structuredData);
      
      onProgress?.(100, 'OCR Complete');
      
      const processingTime = Date.now() - startTime;
      
      console.log('🎉 Enhanced Medical OCR completed successfully');
      console.log('📊 Medical extraction confidence:', confidence + '%');
      
      return {
        text: finalText,
        confidence,
        method: 'medical-optimized',
        processingTime: Math.round(processingTime / 1000),
        metadata: {
          tesseractResult: rawText,
          aiEnhancedResult: enhancedText,
          medicalTermsFound: this.findMedicalTerms(finalText),
          combinedScore: confidence,
          wordCount: finalText.split(' ').length,
          characterCount: finalText.length,
          medicalAccuracy: this.calculateMedicalAccuracy(finalText),
          structuredData
        }
      };
      
    } catch (error) {
      console.error('❌ Enhanced Medical OCR processing failed:', error);
      
      return {
        text: '[Enhanced Medical OCR processing failed. Please try again or check image quality.]',
        confidence: 0,
        method: 'medical-optimized',
        processingTime: Math.round((Date.now() - startTime) / 1000),
        metadata: {
          characterCount: 0,
          wordCount: 0,
          medicalTermsFound: [],
          medicalAccuracy: 0
        }
      };
    }
  }

  private async advancedImagePreprocessing(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = document.createElement('img');
      
      img.onload = () => {
        // Optimal size for medical documents
        const maxDimension = 2000;
        let { width, height } = img;
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Enhanced preprocessing for medical handwriting
        ctx.filter = 'contrast(4) brightness(1.3) saturate(0)';
        ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Advanced noise reduction and contrast enhancement
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          // Enhanced contrast and brightness
          gray = (gray - 128) * 4 + 128 + 30;
          gray = Math.max(0, Math.min(255, gray));
          
          // Sharp threshold for better text recognition
          gray = gray > 150 ? 255 : 0;
          
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png', 1.0));
      };
      
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
    });
  }

  private async performMultiPassOCR(imageUrl: string, onProgress?: (progress: number, stage: string) => void): Promise<string> {
    if (!this.tesseractWorker) {
      await this.initialize();
    }

    if (!this.tesseractWorker) {
      throw new Error('Tesseract worker not initialized');
    }

    const results: string[] = [];
    
    // Multiple PSM modes for better accuracy - using correct Tesseract PSM enum values
    const psmModes = [
      Tesseract.PSM.SINGLE_BLOCK,
      Tesseract.PSM.SINGLE_LINE,
      Tesseract.PSM.SINGLE_WORD,
      Tesseract.PSM.SPARSE_TEXT,
      Tesseract.PSM.RAW_LINE
    ];
    
    for (let i = 0; i < psmModes.length; i++) {
      try {
        const psm = psmModes[i];
        onProgress?.(25 + (i * 7), `OCR Pass ${i + 1}/5`);
        
        await this.tesseractWorker.setParameters({
          tessedit_pageseg_mode: psm
        });
        
        const { data: { text, confidence } } = await this.tesseractWorker.recognize(imageUrl);
        
        if (text && text.trim().length > 0 && confidence > 30) {
          results.push(text.trim());
        }
      } catch (error) {
        console.warn(`OCR pass ${i + 1} failed:`, error);
      }
    }
    
    // Combine results using consensus
    return this.combineOCRResults(results);
  }

  private combineOCRResults(results: string[]): string {
    if (results.length === 0) return '';
    if (results.length === 1) return results[0];
    
    // Find the longest result as base
    const baseResult = results.reduce((a, b) => a.length > b.length ? a : b);
    
    // Enhance with words from other results
    const words = baseResult.split(/\s+/);
    const allWords = results.flatMap(r => r.split(/\s+/));
    
    // Use frequency to pick best words
    const wordCounts = new Map<string, number>();
    allWords.forEach(word => {
      if (word.length > 2) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    });
    
    return words.map(word => {
      if (word.length <= 2) return word;
      
      // Find most frequent similar word
      const similar = Array.from(wordCounts.keys()).find(w => 
        this.calculateSimilarity(w.toLowerCase(), word.toLowerCase()) > 0.8
      );
      
      return similar && wordCounts.get(similar)! > 1 ? similar : word;
    }).join(' ');
  }

  private async enhanceMedicalText(text: string): Promise<string> {
    // Medical-specific text corrections
    let enhanced = text;
    
    // Common medical corrections
    const medicalCorrections = new Map([
      ['paracetmol', 'paracetamol'],
      ['ibuprofin', 'ibuprofen'],
      ['presciption', 'prescription'],
      ['medicin', 'medicine'],
      ['diagnos', 'diagnosis'],
      ['symptom', 'symptoms'],
      ['treatmen', 'treatment'],
      ['patien', 'patient'],
      ['hospita', 'hospital'],
      ['clini', 'clinic'],
      ['docto', 'doctor'],
      ['nurs', 'nurse'],
      ['mg', 'mg'],
      ['ml', 'ml'],
      ['bp', 'blood pressure'],
      ['hr', 'heart rate'],
      ['temp', 'temperature']
    ]);
    
    medicalCorrections.forEach((correct, wrong) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      enhanced = enhanced.replace(regex, correct);
    });
    
    // Use ChatGPT if available for advanced enhancement
    if (chatGPTEnhancer.isConfigured()) {
      try {
        console.log('🤖 Using ChatGPT for medical text enhancement...');
        const chatGPTResult = await chatGPTEnhancer.enhanceEntityExtraction(enhanced);
        if (chatGPTResult) {
          // Integrate ChatGPT suggestions
          enhanced = this.integrateChatGPTEnhancements(enhanced, chatGPTResult);
        }
      } catch (error) {
        console.warn('⚠️ ChatGPT enhancement failed:', error);
      }
    }
    
    return enhanced;
  }

  private integrateChatGPTEnhancements(originalText: string, chatGPTResult: any): string {
    let enhanced = originalText;
    
    // Replace identified entities with ChatGPT suggestions
    if (chatGPTResult.names && chatGPTResult.names[0] !== 'None') {
      chatGPTResult.names.forEach((name: string) => {
        if (name.length > 2) {
          const words = originalText.split(' ');
          const similarWord = words.find(word => 
            this.calculateSimilarity(word.toLowerCase(), name.toLowerCase()) > 0.6
          );
          if (similarWord) {
            enhanced = enhanced.replace(new RegExp(`\\b${similarWord}\\b`, 'g'), name);
          }
        }
      });
    }
    
    // Similar integration for medications, symptoms, etc.
    if (chatGPTResult.medications && chatGPTResult.medications[0] !== 'None') {
      chatGPTResult.medications.forEach((med: string) => {
        if (med.length > 3) {
          const medRegex = new RegExp(`\\b\\w*${med.substring(0, 3)}\\w*\\b`, 'gi');
          enhanced = enhanced.replace(medRegex, med);
        }
      });
    }
    
    return enhanced;
  }

  private async structureMedicalData(text: string): Promise<any> {
    const structured = {
      patientInfo: this.extractPatientInfo(text),
      medications: this.extractMedications(text),
      symptoms: this.extractSymptoms(text),
      vitals: this.extractVitals(text),
      diagnosis: this.extractDiagnosis(text),
      dates: this.extractDates(text),
      addresses: this.extractAddresses(text),
      phoneNumbers: this.extractPhoneNumbers(text)
    };
    
    return structured;
  }

  private extractPatientInfo(text: string): any {
    const namePattern = /(?:patient|name|pt\.?)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
    const agePattern = /(?:age|years?|yrs?)[\s:]*(\d{1,3})/gi;
    
    const nameMatch = namePattern.exec(text);
    const ageMatch = agePattern.exec(text);
    
    return {
      name: nameMatch ? nameMatch[1] : null,
      age: ageMatch ? parseInt(ageMatch[1]) : null
    };
  }

  private extractMedications(text: string): string[] {
    const medPatterns = [
      /\b(paracetamol|ibuprofen|aspirin|amoxicillin|metformin|lisinopril|amlodipine)\b/gi,
      /\b([A-Z][a-z]+(?:in|ol|ide|ine|ate|ium|pril|mycin|cillin))\s+\d+\s*mg/gi
    ];
    
    const medications: string[] = [];
    medPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        medications.push(match[1] || match[0]);
      }
    });
    
    return [...new Set(medications)];
  }

  private extractSymptoms(text: string): string[] {
    const symptomKeywords = [
      'fever', 'headache', 'nausea', 'vomiting', 'diarrhea', 'constipation',
      'cough', 'cold', 'flu', 'fatigue', 'weakness', 'dizziness', 'pain',
      'chest pain', 'abdominal pain', 'back pain', 'joint pain'
    ];
    
    const symptoms: string[] = [];
    const textLower = text.toLowerCase();
    
    symptomKeywords.forEach(symptom => {
      if (textLower.includes(symptom)) {
        symptoms.push(symptom);
      }
    });
    
    return symptoms;
  }

  private extractVitals(text: string): any {
    const vitalPatterns = {
      bloodPressure: /(?:bp|blood pressure)[\s:]*(\d+\/\d+)/gi,
      temperature: /(?:temperature|temp)[\s:]*(\d+(?:\.\d+)?)/gi,
      pulse: /(?:pulse|heart rate|hr)[\s:]*(\d+)/gi,
      weight: /(?:weight|wt)[\s:]*(\d+(?:\.\d+)?)/gi
    };
    
    const vitals: any = {};
    
    Object.entries(vitalPatterns).forEach(([key, pattern]) => {
      const match = pattern.exec(text);
      if (match) {
        vitals[key] = match[1];
      }
    });
    
    return vitals;
  }

  private extractDiagnosis(text: string): string[] {
    const diagnosisPatterns = [
      /(?:diagnosis|dx)[\s:]+([^\n\r]+)/gi,
      /(?:impression|assessment)[\s:]+([^\n\r]+)/gi
    ];
    
    const diagnoses: string[] = [];
    diagnosisPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        diagnoses.push(match[1].trim());
      }
    });
    
    return diagnoses;
  }

  private extractDates(text: string): string[] {
    const datePatterns = [
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/gi,
      /\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4})\b/gi
    ];
    
    const dates: string[] = [];
    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        dates.push(match[1]);
      }
    });
    
    return [...new Set(dates)];
  }

  private extractAddresses(text: string): string[] {
    const addressPatterns = [
      /\b(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:street|road|avenue|st|rd|ave))/gi,
      /(?:address|addr)[\s:]+([^\n\r]+)/gi
    ];
    
    const addresses: string[] = [];
    addressPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        addresses.push(match[1].trim());
      }
    });
    
    return [...new Set(addresses)];
  }

  private extractPhoneNumbers(text: string): string[] {
    const phonePatterns = [
      /\b(\+?234\s?\d{3}\s?\d{3}\s?\d{4})\b/gi,
      /\b(0\d{3}\s?\d{3}\s?\d{4})\b/gi,
      /\b(\d{4}\s?\d{3}\s?\d{4})\b/gi
    ];
    
    const phones: string[] = [];
    phonePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        phones.push(match[1]);
      }
    });
    
    return [...new Set(phones)];
  }

  private assembleFinalMedicalText(enhancedText: string, structuredData: any): string {
    let finalText = `MEDICAL RECORD EXTRACTION\n\n`;
    finalText += `EXTRACTED TEXT:\n${enhancedText}\n\n`;
    
    if (structuredData.patientInfo.name || structuredData.patientInfo.age) {
      finalText += `PATIENT INFORMATION:\n`;
      if (structuredData.patientInfo.name) finalText += `Name: ${structuredData.patientInfo.name}\n`;
      if (structuredData.patientInfo.age) finalText += `Age: ${structuredData.patientInfo.age} years\n`;
      finalText += `\n`;
    }
    
    if (structuredData.medications.length > 0) {
      finalText += `MEDICATIONS:\n${structuredData.medications.join(', ')}\n\n`;
    }
    
    if (structuredData.symptoms.length > 0) {
      finalText += `SYMPTOMS:\n${structuredData.symptoms.join(', ')}\n\n`;
    }
    
    if (Object.keys(structuredData.vitals).length > 0) {
      finalText += `VITAL SIGNS:\n`;
      Object.entries(structuredData.vitals).forEach(([key, value]) => {
        finalText += `${key}: ${value}\n`;
      });
      finalText += `\n`;
    }
    
    if (structuredData.diagnosis.length > 0) {
      finalText += `DIAGNOSIS:\n${structuredData.diagnosis.join('; ')}\n\n`;
    }
    
    return finalText;
  }

  private calculateMedicalConfidence(text: string, structuredData: any): number {
    let confidence = 60; // Base confidence
    
    // Boost for structured data found
    if (structuredData.patientInfo.name) confidence += 10;
    if (structuredData.medications.length > 0) confidence += 15;
    if (structuredData.symptoms.length > 0) confidence += 10;
    if (Object.keys(structuredData.vitals).length > 0) confidence += 10;
    
    // Boost for medical terms
    const medicalTermsFound = this.findMedicalTerms(text);
    confidence += Math.min(medicalTermsFound.length * 2, 20);
    
    // Text quality boost
    if (text.length > 100) confidence += 5;
    if (text.length > 300) confidence += 5;
    
    return Math.min(95, confidence);
  }

  private findMedicalTerms(text: string): string[] {
    const foundTerms: string[] = [];
    const textLower = text.toLowerCase();
    
    this.medicalTerms.forEach(term => {
      if (textLower.indexOf(term) !== -1) {
        foundTerms.push(term);
      }
    });
    
    return foundTerms;
  }

  private calculateMedicalAccuracy(text: string): number {
    let accuracy = 65;
    
    const medicalTermsFound = this.findMedicalTerms(text);
    accuracy += medicalTermsFound.length * 2;
    
    if (text.includes('mg') || text.includes('ml')) accuracy += 5;
    if (text.length > 50) accuracy += 5;
    
    return Math.min(90, accuracy);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];
    
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const distance = matrix[len2][len1];
    return 1 - distance / Math.max(len1, len2);
  }

  async cleanup(): Promise<void> {
    try {
      if (this.tesseractWorker) {
        await this.tesseractWorker.terminate();
        this.tesseractWorker = undefined;
      }
      await trainedExtractor.cleanup();
      this.isInitialized = false;
      console.log('🧹 Enhanced Medical OCR engine cleaned up');
    } catch (error) {
      console.error('❌ Error during enhanced OCR cleanup:', error);
    }
  }
}

// Singleton instance for global use
export const advancedOCR = new AdvancedOCREngine();

// Export the function that HandwrittenDigitizer uses
export async function processWithAdvancedOCR(file: File, config: AdvancedOCRConfig): Promise<OCRResult> {
  const imageUrl = URL.createObjectURL(file);
  
  const analysis: ImageAnalysisResult = {
    quality: 'good',
    documentType: 'handwritten',
    orientation: 0,
    hasStructure: true,
    language: 'en',
    confidence: 80,
    recommendations: ['Enhanced medical extraction']
  };

  try {
    const enhancedConfig = { 
      ...config, 
      medicalMode: true, 
      enhanceImage: true,
      useTrainedExtractor: true
    };
    const result = await advancedOCR.processImage(imageUrl, analysis, enhancedConfig, (progress, stage) => {
      console.log(`OCR Progress: ${progress}% - ${stage}`);
    });
    URL.revokeObjectURL(imageUrl);
    return result;
  } catch (error) {
    URL.revokeObjectURL(imageUrl);
    throw error;
  }
}
