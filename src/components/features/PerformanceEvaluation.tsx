
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Target, 
  CheckCircle2, 
  FileText,
  BarChart3,
  TrendingUp,
  Activity,
  Brain,
  Stethoscope,
  ClipboardCheck
} from 'lucide-react';

interface CaseHistoryEvaluation {
  id: string;
  patientId: string;
  caseType: 'admission' | 'discharge' | 'progress' | 'consultation';
  originalHandwritten: string;
  extractedText: string;
  structuredData: any;
  ocrAccuracy: number;
  structuralAccuracy: number;
  medicalTermAccuracy: number;
  overallScore: number;
  evaluationDate: Date;
  processingTime: number;
  status: 'pending' | 'evaluated' | 'validated';
}

const PerformanceEvaluation = () => {
  const [evaluations, setEvaluations] = useState<CaseHistoryEvaluation[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [evaluationMetrics, setEvaluationMetrics] = useState({
    totalEvaluated: 0,
    averageOCRAccuracy: 0,
    averageStructuralAccuracy: 0,
    averageMedicalAccuracy: 0,
    averageProcessingTime: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCaseHistoryDocuments();
    calculateSystemMetrics();
    const interval = setInterval(() => {
      loadCaseHistoryDocuments();
      calculateSystemMetrics();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadCaseHistoryDocuments = () => {
    const handwrittenDocs = JSON.parse(localStorage.getItem('handwrittenDocuments') || '[]');
    const processedDocs = handwrittenDocs
      .filter(doc => doc.ocrResult && doc.patientName)
      .map(doc => ({
        id: `eval-${doc.id}`,
        patientId: doc.patientName,
        caseType: doc.documentType?.toLowerCase() || 'consultation',
        originalHandwritten: '',
        extractedText: doc.ocrResult || '',
        structuredData: doc.extractedData || {},
        ocrAccuracy: 0,
        structuralAccuracy: 0,
        medicalTermAccuracy: 0,
        overallScore: 0,
        evaluationDate: new Date(),
        processingTime: doc.processingTime || 0,
        status: 'pending' as const
      }));

    setEvaluations(processedDocs);
    if (processedDocs.length > 0 && !selectedEvaluation) {
      setSelectedEvaluation(processedDocs[0].id);
      setExtractedText(processedDocs[0].extractedText);
    }
  };

  const calculateSystemMetrics = () => {
    const evaluatedDocs = evaluations.filter(e => e.status === 'evaluated');
    if (evaluatedDocs.length === 0) return;

    const totalOCR = evaluatedDocs.reduce((sum, e) => sum + e.ocrAccuracy, 0);
    const totalStructural = evaluatedDocs.reduce((sum, e) => sum + e.structuralAccuracy, 0);
    const totalMedical = evaluatedDocs.reduce((sum, e) => sum + e.medicalTermAccuracy, 0);
    const totalTime = evaluatedDocs.reduce((sum, e) => sum + e.processingTime, 0);

    setEvaluationMetrics({
      totalEvaluated: evaluatedDocs.length,
      averageOCRAccuracy: Math.round(totalOCR / evaluatedDocs.length),
      averageStructuralAccuracy: Math.round(totalStructural / evaluatedDocs.length),
      averageMedicalAccuracy: Math.round(totalMedical / evaluatedDocs.length),
      averageProcessingTime: Math.round((totalTime / evaluatedDocs.length) * 100) / 100
    });
  };

  const evaluateOCRAccuracy = (original: string, extracted: string) => {
    if (!original || !extracted) return 0;

    const originalWords = original.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const extractedWords = extracted.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    
    const correctWords = originalWords.filter(word => extractedWords.includes(word)).length;
    return originalWords.length > 0 ? Math.round((correctWords / originalWords.length) * 100) : 0;
  };

  const evaluateStructuralAccuracy = (original: string, extracted: string) => {
    const structurePatterns = [
      /chief complaint:?/i,
      /history of present illness:?/i,
      /past medical history:?/i,
      /physical examination:?/i,
      /assessment:?/i,
      /plan:?/i,
      /diagnosis:?/i,
      /medications?:?/i
    ];

    let structuralScore = 0;
    structurePatterns.forEach(pattern => {
      const inOriginal = pattern.test(original);
      const inExtracted = pattern.test(extracted);
      if (inOriginal && inExtracted) structuralScore++;
      else if (!inOriginal && !inExtracted) structuralScore++;
    });

    return Math.round((structuralScore / structurePatterns.length) * 100);
  };

  const evaluateMedicalTermAccuracy = (original: string, extracted: string) => {
    const medicalTerms = [
      'blood pressure', 'heart rate', 'temperature', 'respiratory rate',
      'diagnosis', 'symptoms', 'treatment', 'medication', 'dosage',
      'mg', 'ml', 'tablets', 'capsules', 'injection', 'prescription',
      'allergies', 'chronic', 'acute', 'fever', 'pain', 'examination'
    ];

    const originalLower = original.toLowerCase();
    const extractedLower = extracted.toLowerCase();
    
    const originalTerms = medicalTerms.filter(term => originalLower.includes(term));
    const extractedTerms = medicalTerms.filter(term => extractedLower.includes(term));
    const matchingTerms = originalTerms.filter(term => extractedTerms.includes(term));

    return originalTerms.length > 0 ? Math.round((matchingTerms.length / originalTerms.length) * 100) : 85;
  };

  const handleEvaluateCase = (evaluationId: string) => {
    if (!originalText.trim()) {
      toast({
        title: '⚠️ Missing Original Text',
        description: 'Please enter the original handwritten case history text for comparison.',
        variant: 'destructive',
      });
      return;
    }

    const ocrAccuracy = evaluateOCRAccuracy(originalText, extractedText);
    const structuralAccuracy = evaluateStructuralAccuracy(originalText, extractedText);
    const medicalAccuracy = evaluateMedicalTermAccuracy(originalText, extractedText);
    const overallScore = Math.round((ocrAccuracy + structuralAccuracy + medicalAccuracy) / 3);

    setEvaluations(prev => prev.map(evaluation => 
      evaluation.id === evaluationId 
        ? {
            ...evaluation,
            originalHandwritten: originalText,
            extractedText,
            ocrAccuracy,
            structuralAccuracy,
            medicalTermAccuracy: medicalAccuracy,
            overallScore,
            status: 'evaluated' as const
          }
        : evaluation
    ));

    // Save evaluation results
    const evaluationResults = JSON.parse(localStorage.getItem('caseHistoryEvaluations') || '[]');
    evaluationResults.push({
      id: evaluationId,
      timestamp: new Date().toISOString(),
      metrics: { ocrAccuracy, structuralAccuracy, medicalAccuracy, overallScore },
      caseType: evaluations.find(e => e.id === evaluationId)?.caseType
    });
    localStorage.setItem('caseHistoryEvaluations', JSON.stringify(evaluationResults));

    toast({
      title: '✅ Case History Evaluation Complete',
      description: `Overall OCR Performance: ${overallScore}% | Medical Term Accuracy: ${medicalAccuracy}%`,
    });

    setOriginalText('');
  };

  const getAccuracyColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 75) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const selectedEval = evaluations.find(e => e.id === selectedEvaluation);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Target className="mr-3 h-8 w-8 text-blue-600" />
            OCR Performance Evaluation
          </h1>
          <p className="text-gray-600 mt-2">Evaluate OCR accuracy for handwritten case history digitization</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{evaluations.length}</p>
          <p className="text-sm text-gray-500">Case Histories</p>
        </div>
      </div>

      {/* System Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">OCR Accuracy</p>
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
            <p className={`text-3xl font-bold ${getAccuracyColor(evaluationMetrics.averageOCRAccuracy)}`}>
              {evaluationMetrics.averageOCRAccuracy}%
            </p>
            <Progress value={evaluationMetrics.averageOCRAccuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Structural Accuracy</p>
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <p className={`text-3xl font-bold ${getAccuracyColor(evaluationMetrics.averageStructuralAccuracy)}`}>
              {evaluationMetrics.averageStructuralAccuracy}%
            </p>
            <Progress value={evaluationMetrics.averageStructuralAccuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Medical Term Accuracy</p>
              <Stethoscope className="h-5 w-5 text-purple-600" />
            </div>
            <p className={`text-3xl font-bold ${getAccuracyColor(evaluationMetrics.averageMedicalAccuracy)}`}>
              {evaluationMetrics.averageMedicalAccuracy}%
            </p>
            <Progress value={evaluationMetrics.averageMedicalAccuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
              <Activity className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {evaluationMetrics.averageProcessingTime}s
            </p>
            <p className="text-sm text-gray-500 mt-1">Per document</p>
          </CardContent>
        </Card>
      </div>

      {evaluations.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <ClipboardCheck className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              No case histories available for evaluation. Process documents through the Case History Digitizer first.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case History Queue */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Case History Queue ({evaluations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {evaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedEvaluation === evaluation.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => {
                    setSelectedEvaluation(evaluation.id);
                    setExtractedText(evaluation.extractedText);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">{evaluation.patientId}</p>
                    <Badge 
                      className={
                        evaluation.status === 'evaluated' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }
                    >
                      {evaluation.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-600 capitalize mb-1">{evaluation.caseType} Record</p>
                  {evaluation.status === 'evaluated' && (
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>OCR Accuracy:</span>
                        <span className={getAccuracyColor(evaluation.ocrAccuracy)}>
                          {evaluation.ocrAccuracy}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overall Score:</span>
                        <span className={getAccuracyColor(evaluation.overallScore)}>
                          {evaluation.overallScore}%
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    {evaluation.evaluationDate.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evaluation Interface */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Case History OCR Evaluation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEval ? (
              <div className="space-y-6">
                {selectedEval.status === 'pending' ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900">
                        Evaluating: {selectedEval.patientId} - {selectedEval.caseType} Record
                      </h3>
                      <p className="text-sm text-blue-700">
                        Compare OCR extraction accuracy against original handwritten case history
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📝 Original Handwritten Case History (Ground Truth)
                      </label>
                      <Textarea
                        placeholder="Enter the exact text from the original handwritten case history document..."
                        value={originalText}
                        onChange={(e) => setOriginalText(e.target.value)}
                        className="h-40"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🤖 OCR Extracted Text (System Output)
                      </label>
                      <Textarea
                        value={extractedText}
                        onChange={(e) => setExtractedText(e.target.value)}
                        className="h-40"
                        placeholder="OCR system extracted text..."
                      />
                    </div>

                    <Button 
                      onClick={() => handleEvaluateCase(selectedEval.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={!originalText.trim()}
                    >
                      <Target className="mr-2 h-4 w-4" />
                      Evaluate OCR Performance
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{selectedEval.overallScore}%</p>
                        <p className="text-sm text-gray-600">Overall Performance</p>
                        {getPerformanceBadge(selectedEval.overallScore)}
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-700">{selectedEval.processingTime}s</p>
                        <p className="text-sm text-gray-600">Processing Time</p>
                      </div>
                    </div>

                    {/* Detailed Accuracy Metrics */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>OCR Text Accuracy</span>
                          <span className={getAccuracyColor(selectedEval.ocrAccuracy)}>
                            {selectedEval.ocrAccuracy}%
                          </span>
                        </div>
                        <Progress value={selectedEval.ocrAccuracy} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Case Structure Recognition</span>
                          <span className={getAccuracyColor(selectedEval.structuralAccuracy)}>
                            {selectedEval.structuralAccuracy}%
                          </span>
                        </div>
                        <Progress value={selectedEval.structuralAccuracy} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Medical Term Accuracy</span>
                          <span className={getAccuracyColor(selectedEval.medicalTermAccuracy)}>
                            {selectedEval.medicalTermAccuracy}%
                          </span>
                        </div>
                        <Progress value={selectedEval.medicalTermAccuracy} className="h-2" />
                      </div>
                    </div>

                    {/* Text Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">📝 Original Case History</h4>
                        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm max-h-40 overflow-y-auto">
                          {selectedEval.originalHandwritten}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">🤖 OCR Extracted Text</h4>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm max-h-40 overflow-y-auto">
                          {selectedEval.extractedText}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Stethoscope className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Select a case history to evaluate OCR performance</p>
                <p className="text-sm text-gray-500 mt-2">
                  Evaluate accuracy of handwritten case history digitization
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceEvaluation;
