
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Edit, 
  Save, 
  Download, 
  Printer, 
  Copy,
  Eye,
  X,
  FileText,
  Hospital,
  Database
} from 'lucide-react';

interface MedicalRecordViewerProps {
  content: string;
  patientName?: string;
  documentId?: string;
  onSave?: (editedContent: string) => void;
}

const MedicalRecordViewer: React.FC<MedicalRecordViewerProps> = ({
  content,
  patientName = 'Patient',
  documentId,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Save to Supabase if documentId is provided
      if (documentId) {
        const { error } = await supabase
          .from('documents')
          .update({
            formatted_text: editedContent,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);

        if (error) {
          throw error;
        }

        toast({
          title: '✅ Medical Record Updated',
          description: 'Record has been saved to Supabase database successfully.',
        });
      }

      // Call parent callback if provided
      if (onSave) {
        onSave(editedContent);
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving record:', error);
      toast({
        title: '❌ Save Failed',
        description: 'Failed to save changes to database. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleDownload = () => {
    const filename = `UHS_${patientName.replace(/\s+/g, '_')}_medical_record_${new Date().toISOString().split('T')[0]}.txt`;
    const blob = new Blob([isEditing ? editedContent : content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: '📥 UHS Record Downloaded',
      description: `Medical record exported as: ${filename}`,
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>UHS Medical Record - ${patientName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .content { white-space: pre-wrap; font-size: 12px; line-height: 1.4; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>University Health Services (UHS)</h1>
              <h2>Digital Medical Record</h2>
              <p>Patient: ${patientName}</p>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
            <div class="content">${isEditing ? editedContent : content}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    
    toast({
      title: '🖨️ UHS Print Ready',
      description: 'Medical record formatted for clinical printing.',
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(isEditing ? editedContent : content);
      toast({
        title: '📋 Copied to Clipboard',
        description: 'UHS digital record ready for EHR integration.',
      });
    } catch (error) {
      toast({
        title: '❌ Copy Failed',
        description: 'Unable to copy medical record content.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full shadow-lg border-2 border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <Hospital className="mr-2 h-6 w-6 text-blue-600" />
            <div>
              <CardTitle className="text-lg sm:text-xl text-blue-800">
                UHS Digital Medical Record
              </CardTitle>
              <p className="text-sm text-blue-600 mt-1 flex items-center">
                <Database className="h-3 w-3 mr-1" />
                University Health Services - Supabase Connected
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {!isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="flex-1 sm:flex-none"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Copy</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrint}
                  className="flex-1 sm:flex-none"
                >
                  <Printer className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownload}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 sm:flex-none"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save to DB'}
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            {isEditing ? (
              <span className="flex items-center">
                <Edit className="h-4 w-4 mr-1" />
                <strong>Editing Mode:</strong> Changes will be saved to Supabase database
              </span>
            ) : (
              <span className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                <strong>Real-time View:</strong> Connected to live Supabase database
              </span>
            )}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-blue-600 mb-4">
              <FileText className="h-4 w-4" />
              <span>Editing UHS Medical Record - Will sync to database</span>
            </div>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-96 font-mono text-sm leading-relaxed border-2 border-blue-200 focus:border-blue-400 resize-none"
              placeholder="Edit the medical record content..."
              disabled={isSaving}
            />
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
              <strong>Database Integration:</strong> Changes will be saved to your Supabase database 
              and synchronized across all connected applications in real-time.
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-gray-200 p-4 sm:p-6">
            <div className="max-h-96 sm:max-h-[500px] overflow-y-auto">
              <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap text-gray-800 leading-relaxed">
                {content}
              </pre>
            </div>
            
            {/* Digital Signature Footer */}
            <div className="mt-6 pt-4 border-t-2 border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-blue-600">
                <span className="flex items-center">
                  <Hospital className="h-3 w-3 mr-1" />
                  University Health Services (UHS) - Digital Medical Record
                </span>
                <span className="flex items-center">
                  <Database className="h-3 w-3 mr-1" />
                  Supabase Connected: {new Date().toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicalRecordViewer;
