
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Upload,
  Eye,
  Edit,
  BarChart3
} from 'lucide-react';

const RecordsOfficerDashboard = () => {
  const stats = {
    totalUploads: 89,
    pendingVerification: 12,
    completedToday: 23,
    avgAccuracy: 94.2
  };

  const pendingDocuments = [
    { 
      id: 'DOC001', 
      patientName: 'John Smith', 
      documentType: 'Medical History',
      uploadTime: '2 hours ago',
      confidence: 87,
      status: 'needs_review'
    },
    { 
      id: 'DOC002', 
      patientName: 'Maria Garcia', 
      documentType: 'Prescription',
      uploadTime: '4 hours ago',
      confidence: 92,
      status: 'processing'
    },
    { 
      id: 'DOC003', 
      patientName: 'Robert Johnson', 
      documentType: 'Lab Results',
      uploadTime: '1 day ago',
      confidence: 78,
      status: 'needs_review'
    },
    { 
      id: 'DOC004', 
      patientName: 'Lisa Wong', 
      documentType: 'Discharge Summary',
      uploadTime: '6 hours ago',
      confidence: 96,
      status: 'auto_approved'
    },
    { 
      id: 'DOC005', 
      patientName: 'David Brown', 
      documentType: 'Consultation Notes',
      uploadTime: '8 hours ago',
      confidence: 84,
      status: 'needs_review'
    }
  ];

  const recentCompletions = [
    { id: 'COM001', patientName: 'Sarah Wilson', documentType: 'Medical History', completedAt: '10 min ago' },
    { id: 'COM002', patientName: 'Michael Davis', documentType: 'Prescription', completedAt: '25 min ago' },
    { id: 'COM003', patientName: 'Jennifer Lee', documentType: 'Lab Results', completedAt: '45 min ago' },
    { id: 'COM004', patientName: 'Thomas Anderson', documentType: 'X-Ray Report', completedAt: '1 hour ago' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'needs_review':
        return <Badge className="bg-orange-100 text-orange-800">Needs Review</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'auto_approved':
        return <Badge className="bg-green-100 text-green-800">Auto Approved</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 80) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Records Management</h1>
        <p className="text-gray-600 mt-2">Document verification and quality control</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Uploads</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUploads}</p>
                <p className="text-sm text-blue-600">This month</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingVerification}</p>
                <p className="text-sm text-orange-600">Require review</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completedToday}</p>
                <p className="text-sm text-green-600">Verified & approved</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Accuracy</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgAccuracy}%</p>
                <p className="text-sm text-green-600">OCR confidence</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-orange-500" />
              Priority Verification Queue
            </div>
            <Button size="sm">
              Process All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.patientName}</p>
                      <p className="text-sm text-gray-600">{doc.documentType}</p>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Uploaded {doc.uploadTime}</span>
                    <span>Doc ID: {doc.id}</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">OCR Confidence</span>
                      <span className={`text-xs font-medium ${getConfidenceColor(doc.confidence)}`}>
                        {doc.confidence}%
                      </span>
                    </div>
                    <Progress value={doc.confidence} className="h-2" />
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Verify
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Completions and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
              Recent Completions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCompletions.map((completion) => (
                <div key={completion.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{completion.patientName}</p>
                    <p className="text-sm text-gray-600">{completion.documentType}</p>
                    <p className="text-xs text-gray-500">Completed {completion.completedAt}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start h-12">
                <Upload className="mr-3 h-5 w-5" />
                Upload New Document
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                <Eye className="mr-3 h-5 w-5" />
                Bulk Verification
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                <BarChart3 className="mr-3 h-5 w-5" />
                Quality Reports
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                <AlertCircle className="mr-3 h-5 w-5" />
                Error Resolution
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-600">23</p>
              <p className="text-sm text-gray-600">Documents Verified</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">2.3 min</p>
              <p className="text-sm text-gray-600">Avg. Review Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">96.8%</p>
              <p className="text-sm text-gray-600">Accuracy Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">3</p>
              <p className="text-sm text-gray-600">Corrections Made</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecordsOfficerDashboard;
