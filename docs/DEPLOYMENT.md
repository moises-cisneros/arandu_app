# ARANDU Deployment Guide

## 🚀 **Live Contracts on Lisk Sepolia**

```json
{
  "network": "lisk-sepolia",
  "chainId": 4202,
  "rpc": "https://rpc.sepolia-api.lisk.com",
  "explorer": "https://sepolia-blockscout.lisk.com",
  "deployedAt": "2025-01-30",
  "contracts": {
    "ANDUToken": "0xc518353025E46b587e424c4aBa6b260E4dB21322",
    "AranduRewards": "0x401DFD0a403245a2111B9Dac127B2815feBB3dfA",
    "AranduBadges": "0x0275c991DfE3339da93a5aecbB162BE4A9D152C4",
    "AranduCertificates": "0x60d4525Fe706c4CE938A415b2B8bC2a7f8b2f64c",
    "AranduResources": "0x49bcaF572905BC08cdE35d2658875a9BFA52838a",
    "DataAnchor": "0x9aDb12a7448B32836b526D7942Cc441fF91a6d3D"
  }
}
```

## 🔗 **Verification Links**

- **ANDUToken**: [View on Explorer](https://sepolia-blockscout.lisk.com/address/0xc518353025E46b587e424c4aBa6b260E4dB21322)
- **AranduRewards**: [View on Explorer](https://sepolia-blockscout.lisk.com/address/0x401DFD0a403245a2111B9Dac127B2815feBB3dfA)
- **AranduBadges**: [View on Explorer](https://sepolia-blockscout.lisk.com/address/0x0275c991DfE3339da93a5aecbB162BE4A9D152C4)

## ⚡ **Quick Deploy**

```bash
# Compile contracts
yarn compile

# Deploy to local network
yarn deploy:local

# Deploy to Lisk Sepolia (requires ETH for gas)
yarn deploy:testnet
```

## 🧪 **Verify Deployment**

```bash
# Run all tests against deployed contracts
yarn test

# Expected result: 85 tests passing ✅
```

## 📁 **Generated Files**

After deployment, check:

- `abis/lisk-sepolia/` - Contract ABIs for frontend
- `deployments/lisk-sepolia/` - Deployment metadata
- `artifacts/` - Compilation artifacts

---

*Ready for production deployment and frontend integration* 🚀
