import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cropPlannerApi } from '../../services/cropPlannerApi';
import {
  Calendar, Sprout, CheckCircle, Clock, Plus, Trash2,
  ChevronRight, ChevronDown, Store, AlertTriangle, ArrowRight,
  TrendingUp, Award, Layers, CheckSquare, Square, Loader2, Sparkles,
  Info, Leaf, MapPin, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const CROP_ICONS = {
  Rice: '🌾',
  Tomato: '🍅',
  Potato: '🥔',
  Wheat: '🌾',
  Eggplant: '🍆',
  Corn: '🌽',
  Chili: '🌶️',
  Onion: '🧅',
  Mustard: '🌼',
  Cabbage: '🥬',
};

const CATEGORY_COLORS = {
  fertilization: 'bg-amber-100 text-amber-800 border-amber-200',
  irrigation: 'bg-blue-100 text-blue-800 border-blue-200',
  pest_control: 'bg-rose-100 text-rose-800 border-rose-200',
  weeding: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  harvest: 'bg-purple-100 text-purple-800 border-purple-200',
  general: 'bg-slate-100 text-slate-800 border-slate-200',
};

export default function CropPlannerPage() {
  const { token, user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlanForListing, setSelectedPlanForListing] = useState(null);
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // New Plan Form State
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [variety, setVariety] = useState('');
  const [fieldArea, setFieldArea] = useState(1);
  const [areaUnit, setAreaUnit] = useState('acres');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Listing Conversion Form State
  const [listingPrice, setListingPrice] = useState(40);
  const [listingDesc, setListingDesc] = useState('');
  const [listingCity, setListingCity] = useState('');
  const [converting, setConverting] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, presetsRes] = await Promise.all([
        cropPlannerApi.getMyPlans(token),
        cropPlannerApi.getPresets(token),
      ]);
      setPlans(plansRes.data || []);
      setPresets(presetsRes.data || []);
      if (plansRes.data && plansRes.data.length > 0 && !expandedPlanId) {
        setExpandedPlanId(plansRes.data[0]._id);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load crop plans');
    } finally {
      setLoading(false);
    }
  }, [token, expandedPlanId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!fieldArea || fieldArea <= 0) {
      toast.error('Please enter a valid field area');
      return;
    }
    setSubmitting(true);
    try {
      await cropPlannerApi.createPlan(token, {
        cropType: selectedCrop,
        variety: variety || `${selectedCrop} High Yield`,
        fieldArea: Number(fieldArea),
        areaUnit,
        plantingDate,
        notes,
      });
      toast.success('🌱 Crop schedule generated successfully!');
      setShowCreateModal(false);
      // Reset form
      setVariety('');
      setFieldArea(1);
      fetchPlans();
    } catch (err) {
      toast.error(err.message || 'Failed to create plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTask = async (planId, taskId) => {
    try {
      const res = await cropPlannerApi.toggleTask(token, planId, taskId);
      // Update local state smoothly
      setPlans((prev) =>
        prev.map((p) => {
          if (p._id !== planId) return p;
          let completedDelta = 0;
          const newStages = p.stages.map((stg) => ({
            ...stg,
            tasks: stg.tasks.map((tsk) => {
              if (tsk._id === taskId) {
                const nowCompleted = res.data.task.completed;
                completedDelta = nowCompleted ? 1 : -1;
                return { ...tsk, completed: nowCompleted, completedAt: res.data.task.completedAt };
              }
              return tsk;
            }),
          }));
          return {
            ...p,
            completedTasks: Math.max(0, p.completedTasks + completedDelta),
            stages: newStages,
          };
        })
      );
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message || 'Failed to update task');
    }
  };

  const handleConvertToListing = async (e) => {
    e.preventDefault();
    if (!selectedPlanForListing) return;
    setConverting(true);
    try {
      await cropPlannerApi.convertToListing(token, selectedPlanForListing._id, {
        pricePerKg: Number(listingPrice),
        description: listingDesc,
        city: listingCity,
      });
      toast.success('🛒 Harvest successfully listed on the Marketplace!');
      setSelectedPlanForListing(null);
      fetchPlans();
    } catch (err) {
      toast.error(err.message || 'Failed to convert to listing');
    } finally {
      setConverting(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this crop plan?')) return;
    try {
      await cropPlannerApi.deletePlan(token, planId);
      toast.success('Crop plan deleted');
      setPlans((prev) => prev.filter((p) => p._id !== planId));
    } catch (err) {
      toast.error(err.message || 'Failed to delete plan');
    }
  };

  // Aggregated Stats
  const activePlansCount = plans.filter((p) => p.status === 'active').length;
  const totalYieldEstimateKg = plans
    .filter((p) => p.status === 'active')
    .reduce((acc, p) => acc + (p.estimatedYieldKg || 0), 0);
  const totalCompletedTasks = plans.reduce((acc, p) => acc + (p.completedTasks || 0), 0);
  const totalTasksCount = plans.reduce((acc, p) => acc + (p.totalTasks || 0), 0);

  const filteredPlans = plans.filter((p) => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white px-4 pt-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-emerald-200 text-xs uppercase tracking-widest font-semibold mb-1">
                <Sprout className="w-4 h-4" /> Smart Agronomy & Lifecycle Scheduler
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">Crop Lifecycle & Harvest Planner</h1>
              <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
                Automated growth timeline schedules, milestone task checklists, and 1-click marketplace listing upon harvest.
              </p>
            </div>
            <button
              id="btn-create-crop-plan"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-5 py-3 rounded-2xl shadow-lg transition transform active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Plan New Crop
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4">
              <span className="text-xs text-emerald-200 font-medium">Active Schedules</span>
              <p className="text-2xl font-black mt-0.5">{activePlansCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4">
              <span className="text-xs text-emerald-200 font-medium">Est. Total Harvest</span>
              <p className="text-2xl font-black mt-0.5">{totalYieldEstimateKg.toLocaleString()} <span className="text-sm font-normal">kg</span></p>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4">
              <span className="text-xs text-emerald-200 font-medium">Tasks Completed</span>
              <p className="text-2xl font-black mt-0.5">{totalCompletedTasks} <span className="text-sm font-normal">/ {totalTasksCount}</span></p>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4">
              <span className="text-xs text-emerald-200 font-medium">Crop Presets</span>
              <p className="text-2xl font-black mt-0.5">{presets.length} <span className="text-sm font-normal">varieties</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 space-y-6">

        {/* Filter Pills */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${filterStatus === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              All Plans ({plans.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${filterStatus === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Active ({plans.filter((p) => p.status === 'active').length})
            </button>
            <button
              onClick={() => setFilterStatus('listed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${filterStatus === 'listed' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Listed on Marketplace ({plans.filter((p) => p.status === 'listed').length})
            </button>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">100% Internal Agronomy Engine</span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-600 text-sm font-medium">Loading your farm crop schedules...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPlans.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <Sprout className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-slate-800">No Crop Plans Found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
              Start by scheduling your first crop. The planner will automatically create your fertilization, irrigation, and harvest milestones.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-5 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow transition"
            >
              <Plus className="w-4 h-4" /> Create First Crop Plan
            </button>
          </div>
        )}

        {/* Plans List */}
        {!loading && filteredPlans.length > 0 && (
          <div className="space-y-6">
            {filteredPlans.map((plan) => {
              const isExpanded = expandedPlanId === plan._id;
              const cropIcon = CROP_ICONS[plan.cropType.split(' ')[0]] || '🌱';
              const daysLeft = plan.daysRemaining || 0;
              const isReadyForHarvest = plan.progressPercent >= 90;

              return (
                <div
                  key={plan._id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition hover:border-slate-300"
                >
                  {/* Plan Header Card */}
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Left: Icon & Title */}
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
                          {cropIcon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-slate-900">{plan.cropType}</h2>
                            {plan.status === 'listed' ? (
                              <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Store className="w-3 h-3" /> Listed on Market
                              </span>
                            ) : isReadyForHarvest ? (
                              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                <Award className="w-3 h-3" /> Ready for Harvest
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                {plan.currentStageName}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Variety: <span className="font-semibold text-slate-700">{plan.variety}</span> · Land:{' '}
                            <span className="font-semibold text-slate-700">
                              {plan.fieldArea} {plan.areaUnit}
                            </span>{' '}
                            · Planted:{' '}
                            <span className="font-semibold text-slate-700">
                              {new Date(plan.plantingDate).toLocaleDateString()}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {plan.status !== 'listed' && (
                          <button
                            onClick={() => {
                              setSelectedPlanForListing(plan);
                              setListingDesc(`Freshly harvested ${plan.cropType} (${plan.variety}) cultivated with precision crop management.`);
                              setListingCity(user?.farmLocation?.locationName || 'Farm Depot');
                            }}
                            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-3.5 py-2 rounded-xl transition"
                          >
                            <Store className="w-4 h-4" />
                            List on Market
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedPlanId(isExpanded ? null : plan._id)}
                          className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition"
                        >
                          {isExpanded ? 'Hide Schedule' : 'View Schedule'}
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan._id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Growth Timeline Bar */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-700">
                          Day {plan.daysElapsed} of {plan.totalGrowthDays} ({plan.progressPercent}% Complete)
                        </span>
                        <span className="text-slate-500">
                          Target Harvest: <strong className="text-slate-800">{new Date(plan.targetHarvestDate).toLocaleDateString()}</strong> ({daysLeft} days left)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${plan.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Key Metrics Chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100">
                      <div className="text-center p-2 rounded-xl bg-slate-50">
                        <span className="text-[11px] text-slate-500 font-medium">Estimated Yield</span>
                        <p className="text-sm font-black text-slate-800">{plan.estimatedYieldKg?.toLocaleString()} kg</p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-slate-50">
                        <span className="text-[11px] text-slate-500 font-medium">Active Stage</span>
                        <p className="text-sm font-black text-emerald-700 truncate">{plan.currentStageName}</p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-slate-50">
                        <span className="text-[11px] text-slate-500 font-medium">Tasks Completed</span>
                        <p className="text-sm font-black text-slate-800">
                          {plan.completedTasks} / {plan.totalTasks} ({Math.round(((plan.completedTasks || 0) / (plan.totalTasks || 1)) * 100)}%)
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-slate-50">
                        <span className="text-[11px] text-slate-500 font-medium">Growth Category</span>
                        <p className="text-sm font-black text-slate-800 capitalize">{plan.category}</p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Stage & Task Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50/50 p-6 space-y-6">
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-600" /> Agronomy Stage Milestones & Checklist
                      </h3>

                      <div className="space-y-4">
                        {plan.stages.map((stage, sIdx) => {
                          const isStageActive = stage.status === 'in_progress';
                          const isStageCompleted = stage.status === 'completed';

                          return (
                            <div
                              key={stage._id || sIdx}
                              className={`bg-white rounded-2xl border p-4 transition ${
                                isStageActive
                                  ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-sm'
                                  : isStageCompleted
                                  ? 'border-slate-200 opacity-90'
                                  : 'border-slate-200 opacity-75'
                              }`}
                            >
                              {/* Stage Title */}
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                      isStageCompleted
                                        ? 'bg-emerald-500 text-white'
                                        : isStageActive
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {sIdx + 1}
                                  </span>
                                  <h4 className="font-extrabold text-sm text-slate-900">{stage.stageName}</h4>
                                  <span className="text-xs text-slate-400">
                                    (Day {stage.startDay} - {stage.endDay})
                                  </span>
                                </div>
                                <span
                                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                    isStageCompleted
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : isStageActive
                                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {isStageCompleted ? 'Completed' : isStageActive ? 'Current Stage' : 'Upcoming'}
                                </span>
                              </div>

                              {stage.description && (
                                <p className="text-xs text-slate-500 mb-3 ml-8">{stage.description}</p>
                              )}

                              {/* Stage Tasks Checklist */}
                              <div className="space-y-2 ml-8">
                                {stage.tasks.map((task) => (
                                  <div
                                    key={task._id}
                                    onClick={() => handleToggleTask(plan._id, task._id)}
                                    className={`flex items-start gap-3 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                                      task.completed
                                        ? 'bg-emerald-50/60 border-emerald-200 text-slate-600'
                                        : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-900'
                                    }`}
                                  >
                                    <div className="mt-0.5 flex-shrink-0">
                                      {task.completed ? (
                                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                                      ) : (
                                        <Square className="w-4 h-4 text-slate-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs font-semibold ${task.completed ? 'line-through opacity-70' : ''}`}>
                                        {task.taskName}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${CATEGORY_COLORS[task.category] || CATEGORY_COLORS.general}`}>
                                          {task.category.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                          Due: {new Date(task.dueDate).toLocaleDateString()} (Day {task.dueDay})
                                        </span>
                                        {task.completed && task.completedAt && (
                                          <span className="text-[10px] text-emerald-600 font-medium ml-auto">
                                            ✓ Done
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Crop Plan */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-lg">
                  🌱
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Plan New Crop Schedule</h3>
                  <p className="text-xs text-slate-500">Automated growth stages and field task checklist</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              {/* Crop Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Crop Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {presets.map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => setSelectedCrop(preset.id)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border text-center transition ${
                        selectedCrop === preset.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-200'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-2xl">{CROP_ICONS[preset.id] || '🌱'}</span>
                      <span className="text-xs">{preset.id}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{preset.totalDays} days</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Variety Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Crop Variety (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. BRRI Dhan 28, Roma VF, Diamond"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Field Size & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Field Land Size</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={fieldArea}
                    onChange={(e) => setFieldArea(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Area Unit</label>
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="acres">Acres</option>
                    <option value="decimals">Decimals / Shatak</option>
                    <option value="bigha">Bigha</option>
                    <option value="hectares">Hectares</option>
                  </select>
                </div>
              </div>

              {/* Planting Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sowing / Planting Date</label>
                <input
                  type="date"
                  required
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Live Calculation Preview */}
              {selectedCrop && (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs text-emerald-900">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-4 h-4 text-emerald-600" /> Agronomy Calculation Preview:
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <span className="text-emerald-700/80">Growth Cycle:</span>
                      <p className="font-black text-sm">
                        {presets.find((p) => p.id === selectedCrop)?.totalDays || 90} Days
                      </p>
                    </div>
                    <div>
                      <span className="text-emerald-700/80">Est. Harvest Date:</span>
                      <p className="font-black text-sm">
                        {new Date(
                          new Date(plantingDate).getTime() +
                            (presets.find((p) => p.id === selectedCrop)?.totalDays || 90) * 24 * 60 * 60 * 1000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-emerald-700/80">Est. Yield:</span>
                      <p className="font-black text-sm">
                        {Math.round(
                          (fieldArea || 1) *
                            (presets.find((p) => p.id === selectedCrop)?.yieldPerAcreKg || 5000) *
                            (areaUnit === 'decimals' ? 0.01 : areaUnit === 'bigha' ? 0.33 : areaUnit === 'hectares' ? 2.47 : 1)
                        ).toLocaleString()}{' '}
                        kg
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow transition disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Generate Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Convert Harvest to Marketplace Listing */}
      {selectedPlanForListing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-lg">
                  🛒
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">List Harvest on Marketplace</h3>
                  <p className="text-xs text-slate-500">Sell your harvested produce directly to buyers</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlanForListing(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConvertToListing} className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <p>
                  <strong>Crop:</strong> {selectedPlanForListing.cropType} ({selectedPlanForListing.variety})
                </p>
                <p>
                  <strong>Available Quantity:</strong> {selectedPlanForListing.estimatedYieldKg?.toLocaleString()} kg
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Price per Kilogram (৳ / kg)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Listing Description</label>
                <textarea
                  rows="2"
                  value={listingDesc}
                  onChange={(e) => setListingDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Farm / Pickup Location</label>
                <input
                  type="text"
                  placeholder="e.g. Gazipur Central Farm, Dhaka"
                  value={listingCity}
                  onChange={(e) => setListingCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPlanForListing(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow transition disabled:opacity-60"
                >
                  {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
                  Publish to Marketplace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
