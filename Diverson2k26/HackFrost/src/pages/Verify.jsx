import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { QRCodeCanvas } from 'qrcode.react';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { calculateTrustScore } from '../services/riskEngine';
import { recordScan, getScanHistory, getBatchMetadata, getAllMetadata } from '../services/offChainStore';
import { calculateReward } from '../services/rewardEngine';
import { addRewardPoints, getRewards } from '../services/offChainStore';
import { saveMedicine, getBatchReports, verifyBatch as serverVerifyBatch, verifyScratchCode, getBatchDetails as serverGetBatchDetails } from '../services/api';
import { ShieldCheck, ShieldAlert, ShieldX, Search, ClipboardList, MapPin, Factory, User, ScanLine, Lock, Unlock, AlertTriangle, CheckCircle2, Clock, Eye, Bot, Flag, Bookmark, Info, Hash, RefreshCw, QrCode, Download, Package, FlaskConical } from 'lucide-react';
import RadarChart from '../components/RadarChart';
import ScratchCard from '../components/ScratchCard';
import VerificationCertificate from '../components/VerificationCertificate';
import ReportFake from '../components/ReportFake';
import './Verify.css';

const STATUS_NAMES = ['Manufactured', 'In Transit (Dist)', 'At Distributor', 'In Transit (Ret)', 'At Retailer', 'Inspector Approved', 'Sold', 'Recalled', 'Flagged'];
const STATUS_COLORS = ['badge-info', 'badge-warning', 'badge-teal', 'badge-warning', 'badge-purple', 'badge-success', 'badge-success', 'badge-danger', 'badge-danger'];

export default function Verify() {
    const { batchId: paramBatchId } = useParams();
    const [searchParams] = useSearchParams();
    const { readOnlyContract, contract, account, isConnected, truncateAddress } = useWeb3();
    const { user, isAuthenticated } = useAuth();
    const toast = useToast();
    const [batchIdInput, setBatchIdInput] = useState('');
    const [scratchInput, setScratchInput] = useState('');
    const [batchData, setBatchData] = useState(null);
    const [history, setHistory] = useState([]);
    const [trustResult, setTrustResult] = useState(null);
    const [activationResult, setActivationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rewards, setRewards] = useState(null);
    const [scanCount, setScanCount] = useState(0);
    const [showReport, setShowReport] = useState(false);
    const [batchFlagged, setBatchFlagged] = useState(false);
    const [verifyQR, setVerifyQR] = useState(null);
    const qrCanvasRef = useRef(null);

    useEffect(() => {
        const bid = paramBatchId || searchParams.get('batch');
        const scratchFromQR = searchParams.get('scratch');
        if (scratchFromQR) {
            setScratchInput(scratchFromQR.toUpperCase());
        }
        if (bid) {
            setBatchIdInput(bid);
            handleVerify(bid);
        }
    }, [paramBatchId, searchParams]);

    async function handleVerify(overrideBatchId) {
        const batchId = overrideBatchId || batchIdInput;
        if (!batchId) { setError('Enter a batch ID'); return; }

        setLoading(true);
        setError('');
        setBatchData(null);
        setHistory([]);
        setTrustResult(null);
        setActivationResult(null);

        try {
            const c = readOnlyContract || contract;

            // If no blockchain connection, try server API
            if (!c) {
                try {
                    const result = await serverVerifyBatch(batchId);
                    if (!result.verified) {
                        setError(result.message || 'Batch not found');
                        setLoading(false);
                        return;
                    }
                    // Map server response to batchData shape
                    const bc = result.blockchain || {};
                    const batch = {
                        batchIdHash: bc.batchIdHash || batchId,
                        metadataHash: bc.metadataHash || '',
                        manufacturer: bc.manufacturer || '',
                        currentHolder: bc.currentHolder || '',
                        status: bc.status ?? 0,
                        activated: bc.activated || false,
                        activatedBy: bc.activatedBy || ethers.ZeroAddress,
                        firstScanBlock: bc.firstScanBlock || 0,
                        inspectorApproved: bc.inspectorApproved || false,
                        inspectorAddress: bc.inspectorAddress || ethers.ZeroAddress,
                        parentBatchId: bc.parentBatchId || ethers.ZeroHash,
                        recalled: bc.recalled || false,
                        recallReason: bc.recallReason || '',
                        createdAt: bc.createdAt || 0,
                        updatedAt: bc.updatedAt || 0,
                        meta: result.medicine || null,
                    };
                    const historyData = (result.supplyChain || []).map(r => ({
                        from: r.from, to: r.to, timestamp: r.timestamp,
                        status: r.status, location: r.location || '',
                    }));

                    recordScan(batchId, account || 'anonymous', 'Web Portal');
                    const scans = getScanHistory(batchId);
                    setScanCount(scans.length);
                    const trust = calculateTrustScore(batch, historyData, scans);

                    setBatchData(batch);
                    setHistory(historyData);
                    setTrustResult(trust);
                    // Generate verification QR with batch + scratch code
                    const batchNum = result.medicine?.batchNumber || batchId;
                    const scratchMeta = result.medicine?.scratchCode || '';
                    setVerifyQR({
                        qrData: JSON.stringify({ batchNumber: batchNum, scratchCode: scratchMeta }),
                        batchNumber: batchNum,
                        scratchCode: scratchMeta,
                        drugName: result.medicine?.drugName || result.medicine?.medicineName || 'Unknown',
                        verifiedAt: new Date().toISOString(),
                        trustScore: trust.score,
                    });
                    setLoading(false);
                    return;
                } catch (apiErr) {
                    setError('Cannot connect to blockchain or server. Please try again.');
                    setLoading(false);
                    return;
                }
            }

            let batchHash = batchId;
            if (!batchId.startsWith('0x')) {
                batchHash = ethers.keccak256(ethers.toUtf8Bytes(batchId));
            }

            const details = await c.getBatchDetails(batchHash);
            const h = await c.getBatchHistory(batchHash);

            const batch = {
                batchIdHash: batchHash,
                metadataHash: details[1],
                manufacturer: details[2],
                currentHolder: details[3],
                status: Number(details[4]),
                activated: details[5],
                activatedBy: details[6],
                firstScanBlock: Number(details[7]),
                inspectorApproved: details[8],
                inspectorAddress: details[9],
                parentBatchId: details[10],
                recalled: details[11],
                recallReason: details[12],
                createdAt: Number(details[13]),
                updatedAt: Number(details[14]),
            };

            const historyData = h.map(r => ({
                from: r[0], to: r[1], timestamp: Number(r[2]),
                status: Number(r[3]), location: r[4],
            }));

            let meta = getBatchMetadata(batchId.startsWith('0x') ? batchId : batchId);
            let allMeta = null;
            if (!meta) {
                const all = getAllMetadata();
                allMeta = Object.values(all).find(m => m.batchIdHash === batchHash);
            }
            // If no local metadata, fetch from server API (batch_metadata.json)
            if (!meta && !allMeta) {
                try {
                    const serverResult = await serverVerifyBatch(batchId);
                    if (serverResult.verified && serverResult.medicine) {
                        const med = serverResult.medicine;
                        allMeta = {
                            drugName: med.name || med.medicineName,
                            medicineName: med.name || med.medicineName,
                            batchNumber: med.batchNumber || batchId,
                            expiryDate: med.expiryDate,
                            mfgDate: med.mfgDate,
                            composition: med.composition,
                            dosageForm: med.dosageForm,
                            manufacturerName: med.manufacturer,
                            manufacturingLocation: med.location || null,
                            scratchCode: med.scratchCode || '',
                            batchIdHash: batchHash,
                        };
                    }
                } catch (e) {
                    console.warn('Could not fetch metadata from server:', e.message);
                }
            }
            batch.meta = meta || allMeta;

            recordScan(batchId, account || 'anonymous', 'Web Portal');
            const scans = getScanHistory(batchId);
            setScanCount(scans.length);

            const trust = calculateTrustScore(batch, historyData, scans);

            setBatchData(batch);
            setHistory(historyData);
            setTrustResult(trust);
            // Generate verification QR with batch + scratch code
            const batchNum = batch.meta?.batchNumber || batchId;
            const scratchMeta = batch.meta?.scratchCode || '';
            setVerifyQR({
                qrData: JSON.stringify({ batchNumber: batchNum, scratchCode: scratchMeta }),
                batchNumber: batchNum,
                scratchCode: scratchMeta,
                drugName: batch.meta?.drugName || batch.meta?.medicineName || 'Unknown',
                verifiedAt: new Date().toISOString(),
                trustScore: trust.score,
            });
        } catch (err) {
            // If direct blockchain fails, fall back to server API
            try {
                const result = await serverVerifyBatch(batchId);
                if (result.verified) {
                    const bc = result.blockchain || {};
                    const batch = {
                        batchIdHash: bc.batchIdHash || bc.batchId || batchId,
                        metadataHash: bc.metadataHash || '',
                        manufacturer: bc.manufacturer || '',
                        currentHolder: bc.currentHolder || '',
                        status: bc.statusCode ?? bc.status ?? 0,
                        activated: bc.activated || false,
                        activatedBy: bc.activatedBy || ethers.ZeroAddress,
                        firstScanBlock: bc.firstScanBlock || 0,
                        inspectorApproved: bc.inspectorApproved || false,
                        inspectorAddress: bc.inspectorAddress || ethers.ZeroAddress,
                        parentBatchId: bc.parentBatchId || ethers.ZeroHash,
                        recalled: bc.recalled || false,
                        recallReason: bc.recallReason || '',
                        createdAt: bc.createdAt || 0,
                        updatedAt: bc.updatedAt || 0,
                        meta: result.medicine ? {
                            drugName: result.medicine.name || result.medicine.medicineName,
                            medicineName: result.medicine.name || result.medicine.medicineName,
                            batchNumber: result.medicine.batchNumber || batchId,
                            expiryDate: result.medicine.expiryDate,
                            mfgDate: result.medicine.mfgDate,
                            composition: result.medicine.composition,
                            dosageForm: result.medicine.dosageForm,
                            manufacturerName: result.medicine.manufacturer,
                            scratchCode: result.medicine.scratchCode || '',
                        } : null,
                    };
                    const historyData = (result.supplyChain || []).map(r => ({
                        from: r.from, to: r.to, timestamp: r.timestamp,
                        status: typeof r.status === 'number' ? r.status : 0,
                        location: r.location || '',
                    }));
                    recordScan(batchId, account || 'anonymous', 'Web Portal');
                    const scans = getScanHistory(batchId);
                    setScanCount(scans.length);
                    const trust = calculateTrustScore(batch, historyData, scans);
                    setBatchData(batch);
                    setHistory(historyData);
                    setTrustResult(trust);
                    const batchNum = batch.meta?.batchNumber || batchId;
                    const scratchMeta = batch.meta?.scratchCode || '';
                    setVerifyQR({
                        qrData: JSON.stringify({ batchNumber: batchNum, scratchCode: scratchMeta }),
                        batchNumber: batchNum,
                        scratchCode: scratchMeta,
                        drugName: batch.meta?.drugName || batch.meta?.medicineName || 'Unknown',
                        verifiedAt: new Date().toISOString(),
                        trustScore: trust.score,
                    });
                    return;
                }
            } catch (fallbackErr) {
                console.error('Server fallback also failed:', fallbackErr.message);
            }
            setError(err.reason || 'Batch not found. Please check the ID and try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleActivate() {
        if (!scratchInput) { setError('Enter the scratch code from the medicine packaging'); return; }

        setLoading(true);
        setError('');

        const batchNumber = batchData?.meta?.batchNumber || batchIdInput;

        // If wallet is connected, try MetaMask transaction first
        if (contract && isConnected) {
            try {
                const batchHash = batchData.batchIdHash;
                // Send activation transaction through MetaMask
                const tx = await contract.activateProduct(batchHash, scratchInput);
                const receipt = await tx.wait();

                const updatedDetails = await contract.getBatchDetails(batchHash);
                const isFirst = updatedDetails[6].toLowerCase() === account.toLowerCase();

                if (isFirst) {
                    const reward = calculateReward(true, 0);
                    addRewardPoints(account, reward.points, 'First product activation');
                    setRewards(getRewards(account));
                    setActivationResult({ firstActivation: true, reward });
                } else {
                    setActivationResult({ firstActivation: false });
                }

                handleVerify(batchIdInput);
                setLoading(false);
                return;
            } catch (err) {
                console.warn('MetaMask activation failed, trying server fallback:', err.message);
                // If user rejected the tx or it's a clear error, show it
                if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
                    setError('Transaction rejected in MetaMask.');
                    setLoading(false);
                    return;
                }
                if (err.reason?.includes('Invalid scratch code')) {
                    setError('Invalid scratch code! This may be a counterfeit product.');
                    setLoading(false);
                    return;
                }
                if (err.reason?.includes('not yet inspector-approved')) {
                    setError('Product is not yet inspector-approved for sale.');
                    setLoading(false);
                    return;
                }
                // Fall through to server API for other errors
            }
        }

        // Server API fallback (no wallet or MetaMask tx failed)
        try {
            const result = await verifyScratchCode(batchNumber, scratchInput);
            setActivationResult({
                firstActivation: result.firstActivation,
                reward: result.firstActivation ? calculateReward(true, 0) : null,
            });
            handleVerify(batchIdInput);
        } catch (err) {
            setError(err.message || 'Activation failed');
        } finally { setLoading(false); }
    }

    function getTrustColor(score) {
        if (score >= 80) return 'var(--success)';
        if (score >= 50) return 'var(--warning)';
        return 'var(--danger)';
    }

    function getVerdict() {
        if (!batchData) return null;
        if (batchData.recalled) return { icon: <ShieldX size={32} />, text: 'RECALLED', color: 'var(--danger)', bg: 'var(--danger-bg)', desc: `Reason: ${batchData.recallReason}` };
        if (batchData.status === 8) return { icon: <ShieldAlert size={32} />, text: 'FLAGGED', color: 'var(--danger)', bg: 'var(--danger-bg)', desc: 'This batch has been flagged by an inspector' };
        if (trustResult && trustResult.score < 40) return { icon: <AlertTriangle size={32} />, text: 'SUSPICIOUS', color: 'var(--warning)', bg: 'var(--warning-bg)', desc: 'AI detection flagged anomalies' };
        if (batchData.inspectorApproved) return { icon: <ShieldCheck size={32} />, text: 'VERIFIED', color: 'var(--success)', bg: 'var(--success-bg)', desc: 'Inspector approved, full chain verified' };
        return { icon: <Search size={32} />, text: 'UNVERIFIED', color: 'var(--info)', bg: 'var(--info-bg)', desc: 'Awaiting inspector approval' };
    }

    const verdict = getVerdict();

    async function handleSaveToProfile() {
        if (!isAuthenticated) { toast.warning('Please login to save medicines'); return; }
        try {
            await saveMedicine({
                name: batchData.meta?.drugName || 'Unknown',
                batchId: batchData.meta?.batchId || batchData.batchIdHash.slice(0, 16),
                trustScore: trustResult?.score,
                status: STATUS_NAMES[batchData.status],
            });
            toast.success('Medicine saved to your profile');
        } catch (err) { toast.error(err.message); }
    }

    // Check if batch was previously reported
    useEffect(() => {
        if (batchData?.batchIdHash) {
            getBatchReports(batchData.batchIdHash).then(data => {
                setBatchFlagged(data.flagged);
            }).catch(() => { });
        }
    }, [batchData]);

    function getRiskEmoji(score) {
        if (score >= 70) return '🟢';
        if (score >= 40) return '🟠';
        return '🔴';
    }

    function downloadVerifyQR() {
        const canvas = document.getElementById('verify-qr-canvas');
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `pharmachain-verify-${verifyQR?.batchNumber || 'batch'}.png`;
        a.click();
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Verify Medicine</h1>
                <p className="page-subtitle">Check the authenticity of your medicine — know it's safe before you consume it</p>
            </div>

            {/* Search */}
            <div className="verify-form animate-fade-up">
                <input
                    className="input-field"
                    placeholder="Enter Batch ID (e.g. PCM-2026-001) or scan QR code"
                    value={batchIdInput}
                    onChange={e => setBatchIdInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleVerify()}
                />
                <button className="btn btn-primary" onClick={() => handleVerify()} disabled={loading}>
                    {loading ? <><Clock size={16} /> Verifying...</> : <><Search size={16} /> Verify</>}
                </button>
            </div>
            {error && <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-lg)', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={14} /> {error}</div>}

            {batchData && (
                <>
                {/* ═══════════════════════════════════════════ */}
                {/* SECTION 1: MANUFACTURER VERIFICATION       */}
                {/* ═══════════════════════════════════════════ */}
                <div className="verify-section-divider animate-fade-up" style={{ animationDelay: '0.1s' }}>
                    <div className="section-divider-icon"><Factory size={20} /></div>
                    <div>
                        <h2 className="section-divider-title">Manufacturer Verification</h2>
                        <p className="section-divider-desc">Batch origin, product details, and supply chain journey from the manufacturer</p>
                    </div>
                </div>

                <div className="verify-results animate-fade-up" style={{ animationDelay: '0.15s' }}>
                    {/* Main Column */}
                    <div className="verify-main">
                        {/* Verdict */}
                        {verdict && (
                            <div className="verdict-section" style={{ background: verdict.bg, borderColor: verdict.color }}>
                                <div className="verdict-icon">{verdict.icon}</div>
                                <div className="verdict-text" style={{ color: verdict.color }}>{verdict.text}</div>
                                <div className="verdict-desc">{verdict.desc}</div>
                                {trustResult && <VerificationCertificate batchData={batchData} trustResult={trustResult} verdict={verdict} />}
                            </div>
                        )}

                        {/* Product Details */}
                        <div className="product-card">
                            <h3><ClipboardList size={16} /> Product Details</h3>
                            <div className="product-grid">
                                <div className="product-field">
                                    <span className="product-label">Drug Name</span>
                                    <span className="product-value">{batchData.meta?.drugName || batchData.meta?.medicineName || batchData.meta?.name || 'Unknown'}</span>
                                </div>
                                <div className="product-field">
                                    <span className="product-label">Batch ID</span>
                                    <span className="product-value mono">{batchData.meta?.batchId || batchData.batchIdHash.slice(0, 16) + '...'}</span>
                                </div>
                                <div className="product-field">
                                    <span className="product-label">Expiry Date</span>
                                    <span className="product-value">{batchData.meta?.expiryDate || 'N/A'}</span>
                                </div>
                                <div className="product-field">
                                    <span className="product-label">Location</span>
                                    <span className="product-value">{batchData.meta?.manufacturingLocation || 'N/A'}</span>
                                </div>
                                <div className="product-field">
                                    <span className="product-label">Manufacturer</span>
                                    <span className="product-value address">{truncateAddress(batchData.manufacturer)}</span>
                                </div>
                                <div className="product-field">
                                    <span className="product-label">Status</span>
                                    <span className={`badge ${batchData.recalled ? 'badge-danger' : 'badge-info'}`}>{STATUS_NAMES[batchData.status]}</span>
                                </div>
                                <div className="product-field">
                                    <span className="product-label">Inspector</span>
                                    <span className="product-value">{batchData.inspectorApproved ? <><CheckCircle2 size={12} /> {truncateAddress(batchData.inspectorAddress)}</> : <><Clock size={12} /> Pending</>}</span>
                                </div>
                                <div className="product-field">
                                    <span className="product-label">Total Scans</span>
                                    <span className="product-value">{scanCount}</span>
                                </div>
                                {batchData.activated && (
                                    <div className="product-field">
                                        <span className="product-label">First Activated</span>
                                        <span className="product-value">Block #{batchData.firstScanBlock} by {truncateAddress(batchData.activatedBy)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chain of Custody */}
                        <div className="history-card">
                            <h3><ScanLine size={16} /> Chain of Custody Journey</h3>
                            <div className="custody-timeline">
                                {history.map((h, i) => (
                                    <div key={i} className="custody-step animate-slide-right" style={{ animationDelay: `${i * 0.1}s` }}>
                                        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div className="custody-dot" style={{ background: i === history.length - 1 ? 'var(--brand)' : 'var(--text-muted)' }}></div>
                                            {i < history.length - 1 && <div className="custody-line"></div>}
                                        </div>
                                        <div className="custody-info">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span className={`badge ${STATUS_COLORS[h.status]}`}>{STATUS_NAMES[h.status]}</span>
                                                <span className="custody-time">{new Date(h.timestamp * 1000).toLocaleString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                {h.from !== '0x0000000000000000000000000000000000000000' && (
                                                    <span className="custody-addr">From: {truncateAddress(h.from)}</span>
                                                )}
                                                <span className="custody-addr">To: {truncateAddress(h.to)}</span>
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={10} /> {h.location}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar — Transparency & QR */}
                    <div className="verify-sidebar">
                        {/* Transparency Panel */}
                        <div className="trust-card">
                            <h3><Eye size={16} /> Transparency</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}><Hash size={12} /> Blockchain Hash</span>
                                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{batchData.batchIdHash.slice(0, 12)}...</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}><RefreshCw size={12} /> Last Updated</span>
                                    <span>{batchData.updatedAt ? new Date(batchData.updatedAt * 1000).toLocaleString() : 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}><Clock size={12} /> Created</span>
                                    <span>{new Date(batchData.createdAt * 1000).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}><Eye size={12} /> Data Sources</span>
                                    <span>Blockchain + AI + Inspector</span>
                                </div>
                            </div>
                        </div>

                        {/* Verification QR Code */}
                        {verifyQR && (
                            <div className="trust-card verify-qr-card">
                                <h3><QrCode size={16} /> Verification QR Code</h3>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                                    Unique QR generated for this batch. Anyone can scan it to instantly verify authenticity.
                                </p>
                                <div className="verify-qr-wrapper">
                                    <QRCodeCanvas
                                        id="verify-qr-canvas"
                                        value={verifyQR.qrData}
                                        size={180}
                                        level="H"
                                        includeMargin={true}
                                        imageSettings={{
                                            src: '/images/favicon.ico',
                                            height: 28,
                                            width: 28,
                                            excavate: true,
                                        }}
                                        style={{ borderRadius: '10px', display: 'block', margin: '0 auto' }}
                                    />
                                </div>
                                <div className="verify-qr-meta">
                                    <div className="verify-qr-row"><span>Batch</span><strong>{verifyQR.batchNumber}</strong></div>
                                    <div className="verify-qr-row"><span>Drug</span><strong>{verifyQR.drugName}</strong></div>
                                    <div className="verify-qr-row"><span>Scratch Code</span><strong style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>{verifyQR.scratchCode || '—'}</strong></div>
                                    <div className="verify-qr-row">
                                        <span>Trust Score</span>
                                        <strong style={{ color: verifyQR.trustScore >= 70 ? 'var(--success)' : verifyQR.trustScore >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
                                            {verifyQR.trustScore}/100
                                        </strong>
                                    </div>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={downloadVerifyQR} style={{ width: '100%', marginTop: '12px' }}>
                                    <Download size={14} /> Download QR Code
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════ */}
                {/* SECTION 2: CONSUMER VALIDATION              */}
                {/* ═══════════════════════════════════════════ */}
                <div className="verify-section-divider animate-fade-up" style={{ animationDelay: '0.25s' }}>
                    <div className="section-divider-icon validation"><FlaskConical size={20} /></div>
                    <div>
                        <h2 className="section-divider-title">Consumer Validation</h2>
                        <p className="section-divider-desc">Trust analysis, AI risk alerts, and reporting tools for this medicine batch</p>
                    </div>
                </div>

                <div className="verify-results animate-fade-up" style={{ animationDelay: '0.3s' }}>
                    {/* Main Column — Analysis */}
                    <div className="verify-main">
                        {/* Counterfeit Alert */}
                        {batchFlagged && (
                            <div className="product-card" style={{ border: '1px solid rgba(194, 90, 90,0.3)' }}>
                                <h3 style={{ color: '#c25a5a' }}><AlertTriangle size={16} /> Counterfeit Alert</h3>
                                <p style={{ fontSize: '0.82rem', color: '#c25a5a' }}>This batch has been previously reported as suspicious by other users. Exercise extreme caution.</p>
                            </div>
                        )}

                        {/* Anomaly Alerts */}
                        {trustResult && trustResult.alerts.length > 0 && (
                            <div className="product-card">
                                <h3><Bot size={16} /> AI Risk Alerts</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {trustResult.alerts.map((alert, i) => (
                                        <div key={i} style={{
                                            padding: '8px 12px',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.8rem',
                                            background: alert.includes('Critical') ? 'var(--danger-bg)' : 'var(--warning-bg)',
                                            color: alert.includes('Critical') ? 'var(--danger)' : 'var(--warning)',
                                            border: `1px solid ${alert.includes('Critical') ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                        }}>
                                            <AlertTriangle size={12} /> {alert}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Why This Medicine Is Safe */}
                        {trustResult && trustResult.score >= 70 && (
                            <div className="product-card">
                                <h3><Info size={16} /> Why This Medicine Is Safe</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    {batchData.inspectorApproved && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} style={{ color: '#00d4aa' }} /> Approved by certified quality inspector</div>}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} style={{ color: '#00d4aa' }} /> Complete supply chain recorded on blockchain</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} style={{ color: '#00d4aa' }} /> AI risk analysis shows no anomalies</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} style={{ color: '#00d4aa' }} /> No counterfeit reports for this batch</div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="product-card">
                            <h3>Actions</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-primary btn-sm" onClick={handleSaveToProfile} style={{ flex: 1 }}>
                                    <Bookmark size={14} /> Save to Profile
                                </button>
                                <button className="btn btn-sm" onClick={() => setShowReport(true)} style={{ flex: 1, background: 'rgba(255,71,87,0.1)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.2)' }}>
                                    <Flag size={14} /> Report Suspected Fake
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar — Trust Score & Risk */}
                    <div className="verify-sidebar">
                        {/* Trust Score */}
                        {trustResult && (
                            <div className="trust-card">
                                <h3><ShieldCheck size={16} /> Trust Score</h3>
                                <div className="trust-circle-wrap">
                                    <svg viewBox="0 0 120 120" className="trust-circle-svg">
                                        <circle cx="60" cy="60" r="52" className="trust-bg" />
                                        <circle cx="60" cy="60" r="52" className="trust-progress"
                                            stroke={getTrustColor(trustResult.score)}
                                            strokeDasharray={`${(trustResult.score / 100) * 327} 327`}
                                            transform="rotate(-90 60 60)" />
                                        <text x="60" y="56" textAnchor="middle" className="trust-label">{trustResult.score}</text>
                                        <text x="60" y="72" textAnchor="middle" className="trust-sublabel">{trustResult.riskLevel}</text>
                                    </svg>
                                </div>
                                <div className="trust-breakdown">
                                    {Object.values(trustResult.breakdown).map((b, i) => (
                                        <div key={i} className="breakdown-item">
                                            <span className="breakdown-label">{b.label}</span>
                                            <div className="breakdown-bar">
                                                <div className="breakdown-fill" style={{ width: `${b.score}%`, background: getTrustColor(b.score) }}></div>
                                            </div>
                                            <span className="breakdown-score">{Math.round(b.score)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '16px' }}>
                                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Radar Analysis</h4>
                                    <RadarChart breakdown={trustResult.breakdown} size={220} />
                                </div>
                            </div>
                        )}

                        {/* Risk Indicator */}
                        {trustResult && (
                            <div className="trust-card">
                                <h3>{getRiskEmoji(trustResult.score)} Risk Level</h3>
                                <div className="risk-indicator" style={{
                                    background: trustResult.score >= 70 ? 'rgba(0,212,170,0.1)' : trustResult.score >= 40 ? 'rgba(255,165,2,0.1)' : 'rgba(194, 90, 90,0.1)',
                                    border: `1px solid ${trustResult.score >= 70 ? 'rgba(0,212,170,0.2)' : trustResult.score >= 40 ? 'rgba(255,165,2,0.2)' : 'rgba(194, 90, 90,0.2)'}`,
                                    padding: '16px', borderRadius: '12px', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: getTrustColor(trustResult.score) }}>
                                        {trustResult.score >= 70 ? 'Safe for Consumption' : trustResult.score >= 40 ? 'Exercise Caution' : 'High Risk — Do Not Consume'}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                        {trustResult.score >= 70 ? 'This medicine passed all verification checks' : trustResult.score >= 40 ? 'Some anomalies detected — verify with pharmacist' : 'Multiple red flags detected — report immediately'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                </>
            )}

            {/* Report Fake Modal */}
            {showReport && (
                <ReportFake batchId={batchData?.batchIdHash || batchIdInput} onClose={() => setShowReport(false)} />
            )}
        </div>
    );
}
