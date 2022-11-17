import Layout from "../components/Layout";
import { OraoVrf } from "orao-aptos-vrf";
import { useEffect, useState } from "react";

function getNodeUrl(network: string) {
    if (network == "Mainnet") {
        return "https://fullnode.mainnet.aptoslabs.com"
    } else if (network == "Testnet") {
        return "https://fullnode.testnet.aptoslabs.com"
    } else if (network == "Devnet") {
        return "https://fullnode.devnet.aptoslabs.com"
    } else {
        return "http://localhost:8080"
    }
}

export default function HomePage() {
    const [seed, setSeed] = useState<Uint8Array>(new Uint8Array([]))
    const [randomness, setRandomness] = useState<Uint8Array>(new Uint8Array([]))

    const handleRequest = async () => {
        const network = await window.pontem!.network()
        // console.log(network)
        // const nodeUrl = getNodeUrl(network)

        const vrf = new OraoVrf(network.api)

        const builder = await vrf.request()
        const [s, tx] = await builder.signAndSend(window.pontem!)
        console.log(tx)
        setSeed(s)
    }

    useEffect(() => {
        if (seed.length) {
            (async () => {
                const network = await window.pontem!.network()
                const vrf = new OraoVrf(network.api)

                const owner = await window.pontem!.account()

                const r = await vrf.waitFulfilled(owner, seed)
                setRandomness(r)
            })().catch(e => {
                console.error(e)
            })
        }
    }, [seed])

    return (
        <Layout title="Example of Orao VRF for Aptos">
            <section className="section">
                <div className="container">
                    <h1 className="title">Request Randomness</h1>
                    <div className="buttons">
                        <button className="button" onClick={handleRequest}>Request</button>
                    </div>
                    <div className="field">
                        <label className="label">Seed</label>
                        <div className="control">
                            <textarea className="textarea" readOnly value={Buffer.from(seed).toString("hex")}></textarea>
                        </div>
                    </div>
                    <div className="field">
                        <label className="label">Randomness</label>
                        <div className="control">
                            <textarea className="textarea" readOnly value={Buffer.from(randomness).toString("hex")}></textarea>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    )
}