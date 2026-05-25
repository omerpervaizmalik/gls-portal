import React from "react";
import Sidebar from "@/components/Sidebar";
import { SubmitButton } from "@/components/SubmitButton";
import { User, Mail, Shield, Save, Camera, Upload, Link as LinkIcon, MapPin, Phone, Briefcase, GraduationCap, Award, BookOpen, Star } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { revalidatePath } from "next/cache";

// Helper to save uploaded files
async function saveUploadedFile(file: File | null, folder: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const fileExtension = file.name.split(".").pop() || "png";
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExtension}`;
  
  try {
    const result = await storage.uploadFile(folder, fileName, buffer);
    const rawPath = result?.path || result?.id || `${folder}/${fileName}`;
    const uploadedPath = rawPath.replace(/\\/g, '/');
    return `/api/storage-gateway/download?path=${encodeURIComponent(uploadedPath)}&userId=SYSTEM_PROFILE`;
  } catch (e) {
    console.error("Upload failed", e);
    return null;
  }
}

async function updateProfile(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  });
  if (!currentUser) return;

  const targetUserId = formData.get("targetUserId") as string;
  
  if (targetUserId !== currentUser.id && currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized to edit this profile");
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { profile: true }
  });
  if (!user) return;

  const name = formData.get("name") as string;
  
  // Handle basic fields
  const getStr = (key: string) => (formData.get(key) as string) || "";
  
  // Handle file uploads (if new files are provided, otherwise keep old ones)
  const profilePhotoFile = formData.get("profilePhotoFile") as File;
  const newProfilePhoto = await saveUploadedFile(profilePhotoFile, "photos");
  
  const certificatesFile = formData.get("certificatesFile") as File;
  const newCertificates = await saveUploadedFile(certificatesFile, "certificates");
  
  const attendanceCertsFile = formData.get("attendanceCertsFile") as File;
  const newAttendanceCerts = await saveUploadedFile(attendanceCertsFile, "certificates");
  
  const experienceCertsFile = formData.get("experienceCertsFile") as File;
  const newExperienceCerts = await saveUploadedFile(experienceCertsFile, "certificates");
  
  const caseDocumentsFile = formData.get("caseDocumentsFile") as File;
  const newCaseDocuments = await saveUploadedFile(caseDocumentsFile, "cases");

  const cnicDocFile = formData.get("cnicDocFile") as File;
  const newCnicDoc = await saveUploadedFile(cnicDocFile, "documents");

  const lowerCourtDocFile = formData.get("lowerCourtDocFile") as File;
  const newLowerCourtDoc = await saveUploadedFile(lowerCourtDocFile, "documents");

  const highCourtDocFile = formData.get("highCourtDocFile") as File;
  const newHighCourtDoc = await saveUploadedFile(highCourtDocFile, "documents");

  const supremeCourtDocFile = formData.get("supremeCourtDocFile") as File;
  const newSupremeCourtDoc = await saveUploadedFile(supremeCourtDocFile, "documents");

  const taxBarDocFile = formData.get("taxBarDocFile") as File;
  const newTaxBarDoc = await saveUploadedFile(taxBarDocFile, "documents");

  // Update User name
  await prisma.user.update({
    where: { id: user.id },
    data: { name }
  });

  // Upsert UserProfile
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      designation: getStr("designation"),
      experienceYears: getStr("experienceYears"),
      areasOfPractice: getStr("areasOfPractice"),
      phoneNumber: getStr("phoneNumber"),
      whatsappNumber: getStr("whatsappNumber"),
      officeAddress: getStr("officeAddress"),
      googleLocation: getStr("googleLocation"),
      researchWork: getStr("researchWork"),
      proBonoWork: getStr("proBonoWork"),
      blogLink: getStr("blogLink"),
      vlogLink: getStr("vlogLink"),
      conferences: getStr("conferences"),
      trainings: getStr("trainings"),
      foreignExposure: getStr("foreignExposure"),
      previousPositions: getStr("previousPositions"),
      prominentCases: getStr("prominentCases"),
      clientReviews: getStr("clientReviews"),
      ...(newProfilePhoto ? { profilePhoto: newProfilePhoto } : {}),
      ...(newCertificates ? { certificates: newCertificates } : {}),
      ...(newAttendanceCerts ? { attendanceCerts: newAttendanceCerts } : {}),
      ...(newExperienceCerts ? { experienceCerts: newExperienceCerts } : {}),
      ...(newCaseDocuments ? { caseDocuments: newCaseDocuments } : {}),
      cnicNo: getStr("cnicNo"),
      lowerCourtNo: getStr("lowerCourtNo"),
      highCourtNo: getStr("highCourtNo"),
      supremeCourtNo: getStr("supremeCourtNo"),
      taxBarNo: getStr("taxBarNo"),
      ...(newCnicDoc ? { cnicDoc: newCnicDoc } : {}),
      ...(newLowerCourtDoc ? { lowerCourtDoc: newLowerCourtDoc } : {}),
      ...(newHighCourtDoc ? { highCourtDoc: newHighCourtDoc } : {}),
      ...(newSupremeCourtDoc ? { supremeCourtDoc: newSupremeCourtDoc } : {}),
      ...(newTaxBarDoc ? { taxBarDoc: newTaxBarDoc } : {}),
    },
    create: {
      userId: user.id,
      designation: getStr("designation"),
      experienceYears: getStr("experienceYears"),
      areasOfPractice: getStr("areasOfPractice"),
      phoneNumber: getStr("phoneNumber"),
      whatsappNumber: getStr("whatsappNumber"),
      officeAddress: getStr("officeAddress"),
      googleLocation: getStr("googleLocation"),
      researchWork: getStr("researchWork"),
      proBonoWork: getStr("proBonoWork"),
      blogLink: getStr("blogLink"),
      vlogLink: getStr("vlogLink"),
      conferences: getStr("conferences"),
      trainings: getStr("trainings"),
      foreignExposure: getStr("foreignExposure"),
      previousPositions: getStr("previousPositions"),
      prominentCases: getStr("prominentCases"),
      clientReviews: getStr("clientReviews"),
      profilePhoto: newProfilePhoto || null,
      certificates: newCertificates || null,
      attendanceCerts: newAttendanceCerts || null,
      experienceCerts: newExperienceCerts || null,
      caseDocuments: newCaseDocuments || null,
      cnicNo: getStr("cnicNo"),
      lowerCourtNo: getStr("lowerCourtNo"),
      highCourtNo: getStr("highCourtNo"),
      supremeCourtNo: getStr("supremeCourtNo"),
      taxBarNo: getStr("taxBarNo"),
      cnicDoc: newCnicDoc || null,
      lowerCourtDoc: newLowerCourtDoc || null,
      highCourtDoc: newHighCourtDoc || null,
      supremeCourtDoc: newSupremeCourtDoc || null,
      taxBarDoc: newTaxBarDoc || null,
    }
  });

  revalidatePath('/profile');
}

export default async function ProfilePage({ searchParams }: { searchParams: { id?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Session Missing</h2>
          <p className="text-slate-500 mb-4">Please log in to access your profile.</p>
          <a href="/login" className="text-amber-500 font-bold hover:underline">Go to Login Page</a>
        </div>
      </div>
    );
  }

  const isAdmin = session.user.role === 'ADMIN';
  
  // Determine which user to load: either the one specified by ID or the current user
  const targetId = (isAdmin && searchParams.id) ? searchParams.id : session.user.id;
  
  const user = await prisma.user.findUnique({
    where: { id: targetId },
    include: { profile: true }
  });

  if (!user) {
    return (
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center max-w-md">
            <Shield className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">User Not Found</h2>
            <p className="text-slate-500 mb-6">We couldn't find the profile you're looking for. It may have been removed or you may have entered an invalid ID.</p>
            <a href="/" className="inline-block bg-amber-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-600 transition-colors">Return to Dashboard</a>
          </div>
        </main>
      </div>
    );
  }

  const p = user.profile || {} as any;

  return (
    <div className="flex h-full w-full bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-h-full pb-20">
        <header className="h-auto min-h-[4rem] bg-white border-b border-slate-200 pl-16 lg:px-8 px-4 py-3 flex items-center sticky top-0 z-20 overflow-x-auto md:overflow-x-visible scrollbar-hide">
          <h1 className="text-lg md:text-xl font-bold text-slate-800 whitespace-nowrap md:whitespace-normal">Professional Profile</h1>
        </header>


        <div className="p-8 max-w-5xl mx-auto space-y-8">
          {isAdmin && searchParams.id && (
            <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-3 rounded-xl shadow-sm text-sm font-bold flex items-center">
              <Shield className="w-5 h-5 mr-2 text-amber-600" />
              Admin Mode: You are viewing and editing the profile of {user.name || user.email}.
            </div>
          )}

          <form action={updateProfile} encType="multipart/form-data" className="space-y-8">
            <input type="hidden" name="targetUserId" value={user.id} />
            
            {/* Header Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto md:overflow-x-visible scrollbar-hide flex items-center p-6 md:p-8 space-x-4 md:space-x-6">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                  {p.profilePhoto ? (
                    <img src={p.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">Upload</span>
                  <input type="file" name="profilePhotoFile" accept="image/*" className="hidden" />
                </label>
              </div>
              <div className="flex-1 min-w-[150px]">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 whitespace-nowrap md:whitespace-normal">{user.name || "Complete your profile"}</h2>
                <p className="text-xs md:text-sm text-slate-500 font-medium whitespace-nowrap md:whitespace-normal">{p.designation || "Add your designation below"}</p>
              </div>
              <div className="shrink-0">
                <SubmitButton />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Basic Information */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 overflow-x-auto md:overflow-x-visible scrollbar-hide">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <User className="text-amber-500 w-5 h-5" />
                  <h3 className="font-bold text-slate-800 text-lg">Basic Information</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" name="name" defaultValue={user.name || ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Designation / Specialization</label>
                  <input type="text" name="designation" defaultValue={p.designation || ''} placeholder="e.g. Senior Tax Consultant" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Experience (Years)</label>
                    <input type="text" name="experienceYears" defaultValue={p.experienceYears || ''} placeholder="e.g. 10 Years" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Account Role</label>
                    <input type="text" readOnly defaultValue={user.role} className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Areas of Practice</label>
                  <textarea name="areasOfPractice" defaultValue={p.areasOfPractice || ''} rows={3} placeholder="e.g. Corporate Law, Tax Law, Civil Litigation..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                </div>
                
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Identification & Licenses</h4>
                  
                  {/* CNIC */}
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CNIC No</label>
                    <div className="flex space-x-2">
                      <input type="text" name="cnicNo" defaultValue={p.cnicNo || ''} placeholder="XXXXX-XXXXXXX-X" className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                      <input type="file" name="cnicDocFile" title="Attach Document" className="w-28 text-[10px] file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                    </div>
                    {p.cnicDoc && (
                      <div className="flex items-center justify-between mt-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                        <p className="text-xs text-emerald-700 font-medium flex items-center truncate max-w-[70%]">
                          <CheckIcon /> {p.cnicDoc.toString().split('/').pop()}
                        </p>
                        <a href={p.cnicDoc} target="_blank" rel="noopener noreferrer" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md font-bold transition-colors">
                          View File
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Lower Court */}
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lower Court License No</label>
                    <div className="flex space-x-2">
                      <input type="text" name="lowerCourtNo" defaultValue={p.lowerCourtNo || ''} placeholder="License No" className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                      <input type="file" name="lowerCourtDocFile" title="Attach Document" className="w-28 text-[10px] file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                    </div>
                    {p.lowerCourtDoc && (
                      <div className="flex items-center justify-between mt-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                        <p className="text-xs text-emerald-700 font-medium flex items-center truncate max-w-[70%]">
                          <CheckIcon /> {p.lowerCourtDoc.toString().split('/').pop()}
                        </p>
                        <a href={p.lowerCourtDoc} target="_blank" rel="noopener noreferrer" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md font-bold transition-colors">
                          View File
                        </a>
                      </div>
                    )}
                  </div>

                  {/* High Court */}
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">High Court License No</label>
                    <div className="flex space-x-2">
                      <input type="text" name="highCourtNo" defaultValue={p.highCourtNo || ''} placeholder="License No" className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                      <input type="file" name="highCourtDocFile" title="Attach Document" className="w-28 text-[10px] file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                    </div>
                    {p.highCourtDoc && (
                      <div className="flex items-center justify-between mt-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                        <p className="text-xs text-emerald-700 font-medium flex items-center truncate max-w-[70%]">
                          <CheckIcon /> {p.highCourtDoc.toString().split('/').pop()}
                        </p>
                        <a href={p.highCourtDoc} target="_blank" rel="noopener noreferrer" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md font-bold transition-colors">
                          View File
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Supreme Court */}
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Supreme Court License No</label>
                    <div className="flex space-x-2">
                      <input type="text" name="supremeCourtNo" defaultValue={p.supremeCourtNo || ''} placeholder="License No" className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                      <input type="file" name="supremeCourtDocFile" title="Attach Document" className="w-28 text-[10px] file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                    </div>
                    {p.supremeCourtDoc && (
                      <div className="flex items-center justify-between mt-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                        <p className="text-xs text-emerald-700 font-medium flex items-center truncate max-w-[70%]">
                          <CheckIcon /> {p.supremeCourtDoc.toString().split('/').pop()}
                        </p>
                        <a href={p.supremeCourtDoc} target="_blank" rel="noopener noreferrer" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md font-bold transition-colors">
                          View File
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Tax Bar */}
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tax Bar License No</label>
                    <div className="flex space-x-2">
                      <input type="text" name="taxBarNo" defaultValue={p.taxBarNo || ''} placeholder="License No" className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                      <input type="file" name="taxBarDocFile" title="Attach Document" className="w-28 text-[10px] file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                    </div>
                    {p.taxBarDoc && (
                      <div className="flex items-center justify-between mt-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                        <p className="text-xs text-emerald-700 font-medium flex items-center truncate max-w-[70%]">
                          <CheckIcon /> {p.taxBarDoc.toString().split('/').pop()}
                        </p>
                        <a href={p.taxBarDoc} target="_blank" rel="noopener noreferrer" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md font-bold transition-colors">
                          View File
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 overflow-x-auto md:overflow-x-visible scrollbar-hide">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Phone className="text-amber-500 w-5 h-5" />
                  <h3 className="font-bold text-slate-800 text-lg">Contact Information</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                    <input type="text" name="phoneNumber" defaultValue={p.phoneNumber || ''} placeholder="+92 300 1234567" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">WhatsApp Number</label>
                    <input type="text" name="whatsappNumber" defaultValue={p.whatsappNumber || ''} placeholder="+92 300 1234567" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input type="email" readOnly defaultValue={user.email} className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Office Address</label>
                  <textarea name="officeAddress" defaultValue={p.officeAddress || ''} rows={2} placeholder="Full office address..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Google Maps Link</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" name="googleLocation" defaultValue={p.googleLocation || ''} placeholder="https://maps.google.com/..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>
                </div>
              </section>

              {/* Professional Highlights */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 overflow-x-auto md:overflow-x-visible scrollbar-hide">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Award className="text-amber-500 w-5 h-5" />
                  <h3 className="font-bold text-slate-800 text-lg">Professional Highlights</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Research Work</label>
                  <textarea name="researchWork" defaultValue={p.researchWork || ''} rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pro Bono Work</label>
                  <textarea name="proBonoWork" defaultValue={p.proBonoWork || ''} rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Blog Link</label>
                    <input type="text" name="blogLink" defaultValue={p.blogLink || ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vlog Link</label>
                    <input type="text" name="vlogLink" defaultValue={p.vlogLink || ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Attach Certificates</label>
                  <input type="file" name="certificatesFile" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                  {p.certificates && (
                    <div className="flex items-center justify-between mt-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                      <p className="text-xs text-emerald-700 font-medium flex items-center truncate max-w-[70%]">
                        <CheckIcon /> {p.certificates.toString().split('/').pop()}
                      </p>
                      <a href={p.certificates} target="_blank" rel="noopener noreferrer" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md font-bold transition-colors">
                        View File
                      </a>
                    </div>
                  )}
                </div>
              </section>

              {/* Professional Development */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 overflow-x-auto md:overflow-x-visible scrollbar-hide">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <GraduationCap className="text-amber-500 w-5 h-5" />
                  <h3 className="font-bold text-slate-800 text-lg">Professional Development</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Attended Conferences</label>
                  <textarea name="conferences" defaultValue={p.conferences || ''} rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Trainings / Workshops</label>
                  <textarea name="trainings" defaultValue={p.trainings || ''} rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Foreign Exposure</label>
                  <textarea name="foreignExposure" defaultValue={p.foreignExposure || ''} rows={2} placeholder="International conferences, seminars, or work experience" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Attendance Certificates</label>
                  <input type="file" name="attendanceCertsFile" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                  {p.attendanceCerts && (
                    <div className="flex items-center justify-between mt-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                      <p className="text-xs text-emerald-700 font-medium flex items-center truncate max-w-[70%]">
                        <CheckIcon /> {p.attendanceCerts.toString().split('/').pop()}
                      </p>
                      <a href={p.attendanceCerts} target="_blank" rel="noopener noreferrer" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md font-bold transition-colors">
                        View File
                      </a>
                    </div>
                  )}
                </div>
              </section>

              {/* Work Experience */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 overflow-x-auto md:overflow-x-visible scrollbar-hide">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Briefcase className="text-amber-500 w-5 h-5" />
                  <h3 className="font-bold text-slate-800 text-lg">Work Experience</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Previously Held Positions</label>
                  <textarea name="previousPositions" defaultValue={p.previousPositions || ''} rows={4} placeholder="List previous roles, organizations, and duration..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Experience Certificates / Reference Letters</label>
                  <input type="file" name="experienceCertsFile" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                  {p.experienceCerts && (
                    <div className="flex items-center justify-between mt-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                      <p className="text-xs text-emerald-700 font-medium flex items-center truncate max-w-[70%]">
                        <CheckIcon /> {p.experienceCerts.toString().split('/').pop()}
                      </p>
                      <a href={p.experienceCerts} target="_blank" rel="noopener noreferrer" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md font-bold transition-colors">
                        View File
                      </a>
                    </div>
                  )}
                </div>
              </section>

              {/* Notable Cases & Reviews */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-5">
                    <BookOpen className="text-amber-500 w-5 h-5" />
                    <h3 className="font-bold text-slate-800 text-lg">Notable Cases</h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Prominent Cases Handled</label>
                      <textarea name="prominentCases" defaultValue={p.prominentCases || ''} rows={3} placeholder="Briefly describe notable cases, court outcomes, etc..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Attach Case Documents / Court Orders</label>
                      <input type="file" name="caseDocumentsFile" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                      {p.caseDocuments && (
                        <div className="flex items-center justify-between mt-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                          <p className="text-xs text-emerald-700 font-medium flex items-center truncate max-w-[70%]">
                            <CheckIcon /> {p.caseDocuments.toString().split('/').pop()}
                          </p>
                          <a href={p.caseDocuments} target="_blank" rel="noopener noreferrer" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md font-bold transition-colors">
                            View File
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-5">
                    <Star className="text-amber-500 w-5 h-5" />
                    <h3 className="font-bold text-slate-800 text-lg">Satisfied Clients</h3>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Client Reviews Links</label>
                    <textarea name="clientReviews" defaultValue={p.clientReviews || ''} rows={2} placeholder="Google Review link, Facebook review link, etc." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>
                </div>
              </section>

            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}


