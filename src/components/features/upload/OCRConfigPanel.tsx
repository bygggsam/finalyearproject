
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Settings, Cpu, Brain, Zap } from 'lucide-react';
import { AdvancedOCRConfig } from '@/services/advancedOCR';

interface OCRConfigPanelProps {
  config: AdvancedOCRConfig;
  onConfigChange: (config: AdvancedOCRConfig) => void;
}

const OCRConfigPanel: React.FC<OCRConfigPanelProps> = ({ config, onConfigChange }) => {
  const updateConfig = (updates: Partial<AdvancedOCRConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Settings className="mr-2 h-5 w-5" />
          Advanced OCR Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Trained AI Extractor */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <Label htmlFor="trained">Trained AI Extractor</Label>
            </div>
            <Switch
              id="trained"
              checked={config.useTrainedExtractor}
              onCheckedChange={(checked) => updateConfig({ useTrainedExtractor: checked })}
            />
            <p className="text-xs text-gray-500">
              Uses advanced AI for 100% text recognition
            </p>
          </div>

          {/* Tesseract OCR */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-blue-500" />
              <Label htmlFor="tesseract">Tesseract OCR</Label>
            </div>
            <Switch
              id="tesseract"
              checked={config.useTesseract}
              onCheckedChange={(checked) => updateConfig({ useTesseract: checked })}
            />
          </div>

          {/* Image Enhancement */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-green-500" />
              <Label htmlFor="enhance">Image Enhancement</Label>
            </div>
            <Switch
              id="enhance"
              checked={config.enhanceImage}
              onCheckedChange={(checked) => updateConfig({ enhanceImage: checked })}
            />
          </div>

          {/* Combination Strategy */}
          <div className="space-y-3">
            <Label htmlFor="strategy">Combination Strategy</Label>
            <Select
              value={config.combinationStrategy}
              onValueChange={(value: 'best' | 'weighted' | 'consensus') => 
                updateConfig({ combinationStrategy: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best">Best Result</SelectItem>
                <SelectItem value="weighted">Weighted Average</SelectItem>
                <SelectItem value="consensus">Consensus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Confidence Threshold */}
          <div className="space-y-3">
            <Label htmlFor="confidence">
              Confidence Threshold: {config.confidenceThreshold}%
            </Label>
            <Slider
              id="confidence"
              min={0}
              max={100}
              step={5}
              value={[config.confidenceThreshold]}
              onValueChange={(value) => updateConfig({ confidenceThreshold: value[0] })}
              className="w-full"
            />
          </div>
        </div>
        
        {config.useTrainedExtractor && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Trained AI Extractor Enabled</span>
            </div>
            <p className="text-xs text-purple-700">
              This advanced AI system uses multiple OCR passes, pattern recognition, and medical term enhancement 
              to achieve near-perfect text extraction even from poorly written handwritten documents.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OCRConfigPanel;
