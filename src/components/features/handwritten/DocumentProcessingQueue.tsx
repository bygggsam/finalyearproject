
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Brain, 
  CheckCircle2, 
  AlertCircle, 
  Eye,
  Download,
  Camera,
  FileCheck,
  Activity
} from 'lucide-react';

interface ProcessedDocument {
  id: string;
  fileName: string;
  patientName: string;
  documentType: string;
  inputFormat: string;
  uploadTime: Date;
  status: 'uploading' | 'processing' | 'completed' | 'error' | 'digitized';
  confidence?: number;
  ocrResult?: any;
  extractedData?: any;
  file?: File;
  progress?: number;
  processingTime?: number;
  imageUrl?: string;
  aiStructuredResult?: any;
  scanningStage?: 'need_scanning' | 'already_scanned';
}

interface DocumentProcessingQueueProps {
  documents: ProcessedDocument[];
  isProcessing: boolean;
  onRetryProcessing: (document: ProcessedDocument) => void;
}

const DocumentProcessingQueue: React.FC<DocumentProcessingQueueProps> = ({
  documents,
  isProcessing,
  onRetryProcessing
}) => {
  const { toast } = useToast();

  const handleViewDocument = (document: ProcessedDocument) => {
    if (document.ocrResult?.text) {
      const blob = new Blob([document.ocrResult.text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadResult = (document: ProcessedDocument) => {
    if (document.ocrResult?.text) {
      const enhancedContent = `ENHANCED MEDICAL DOCUMENT EXTRACTION
================================================

Patient: ${document.patientName}
Document Type: ${document.documentType}
Input Format: ${document.inputFormat}
Scanning Stage: ${document.scanningStage}
Processing Date: ${new Date().toLocaleDateString()}
Processing Method: ${document.ocrResult.method}
Confidence: ${document.confidence}%
Processing Time: ${document.processingTime}s

EXTRACTED TEXT:
${document.ocrResult.text}

STRUCTURED DATA:
${JSON.stringify(document.extractedData, null, 2)}

MEDICAL AI ANALYSIS:
${JSON.stringify(document.aiStructuredResult, null, 2)}
`;

      const blob = new Blob([enhancedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = window.document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `${document.patientName}_enhanced_${document.documentType}_${new Date().toISOString().split('T')[0]}.txt`;
      window.document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      window.document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(url);
      
      toast({
        title: '📥 Enhanced Download Complete',
        description: 'Complete medical data with AI analysis exported successfully.',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'processing':
        return <Brain className="h-4 w-4 text-purple-500 animate-spin" />;
      case 'digitized':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <FileCheck className="h-4 w-4 text-blue-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string, scanningStage?: string) => {
    switch (status) {
      case 'uploading':
        return <Badge className="bg-blue-100 text-blue-800">Uploading</Badge>;
      case 'processing':
        return <Badge className="bg-purple-100 text-purple-800">AI Processing</Badge>;
      case 'digitized':
        return <Badge className="bg-green-100 text-green-800">Digitized</Badge>;
      case 'completed':
        if (scanningStage === 'need_scanning') {
          return <Badge className="bg-orange-100 text-orange-800">Ready for Scanning</Badge>;
        }
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return null;
    }
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-5 w-5" />
          Enhanced Processing Queue ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.map((document) => (
            <div key={document.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0">
                  {getStatusIcon(document.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">{document.fileName}</p>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(document.status, document.scanningStage)}
                      {document.processingTime && (
                        <Badge variant="outline" className="text-xs">
                          {document.processingTime}s
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {document.patientName} • {document.documentType.replace('_', ' ')} • {document.inputFormat.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {document.uploadTime.toLocaleString()} • 
                    {document.scanningStage === 'need_scanning' ? ' Needs Scanning' : ' Already Scanned'}
                  </p>
                  
                  {document.status === 'processing' && (
                    <div className="mt-2">
                      <Progress value={document.progress || 0} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        🧠 Enhanced AI Processing... {Math.round(document.progress || 0)}%
                      </p>
                    </div>
                  )}
                  
                  {document.confidence && (
                    <div className="mt-2 flex items-center space-x-4">
                      <p className="text-xs text-gray-600">
                        AI Confidence: 
                        <span className={`ml-1 font-medium ${
                          document.confidence > 80 ? 'text-green-600' :
                          document.confidence > 60 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {document.confidence}%
                        </span>
                      </p>
                      <p className="text-xs text-purple-600">
                        🧠 Enhanced Processing Applied
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                {document.status === 'digitized' && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewDocument(document)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownloadResult(document)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </>
                )}
                {document.status === 'completed' && document.scanningStage === 'need_scanning' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: '📋 Ready for Scanning',
                        description: 'Document uploaded and ready for the scanning stage.',
                      });
                    }}
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Scan Ready
                  </Button>
                )}
                {document.status === 'error' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onRetryProcessing(document)}
                    disabled={isProcessing}
                  >
                    <Brain className="h-4 w-4 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentProcessingQueue;
