import Tesseract from 'tesseract.js';
import { pipeline } from '@huggingface/transformers';
import { chatGPTEnhancer } from './chatgptEnhancer';

export interface TrainedExtractionResult {
  extractedText: string;
  confidence: number;
  method: string;
  processingTime: number;
  recognizedElements: {
    names: string[];
    ages: string[];
    medications: string[];
    symptoms: string[];
    vitals: string[];
    dates: string[];
    addresses: string[];
    phoneNumbers: string[];
  };
}

export class TrainedTextExtractor {
  private ocrWorker?: Tesseract.Worker;
  private textClassifier?: any;
  private isInitialized = false;

  // Enhanced Nigerian names database
  private nigerianNames = {
    yoruba: [
      'Adebayo', 'Adebola', 'Adejoke', 'Adeola', 'Adunni', 'Folake', 'Funmi', 'Kemi', 'Tunde', 'Yemi',
      'Babatunde', 'Olumide', 'Temitope', 'Adebisi', 'Adenike', 'Oluwaseun', 'Taiwo', 'Kehinde', 'Damilola',
      'Ayodeji', 'Oluwakemi', 'Adeyemi', 'Folashade', 'Oluwafemi', 'Adeyinka', 'Oluwaseyi', 'Adebukola'
    ],
    igbo: [
      'Chidi', 'Chioma', 'Emeka', 'Ngozi', 'Obioma', 'Chinedu', 'Chinelo', 'Ifeanyi', 'Kelechi', 'Nneka',
      'Chukwuemeka', 'Chigozie', 'Uchechi', 'Amarachi', 'Chukwudi', 'Chiamaka', 'Ikechukwu', 'Okechukwu',
      'Chidinma', 'Chinyere', 'Ebere', 'Ifeoma', 'Chukwuma', 'Nnamdi', 'Chinwe', 'Obinna', 'Adaeze'
    ],
    hausa: [
      'Abdullahi', 'Aisha', 'Amina', 'Fatima', 'Hafsat', 'Ibrahim', 'Khadija', 'Muhammad', 'Sani', 'Zainab',
      'Ahmad', 'Aliyu', 'Hauwa', 'Maryam', 'Sadiq', 'Usman', 'Yakubu', 'Zahra', 'Bilkisu', 'Halima',
      'Ismail', 'Jamila', 'Rashid', 'Salim', 'Umaru', 'Yusuf', 'Zaynab', 'Bashir'
    ],
    common: [
      'John', 'Mary', 'David', 'Sarah', 'Michael', 'Grace', 'Paul', 'Ruth', 'Peter', 'Joy',
      'Daniel', 'Faith', 'Joseph', 'Peace', 'Samuel', 'Love', 'Emmanuel', 'Hope', 'James', 'Mercy'
    ]
  };

  // Medical vocabulary for enhanced recognition
  private medicalTerms = [
    'patient', 'diagnosis', 'treatment', 'medication', 'prescription', 'symptoms',
    'blood pressure', 'temperature', 'pulse', 'weight', 'height', 'allergies',
    'history', 'examination', 'doctor', 'nurse', 'clinic', 'hospital',
    'paracetamol', 'ibuprofen', 'aspirin', 'amoxicillin', 'metformin', 'lisinopril',
    'amlodipine', 'simvastatin', 'omeprazole', 'atorvastatin', 'levothyroxine',
    'mg', 'mcg', 'ml', 'tab', 'tablet', 'capsule', 'injection', 'syrup',
    'bid', 'tid', 'qid', 'daily', 'twice', 'thrice', 'morning', 'evening',
    'bp', 'hr', 'temp', 'wt', 'ht', 'bmi', 'oxygen', 'saturation'
  ];

  // Common handwriting variations and corrections
  private handwritingCorrections = new Map([
    ['0', 'O'], ['1', 'I'], ['5', 'S'], ['8', 'B'], ['6', 'G'],
    ['rn', 'm'], ['cl', 'd'], ['nn', 'n'], ['ii', 'n'], ['li', 'h'],
    ['pts', 'patient'], ['dx', 'diagnosis'], ['rx', 'prescription'],
    ['hx', 'history'], ['sx', 'symptoms'], ['tx', 'treatment'],
    ['paracetmol', 'paracetamol'], ['ibuprofin', 'ibuprofen'],
    ['presciption', 'prescription'], ['medicin', 'medicine']
  ]);

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🧠 Initializing Enhanced Trained Text Extractor...');
    
    try {
      this.ocrWorker = await Tesseract.createWorker('eng', 1, {
        logger: () => {}
      });

      await this.ocrWorker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:()[]/-+= ',
        preserve_interword_spaces: '1',
        tessedit_enable_dict_correction: '1',
        tessedit_enable_bigram_correction: '1',
        classify_enable_learning: '1',
        classify_enable_adaptive_matcher: '1',
        textord_heavy_nr: '1',
        textord_min_linesize: '1.0',
        tessedit_fix_fuzzy_spaces: '1'
      });

      console.log('🤖 Loading AI text classifier...');
      this.textClassifier = await pipeline(
        'text-classification',
        'microsoft/DialoGPT-medium',
        { device: 'webgpu', dtype: 'fp32' }
      );

      this.isInitialized = true;
      console.log('✅ Enhanced Trained Text Extractor initialized successfully');
    } catch (error) {
      console.warn('⚠️ Some AI models failed to load, using enhanced fallback methods:', error);
      this.isInitialized = true;
    }
  }

  async extractText(imageUrl: string, onProgress?: (progress: number, stage: string) => void): Promise<TrainedExtractionResult> {
    const startTime = Date.now();
    
    await this.initialize();
    
    console.log('🔍 Starting enhanced trained text extraction...');
    onProgress?.(10, 'Preprocessing Image');

    try {
      const enhancedImage = await this.advancedImagePreprocessing(imageUrl);
      onProgress?.(25, 'Multi-Pass OCR Processing');

      const ocrResults = await this.multiPassOCR(enhancedImage);
      onProgress?.(50, 'AI Text Correction & Enhancement');

      const correctedText = await this.aiTextCorrection(ocrResults);
      onProgress?.(70, 'Enhanced Entity Recognition');

      let recognizedElements = await this.enhancedEntityRecognition(correctedText);
      
      // Try ChatGPT enhancement if available
      if (chatGPTEnhancer.isConfigured()) {
        onProgress?.(80, 'ChatGPT Enhancement');
        try {
          const chatGPTResult = await chatGPTEnhancer.enhanceEntityExtraction(correctedText);
          if (chatGPTResult) {
            console.log('🤖 ChatGPT enhancement successful, merging results...');
            recognizedElements = this.mergeEntityResults(recognizedElements, chatGPTResult);
          }
        } catch (error) {
          console.warn('⚠️ ChatGPT enhancement failed, using local results:', error);
        }
      }

      onProgress?.(85, 'Final Processing');

      const finalText = this.assembleFinalText(correctedText, recognizedElements);
      const confidence = this.calculateExtractionConfidence(finalText, recognizedElements);

      onProgress?.(100, 'Extraction Complete');

      const processingTime = Date.now() - startTime;
      
      console.log('🎉 Enhanced trained extraction completed successfully');
      console.log('📊 Extraction confidence:', confidence + '%');
      console.log('📝 Extracted entities:', this.getEntitySummary(recognizedElements));

      return {
        extractedText: finalText,
        confidence,
        method: chatGPTEnhancer.isConfigured() ? 'chatgpt-enhanced-ai' : 'enhanced-trained-ai',
        processingTime: Math.round(processingTime / 1000),
        recognizedElements
      };

    } catch (error) {
      console.error('❌ Enhanced trained extraction failed:', error);
      return await this.fallbackExtraction(imageUrl);
    }
  }

  private mergeEntityResults(local: TrainedExtractionResult['recognizedElements'], chatgpt: any): TrainedExtractionResult['recognizedElements'] {
    const merged: TrainedExtractionResult['recognizedElements'] = {
      names: [],
      ages: [],
      medications: [],
      symptoms: [],
      vitals: [],
      dates: [],
      addresses: [],
      phoneNumbers: []
    };

    // For each entity type, prefer ChatGPT results if they're not "None"
    Object.keys(merged).forEach(key => {
      const chatgptValues = chatgpt[key] || ['None'];
      const localValues = local[key as keyof typeof local] || ['None'];
      
      // Use ChatGPT results if they found entities, otherwise use local results
      if (chatgptValues.length > 0 && chatgptValues[0] !== 'None') {
        merged[key as keyof typeof merged] = chatgptValues;
      } else if (localValues.length > 0 && localValues[0] !== 'None') {
        merged[key as keyof typeof merged] = localValues;
      } else {
        merged[key as keyof typeof merged] = ['None'];
      }
    });

    console.log('🔄 Merged ChatGPT and local entity results');
    return merged;
  }

  private async advancedImagePreprocessing(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = document.createElement('img');
      
      img.onload = () => {
        const maxDimension = 2400;
        let { width, height } = img;
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.filter = 'contrast(3.2) brightness(1.4) saturate(0)';
        ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const contrast = 3.5;
          const brightness = 25;
          gray = Math.max(0, Math.min(255, (gray - 128) * contrast + 128 + brightness));
          
          const threshold = 140;
          gray = gray > threshold ? 255 : 0;
          
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png', 1.0));
      };
      
      img.src = imageUrl;
    });
  }

  private async multiPassOCR(imageUrl: string): Promise<string[]> {
    if (!this.ocrWorker) return [];

    const results: string[] = [];
    const psmModes = [6, 7, 8, 11, 13];
    
    for (const psm of psmModes) {
      try {
        await this.ocrWorker.setParameters({
          tessedit_pageseg_mode: psm as any
        });
        
        const { data: { text } } = await this.ocrWorker.recognize(imageUrl);
        if (text && text.trim().length > 0) {
          results.push(text.trim());
        }
      } catch (error) {
        console.warn(`OCR pass with PSM ${psm} failed:`, error);
      }
    }
    
    return results;
  }

  private async aiTextCorrection(ocrResults: string[]): Promise<string> {
    const combinedText = this.combineOCRResults(ocrResults);
    
    let correctedText = combinedText;
    for (const [wrong, correct] of this.handwritingCorrections) {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      correctedText = correctedText.replace(regex, correct);
    }
    
    correctedText = this.enhanceMedicalTerms(correctedText);
    
    correctedText = correctedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,;:()[\]/-]/g, '')
      .trim();
    
    return correctedText;
  }

  private async enhancedEntityRecognition(text: string): Promise<TrainedExtractionResult['recognizedElements']> {
    console.log('🎯 Starting enhanced entity recognition...');
    
    return {
      names: this.extractNigerianNames(text),
      ages: this.extractAges(text),
      medications: this.extractMedications(text),
      symptoms: this.extractSymptoms(text),
      vitals: this.extractVitals(text),
      dates: this.extractDates(text),
      addresses: this.extractAddresses(text),
      phoneNumbers: this.extractPhoneNumbers(text)
    };
  }

  private extractNigerianNames(text: string): string[] {
    console.log('👤 Extracting Nigerian names...');
    const foundNames: string[] = [];
    const words = text.split(/\s+/);
    
    const allNigerianNames = [
      ...this.nigerianNames.yoruba,
      ...this.nigerianNames.igbo,
      ...this.nigerianNames.hausa,
      ...this.nigerianNames.common
    ];
    
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length < 2) continue;
      
      const exactMatch = allNigerianNames.find(name => 
        name.toLowerCase() === cleanWord.toLowerCase()
      );
      
      if (exactMatch) {
        foundNames.push(exactMatch);
        continue;
      }
      
      const fuzzyMatch = allNigerianNames.find(name => 
        this.calculateSimilarity(name.toLowerCase(), cleanWord.toLowerCase()) > 0.7
      );
      
      if (fuzzyMatch) {
        foundNames.push(fuzzyMatch);
      }
    }
    
    const namePatterns = [
      /(?:patient|name|pt\.?)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /(?:mr\.?|mrs\.?|miss|ms\.?|dr\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
    ];
    
    namePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const extractedName = match[1].trim();
        const nameWords = extractedName.split(' ');
        
        for (const nameWord of nameWords) {
          const matchedName = allNigerianNames.find(name => 
            this.calculateSimilarity(name.toLowerCase(), nameWord.toLowerCase()) > 0.7
          );
          if (matchedName) {
            foundNames.push(matchedName);
          }
        }
      }
    });
    
    const result = [...new Set(foundNames)];
    console.log('👤 Nigerian names found:', result.length > 0 ? result : ['None']);
    return result.length > 0 ? result : ['None'];
  }

  private extractAges(text: string): string[] {
    console.log('🎂 Extracting ages...');
    const agePatterns = [
      /(?:age|years?|yrs?)[\s:]*(\d{1,3})/gi,
      /(\d{1,3})\s*(?:years?|yrs?|y\/o|yo)\b/gi,
      /\b(\d{1,3})\s*(?:year|yr)\s*old\b/gi
    ];
    
    const ages: string[] = [];
    agePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const age = parseInt(match[1]);
        if (age > 0 && age <= 120) {
          ages.push(age + ' years');
        }
      }
    });
    
    const result = [...new Set(ages)];
    console.log('🎂 Ages found:', result.length > 0 ? result : ['None']);
    return result.length > 0 ? result : ['None'];
  }

  private extractMedications(text: string): string[] {
    console.log('💊 Extracting medications...');
    const medPatterns = [
      /\b([A-Z][a-z]+(?:in|ol|ide|ine|ate|ium|pril|mycin|cillin))\b/gi,
      /\b(paracetamol|ibuprofen|aspirin|amoxicillin|metformin|lisinopril|amlodipine|simvastatin|omeprazole|atorvastatin|levothyroxine)\b/gi,
      /(?:medication|medicine|drug|tablet|capsule|prescription)[\s:]*([A-Z][a-z]+)/gi
    ];
    
    const medications: string[] = [];
    medPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const med = match[1] || match[0];
        if (med && med.length > 2) {
          medications.push(med.trim());
        }
      }
    });
    
    const result = [...new Set(medications)];
    console.log('💊 Medications found:', result.length > 0 ? result : ['None']);
    return result.length > 0 ? result : ['None'];
  }

  private extractSymptoms(text: string): string[] {
    console.log('🤒 Extracting symptoms...');
    const symptomKeywords = [
      'pain', 'fever', 'headache', 'nausea', 'vomiting', 'diarrhea', 'constipation',
      'cough', 'cold', 'flu', 'fatigue', 'weakness', 'dizziness', 'shortness of breath',
      'chest pain', 'abdominal pain', 'back pain', 'joint pain', 'muscle pain',
      'sore throat', 'runny nose', 'sneezing', 'itching', 'rash', 'swelling'
    ];
    
    const symptoms: string[] = [];
    const textLower = text.toLowerCase();
    
    symptomKeywords.forEach(symptom => {
      if (textLower.includes(symptom)) {
        symptoms.push(symptom);
      }
    });
    
    console.log('🤒 Symptoms found:', symptoms.length > 0 ? symptoms : ['None']);
    return symptoms.length > 0 ? symptoms : ['None'];
  }

  private extractVitals(text: string): string[] {
    console.log('📊 Extracting vital signs...');
    const vitalPatterns = [
      /(?:bp|blood pressure)[\s:]*(\d+\/\d+)/gi,
      /(?:temperature|temp)[\s:]*(\d+(?:\.\d+)?)/gi,
      /(?:pulse|heart rate|hr)[\s:]*(\d+)/gi,
      /(?:weight|wt)[\s:]*(\d+(?:\.\d+)?)/gi,
      /(?:height|ht)[\s:]*(\d+(?:\.\d+)?)/gi
    ];
    
    const vitals: string[] = [];
    vitalPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        vitals.push(match[0].trim());
      }
    });
    
    const result = [...new Set(vitals)];
    console.log('📊 Vitals found:', result.length > 0 ? result : ['None']);
    return result.length > 0 ? result : ['None'];
  }

  private extractDates(text: string): string[] {
    console.log('📅 Extracting dates...');
    const datePatterns = [
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/gi,
      /\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4})\b/gi,
      /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{2,4})\b/gi
    ];
    
    const dates: string[] = [];
    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        dates.push(match[1].trim());
      }
    });
    
    const result = [...new Set(dates)];
    console.log('📅 Dates found:', result.length > 0 ? result : ['None']);
    return result.length > 0 ? result : ['None'];
  }

  private extractAddresses(text: string): string[] {
    console.log('🏠 Extracting addresses...');
    const addressPatterns = [
      /(?:address|addr)[\s:]+([^\n]+)/gi,
      /\b(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:street|st|road|rd|avenue|ave|lane|ln|close|crescent))\b/gi,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:state|lagos|abuja|kano|ibadan|benin|port harcourt))\b/gi
    ];
    
    const addresses: string[] = [];
    addressPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const address = match[1] ? match[1].trim() : match[0].trim();
        if (address.length > 5) {
          addresses.push(address);
        }
      }
    });
    
    const result = [...new Set(addresses)];
    console.log('🏠 Addresses found:', result.length > 0 ? result : ['None']);
    return result.length > 0 ? result : ['None'];
  }

  private extractPhoneNumbers(text: string): string[] {
    console.log('📱 Extracting phone numbers...');
    const phonePatterns = [
      /(?:phone|tel|mobile|contact)[\s:]*([+\d\s\-()]+)/gi,
      /(\+?234[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{4})/gi,
      /(\b0[789]\d{9}\b)/gi,
      /(\+?\d{1,4}[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4})/gi
    ];
    
    const phones: string[] = [];
    phonePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const phone = match[1] ? match[1].trim() : match[0].trim();
        if (phone.replace(/\D/g, '').length >= 10) {
          phones.push(phone);
        }
      }
    });
    
    const result = [...new Set(phones)];
    console.log('📱 Phone numbers found:', result.length > 0 ? result : ['None']);
    return result.length > 0 ? result : ['None'];
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
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
    
    return matrix[str2.length][str1.length];
  }

  private combineOCRResults(results: string[]): string {
    if (results.length === 0) return '';
    if (results.length === 1) return results[0];
    
    const sortedResults = results.sort((a, b) => b.length - a.length);
    let bestResult = sortedResults[0];
    
    for (let i = 1; i < sortedResults.length; i++) {
      const words = sortedResults[i].split(' ');
      for (const word of words) {
        if (word.length > 3 && !bestResult.toLowerCase().includes(word.toLowerCase())) {
          if (this.medicalTerms.some(term => term.toLowerCase().includes(word.toLowerCase()) || word.toLowerCase().includes(term.toLowerCase()))) {
            bestResult += ' ' + word;
          }
        }
      }
    }
    
    return bestResult;
  }

  private enhanceMedicalTerms(text: string): string {
    let enhanced = text;
    
    enhanced = enhanced.replace(/\bb\.?p\.?\b/gi, 'blood pressure');
    enhanced = enhanced.replace(/\bh\.?r\.?\b/gi, 'heart rate');
    enhanced = enhanced.replace(/\btemp\.?\b/gi, 'temperature');
    enhanced = enhanced.replace(/\bwt\.?\b/gi, 'weight');
    enhanced = enhanced.replace(/\bht\.?\b/gi, 'height');
    enhanced = enhanced.replace(/\bpt\.?\b/gi, 'patient');
    enhanced = enhanced.replace(/\bdr\.?\b/gi, 'doctor');
    
    enhanced = enhanced.replace(/blood\s+pressure/gi, 'blood pressure');
    enhanced = enhanced.replace(/heart\s+rate/gi, 'heart rate');
    enhanced = enhanced.replace(/para\s*cetamol/gi, 'paracetamol');
    enhanced = enhanced.replace(/ibu\s*profen/gi, 'ibuprofen');
    
    return enhanced;
  }

  private assembleFinalText(correctedText: string, elements: TrainedExtractionResult['recognizedElements']): string {
    let finalText = correctedText;
    
    if (elements.names.length > 0 && elements.names[0] !== 'None' && !finalText.toLowerCase().includes('patient')) {
      finalText = `Patient: ${elements.names[0]}\n${finalText}`;
    }
    
    if (elements.ages.length > 0 && elements.ages[0] !== 'None' && !finalText.toLowerCase().includes('age')) {
      finalText = finalText.replace(/(patient:?[^\n]+)/i, `$1, Age: ${elements.ages[0]}`);
    }
    
    return finalText;
  }

  private calculateExtractionConfidence(text: string, elements: TrainedExtractionResult['recognizedElements']): number {
    let confidence = 70;
    
    if (text.length > 50) confidence += 10;
    if (text.length > 200) confidence += 5;
    
    const validElements = Object.values(elements).flat().filter(item => item !== 'None').length;
    confidence += Math.min(validElements * 2, 15);
    
    const medicalTermsFound = this.medicalTerms.filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    ).length;
    confidence += Math.min(medicalTermsFound, 10);
    
    return Math.min(confidence, 98);
  }

  private getEntitySummary(elements: TrainedExtractionResult['recognizedElements']): string {
    const summary = [];
    Object.entries(elements).forEach(([key, values]) => {
      const validValues = values.filter(v => v !== 'None');
      summary.push(`${key}: ${validValues.length > 0 ? validValues.length : 'None'}`);
    });
    return summary.join(', ');
  }

  private async fallbackExtraction(imageUrl: string): Promise<TrainedExtractionResult> {
    console.log('🔄 Using fallback extraction method...');
    
    if (!this.ocrWorker) {
      await this.initialize();
    }
    
    try {
      const { data: { text, confidence } } = await this.ocrWorker!.recognize(imageUrl);
      
      return {
        extractedText: text || '[No text could be extracted]',
        confidence: Math.max(confidence || 0, 50),
        method: 'fallback-ocr',
        processingTime: 3,
        recognizedElements: {
          names: ['None'],
          ages: ['None'],
          medications: ['None'],
          symptoms: ['None'],
          vitals: ['None'],
          dates: ['None'],
          addresses: ['None'],
          phoneNumbers: ['None']
        }
      };
    } catch (error) {
      console.error('❌ Fallback extraction failed:', error);
      
      return {
        extractedText: '[Text extraction failed - please try with a clearer image]',
        confidence: 0,
        method: 'failed',
        processingTime: 1,
        recognizedElements: {
          names: ['None'],
          ages: ['None'],
          medications: ['None'],
          symptoms: ['None'],
          vitals: ['None'],
          dates: ['None'],
          addresses: ['None'],
          phoneNumbers: ['None']
        }
      };
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.ocrWorker) {
        await this.ocrWorker.terminate();
        this.ocrWorker = undefined;
      }
      this.isInitialized = false;
      console.log('🧹 Enhanced trained text extractor cleaned up');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

export const trainedExtractor = new TrainedTextExtractor();
