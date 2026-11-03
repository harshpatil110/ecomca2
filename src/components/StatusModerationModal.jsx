import { useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import registryAbi from '../blockchain/registryAbi.json';
import {
  REGISTRY_ADDRESS,
  SEPOLIA_EXPLORER,
  isSepoliaNetwork,
} from '../blockchain/registryConfig';
import { refreshRegistryData } from '../services/registryDataService';
import { updateRegistryStatus } from '../services/listingsStore';

const STATUS_ENUM = {
  0: 'Registered',
  1: 'Disputed',
  2: 'Suspended',
};

function formatAddress(addr) {
  if (!addr) return '—';
  const clean = String(addr).trim();
  if (clean.length < 12) return clean;
  return `${clean.slice(0, 6)}…${clean.slice(-4)}`;
}

function readableError(error) {
  if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
    return 'Transaction rejected by user in MetaMask.';
  }
  return (
    error?.shortMessage ||
    error?.reason ||
    error?.info?.error?.message ||
    error?.message ||
    'An unexpected error occurred during status update.'
  );
}

export default function StatusModerationModal({ property, isOpen, onClose, contractAdmin }) {
  const [proposedStatus, setProposedStatus] = useState('1'); // '0' | '1' | '2'
  const [reason, setReason] = useState('');
  const [isConfirmationStep, setIsConfirmationStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [successTxHash, setSuccessTxHash] = useState('');
  const [successBlock, setSuccessBlock] = useState(null);

  if (!isOpen || !property) return null;

  const isChain = Boolean(property.blockchainPropertyId || property.isOnChain);

  const currentStatusCode = typeof property.statusCode === 'number'
    ? property.statusCode
    : property.status === 'Disputed' || property.registryStatus === 'Disputed'
    ? 1
    : property.status === 'Suspended' || property.registryStatus === 'Suspended'
    ? 2
    : 0;

  const handleProceedToConfirm = (e) => {
    e.preventDefault();
    setStatusError('');
    if (!reason.trim()) {
      setStatusError('An official justification reason is strictly required for this status change.');
      return;
    }
    setIsConfirmationStep(true);
  };

  const handleExecuteStatusUpdate = async () => {
    setStatusError('');
    setIsSubmitting(true);
    setSuccessTxHash('');

    // If off-chain record, perform local registry store update
    if (!isChain) {
      try {
        const propId = property.id || property.blockchainPropertyId;
        updateRegistryStatus(propId, STATUS_ENUM[Number(proposedStatus)], reason.trim());
        await refreshRegistryData();
        setSuccessTxHash('LOCAL_OFFCHAIN_CONFIRMED');
        setSuccessBlock(null);
      } catch (err) {
        setStatusError(err.message || 'Failed to update status.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // If on-chain record, execute updatePropertyStatus on Sepolia
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not detected. Please install or enable MetaMask to broadcast on Sepolia.');
      }

      const provider = new BrowserProvider(window.ethereum);
      const net = await provider.getNetwork();

      if (!isSepoliaNetwork(net.chainId)) {
        throw new Error('Please switch MetaMask network to Sepolia (Chain ID 11155111).');
      }

      const signer = await provider.getSigner();
      const signerAddr = await signer.getAddress();

      if (
        contractAdmin &&
        signerAddr.toLowerCase() !== contractAdmin.toLowerCase()
      ) {
        throw new Error(
          `Unauthorized: Connected account (${formatAddress(signerAddr)}) is not the contract administrator (${formatAddress(contractAdmin)}).`
        );
      }

      const contract = new Contract(REGISTRY_ADDRESS, registryAbi, signer);
      const propId = property.blockchainPropertyId || property.id;
      const newStatusNum = Number(proposedStatus);

      const tx = await contract.updatePropertyStatus(propId, newStatusNum, reason.trim());
      const receipt = await tx.wait();

      setSuccessTxHash(receipt.hash);
      setSuccessBlock(receipt.blockNumber);

      // Sync local store
      try {
        updateRegistryStatus(property.id || propId, STATUS_ENUM[newStatusNum], reason.trim());
      } catch {
        // local sync fallback
      }

      // Refresh single shared registry service to propagate changes to all metrics and tables
      await refreshRegistryData();
    } catch (err) {
      console.error('[StatusModerationModal] Update error:', err);
      setStatusError(readableError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocalFallbackUpdate = async () => {
    try {
      setIsSubmitting(true);
      setStatusError('');
      const propId = property.id || property.blockchainPropertyId;
      updateRegistryStatus(propId, STATUS_ENUM[Number(proposedStatus)], reason.trim());
      await refreshRegistryData();
      setSuccessTxHash('LOCAL_SIMULATION_CONFIRMED');
      setSuccessBlock(null);
    } catch (err) {
      setStatusError(err.message || 'Failed to update local status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (isSubmitting) return;
    setIsConfirmationStep(false);
    setReason('');
    setStatusError('');
    setSuccessTxHash('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-stone-200 rounded-sm shadow-xl max-w-xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-start border-b border-stone-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
              {isChain ? 'On-Chain Governance Moderation' : 'Property Registry Governance'}
            </span>
            <h3 className="text-xl font-bold text-stone-900">
              Change Property Status
            </h3>
          </div>
          <button
            onClick={handleModalClose}
            disabled={isSubmitting}
            className="text-stone-400 hover:text-stone-900 transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {/* Snapshot */}
        <div className="bg-[#fbf9f4] p-4 rounded-sm border border-stone-200 text-xs grid grid-cols-2 gap-3">
          <div>
            <span className="text-stone-400 uppercase font-bold text-[10px] block mb-0.5">Property</span>
            <span className="font-bold text-stone-900 block truncate">{property.name || `Property #${property.blockchainPropertyId || property.id}`}</span>
          </div>
          <div>
            <span className="text-stone-400 uppercase font-bold text-[10px] block mb-0.5">Registry ID</span>
            <span className="font-mono font-bold text-emerald-800">#{property.blockchainPropertyId || property.id}</span>
          </div>
          <div>
            <span className="text-stone-400 uppercase font-bold text-[10px] block mb-0.5">Current Status</span>
            <span className="font-bold text-stone-900">
              {STATUS_ENUM[currentStatusCode] || property.status} ({currentStatusCode})
            </span>
          </div>
          <div>
            <span className="text-stone-400 uppercase font-bold text-[10px] block mb-0.5">Type</span>
            <span className="font-bold text-stone-700">{isChain ? 'Blockchain Verified' : 'Local Registry Record'}</span>
          </div>
        </div>

        {/* Success Banner */}
        {successTxHash ? (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-sm text-emerald-950 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-emerald-900">
              <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
              Property Status Successfully Changed!
            </div>
            <p>
              Property #{property.blockchainPropertyId || property.id} is now updated to <strong>{STATUS_ENUM[Number(proposedStatus)]}</strong>.
            </p>
            {successTxHash.startsWith('0x') && (
              <p className="font-mono text-[11px]">
                Sepolia Tx:{' '}
                <a
                  href={`${SEPOLIA_EXPLORER}/tx/${successTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-emerald-700 break-all"
                >
                  {successTxHash} ↗
                </a>
                {successBlock && <span> (Block #{successBlock})</span>}
              </p>
            )}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-5 py-2 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-stone-800"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {statusError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-sm space-y-2">
                <p className="font-bold">{statusError}</p>
                {statusError.includes('Unauthorized') && isChain && (
                  <div className="pt-1 border-t border-red-200">
                    <p className="text-[11px] mb-2">
                      You are not connected as the Sepolia contract administrator ({contractAdmin ? formatAddress(contractAdmin) : 'Admin'}).
                      You can still update the status in the local registry store for testing:
                    </p>
                    <button
                      type="button"
                      onClick={handleLocalFallbackUpdate}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-red-800 hover:bg-red-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors"
                    >
                      Update in Local Registry Store (Testing)
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isConfirmationStep ? (
              <form onSubmit={handleProceedToConfirm} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Select New Status:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { val: '0', num: '1', label: 'Registered', desc: 'Active & clear title. Transfers allowed.' },
                      { val: '1', num: '2', label: 'Disputed', desc: 'Legal contest / dispute. Blocks transfers.' },
                      { val: '2', num: '3', label: 'Suspended', desc: 'Administrative hold. Blocks transfers.' },
                    ].map((opt) => (
                      <label
                        key={opt.val}
                        className={`p-3 rounded-sm border cursor-pointer flex flex-col justify-between transition-all ${
                          proposedStatus === opt.val
                            ? 'bg-white shadow-sm ring-2 ring-stone-900 border-stone-900'
                            : 'bg-[#fbf9f4] border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-stone-900">{opt.num}. {opt.label}</span>
                          <input
                            type="radio"
                            name="proposedStatus"
                            value={opt.val}
                            checked={proposedStatus === opt.val}
                            onChange={(e) => setProposedStatus(e.target.value)}
                            className="accent-stone-900"
                          />
                        </div>
                        <span className="text-[10px] text-stone-500 leading-tight">{opt.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Reason for Status Change (Required)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter official court decree, survey dispute reference, dispute resolution summary, or reason..."
                    className="w-full bg-[#fbf9f4] border border-stone-200 rounded-sm p-3 text-xs font-serif text-stone-800 placeholder:italic focus:outline-none focus:border-stone-800"
                  />
                  <p className="text-[10px] text-stone-400 font-serif italic mt-1">
                    {isChain
                      ? 'This reason is permanently recorded on-chain in the Sepolia smart contract via PropertyStatusUpdated.'
                      : 'This reason is recorded in the registry audit trail.'}
                  </p>
                </div>

                {(proposedStatus === '1' || proposedStatus === '2') && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-900 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-sm text-amber-600 shrink-0 mt-0.5">lock</span>
                    <p className="leading-snug">
                      <strong>Transfer Lockout Warning:</strong> Changing this property to <strong>{STATUS_ENUM[Number(proposedStatus)]}</strong> automatically locks the property and prevents ownership transfers until restored to Registered.
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-stone-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-stone-800"
                  >
                    Review & Confirm
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs font-sans">
                <div className="p-4 bg-[#fbf9f4] rounded-sm border border-stone-200 space-y-2">
                  <p className="font-bold text-stone-400 uppercase text-[10px]">Change Summary</p>
                  <p><strong>Property:</strong> {property.name} (#{property.blockchainPropertyId || property.id})</p>
                  <p><strong>Execution Target:</strong> {isChain ? 'Ethereum Sepolia Smart Contract' : 'Property Registry Store'}</p>
                  <p><strong>New Status:</strong> {STATUS_ENUM[Number(proposedStatus)]} ({proposedStatus})</p>
                  <p><strong>Reason:</strong> <span className="font-serif italic text-stone-700">&ldquo;{reason}&rdquo;</span></p>
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsConfirmationStep(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-stone-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteStatusUpdate}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-stone-800 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        {isChain ? 'Broadcasting to Sepolia...' : 'Updating Registry...'}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">gavel</span>
                        {isChain ? 'Sign & Broadcast on Sepolia' : 'Confirm Status Change'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}