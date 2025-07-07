
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scan, Image, FileCheck } from 'lucide-react';

interface DocumentInfoFormProps {
  patientName: string;
  documentType: string;
  inputFormat: string;
  onPatientNameChange: (value: string) => void;
  onDocumentTypeChange: (value: string) => void;
  onInputFormatChange: (value: string) => void;
}

const DocumentInfoForm: React.FC<DocumentInfoFormProps> = ({
  patientName,
  documentType,
  inputFormat,
  onPatientNameChange,
  onDocumentTypeChange,
  onInputFormatChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="patientName">Patient Name *</Label>
        <Input
          id="patientName"
          placeholder="Enter patient full name"
          value={patientName}
          onChange={(e) => onPatientNameChange(e.target.value)}
          className="focus:ring-2 focus:ring-blue-500 w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="documentType">Document Type *</Label>
        <Select value={documentType} onValueChange={onDocumentTypeChange}>
          <SelectTrigger className="focus:ring-2 focus:ring-blue-500 w-full">
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="case_history">Case History Notes</SelectItem>
            <SelectItem value="consultation_notes">Consultation Notes</SelectItem>
            <SelectItem value="prescription">Handwritten Prescription</SelectItem>
            <SelectItem value="other">Other Medical Document</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="inputFormat">Input Format *</Label>
        <Select value={inputFormat} onValueChange={onInputFormatChange}>
          <SelectTrigger className="focus:ring-2 focus:ring-blue-500 w-full">
            <SelectValue placeholder="Select input format" />
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
    </div>
  );
};

export default DocumentInfoForm;
