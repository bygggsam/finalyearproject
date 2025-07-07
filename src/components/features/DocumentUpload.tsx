
import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { createWorker, PSM } from 'tesseract.js';
import { extractMedicalData, formatExtractedData, validateMedicalData } from '@/services/dataExtraction';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Eye,
  Download,
  Zap,
  Brain,
  Activity
} from 'lucide-react';

interface UploadedDocument {
  id: string;
  fileName: string;
  patientName: string;
  documentType: string;
  uploadTime: Date;
  status: 'uploading' | 'processing' | 'completed' | 'error' | 'validating';
  confidence?: number;
  ocrResult?: string;
  extractedData?: any;
  file?: File;
  progress?: number;
  validationIssues?: string[];
  processingTime?: number;
}

const DocumentUpload = () => {
  const [uploads, setUploads] = useState<UploadedDocument[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const { toast } = useToast();

  // Real-time OCR processing with enhanced accuracy
  const processOCR = async (file: File, uploadId: string) => {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting real-time OCR processing for:', file.name);
      setIsProcessing(true);
      
      // Update to processing status
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'processing', progress: 5 }
          : upload
      ));

      // Create worker with enhanced settings for medical documents
      const worker = await createWorker('eng', 1, {
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v6.0.1/dist/worker.min.js',
        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v6.0.1/tesseract-core.wasm.js',
      });
      
      // Configure for better medical text recognition
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:/-()%° ',
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // Use correct PSM enum value
        preserve_interword_spaces: '1',
      });

      // Real-time progress simulation
      const progressInterval = setInterval(() => {
        setUploads(prev => prev.map(upload => {
          if (upload.id === uploadId && upload.status === 'processing') {
            const currentProgress = upload.progress || 5;
            if (currentProgress < 85) {
              return { ...upload, progress: Math.min(currentProgress + Math.random() * 15, 85) };
            }
          }
          return upload;
        }));
      }, 800);

      // Process with enhanced recognition
      const { data: { text, confidence } } = await worker.recognize(file);
      
      clearInterval(progressInterval);
      
      // Update progress to 90% before data extraction
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, progress: 90, status: 'validating' }
          : upload
      ));

      await worker.terminate();

      const finalConfidence = Math.round(confidence);
      console.log('✅ OCR completed with confidence:', finalConfidence);
      
      // Extract and validate medical data in real-time
      const extractedData = extractMedicalData(text);
      const formattedData = formatExtractedData(extractedData);
      const validation = validateMedicalData(extractedData);
      
      const processingTime = Date.now() - startTime;
      
      // Final result
      const processedUpload = {
        ocrResult: formattedData,
        extractedData,
        confidence: finalConfidence,
        status: finalConfidence > 70 ? 'completed' as const : 'error' as const,
        progress: 100,
        validationIssues: validation.issues,
        processingTime: Math.round(processingTime / 1000)
      };

      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, ...processedUpload }
          : upload
      ));

      // Save to localStorage with real-time sync
      const existingData = JSON.parse(localStorage.getItem('realTimeOcrDocuments') || '[]');
      const updatedData = existingData.map((doc: any) => 
        doc.id === uploadId ? { ...doc, ...processedUpload } : doc
      );
      localStorage.setItem('realTimeOcrDocuments', JSON.stringify(updatedData));
      
      setTotalProcessed(prev => prev + 1);

      // Enhanced toast notifications
      toast({
        title: finalConfidence > 70 ? '🎉 Real-Time OCR Complete!' : '⚠️ OCR Completed with Issues',
        description: `Medical data extracted in ${Math.round(processingTime / 1000)}s with ${finalConfidence}% confidence${validation.issues.length > 0 ? ` (${validation.issues.length} validation issues)` : ''}`,
        variant: finalConfidence > 70 ? 'default' : 'destructive',
      });

    } catch (error) {
      console.error('❌ Real-time OCR processing failed:', error);
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'error', progress: 0 }
          : upload
      ));

      toast({
        title: '❌ Real-Time OCR Failed',
        description: 'There was an error processing the document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced drag and drop handlers
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

  // Enhanced file handling with real-time validation
  const handleFiles = async (files: FileList) => {
    if (!patientName || !documentType) {
      toast({
        title: '❌ Missing Information',
        description: 'Please enter patient name and select document type for real-time processing.',
        variant: 'destructive',
      });
      return;
    }

    const file = files[0];
    
    // Enhanced file validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: '❌ Invalid File Type',
        description: 'Please upload JPG, PNG, or PDF files only for optimal OCR performance.',
        variant: 'destructive',
      });
      return;
    }

    // File size validation (15MB limit for better quality)
    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: '❌ File Too Large',
        description: 'Please upload files smaller than 15MB for optimal processing speed.',
        variant: 'destructive',
      });
      return;
    }

    const newUpload: UploadedDocument = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      patientName,
      documentType,
      uploadTime: new Date(),
      status: 'uploading',
      file: file,
      progress: 0
    };

    setUploads(prev => [newUpload, ...prev]);

    // Real-time storage
    const existingData = JSON.parse(localStorage.getItem('realTimeOcrDocuments') || '[]');
    existingData.unshift({
      ...newUpload,
      file: null // Don't store file in localStorage
    });
    localStorage.setItem('realTimeOcrDocuments', JSON.stringify(existingData));

    // Start immediate processing
    setTimeout(() => {
      processOCR(file, newUpload.id);
    }, 200);

    // Clear form for next upload
    setPatientName('');
    setDocumentType('');

    toast({
      title: '🚀 Real-Time Processing Started',
      description: `Processing ${file.name} with advanced medical OCR...`,
    });
  };

  // Load documents from localStorage on mount
  useEffect(() => {
    const savedDocuments = JSON.parse(localStorage.getItem('realTimeOcrDocuments') || '[]');
    const documentsWithDates = savedDocuments.map((doc: any) => ({
      ...doc,
      uploadTime: new Date(doc.uploadTime)
    }));
    setUploads(documentsWithDates);
    setTotalProcessed(documentsWithDates.filter(doc => doc.status === 'completed').length);
  }, []);

  // Enhanced view and download handlers
  const handleViewDocument = (upload: UploadedDocument) => {
    if (upload.ocrResult) {
      const blob = new Blob([upload.ocrResult], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadResult = (upload: UploadedDocument) => {
    if (upload.ocrResult) {
      const blob = new Blob([upload.ocrResult], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${upload.patientName}_${upload.documentType}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: '📥 Download Complete',
        description: 'Medical data exported successfully.',
      });
    }
  };

  // Status helpers
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'processing':
        return <Brain className="h-4 w-4 text-orange-500 animate-spin" />;
      case 'validating':
        return <Activity className="h-4 w-4 text-purple-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Badge className="bg-blue-100 text-blue-800">Uploading</Badge>;
      case 'processing':
        return <Badge className="bg-orange-100 text-orange-800">Processing</Badge>;
      case 'validating':
        return <Badge className="bg-purple-100 text-purple-800">Validating</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Real-time Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Zap className="mr-3 h-8 w-8 text-yellow-500" />
            Real-Time Document Upload
          </h1>
          <p className="text-gray-600 mt-2">Advanced medical OCR with real-time processing and validation</p>
        </div>
        <div className="flex space-x-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{totalProcessed}</p>
            <p className="text-sm text-gray-500">Processed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{uploads.length}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
        </div>
      </div>

      {/* Processing Status Alert */}
      {isProcessing && (
        <Alert>
          <Brain className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Real-time OCR processing in progress... Advanced medical text extraction is running.
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Upload Medical Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input
                id="patientName"
                placeholder="Enter patient full name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="focus:ring-2 focus:ring-teal-500">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical_history">Medical History</SelectItem>
                  <SelectItem value="prescription">Prescription</SelectItem>
                  <SelectItem value="lab_results">Lab Results</SelectItem>
                  <SelectItem value="discharge_summary">Discharge Summary</SelectItem>
                  <SelectItem value="consultation_notes">Consultation Notes</SelectItem>
                  <SelectItem value="x_ray_report">X-Ray Report</SelectItem>
                  <SelectItem value="pathology_report">Pathology Report</SelectItem>
                  <SelectItem value="operative_note">Operative Note</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Enhanced File Upload Area */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
              ${dragActive 
                ? 'border-teal-500 bg-teal-50 scale-105' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <Zap className="mx-auto h-12 w-12 text-teal-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop files here for real-time processing
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Supported: JPG, PNG, PDF • Max size: 15MB • Optimized for medical documents
              </p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                className="hidden"
                id="file-upload"
                disabled={!patientName || !documentType}
              />
              <Button asChild disabled={!patientName || !documentType}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Files
                </label>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Upload History */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Real-Time Processing Queue ({uploads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploads.map((upload) => (
                <div key={upload.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {getStatusIcon(upload.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">{upload.fileName}</p>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(upload.status)}
                          {upload.processingTime && (
                            <Badge variant="outline" className="text-xs">
                              {upload.processingTime}s
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {upload.patientName} • {upload.documentType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {upload.uploadTime.toLocaleString()}
                      </p>
                      
                      {/* Real-time Progress Bar */}
                      {(upload.status === 'processing' || upload.status === 'validating') && (
                        <div className="mt-2">
                          <Progress value={upload.progress || 0} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1">
                            {upload.status === 'processing' ? '🧠 Advanced OCR Processing...' : '🔍 Validating Medical Data...'} {Math.round(upload.progress || 0)}%
                          </p>
                        </div>
                      )}
                      
                      {/* Enhanced Confidence and Validation */}
                      {upload.confidence && (
                        <div className="mt-2 flex items-center space-x-4">
                          <p className="text-xs text-gray-600">
                            OCR Confidence: 
                            <span className={`ml-1 font-medium ${
                              upload.confidence > 80 ? 'text-green-600' :
                              upload.confidence > 60 ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {upload.confidence}%
                            </span>
                          </p>
                          {upload.validationIssues && upload.validationIssues.length > 0 && (
                            <p className="text-xs text-orange-600">
                              ⚠️ {upload.validationIssues.length} validation issue(s)
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Enhanced Actions */}
                  <div className="flex space-x-2">
                    {upload.status === 'completed' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDocument(upload)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadResult(upload)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </>
                    )}
                    {upload.status === 'error' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => upload.file && processOCR(upload.file, upload.id)}
                        disabled={isProcessing}
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Real-Time OCR Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5 text-purple-600" />
            Real-Time OCR Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Upload className="mx-auto h-8 w-8 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-blue-900">1. Upload</p>
              <p className="text-xs text-blue-700">Instant file validation</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Brain className="mx-auto h-8 w-8 text-orange-600 mb-2" />
              <p className="text-sm font-medium text-orange-900">2. OCR Process</p>
              <p className="text-xs text-orange-700">Advanced Tesseract.js</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Activity className="mx-auto h-8 w-8 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-purple-900">3. Validation</p>
              <p className="text-xs text-purple-700">Medical data verification</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <p className="text-sm font-medium text-green-900">4. Complete</p>
              <p className="text-xs text-green-700">Structured output ready</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>🚀 Real-time Features:</strong> Client-side OCR with Tesseract.js, 
              live progress tracking, medical data validation, local storage persistence, 
              and instant downloadable results. Optimized for healthcare documents with 
              enhanced accuracy and real-time feedback.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;
