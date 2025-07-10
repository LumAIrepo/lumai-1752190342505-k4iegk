'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, ExternalLink, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'

interface Transaction {
  signature: string
  slot: number
  blockTime: number | null
  fee: number
  status: 'success' | 'failed'
  type: 'sent' | 'received' | 'swap' | 'stake' | 'unknown'
  amount: number
  token: string
  from?: string
  to?: string
}

interface TransactionListProps {
  className?: string
  limit?: number
}

export default function TransactionList({ className = '', limit = 10 }: TransactionListProps) {
  const { publicKey, connected } = useWallet()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connection = new Connection('https://api.mainnet-beta.solana.com')

  const fetchTransactions = async () => {
    if (!publicKey || !connected) return

    setLoading(true)
    setError(null)

    try {
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit })
      const txs = await connection.getParsedTransactions(
        signatures.map(sig => sig.signature),
        { maxSupportedTransactionVersion: 0 }
      )

      const parsedTransactions: Transaction[] = txs
        .filter((tx): tx is ParsedTransactionWithMeta => tx !== null)
        .map((tx, index) => {
          const signature = signatures[index]
          const meta = tx.meta
          const preBalance = meta?.preBalances[0] || 0
          const postBalance = meta?.postBalances[0] || 0
          const balanceChange = postBalance - preBalance
          const fee = meta?.fee || 0

          let type: Transaction['type'] = 'unknown'
          let amount = Math.abs(balanceChange) / 1e9
          let token = 'SOL'

          if (balanceChange > 0) {
            type = 'received'
          } else if (balanceChange < 0) {
            type = 'sent'
            amount = Math.abs(balanceChange + fee) / 1e9
          }

          // Check for token transfers
          const tokenTransfers = meta?.preTokenBalances || []
          if (tokenTransfers.length > 0) {
            type = 'swap'
            token = 'TOKEN'
          }

          // Check for stake instructions
          const instructions = tx.transaction.message.instructions
          const hasStakeInstruction = instructions.some(ix => 
            'programId' in ix && ix.programId.toString().includes('Stake')
          )
          if (hasStakeInstruction) {
            type = 'stake'
          }

          return {
            signature: signature.signature,
            slot: signature.slot || 0,
            blockTime: signature.blockTime,
            fee: fee / 1e9,
            status: meta?.err ? 'failed' : 'success',
            type,
            amount,
            token,
            from: publicKey.toString(),
            to: 'Unknown'
          }
        })

      setTransactions(parsedTransactions)
    } catch (err) {
      setError('Failed to fetch transactions')
      console.error('Transaction fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (connected && publicKey) {
      fetchTransactions()
    }
  }, [connected, publicKey])

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Unknown'
    return new Date(timestamp * 1000).toLocaleString()
  }

  const formatAmount = (amount: number, token: string) => {
    return `${amount.toFixed(4)} ${token}`
  }

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'sent':
        return <ArrowUpRight className="h-4 w-4 text-red-400" />
      case 'received':
        return <ArrowDownLeft className="h-4 w-4 text-green-400" />
      case 'swap':
        return <RefreshCw className="h-4 w-4 text-blue-400" />
      case 'stake':
        return <ArrowUpRight className="h-4 w-4 text-purple-400" />
      default:
        return <RefreshCw className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: Transaction['status']) => {
    return (
      <Badge 
        variant={status === 'success' ? 'default' : 'destructive'}
        className={status === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}
      >
        {status}
      </Badge>
    )
  }

  if (!connected) {
    return (
      <Card className={`bg-gray-900 border-gray-800 ${className}`}>
        <CardHeader>
          <CardTitle className="text-white">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-8">
            Connect your wallet to view transactions
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-gray-900 border-gray-800 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Recent Transactions</CardTitle>
        <Button
          onClick={fetchTransactions}
          disabled={loading}
          variant="outline"
          size="sm"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-400 text-sm mb-4 p-3 bg-red-900/20 rounded-lg border border-red-800">
            {error}
          </div>
        )}

        {loading && transactions.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-4 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No transactions found
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.signature}
                className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
              >
                <div className="flex-shrink-0">
                  {getTransactionIcon(tx.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-white font-medium capitalize">
                      {tx.type}
                    </p>
                    {getStatusBadge(tx.status)}
                  </div>
                  <p className="text-gray-400 text-sm truncate">
                    {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {formatTime(tx.blockTime)}
                  </p>
                </div>

                <div className="text-right">
                  <p className={`font-medium ${
                    tx.type === 'received' ? 'text-green-400' : 
                    tx.type === 'sent' ? 'text-red-400' : 'text-white'
                  }`}>
                    {tx.type === 'received' ? '+' : tx.type === 'sent' ? '-' : ''}
                    {formatAmount(tx.amount, tx.token)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Fee: {tx.fee.toFixed(6)} SOL
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white p-2"
                  onClick={() => window.open(`https://solscan.io/tx/${tx.signature}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}