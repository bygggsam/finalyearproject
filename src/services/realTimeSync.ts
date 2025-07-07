
// Real-time data synchronization service for handwritten document digitization workflow

export interface DocumentData {
  id: string;
  patientName: string;
  documentType: string;
  status: string;
  uploadDate?: string;
  uploadTime?: string;
  createdAt?: string;
  fileName?: string;
  imageUrl?: string;
  ocrResult?: string;
  extractedContent?: string;
  formattedContent?: string;
  confidence?: number;
  inputFormat?: string;
  lastUpdated?: string;
  processingProgress?: number;
  processingStage?: string;
  imageAnalysis?: any;
  aiStructuredResult?: any;
  eCopyImageUrl?: string;
}

export class RealTimeSync {
  private static instance: RealTimeSync;
  private listeners: Array<() => void> = [];
  private intervalId: NodeJS.Timeout | null = null;

  static getInstance(): RealTimeSync {
    if (!RealTimeSync.instance) {
      RealTimeSync.instance = new RealTimeSync();
    }
    return RealTimeSync.instance;
  }

  constructor() {
    this.startRealTimeSync();
  }

  private startRealTimeSync(): void {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      this.notifyListeners();
    }, 2000); // Update every 2 seconds for better performance
  }

  stopRealTimeSync(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  addListener(callback: () => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: () => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in real-time sync listener:', error);
      }
    });
  }

  getAllDocuments(): DocumentData[] {
    const handwrittenDocs = this.getStoredDocuments('handwrittenDocuments');
    const ocrDocs = this.getStoredDocuments('realTimeOcrDocuments');
    const formattedDocs = this.getStoredDocuments('formattedDocuments');
    const uploadedDocs = this.getStoredDocuments('uploadedDocuments');
    
    return [...handwrittenDocs, ...ocrDocs, ...formattedDocs, ...uploadedDocs]
      .filter((doc, index, self) => 
        index === self.findIndex(d => d.id === doc.id)
      );
  }

  private getStoredDocuments(storageKey: string): DocumentData[] {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return [];
      
      const docs = JSON.parse(stored);
      console.log(`📋 Loaded ${docs.length} documents from ${storageKey}`);
      
      const processedDocs = Array.isArray(docs) ? docs.map(doc => ({
        ...doc,
        uploadDate: doc.uploadDate || new Date().toISOString(),
        lastUpdated: doc.lastUpdated || new Date().toISOString()
      })) : [];
      
      return processedDocs;
    } catch (error) {
      console.error(`❌ Error loading documents from ${storageKey}:`, error);
      return [];
    }
  }

  saveDocument(document: DocumentData, storageKey: string = 'handwrittenDocuments'): void {
    try {
      const existingDocs = this.getStoredDocuments(storageKey);
      const updatedDocs = existingDocs.filter(doc => doc.id !== document.id);
      
      const docForStorage = {
        ...document,
        uploadDate: typeof document.uploadDate === 'string' ? document.uploadDate : new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      updatedDocs.push(docForStorage);
      
      localStorage.setItem(storageKey, JSON.stringify(updatedDocs));
      console.log(`✅ Document saved to ${storageKey}:`, document.id);
      this.notifyListeners();
    } catch (error) {
      console.error(`❌ Error saving document to ${storageKey}:`, error);
    }
  }

  updateDocumentStatus(documentId: string, status: string, additionalData?: Partial<DocumentData>): void {
    const storageKeys = ['handwrittenDocuments', 'realTimeOcrDocuments', 'formattedDocuments', 'uploadedDocuments'];
    let documentFound = false;
    
    storageKeys.forEach(storageKey => {
      const docs = this.getStoredDocuments(storageKey);
      const docIndex = docs.findIndex(doc => doc.id === documentId);
      
      if (docIndex !== -1) {
        const updatedDoc = {
          ...docs[docIndex],
          status,
          ...additionalData,
          lastUpdated: new Date().toISOString()
        };
        
        docs[docIndex] = updatedDoc;
        
        localStorage.setItem(storageKey, JSON.stringify(docs));
        documentFound = true;
        console.log(`📝 Updated document ${documentId} status to ${status}`);
      }
    });
    
    if (!documentFound) {
      console.warn(`⚠️ Document ${documentId} not found for status update`);
    }
    
    this.notifyListeners();
  }

  getDocumentsByStage(stage: string): DocumentData[] {
    const allDocs = this.getAllDocuments();
    
    return allDocs.filter(doc => {
      switch (stage) {
        case 'handwritten':
          return !doc.fileName && !doc.imageUrl && doc.status === 'uploaded';
        case 'scanned':
          return (doc.fileName || doc.imageUrl) && !doc.ocrResult && !doc.extractedContent;
        case 'digitized':
          return (doc.ocrResult || doc.extractedContent) && doc.status === 'digitized';
        case 'formatted':
          return doc.status === 'formatted' || doc.formattedContent || doc.aiStructuredResult;
        case 'completed':
          return doc.status === 'completed' || (doc.aiStructuredResult && doc.eCopyImageUrl);
        default:
          return false;
      }
    });
  }

  getWorkflowStats(): {
    total: number;
    handwritten: number;
    scanned: number;
    digitized: number;
    formatted: number;
    completed: number;
    processing: number;
  } {
    const allDocs = this.getAllDocuments();
    const processingDocs = allDocs.filter(doc => 
      doc.status === 'analyzing' || doc.status === 'processing'
    );
    
    return {
      total: allDocs.length,
      handwritten: this.getDocumentsByStage('handwritten').length,
      scanned: this.getDocumentsByStage('scanned').length,
      digitized: this.getDocumentsByStage('digitized').length,
      formatted: this.getDocumentsByStage('formatted').length,
      completed: this.getDocumentsByStage('completed').length,
      processing: processingDocs.length
    };
  }

  validateDocument(document: Partial<DocumentData>): boolean {
    if (!document.id || !document.patientName || !document.documentType) {
      console.error('❌ Document validation failed: missing required fields');
      return false;
    }
    return true;
  }

  clearAllData(): void {
    const storageKeys = ['handwrittenDocuments', 'realTimeOcrDocuments', 'formattedDocuments', 'uploadedDocuments', 'evaluationResults'];
    storageKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Cleared ${key}`);
    });
    this.notifyListeners();
  }

  getProcessingStats(): {
    totalProcessed: number;
    averageConfidence: number;
    successRate: number;
  } {
    const allDocs = this.getAllDocuments();
    const processedDocs = allDocs.filter(doc => doc.ocrResult && doc.confidence);
    
    if (processedDocs.length === 0) {
      return { totalProcessed: 0, averageConfidence: 0, successRate: 0 };
    }
    
    const totalConfidence = processedDocs.reduce((sum, doc) => sum + (doc.confidence || 0), 0);
    const averageConfidence = totalConfidence / processedDocs.length;
    const successfulDocs = processedDocs.filter(doc => (doc.confidence || 0) > 70);
    const successRate = (successfulDocs.length / processedDocs.length) * 100;
    
    return {
      totalProcessed: processedDocs.length,
      averageConfidence: Math.round(averageConfidence),
      successRate: Math.round(successRate)
    };
  }
}

export const realTimeSync = RealTimeSync.getInstance();
