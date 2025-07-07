
import { supabase } from '@/integrations/supabase/client';

export interface Patient {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  medicalHistory?: {
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export class PatientService {
  async createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      console.log('Creating patient record:', patientData.name);
      
      const { data, error } = await supabase
        .from('patients')
        .insert({
          name: patientData.name,
          age: patientData.age || null,
          gender: patientData.gender || null,
          contact_info: patientData.contactInfo || null,
          medical_history: patientData.medicalHistory || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating patient:', error);
        return null;
      }

      console.log('Patient created successfully:', data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating patient:', error);
      return null;
    }
  }

  async getPatientByName(name: string): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .ilike('name', `%${name}%`)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No patient found
        }
        console.error('Error fetching patient:', error);
        return null;
      }

      return this.mapDatabasePatient(data);
    } catch (error) {
      console.error('Error fetching patient:', error);
      return null;
    }
  }

  async getPatientById(id: string): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching patient by ID:', error);
        return null;
      }

      return this.mapDatabasePatient(data);
    } catch (error) {
      console.error('Error fetching patient by ID:', error);
      return null;
    }
  }

  async getAllPatients(): Promise<Patient[]> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching patients:', error);
        return [];
      }

      return (data || []).map(this.mapDatabasePatient);
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<boolean> {
    try {
      const dbUpdates: any = {};
      
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.age !== undefined) dbUpdates.age = updates.age;
      if (updates.gender) dbUpdates.gender = updates.gender;
      if (updates.contactInfo) dbUpdates.contact_info = updates.contactInfo;
      if (updates.medicalHistory) dbUpdates.medical_history = updates.medicalHistory;

      const { error } = await supabase
        .from('patients')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.error('Error updating patient:', error);
        return false;
      }

      console.log('Patient updated successfully:', id);
      return true;
    } catch (error) {
      console.error('Error updating patient:', error);
      return false;
    }
  }

  async findOrCreatePatient(name: string): Promise<string | null> {
    try {
      // First, try to find existing patient
      const existingPatient = await this.getPatientByName(name);
      
      if (existingPatient) {
        console.log('Found existing patient:', existingPatient.id);
        return existingPatient.id;
      }

      // Create new patient if not found
      console.log('Creating new patient:', name);
      return await this.createPatient({
        name,
        createdBy: undefined // Will be set by trigger
      });
    } catch (error) {
      console.error('Error in findOrCreatePatient:', error);
      return null;
    }
  }

  private mapDatabasePatient(data: any): Patient {
    return {
      id: data.id,
      name: data.name,
      age: data.age || undefined,
      gender: data.gender || undefined,
      contactInfo: data.contact_info || undefined,
      medicalHistory: data.medical_history || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by || undefined
    };
  }
}

export const patientService = new PatientService();
