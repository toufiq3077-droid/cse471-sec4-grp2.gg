import { useState, useEffect, useCallback } from "react";

import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCircle,
  AlertCircle,
  Award,
} from "lucide-react";

import { api } from "../../services/expertApi";

import {
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDate,
  MONTHS,
  DAYS,
} from "../../utils/calendarUtils";

function CalendarBooking({ expert, onBack, onBooked }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [note, setNote] = useState("");
  const [booking, setBooking] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const data = await api.getExpertSlots(expert._id, viewDate.year, viewDate.month + 1);
      // data: { "2025-06-15": ["09:00","10:00"], ... }
      setSlots(data.slots || {});
    } catch {
      showToast("Failed to load availability", "error");
    } finally {
      setLoadingSlots(false);
    }
  }, [expert._id, viewDate]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const prevMonth = () =>
    setViewDate(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  const nextMonth = () =>
    setViewDate(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot) return;
    setBooking(true);
    try {
      const result = await api.bookSlot({
        expertId: expert._id,
        consultationDate: selectedDate,
        timeSlot: selectedSlot,
        notes: note,
      });
      if (result.success) {
        showToast("Consultation booked successfully!");
        setTimeout(() => onBooked(result.consultation), 1500);
      } else {
        showToast(result.message || "Booking failed", "error");
      }
    } catch {
      showToast("Network error. Try again.", "error");
    } finally {
      setBooking(false);
    }
  };

  const todayStr = formatDate(today);
  const availableDays = new Set(Object.keys(slots));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-white font-medium text-sm transition-all ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
          {toast.type === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <button onClick={onBack} className="flex items-center gap-2 text-green-700 hover:text-green-900 mb-6 font-medium text-sm">
        <ChevronLeft size={18} /> Back to Experts
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expert Detail */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-4 overflow-hidden">
              {expert.profileImage ? (
                <img src={expert.profileImage} alt={expert.name} className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-white" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-800">{expert.name}</h2>
            <p className="text-green-600 font-medium text-sm mb-3">{expert.specialization}</p>
            {expert.bio && <p className="text-gray-500 text-xs leading-relaxed mb-4">{expert.bio}</p>}

            <div className="w-full space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Experience</span>
                <span className="font-semibold text-gray-800">{expert.experience} years</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Fee</span>
                <span className="font-bold text-green-700">${expert.fee}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Rating</span>
                <span className="font-semibold text-amber-500">★ {(expert.rating || 0).toFixed(1)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Sessions</span>
                <span className="font-semibold text-gray-800">{expert.totalSessions || 0}</span>
              </div>
            </div>
          </div>

          {/* Certifications */}
          {expert.certifications?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Certifications</p>
              <div className="space-y-1">
                {expert.certifications.map((cert, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-green-50 rounded-lg px-3 py-2">
                    <Award size={12} className="text-green-600" />
                    {cert}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h3 className="font-bold text-gray-800">{MONTHS[viewDate.month]} {viewDate.year}</h3>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {loadingSlots ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} />)}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === todayStr;
                const isPast = dateStr < todayStr;
                const hasSlots = availableDays.has(dateStr);
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={day}
                    disabled={isPast || !hasSlots}
                    onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); }}
                    className={`
                      relative aspect-square rounded-xl text-sm font-medium transition-all
                      ${isSelected ? "bg-green-600 text-white shadow-md scale-105" : ""}
                      ${!isSelected && hasSlots && !isPast ? "bg-green-50 text-green-800 hover:bg-green-100 cursor-pointer" : ""}
                      ${!hasSlots || isPast ? "text-gray-300 cursor-not-allowed" : ""}
                      ${isToday && !isSelected ? "ring-2 ring-green-400" : ""}
                    `}
                  >
                    {day}
                    {hasSlots && !isPast && (
                      <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-green-500"}`} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> Available</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-600" /> Selected</div>
          </div>
        </div>

        {/* Slot & Booking */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-green-600" /> Available Times
          </h3>

          {!selectedDate ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm text-center">
              Select a date to see available time slots
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-3">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-5">
                {(slots[selectedDate] || []).map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedSlot(time)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                      selectedSlot === time
                        ? "bg-green-600 text-white border-green-600 shadow-md"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-green-400 hover:bg-green-50"
                    }`}
                  >
                    {time}
                  </button>
                ))}

                {(slots[selectedDate] || []).length === 0 && (
                  <p className="col-span-2 text-center text-sm text-gray-400 py-4">No slots on this date</p>
                )}
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for the expert (optional)..."
                className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-400 mb-5"
                rows={3}
              />

              {selectedDate && selectedSlot && (
                <div className="bg-green-50 rounded-xl p-4 mb-5 text-sm border border-green-100">
                  <p className="font-semibold text-green-800 mb-1">Booking Summary</p>
                  <p className="text-gray-600">Expert: <span className="font-medium text-gray-800">{expert.name}</span></p>
                  <p className="text-gray-600">Date: <span className="font-medium text-gray-800">{selectedDate}</span></p>
                  <p className="text-gray-600">Time: <span className="font-medium text-gray-800">{selectedSlot}</span></p>
                  <p className="text-gray-600">Fee: <span className="font-bold text-green-700">${expert.fee}</span></p>
                </div>
              )}

              <button
                onClick={handleBook}
                disabled={!selectedSlot || booking}
                className="mt-auto w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {booking ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Booking...</>
                ) : (
                  <><CheckCircle size={18} /> Confirm Booking</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 

export default CalendarBooking;