
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  User, 
  FileText, 
  Calendar,
  AlertTriangle,
  Heart,
  Activity,
  Pill,
  TestTube,
  RefreshCw
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  contact_info?: any;
  medical_history?: any;
  created_at: string;
  created_by?: string;
}

interface Document {
  id: string;
  patient_name: string;
  document_type: string;
  status: string;
  confidence_score?: number;
  upload_date: string;
  file_name: string;
}

const PatientRecords = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load patients from Supabase
  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading patients:', error);
        toast({
          title: '❌ Error Loading Patients',
          description: 'Failed to load patient records from database.',
          variant: 'destructive',
        });
        return;
      }

      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load documents for selected patient
  const loadDocuments = async (patientName: string) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('patient_name', patientName)
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  useEffect(() => {
    loadPatients();

    // Set up real-time subscription for patients
    const channel = supabase
      .channel('patients_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients'
        },
        () => {
          loadPatients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      const patient = patients.find(p => p.id === selectedPatient);
      if (patient) {
        loadDocuments(patient.name);
      }
    }
  }, [selectedPatient, patients]);

  const getRiskBadge = (patientId: string) => {
    const docCount = documents.length;
    if (docCount > 10) return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
    if (docCount > 5) return <Badge className="bg-orange-100 text-orange-800">Medium Risk</Badge>;
    return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
  };

  const getStatusBadge = (patientId: string) => {
    const recentDocs = documents.filter(doc => {
      const docDate = new Date(doc.upload_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return docDate > weekAgo;
    });

    if (recentDocs.length > 0) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
  };

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPatientData = patients.find(p => p.id === selectedPatient);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Records</h1>
          <p className="text-gray-600 mt-2">Real-time patient medical records from Supabase database</p>
        </div>
        <Button variant="outline" onClick={loadPatients}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {patients.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No patients found in the database</p>
            <p className="text-sm text-gray-500 mt-2">
              Create patients through document upload or add them manually
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Patients ({filteredPatients.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPatient === patient.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPatient(patient.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    {getStatusBadge(patient.id)}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">ID: {patient.id.slice(0, 8)}...</p>
                    {getRiskBadge(patient.id)}
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>{patient.age ? `${patient.age} years` : 'Age not specified'} • {patient.gender || 'Gender not specified'}</p>
                    <p>Created: {new Date(patient.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patient Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Patient Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPatientData ? (
              <div className="space-y-6">
                {/* Patient Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedPatientData.name}</h2>
                    <p className="text-gray-600">
                      {selectedPatientData.age ? `${selectedPatientData.age} years` : 'Age not specified'} • 
                      {selectedPatientData.gender || 'Gender not specified'}
                    </p>
                  </div>
                  <div className="text-right">
                    {getRiskBadge(selectedPatientData.id)}
                    <p className="text-sm text-gray-500 mt-1">
                      Created: {new Date(selectedPatientData.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Patient Information Tabs */}
                <Tabs defaultValue="documents" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
                    <TabsTrigger value="info">Patient Info</TabsTrigger>
                    <TabsTrigger value="history">Medical History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="documents" className="space-y-4">
                    {documents.length > 0 ? (
                      documents.map((doc, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <TestTube className="h-5 w-5 text-teal-600 mr-3" />
                              <div>
                                <p className="font-medium text-gray-900">{doc.document_type.replace('_', ' ')}</p>
                                <p className="text-sm text-gray-600">File: {doc.file_name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">{new Date(doc.upload_date).toLocaleDateString()}</p>
                              <Badge className={`mt-1 ${
                                doc.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                              }`}>
                                {doc.status}
                              </Badge>
                              {doc.confidence_score && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Confidence: {doc.confidence_score}%
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-600">No documents found for this patient</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="info" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Patient ID</p>
                        <p className="text-lg font-bold text-blue-900">{selectedPatientData.id}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Name</p>
                        <p className="text-lg font-bold text-green-900">{selectedPatientData.name}</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Age</p>
                        <p className="text-lg font-bold text-orange-900">
                          {selectedPatientData.age || 'Not specified'}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Gender</p>
                        <p className="text-lg font-bold text-purple-900">
                          {selectedPatientData.gender || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    
                    {selectedPatientData.contact_info && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Contact Information</p>
                        <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                          {JSON.stringify(selectedPatientData.contact_info, null, 2)}
                        </pre>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4">
                    {selectedPatientData.medical_history ? (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Medical History</p>
                        <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                          {JSON.stringify(selectedPatientData.medical_history, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Heart className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-600">No medical history recorded</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Select a patient to view details</p>
                <p className="text-sm text-gray-500 mt-2">
                  Real-time data from Supabase database
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientRecords;
