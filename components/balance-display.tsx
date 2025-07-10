'use client'

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BalanceDisplayProps {
  className?: string
  showRefreshButton?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function BalanceDisplay({ 
  className = '',
  showRefreshButton = true,
  autoRefresh = false,
  refreshInterval = 30000
}: BalanceDisplayProps) {
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = async () => {
    if (!publicKey || !connected) {
      setBalance(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const lamports = await connection.getBalance(publicKey)
      const solBalance = lamports / LAMPORTS_PER_SOL
      setBalance(solBalance)
    } catch (err) {
      setError('Failed to fetch balance')
      console.error('Balance fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [publicKey, connected, connection])

  useEffect(() => {
    if (!autoRefresh || !connected) return

    const interval = setInterval(fetchBalance, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, connected, publicKey])

  const formatBalance = (balance: number): string => {
    if (balance === 0) return '0.00'
    if (balance < 0.001) return balance.toFixed(6)
    if (balance < 1) return balance.toFixed(4)
    return balance.toFixed(2)
  }

  return (
    <Card className={`bg-gray-900 border-gray-800 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-200 flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          SOL Balance
        </CardTitle>
        {showRefreshButton && connected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBalance}
            disabled={loading}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">
          {!connected ? (
            <span className="text-gray-500">Not Connected</span>
          ) : loading ? (
            <span className="text-gray-400">Loading...</span>
          ) : error ? (
            <span className="text-red-400">Error</span>
          ) : balance !== null ? (
            <span>{formatBalance(balance)} SOL</span>
          ) : (
            <span className="text-gray-500">--</span>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
        {connected && publicKey && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            {publicKey.toBase58()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}