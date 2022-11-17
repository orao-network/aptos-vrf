import { MouseEvent, useEffect, useState } from "react"

const WalletButton = () => {
    const [isWalletConnected, setWalletConnected] = useState(false)
    const [address, setAddress] = useState<string>()

    const handleConnect = async (e: MouseEvent) => {
        e.preventDefault()

        await window.pontem!.connect()

        setWalletConnected(true)
    }

    const handleDisconnect = async (e: MouseEvent) => {
        e.preventDefault()

        await window.pontem!.disconnect()

        setWalletConnected(false)
    }

    useEffect(() => {
        (async () => {
            const isConnected = await window.pontem!.isConnected()
            setWalletConnected(isConnected)
        })().catch(e => {
            console.error(e)
        })
    }, [])

    useEffect(() => {
        if (isWalletConnected) {
            (async () => {
                const accAddr = await window.pontem!.account()
                setAddress(accAddr.substring(0, 6) + "..." + accAddr.substring(62))
            })().catch(e => {
                console.error(e)
            })
        }
    }, [isWalletConnected])

    return isWalletConnected ? (
        <a className="button is-primary" onClick={handleDisconnect}>
            {address}
        </a>
    ) : (
        <a className="button is-primary" onClick={handleConnect}>
            Connect Wallet
        </a>
    )
}

export default WalletButton