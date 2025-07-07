
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Download, 
  Server, 
  Database,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';

const SystemMetrics = () => {
  const systemHealth = {
    overallHealth: 95,
    ocrEngine: 98,
    nlpService: 93,
    database: 97,
    apiGateway: 95
  };

  const performanceData = [
    { time: '00:00', cpu: 45, memory: 62, network: 23 },
    { time: '04:00', cpu: 52, memory: 58, network: 31 },
    { time: '08:00', cpu: 78, memory: 74, network: 67 },
    { time: '12:00', cpu: 85, memory: 81, network: 72 },
    { time: '16:00', cpu: 73, memory: 69, network: 58 },
    { time: '20:00', cpu: 61, memory: 65, network: 45 }
  ];

  const processingMetrics = [
    { hour: '06:00', documents: 23, errors: 1, avgTime: 2.1 },
    { hour: '08:00', documents: 45, errors: 2, avgTime: 2.3 },
    { hour: '10:00', documents: 67, errors: 3, avgTime: 2.0 },
    { hour: '12:00', documents: 78, errors: 1, avgTime: 1.9 },
    { hour: '14:00', documents: 56, errors: 4, avgTime: 2.4 },
    { hour: '16:00', documents: 42, errors: 2, avgTime: 2.2 },
    { hour: '18:00', documents: 28, errors: 1, avgTime: 2.0 }
  ];

  const alerts = [
    { id: 1, type: 'warning', message: 'Database storage at 78% capacity', time: '10 min ago' },
    { id: 2, type: 'info', message: 'OCR processing queue cleared', time: '25 min ago' },
    { id: 3, type: 'error', message: 'NLP service temporary timeout', time: '1 hour ago' },
    { id: 4, type: 'success', message: 'System backup completed successfully', time: '2 hours ago' }
  ];

  const getHealthColor = (value: number) => {
    if (value >= 95) return 'text-green-600';
    if (value >= 85) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBadge = (value: number) => {
    if (value >= 95) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (value >= 85) return <Badge className="bg-orange-100 text-orange-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Metrics</h1>
          <p className="text-gray-600 mt-2">Monitor system performance and health</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Metrics
          </Button>
          <Button>
            <BarChart3 className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Overall Health</p>
              {getHealthBadge(systemHealth.overallHealth)}
            </div>
            <p className={`text-3xl font-bold ${getHealthColor(systemHealth.overallHealth)}`}>
              {systemHealth.overallHealth}%
            </p>
            <Progress value={systemHealth.overallHealth} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">OCR Engine</p>
              <Server className="h-5 w-5 text-blue-600" />
            </div>
            <p className={`text-3xl font-bold ${getHealthColor(systemHealth.ocrEngine)}`}>
              {systemHealth.ocrEngine}%
            </p>
            <Progress value={systemHealth.ocrEngine} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">NLP Service</p>
              <Activity className="h-5 w-5 text-teal-600" />
            </div>
            <p className={`text-3xl font-bold ${getHealthColor(systemHealth.nlpService)}`}>
              {systemHealth.nlpService}%
            </p>
            <Progress value={systemHealth.nlpService} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Database</p>
              <Database className="h-5 w-5 text-green-600" />
            </div>
            <p className={`text-3xl font-bold ${getHealthColor(systemHealth.database)}`}>
              {systemHealth.database}%
            </p>
            <Progress value={systemHealth.database} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">API Gateway</p>
              <Server className="h-5 w-5 text-purple-600" />
            </div>
            <p className={`text-3xl font-bold ${getHealthColor(systemHealth.apiGateway)}`}>
              {systemHealth.apiGateway}%
            </p>
            <Progress value={systemHealth.apiGateway} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Resource Usage (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="cpu" stackId="1" stroke="#0891b2" fill="#0891b2" fillOpacity={0.6} />
                <Area type="monotone" dataKey="memory" stackId="2" stroke="#059669" fill="#059669" fillOpacity={0.6} />
                <Area type="monotone" dataKey="network" stackId="3" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document Processing (Today)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={processingMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="documents" fill="#0891b2" name="Documents Processed" />
                <Bar dataKey="errors" fill="#dc2626" name="Errors" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Processing Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900">1,247</p>
                <p className="text-sm text-green-600">+12% today</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900">96.8%</p>
                <p className="text-sm text-green-600">+0.3% today</p>
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
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-3xl font-bold text-gray-900">2.1s</p>
                <p className="text-sm text-green-600">-0.2s today</p>
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
                <p className="text-sm font-medium text-gray-600">Active Connections</p>
                <p className="text-3xl font-bold text-gray-900">18</p>
                <p className="text-sm text-blue-600">Current users</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Server className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
            System Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500">{alert.time}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Resolve
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Storage and Database Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Documents</span>
                  <span className="text-sm text-gray-600">2.3 GB / 10 GB</span>
                </div>
                <Progress value={23} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Database</span>
                  <span className="text-sm text-gray-600">7.8 GB / 20 GB</span>
                </div>
                <Progress value={39} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Logs</span>
                  <span className="text-sm text-gray-600">1.2 GB / 5 GB</span>
                </div>
                <Progress value={24} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Backups</span>
                  <span className="text-sm text-gray-600">15.6 GB / 50 GB</span>
                </div>
                <Progress value={31} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-900">234ms</p>
                <p className="text-sm text-blue-700">Avg Query Time</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-900">12</p>
                <p className="text-sm text-green-700">Active Connections</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-900">1,247</p>
                <p className="text-sm text-orange-700">Queries/hour</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-900">99.9%</p>
                <p className="text-sm text-purple-700">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemMetrics;
