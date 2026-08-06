import AvailabilityBuilder from "../../components/expert/AvailabilityBuilder";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_OPTS = Array.from({ length: 24 }, (_, i) =>
  [`${String(i).padStart(2, "0")}:00`, `${String(i).padStart(2, "0")}:30`]
).flat();

function AvailabilityBuilder({ availability, onChange }) {
  const toggle = (day) => {
    if (availability[day]) {
      const next = { ...availability };
      delete next[day];
      onChange(next);
    } else {
      onChange({ ...availability, [day]: { start: "09:00", end: "17:00" } });
    }
  };

  const update = (day, field, val) =>
    onChange({ ...availability, [day]: { ...availability[day], [field]: val } });

  return (
    <div className="space-y-3">
      {DAYS.map((day) => (
        <div key={day} className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => toggle(day)}
            className={`w-32 text-left py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
              availability[day] ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {day.slice(0, 3)}
          </button>

          {availability[day] ? (
            <div className="flex items-center gap-2 flex-1">
              <select
                value={availability[day].start}
                onChange={(e) => update(day, "start", e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {TIME_OPTS.map((t) => <option key={t}>{t}</option>)}
              </select>
              <span className="text-gray-400 text-sm">to</span>
              <select
                value={availability[day].end}
                onChange={(e) => update(day, "end", e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {TIME_OPTS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          ) : (
            <span className="text-xs text-gray-400 ml-2">Unavailable</span>
          )}
        </div>
      ))}
    </div>
  );
}
export default AvailabilityBuilder;