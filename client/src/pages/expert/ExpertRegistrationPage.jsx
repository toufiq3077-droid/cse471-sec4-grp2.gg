
import { useState } from "react";

import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  User,
  Clock,
  Eye,
  Loader,
} from "lucide-react";

import StepIndicator from "../../components/expert/StepIndicator";
import FileUploadZone from "../../components/expert/FileUploadZone";
import AvailabilityBuilder from "../../components/expert/AvailabilityBuilder";
import { api } from "../../services/expertRegistrationApi";





const STEPS = ["Profile", "Certifications", "Availability", "Review"];
const SPECIALIZATIONS = ["Soil Science", "Pest Management", "Irrigation", "Organic Farming", "Crop Science", "Livestock", "Agribusiness", "Horticulture"];

export default function ExpertRegistrationPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState(null);

  const [profile, setProfile] = useState({
    name: "", bio: "", specialization: "", experience: "", fee: "", phone: "", linkedIn: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [certFiles, setCertFiles] = useState([]);
  const [availability, setAvailability] = useState({});
  const [errors, setErrors] = useState({});

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleProfileChange = (field, val) => {
    setProfile((p) => ({ ...p, [field]: val }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const addCertFiles = async (newFiles) => {
    const pending = newFiles.map((f) => ({ name: f.name, uploading: true, file: f, url: null, error: false }));
    setCertFiles((prev) => [...prev, ...pending]);

    for (let i = 0; i < newFiles.length; i++) {
      try {
        const url = await api.uploadFile(newFiles[i]);
        setCertFiles((prev) => {
          const next = [...prev];
          const idx = next.findIndex((x) => x.name === newFiles[i].name && x.uploading);
          if (idx !== -1) next[idx] = { ...next[idx], uploading: false, url };
          return next;
        });
      } catch {
        setCertFiles((prev) => {
          const next = [...prev];
          const idx = next.findIndex((x) => x.name === newFiles[i].name && x.uploading);
          if (idx !== -1) next[idx] = { ...next[idx], uploading: false, error: true };
          return next;
        });
        showToast(`Failed to upload ${newFiles[i].name}`);
      }
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImage({ name: file.name, uploading: true, url: null });
    try {
      const url = await api.uploadFile(file, "expert-profiles");
      setProfileImage({ name: file.name, uploading: false, url });
    } catch {
      setProfileImage(null);
      showToast("Profile image upload failed");
    }
  };

  const validateStep = () => {
    if (step === 0) {
      const required = ["name", "bio", "specialization", "experience", "fee"];
      const newErrs = {};
      required.forEach((f) => { if (!profile[f]) newErrs[f] = "Required"; });
      if (profile.fee && isNaN(Number(profile.fee))) newErrs.fee = "Must be a number";
      if (profile.experience && isNaN(Number(profile.experience))) newErrs.experience = "Must be a number";
      setErrors(newErrs);
      return Object.keys(newErrs).length === 0;
    }
    if (step === 1) {
      const valid = certFiles.filter((f) => f.url);
      if (valid.length === 0) { showToast("Please upload at least one certification"); return false; }
      if (certFiles.some((f) => f.uploading)) { showToast("Please wait for uploads to complete"); return false; }
    }
    if (step === 2) {
      if (Object.keys(availability).length === 0) { showToast("Please set at least one available day"); return false; }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => s + 1); };
  const back = () => setStep((s) => s - 1);

  const submit = async () => {
    if (!validateStep()) return;

    setSubmitting(true);

    try {
        const payload = {
        ...profile,
        experience: Number(profile.experience),
        fee: Number(profile.fee),
        profileImage: profileImage?.url || null,
        certifications: certFiles.filter((f) => f.url).map((f) => f.url),
        availability,
        status: "pending",
        };

        const data = await api.registerExpert(payload);

        if (data.success) {
        setSubmitted(true);
        } else {
        showToast(data.message || "Submission failed");
        }
     } catch (err) {
        showToast(err?.message ? `Network error: ${err.message}` : "Network error. Try again.");
     } finally {
        setSubmitting(false);
     }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Application Submitted!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your expert profile is under review. Our admin team will verify your certifications and approve your profile within 1–3 business days.
          </p>
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-sm text-amber-700">
            <p className="font-semibold mb-1">What happens next?</p>
            <ul className="space-y-1 list-disc ml-4">
              <li>Admin reviews your certifications</li>
              <li>Your profile gets verified badge</li>
              <li>Farmers can start booking sessions</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-white font-medium text-sm ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
          <AlertCircle size={16} /> {toast.msg}
        </div>
      )}

      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-800">Expert Registration</h1>
        <p className="text-sm text-gray-500">Complete your profile to start offering consultations</p>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <StepIndicator steps={STEPS} current={step} />

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          {/* Step 0 — Profile */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><User size={20} className="text-green-600" /> Personal & Professional Details</h2>

              {/* Profile Image */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200 flex items-center justify-center">
                  {profileImage?.url ? (
                    <img src={profileImage.url} alt="Profile" className="w-full h-full object-cover" />
                  ) : profileImage?.uploading ? (
                    <Loader size={24} className="animate-spin text-green-500" />
                  ) : (
                    <User size={32} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <label className="cursor-pointer bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-green-100 transition-colors">
                    Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">JPG or PNG, max 5MB</p>
                </div>
              </div>

              {[
                { field: "name", label: "Full Name", type: "text", placeholder: "Dr. John Smith" },
                { field: "phone", label: "Phone (optional)", type: "tel", placeholder: "+1 234 567 8900" },
                { field: "linkedIn", label: "LinkedIn URL (optional)", type: "url", placeholder: "https://linkedin.com/in/..." },
              ].map(({ field, label, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={profile[field]}
                    onChange={(e) => handleProfileChange(field, e.target.value)}
                    placeholder={placeholder}
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors[field] ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
                </div>
              ))}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Specialization</label>
                <select
                  value={profile.specialization}
                  onChange={(e) => handleProfileChange("specialization", e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.specialization ? "border-red-400" : "border-gray-200"}`}
                >
                  <option value="">Select specialization</option>
                  {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
                {errors.specialization && <p className="text-xs text-red-500 mt-1">{errors.specialization}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number" min="0"
                    value={profile.experience}
                    onChange={(e) => handleProfileChange("experience", e.target.value)}
                    placeholder="e.g. 10"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.experience ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.experience && <p className="text-xs text-red-500 mt-1">{errors.experience}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1"><DollarSign size={14} /> Fee per Session</label>
                  <input
                    type="number" min="0"
                    value={profile.fee}
                    onChange={(e) => handleProfileChange("fee", e.target.value)}
                    placeholder="e.g. 50"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.fee ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.fee && <p className="text-xs text-red-500 mt-1">{errors.fee}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => handleProfileChange("bio", e.target.value)}
                  placeholder="Describe your expertise, background, and what you can help farmers with..."
                  rows={4}
                  className={`w-full border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.bio ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio}</p>}
              </div>
            </div>
          )}

          {/* Step 1 — Certifications */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FileText size={20} className="text-green-600" /> Upload Certifications</h2>
              <p className="text-sm text-gray-500">Upload your professional certifications, degrees, or relevant credentials. These will be reviewed by our admin team.</p>
              <FileUploadZone
                label="Certification Documents"
                files={certFiles}
                onAdd={addCertFiles}
                onRemove={(i) => setCertFiles((f) => f.filter((_, idx) => idx !== i))}
                maxFiles={8}
              />
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-semibold mb-1">Accepted documents:</p>
                <ul className="list-disc ml-4 space-y-1 text-xs">
                  <li>University degrees in Agriculture or related fields</li>
                  <li>Professional certifications (ISO, govt-issued)</li>
                  <li>Training completion certificates</li>
                  <li>Awards or recognition letters</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2 — Availability */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Clock size={20} className="text-green-600" /> Set Your Availability</h2>
              <p className="text-sm text-gray-500">Select which days you're available and set your working hours. Farmers will only be able to book within these times.</p>
              <AvailabilityBuilder availability={availability} onChange={setAvailability} />
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Eye size={20} className="text-green-600" /> Review & Submit</h2>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Name", profile.name], ["Specialization", profile.specialization],
                  ["Experience", `${profile.experience} years`], ["Fee", `$${profile.fee}/session`],
                  ["Phone", profile.phone || "—"], ["LinkedIn", profile.linkedIn ? "Provided" : "—"],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className="text-gray-800 font-semibold mt-0.5 truncate">{val}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-sm">
                <p className="text-xs text-gray-400 font-medium mb-1">Bio</p>
                <p className="text-gray-700">{profile.bio}</p>
              </div>

              <div className="flex justify-between text-sm bg-gray-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">Certifications</p>
                  <p className="text-gray-800 font-semibold">{certFiles.filter((f) => f.url).length} uploaded</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">Available Days</p>
                  <p className="text-gray-800 font-semibold">{Object.keys(availability).join(", ") || "None"}</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                By submitting, you agree your profile and certifications will be reviewed by our admin team. Approval may take 1–3 business days.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={back}
              disabled={step === 0}
              className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-400 disabled:opacity-0 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-xl transition-colors"
              >
                {submitting ? <><Loader size={16} className="animate-spin" /> Submitting...</> : <><CheckCircle size={16} /> Submit Profile</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
