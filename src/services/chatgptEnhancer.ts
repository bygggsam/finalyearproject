
export interface ChatGPTConfig {
  apiKey: string;
  model: string;
  temperature: number;
}

export interface ChatGPTEntityResult {
  names: string[];
  ages: string[];
  dates: string[];
  medications: string[];
  symptoms: string[];
  vitals: string[];
  addresses: string[];
  phoneNumbers: string[];
  confidence: number;
}

export class ChatGPTTextEnhancer {
  private config: ChatGPTConfig | null = null;

  setConfig(config: ChatGPTConfig) {
    this.config = config;
  }

  async enhanceEntityExtraction(text: string): Promise<ChatGPTEntityResult | null> {
    if (!this.config) {
      console.log('🤖 ChatGPT API not configured, skipping enhancement');
      return null;
    }

    try {
      console.log('🤖 Enhancing entity extraction with ChatGPT...');
      
      const prompt = `
Extract and categorize entities from this medical text. Focus on Nigerian names, ages, dates, medications, symptoms, vital signs, addresses, and phone numbers.

Text: "${text}"

Please respond with a JSON object containing:
- names: Array of Nigerian names found (if none, return ["None"])
- ages: Array of ages found (if none, return ["None"])  
- dates: Array of dates found (if none, return ["None"])
- medications: Array of medications found (if none, return ["None"])
- symptoms: Array of symptoms found (if none, return ["None"])
- vitals: Array of vital signs found (if none, return ["None"])
- addresses: Array of addresses found (if none, return ["None"])
- phoneNumbers: Array of phone numbers found (if none, return ["None"])

Be very precise. If an entity type is not found, use ["None"]. For Nigerian names, focus on Yoruba, Igbo, Hausa, and common Nigerian names.
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert at extracting medical entities from text. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: this.config.temperature,
          max_tokens: 1000
        }),
      });

      if (!response.ok) {
        throw new Error(`ChatGPT API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from ChatGPT');
      }

      try {
        const parsedResult = JSON.parse(content);
        return {
          ...parsedResult,
          confidence: 95 // High confidence for ChatGPT results
        };
      } catch (parseError) {
        console.warn('Failed to parse ChatGPT response as JSON:', content);
        return null;
      }

    } catch (error) {
      console.error('❌ ChatGPT enhancement failed:', error);
      return null;
    }
  }

  isConfigured(): boolean {
    return this.config !== null;
  }
}

export const chatGPTEnhancer = new ChatGPTTextEnhancer();
