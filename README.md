Mint NFT's on the Algorand blockchain and utilize ArDrive.io permanent file storage for media storage.
Uploading the Ardrive media and obtaining the Tx ID is manual
Pera Wallet will connect via QR Code
Work in Progress........


If accessing remotely from your workstation, bridge the void with an SSH loopback forward:

  ssh -N -L 5173:127.0.0.1:5173 <user>@<host>

Then open http://127.0.0.1:5173 in your browser.

Here is the path laid out before us for ARC-69 MainNet creation:

1. Connect Pera
   Bind your public MainNet account (Chain ID 416001). No private keys or seeds ever cross this threshold.

2. Media Storage (ArDrive / Arweave)
   Deposit the media directly into an ArDrive public drive, or bring a literal 43-character Arweave File Data Tx ID / direct HTTPS URL. Media stays off-chain; no SHA-256 digests or secondary JSON uploads required.

3. ARC-69 On-Chain Metadata
   Enter your description, external URL, media URL, MIME type, and properties object. The workspace encodes this as compact UTF-8 JSON within the 1024-byte transaction note limit.

4. Asset Parameters
   Define Asset Name (1-32 bytes), Unit (1-8 bytes), direct media URL with the appropriate media fragment (#i, #v, #a, #p, #h), and administrative policy (immutable default or creator-managed).

5. Mint Lifecycle
   Execute the four deliberate steps in sequence:
   - Prepare / Review: Read-only suggested parameter check and balance validation.
   - Sign: Pass payload to Pera for Ed25519 signature.
   - Broadcast: Write recovery state and dispatch the transaction once.
   - Confirm: Read back on-chain verification, ASA index, and confirmed round.
