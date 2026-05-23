"use client";

import React from 'react';
import { Scale, ArrowLeft, FileText, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-amber-500/30">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Link href="/login" className="inline-flex items-center text-amber-500 hover:text-amber-400 transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        <header className="mb-16">
          <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20">
            <Scale className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-slate-500">Last Updated: May 2026</p>
        </header>

        <div className="space-y-12">
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-3 text-amber-500" />
              Scope of Services
            </h2>
            <p className="leading-relaxed">
              Get Legal Solution (GLS) provides specialized legal consultancy, tax filing assistance, and corporate compliance services. Our platform is a management tool to facilitate these professional services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-3 text-amber-500" />
              Client Obligations
            </h2>
            <p className="leading-relaxed">
              To ensure accurate and timely filings, clients must:
            </p>
            <ul className="mt-4 list-disc list-inside space-y-2 ml-4">
              <li>Provide truthful and complete documentation.</li>
              <li>Respond to information requests within 48 business hours.</li>
              <li>Ensure all submitted credentials (e.g. IRIS passwords) are correct.</li>
              <li>Authorize GLS to act as their representative before tax authorities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-3 text-amber-500" />
              Service Deadlines
            </h2>
            <p className="leading-relaxed">
              While we strive to meet all government deadlines, GLS is not liable for penalties resulting from:
            </p>
            <ul className="mt-4 list-disc list-inside space-y-2 ml-4">
              <li>Delayed submission of documents by the client.</li>
              <li>Government portal downtimes (e.g. FBR server outages).</li>
              <li>Incorrect data provided by the client.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-3 text-amber-500" />
              Limitation of Liability
            </h2>
            <p className="leading-relaxed">
              Our advice is based on the current laws of Pakistan. We are not responsible for future legislative changes that may affect your filings or legal status.
            </p>
          </section>
        </div>

        <footer className="mt-20 pt-8 border-t border-white/5 text-sm text-slate-500">
          By accessing this portal, you agree to these terms. For queries, contact <span className="text-amber-500/80">legal@getlegalsolution.com</span>
        </footer>
      </div>
    </div>
  );
}
