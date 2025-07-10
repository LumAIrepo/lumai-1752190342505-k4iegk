'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut } from 'lucide-react'

interface WalletButtonProps {
  className?: string
}

export default function WalletButton({ className }: WalletButtonProps) {
  const { wallet, publicKey, disconnect, connecting, connected } = useWallet()
  const { setVisible } = useWalletModal()

  const handleClick = () => {
    if (connected) {
      disconnect()
    } else {
      setVisible(true)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <Button
      onClick={handleClick}
      disabled={connecting}
      variant={connected ? "outline" : "default"}
      className={className}
    >
      {connecting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
          Connecting...
        </>
      ) : connected && publicKey ? (
        <>
          <LogOut className="h-4 w-4 mr-2" />
          {formatAddress(publicKey.toString())}
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </>
      )}
    </Button>
  )
}