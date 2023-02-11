import './App.css';
import { useEffect, useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { detectConcordiumProvider } from '@concordium/browser-wallet-api-helpers';
import { AccountTransactionType, ModuleReference, CcdAmount, deserializeReceiveReturnValue, toBuffer, SchemaVersion, IdStatementBuilder, AttributesKeys } from '@concordium/web-sdk';
import httpClient from './httpClient';

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletConnected, setWalletConnected] = useState(false)
  const [concordiumClient, setConcordiumClient] = useState(null)
  const [endTime, setEndTime] = useState(new Date(Date.now))
  const [countries, setCountries] = useState("CM, IT, DK, GM")
  const [donationCreated, setDonationCreated] = useState(false)
  const [contractIndex, setContractIndex] = useState(2830)
  const [donation_location, setLocation] = useState("CM")
  const [totalBalance, setTotalBalance] = useState(null)
  const [donationEndTime, setDonationEndTime] = useState(null)
  const [challenge, setChallenge] = useState("")

  let rawModuleSchema = "//8DAQAAAAgAAABkb25hdGlvbgEAFAACAAAAEgAAAGRvbmF0aW9uX2xvY2F0aW9ucxACFgIIAAAAZW5kX3RpbWUNAgAAAAYAAABkb25hdGUEFgIVBAAAABAAAABQYXJzZVBhcmFtc0Vycm9yAhAAAABEb25hdGlvbkhhc0VuZGVkAg4AAABEb25hdGlvbkNsb3NlZAIXAAAASW52YWxpZERvbmF0aW9uTG9jYXRpb24CBAAAAHZpZXcBFAAEAAAADQAAAG51bWJlcl9kb25vcnMEDgAAAHN0YXRlX2RvbmF0aW9uFQIAAAAEAAAAT3BlbgIGAAAAQ2xvc2VkAgQAAAB0aW1lDQcAAABiYWxhbmNlCgA";
  const moduleReference = new ModuleReference('f1546395fde97d5f749c92049b98565cb8095163c548959db389f7ce03cae735')

  useEffect(() => {
    detectConcordiumProvider().then((c) => setConcordiumClient(c)).catch(console.log("Failed to connect to client"))
  }, [])

  const onConnectWallet = () => {
    concordiumClient.connect().then(accountAddress => {
      setWalletAddress(accountAddress)
      setWalletConnected(true)
    })
  }

  const onVerifyID = async () => {
    const statementBuilder = new IdStatementBuilder()
    statementBuilder.addMembership(AttributesKeys.countryOfResidence, countries.split(',').map(s => s.trim()))
    statementBuilder.addMinimumAge(20)
    const statement = statementBuilder.getStatement()

    const { data } = await httpClient.get(`verifiers/challenge/${walletAddress}`)
    setChallenge(data.challenge)
    concordiumClient.requestIdProof(walletAddress, statement, data.challenge)
      .then(async (proof) => {
        var result = await httpClient.get(`verifiers/prove/${data.challenge}`)
        const token = result.data
        if (token !== "") {
          localStorage.setItem("token_key_cc", token)
          alert("Your prove was successfull, your token will last for 2 minutes, click OK to continue")
          onCreateDonation()
        }
      }).catch(async (error) => {
        await httpClient.delete(`verifiers/${data.challenge}`)
        alert("You are not allowed to donate")
      })
  }

  const onCreateDonation = () => {
    concordiumClient.sendTransaction(
      walletAddress,
      AccountTransactionType.InitContract,
      // tx values
      {
        amount: new CcdAmount(0n),
        moduleRef: moduleReference,
        initName: "donation",
        maxContractExecutionEnergy: 3000n,
      },
      // input parameters
      {
        donation_locations: countries.split(',').map(s => s.trim()),
        end_time: new Date(endTime)
      },
      rawModuleSchema
    ).then(txHash => {
      alert(`Successfully created donation with hash: ${txHash}`)
      setDonationCreated(true)
    })
    .catch(console.log("Failed to create donation"))
  }

  const onDonation = () => {
    concordiumClient.sendTransaction(
      walletAddress,
      AccountTransactionType.Update,
      // tx values
      {
        amount: new CcdAmount(100n),
        contractAddress: {
          // eslint-disable-next-line no-undef
          index: BigInt(contractIndex),
          subindex: 0n,
        },
        receiveName: "donation.donate",
        maxContractExecutionEnergy: 3000n,
      },
      // input parameters
      donation_location,
      rawModuleSchema
    ).then(txHash => {
      alert(`Successfully donated 0.0001 CCD with transaction hash: ${txHash}`)
    })
    .catch(console.log("Failed to create donation"))
  }

  const onGetResult = () => {
    concordiumClient.getJsonRpcClient().invokeContract({
      // eslint-disable-next-line no-undef
      contract: {index: BigInt(contractIndex), subindex: 0n},
      method: "donation.view",
    })
      .then((viewResult) => {
        let resultValue = deserializeReceiveReturnValue(
          toBuffer(viewResult.returnValue, 'hex'),
          toBuffer(rawModuleSchema, 'base64'),
          "donation",
          "view",
          SchemaVersion.V2
        );

        console.log("resultValue", resultValue)

        setDonationEndTime(resultValue.time)
        setTotalBalance(resultValue.balance)
      }).catch(console.log("Failed to get value"))
  }

  const onDonationOpen = () => {
    concordiumClient.sendTransaction(
      walletAddress,
      AccountTransactionType.Update,
      // tx values
      {
        amount: new CcdAmount(0n),
        contractAddress: {
          // eslint-disable-next-line no-undef
          index: BigInt(contractIndex),
          subindex: 0n,
        },
        receiveName: "donation.open",
        maxContractExecutionEnergy: 3000n,
      },
      rawModuleSchema
    ).then(txHash => {
      alert(`Successfully opened donation with transaction hash: ${txHash}`)
    })
    .catch(console.log("Failed to open donation"))
  }

  const onDonationClose = () => {
    concordiumClient.sendTransaction(
      walletAddress,
      AccountTransactionType.Update,
      // tx values
      {
        amount: new CcdAmount(0n),
        contractAddress: {
          // eslint-disable-next-line no-undef
          index: BigInt(contractIndex),
          subindex: 0n,
        },
        receiveName: "donation.close",
        maxContractExecutionEnergy: 3000n,
      },
      rawModuleSchema
    ).then(txHash => {
      alert(`Successfully closed donation with transaction hash: ${txHash}`)
    })
    .catch(console.log("Failed to close donation"))
  }

  return (
    <div className="App">
      <header className="App-header">
          {/* Connect to the wallet */}
          <div>
              {!walletConnected && (
                <>
                  <h3>Please connect wallet</h3>
                  <Button onClick={onConnectWallet} variant="primary"> Connect Wallet</Button>
                </>
              )}
              {walletConnected && (
                <>
                  <h3>Wallet Connected: {walletAddress}</h3>

                  {/* initialize the smart contract */}
                  <div className="text-center mx-auto" style={{ maxWidth: "30rem"}}>
                    <h5 className="mt-5">Enter end time</h5>
                    <InputGroup className="text-center">
                      <Form.Control
                        placeholder="End time"
                        type="date"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      >
                      </Form.Control>
                    </InputGroup>
                    <h5 className="mt-3">Enter countries in string separated values</h5>
                    <InputGroup className="text-center">
                      <Form.Control
                        placeholder="Enter countries"
                        value={countries}
                        onChange={(e) => setCountries(e.target.value)}
                      >
                      </Form.Control>
                    </InputGroup>

                    <Button className="mt-2" onClick={onVerifyID} variant="success">Create donation</Button>
                  </div>

                  {donationCreated && (
                    <>
                    
                         {/* donate: updating the blockchain */}
                  <div className="text-center mx-auto" style={{ maxWidth: "30rem"}}>
                    <h3 className="mt-5">Donation CCD to contract</h3>
                    <h5 className="mt-3">Contract index</h5>
                    <InputGroup className="text-center">
                      <Form.Control
                        placeholder="enter contract index"
                        type="number"
                        value={contractIndex}
                        onChange={(e) => setContractIndex(e.target.value)}
                      >
                      </Form.Control>
                    </InputGroup>
                    <h5 className="mt-3">Location</h5>
                    <InputGroup className="text-center">
                      <Form.Control
                        placeholder="CM"
                        value={donation_location}
                        onChange={(e) => setLocation(e.target.value)}
                      >
                      </Form.Control>
                    </InputGroup>
                    <Button className="mt-2" onClick={onDonation} variant="success">Donate</Button>
                  </div>
        
                  {/* close: updating the blockchain */}
                  <div>
                  <div className="text-center mx-auto" style={{ maxWidth: "30rem"}}>
                      <h3 className="mt-5">Set Donation State to Closed</h3>
                      <h5 className="mt-3">Contract index</h5>
                      <InputGroup className="text-center">
                        <Form.Control
                          placeholder="enter contract index"
                          type="number"
                          value={contractIndex}
                          onChange={(e) => setContractIndex(e.target.value)}
                        >
                        </Form.Control>
                      </InputGroup>
                      
                      <Button className="mt-2" onClick={onDonationClose} variant="success">Close donation</Button>
                    </div>
                  </div>
        
                  {/* Open: updating the blockchain */}
                  <div>
                    <div className="text-center mx-auto" style={{ maxWidth: "30rem"}}>
                      <h3 className="mt-5">Set Donation State to Open</h3>
                      <h5 className="mt-3">Contract index</h5>
                      <InputGroup className="text-center">
                        <Form.Control
                          placeholder="enter contract index"
                          type="number"
                          value={contractIndex}
                          onChange={(e) => setContractIndex(e.target.value)}
                        >
                        </Form.Control>
                      </InputGroup>
                      
                      <Button className="mt-2" onClick={onDonationOpen} variant="success">Open donation</Button>
                    </div>                
                  </div>
        
                  {/* view: showing the results*/}
                  <div className="text-center mx-auto" style={{ maxWidth: "30rem"}}>
                    <h3 className="mt-5">View donation state</h3>
                    <h5 className="mt-3">Contract index</h5>
                    <InputGroup className="text-center">
                      <Form.Control
                        placeholder="enter contract index"
                        type="number"
                        value={contractIndex}
                        onChange={(e) => setContractIndex(e.target.value)}
                      >
                      </Form.Control>
                    </InputGroup>
                    <Button className="mt-2" onClick={onGetResult} variant="success">Get Results</Button>
                    <div className="mt-2"><h5>End Time: {donationEndTime}</h5></div>
                    <div className="mt-2"><h5>Total donation balance: {totalBalance} CCD</h5></div>
                  </div>
                    </>
                  )}

                  
                </>
              )}
          </div>
      </header>
    </div>
  );
}

export default App;
