
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Scan, Camera, Zap, Brain } from 'lucide-react';
import DocumentInfoForm from './DocumentInfoForm';
import FileUploadZone from './FileUploadZone';
import ScanningStageSelector from './ScanningStageSelector';
import OCRConfigPanel from './OCRConfigPanel';
import ChatGPTConfig from './ChatGPTConfig';
import { HandwrittenDocument } from '../types/documentTypes';
import { useDocumentStore } from '@/stores/documentStore';
import { advancedOCR, AdvancedOCRConfig } from '@/services/advancedOCR';

interface DocumentUploadFormProps {
  onDocumentUpload: (document: HandwrittenDocument) => void;
}

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({ onDocumentUpload }) => {
  const [patientName, setPatientName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [scanningStage, setScanningStage] = useState('need_scanning');
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [chatGPTConfigured, setChatGPTConfigured] = useState(false);
  const [ocrConfig, setOcrConfig] = useState<AdvancedOCRConfig>({
    useTesseract: true,
    enhanceImage: true,
    combinationStrategy: 'best',
    confidenceThreshold: 70,
    medicalMode: true,
    useTrainedExtractor: true
  });
  
  const { toast } = useToast();
  const { addDocument, uploadFile, processOCR, error, clearError } = useDocumentStore();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = async (files: FileList) => {
    if (!patientName || !documentType || !inputFormat) {
      toast({
        title: '❌ Missing Information',
        description: 'Please complete all fields: Patient Name, Document Type, and Input Format.',
        variant: 'destructive',
      });
      return;
    }

    const file = files[0];
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: '❌ Invalid File Type',
        description: 'Please upload JPG, PNG, WebP, or PDF files only.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: '❌ File Too Large',
        description: 'Please upload files smaller than 20MB for optimal processing.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    clearError();

    try {
      console.log('🚀 Starting enhanced document processing workflow...');
      
      // Step 1: Add document to database
      const documentId = await addDocument({
        fileName: file.name,
        patientName,
        documentType,
        uploadTime: new Date(),
        status: 'uploading'
      });

      if (!documentId) {
        throw new Error(error || 'Failed to create document record');
      }

      console.log('✅ Document record created with ID:', documentId);

      // Step 2: Upload file to storage
      const fileUrl = await uploadFile(file, documentId);
      
      if (!fileUrl) {
        throw new Error('Failed to upload file to storage');
      }

      console.log('✅ File uploaded successfully:', fileUrl);
      
      toast({
        title: '📁 File Uploaded Successfully',
        description: 'Starting enhanced OCR processing...',
      });

      // Step 3: Enhanced OCR processing if document is already scanned
      if (scanningStage === 'already_scanned') {
        toast({
          title: '🧠 Enhanced AI OCR Processing',
          description: 'Advanced medical text extraction with ChatGPT enhancement...',
        });

        try {
          console.log('🔬 Starting enhanced OCR with config:', ocrConfig);
          
          // Process with enhanced OCR
          const ocrResult = await advancedOCR.processImage(
            fileUrl,
            {
              quality: 'good',
              documentType: 'handwritten',
              orientation: 0,
              hasStructure: true,
              language: 'en',
              confidence: 80,
              recommendations: ['Enhanced medical processing']
            },
            ocrConfig,
            (progress, stage) => {
              console.log(`OCR Progress: ${progress}% - ${stage}`);
              toast({
                title: '🔄 Processing Update',
                description: `${stage} - ${Math.round(progress)}% complete`,
              });
            }
          );

          console.log('🎉 Enhanced OCR completed:', ocrResult);

          // Store enhanced OCR result with proper StructuredText format
          const enhancedDocument = {
            id: documentId,
            patientName,
            documentType: documentType as 'case_history' | 'consultation_notes' | 'prescription' | 'other',
            inputFormat: inputFormat as 'handwritten_scan' | 'handwritten_photo' | 'existing_scan',
            status: 'completed' as const,
            fileName: file.name,
            uploadDate: new Date(),
            originalFile: file,
            processingProgress: 100,
            processingStage: 'completed',
            imageUrl: fileUrl,
            ocrResult: {
              text: ocrResult.text,
              confidence: ocrResult.confidence,
              method: ocrResult.method,
              processingTime: ocrResult.processingTime,
              metadata: ocrResult.metadata
            },
            aiStructuredResult: {
              originalText: ocrResult.text,
              structuredContent: ocrResult.metadata?.structuredData || {},
              eCopyImageUrl: fileUrl,
              confidence: ocrResult.confidence,
              processingTime: ocrResult.processingTime,
              medicalECopy: ocrResult.metadata?.structuredData
            }
          };

          // Save to localStorage for DocumentFormatter
          const existingDocs = JSON.parse(localStorage.getItem('handwrittenDocuments') || '[]');
          existingDocs.push(enhancedDocument);
          localStorage.setItem('handwrittenDocuments', JSON.stringify(existingDocs));

          onDocumentUpload(enhancedDocument);

          toast({
            title: '🎉 Enhanced Processing Complete!',
            description: `Medical text extracted with ${ocrResult.confidence}% confidence. Advanced AI structuring applied.`,
          });

        } catch (ocrError) {
          console.error('❌ Enhanced OCR processing failed:', ocrError);
          
          // Fallback to basic processing
          const basicSuccess = await processOCR(documentId, fileUrl);
          
          if (basicSuccess) {
            toast({
              title: '⚠️ Fallback Processing Complete',
              description: 'Basic OCR completed. Enhanced features may be limited.',
              variant: 'destructive',
            });
          } else {
            throw new Error('Both enhanced and basic OCR processing failed');
          }
        }
      } else {
        toast({
          title: '📋 Document Ready for Scanning',
          description: 'Document uploaded and ready for the scanning stage.',
        });
      }

      // Create HandwrittenDocument for the callback
      const newDocument: HandwrittenDocument = {
        id: documentId,
        patientName,
        documentType: documentType as 'case_history' | 'consultation_notes' | 'prescription' | 'other',
        inputFormat: inputFormat as 'handwritten_scan' | 'handwritten_photo' | 'existing_scan',
        status: scanningStage === 'need_scanning' ? 'need_scanning' : 'uploaded',
        fileName: file.name,
        uploadDate: new Date(),
        originalFile: file,
        processingProgress: scanningStage === 'already_scanned' ? 100 : 0,
        processingStage: scanningStage === 'need_scanning' ? 'need-scanning' : 'completed',
        imageUrl: fileUrl
      };

      if (scanningStage === 'need_scanning') {
        onDocumentUpload(newDocument);
      }

      // Reset form
      setPatientName('');
      setDocumentType('');
      setInputFormat('');
      setScanningStage('need_scanning');

    } catch (error) {
      console.error('❌ Enhanced processing failed:', error);
      toast({
        title: '❌ Processing Failed',
        description: error instanceof Error ? error.message : 'Failed to process document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const isFormValid = patientName && documentType && inputFormat;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <Brain className="mr-2 h-6 w-6 text-purple-500" />
            Enhanced Medical Document Processing System
          </CardTitle>
          <p className="text-sm text-gray-600">
            Complete AI-powered workflow: Upload → Enhanced OCR → ChatGPT Analysis → Structured Medical Data
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <DocumentInfoForm
            patientName={patientName}
            documentType={documentType}
            inputFormat={inputFormat}
            onPatientNameChange={setPatientName}
            onDocumentTypeChange={setDocumentType}
            onInputFormatChange={setInputFormat}
          />

          <ScanningStageSelector
            scanningStage={scanningStage}
            onScanningStageChange={setScanningStage}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm font-medium">Processing Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <FileUploadZone
            dragActive={dragActive}
            disabled={!isFormValid || isUploading}
            scanningStage={scanningStage}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onFileSelect={handleFiles}
          />

          {isUploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Enhanced AI Processing...</p>
                  <p className="text-blue-700">
                    {scanningStage === 'already_scanned' 
                      ? 'Advanced OCR with medical AI enhancement and ChatGPT analysis...' 
                      : 'Uploading file for scanning stage...'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced OCR Configuration */}
      <OCRConfigPanel 
        config={ocrConfig}
        onConfigChange={setOcrConfig}
      />

      {/* ChatGPT Configuration */}
      <ChatGPTConfig 
        onConfigChange={setChatGPTConfigured}
      />

      {/* System Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Zap className="mr-2 h-5 w-5 text-yellow-500" />
            Enhanced System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">🚀 Core Features Active:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✅ Enhanced Database Integration</li>
                <li>✅ Secure File Storage</li>
                <li>✅ Advanced OCR Engine</li>
                <li>✅ Medical Data Structuring</li>
                <li>✅ Role-based Access Control</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">🧠 AI Enhancements:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✅ Multi-Pass OCR Processing</li>
                <li>✅ Medical Term Recognition</li>
                <li>✅ Nigerian Name Detection</li>
                <li>✅ Entity Extraction</li>
                <li className={chatGPTConfigured ? "text-green-600" : "text-gray-500"}>
                  {chatGPTConfigured ? "✅" : "⚪"} ChatGPT Enhancement
                </li>
              </ul>
            </div>
          </div>
          
          {chatGPTConfigured && (
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>🤖 ChatGPT Integration Active:</strong> Your OCR results will be enhanced with 
                AI-powered entity recognition and medical text understanding for maximum accuracy.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUploadForm;
