import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  Sparkles, 
  Clock, 
  IndianRupee, 
  ShoppingBag, 
  Ruler, 
  Plus, 
  User, 
  CheckCircle2, 
  X,
  Info,
  LogOut,
  Package,
  ArrowRight,
  Truck,
  Layers,
  Check
} from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000/api/v1";

// Stitching State Machine Milestones
const ORDER_STEPS = [
  { id: "ORDER_PLACED", label: "Order Placed", desc: "Design & Fit Confirmed" },
  { id: "FABRIC_COLLECTED", label: "Fabric Received", desc: "At Boutique Workshop" },
  { id: "CUTTING_IN_PROGRESS", label: "Cutting", desc: "Pattern drafted to size" },
  { id: "STITCHING_IN_PROGRESS", label: "Stitching", desc: "Master Tailor Assembling" },
  { id: "TRIAL_READY", label: "Trial Ready", desc: "Ready for fit check" },
  { id: "COMPLETED", label: "Delivered", desc: "Garment Handed Over" }
];

export default function App() {
  // Navigation tabs: 'catalog' | 'orders'
  const [activeTab, setActiveTab] = useState("catalog");

  // Catalog State
  const [designs, setDesigns] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User State
  const [currentUser, setCurrentUser] = useState(null);
  const [userMeasurements, setUserMeasurements] = useState([]);
  const [userOrders, setUserOrders] = useState([]);

  // Modals State
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState(false);
  const [selectedDesignForOrder, setSelectedDesignForOrder] = useState(null);

  // Form States
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [selectedMeasurementId, setSelectedMeasurementId] = useState("");
  const [customizationNotes, setCustomizationNotes] = useState("");

  const [newMeasurement, setNewMeasurement] = useState({
    profile_name: "",
    garment_type: "Blouse",
    length: "",
    bust: "",
    waist: "",
    hip: "",
    shoulder: "",
    sleeve_length: "",
    front_neck_depth: "",
    back_neck_depth: "",
    special_fit_instructions: ""
  });

  const categories = ["All", "Blouse", "Kurti", "Lehenga", "Anarkali"];

  useEffect(() => {
    fetchCatalog(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    if (currentUser) {
      fetchUserOrders(currentUser.id);
      fetchUserMeasurements(currentUser.id);
    }
  }, [currentUser]);

  const fetchCatalog = async (category) => {
    setLoading(true);
    setError(null);
    try {
      const url = category === "All" 
        ? `${API_BASE}/catalog` 
        : `${API_BASE}/catalog?category=${encodeURIComponent(category)}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      setDesigns(data);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to backend on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!phoneInput || !nameInput) return;

    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: nameInput,
          phone_number: phoneInput,
          marketing_opt_in: true
        })
      });
      if (!res.ok) throw new Error("Failed to register/login");
      const user = await res.json();
      setCurrentUser(user);
    } catch (err) {
      alert("Error logging in: " + err.message);
    }
  };

  const fetchUserMeasurements = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/measurements/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserMeasurements(data);
        if (data.length > 0 && !selectedMeasurementId) {
          setSelectedMeasurementId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserOrders = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/orders/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserOrders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMeasurement = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const payload = {
      user_id: currentUser.id,
      profile_name: newMeasurement.profile_name || `${newMeasurement.garment_type} Fit`,
      garment_type: newMeasurement.garment_type,
      length: newMeasurement.length ? parseFloat(newMeasurement.length) : null,
      bust: newMeasurement.bust ? parseFloat(newMeasurement.bust) : null,
      waist: newMeasurement.waist ? parseFloat(newMeasurement.waist) : null,
      hip: newMeasurement.hip ? parseFloat(newMeasurement.hip) : null,
      shoulder: newMeasurement.shoulder ? parseFloat(newMeasurement.shoulder) : null,
      sleeve_length: newMeasurement.sleeve_length ? parseFloat(newMeasurement.sleeve_length) : null,
      front_neck_depth: newMeasurement.front_neck_depth ? parseFloat(newMeasurement.front_neck_depth) : null,
      back_neck_depth: newMeasurement.back_neck_depth ? parseFloat(newMeasurement.back_neck_depth) : null,
      special_fit_instructions: newMeasurement.special_fit_instructions
    };

    try {
      const res = await fetch(`${API_BASE}/measurements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save profile");
      await fetchUserMeasurements(currentUser.id);
      setIsNewProfileModalOpen(false);
      alert("Measurement Fit saved to your Vault!");
    } catch (err) {
      alert(err.message);
    }
  };

  // Place Stitching Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!currentUser || !selectedDesignForOrder || !selectedMeasurementId) {
      alert("Please select a saved measurement profile.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          design_id: selectedDesignForOrder.id,
          measurement_profile_id: selectedMeasurementId,
          fabric_provided_by_client: true,
          customization_notes: customizationNotes
        })
      });

      if (!res.ok) throw new Error("Failed to place order");
      const orderResult = await res.json();
      
      setSelectedDesignForOrder(null);
      setCustomizationNotes("");
      await fetchUserOrders(currentUser.id);
      setActiveTab("orders"); // Switch to live orders view
      alert("Stitching Order Placed! You can now track its live status.");
    } catch (err) {
      alert("Order Error: " + err.message);
    }
  };

  // Admin status transition simulator
  const handleAdvanceStatus = async (orderId, currentStatus) => {
    const currentIndex = ORDER_STEPS.findIndex(s => s.id === currentStatus);
    if (currentIndex >= ORDER_STEPS.length - 1) {
      alert("Order is already marked as Delivered / Completed.");
      return;
    }
    const nextStatus = ORDER_STEPS[currentIndex + 1].id;

    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        await fetchUserOrders(currentUser.id);
      }
    } catch (err) {
      alert("Failed to advance status: " + err.message);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserMeasurements([]);
    setUserOrders([]);
    setActiveTab("catalog");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur shadow-sm border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-slate-900 tracking-tight">Manya-Sutra</h1>
              <p className="text-xs text-brand-600 font-medium">Boutique & Custom Stitching</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-full text-xs font-semibold mr-1">
              <button 
                onClick={() => setActiveTab("catalog")}
                className={`px-3 py-1.5 rounded-full transition ${activeTab === 'catalog' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
              >
                Catalog
              </button>
              <button 
                onClick={() => {
                  if (!currentUser) {
                    setIsVaultOpen(true);
                  } else {
                    setActiveTab("orders");
                  }
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition ${activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Orders ({userOrders.length})</span>
              </button>
            </div>

            {/* Vault Button */}
            <button 
              onClick={() => setIsVaultOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100 transition border border-brand-200/60"
            >
              <Ruler className="w-4 h-4 text-brand-600" />
              <span className="hidden sm:inline">{currentUser ? currentUser.full_name.split(" ")[0] : "Vault"}</span>
            </button>

            {/* Logout Button */}
            {currentUser && (
              <button
                onClick={handleLogout}
                title="Logout"
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 text-xs font-semibold transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters (Visible only in Catalog tab) */}
        {activeTab === "catalog" && (
          <div className="max-w-5xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-50">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-brand-600 text-white shadow-sm shadow-brand-500/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-rose-600 text-white py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-medium mb-2 backdrop-blur-sm">
              Custom Stitching Lifecycle
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {activeTab === "catalog" ? "Boutique Design Portfolio" : "Live Stitching Order Tracker"}
            </h2>
            <p className="text-sm text-rose-100 mt-1 max-w-xl">
              {activeTab === "catalog"
                ? "Select a bespoke pattern, choose your saved measurements, and track fabric cutting to trial delivery."
                : "Real-time updates on your garments from fabric cutting to trial fitting."}
            </p>
          </div>
          {activeTab === "catalog" && (
            <button
              onClick={() => setIsVaultOpen(true)}
              className="whitespace-nowrap px-4 py-2 rounded-xl bg-white text-brand-700 font-bold text-xs shadow-md hover:bg-rose-50 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-brand-600" />
              {currentUser ? "Open Measurement Vault" : "Create Measurement Profile"}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <main className="max-w-5xl mx-auto px-4 py-6 flex-1 w-full">
        {/* ================= VIEW 1: CATALOG GRID ================= */}
        {activeTab === "catalog" && (
          <>
            {loading && (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-slate-500">Loading catalog from SQLite...</p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm my-6 text-center">
                <p className="font-semibold">{error}</p>
                <button 
                  onClick={() => fetchCatalog(selectedCategory)}
                  className="mt-3 px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg shadow hover:bg-red-700 transition"
                >
                  Retry Connection
                </button>
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {designs.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col group"
                  >
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-bold text-slate-800 shadow-sm">
                        {item.category}
                      </span>
                      <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-white text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.estimated_turnaround_days} Days
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-brand-600 transition">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Stitching From</span>
                          <span className="text-lg font-black text-slate-900 flex items-center">
                            <IndianRupee className="w-4 h-4" />
                            {item.base_stitching_price}
                          </span>
                        </div>
                        <button 
                          onClick={() => {
                            if (!currentUser) {
                              alert("Please set up your profile and measurement fit first!");
                              setIsVaultOpen(true);
                            } else if (userMeasurements.length === 0) {
                              alert("Please add at least one saved measurement in your vault to place an order!");
                              setIsVaultOpen(true);
                            } else {
                              setSelectedDesignForOrder(item);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 active:scale-95 transition shadow-sm"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Customize & Stitch
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ================= VIEW 2: LIVE ORDERS TRACKER ================= */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {!currentUser ? (
              <div className="bg-white p-8 rounded-2xl text-center border border-slate-200">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800">Please log in to track your orders</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Enter your phone number in your measurement vault.</p>
                <button 
                  onClick={() => setIsVaultOpen(true)}
                  className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Open Vault / Sign In
                </button>
              </div>
            ) : userOrders.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl text-center border border-slate-200">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800">No active orders yet</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Select a dress from our catalog and customize it to your measurements!</p>
                <button 
                  onClick={() => setActiveTab("catalog")}
                  className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              userOrders.map((order) => {
                const activeIndex = ORDER_STEPS.findIndex(s => s.id === order.status);
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Order Header */}
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={order.design_image || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100"} 
                          alt="" 
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200" 
                        />
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{order.design_title}</h4>
                          <p className="text-xs text-slate-500">
                            Fit: <span className="font-semibold text-slate-700">{order.fit_label}</span> ({order.garment_type}) • {order.created_at}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-0 pt-2 sm:pt-0">
                        <span className="font-black text-slate-900 text-sm flex items-center">
                          <IndianRupee className="w-3.5 h-3.5" /> {order.total_amount}
                        </span>
                        {/* Admin Milestone Simulator button */}
                        <button
                          onClick={() => handleAdvanceStatus(order.id, order.status)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold border border-emerald-200 transition"
                          title="Simulate Tailor Moving to Next Stage"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Advance Stage (Demo)</span>
                        </button>
                      </div>
                    </div>

                    {/* Milestone Progress Bar */}
                    <div className="p-5">
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 relative">
                        {ORDER_STEPS.map((step, idx) => {
                          const isDone = idx <= activeIndex;
                          const isCurrent = idx === activeIndex;

                          return (
                            <div key={step.id} className="flex flex-col items-center text-center relative z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                                isCurrent 
                                  ? "bg-brand-600 text-white ring-4 ring-brand-100 shadow-md scale-105" 
                                  : isDone 
                                    ? "bg-emerald-600 text-white" 
                                    : "bg-slate-100 text-slate-400"
                              }`}>
                                {isDone ? "✓" : idx + 1}
                              </div>
                              <span className={`text-[11px] font-bold leading-tight ${isCurrent ? 'text-brand-600' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                                {step.label}
                              </span>
                              <span className="text-[9px] text-slate-400 mt-0.5 leading-tight hidden md:inline">
                                {step.desc}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {order.customization_notes && (
                        <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                          <span className="font-bold text-slate-700">Custom Tailor Notes: </span>
                          "{order.customization_notes}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* ================= ORDER CHECKOUT MODAL ================= */}
      {selectedDesignForOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-sm text-slate-900">Custom Stitching Order</h3>
              </div>
              <button onClick={() => setSelectedDesignForOrder(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <img 
                  src={selectedDesignForOrder.image_url} 
                  alt="" 
                  className="w-14 h-14 rounded-lg object-cover" 
                />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{selectedDesignForOrder.title}</h4>
                  <p className="text-[11px] text-slate-500">Category: {selectedDesignForOrder.category}</p>
                  <p className="text-xs font-black text-brand-600 mt-0.5">₹{selectedDesignForOrder.base_stitching_price}</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Select Saved Measurement Fit</label>
                <select 
                  value={selectedMeasurementId}
                  onChange={(e) => setSelectedMeasurementId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 bg-white"
                  required
                >
                  {userMeasurements.map((fit) => (
                    <option key={fit.id} value={fit.id}>
                      {fit.profile_name} ({fit.garment_type}) - Bust: {fit.bust || '-'}, Waist: {fit.waist || '-'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Fabric Status</label>
                <div className="mt-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Customer bringing own fabric to boutique</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Special Instructions for Master Tailor</label>
                <textarea 
                  rows="3"
                  placeholder="e.g., Add back tie latkan, attach cotton lining, leave 1-inch extra margin"
                  value={customizationNotes}
                  onChange={(e) => setCustomizationNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                ></textarea>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition shadow-md"
                >
                  Confirm & Place Stitching Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MEASUREMENT VAULT SLIDE-OVER ================= */}
      {isVaultOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-brand-600" />
                <h2 className="font-bold text-base text-slate-900">Digital Measurement Vault</h2>
              </div>
              <button onClick={() => setIsVaultOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {!currentUser ? (
                <div className="bg-brand-50/60 p-4 rounded-2xl border border-brand-100 text-center">
                  <User className="w-10 h-10 text-brand-600 mx-auto mb-2" />
                  <h3 className="font-bold text-sm text-slate-900">Set Up Your Profile</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Enter your name and phone number to record fits and track orders.</p>
                  <form onSubmit={handleUserSubmit} className="space-y-3 text-left">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase">Your Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g., Ananya Sharma" 
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase">Phone Number</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="e.g., 9876543210" 
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 bg-white"
                      />
                    </div>
                    <button type="submit" className="w-full py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition">
                      Access My Vault
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{currentUser.full_name}</p>
                      <p className="text-[11px] text-slate-500">{currentUser.phone_number}</p>
                    </div>
                    <button onClick={handleLogout} className="text-[11px] text-brand-600 font-semibold hover:underline">
                      Switch Profile
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Saved Fits</h3>
                    <button onClick={() => setIsNewProfileModalOpen(true)} className="flex items-center gap-1 text-xs text-brand-600 font-bold hover:underline">
                      <Plus className="w-3.5 h-3.5" /> Add New Fit
                    </button>
                  </div>

                  {userMeasurements.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl p-4">
                      <Ruler className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600">No measurements saved yet.</p>
                      <button onClick={() => setIsNewProfileModalOpen(true)} className="mt-3 px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg">
                        + Add First Fit
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userMeasurements.map((fit) => (
                        <div key={fit.id} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-brand-300 transition">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-slate-900">{fit.profile_name}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                              {fit.garment_type}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                            <div><span className="text-slate-400">Bust:</span> {fit.bust || '-'}"</div>
                            <div><span className="text-slate-400">Waist:</span> {fit.waist || '-'}"</div>
                            <div><span className="text-slate-400">Length:</span> {fit.length || '-'}"</div>
                            <div><span className="text-slate-400">Shoulder:</span> {fit.shoulder || '-'}"</div>
                            <div><span className="text-slate-400">Sleeve:</span> {fit.sleeve_length || '-'}"</div>
                            <div><span className="text-slate-400">F-Neck:</span> {fit.front_neck_depth || '-'}"</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-[11px] text-slate-400">
              Manya-Sutra Digital Vault
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD MEASUREMENT MODAL ================= */}
      {isNewProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Record New Measurement Fit</h3>
              <button onClick={() => setIsNewProfileModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveMeasurement} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase">Profile Label</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., Heavy Silk Blouse" 
                    value={newMeasurement.profile_name}
                    onChange={(e) => setNewMeasurement({...newMeasurement, profile_name: e.target.value})}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase">Garment Type</label>
                  <select 
                    value={newMeasurement.garment_type}
                    onChange={(e) => setNewMeasurement({...newMeasurement, garment_type: e.target.value})}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="Blouse">Blouse</option>
                    <option value="Kurti">Kurti</option>
                    <option value="Lehenga">Lehenga</option>
                    <option value="Anarkali">Anarkali</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bust (in)</label>
                  <input 
                    type="number" step="0.5" placeholder="34"
                    value={newMeasurement.bust}
                    onChange={(e) => setNewMeasurement({...newMeasurement, bust: e.target.value})}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Waist (in)</label>
                  <input 
                    type="number" step="0.5" placeholder="28"
                    value={newMeasurement.waist}
                    onChange={(e) => setNewMeasurement({...newMeasurement, waist: e.target.value})}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Hip (in)</label>
                  <input 
                    type="number" step="0.5" placeholder="38"
                    value={newMeasurement.hip}
                    onChange={(e) => setNewMeasurement({...newMeasurement, hip: e.target.value})}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Shoulder (in)</label>
                  <input 
                    type="number" step="0.5" placeholder="14"
                    value={newMeasurement.shoulder}
                    onChange={(e) => setNewMeasurement({...newMeasurement, shoulder: e.target.value})}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Length (in)</label>
                  <input 
                    type="number" step="0.5" placeholder="14.5"
                    value={newMeasurement.length}
                    onChange={(e) => setNewMeasurement({...newMeasurement, length: e.target.value})}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Sleeve (in)</label>
                  <input 
                    type="number" step="0.5" placeholder="10"
                    value={newMeasurement.sleeve_length}
                    onChange={(e) => setNewMeasurement({...newMeasurement, sleeve_length: e.target.value})}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition"
              >
                Save Measurement to Vault
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <p>© 2025 Manya-Sutra Boutique Platform. Local SQLite Prototype.</p>
      </footer>
    </div>
  );
}
