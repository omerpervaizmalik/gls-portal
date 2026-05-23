"use client";

import React from 'react';
import { ShieldCheck, ArrowLeft, Lock, Eye, Server, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-amber-500/30">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Link href="/login" className="inline-flex items-center text-amber-500 hover:text-amber-400 transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        <header className="mb-16">
          <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-500">Last Updated: May 2026</p>
        </header>

        <div className="space-y-12">
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-3 text-amber-500" />
              Information We Collect
            </h2>
            <p className="leading-relaxed">
              To provide professional legal and tax consultancy, we collect specific client data including:
            </p>
            <ul className="mt-4 list-disc list-inside space-y-2 ml-4">
              <li>Full names and business titles</li>
              <li>National Identity Numbers (CNIC) and NTN</li>
              <li>Contact information (Email, Mobile, Address)</li>
              <li>Financial records and tax-related documentation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Server className="w-5 h-5 mr-3 text-amber-500" />
              How We Use Your Data
            </h2>
            <p className="leading-relaxed">
              Your information is strictly used for:
            </p>
            <ul className="mt-4 list-disc list-inside space-y-2 ml-4">
              <li>Processing government filings (FBR, SECP, PRA)</li>
              <li>Drafting legal agreements and contracts</li>
              <li>Maintaining your professional legal archive</li>
              <li>Verifying status on the IRIS portal</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Lock className="w-5 h-5 mr-3 text-amber-500" />
              Data Security
            </h2>
            <p className="leading-relaxed">
              We implement enterprise-grade security measures:
            </p>
            <ul className="mt-4 list-disc list-inside space-y-2 ml-4">
              <li>Encryption of sensitive data at rest and in transit</li>
              <li>Multi-factor authentication for portal access</li>
              <li>Regular audit logs of all file access and downloads</li>
              <li>Restricted physical access to local server nodes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <UserCheck className="w-5 h-5 mr-3 text-amber-500" />
              Third-Party Disclosure
            </h2>
            <p className="leading-relaxed">
              We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted government portals (like IRIS) where data submission is the primary service requested by the client.
            </p>
          </section>
        </div>

        <footer className="mt-20 pt-8 border-t border-white/5 text-sm text-slate-500">
          For any privacy-related inquiries, please contact our Compliance Officer at <span className="text-amber-500/80">privacy@getlegalsolution.com</span>
        </footer>
      </div>
    </div>
  );
}
