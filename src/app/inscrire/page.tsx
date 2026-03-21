'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/public/PublicLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Camera,
  CheckCircle,
  Loader2,
  ArrowLeft,
  QrCode,
  MessageCircle,
  Upload
} from "lucide-react";

function InscrireContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    // Informations du garage
    garageName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    address: '',
    businessRegistryNumber: '', // Numéro d'agrément
    
    // Informations du gérant
    managerName: '',
    managerPhone: '',
    managerEmail: '',
    
    // Documents
    shopPhoto: null as File | null,
    agreementDocument: null as File | null,
    idDocument: null as File | null,
    
    // Notes
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.garageName.trim()) {
      alert('Le nom du garage est obligatoire');
      return;
    }
    if (!formData.phone.trim()) {
      alert('Le téléphone du garage est obligatoire');
      return;
    }
    if (!formData.managerName.trim()) {
      alert('Le nom du gérant est obligatoire');
      return;
    }
    
    setLoading(true);

    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      submitData.append('name', formData.garageName);
      submitData.append('email', formData.email || '');
      submitData.append('phone', formData.phone);
      submitData.append('whatsappNumber', formData.whatsappNumber || '');
      submitData.append('address', formData.address || '');
      submitData.append('businessRegistryNumber', formData.businessRegistryNumber || '');
      submitData.append('managerName', formData.managerName);
      submitData.append('managerPhone', formData.managerPhone || '');
      submitData.append('managerEmail', formData.managerEmail || '');
      submitData.append('notes', formData.notes || '');
      
      if (formData.shopPhoto) {
        submitData.append('shopPhoto', formData.shopPhoto);
      }
      if (formData.agreementDocument) {
        submitData.append('agreementDocument', formData.agreementDocument);
      }
      if (formData.idDocument) {
        submitData.append('idDocument', formData.idDocument);
      }

      const response = await fetch('/api/admin/garage-applications', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        alert(data.error || 'Erreur lors de l\'envoi de la demande');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Erreur lors de l\'envoi de la demande');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field: 'shopPhoto' | 'agreementDocument' | 'idDocument', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#ff7f00] to-[#e65c00] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            Demande envoyée avec succès !
          </h1>
          <p className="text-slate-600 mb-6">
            Votre demande d'adhésion a été envoyée à notre équipe. 
            Nous vous contacterons dans les plus brefs délais pour finaliser votre inscription.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-500">
              📧 Vous recevrez une notification par email/SMS dès que votre dossier sera traité.
            </p>
          </div>
          <Link href="/">
            <Button className="bg-[#ff7f00] hover:bg-[#e65c00] text-white w-full">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero section */}
      <section className="text-center py-12 bg-gradient-to-r from-[#ff7f00] to-[#e65c00]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Devenir Partenaire OKAR
            </h1>
          </div>
          <p className="text-white/90 max-w-2xl mx-auto text-lg leading-relaxed">
            Rejoignez le réseau des garages certifiés OKAR et offrez à vos clients un suivi numérique complet de leurs véhicules.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-white" />
              <span className="text-white text-sm">Visibilité accrue</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-white" />
              <span className="text-white text-sm">Certification officielle</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-white" />
              <span className="text-white text-sm">Fidélisation client</span>
            </div>
          </div>
        </div>
      </section>

      {/* Formulaire */}
      <section className="py-12 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informations du garage */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Building2 className="w-6 h-6 text-[#ff7f00]" />
                Informations du garage
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="garageName">Nom du garage *</Label>
                  <Input
                    id="garageName"
                    value={formData.garageName}
                    onChange={(e) => setFormData({ ...formData, garageName: e.target.value })}
                    placeholder="Ex: Garage Auto Plus"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+221 77 123 45 67"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="whatsappNumber">WhatsApp</Label>
                  <Input
                    id="whatsappNumber"
                    type="tel"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="+221 77 123 45 67"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@garage-auto.sn"
                  />
                </div>
                
                <div>
                  <Label htmlFor="businessRegistryNumber">N° Agrément / RCCM</Label>
                  <Input
                    id="businessRegistryNumber"
                    value={formData.businessRegistryNumber}
                    onChange={(e) => setFormData({ ...formData, businessRegistryNumber: e.target.value })}
                    placeholder="SN-DKR-XXXXX"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Dakar, Sénégal"
                  />
                </div>
              </div>
            </div>

            {/* Informations du gérant */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <User className="w-6 h-6 text-[#ff7f00]" />
                Informations du gérant
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="managerName">Nom complet *</Label>
                  <Input
                    id="managerName"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    placeholder="Mamadou Diop"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="managerPhone">Téléphone</Label>
                  <Input
                    id="managerPhone"
                    type="tel"
                    value={formData.managerPhone}
                    onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                    placeholder="+221 77 123 45 67"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="managerEmail">Email</Label>
                  <Input
                    id="managerEmail"
                    type="email"
                    value={formData.managerEmail}
                    onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                    placeholder="gerant@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#ff7f00]" />
                Documents justificatifs
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Photo façade */}
                <div>
                  <Label className="block mb-2">Photo façade</Label>
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#ff7f00] transition-colors">
                    {formData.shopPhoto ? (
                      <div className="text-center">
                        <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                        <span className="text-xs text-slate-600">{formData.shopPhoto.name}</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-xs text-slate-500">Télécharger</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange('shopPhoto', e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                
                {/* Agrément */}
                <div>
                  <Label className="block mb-2">Photo agrément</Label>
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#ff7f00] transition-colors">
                    {formData.agreementDocument ? (
                      <div className="text-center">
                        <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                        <span className="text-xs text-slate-600">{formData.agreementDocument.name}</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-xs text-slate-500">Télécharger</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange('agreementDocument', e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                
                {/* Pièce d'identité */}
                <div>
                  <Label className="block mb-2">Pièce d'identité</Label>
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#ff7f00] transition-colors">
                    {formData.idDocument ? (
                      <div className="text-center">
                        <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                        <span className="text-xs text-slate-600">{formData.idDocument.name}</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-xs text-slate-500">Télécharger</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange('idDocument', e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <Label htmlFor="notes">Informations complémentaires</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ajoutez des informations supplémentaires sur votre garage..."
                rows={3}
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#ff7f00] to-[#e65c00] hover:from-[#e65c00] hover:to-[#cc5200] text-white py-6 text-lg font-semibold rounded-xl shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  Envoyer ma demande d'adhésion
                </>
              )}
            </Button>

            <p className="text-center text-sm text-slate-500">
              En soumettant ce formulaire, vous acceptez d'être contacté par notre équipe.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}

export default function InscrirePage() {
  return (
    <PublicLayout>
      <InscrireContent />
    </PublicLayout>
  );
}
