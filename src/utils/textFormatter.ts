
export interface FormattingOptions {
  documentType: string;
  includeStructure: boolean;
  medicalFormat: boolean;
  preserveLayout: boolean;
}

export const formatExtractedText = (rawText: string, options: FormattingOptions): string => {
  let formattedText = rawText.trim();
  
  // Basic text cleaning
  formattedText = cleanText(formattedText);
  
  // Apply specific formatting based on document type
  switch (options.documentType) {
    case 'prescription':
      formattedText = formatPrescription(formattedText);
      break;
    case 'handwritten':
      formattedText = formatHandwrittenText(formattedText);
      break;
    case 'form':
      formattedText = formatFormText(formattedText);
      break;
    case 'printed':
      formattedText = formatPrintedText(formattedText);
      break;
    default:
      formattedText = formatGenericMedicalText(formattedText);
  }
  
  if (options.includeStructure) {
    formattedText = addStructuralFormatting(formattedText);
  }
  
  return formattedText;
};

const cleanText = (text: string): string => {
  return text
    // Fix common OCR errors
    .replace(/(?<![a-zA-Z])0(?![a-zA-Z0-9])/g, 'O') // Zero to O in words
    .replace(/(?<![a-zA-Z])1(?=l|I)/g, 'I') // 1 to I before l or I
    .replace(/rn/g, 'm') // Common rn -> m confusion
    .replace(/(\d+)\s*(mg|mcg|g|ml|units|tab|cap)/gi, '$1 $2') // Ensure space before units
    
    // Clean up spacing
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
};

const formatPrescription = (text: string): string => {
  let formatted = text;
  
  // Medical abbreviations and corrections
  const medicalCorrections = {
    'mg': 'mg',
    'mcg': 'mcg',
    'ml': 'ml',
    'tab': 'tablet',
    'cap': 'capsule',
    'bid': 'twice daily',
    'tid': 'three times daily',
    'qid': 'four times daily',
    'prn': 'as needed',
    'po': 'by mouth',
    'iv': 'intravenous',
    'im': 'intramuscular',
    'sc': 'subcutaneous'
  };
  
  Object.entries(medicalCorrections).forEach(([abbrev, full]) => {
    const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
    formatted = formatted.replace(regex, full);
  });
  
  // Format medication entries
  const lines = formatted.split('\n');
  const formattedLines = lines.map((line, index) => {
    const trimmed = line.trim();
    
    // Medication name (usually starts with capital letter or number)
    if (trimmed.match(/^\d+\.|^[A-Z]/)) {
      return `\n💊 MEDICATION ${index + 1}:\n${trimmed}`;
    }
    
    // Dosage information
    if (trimmed.match(/\d+\s*(mg|mcg|ml|tablet|capsule)/i)) {
      return `   📏 Dosage: ${trimmed}`;
    }
    
    // Frequency
    if (trimmed.match(/(daily|twice|three|four|times|morning|evening|night|needed)/i)) {
      return `   ⏰ Frequency: ${trimmed}`;
    }
    
    // Instructions
    if (trimmed.match(/(take|with|after|before|food|meal|water)/i)) {
      return `   📝 Instructions: ${trimmed}`;
    }
    
    return `   ${trimmed}`;
  });
  
  return formattedLines.join('\n');
};

const formatHandwrittenText = (text: string): string => {
  let formatted = text;
  
  // Split into paragraphs and format
  const paragraphs = formatted.split('\n\n');
  const formattedParagraphs = paragraphs.map(paragraph => {
    const lines = paragraph.split('\n').filter(line => line.trim());
    
    // Check if this looks like a section header
    if (lines.length === 1 && lines[0].length < 50 && lines[0].toUpperCase() === lines[0]) {
      return `\n📋 ${lines[0]}\n${'='.repeat(lines[0].length)}`;
    }
    
    // Format bullet points
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      
      if (trimmed.match(/^[-•*]\s/)) {
        return `  • ${trimmed.substring(2)}`;
      }
      
      if (trimmed.match(/^\d+\.\s/)) {
        return `  ${trimmed}`;
      }
      
      return `   ${trimmed}`;
    });
    
    return formattedLines.join('\n');
  });
  
  return formattedParagraphs.join('\n\n');
};

const formatFormText = (text: string): string => {
  let formatted = text;
  
  // Format form fields
  const lines = formatted.split('\n');
  const formattedLines = lines.map(line => {
    const trimmed = line.trim();
    
    // Field labels (usually end with colon)
    if (trimmed.match(/.*:\s*$/)) {
      return `\n📝 ${trimmed}`;
    }
    
    // Field values (following labels)
    if (trimmed && !trimmed.includes(':')) {
      return `   ➤ ${trimmed}`;
    }
    
    return trimmed;
  });
  
  return formattedLines.join('\n');
};

const formatPrintedText = (text: string): string => {
  // Standard paragraph formatting for printed text
  return text
    .split('\n\n')
    .map(paragraph => paragraph.replace(/\n/g, ' ').trim())
    .filter(paragraph => paragraph.length > 0)
    .join('\n\n');
};

const formatGenericMedicalText = (text: string): string => {
  let formatted = text;
  
  // Detect and format common medical sections
  const medicalSections = [
    'PATIENT INFORMATION',
    'CHIEF COMPLAINT',
    'HISTORY OF PRESENT ILLNESS',
    'PAST MEDICAL HISTORY',
    'MEDICATIONS',
    'ALLERGIES',
    'PHYSICAL EXAMINATION',
    'ASSESSMENT',
    'PLAN',
    'DIAGNOSIS',
    'TREATMENT',
    'VITAL SIGNS'
  ];
  
  medicalSections.forEach(section => {
    const regex = new RegExp(`(${section})`, 'gi');
    formatted = formatted.replace(regex, `\n🏥 $1\n${'='.repeat(section.length)}`);
  });
  
  return formatted;
};

const addStructuralFormatting = (text: string): string => {
  const timestamp = new Date().toLocaleString();
  
  return `
╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                    MEDICAL DOCUMENT - DIGITIZED                                  ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════╝

📅 Processing Date: ${timestamp}
🔍 Source: AI-Enhanced OCR Extraction
✅ Status: Formatted and Ready for Review

${text}

╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
║ NOTE: This document has been digitized using AI-enhanced OCR technology.                        ║
║ Please review all content for accuracy before use in medical practice.                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
`;
};

export const generateMedicalSummary = (text: string): string => {
  const lines = text.split('\n').filter(line => line.trim());
  const summary = {
    medications: [] as string[],
    vitals: [] as string[],
    diagnoses: [] as string[],
    instructions: [] as string[]
  };
  
  lines.forEach(line => {
    const lower = line.toLowerCase();
    
    if (lower.includes('mg') || lower.includes('mcg') || lower.includes('tablet') || lower.includes('capsule')) {
      summary.medications.push(line.trim());
    }
    
    if (lower.includes('bp') || lower.includes('temp') || lower.includes('pulse') || lower.includes('weight')) {
      summary.vitals.push(line.trim());
    }
    
    if (lower.includes('diagnosis') || lower.includes('condition') || lower.includes('disease')) {
      summary.diagnoses.push(line.trim());
    }
    
    if (lower.includes('take') || lower.includes('follow') || lower.includes('return') || lower.includes('continue')) {
      summary.instructions.push(line.trim());
    }
  });
  
  let summaryText = '\n🏥 MEDICAL SUMMARY\n' + '='.repeat(20) + '\n';
  
  if (summary.medications.length > 0) {
    summaryText += '\n💊 MEDICATIONS:\n';
    summary.medications.forEach((med, index) => {
      summaryText += `   ${index + 1}. ${med}\n`;
    });
  }
  
  if (summary.vitals.length > 0) {
    summaryText += '\n📊 VITAL SIGNS:\n';
    summary.vitals.forEach(vital => {
      summaryText += `   • ${vital}\n`;
    });
  }
  
  if (summary.diagnoses.length > 0) {
    summaryText += '\n🩺 DIAGNOSES:\n';
    summary.diagnoses.forEach(diagnosis => {
      summaryText += `   • ${diagnosis}\n`;
    });
  }
  
  if (summary.instructions.length > 0) {
    summaryText += '\n📝 INSTRUCTIONS:\n';
    summary.instructions.forEach(instruction => {
      summaryText += `   • ${instruction}\n`;
    });
  }
  
  return summaryText;
};
