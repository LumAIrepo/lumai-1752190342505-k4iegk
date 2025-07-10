import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string, chars = 4): string {
  if (!address) return ""
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function formatSOL(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4)
}

export function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

export async function getBalance(connection: Connection, publicKey: PublicKey): Promise<number> {
  try {
    return await connection.getBalance(publicKey)
  } catch (error) {
    console.error("Error fetching balance:", error)
    return 0
  }
}

export function formatNumber(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + "B"
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + "M"
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + "K"
  }
  return num.toString()
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function getExplorerUrl(signature: string, cluster: "mainnet-beta" | "devnet" | "testnet" = "mainnet-beta"): string {
  const baseUrl = cluster === "mainnet-beta" 
    ? "https://explorer.solana.com" 
    : `https://explorer.solana.com?cluster=${cluster}`
  return `${baseUrl}/tx/${signature}`
}

export function getAccountExplorerUrl(address: string, cluster: "mainnet-beta" | "devnet" | "testnet" = "mainnet-beta"): string {
  const baseUrl = cluster === "mainnet-beta" 
    ? "https://explorer.solana.com" 
    : `https://explorer.solana.com?cluster=${cluster}`
  return `${baseUrl}/account/${address}`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function getRPCEndpoint(cluster: "mainnet-beta" | "devnet" | "testnet" = "mainnet-beta"): string {
  switch (cluster) {
    case "mainnet-beta":
      return "https://api.mainnet-beta.solana.com"
    case "devnet":
      return "https://api.devnet.solana.com"
    case "testnet":
      return "https://api.testnet.solana.com"
    default:
      return "https://api.mainnet-beta.solana.com"
  }
}