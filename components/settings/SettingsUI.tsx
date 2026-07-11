'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Phone, Info, ChevronRight, Shield, Users, MapPin, Heart } from 'lucide-react';
import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { LanguageSelector, type LanguageCode } from '@/components/ui/LanguageSelector';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const EMERGENCY_CONTACTS = [
  { name: 'NDMA Helpline', number: '1078', desc: 'National Disaster Management' },
  { name: 'Disaster Helpline', number: '1077', desc: 'State Disaster Response' },
  { name: 'Ambulance', number: '108', desc: 'Emergency Medical Service' },
  { name: 'Mumbai Disaster Cell', number: '1916', desc: 'BMC Emergency Operations' },
  { name: 'Police', number: '100', desc: 'Law & Order Emergency' },
  { name: 'Fire Brigade', number: '101', desc: 'Fire & Rescue' },
];

const APP_INFO = [
  { label: 'Version', value: '1.0.0 (Hackathon)' },
  { label: 'Data Sources', value: 'IMD, NDMA, BMC Open Data' },
  { label: 'AI Engine', value: 'Google Gemini 1.5 Flash' },
  { label: 'Backend', value: 'Supabase (PostgreSQL)' },
];

export function SettingsUI() {
  const router = useRouter();
  const [language, setLanguage] = useState<LanguageCode>('en');

  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code);
    // Navigate to the same path under new locale
    router.push(`/${code}`);
  };

  return (
    <div className="min-h-screen bg-paper-dry pb-32 safe-all">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-paper-dry border-b border-cloud-200 shadow-cloud-shadow safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-xl bg-storm-700 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-semibold text-storm-900 text-lg">Settings</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6 pb-28">
        {/* Family Profile card (placeholder) */}
        <section>
          <h2 className="text-xs font-semibold text-cloud-500 uppercase tracking-wider mb-2 px-1">Family Profile</h2>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-storm-600 to-water-600 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-storm-900">My Family</p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-cloud-500">
                    <MapPin className="w-3 h-3" />
                    <span>Mumbai Suburban District</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-cloud-500">
                    <Heart className="w-3 h-3" />
                    <span>Preparedness active</span>
                  </div>
                </div>
                <Badge variant="success" className="text-xs">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Language selector */}
        <section>
          <h2 className="text-xs font-semibold text-cloud-500 uppercase tracking-wider mb-2 px-1">
            <Globe className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
            App Language
          </h2>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-cloud-600 mb-3">Select the language you want to receive alerts and guidance in.</p>
              <LanguageSelector
                value={language}
                onChange={handleLanguageChange}
                trigger="select"
                fullWidth
              />
            </CardContent>
          </Card>
        </section>

        {/* Emergency contacts */}
        <section>
          <h2 className="text-xs font-semibold text-cloud-500 uppercase tracking-wider mb-2 px-1">
            <Phone className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
            Emergency Numbers
          </h2>
          <Card>
            <CardContent className="p-0">
              {EMERGENCY_CONTACTS.map((contact, i) => (
                <a
                  key={contact.number}
                  href={`tel:${contact.number}`}
                  className={`flex items-center justify-between px-4 py-3.5 hover:bg-cloud-50 active:bg-cloud-100 transition-colors ${
                    i < EMERGENCY_CONTACTS.length - 1 ? 'border-b border-cloud-100' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-storm-900">{contact.name}</p>
                    <p className="text-xs text-cloud-500">{contact.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-water-600">{contact.number}</span>
                    <ChevronRight className="w-4 h-4 text-cloud-400" />
                  </div>
                </a>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* About app */}
        <section>
          <h2 className="text-xs font-semibold text-cloud-500 uppercase tracking-wider mb-2 px-1">
            <Info className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
            About
          </h2>
          <Card>
            <CardContent className="p-0">
              {APP_INFO.map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-4 py-3.5 ${
                    i < APP_INFO.length - 1 ? 'border-b border-cloud-100' : ''
                  }`}
                >
                  <span className="text-sm text-cloud-600">{item.label}</span>
                  <span className="text-sm font-medium text-storm-900">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Data disclaimer */}
        <div className="bg-cloud-50 rounded-2xl p-4 text-xs text-cloud-500 leading-relaxed">
          <p className="font-semibold text-cloud-700 mb-1">Data Disclaimer</p>
          <p>Monsoon Mitra uses real-time weather data from IMD and NDMA. Emergency shelter locations are pre-designated by BMC and may change during active disaster situations. Always follow official government instructions during emergencies.</p>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
