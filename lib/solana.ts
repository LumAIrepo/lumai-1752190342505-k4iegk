import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js'

export interface SolanaConfig {
  network: 'mainnet-beta' | 'testnet' | 'devnet'
  rpcUrl?: string
}

export class SolanaService {
  private connection: Connection
  private network: string

  constructor(config: SolanaConfig = { network: 'devnet' }) {
    this.network = config.network
    const rpcUrl = config.rpcUrl || clusterApiUrl(config.network)
    this.connection = new Connection(rpcUrl, 'confirmed')
  }

  getConnection(): Connection {
    return this.connection
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey)
      return balance / LAMPORTS_PER_SOL
    } catch (error) {
      console.error('Error fetching balance:', error)
      throw new Error('Failed to fetch balance')
    }
  }

  async getAccountInfo(publicKey: PublicKey) {
    try {
      return await this.connection.getAccountInfo(publicKey)
    } catch (error) {
      console.error('Error fetching account info:', error)
      throw new Error('Failed to fetch account info')
    }
  }

  async sendTransaction(transaction: Transaction, signers: any[]): Promise<string> {
    try {
      const signature = await this.connection.sendTransaction(transaction, signers)
      await this.connection.confirmTransaction(signature, 'confirmed')
      return signature
    } catch (error) {
      console.error('Error sending transaction:', error)
      throw new Error('Failed to send transaction')
    }
  }

  async transferSol(
    fromPubkey: PublicKey,
    toPubkey: PublicKey,
    lamports: number,
    signer: any
  ): Promise<string> {
    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      )

      const signature = await this.connection.sendTransaction(transaction, [signer])
      await this.connection.confirmTransaction(signature, 'confirmed')
      return signature
    } catch (error) {
      console.error('Error transferring SOL:', error)
      throw new Error('Failed to transfer SOL')
    }
  }

  async getRecentBlockhash() {
    try {
      const { blockhash } = await this.connection.getLatestBlockhash()
      return blockhash
    } catch (error) {
      console.error('Error fetching recent blockhash:', error)
      throw new Error('Failed to fetch recent blockhash')
    }
  }

  async getTransactionHistory(publicKey: PublicKey, limit: number = 10) {
    try {
      const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit })
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await this.connection.getTransaction(sig.signature)
          return {
            signature: sig.signature,
            slot: sig.slot,
            blockTime: sig.blockTime,
            transaction: tx,
          }
        })
      )
      return transactions
    } catch (error) {
      console.error('Error fetching transaction history:', error)
      throw new Error('Failed to fetch transaction history')
    }
  }

  isValidPublicKey(address: string): boolean {
    try {
      new PublicKey(address)
      return true
    } catch {
      return false
    }
  }

  lamportsToSol(lamports: number): number {
    return lamports / LAMPORTS_PER_SOL
  }

  solToLamports(sol: number): number {
    return sol * LAMPORTS_PER_SOL
  }

  async getSlot(): Promise<number> {
    try {
      return await this.connection.getSlot()
    } catch (error) {
      console.error('Error fetching slot:', error)
      throw new Error('Failed to fetch slot')
    }
  }

  async getEpochInfo() {
    try {
      return await this.connection.getEpochInfo()
    } catch (error) {
      console.error('Error fetching epoch info:', error)
      throw new Error('Failed to fetch epoch info')
    }
  }
}

export const solanaService = new SolanaService()

export const SOLANA_NETWORKS = {
  MAINNET: 'mainnet-beta' as const,
  TESTNET: 'testnet' as const,
  DEVNET: 'devnet' as const,
}

export const formatPublicKey = (publicKey: string, chars: number = 4): string => {
  if (!publicKey) return ''
  return `${publicKey.slice(0, chars)}...${publicKey.slice(-chars)}`
}

export const formatSolAmount = (amount: number, decimals: number = 4): string => {
  return amount.toFixed(decimals)
}

export const shortenSignature = (signature: string, chars: number = 8): string => {
  if (!signature) return ''
  return `${signature.slice(0, chars)}...${signature.slice(-chars)}`
}