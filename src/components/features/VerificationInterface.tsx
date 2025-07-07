
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentStore } from '@/stores/documentStore';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Edit,
  Save,
  RefreshCw,
  Database
} from 'lucide-react';

interface DocumentToVerify {
  id: string;
  patientName: string;
  documentType: string;
  uploadDate: string;
  confidence: number;
  status: 'needs_review' | 'auto_approved' | 'rejected' | 'approved';
  rawOcr: string;
  structuredData: any;
  validationIssues: any[];
  processingTime: number;
}

const VerificationInterface = () => {
  const [documents, setDocuments] = useState<DocumentToVerify[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentToVerify | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { loadDocuments } = useDocumentStore();

  useEffect(() => {
    loadDocumentsForVerification();
  }, []);

  const loadDocumentsForVerification = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .in('status', ['processing', 'digitized', 'completed'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        toast({
          title: '❌ Error Loading Documents',
          description: 'Failed to load documents for verification',
          variant: 'destructive'
        });
        return;
      }

      const formattedDocs: DocumentToVerify[] = data.map(doc => {
        const ocrResult = doc.ocr_result as { text?: string } | null;
        return {
          id: doc.id,
          patientName: doc.patient_name,
          documentType: doc.document_type,
          uploadDate: new Date(doc.upload_date).toLocaleDateString(),
          confidence: doc.confidence_score || 0,
          status: doc.status === 'completed' ? 'approved' as const : 'needs_review' as const,
          rawOcr: ocrResult?.text || '',
          structuredData: doc.ai_structured_result || {},
          validationIssues: [],
          processingTime: doc.processing_time || 0
        };
      });

      setDocuments(formattedDocs);
      console.log('Loaded documents for verification:', formattedDocs.length);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to load documents',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentSelect = (doc: DocumentToVerify) => {
    setSelectedDocument(doc);
    setEditedData(JSON.stringify(doc.structuredData, null, 2));
    setIsEditing(false);
  };

  const handleApprove = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', docId);

      if (error) {
        console.error('Error approving document:', error);
        toast({
          title: '❌ Approval Failed',
          description: 'Failed to approve document',
          variant: 'destructive'
        });
        return;
      }

      setDocuments(prev => prev.map(doc => 
        doc.id === docId ? { ...doc, status: 'approved' as const } : doc
      ));

      toast({
        title: '✅ Document Approved',
        description: 'Document has been approved and saved to database',
      });

      // Reload documents to refresh the list
      await loadDocumentsForVerification();
    } catch (error) {
      console.error('Error approving document:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to approve document',
        variant: 'destructive'
      });
    }
  };

  const handleReject = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', docId);

      if (error) {
        console.error('Error rejecting document:', error);
        toast({
          title: '❌ Rejection Failed',
          description: 'Failed to reject document',
          variant: 'destructive'
        });
        return;
      }

      setDocuments(prev => prev.map(doc => 
        doc.id === docId ? { ...doc, status: 'rejected' as const } : doc
      ));

      toast({
        title: '🚫 Document Rejected',
        description: 'Document has been rejected',
      });

      // Reload documents to refresh the list
      await loadDocumentsForVerification();
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to reject document',
        variant: 'destructive'
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedDocument) return;

    try {
      const parsedData = JSON.parse(editedData);
      
      const { error } = await supabase
        .from('documents')
        .update({
          ai_structured_result: parsedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDocument.id);

      if (error) {
        console.error('Error saving edited data:', error);
        toast({
          title: '❌ Save Failed',
          description: 'Failed to save changes',
          variant: 'destructive'
        });
        return;
      }

      setSelectedDocument(prev => prev ? { ...prev, structuredData: parsedData } : null);
      setDocuments(prev => prev.map(doc => 
        doc.id === selectedDocument.id ? { ...doc, structuredData: parsedData } : doc
      ));
      setIsEditing(false);

      toast({
        title: '✅ Changes Saved',
        description: 'Document data has been updated successfully',
      });
    } catch (error) {
      console.error('Error parsing JSON:', error);
      toast({
        title: '❌ Invalid JSON',
        description: 'Please check your JSON format',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      needs_review: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Needs Review' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      auto_approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Auto-Approved' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-2">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Verification</h1>
          <p className="text-gray-600 mt-2">Review and verify processed medical documents</p>
        </div>
        <Button onClick={loadDocumentsForVerification} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Documents to Verify ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {documents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No documents available for verification</p>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedDocument?.id === doc.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleDocumentSelect(doc)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{doc.patientName}</h3>
                      {getStatusBadge(doc.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{doc.documentType}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{doc.uploadDate}</span>
                      <span>Confidence: {doc.confidence}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Document Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Document Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDocument ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Patient:</span>
                    <p className="text-gray-600">{selectedDocument.patientName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>
                    <p className="text-gray-600">{selectedDocument.documentType}</p>
                  </div>
                  <div>
                    <span className="font-medium">Upload Date:</span>
                    <p className="text-gray-600">{selectedDocument.uploadDate}</p>
                  </div>
                  <div>
                    <span className="font-medium">Confidence:</span>
                    <p className="text-gray-600">{selectedDocument.confidence}%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Structured Data:</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedData}
                        onChange={(e) => setEditedData(e.target.value)}
                        className="min-h-32 font-mono text-sm"
                        placeholder="Edit JSON data..."
                      />
                      <Button onClick={handleSaveEdit} size="sm">
                        <Save className="h-4 w-4 mr-1" />
                        Save Changes
                      </Button>
                    </div>
                  ) : (
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedDocument.structuredData, null, 2)}
                    </pre>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleApprove(selectedDocument.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={selectedDocument.status === 'approved'}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(selectedDocument.id)}
                    variant="destructive"
                    className="flex-1"
                    disabled={selectedDocument.status === 'rejected'}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Select a document to view details</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerificationInterface;
