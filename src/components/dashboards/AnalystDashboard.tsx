
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Download,
  Database,
  Clock,
  Target,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

const AnalystDashboard = () => {
  const monthlyProcessing = [
    { month: 'Jan', documents: 245, accuracy: 92, errors: 18 },
    { month: 'Feb', documents: 289, accuracy: 94, errors: 15 },
    { month: 'Mar', documents: 334, accuracy: 93, errors: 22 },
    { month: 'Apr', documents: 401, accuracy: 95, errors: 19 },
    { month: 'May', documents: 478, accuracy: 96, errors: 16 },
    { month: 'Jun', documents: 523, accuracy: 97, errors: 14 }
  ];

  const documentTypes = [
    { name: 'Medical History', value: 342, color: '#0891b2' },
    { name: 'Prescriptions', value: 287, color: '#0d9488' },
    { name: 'Lab Results', value: 234, color: '#059669' },
    { name: 'Discharge Summary', value: 198, color: '#047857' },
    { name: 'Consultation Notes', value: 156, color: '#065f46' }
  ];

  const dailyPerformance = [
    { day: 'Mon', processed: 45, avgTime: 2.3, accuracy: 94 },
    { day: 'Tue', processed: 52, avgTime: 2.1, accuracy: 96 },
    { day: 'Wed', processed: 38, avgTime: 2.5, accuracy: 93 },
    { day: 'Thu', processed: 61, avgTime: 1.9, accuracy: 97 },
    { day: 'Fri', processed: 47, avgTime: 2.2, accuracy: 95 },
    { day: 'Sat', processed: 28, avgTime: 2.4, accuracy: 94 },
    { day: 'Sun', processed: 15, avgTime: 2.6, accuracy: 92 }
  ];

  const stats = {
    totalProcessed: 1247,
    avgAccuracy: 95.2,
    avgProcessingTime: 2.2,
    errorRate: 4.8
  };

  const keyMetrics = [
    { label: 'OCR Success Rate', value: '95.2%', trend: '+2.3%', color: 'text-green-600' },
    { label: 'Processing Speed', value: '2.2 sec', trend: '-0.4 sec', color: 'text-green-600' },
    { label: 'Manual Interventions', value: '4.8%', trend: '-1.2%', color: 'text-green-600' },
    { label: 'Data Quality Score', value: '9.1/10', trend: '+0.3', color: 'text-green-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">System performance and data insights</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button>
            <BarChart3 className="mr-2 h-4 w-4" />
            Generate Analytics
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Processed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProcessed}</p>
                <p className="text-sm text-blue-600">Documents</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Database className="h-6 w-6 text-blue-600" />
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
                <p className="text-sm text-green-600">OCR Performance</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing Time</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgProcessingTime}s</p>
                <p className="text-sm text-teal-600">Average</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.errorRate}%</p>
                <p className="text-sm text-orange-600">Requires review</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Monthly Processing Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyProcessing}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="documents" stackId="1" stroke="#0891b2" fill="#0891b2" fillOpacity={0.6} />
                <Area type="monotone" dataKey="errors" stackId="2" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Document Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={documentTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {documentTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {keyMetrics.map((metric, index) => (
              <div key={index} className="text-center p-4 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
                <div className="flex items-center justify-center">
                  <Badge className={`${metric.color} bg-transparent border-0 px-0`}>
                    {metric.trend}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Daily Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="processed" fill="#0891b2" name="Documents Processed" />
              <Bar yAxisId="right" dataKey="accuracy" fill="#059669" name="Accuracy %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* System Health and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">OCR Engine</span>
                <Badge className="bg-green-100 text-green-800">Optimal</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">NLP Processing</span>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium">Database Performance</span>
                <Badge className="bg-yellow-100 text-yellow-800">Monitoring</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">API Response Time</span>
                <Badge className="bg-green-100 text-green-800">Optimal</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <p className="text-sm font-medium text-blue-800">Performance Optimization</p>
                <p className="text-xs text-blue-600 mt-1">Consider batch processing for large documents during off-peak hours</p>
              </div>
              <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                <p className="text-sm font-medium text-green-800">Quality Improvement</p>
                <p className="text-xs text-green-600 mt-1">OCR accuracy has improved 2.3% this month - good trend</p>
              </div>
              <div className="p-3 bg-orange-50 border-l-4 border-orange-400 rounded">
                <p className="text-sm font-medium text-orange-800">Resource Planning</p>
                <p className="text-xs text-orange-600 mt-1">Peak processing times: 9-11 AM, consider load balancing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalystDashboard;
