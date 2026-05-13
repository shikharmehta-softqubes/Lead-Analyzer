import { useEffect, useMemo, useState } from 'react';
import { Building2, Gift, Percent, Plus, Save, Trash2 } from 'lucide-react';
import api from '../api/client';

const segmentLabels = ['Hot', 'Warm', 'Cold'];

const emptyForm = {
  HotelName: '',
  HotelCode: '',
  MaxDiscountPercent: 0,
  DefaultOffer: '',
  OfferRules: segmentLabels.map((leadSegment) => ({
    leadSegment,
    initialOffer: '',
    followUpOffer: '',
    autoFollowUpOffer: '',
  })),
};

const HotelOfferConfiguration = () => {
  const [hotelOffers, setHotelOffers] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadHotelOffers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/hotel-offers');
      setHotelOffers(response.data || []);
    } catch (error) {
      console.error('Failed to load hotel offers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotelOffers();
  }, []);

  const selectedHotel = useMemo(
    () => hotelOffers.find((hotel) => hotel.HotelOfferID === editingId),
    [hotelOffers, editingId],
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  const editHotel = (hotel) => {
    setEditingId(hotel.HotelOfferID);
    setFormData({
      HotelName: hotel.HotelName || '',
      HotelCode: hotel.HotelCode || '',
      MaxDiscountPercent: hotel.MaxDiscountPercent || 0,
      DefaultOffer: hotel.DefaultOffer || '',
      OfferRules: segmentLabels.map((leadSegment) => {
        const rule = hotel.OfferRules?.find((item) => item.leadSegment === leadSegment) || {};
        return {
          leadSegment,
          initialOffer: rule.initialOffer || '',
          followUpOffer: rule.followUpOffer || '',
          autoFollowUpOffer: rule.autoFollowUpOffer || '',
        };
      }),
    });
  };

  const updateRule = (leadSegment, field, value) => {
    setFormData((prev) => ({
      ...prev,
      OfferRules: prev.OfferRules.map((rule) => (
        rule.leadSegment === leadSegment ? { ...rule, [field]: value } : rule
      )),
    }));
  };

  const saveHotelOffer = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const endpoint = editingId ? `/hotel-offers/${editingId}` : '/hotel-offers';
      const method = editingId ? api.put : api.post;
      await method(endpoint, formData);
      await loadHotelOffers();
      resetForm();
      setMessage('Hotel offer configuration saved.');
    } catch (error) {
      console.error('Failed to save hotel offer:', error);
      setMessage('Unable to save hotel offer configuration.');
    } finally {
      setSaving(false);
    }
  };

  const deleteHotelOffer = async (hotelOfferId) => {
    await api.delete(`/hotel-offers/${hotelOfferId}`);
    await loadHotelOffers();
    if (editingId === hotelOfferId) resetForm();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Hotel Offer Configuration</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure default hotel offers and maximum discount limits for lead emails.</p>
        </div>
        <button onClick={resetForm} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} />
          New Hotel
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-primary-200 dark:border-primary-500/20 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 px-4 py-3 text-sm font-semibold">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
        <section className="rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-dark-700 flex items-center gap-2">
            <Building2 size={18} className="text-primary-600 dark:text-primary-400" />
            <h2 className="font-bold text-slate-900 dark:text-white">Configured Hotels</h2>
          </div>
          {loading ? (
            <div className="p-8 text-sm text-slate-500">Loading hotel offers...</div>
          ) : hotelOffers.length === 0 ? (
            <div className="p-8 text-sm text-slate-500">No hotel offer configuration found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-dark-800 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Hotel</th>
                    <th className="px-5 py-3">Max Discount</th>
                    <th className="px-5 py-3">Default Offer</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                  {hotelOffers.map((hotel) => (
                    <tr key={hotel.HotelOfferID} className={selectedHotel?.HotelOfferID === hotel.HotelOfferID ? 'bg-primary-50/60 dark:bg-primary-500/10' : ''}>
                      <td className="px-5 py-4">
                        <button onClick={() => editHotel(hotel)} className="text-left">
                          <span className="block font-bold text-slate-900 dark:text-white">{hotel.HotelName}</span>
                          <span className="text-xs text-slate-500">{hotel.HotelCode || 'No code'}</span>
                        </button>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">{hotel.MaxDiscountPercent || 0}%</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300 max-w-md">{hotel.DefaultOffer || '-'}</td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => deleteHotelOffer(hotel.HotelOfferID)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" title="Delete hotel offer">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <form onSubmit={saveHotelOffer} className="rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-primary-600 dark:text-primary-400" />
            <h2 className="font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Hotel Offer' : 'Add Hotel Offer'}</h2>
          </div>

          <input required value={formData.HotelName} onChange={(e) => setFormData((prev) => ({ ...prev, HotelName: e.target.value }))} placeholder="Hotel name" className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
          <input value={formData.HotelCode} onChange={(e) => setFormData((prev) => ({ ...prev, HotelCode: e.target.value }))} placeholder="Hotel code" className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
          <div className="relative">
            <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="number" min="0" max="100" value={formData.MaxDiscountPercent} onChange={(e) => setFormData((prev) => ({ ...prev, MaxDiscountPercent: e.target.value }))} placeholder="Maximum discount" className="input-field pl-10 bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
          </div>
          <textarea value={formData.DefaultOffer} onChange={(e) => setFormData((prev) => ({ ...prev, DefaultOffer: e.target.value }))} rows="3" placeholder="Default hotel offer" className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 resize-none" />

          <div className="space-y-3">
            {formData.OfferRules.map((rule) => (
              <div key={rule.leadSegment} className="rounded-lg border border-slate-200 dark:border-dark-700 p-3 space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">{rule.leadSegment}</p>
                <input value={rule.initialOffer} onChange={(e) => updateRule(rule.leadSegment, 'initialOffer', e.target.value)} placeholder="Fixed offer for New Lead" className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-sm" />
                <input value={rule.followUpOffer} onChange={(e) => updateRule(rule.leadSegment, 'followUpOffer', e.target.value)} placeholder="Fixed offer for Follow-up" className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-sm" />
                <p className="text-[10px] text-slate-400 italic">Auto follow-up uses the Hotel Default Offer above.</p>
              </div>
            ))}
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-60">
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HotelOfferConfiguration;
