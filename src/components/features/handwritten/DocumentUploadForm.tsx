
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Brain, Camera, Scan, FileCheck, Image } from 'lucide-react';

interface ProcessedDocument {
  id: string;
  fileName: string;
  patientName: string;
  documentType: string;
  inputFormat: string;
  uploadTime: Date;
  status: 'uploading' | 'processing' | 'completed' | 'error' | 'digitized';
  file?: File;
  scanningStage?: 'need_scanning' | 'already_scanned';
}

interface DocumentUploadFormProps {
  onDocumentUpload: (document: ProcessedDocument) => void;
}

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({ onDocumentUpload }) => {
  const [patientName, setPatientName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [scanningStage, setScanningStage] = useState<'need_scanning' | 'already_scanned'>('need_scanning');
  const [dragActive, setDragActive] = useState(false);
  
  const { toast } = useToast();

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
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: '❌ Invalid File Type',
        description: 'Please upload JPG, PNG, or WebP files for optimal OCR performance.',
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

    const newDocument: ProcessedDocument = {
      id: `enhanced-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      patientName,
      documentType,
      inputFormat,
      uploadTime: new Date(),
      status: 'uploading',
      file: file,
      scanningStage
    };

    onDocumentUpload(newDocument);

    if (scanningStage === 'already_scanned') {
      toast({
        title: '🧠 Enhanced Processing Started',
        description: `Processing ${file.name} with advanced medical AI and ChatGPT enhancement...`,
      });
    } else {
      toast({
        title: '📁 Document Uploaded for Scanning',
        description: `${file.name} uploaded successfully. Ready for scanning stage.`,
      });
    }

    // Reset form
    setPatientName('');
    setDocumentType('');
    setInputFormat('');
    setScanningStage('need_scanning');
  };

  const isFormValid = patientName && documentType && inputFormat;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5 text-purple-500" />
          Enhanced Medical Document Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="patientName">Patient Name *</Label>
            <Input
              id="patientName"
              placeholder="Enter patient full name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="focus:ring-2 focus:ring-purple-500">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="case_history">Case History</SelectItem>
                <SelectItem value="consultation_notes">Consultation Notes</SelectItem>
                <SelectItem value="prescription">Prescription</SelectItem>
                <SelectItem value="lab_results">Lab Results</SelectItem>
                <SelectItem value="discharge_summary">Discharge Summary</SelectItem>
                <SelectItem value="x_ray_report">X-Ray Report</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inputFormat">Select Document Format *</Label>
          <Select value={inputFormat} onValueChange={setInputFormat}>
            <SelectTrigger className="focus:ring-2 focus:ring-purple-500">
              <SelectValue placeholder="Select document format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="handwritten_scan">
                <div className="flex items-center">
                  <Scan className="h-4 w-4 mr-2" />
                  Scanned Handwritten Document
                </div>
              </SelectItem>
              <SelectItem value="handwritten_photo">
                <div className="flex items-center">
                  <Image className="h-4 w-4 mr-2" />
                  Photo of Handwritten Document
                </div>
              </SelectItem>
              <SelectItem value="existing_scan">
                <div className="flex items-center">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Existing Digital Scan
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scanningStage">Document Status *</Label>
          <Select value={scanningStage} onValueChange={(value: 'need_scanning' | 'already_scanned') => setScanningStage(value)}>
            <SelectTrigger className="focus:ring-2 focus:ring-purple-500">
              <SelectValue placeholder="Select document scanning status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="need_scanning">
                <div className="flex items-center">
                  <Camera className="h-4 w-4 mr-2 text-orange-500" />
                  <div>
                    <div className="font-medium">Need Scanning</div>
                    <div className="text-xs text-gray-500">Physical document that needs to be scanned first</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="already_scanned">
                <div className="flex items-center">
                  <Scan className="h-4 w-4 mr-2 text-green-500" />
                  <div>
                    <div className="font-medium">Already Scanned</div>
                    <div className="text-xs text-gray-500">Digital image ready for OCR processing</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {scanningStage === 'need_scanning' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start">
                <Camera className="h-4 w-4 text-orange-600 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="text-orange-800 font-medium">Scanning Required</p>
                  <p className="text-orange-700">
                    This document will be uploaded and prepared for the scanning stage. 
                    Ensure good lighting and clear image quality for best results.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {scanningStage === 'already_scanned' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start">
                <FileCheck className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="text-green-800 font-medium">Ready for Processing</p>
                  <p className="text-green-700">
                    Document will proceed directly to AI-powered OCR extraction.
                    Our advanced system will accurately extract medical text.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
            ${dragActive 
              ? 'border-purple-500 bg-purple-50 scale-105' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center mb-4 space-x-2">
              {scanningStage === 'need_scanning' ? (
                <Camera className="h-12 w-12 text-orange-500" />
              ) : (
                <Scan className="h-12 w-12 text-green-500" />
              )}
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {scanningStage === 'need_scanning' 
                ? 'Upload Document for Scanning Stage'
                : 'Upload Scanned Document for AI Processing'
              }
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {scanningStage === 'need_scanning'
                ? 'Physical document will be prepared for scanning stage'
                : 'Ready for enhanced AI-powered OCR extraction'
              }
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Supported: JPG, PNG, WebP • Max size: 20MB • Optimized for medical handwriting
            </p>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
              id="enhanced-file-upload"
              disabled={!isFormValid}
            />
            <Button 
              asChild 
              disabled={!isFormValid}
              className={`${
                scanningStage === 'need_scanning' 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              <label htmlFor="enhanced-file-upload" className="cursor-pointer">
                {scanningStage === 'need_scanning' ? (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Upload for Scanning
                  </>
                ) : (
                  <>
                    <Scan className="mr-2 h-4 w-4" />
                    Upload Scanned Document
                  </>
                )}
              </label>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUploadForm;
