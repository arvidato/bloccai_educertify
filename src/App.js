import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { IssueCertificate } from './components/IssueCertificate';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState(null);
  const [isUniversity, setIsUniversity] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const checkUniversityStatus = async () => {
      if (contracts && account) {
        try {
          const isAuthorized = await contracts.educationCertificate.methods
            .authorizedUniversities(account)
            .call();
          setIsUniversity(isAuthorized);
          setUserName(isAuthorized ? 'University' : 'Student');
        } catch (err) {
          console.error('Error checking university status:', err);
          setError('Error checking authorization status');
        }
      }
    };

    checkUniversityStatus();
  }, [contracts, account]);

  const handleLogin = (accountAddress, contractInstances) => {
    setAccount(accountAddress);
    setContracts(contractInstances);
    setIsLoggedIn(true);
  };

  const UniversityDashboard = () => (
    <div className="dashboard university-dashboard">
      <h2>Welcome, University!</h2>
      <p>Your address: {account}</p>
      <IssueCertificate contracts={contracts} account={account} />
    </div>
  );

  const StudentDashboard = () => (
    <div className="dashboard student-dashboard">
      <h2>Welcome, Student!</h2>
      <p>Your address: {account}</p>
      <p>You can view your certificates here.</p>
      {/* Add student-specific components here */}
    </div>
  );

  return (
    <div className="App">
      {!isLoggedIn ? (
        <LoginScreen onLogin={handleLogin} onError={setError} />
      ) : (
        <div>
          <div className="welcome-banner">
            Welcome, {isUniversity ? 'University' : 'Student'}!
          </div>
          {isUniversity ? <UniversityDashboard /> : <StudentDashboard />}
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default App;