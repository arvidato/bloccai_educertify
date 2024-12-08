import React, { useState } from 'react';

function TestConnection({ contracts, account }) {
    const [status, setStatus] = useState('');

    const testConnection = async () => {
        try {
            setStatus('Testing connection...');

            // Test EducationCertificate contract
            const name = await contracts.educationCertificate.methods.name().call();
            const symbol = await contracts.educationCertificate.methods.symbol().call();
            
            // Test CertificateHelper contract
            const certificateContract = await contracts.certificateHelper.methods
                .certificateContract()
                .call();

            setStatus(`
                Connection successful!
                Token Name: ${name}
                Token Symbol: ${symbol}
                Certificate Contract: ${certificateContract}
            `);

        } catch (error) {
            console.error('Connection test failed:', error);
            setStatus(`Error: ${error.message}`);
        }
    };

    return (
        <div>
            <h3>Test Contract Connection</h3>
            <button onClick={testConnection}>
                Test Connection
            </button>
            <pre>{status}</pre>
        </div>
    );
}

export default TestConnection; 