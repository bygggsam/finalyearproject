
export interface MedicalECopy {
  id: string;
  patientInfo: {
    name: string;
    dateOfBirth?: string;
    medicalRecordNumber?: string;
    dateOfService: string;
  };
  documentHeader: {
    facilityName: string;
    documentType: string;
    createdDate: string;
    physicianName?: string;
  };
  clinicalSections: {
    chiefComplaint?: string;
    historyOfPresentIllness?: string;
    pastMedicalHistory?: string;
    medications: MedicationEntry[];
    allergies: string[];
    vitalSigns: VitalSigns;
    physicalExamination?: string;
    assessmentAndPlan?: string;
    followUpInstructions?: string;
  };
  structuredText: string;
  editableFields: string[];
}

export interface MedicationEntry {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate?: string;
}

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  respiratoryRate?: string;
  oxygenSaturation?: string;
  weight?: string;
  height?: string;
}

export class MedicalFormatter {
  formatToMedicalECopy(
    extractedText: string,
    patientName: string,
    documentType: string,
    structuredContent: any
  ): MedicalECopy {
    console.log('🏥 Formatting text to medical e-copy structure...');
    
    const medications = this.extractMedications(extractedText, structuredContent);
    const vitalSigns = this.extractVitalSigns(extractedText, structuredContent);
    const allergies = this.extractAllergies(extractedText);
    
    const medicalECopy: MedicalECopy = {
      id: `ecopy_${Date.now()}`,
      patientInfo: {
        name: patientName,
        dateOfService: new Date().toISOString().split('T')[0],
        medicalRecordNumber: this.generateMRN()
      },
      documentHeader: {
        facilityName: "Digital Medical Records System",
        documentType: documentType.replace('_', ' ').toUpperCase(),
        createdDate: new Date().toISOString().split('T')[0],
        physicianName: this.extractPhysicianName(extractedText)
      },
      clinicalSections: {
        chiefComplaint: this.extractSection(extractedText, 'chief complaint', 'cc'),
        historyOfPresentIllness: this.extractSection(extractedText, 'history', 'hpi'),
        pastMedicalHistory: this.extractSection(extractedText, 'past medical history', 'pmh'),
        medications,
        allergies,
        vitalSigns,
        physicalExamination: this.extractSection(extractedText, 'physical exam', 'pe'),
        assessmentAndPlan: this.extractSection(extractedText, 'assessment', 'plan'),
        followUpInstructions: this.extractFollowUpInstructions(extractedText)
      },
      structuredText: this.generateStructuredText(extractedText, medications, vitalSigns, allergies),
      editableFields: [
        'patientInfo.name',
        'patientInfo.dateOfBirth',
        'clinicalSections.chiefComplaint',
        'clinicalSections.historyOfPresentIllness',
        'clinicalSections.medications',
        'clinicalSections.allergies',
        'clinicalSections.vitalSigns',
        'clinicalSections.assessmentAndPlan',
        'clinicalSections.followUpInstructions'
      ]
    };

    console.log('✅ Medical e-copy structure created');
    return medicalECopy;
  }

  private extractMedications(text: string, structuredContent?: any): MedicationEntry[] {
    const medications: MedicationEntry[] = [];
    
    // Extract from structured content first
    if (structuredContent?.medicalEntities?.medications) {
      structuredContent.medicalEntities.medications.forEach((med: string) => {
        medications.push(this.parseMedicationString(med));
      });
    }
    
    // Extract from raw text using patterns
    const medPatterns = [
      /([A-Z][a-z]+(?:in|ol|ide|ine|ate|ium))\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|ml))\s+([^.\n]+)/gi,
      /(aspirin|ibuprofen|acetaminophen|metformin|lisinopril|amlodipine)\s+(\d+\s*mg)\s+([^.\n]+)/gi
    ];
    
    medPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        medications.push({
          name: match[1],
          dosage: match[2] || '',
          frequency: match[3] || 'as needed',
          route: 'oral'
        });
      }
    });
    
    return medications;
  }

  private extractVitalSigns(text: string, structuredContent?: any): VitalSigns {
    const vitals: VitalSigns = {};
    
    // Extract from structured content
    if (structuredContent?.medicalEntities?.vitals) {
      structuredContent.medicalEntities.vitals.forEach((vital: string) => {
        this.parseVitalString(vital, vitals);
      });
    }
    
    // Extract using patterns
    const bpMatch = text.match(/(?:BP|blood pressure):\s*(\d+\/\d+)/i);
    if (bpMatch) vitals.bloodPressure = bpMatch[1];
    
    const hrMatch = text.match(/(?:HR|heart rate|pulse):\s*(\d+)/i);
    if (hrMatch) vitals.heartRate = hrMatch[1];
    
    const tempMatch = text.match(/(?:temp|temperature):\s*(\d+(?:\.\d+)?)/i);
    if (tempMatch) vitals.temperature = tempMatch[1] + '°F';
    
    const weightMatch = text.match(/(?:weight|wt):\s*(\d+(?:\.\d+)?)/i);
    if (weightMatch) vitals.weight = weightMatch[1] + ' lbs';
    
    return vitals;
  }

  private extractAllergies(text: string): string[] {
    const allergies: string[] = [];
    const allergyPatterns = [
      /allergies?:\s*([^.\n]+)/gi,
      /allergic to:\s*([^.\n]+)/gi,
      /NKDA/gi
    ];
    
    allergyPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (match.toLowerCase().includes('nkda')) {
            allergies.push('No Known Drug Allergies');
          } else {
            const allergyText = match.split(':')[1]?.trim();
            if (allergyText) {
              allergies.push(allergyText);
            }
          }
        });
      }
    });
    
    return allergies;
  }

  private extractSection(text: string, ...sectionNames: string[]): string {
    for (const sectionName of sectionNames) {
      const pattern = new RegExp(`${sectionName}:?\\s*([^\\n]{20,200})`, 'i');
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return '';
  }

  private extractPhysicianName(text: string): string {
    const patterns = [
      /Dr\.?\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/,
      /Physician:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /Provider:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    
    return 'Dr. [Name Required]';
  }

  private extractFollowUpInstructions(text: string): string {
    const patterns = [
      /follow.?up:?\s*([^.\n]+)/gi,
      /return.?if:?\s*([^.\n]+)/gi,
      /instructions?:?\s*([^.\n]+)/gi
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'Follow up as needed';
  }

  private parseMedicationString(medString: string): MedicationEntry {
    const parts = medString.split(/\s+/);
    return {
      name: parts[0] || medString,
      dosage: parts.find(part => /\d+\s*(mg|mcg|ml)/i.test(part)) || '',
      frequency: parts.slice(1).join(' ') || 'as directed',
      route: 'oral'
    };
  }

  private parseVitalString(vitalString: string, vitals: VitalSigns): void {
    if (/\d+\/\d+/.test(vitalString)) {
      vitals.bloodPressure = vitalString;
    } else if (/temp|°/.test(vitalString.toLowerCase())) {
      vitals.temperature = vitalString;
    } else if (/\d+$/.test(vitalString)) {
      vitals.heartRate = vitalString;
    }
  }

  private generateMRN(): string {
    return 'MRN' + Date.now().toString().slice(-6);
  }

  private generateStructuredText(
    originalText: string,
    medications: MedicationEntry[],
    vitals: VitalSigns,
    allergies: string[]
  ): string {
    return `MEDICAL RECORD - STRUCTURED FORMAT
    
MEDICATIONS:
${medications.map(med => `• ${med.name} ${med.dosage} ${med.frequency}`).join('\n')}

VITAL SIGNS:
${Object.entries(vitals).map(([key, value]) => `• ${key}: ${value}`).join('\n')}

ALLERGIES:
${allergies.map(allergy => `• ${allergy}`).join('\n')}

ORIGINAL TEXT:
${originalText}`;
  }

  generateECopyImage(medicalECopy: MedicalECopy): string {
    console.log('🖼️ Generating e-copy image representation...');
    
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d')!;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Header
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, 0, canvas.width, 80);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('MEDICAL RECORD - E-COPY', 20, 45);
    
    // Content
    ctx.fillStyle = '#000000';
    let yPos = 120;
    
    // Patient Info
    ctx.font = 'bold 18px Arial';
    ctx.fillText('PATIENT INFORMATION', 20, yPos);
    yPos += 30;
    
    ctx.font = '14px Arial';
    ctx.fillText(`Name: ${medicalECopy.patientInfo.name}`, 20, yPos);
    yPos += 25;
    ctx.fillText(`MRN: ${medicalECopy.patientInfo.medicalRecordNumber}`, 20, yPos);
    yPos += 25;
    ctx.fillText(`Date: ${medicalECopy.patientInfo.dateOfService}`, 20, yPos);
    yPos += 40;
    
    // Medications
    if (medicalECopy.clinicalSections.medications.length > 0) {
      ctx.font = 'bold 16px Arial';
      ctx.fillText('MEDICATIONS', 20, yPos);
      yPos += 25;
      
      ctx.font = '12px Arial';
      medicalECopy.clinicalSections.medications.forEach(med => {
        ctx.fillText(`• ${med.name} ${med.dosage} ${med.frequency}`, 30, yPos);
        yPos += 20;
      });
      yPos += 20;
    }
    
    // Vital Signs
    ctx.font = 'bold 16px Arial';
    ctx.fillText('VITAL SIGNS', 20, yPos);
    yPos += 25;
    
    ctx.font = '12px Arial';
    Object.entries(medicalECopy.clinicalSections.vitalSigns).forEach(([key, value]) => {
      if (value) {
        ctx.fillText(`• ${key}: ${value}`, 30, yPos);
        yPos += 20;
      }
    });
    
    return canvas.toDataURL('image/png', 0.9);
  }
}

export const medicalFormatter = new MedicalFormatter();
