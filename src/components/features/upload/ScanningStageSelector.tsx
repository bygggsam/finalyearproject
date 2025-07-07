
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scan, FileCheck, Camera } from 'lucide-react';

interface ScanningStageProps {
  scanningStage: string;
  onScanningStageChange: (value: string) => void;
}

const ScanningStageSelector: React.FC<ScanningStageProps> = ({
  scanningStage,
  onScanningStageChange,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="scanningStage">Document Status *</Label>
      <Select value={scanningStage} onValueChange={onScanningStageChange}>
        <SelectTrigger className="focus:ring-2 focus:ring-blue-500 w-full">
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
                This document will go through scanning stage first before OCR processing.
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
  );
};

export default ScanningStageSelector;
