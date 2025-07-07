import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDocumentStore } from '@/stores/documentStore';
import { 
  FileText, 
  Camera, 
  Scan, 
  Zap, 
  FileCheck, 
  CheckCircle2,
  ArrowRight,
  Clock,
  AlertCircle,
  Activity,
  RefreshCw
} from 'lucide-react';

interface StageData {
  completed: boolean;
  timestamp?: Date;
  notes?: string;
}

interface DigitizedStageData extends StageData {
  confidence?: number;
}

interface StageDocument {
  id: string;
  patientName: string;
  documentType: string;
  currentStage: 'handwritten' | 'scanned' | 'digitized' | 'formatted' | 'completed';
  stages: {
    handwritten: StageData;
    scanned: StageData;
    digitized: DigitizedStageData;
    formatted: StageData;
    completed: StageData;
  };
  overallProgress: number;
  fileName?: string;
  inputFormat?: string;
  uploadDate: Date;
}

const StageTracker = () => {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { documents, loadDocuments, isLoading } = useDocumentStore();

  useEffect(() => {
    const loadData = async () => {
      await loadDocuments();
      setLastUpdate(new Date());
    };

    loadData();
    
    // Set up real-time updates every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadDocuments]);

  const processedDocuments: StageDocument[] = documents.map(doc => {
    const currentStage = determineCurrentStage(doc);
    
    return {
      id: doc.id,
      patientName: doc.patientName,
      documentType: doc.documentType,
      currentStage,
      stages: {
        handwritten: { 
          completed: true, 
          timestamp: doc.uploadTime,
          notes: 'Original document received'
        },
        scanned: { 
          completed: !!doc.fileUrl, 
          timestamp: doc.fileUrl ? doc.uploadTime : undefined,
          notes: doc.fileName ? `Scanned as ${doc.fileName}` : undefined
        },
        digitized: { 
          completed: !!doc.rawOcrText, 
          timestamp: doc.rawOcrText ? new Date() : undefined,
          confidence: doc.confidence,
          notes: doc.rawOcrText ? 'OCR processing completed' : undefined
        },
        formatted: { 
          completed: doc.status === 'completed' && !!doc.extractedData, 
          timestamp: doc.status === 'completed' ? new Date() : undefined,
          notes: doc.extractedData ? 'Document structured and formatted' : undefined
        },
        completed: { 
          completed: doc.status === 'completed', 
          timestamp: doc.status === 'completed' ? new Date() : undefined,
          notes: doc.status === 'completed' ? 'Ready for electronic health record integration' : undefined
        }
      },
      overallProgress: calculateProgress(doc),
      fileName: doc.fileName,
      inputFormat: doc.documentType,
      uploadDate: doc.uploadTime
    };
  });

  const determineCurrentStage = (doc: any): StageDocument['currentStage'] => {
    if (doc.status === 'completed') return 'completed';
    if (doc.extractedData) return 'formatted';
    if (doc.rawOcrText) return 'digitized';
    if (doc.fileUrl) return 'scanned';
    return 'handwritten';
  };

  const calculateProgress = (doc: any): number => {
    let progress = 0;
    if (doc.uploadTime) progress += 20; // Handwritten
    if (doc.fileUrl) progress += 20; // Scanned
    if (doc.rawOcrText) progress += 30; // Digitized
    if (doc.extractedData) progress += 20; // Formatted
    if (doc.status === 'completed') progress += 10; // Completed
    return Math.min(progress, 100);
  };

  const handleRefresh = async () => {
    await loadDocuments(true);
    setLastUpdate(new Date());
  };

  const getStageIcon = (stage: string, completed: boolean) => {
    const iconClass = completed ? 'text-green-600' : 'text-gray-400';
    
    switch (stage) {
      case 'handwritten':
        return <FileText className={`h-5 w-5 ${iconClass}`} />;
      case 'scanned':
        return <Scan className={`h-5 w-5 ${iconClass}`} />;
      case 'digitized':
        return <Zap className={`h-5 w-5 ${iconClass}`} />;
      case 'formatted':
        return <FileCheck className={`h-5 w-5 ${iconClass}`} />;
      case 'completed':
        return <CheckCircle2 className={`h-5 w-5 ${iconClass}`} />;
      default:
        return <Clock className={`h-5 w-5 ${iconClass}`} />;
    }
  };

  const getStageName = (stage: string) => {
    switch (stage) {
      case 'handwritten':
        return 'Document Upload';
      case 'scanned':
        return 'File Storage';
      case 'digitized':
        return 'OCR Processing';
      case 'formatted':
        return 'Data Extraction';
      case 'completed':
        return 'Ready for Use';
      default:
        return stage;
    }
  };

  const selectedDocument = processedDocuments.find(doc => doc.id === selectedDoc);
  const pendingDocs = processedDocuments.filter(doc => doc.currentStage !== 'completed').length;
  const completedDocs = processedDocuments.filter(doc => doc.currentStage === 'completed').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Activity className="mr-3 h-8 w-8 text-blue-500" />
            Real-Time Document Pipeline
          </h1>
          <p className="text-gray-600 mt-2">Live monitoring from Supabase database</p>
          <p className="text-sm text-gray-500">Last updated: {lastUpdate.toLocaleTimeString()}</p>
        </div>
        <div className="flex space-x-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{processedDocuments.length}</p>
            <p className="text-sm text-gray-500">Total Documents</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{pendingDocs}</p>
            <p className="text-sm text-gray-500">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{completedDocs}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {processedDocuments.length === 0 && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            No documents found in the Supabase database. Upload documents to see them tracked here in real-time.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Database Queue
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {processedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedDoc === doc.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedDoc(doc.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">{doc.patientName}</p>
                    <Badge className={`${
                      doc.currentStage === 'completed' ? 'bg-green-100 text-green-800' :
                      doc.currentStage === 'formatted' ? 'bg-blue-100 text-blue-800' :
                      doc.currentStage === 'digitized' ? 'bg-purple-100 text-purple-800' :
                      doc.currentStage === 'scanned' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {doc.currentStage}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{doc.documentType.replace('_', ' ')}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{doc.overallProgress}%</span>
                    </div>
                    <Progress value={doc.overallProgress} className="h-1" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {doc.uploadDate.toLocaleDateString()}
                  </p>
                  {doc.stages.digitized.confidence && (
                    <p className="text-xs text-purple-600 mt-1">
                      Confidence: {doc.stages.digitized.confidence}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stage Details */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowRight className="mr-2 h-5 w-5" />
              Live Workflow Stages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDocument ? (
              <div className="space-y-6">
                {/* Progress Overview */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">{selectedDocument.patientName}</h3>
                    <Badge className={`${
                      selectedDocument.currentStage === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedDocument.currentStage === 'formatted' ? 'bg-blue-100 text-blue-800' :
                      selectedDocument.currentStage === 'digitized' ? 'bg-purple-100 text-purple-800' :
                      selectedDocument.currentStage === 'scanned' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedDocument.currentStage.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {selectedDocument.documentType.replace('_', ' ')} • Progress: {selectedDocument.overallProgress}%
                  </p>
                  <Progress value={selectedDocument.overallProgress} className="h-3" />
                </div>

                {/* Stage Timeline */}
                <div className="space-y-4">
                  {Object.entries(selectedDocument.stages).map(([stageName, stageData], index) => (
                    <div key={stageName} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getStageIcon(stageName, stageData.completed)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium ${
                            stageData.completed ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {getStageName(stageName)}
                          </h4>
                          {stageData.completed && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        
                        {stageData.timestamp && (
                          <p className="text-xs text-gray-500 mt-1">
                            Completed: {stageData.timestamp.toLocaleString()}
                          </p>
                        )}
                        
                        {stageData.notes && (
                          <p className="text-xs text-blue-600 mt-1">
                            {stageData.notes}
                          </p>
                        )}
                        
                        {stageName === 'digitized' && 'confidence' in stageData && stageData.confidence && (
                          <p className="text-xs text-purple-600 mt-1">
                            OCR Confidence: {stageData.confidence}%
                          </p>
                        )}
                      </div>
                      
                      {index < Object.entries(selectedDocument.stages).length - 1 && (
                        <div className="flex-shrink-0 w-px h-8 bg-gray-300 ml-2"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Next Steps */}
                <div className={`border rounded-lg p-4 ${
                  selectedDocument.currentStage === 'completed' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center mb-2">
                    {selectedDocument.currentStage === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                    )}
                    <h4 className={`text-sm font-medium ${
                      selectedDocument.currentStage === 'completed' 
                        ? 'text-green-800' 
                        : 'text-yellow-800'
                    }`}>
                      {selectedDocument.currentStage === 'completed' ? 'Processing Complete' : 'Current Status'}
                    </h4>
                  </div>
                  <p className={`text-sm ${
                    selectedDocument.currentStage === 'completed' 
                      ? 'text-green-700' 
                      : 'text-yellow-700'
                  }`}>
                    {selectedDocument.currentStage === 'handwritten' && 'Document uploaded and ready for processing'}
                    {selectedDocument.currentStage === 'scanned' && 'File stored in Supabase - ready for OCR processing'}
                    {selectedDocument.currentStage === 'digitized' && 'OCR completed - ready for data extraction'}
                    {selectedDocument.currentStage === 'formatted' && 'Data extracted - ready for final processing'}
                    {selectedDocument.currentStage === 'completed' && 'Document fully processed and available in the database'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Select a document to view real-time processing stages</p>
                <p className="text-sm text-gray-500 mt-2">
                  Live data from Supabase database
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StageTracker;
