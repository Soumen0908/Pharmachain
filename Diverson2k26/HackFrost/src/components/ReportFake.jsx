import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { reportFake } from '../services/api';
import { AlertTriangle, MapPin, FileText, Send, X } from 'lucide-react';

export default function ReportFake({ batchId, onClose }) {
    const { user } = useAuth();
    const toast = useToast();
    const [form, setForm] = useState({
        reason: '',
        location: '',
        description: '',
    });
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.reason) {
            toast.warning('Please select a reason');
            return;
        }
        setSubmitting(true);
        try {
            await reportFake({
                batchId,
                reason: form.reason,
                location: form.location,
                description: form.description,
                reporterEmail: user?.email || 'anonymous',
            });
            toast.success('Report submitted. Thank you for keeping medicines safe!');
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card glass-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-row">
                        <AlertTriangle size={20} className="text-danger" />
                        <h3>Report Suspected Counterfeit</h3>
                    </div>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                <p className="modal-desc">
                    Help protect others by reporting potentially fake or tampered medicines.
                    Your report is confidential.
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label><AlertTriangle size={14} /> Reason</label>
                        <select value={form.reason} onChange={set('reason')} required>
                            <option value="">Select reason...</option>
                            <option value="packaging">Suspicious packaging</option>
                            <option value="side-effects">Unexpected side effects</option>
                            <option value="appearance">Unusual appearance/color</option>
                            <option value="smell">Strange smell or taste</option>
                            <option value="batch-mismatch">Batch number mismatch</option>
                            <option value="expired">Sold past expiry</option>
                            <option value="other">Other concern</option>
                        </select>
                    </div>
                    <div className="auth-field">
                        <label><MapPin size={14} /> Where did you buy it? (optional)</label>
                        <input type="text" placeholder="e.g. MedPlus, Andheri West, Mumbai" value={form.location} onChange={set('location')} />
                    </div>
                    <div className="auth-field">
                        <label><FileText size={14} /> Additional details (optional)</label>
                        <textarea rows={3} placeholder="Any additional observations..." value={form.description} onChange={set('description')} />
                    </div>
                    <button type="submit" className="btn btn-primary auth-submit" disabled={submitting} style={{ background: 'linear-gradient(135deg, #ff4757, #ff6348)' }}>
                        {submitting ? <span className="spinner-sm"></span> : <><Send size={16} /> Submit Report</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
