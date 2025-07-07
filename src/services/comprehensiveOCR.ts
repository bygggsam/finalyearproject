
import Tesseract from 'tesseract.js';
import { performanceOptimizer } from './performanceOptimizer';

export interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  processingTime: number;
  structuredData?: MedicalStructuredData;
  error?: string;
}

export interface MedicalStructuredData {
  patientName?: string;
  date?: string;
  chiefComplaint?: string;
  history?: string;
  physicalExam?: string;
  assessment?: string;
  plan?: string;
  medications?: string[];
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    respiratoryRate?: string;
  };
}

export class ComprehensiveOCRService {
  private static instance: ComprehensiveOCRService;
  private worker: Tesseract.Worker | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  static getInstance(): ComprehensiveOCRService {
    if (!ComprehensiveOCRService.instance) {
      ComprehensiveOCRService.instance = new ComprehensiveOCRService();
    }
    return ComprehensiveOCRService.instance;
  }

  async initializeWorker(): Promise<void> {
    if (this.worker) return;
    
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = this._doInitialize();
    
    try {
      await this.initPromise;
    } finally {
      this.isInitializing = false;
    }
  }

  private async _doInitialize(): Promise<void> {
    try {
      console.log('Initializing optimized Tesseract OCR worker...');
      
      this.worker = await Tesseract.createWorker('eng', 1, {
        logger: () => {}, // Disable verbose logging for performance
        workerPath: '/node_modules/tesseract.js/dist/worker.min.js',
        langPath: '/node_modules/tesseract.js/dist/lang-data',
        corePath: '/node_modules/tesseract.js/dist/tesseract-core-simd.wasm.js'
      });
      
      // Optimized parameters for speed and medical text
      await this.worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?()-_/ ',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1',
        tessedit_enable_dict_correction: '0', // Disable for speed
        classify_enable_learning: '0', // Disable for speed
        classify_enable_adaptive_matcher: '1'
      });
      
      console.log('Optimized OCR worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      throw new Error('Failed to initialize OCR engine');
    }
  }

  async processDocument(imageData: string): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = `ocr_${this.hashString(imageData)}`;
      const cached = performanceOptimizer.get<OCRResult>(cacheKey);
      if (cached) {
        console.log('OCR result retrieved from cache');
        return cached;
      }

      // Initialize worker if needed
      await this.initializeWorker();
      
      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }

      console.log('Starting optimized OCR processing...');

      // Perform OCR recognition with optimized settings
      const { data } = await this.worker.recognize(imageData, {
        rectangle: undefined // Process full image for better results
      });

      const processingTime = Date.now() - startTime;
      console.log(`OCR completed in ${processingTime}ms with confidence: ${data.confidence}`);

      // Structure medical data efficiently
      const structuredData = this.structureMedicalData(data.text);

      const result: OCRResult = {
        success: true,
        text: data.text,
        confidence: Math.max(0, Math.min(100, data.confidence)) / 100, // Normalize to 0-1
        processingTime,
        structuredData
      };

      // Cache the result
      performanceOptimizer.set(cacheKey, result, 60 * 60 * 1000); // Cache for 1 hour

      return result;

    } catch (error) {
      console.error('OCR processing error:', error);
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        text: '',
        confidence: 0,
        processingTime,
        error: error instanceof Error ? error.message : 'OCR processing failed'
      };
    }
  }

  private structureMedicalData(text: string): MedicalStructuredData {
    const structuredData: MedicalStructuredData = {};
    
    try {
      // Clean and normalize text for better performance
      const cleanText = text.replace(/\s+/g, ' ').trim().toLowerCase();
      
      // Use more efficient regex patterns
      const patterns = {
        patientName: [
          /(?:patient\s*name|name)\s*:?\s*([a-zA-Z\s]+)/i,
          /^([A-Z][a-z]+\s+[A-Z][a-z]+)/
        ],
        date: [
          /(?:date|visit\s*date)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
          /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/
        ],
        chiefComplaint: [
          /(?:chief\s*complaint|cc)\s*:?\s*([^.\n]+)/i,
          /(?:presenting\s*complaint)\s*:?\s*([^.\n]+)/i
        ],
        medications: [
          /(?:rx|medication|med|prescription)\s*:?\s*([^.\n]+)/gi,
          /(\w+\s+\d+\s*mg)/gi
        ]
      };

      // Extract patient name
      for (const pattern of patterns.patientName) {
        const match = text.match(pattern);
        if (match && match[1]) {
          structuredData.patientName = match[1].trim();
          break;
        }
      }

      // Extract date
      for (const pattern of patterns.date) {
        const match = text.match(pattern);
        if (match && match[1]) {
          structuredData.date = match[1].trim();
          break;
        }
      }

      // Extract chief complaint
      for (const pattern of patterns.chiefComplaint) {
        const match = text.match(pattern);
        if (match && match[1]) {
          structuredData.chiefComplaint = match[1].trim();
          break;
        }
      }

      // Extract medications efficiently
      const medications = new Set<string>();
      for (const pattern of patterns.medications) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          if (match[1]) {
            medications.add(match[1].trim());
          }
        }
      }
      
      if (medications.size > 0) {
        structuredData.medications = Array.from(medications);
      }

      // Extract vital signs with single pass
      const vitals: any = {};
      const vitalPatterns = [
        { key: 'bloodPressure', pattern: /(?:bp|blood\s*pressure)\s*:?\s*(\d{2,3}\/\d{2,3})/i },
        { key: 'heartRate', pattern: /(?:hr|heart\s*rate|pulse)\s*:?\s*(\d{2,3})/i },
        { key: 'temperature', pattern: /(?:temp|temperature)\s*:?\s*(\d{2,3}(?:\.\d)?)/i }
      ];

      for (const { key, pattern } of vitalPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          vitals[key] = match[1];
        }
      }
      
      if (Object.keys(vitals).length > 0) {
        structuredData.vitals = vitals;
      }

      return structuredData;
      
    } catch (error) {
      console.error('Error structuring medical data:', error);
      return structuredData;
    }
  }

  // Simple hash function for caching
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.terminate();
        this.worker = null;
        console.log('OCR worker terminated successfully');
      } catch (error) {
        console.error('Error terminating OCR worker:', error);
      }
    }
  }
}

// Export singleton instance
export const ocrService = ComprehensiveOCRService.getInstance();
