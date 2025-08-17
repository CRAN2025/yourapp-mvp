// DatabaseCleanupComponent.js - Create this temporarily to run cleanup
import React, { useState } from 'react';
import { runFullCleanup, analyzeImageFields, cleanupImageFields, verifyCleanup } from './database-cleanup';

const DatabaseCleanupComponent = ({ userId }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState('');
  const [step, setStep] = useState('ready');

  const logToResults = (message) => {
    setResults(prev => prev + message + '\n');
  };

  const runAnalysis = async () => {
    if (!userId) {
      alert('Please provide your user ID');
      return;
    }

    setIsRunning(true);
    setResults('');
    setStep('analyzing');
    
    try {
      logToResults('🔍 Analyzing current database structure...\n');
      
      // Override console.log temporarily to capture output
      const originalLog = console.log;
      console.log = (...args) => {
        logToResults(args.join(' '));
        originalLog(...args);
      };

      await analyzeImageFields(userId);
      
      // Restore console.log
      console.log = originalLog;
      
      logToResults('\n✅ Analysis complete! Check the output above.');
      setStep('analyzed');
      
    } catch (error) {
      logToResults(`\n❌ Analysis failed: ${error.message}`);
      setStep('error');
    } finally {
      setIsRunning(false);
    }
  };

  const runCleanup = async () => {
    if (!userId) {
      alert('Please provide your user ID');
      return;
    }

    const confirmCleanup = window.confirm(
      'This will modify your Firebase database. Make sure you have a backup. Continue?'
    );
    
    if (!confirmCleanup) return;

    setIsRunning(true);
    setResults('');
    setStep('cleaning');
    
    try {
      logToResults('🧹 Starting database cleanup...\n');
      
      // Override console.log temporarily to capture output
      const originalLog = console.log;
      console.log = (...args) => {
        logToResults(args.join(' '));
        originalLog(...args);
      };

      await runFullCleanup(userId);
      
      // Restore console.log
      console.log = originalLog;
      
      logToResults('\n🎉 Cleanup complete! Your database is now optimized.');
      setStep('complete');
      
    } catch (error) {
      logToResults(`\n❌ Cleanup failed: ${error.message}`);
      setStep('error');
    } finally {
      setIsRunning(false);
    }
  };

  const runVerification = async () => {
    if (!userId) {
      alert('Please provide your user ID');
      return;
    }

    setIsRunning(true);
    setStep('verifying');
    
    try {
      logToResults('\n🔍 Verifying cleanup results...\n');
      
      const originalLog = console.log;
      console.log = (...args) => {
        logToResults(args.join(' '));
        originalLog(...args);
      };

      const isClean = await verifyCleanup(userId);
      
      console.log = originalLog;
      
      if (isClean) {
        logToResults('\n✅ Verification passed! Database is clean.');
      } else {
        logToResults('\n⚠️ Some issues remain. Check output above.');
      }
      
    } catch (error) {
      logToResults(`\n❌ Verification failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '20px auto', 
      padding: '20px',
      fontFamily: 'monospace',
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    }}>
      <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>
        🧹 Database Image Field Cleanup Tool
      </h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#6b7280', marginBottom: '10px' }}>
          <strong>User ID:</strong> {userId || 'Not provided'}
        </p>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          This tool will fix your image field structure by consolidating all image URLs to the simplified images.primary format.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={runAnalysis}
          disabled={isRunning || !userId}
          style={{
            padding: '10px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isRunning || !userId ? 'not-allowed' : 'pointer',
            opacity: isRunning || !userId ? 0.6 : 1
          }}
        >
          {step === 'analyzing' ? '🔍 Analyzing...' : '🔍 1. Analyze Database'}
        </button>

        <button
          onClick={runCleanup}
          disabled={isRunning || !userId}
          style={{
            padding: '10px 16px',
            background: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isRunning || !userId ? 'not-allowed' : 'pointer',
            opacity: isRunning || !userId ? 0.6 : 1
          }}
        >
          {step === 'cleaning' ? '🧹 Cleaning...' : '🧹 2. Run Cleanup'}
        </button>

        <button
          onClick={runVerification}
          disabled={isRunning || !userId}
          style={{
            padding: '10px 16px',
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isRunning || !userId ? 'not-allowed' : 'pointer',
            opacity: isRunning || !userId ? 0.6 : 1
          }}
        >
          {step === 'verifying' ? '🔍 Verifying...' : '🔍 3. Verify Results'}
        </button>
      </div>

      {/* Results Output */}
      <div style={{ 
        background: '#1f2937', 
        color: '#f9fafb', 
        padding: '16px', 
        borderRadius: '6px',
        fontSize: '12px',
        lineHeight: '1.4',
        height: '400px',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        fontFamily: 'Monaco, Consolas, monospace'
      }}>
        {results || 'Click "Analyze Database" to start...'}
      </div>

      {step === 'complete' && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: '#dcfce7', 
          border: '1px solid #10b981',
          borderRadius: '6px',
          color: '#065f46'
        }}>
          <strong>✅ Cleanup Complete!</strong>
          <br />
          Your database has been optimized. You can now:
          <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
            <li>Remove this cleanup component from your app</li>
            <li>Test your product uploads - they should work correctly now</li>
            <li>Images will save and display exactly as uploaded</li>
          </ul>
        </div>
      )}

      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: '#fef3c7', 
        border: '1px solid #f59e0b',
        borderRadius: '6px',
        color: '#92400e',
        fontSize: '12px'
      }}>
        <strong>⚠️ Important:</strong> This modifies your Firebase database. Make sure you have a backup before running cleanup.
        After cleanup is complete, you can safely remove this component from your app.
      </div>
    </div>
  );
};

export default DatabaseCleanupComponent;