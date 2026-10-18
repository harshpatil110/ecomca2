# Lumina Realty — Sepolia registry integration

## What changed
- Added `ethers` v6 to `package.json`.
- Added `src/blockchain/registryAbi.json` and `registryConfig.js` for the supplied Sepolia contract.
- Added reusable `BlockchainRegistry.jsx`.
- Embedded the registry panel in:
  - `src/pages/PropertyDetail.jsx`
  - `src/pages/admin/CreateListingAdmin.jsx`
  - `src/pages/ListingsManagerAdmin.jsx`

The panel supports MetaMask connection, Sepolia network checks, admin-only property registration/status changes, property lookup, status verification, ownership history, and current-owner-only transfer. Transaction receipts link to Sepolia Etherscan.

## Run locally
1. Extract the ZIP.
2. From the project root run:
   ```bash
   npm install
   npm run dev
   ```
   `npm install` will update `package-lock.json` for the added `ethers` dependency.
3. Open the Vite URL and install/enable MetaMask.
4. Switch MetaMask to Sepolia (chain ID `11155111`).
5. Connect the wallet. The connected account must equal `admin()` for registration and status updates.
6. For transfer testing, connect the wallet currently recorded as the property's owner. The new owner needs a valid address and should use a wallet you control for test purposes.

## Contract configuration
- Address: `0x569F33bcd31Aec0eC4c5335A6393E87B3E65b7E5`
- Network: Sepolia
- Chain ID: `11155111`

The ABI is a minimal ABI for the functions used by the UI, taken from the ABI supplied in the conversation.

## Important limitations
- The existing listing form remains a visual draft form; its other listing fields are not persisted by this change. Blockchain registration records only `initialOwner`, `locationReference`, and `documentHash`.
- Use the `locationReference` field to link a web listing reference (for example `LUM-742`) to its distinct sequential on-chain property ID. Do not assume those IDs are the same.
- A zero document hash is only a placeholder and does not establish authenticity.
- `verifyProperty()` means the contract record exists and has `Registered` status; it is not a legal-title check.
- Sepolia is a test network. Do not use real funds or represent this demo as a legally authoritative land registry.
