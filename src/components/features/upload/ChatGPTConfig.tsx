
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Bot, Key, Settings } from 'lucide-react';
import { chatGPTEnhancer } from '@/services/chatgptEnhancer';

interface ChatGPTConfigProps {
  onConfigChange: (configured: boolean) => void;
}

const ChatGPTConfig: React.FC<ChatGPTConfigProps> = ({ onConfigChange }) => {
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4');
  const [temperature, setTemperature] = useState(0.3);
  const [isConfigured, setIsConfigured] = useState(chatGPTEnhancer.isConfigured());

  const handleSaveConfig = () => {
    if (apiKey.trim() && enabled) {
      chatGPTEnhancer.setConfig({
        apiKey: apiKey.trim(),
        model,
        temperature
      });
      setIsConfigured(true);
      onConfigChange(true);
      console.log('✅ ChatGPT API configured successfully');
    } else {
      setIsConfigured(false);
      onConfigChange(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      setIsConfigured(false);
      onConfigChange(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Bot className="mr-2 h-5 w-5 text-blue-500" />
          ChatGPT API Enhancement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
            />
            <Label>Enable ChatGPT Enhancement</Label>
          </div>

          {enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="flex items-center">
                  <Key className="mr-1 h-4 w-4" />
                  API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Your OpenAI API key (stored locally, not sent to our servers)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature: {temperature}</Label>
                  <Input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveConfig}
                className="w-full"
                disabled={!apiKey.trim()}
              >
                <Settings className="mr-2 h-4 w-4" />
                Save Configuration
              </Button>

              {isConfigured && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      ChatGPT Enhancement Active
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Entity extraction will be enhanced with ChatGPT API for maximum accuracy.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatGPTConfig;
