import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download,
  Eye,
  RefreshCw,
  CheckCircle2,
  FileCheck,
  Copy,
  Image
} from 'lucide-react';

interface FormattedDocument {
  id: string;
  patientName: string;
  documentType: string;
  originalContent: string;
  structuredFormat: string;
  eFormatImage: string;
  status: 'formatting' | 'formatted' | 'reviewed';
  createdDate: Date;
  confidence?: number;
  medicalECopy?: any;
  structuredData?: any;
}

const DocumentFormatter = () => {
  const [documents, setDocuments] = useState<FormattedDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const { toast } = useToast();

  // Load documents from localStorage
  useEffect(() => {
    const loadDocuments = () => {
      try {
        // Load from both handwritten documents and real-time OCR documents
        const handwrittenDocs = JSON.parse(localStorage.getItem('handwrittenDocuments') || '[]');
        const realTimeOcrDocs = JSON.parse(localStorage.getItem('realTimeOcrDocuments') || '[]');
        
        console.log('📋 Loading documents from storage...');
        console.log('Handwritten docs:', handwrittenDocs.length);
        console.log('Real-time OCR docs:', realTimeOcrDocs.length);
        
        // Process handwritten documents
        const handwrittenFormatted = handwrittenDocs
          .filter((doc: any) => (doc.status === 'digitized' || doc.status === 'completed') && doc.ocrResult)
          .map((doc: any) => ({
            id: doc.id,
            patientName: doc.patientName || 'Unknown Patient',
            documentType: doc.documentType || 'unknown',
            originalContent: doc.ocrResult?.text || doc.ocrResult || 'No text extracted',
            structuredFormat: generateEnhancedStructuredFormat(doc),
            eFormatImage: generateEnhancedEFormatImage(doc),
            status: 'formatted' as const,
            createdDate: new Date(doc.uploadTime || doc.uploadDate || Date.now()),
            confidence: doc.ocrResult?.confidence || doc.confidence || 0,
            medicalECopy: doc.aiStructuredResult?.medicalECopy,
            structuredData: doc.ocrResult?.metadata?.structuredData
          }));

        // Process real-time OCR documents
        const realTimeFormatted = realTimeOcrDocs
          .filter((doc: any) => doc.status === 'completed' && doc.ocrResult)
          .map((doc: any) => ({
            id: doc.id,
            patientName: doc.patientName || 'Unknown Patient',
            documentType: doc.documentType || 'unknown',
            originalContent: doc.ocrResult || 'No text extracted',
            structuredFormat: generateEnhancedStructuredFormat(doc),
            eFormatImage: generateEnhancedEFormatImage(doc),
            status: 'formatted' as const,
            createdDate: new Date(doc.uploadTime || Date.now()),
            confidence: doc.confidence || 0,
            structuredData: doc.extractedData
          }));

        const allDocuments = [...handwrittenFormatted, ...realTimeFormatted];
        
        console.log('📋 Total formatted documents:', allDocuments.length);
        setDocuments(allDocuments);
        
        if (allDocuments.length > 0 && !selectedDoc) {
          setSelectedDoc(allDocuments[0].id);
        }
      } catch (error) {
        console.error('❌ Error loading documents:', error);
        toast({
          title: '❌ Error Loading Documents',
          description: 'Failed to load documents from storage',
          variant: 'destructive',
        });
      }
    };

    loadDocuments();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadDocuments();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Check every 3 seconds for new documents
    const interval = setInterval(loadDocuments, 3000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [selectedDoc, toast]);

  const generateEnhancedStructuredFormat = (doc: any) => {
    const medicalECopy = doc.aiStructuredResult?.medicalECopy;
    const structuredData = doc.ocrResult?.metadata?.structuredData || doc.extractedData;
    const ocrText = doc.ocrResult?.text || doc.ocrResult || '';
    
    let structuredFormat = `MEDICAL RECORD - ENHANCED STRUCTURED FORMAT
===============================================

DOCUMENT HEADER
===============================================
Patient Name: ${doc.patientName || 'Unknown'}
Document Type: ${(doc.documentType || 'unknown').replace('_', ' ').toUpperCase()}
Processing Date: ${new Date().toLocaleDateString()}
Medical Record Number: UHS-MRN-${Date.now()}
Facility: University Health Services, Jaja
OCR Confidence: ${doc.ocrResult?.confidence || doc.confidence || 0}%

`;

    // Add structured data if available
    if (structuredData) {
      if (structuredData.patientInfo) {
        structuredFormat += `PATIENT INFORMATION
===============================================
Name: ${structuredData.patientInfo.name || doc.patientName || 'Unknown'}
Age: ${structuredData.patientInfo.age || 'Not specified'}

`;
      }

      if (structuredData.medications && structuredData.medications.length > 0) {
        structuredFormat += `MEDICATIONS
===============================================
${structuredData.medications.map((med: string, index: number) => 
          `${index + 1}. ${med}`).join('\n')}

`;
      }

      if (structuredData.symptoms && structuredData.symptoms.length > 0) {
        structuredFormat += `SYMPTOMS
===============================================
${structuredData.symptoms.join(', ')}

`;
      }

      if (structuredData.vitals && Object.keys(structuredData.vitals).length > 0) {
        structuredFormat += `VITAL SIGNS
===============================================
${Object.entries(structuredData.vitals)
          .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`)
          .join('\n')}

`;
      }

      if (structuredData.diagnosis && structuredData.diagnosis.length > 0) {
        structuredFormat += `DIAGNOSIS
===============================================
${structuredData.diagnosis.join('; ')}

`;
      }

      if (structuredData.dates && structuredData.dates.length > 0) {
        structuredFormat += `IMPORTANT DATES
===============================================
${structuredData.dates.join(', ')}

`;
      }

      if (structuredData.addresses && structuredData.addresses.length > 0) {
        structuredFormat += `ADDRESSES
===============================================
${structuredData.addresses.join('\n')}

`;
      }

      if (structuredData.phoneNumbers && structuredData.phoneNumbers.length > 0) {
        structuredFormat += `CONTACT INFORMATION
===============================================
${structuredData.phoneNumbers.join(', ')}

`;
      }
    }

    // Add original extracted text
    structuredFormat += `ORIGINAL EXTRACTED TEXT
===============================================
${ocrText}

`;

    // Add medical terms found
    if (doc.ocrResult?.metadata?.medicalTermsFound) {
      structuredFormat += `MEDICAL TERMS IDENTIFIED
===============================================
${doc.ocrResult.metadata.medicalTermsFound.join(', ')}

`;
    }

    structuredFormat += `PROCESSING SUMMARY
===============================================
Processing Method: ${doc.ocrResult?.method || 'Standard OCR'}
Processing Time: ${doc.ocrResult?.processingTime || 0} seconds
Word Count: ${doc.ocrResult?.metadata?.wordCount || 0}
Character Count: ${doc.ocrResult?.metadata?.characterCount || 0}
Medical Accuracy: ${doc.ocrResult?.metadata?.medicalAccuracy || 0}%

===============================================
END OF MEDICAL RECORD
===============================================`;

    return structuredFormat;
  };

  const generateEnhancedEFormatImage = (doc: any): string => {
    console.log('🖼️ Generating enhanced e-format image representation...');
    
    const canvas = document.createElement('canvas');
    canvas.width = 850;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d')!;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Header with UHS branding
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 100);
    gradient.addColorStop(0, '#1e40af');
    gradient.addColorStop(1, '#3b82f6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 100);
    
    // UHS Logo area
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 20, 60, 60);
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('UHS', 35, 55);
    
    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('UNIVERSITY HEALTH SERVICES', 100, 40);
    ctx.font = '18px Arial';
    ctx.fillText('Enhanced Medical E-Copy System', 100, 65);
    ctx.font = '14px Arial';
    ctx.fillText('Jaja, Nigeria - Advanced OCR Extraction', 100, 85);
    
    let yPos = 130;
    
    const structuredData = doc.ocrResult?.metadata?.structuredData || doc.extractedData;
    const medicalECopy = doc.aiStructuredResult?.medicalECopy;
    const ocrText = doc.ocrResult?.text || doc.ocrResult || '';
    
    // Document header section
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(20, yPos - 5, canvas.width - 40, 3);
    yPos += 15;
    
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('MEDICAL RECORD', 20, yPos);
    yPos += 30;
    
    ctx.font = '14px Arial';
    ctx.fillText(`Patient: ${doc.patientName || 'Unknown Patient'}`, 20, yPos);
    yPos += 25;
    ctx.fillText(`Document Type: ${(doc.documentType || 'unknown').replace('_', ' ')}`, 20, yPos);
    yPos += 25;
    ctx.fillText(`Processing Date: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 25;
    ctx.fillText(`OCR Confidence: ${doc.ocrResult?.confidence || doc.confidence || 0}%`, 20, yPos);
    yPos += 40;
    
    // Patient Information Section
    if (structuredData?.patientInfo) {
      ctx.fillStyle = '#059669';
      ctx.fillRect(20, yPos - 5, canvas.width - 40, 3);
      yPos += 15;
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('PATIENT INFORMATION', 20, yPos);
      yPos += 25;
      
      ctx.font = '13px Arial';
      if (structuredData.patientInfo.name) {
        ctx.fillText(`• Name: ${structuredData.patientInfo.name}`, 30, yPos);
        yPos += 20;
      }
      if (structuredData.patientInfo.age) {
        ctx.fillText(`• Age: ${structuredData.patientInfo.age} years`, 30, yPos);
        yPos += 20;
      }
      yPos += 15;
    }
    
    // Medications Section
    if (structuredData?.medications && structuredData.medications.length > 0) {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(20, yPos - 5, canvas.width - 40, 3);
      yPos += 15;
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('MEDICATIONS', 20, yPos);
      yPos += 25;
      
      ctx.font = '13px Arial';
      structuredData.medications.forEach((med: string) => {
        ctx.fillText(`• ${med}`, 30, yPos);
        yPos += 20;
      });
      yPos += 15;
    }
    
    // Symptoms Section
    if (structuredData?.symptoms && structuredData.symptoms.length > 0) {
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(20, yPos - 5, canvas.width - 40, 3);
      yPos += 15;
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('SYMPTOMS', 20, yPos);
      yPos += 25;
      
      ctx.font = '13px Arial';
      structuredData.symptoms.forEach((symptom: string) => {
        ctx.fillText(`• ${symptom}`, 30, yPos);
        yPos += 20;
      });
      yPos += 15;
    }
    
    // Vital Signs Section
    if (structuredData?.vitals && Object.keys(structuredData.vitals).length > 0) {
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(20, yPos - 5, canvas.width - 40, 3);
      yPos += 15;
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('VITAL SIGNS', 20, yPos);
      yPos += 25;
      
      ctx.font = '13px Arial';
      Object.entries(structuredData.vitals).forEach(([key, value]) => {
        ctx.fillText(`• ${key.replace(/([A-Z])/g, ' $1')}: ${value}`, 30, yPos);
        yPos += 20;
      });
      yPos += 15;
    }
    
    // Diagnosis Section
    if (structuredData?.diagnosis && structuredData.diagnosis.length > 0) {
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(20, yPos - 5, canvas.width - 40, 3);
      yPos += 15;
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('DIAGNOSIS', 20, yPos);
      yPos += 25;
      
      ctx.font = '13px Arial';
      structuredData.diagnosis.forEach((diag: string) => {
        const words = diag.split(' ');
        let line = '';
        for (let word of words) {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > canvas.width - 60 && line !== '') {
            ctx.fillText(`• ${line}`, 30, yPos);
            line = word + ' ';
            yPos += 18;
          } else {
            line = testLine;
          }
        }
        if (line.trim()) {
          ctx.fillText(`• ${line}`, 30, yPos);
          yPos += 18;
        }
      });
      yPos += 15;
    }
    
    // Original Text Section (always include for completeness)
    if (ocrText && yPos < canvas.height - 100) {
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(20, yPos - 5, canvas.width - 40, 3);
      yPos += 15;
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('EXTRACTED TEXT CONTENT', 20, yPos);
      yPos += 25;
      
      ctx.font = '11px Arial';
      const words = ocrText.split(' ');
      let line = '';
      for (let word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > canvas.width - 60 && line !== '') {
          ctx.fillText(line, 30, yPos);
          line = word + ' ';
          yPos += 15;
          if (yPos > canvas.height - 80) break; // Prevent overflow
        } else {
          line = testLine;
        }
      }
      if (line.trim() && yPos < canvas.height - 80) {
        ctx.fillText(line, 30, yPos);
        yPos += 20;
      }
    }
    
    // Footer
    const footerY = canvas.height - 70;
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, footerY, canvas.width, 70);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('University Health Services (UHS) - Enhanced Digital Medical Record System', 20, footerY + 25);
    ctx.font = '12px Arial';
    ctx.fillText(`Generated: ${new Date().toLocaleString()}`, 20, footerY + 45);
    ctx.fillText(`OCR Method: ${doc.ocrResult?.method || 'Standard'} | Confidence: ${doc.ocrResult?.confidence || doc.confidence || 0}%`, 400, footerY + 45);
    
    return canvas.toDataURL('image/png', 0.95);
  };
  
  const selectedDocument = documents.find(doc => doc.id === selectedDoc);

  const handleDownload = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: '📥 Download Complete',
      description: `${filename} has been downloaded successfully.`,
    });
  };

  const handleDownloadImage = (imageDataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = imageDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: '📥 Image Downloaded',
      description: `${filename} has been downloaded successfully.`,
    });
  };

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: '📋 Copied to Clipboard',
      description: 'Content has been copied to your clipboard.',
    });
  };

  const handleRefresh = () => {
    window.location.reload();
    toast({
      title: '🔄 Refreshing',
      description: 'Reloading documents from storage...',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
              <FileCheck className="mr-2 md:mr-3 h-6 w-6 md:h-8 md:w-8 text-green-500" />
              Enhanced Document Formatter
            </h1>
            <p className="text-gray-600 mt-2">Advanced medical document structuring and formatting with complete data extraction</p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-xl md:text-2xl font-bold text-green-600">{documents.length}</p>
            <p className="text-sm text-gray-500">Enhanced Formats</p>
          </div>
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No formatted documents available</p>
              <p className="text-sm text-gray-500 mb-4">
                Process documents in the Handwritten Digitizer or Document Upload first
              </p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Document List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="mr-2 h-5 w-5" />
                    Documents
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedDoc === doc.id
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => setSelectedDoc(doc.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.patientName}</p>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Enhanced
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{doc.documentType.replace('_', ' ')}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">{doc.createdDate.toLocaleDateString()}</p>
                        {doc.confidence && (
                          <p className="text-xs text-green-600">{doc.confidence}%</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Format Viewer */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileCheck className="mr-2 h-5 w-5" />
                    <span>Enhanced Format Viewer</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDocument ? (
                  <Tabs defaultValue="structured" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="structured">Enhanced Structured</TabsTrigger>
                      <TabsTrigger value="eformat">Enhanced E-Format</TabsTrigger>
                      <TabsTrigger value="original">Original Extract</TabsTrigger>
                    </TabsList>

                    <TabsContent value="structured" className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-700">Enhanced Structured Medical Document</h4>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCopyToClipboard(selectedDocument.structuredFormat)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleDownload(
                              selectedDocument.structuredFormat, 
                              `${selectedDocument.patientName}_enhanced_structured_${new Date().toISOString().split('T')[0]}.txt`,
                              'text/plain'
                            )}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded border h-96 overflow-y-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {selectedDocument.structuredFormat}
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="eformat" className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-700">Enhanced E-Format Medical Record Image</h4>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleDownloadImage(
                              selectedDocument.eFormatImage, 
                              `${selectedDocument.patientName}_enhanced_eformat_${new Date().toISOString().split('T')[0]}.png`
                            )}
                          >
                            <Image className="h-4 w-4 mr-1" />
                            Download Image
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded border h-96 overflow-y-auto flex justify-center">
                        <img 
                          src={selectedDocument.eFormatImage} 
                          alt="Enhanced E-Format Medical Record"
                          className="max-w-full h-auto border rounded shadow-sm"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="original" className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-700">Original Extracted Content</h4>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCopyToClipboard(selectedDocument.originalContent)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="p-4 bg-gray-50 rounded border h-96 overflow-y-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {selectedDocument.originalContent}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-12">
                    <FileCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Select a document to view enhanced formatted output</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentFormatter;
