import {useEffect, useState} from "react";

import {randomBytes} from "crypto";

import Layout from "../components/Layout";
import {OraoVrfV2Client} from "orao-aptos-vrf";

export default function HomePage() {
  const [seed, setSeed] = useState<Uint8Array>(new Uint8Array([]))
  const [randomness, setRandomness] = useState<Uint8Array>(new Uint8Array([]))

  const handleRequest = async () => {
    const network = await window.pontem!.network()
    const vrf = new OraoVrfV2Client(network.api)

    const seed = new Uint8Array(randomBytes(32));
    try {
      const payload = vrf.requestPayload(seed);
      const response = await window.pontem!.signAndSubmit(payload);
      await vrf.provider.waitForTransaction(response?.hash || "");
      console.log(response?.hash)
    } catch (error: any) {
      console.log("error", error);
    }
    setSeed(seed)
  }

  useEffect(() => {
    if (seed.length) {
      (async () => {
        const network = await window.pontem!.network()
        const vrf = new OraoVrfV2Client(network.api)

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