
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Cpu, Sparkles, Scan, Camera } from 'lucide-react';

interface FileUploadZoneProps {
  dragActive: boolean;
  disabled: boolean;
  scanningStage: string;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (files: FileList) => void;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  dragActive,
  disabled,
  scanningStage,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUploadText = () => {
    if (scanningStage === 'need_scanning') {
      return {
        title: 'Upload Document for Scanning',
        subtitle: 'Physical document will be prepared for scanning stage',
        icon: <Camera className="h-8 w-8 sm:h-10 sm:w-10 text-orange-500" />
      };
    }
    return {
      title: 'Upload Scanned Medical Document',
      subtitle: 'Ready for AI-powered OCR extraction',
      icon: <Scan className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
    };
  };

  const uploadInfo = getUploadText();

  return (
    <div
      className={`
        border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-all duration-300
        ${dragActive 
          ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' 
          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }
      `}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center mb-4 space-x-2">
          {uploadInfo.icon}
          <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
        </div>
        <p className="text-base sm:text-lg font-medium text-gray-900 mb-2">
          {uploadInfo.title}
        </p>
        <p className="text-xs sm:text-sm text-gray-600 mb-4 max-w-md">
          {uploadInfo.subtitle}
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Supports: JPG, PNG, WebP, PDF • Max: 20MB • Medical Document Optimized
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={(e) => e.target.files && onFileSelect(e.target.files)}
          className="hidden"
          id="medical-doc-upload"
          disabled={disabled}
        />
        <Button 
          asChild 
          disabled={disabled}
          className={`font-medium px-4 py-2 sm:px-6 sm:py-3 ${
            scanningStage === 'need_scanning' 
              ? 'bg-orange-600 hover:bg-orange-700' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          <label htmlFor="medical-doc-upload" className="cursor-pointer">
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
  );
};

export default FileUploadZone;
