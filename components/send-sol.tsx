'use client'

import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Send, Wallet, CheckCircle, XCircle } from 'lucide-react'

interface SendSolProps {
  className?: string
}

export default function SendSol({ className }: SendSolProps) {
  const { connection } = useConnection()
  const { publicKey, sendTransaction, connected } = useWallet()
  
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const validateInputs = () => {
    if (!recipient.trim()) {
      setStatus({ type: 'error', message: 'Recipient address is required' })
      return false
    }

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid amount' })
      return false
    }

    try {
      new PublicKey(recipient)
    } catch {
      setStatus({ type: 'error', message: 'Invalid recipient address' })
      return false
    }

    return true
  }

  const handleSendSol = async () => {
    if (!connected || !publicKey) {
      setStatus({ type: 'error', message: 'Please connect your wallet first' })
      return
    }

    if (!validateInputs()) return

    setIsLoading(true)
    setStatus({ type: null, message: '' })

    try {
      const recipientPubkey = new PublicKey(recipient)
      const lamports = Number(amount) * LAMPORTS_PER_SOL

      // Check balance
      const balance = await connection.getBalance(publicKey)
      if (balance < lamports) {
        throw new Error('Insufficient balance')
      }

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      )

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      // Send transaction
      const signature = await sendTransaction(transaction, connection)
      
      // Confirm transaction
      await connection.confirmTransaction(signature, 'confirmed')

      setStatus({
        type: 'success',
        message: `Successfully sent ${amount} SOL! Transaction: ${signature.slice(0, 8)}...`
      })
      
      // Reset form
      setRecipient('')
      setAmount('')
    } catch (error) {
      console.error('Transaction failed:', error)
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Transaction failed'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={`w-full max-w-md mx-auto bg-gray-900 border-gray-800 ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-white">
          <Send className="h-5 w-5" />
          Send SOL
        </CardTitle>
        <CardDescription className="text-gray-400">
          Transfer SOL to another wallet
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!connected ? (
          <Alert className="bg-yellow-900/20 border-yellow-800">
            <Wallet className="h-4 w-4" />
            <AlertDescription className="text-yellow-200">
              Please connect your wallet to send SOL
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-gray-200">
                Recipient Address
              </Label>
              <Input
                id="recipient"
                type="text"
                placeholder="Enter Solana wallet address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-200">
                Amount (SOL)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                step="0.001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                disabled={isLoading}
              />
            </div>

            {status.type && (
              <Alert className={
                status.type === 'success' 
                  ? 'bg-green-900/20 border-green-800' 
                  : 'bg-red-900/20 border-red-800'
              }>
                {status.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription className={
                  status.type === 'success' ? 'text-green-200' : 'text-red-200'
                }>
                  {status.message}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSendSol}
              disabled={isLoading || !recipient || !amount}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send SOL
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}