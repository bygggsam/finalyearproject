import { pipeline, env } from '@huggingface/transformers';
import { medicalFormatter, MedicalECopy } from './medicalFormatter';

// Configure transformers.js for optimal performance
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface StructuredText {
  originalText: string;
  structuredContent: {
    summary: string;
    keyPoints: string[];
    sections: {
      title: string;
      content: string;
      type: 'header' | 'medication' | 'instruction' | 'vital' | 'diagnosis' | 'general';
    }[];
    medicalEntities: {
      medications: string[];
      dosages: string[];
      symptoms: string[];
      diagnoses: string[];
      vitals: string[];
    };
  };
  medicalECopy: MedicalECopy;
  eCopyImageUrl: string;
  confidence: number;
  processingTime: number;
}

export interface AIStructuringConfig {
  enableSummarization: boolean;
  enableMedicalNER: boolean;
  enableSectionDetection: boolean;
  enableKeyPointExtraction: boolean;
  structuringMethod: 'comprehensive' | 'medical-focused' | 'minimal';
}

export class AITextStructuringEngine {
  private textClassificationPipeline?: any;
  private summarizationPipeline?: any;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🤖 Initializing AI Text Structuring Engine...');
    
    try {
      // Initialize text classification for medical document analysis
      console.log('📊 Loading text classification model...');
      this.textClassificationPipeline = await pipeline(
        'text-classification',
        'microsoft/DialoGPT-medium',
        { 
          device: 'webgpu',
          dtype: 'fp32'
        }
      );

      // Initialize summarization pipeline
      console.log('📝 Loading summarization model...');
      this.summarizationPipeline = await pipeline(
        'summarization',
        'facebook/bart-large-cnn',
        { 
          device: 'webgpu',
          dtype: 'fp32'
        }
      );

      console.log('✅ AI Text Structuring Engine initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.warn('⚠️ Some AI models failed to load, using fallback methods:', error);
      this.isInitialized = true;
    }
  }

  async structureText(
    text: string,
    patientName: string,
    documentType: string,
    config: AIStructuringConfig = {
      enableSummarization: true,
      enableMedicalNER: true,
      enableSectionDetection: true,
      enableKeyPointExtraction: true,
      structuringMethod: 'comprehensive'
    },
    onProgress?: (progress: number, stage: string) => void
  ): Promise<StructuredText> {
    const startTime = Date.now();
    
    await this.initialize();
    
    console.log('🤖 Starting AI text structuring...');
    onProgress?.(10, 'AI Analysis Started');

    // Step 1: Clean and preprocess text
    const cleanedText = this.preprocessText(text);
    onProgress?.(20, 'Text Preprocessing');

    // Step 2: Extract medical entities using pattern matching and AI
    const medicalEntities = await this.extractMedicalEntities(cleanedText);
    onProgress?.(40, 'Medical Entity Extraction');

    // Step 3: Detect sections and structure
    const sections = await this.detectSections(cleanedText);
    onProgress?.(60, 'Section Detection');

    // Step 4: Generate summary if enabled
    let summary = '';
    if (config.enableSummarization) {
      summary = await this.generateSummary(cleanedText);
      onProgress?.(70, 'AI Summarization');
    }

    // Step 5: Extract key points
    const keyPoints = config.enableKeyPointExtraction 
      ? await this.extractKeyPoints(cleanedText, sections)
      : [];
    onProgress?.(80, 'Key Point Extraction');

    // Step 6: Create medical e-copy structure
    onProgress?.(85, 'Creating Medical E-Copy');
    const structuredContent = {
      summary,
      keyPoints,
      sections,
      medicalEntities
    };
    
    const medicalECopy = medicalFormatter.formatToMedicalECopy(
      cleanedText,
      patientName,
      documentType,
      structuredContent
    );

    // Step 7: Generate e-copy image
    onProgress?.(95, 'Generating E-Copy Image');
    const eCopyImageUrl = medicalFormatter.generateECopyImage(medicalECopy);

    const processingTime = Date.now() - startTime;
    
    const structuredResult: StructuredText = {
      originalText: text,
      structuredContent,
      medicalECopy,
      eCopyImageUrl,
      confidence: this.calculateStructuringConfidence(sections, medicalEntities),
      processingTime: Math.round(processingTime / 1000)
    };

    onProgress?.(100, 'AI Structuring Complete');
    console.log('🎉 AI text structuring completed in', processingTime + 'ms');
    console.log('📋 Medical e-copy created with image representation');
    
    return structuredResult;
  }

  private preprocessText(text: string): string {
    return text
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Fix common OCR errors
      .replace(/(?<![a-zA-Z])0(?![a-zA-Z0-9])/g, 'O')
      .replace(/(?<![a-zA-Z])1(?=l|I)/g, 'I')
      .replace(/rn/g, 'm')
      // Standardize medical abbreviations
      .replace(/\b(mg|mcg|ml|tab|cap|bid|tid|qid|prn|po|iv|im|sc)\b/gi, match => match.toLowerCase())
      .trim();
  }

  private async extractMedicalEntities(text: string): Promise<{
    medications: string[];
    dosages: string[];
    symptoms: string[];
    diagnoses: string[];
    vitals: string[];
  }> {
    const entities = {
      medications: [] as string[],
      dosages: [] as string[],
      symptoms: [] as string[],
      diagnoses: [] as string[],
      vitals: [] as string[]
    };

    // Medication patterns
    const medicationPatterns = [
      /\b([A-Z][a-z]+(?:in|ol|ide|ine|ate|ium))\b/g,
      /\b(aspirin|ibuprofen|acetaminophen|metformin|lisinopril|amlodipine|simvastatin|omeprazole)\b/gi
    ];

    // Dosage patterns
    const dosagePatterns = [
      /\b(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|tab|tablet|cap|capsule))\b/gi,
      /\b(\d+\s*times?\s*(?:daily|per day|a day))\b/gi
    ];

    // Vital signs patterns
    const vitalPatterns = [
      /\b(?:BP|blood pressure):\s*(\d+\/\d+)\b/gi,
      /\b(?:temp|temperature):\s*(\d+(?:\.\d+)?)\b/gi,
      /\b(?:pulse|heart rate):\s*(\d+)\b/gi,
      /\b(?:weight):\s*(\d+(?:\.\d+)?)\b/gi
    ];

    // Extract medications
    medicationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        entities.medications.push(...matches.map(m => m.trim()));
      }
    });

    // Extract dosages
    dosagePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        entities.dosages.push(...matches.map(m => m.trim()));
      }
    });

    // Extract vitals
    vitalPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        entities.vitals.push(...matches.map(m => m.trim()));
      }
    });

    // Remove duplicates
    Object.keys(entities).forEach(key => {
      entities[key as keyof typeof entities] = [...new Set(entities[key as keyof typeof entities])];
    });

    return entities;
  }

  private async detectSections(text: string): Promise<{
    title: string;
    content: string;
    type: 'header' | 'medication' | 'instruction' | 'vital' | 'diagnosis' | 'general';
  }[]> {
    const sections = [];
    const lines = text.split('\n').filter(line => line.trim());

    let currentSection = {
      title: 'Document Content',
      content: '',
      type: 'general' as 'header' | 'medication' | 'instruction' | 'vital' | 'diagnosis' | 'general'
    };

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if line is a section header
      if (this.isSectionHeader(trimmed)) {
        // Save current section if it has content
        if (currentSection.content.trim()) {
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          title: trimmed,
          content: '',
          type: this.determineSectionType(trimmed)
        };
      } else {
        // Add to current section
        currentSection.content += (currentSection.content ? '\n' : '') + trimmed;
      }
    }

    // Add final section
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }

    return sections;
  }

  private isSectionHeader(line: string): boolean {
    const headerPatterns = [
      /^[A-Z\s]{3,}:?\s*$/,  // All caps headers
      /^\d+\.\s*[A-Z]/,      // Numbered headers
      /^(CHIEF COMPLAINT|HISTORY|PHYSICAL|ASSESSMENT|PLAN|MEDICATIONS|ALLERGIES|VITALS)/i,
      /^(Patient Information|Medical History|Current Medications|Instructions)/i
    ];

    return headerPatterns.some(pattern => pattern.test(line)) && line.length < 80;
  }

  private determineSectionType(title: string): 'header' | 'medication' | 'instruction' | 'vital' | 'diagnosis' | 'general' {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('medication') || titleLower.includes('drug') || titleLower.includes('prescription')) {
      return 'medication';
    }
    if (titleLower.includes('vital') || titleLower.includes('bp') || titleLower.includes('temperature')) {
      return 'vital';
    }
    if (titleLower.includes('diagnosis') || titleLower.includes('assessment') || titleLower.includes('condition')) {
      return 'diagnosis';
    }
    if (titleLower.includes('instruction') || titleLower.includes('plan') || titleLower.includes('follow')) {
      return 'instruction';
    }
    if (titleLower.length < 50 && titleLower.match(/^[A-Z\s]+$/)) {
      return 'header';
    }
    
    return 'general';
  }

  private async generateSummary(text: string): Promise<string> {
    try {
      if (this.summarizationPipeline && text.length > 100) {
        const result = await this.summarizationPipeline(text.substring(0, 1000), {
          max_length: 150,
          min_length: 30,
          do_sample: false
        });
        
        return result[0]?.summary_text || this.generateFallbackSummary(text);
      }
    } catch (error) {
      console.warn('AI summarization failed, using fallback:', error);
    }
    
    return this.generateFallbackSummary(text);
  }

  private generateFallbackSummary(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyWords = ['medication', 'treatment', 'diagnosis', 'patient', 'symptoms', 'vital', 'blood pressure'];
    
    const relevantSentences = sentences
      .filter(sentence => keyWords.some(word => sentence.toLowerCase().includes(word)))
      .slice(0, 3);
    
    if (relevantSentences.length > 0) {
      return relevantSentences.join('. ').trim() + '.';
    }
    
    return sentences.slice(0, 2).join('. ').trim() + '.';
  }

  private async extractKeyPoints(text: string, sections: any[]): Promise<string[]> {
    const keyPoints = [];
    
    // Extract from each section
    for (const section of sections) {
      const sectionPoints = this.extractKeyPointsFromSection(section);
      keyPoints.push(...sectionPoints);
    }
    
    // Extract overall key points
    const lines = text.split('\n').filter(line => line.trim().length > 10);
    const importantLines = lines.filter(line => {
      const lower = line.toLowerCase();
      return lower.includes('important') || 
             lower.includes('note') || 
             lower.includes('warning') ||
             lower.match(/\b\d+\s*(mg|mcg|ml|times|daily)\b/) ||
             lower.includes('follow up') ||
             lower.includes('return');
    });
    
    keyPoints.push(...importantLines.slice(0, 5));
    
    // Remove duplicates and limit
    return [...new Set(keyPoints)].slice(0, 8);
  }

  private extractKeyPointsFromSection(section: any): string[] {
    const content = section.content;
    const points = [];
    
    switch (section.type) {
      case 'medication':
        const medLines = content.split('\n').filter((line: string) => 
          line.match(/\b\d+\s*(mg|mcg|ml|tab|cap)\b/i)
        );
        points.push(...medLines.slice(0, 3));
        break;
        
      case 'instruction':
        const instrLines = content.split('\n').filter((line: string) => 
          line.toLowerCase().includes('take') || 
          line.toLowerCase().includes('follow') ||
          line.toLowerCase().includes('return')
        );
        points.push(...instrLines.slice(0, 2));
        break;
        
      case 'vital':
        const vitalLines = content.split('\n').filter((line: string) => 
          line.match(/\d+/g)
        );
        points.push(...vitalLines.slice(0, 2));
        break;
    }
    
    return points;
  }

  private calculateStructuringConfidence(sections: any[], entities: any): number {
    let confidence = 50; // Base confidence
    
    // Boost confidence based on detected structure
    if (sections.length > 1) confidence += 20;
    if (sections.some(s => s.type !== 'general')) confidence += 15;
    
    // Boost confidence based on extracted entities
    const totalEntities = Object.values(entities).flat().length;
    confidence += Math.min(totalEntities * 2, 15);
    
    return Math.min(confidence, 95);
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
  }
}

// Singleton instance for global use
export const aiTextStructuring = new AITextStructuringEngine();

// Export the function that HandwrittenDigitizer is trying to import
export async function structureText(text: string, documentType: string): Promise<StructuredText> {
  const patientName = 'Unknown Patient'; // Default value since HandwrittenDigitizer doesn't pass this
  
  return await aiTextStructuring.structureText(text, patientName, documentType);
}
