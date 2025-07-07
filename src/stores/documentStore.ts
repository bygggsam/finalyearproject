
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { ocrService } from '@/services/comprehensiveOCR';
import { performanceOptimizer } from '@/services/performanceOptimizer';

export interface ProcessedDocument {
  id: string;
  fileName: string;
  patientName: string;
  documentType: string;
  uploadTime: Date;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  confidence?: number;
  rawOcrText?: string;
  extractedData?: any;
  processingTime?: number;
  fileUrl?: string;
  patientId?: string;
}

interface OCRProcessingResult {
  success: boolean;
  text: string;
  confidence: number;
  processingTime: number;
  structuredData?: any;
  error?: string;
}

interface DocumentState {
  documents: ProcessedDocument[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number;
  addDocument: (document: Omit<ProcessedDocument, 'id'>) => Promise<string | null>;
  updateDocument: (id: string, updates: Partial<ProcessedDocument>) => Promise<boolean>;
  getDocument: (id: string) => ProcessedDocument | undefined;
  getDocumentsByPatient: (patientName: string) => ProcessedDocument[];
  getCompletedDocuments: () => ProcessedDocument[];
  loadDocuments: (forceRefresh?: boolean) => Promise<void>;
  uploadFile: (file: File, documentId: string) => Promise<string | null>;
  processOCR: (documentId: string, imageUrl: string) => Promise<boolean>;
  clearDocuments: () => void;
  clearError: () => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,
  lastFetch: 0,

  clearError: () => set({ error: null }),

  addDocument: async (documentData) => {
    try {
      set({ error: null });
      console.log('Adding document to database:', documentData);
      
      const { data, error } = await supabase
        .from('documents')
        .insert({
          patient_name: documentData.patientName,
          document_type: documentData.documentType as any,
          input_format: 'handwritten_scan' as any,
          file_name: documentData.fileName,
          status: 'uploaded' as any,
          processing_progress: 0,
          ocr_result: documentData.rawOcrText ? { text: documentData.rawOcrText } : null,
          ai_structured_result: documentData.extractedData,
          confidence_score: documentData.confidence,
          processing_time: documentData.processingTime
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding document:', error);
        set({ error: `Failed to add document: ${error.message}` });
        return null;
      }

      console.log('Document added successfully:', data);

      const ocrResult = data.ocr_result as { text?: string } | null;
      const newDoc: ProcessedDocument = {
        id: data.id,
        fileName: data.file_name,
        patientName: data.patient_name,
        documentType: data.document_type,
        uploadTime: new Date(data.upload_date || data.created_at),
        status: 'uploading',
        confidence: data.confidence_score || undefined,
        rawOcrText: ocrResult?.text,
        extractedData: data.ai_structured_result,
        processingTime: data.processing_time || undefined,
        fileUrl: data.file_url || undefined,
        patientId: data.patient_id || undefined
      };

      set((state) => ({
        documents: [newDoc, ...state.documents]
      }));

      // Cache the new document
      performanceOptimizer.set(`document_${data.id}`, newDoc);

      return data.id;
    } catch (error) {
      console.error('Error adding document:', error);
      set({ error: 'Failed to add document. Please check your connection and try again.' });
      return null;
    }
  },

  updateDocument: async (id, updates) => {
    try {
      set({ error: null });
      console.log('Updating document:', id, updates);
      
      const dbUpdates: any = {};
      
      if (updates.status) {
        dbUpdates.status = updates.status === 'uploading' ? 'uploaded' : updates.status;
      }
      if (updates.confidence !== undefined) dbUpdates.confidence_score = updates.confidence;
      if (updates.rawOcrText) dbUpdates.ocr_result = { text: updates.rawOcrText };
      if (updates.extractedData) dbUpdates.ai_structured_result = updates.extractedData;
      if (updates.processingTime) dbUpdates.processing_time = updates.processingTime;
      if (updates.fileUrl) dbUpdates.file_url = updates.fileUrl;

      const { error } = await supabase
        .from('documents')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.error('Error updating document:', error);
        set({ error: `Failed to update document: ${error.message}` });
        return false;
      }

      console.log('Document updated successfully');

      set((state) => {
        const updatedDocs = state.documents.map(doc => 
          doc.id === id ? { ...doc, ...updates } : doc
        );
        
        // Update cache
        const updatedDoc = updatedDocs.find(doc => doc.id === id);
        if (updatedDoc) {
          performanceOptimizer.set(`document_${id}`, updatedDoc);
        }
        
        return { documents: updatedDocs };
      });

      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      set({ error: 'Failed to update document. Please try again.' });
      return false;
    }
  },

  uploadFile: async (file: File, documentId: string) => {
    try {
      set({ error: null });
      console.log('Uploading file:', file.name, 'for document:', documentId);
      
      // Optimize image before upload
      const optimizedFile = file.type.startsWith('image/') 
        ? await performanceOptimizer.optimizeImage(file)
        : file;
      
      const fileExt = optimizedFile.name.split('.').pop();
      const fileName = `${documentId}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('medical-documents')
        .upload(fileName, optimizedFile, {
          upsert: true
        });

      if (error) {
        console.error('Error uploading file:', error);
        set({ error: `Failed to upload file: ${error.message}` });
        return null;
      }

      console.log('File uploaded successfully:', data.path);

      const { data: { publicUrl } } = supabase.storage
        .from('medical-documents')
        .getPublicUrl(fileName);

      console.log('File public URL:', publicUrl);

      await get().updateDocument(documentId, { fileUrl: publicUrl, status: 'processing' });

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      set({ error: 'Failed to upload file. Please check your connection and try again.' });
      return null;
    }
  },

  processOCR: async (documentId: string, imageUrl: string) => {
    try {
      console.log('Starting OCR processing for document:', documentId);
      
      await get().updateDocument(documentId, { status: 'processing' });
      
      // Check cache first
      const cacheKey = `ocr_${documentId}`;
      let ocrResult = performanceOptimizer.get<OCRProcessingResult>(cacheKey);
      
      if (!ocrResult) {
        const rawResult = await ocrService.processDocument(imageUrl);
        ocrResult = rawResult as OCRProcessingResult;
        performanceOptimizer.set(cacheKey, ocrResult, 30 * 60 * 1000); // Cache for 30 minutes
      }
      
      if (ocrResult && ocrResult.success) {
        const success = await get().updateDocument(documentId, {
          status: 'completed',
          rawOcrText: ocrResult.text,
          extractedData: ocrResult.structuredData,
          confidence: ocrResult.confidence,
          processingTime: ocrResult.processingTime
        });
        
        if (success) {
          console.log('OCR processing completed successfully');
          return true;
        }
      } else {
        console.error('OCR processing failed:', ocrResult?.error);
        await get().updateDocument(documentId, { status: 'error' });
        set({ error: ocrResult?.error || 'OCR processing failed' });
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error processing OCR:', error);
      await get().updateDocument(documentId, { status: 'error' });
      set({ error: 'Failed to process OCR. Please try again.' });
      return false;
    }
  },

  loadDocuments: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();
    
    // Skip if recently fetched and not forcing refresh
    if (!forceRefresh && now - state.lastFetch < 30000 && state.documents.length > 0) {
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      console.log('Loading documents from database...');
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        set({ error: `Failed to load documents: ${error.message}`, isLoading: false });
        return;
      }

      console.log('Documents loaded successfully:', data?.length || 0);

      const documents: ProcessedDocument[] = (data || []).map(doc => {
        const ocrResult = doc.ocr_result as { text?: string } | null;
        const processedDoc: ProcessedDocument = {
          id: doc.id,
          fileName: doc.file_name,
          patientName: doc.patient_name,
          documentType: doc.document_type,
          uploadTime: new Date(doc.upload_date || doc.created_at),
          status: doc.status === 'uploaded' ? 'uploading' : (doc.status === 'completed' ? 'completed' : 'processing'),
          confidence: doc.confidence_score || undefined,
          rawOcrText: ocrResult?.text,
          extractedData: doc.ai_structured_result,
          processingTime: doc.processing_time || undefined,
          fileUrl: doc.file_url || undefined,
          patientId: doc.patient_id || undefined
        };
        
        // Cache individual documents
        performanceOptimizer.set(`document_${doc.id}`, processedDoc);
        
        return processedDoc;
      });

      set({ documents, isLoading: false, lastFetch: now });
    } catch (error) {
      console.error('Error loading documents:', error);
      set({ isLoading: false, error: 'Failed to load documents. Please refresh the page.' });
    }
  },

  getDocument: (id: string) => {
    // Try cache first
    const cached = performanceOptimizer.get<ProcessedDocument>(`document_${id}`);
    if (cached) return cached;
    
    return get().documents.find(doc => doc.id === id);
  },

  getDocumentsByPatient: (patientName: string) => {
    return get().documents.filter(doc => 
      doc.patientName.toLowerCase().includes(patientName.toLowerCase())
    );
  },

  getCompletedDocuments: () => {
    return get().documents.filter(doc => doc.status === 'completed');
  },

  clearDocuments: () => {
    set({ documents: [], error: null, lastFetch: 0 });
  }
}));
