import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
  } from "@solana/web3.js";
  import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
  } from "@solana/spl-token";
  import { ethers } from "ethers";
  
  async function lockSolanaUsdt({
    userPrivateKey,
    vaultAddress,
    amount,
  }: {
    userPrivateKey: string;
    vaultAddress: string;
    amount: number;
  }) {
    const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
    let secretKey: Uint8Array;
    try {
      const buffer = Buffer.from(userPrivateKey.trim(), "base64");
      secretKey = new Uint8Array(buffer);
      if (secretKey.length !== 64) {
        throw new Error(`Invalid key length (${secretKey.length}), expected 64 bytes`);
      }
    } catch (err) {
      throw new Error("Invalid Solana private key — must be base64-encoded 64-byte key");
    }
  
    // ✅ Build the Keypair
    const userKeypair = Keypair.fromSecretKey(secretKey);
    const mint = new PublicKey(process.env.USDT_MINT_SOL!);
    const vaultPub = new PublicKey(vaultAddress);
  
    const userATA = await getAssociatedTokenAddress(mint, userKeypair.publicKey);
    const vaultATA = await getAssociatedTokenAddress(mint, vaultPub);
  
    const tx = new Transaction();
    const lamports = BigInt(Math.floor(amount * 10 ** 6));
  
    // Ensure vault ATA exists
    const vaultInfo = await conn.getAccountInfo(vaultATA);
    if (!vaultInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          userKeypair.publicKey,
          vaultATA,
          vaultPub,
          mint
        )
      );
    }
  
    tx.add(
      createTransferInstruction(userATA, vaultATA, userKeypair.publicKey, lamports)
    );
  
    const sig = await sendAndConfirmTransaction(conn, tx, [userKeypair]);
    console.log("🔒 Locked SPL-USDT TX:", sig);
    return { txHash: sig };
  }
  
  /* 🔹 2️⃣ Send (mint) ERC-20 USDT on Ethereum */
  async function sendEthereumUsdt({
    bridgePrivateKey,
    ethToAddress,
    amount,
  }: {
    bridgePrivateKey: string;
    ethToAddress: string;
    amount: number;
  }) {
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
    const bridgeWallet = new ethers.Wallet(bridgePrivateKey, provider);
  
    const usdtContract = new ethers.Contract(
      process.env.USDT_CONTRACT_ETH!,
      ["function transfer(address to,uint256 amount) public returns(bool)", "function balanceOf(address) view returns(uint256)"],
      bridgeWallet
    );
  
    const decimals = 6;
    const usdtAmount = BigInt(Math.floor(amount * 10 ** decimals));
  
    const balance = await usdtContract.balanceOf(await bridgeWallet.getAddress());
    console.log(`Bridge wallet ERC-20 USDT balance: ${Number(balance) / 1e6}`);
  
    if (balance < usdtAmount) {
      throw new Error("Bridge wallet does not have enough ERC-20 USDT to send");
    }
  
    const gasEstimate = await usdtContract.transfer.estimateGas(
      ethToAddress,
      usdtAmount
    );
  
    const tx = await usdtContract.transfer(ethToAddress, usdtAmount, {
      gasLimit: gasEstimate + BigInt(20000),
    });
  
    const receipt = await tx.wait();
    console.log("✅ Sent ERC-20 USDT TX:", receipt.hash);
    return { txHash: receipt.hash };
  }
  
  /* 🔄 3️⃣ Combined SPL→ERC20 USDT Bridge */
  export async function bridgeSPLToERC20({
    solPrivateKey,
    solVault,
    ethBridgePrivateKey,
    ethToAddress,
    amount,
  }: {
    solPrivateKey: string;
    solVault: string;
    ethBridgePrivateKey: string;
    ethToAddress: string;
    amount: number;
  }) {
    try {
      console.log(`🔹 Starting SPL→ERC-20 USDT bridge for ${amount} USDT`);
  
      // Lock on Solana
      const solTx = await lockSolanaUsdt({
        userPrivateKey: solPrivateKey,
        vaultAddress: solVault,
        amount,
      });
  
      // Send on Ethereum
      const ethTx = await sendEthereumUsdt({
        bridgePrivateKey: ethBridgePrivateKey,
        ethToAddress,
        amount,
      });
  
      console.log("✅ Bridge SPL→ERC-20 completed!");
      return {
        status: "completed",
        fromTxHash: solTx.txHash,
        toTxHash: ethTx.txHash,
      };
    } catch (err: any) {
      console.error("bridgeSolanaUsdtToEthereum error:", err);
      return { status: "failed", error: err.message };
    }
  }
  