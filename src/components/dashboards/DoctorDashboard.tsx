
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Stethoscope, 
  FileText, 
  Clock, 
  AlertTriangle,
  Users,
  TrendingUp,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DoctorDashboard = () => {
  const stats = {
    totalPatients: 156,
    pendingReviews: 8,
    completedToday: 12,
    drugInteractions: 3
  };

  const weeklyData = [
    { day: 'Mon', processed: 8, flagged: 1 },
    { day: 'Tue', processed: 12, flagged: 2 },
    { day: 'Wed', processed: 6, flagged: 0 },
    { day: 'Thu', processed: 15, flagged: 3 },
    { day: 'Fri', processed: 11, flagged: 1 },
    { day: 'Sat', processed: 4, flagged: 0 },
    { day: 'Sun', processed: 2, flagged: 0 }
  ];

  const recentPatients = [
    { id: 'P001', name: 'John Smith', condition: 'Hypertension', status: 'review_needed', lastUpdate: '2 hours ago' },
    { id: 'P002', name: 'Maria Garcia', condition: 'Diabetes Type 2', status: 'completed', lastUpdate: '4 hours ago' },
    { id: 'P003', name: 'Robert Johnson', condition: 'Asthma', status: 'processing', lastUpdate: '1 day ago' },
    { id: 'P004', name: 'Lisa Wong', condition: 'Migraine', status: 'drug_interaction', lastUpdate: '3 hours ago' },
    { id: 'P005', name: 'David Brown', condition: 'Arthritis', status: 'completed', lastUpdate: '5 hours ago' }
  ];

  const cdssAlerts = [
    { 
      id: 1, 
      patient: 'Lisa Wong', 
      type: 'Drug Interaction', 
      message: 'Potential interaction between Sumatriptan and Propranolol',
      severity: 'high',
      time: '30 min ago'
    },
    { 
      id: 2, 
      patient: 'John Smith', 
      type: 'Missing Vitals', 
      message: 'Blood pressure readings not found in recent records',
      severity: 'medium',
      time: '1 hour ago'
    },
    { 
      id: 3, 
      patient: 'Robert Johnson', 
      type: 'Dosage Alert', 
      message: 'Albuterol dosage exceeds recommended daily limit',
      severity: 'high',
      time: '2 hours ago'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'review_needed':
        return <Badge className="bg-orange-100 text-orange-800">Review Needed</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'drug_interaction':
        return <Badge className="bg-red-100 text-red-800">Drug Interaction</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-orange-600 bg-orange-100';
      case 'low':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clinical Dashboard</h1>
        <p className="text-gray-600 mt-2">Patient records and clinical decision support</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
                <p className="text-sm text-blue-600">Under your care</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingReviews}</p>
                <p className="text-sm text-orange-600">Require attention</p>
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
                <p className="text-sm text-green-600">Records processed</p>
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
                <p className="text-sm font-medium text-gray-600">Drug Interactions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.drugInteractions}</p>
                <p className="text-sm text-red-600">Active alerts</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CDSS Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
            Clinical Decision Support Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cdssAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{alert.type}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>{alert.patient}:</strong> {alert.message}
                  </p>
                  <p className="text-xs text-gray-500">{alert.time}</p>
                </div>
                <Button size="sm" variant="outline">
                  Review
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts and Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Weekly Processing Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="processed" stroke="#0891b2" strokeWidth={2} />
                <Line type="monotone" dataKey="flagged" stroke="#dc2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Recent Patient Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                      {getStatusBadge(patient.status)}
                    </div>
                    <p className="text-sm text-gray-600">{patient.condition}</p>
                    <p className="text-xs text-gray-500">{patient.lastUpdate}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                View All Patients
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Stethoscope className="mr-2 h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center space-y-2">
              <FileText className="h-6 w-6" />
              <span>Upload New Record</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Activity className="h-6 w-6" />
              <span>Review Pending</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <AlertTriangle className="h-6 w-6" />
              <span>Check Alerts</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorDashboard;
