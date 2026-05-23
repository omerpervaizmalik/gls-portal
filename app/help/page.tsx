"use client";

import React from 'react';
import { HelpCircle, ArrowLeft, Terminal, Key, Shield, MessageSquare, Phone } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-amber-500/30">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Link href="/login" className="inline-flex items-center text-amber-500 hover:text-amber-400 transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        <header className="mb-16">
          <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20">
            <HelpCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Help Center</h1>
          <p className="text-slate-500">Find answers and support for the GLS Portal</p>
        </header>

        <div className="space-y-12">
          {/* Section: IRIS Sync */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <Terminal className="w-5 h-5 mr-3 text-amber-500" />
              How to Capture IRIS Session
            </h2>
            <div className="space-y-4 text-sm leading-relaxed">
              <div className="flex items-start">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold mr-4 shrink-0 mt-0.5">1</span>
                <p>Run <code className="bg-white/10 px-2 py-0.5 rounded text-amber-400">python scripts/iris_capture_session.py</code> in your project terminal.</p>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold mr-4 shrink-0 mt-0.5">2</span>
                <p>A browser will open. Log in to the FBR IRIS portal as usual.</p>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold mr-4 shrink-0 mt-0.5">3</span>
                <p>Once you see your IRIS dashboard, return to the terminal and press Enter.</p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <Shield className="w-5 h-5 mr-3 text-amber-500" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-semibold mb-2">My session expired. What do I do?</h3>
                <p className="text-sm">IRIS sessions naturally expire after ~12 hours. Simply repeat the capture process to refresh your token.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Can I update my profile photo?</h3>
                <p className="text-sm">Yes. In the Client Profile section, click the photo box while in "Edit" mode to upload a new image.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Is my data secure?</h3>
                <p className="text-sm">Absolutely. All data is encrypted and local session files are git-ignored to prevent accidental exposure.</p>
              </div>
            </div>
          </section>

          {/* Contact Support */}
          <section className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Need Direct Support?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center p-4 bg-slate-900 rounded-2xl border border-white/5">
                <MessageSquare className="w-6 h-6 text-amber-500 mr-4" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Email Us</p>
                  <p className="text-sm font-semibold text-white">support@getlegalsolution.com</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-slate-900 rounded-2xl border border-white/5">
                <Phone className="w-6 h-6 text-amber-500 mr-4" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Call Support</p>
                  <p className="text-sm font-semibold text-white">+92 301 4991700</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
