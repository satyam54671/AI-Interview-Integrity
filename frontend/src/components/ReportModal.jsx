import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, AlertTriangle, CheckCircle2, Clock, User, Shield, BarChart3 } from 'lucide-react';
import apiService from '../services/api';

const ReportModal = ({ isOpen, onClose, sessionId }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchReportData();
    }
  }, [isOpen, sessionId]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch session data
      const sessionResponse = await apiService.getSession(sessionId);
      const analyticsResponse = await apiService.getSessionAnalytics(sessionId);
      
      // Calculate session duration (mock for now - in real app, track start/end times)
      const sessionDuration = '45:32'; // minutes:seconds
      
      // Process violations
      const violations = analyticsResponse.violations || [];
      const violationBreakdown = {
        tabSwitching: violations.filter(v => v.reason?.toLowerCase().includes('tab')).length,
        gazeIssues: violations.filter(v => v.reason?.toLowerCase().includes('gaze') || v.reason?.toLowerCase().includes('looking')).length,
        readingNotes: violations.filter(v => v.reason?.toLowerCase().includes('reading') || v.reason?.toLowerCase().includes('down')).length,
        multipleFaces: violations.filter(v => v.reason?.toLowerCase().includes('face')).length,
        speaking: violations.filter(v => v.reason?.toLowerCase().includes('speaking') || v.reason?.toLowerCase().includes('lip')).length,
      };

      const totalViolations = violations.length;
      
      // Determine risk level
      let riskLevel = 'Low';
      let riskColor = 'text-green-500';
      if (sessionResponse.risk_score > 70) {
        riskLevel = 'Critical';
        riskColor = 'text-red-500';
      } else if (sessionResponse.risk_score > 40) {
        riskLevel = 'Medium';
        riskColor = 'text-yellow-500';
      } else if (sessionResponse.risk_score > 20) {
        riskLevel = 'Moderate';
        riskColor = 'text-orange-500';
      }

      setReportData({
        candidateName: sessionResponse.candidate_name || 'Unknown Candidate',
        sessionId,
        sessionDuration,
        finalScore: Math.max(0, 100 - sessionResponse.risk_score),
        riskScore: sessionResponse.risk_score,
        riskLevel,
        riskColor,
        totalViolations,
        violationBreakdown,
        violations: violations.slice(-10), // Last 10 violations
        generatedAt: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      // Generate PDF content
      const pdfContent = generatePDFContent();
      
      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `integrity-report-${sessionId}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const generatePDFContent = () => {
    if (!reportData) return '';
    
    return `
INTERVIEW INTEGRITY REPORT
==========================

CANDIDATE INFORMATION
--------------------
Name: ${reportData.candidateName}
Session ID: ${reportData.sessionId}
Report Generated: ${reportData.generatedAt}

SESSION SUMMARY
----------------
Duration: ${reportData.sessionDuration}
Final Integrity Score: ${reportData.finalScore}/100
Risk Score: ${reportData.riskScore}
Risk Level: ${reportData.riskLevel}

VIOLATION SUMMARY
----------------
Total Violations: ${reportData.totalViolations}

Breakdown:
- Tab Switching: ${reportData.violationBreakdown.tabSwitching}
- Gaze Issues: ${reportData.violationBreakdown.gazeIssues}
- Reading Notes: ${reportData.violationBreakdown.readingNotes}
- Multiple Faces: ${reportData.violationBreakdown.multipleFaces}
- Speaking: ${reportData.violationBreakdown.speaking}

DETAILED VIOLATION LOG
-------------------------
${reportData.violations.map(v => 
  `[${new Date(v.timestamp * 1000).toLocaleString()}] ${v.reason} (Penalty: -${v.penalty} PT)`
).join('\n')}

==========================
End of Report
    `.trim();
  };

  if (!reportData && !loading) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 50 }}
            className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <FileText className="text-blue-500" size={24} />
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Integrity Report</h2>
                  <p className="text-sm text-gray-500">Session {reportData?.sessionId}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading report data...</span>
                </div>
              ) : reportData ? (
                <div className="space-y-8">
                  {/* Candidate Info */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <User className="text-blue-500" size={20} />
                      <h3 className="text-lg font-black text-gray-900">Candidate Information</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Name</p>
                        <p className="font-medium text-gray-900">{reportData.candidateName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Session Duration</p>
                        <p className="font-medium text-gray-900">{reportData.sessionDuration}</p>
                      </div>
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-2xl p-6 text-center">
                      <Shield className="text-blue-500 mx-auto mb-3" size={24} />
                      <p className="text-3xl font-black text-blue-600">{reportData.finalScore}</p>
                      <p className="text-sm text-gray-600">Final Score</p>
                    </div>
                    <div className={`${reportData.riskColor === 'text-green-500' ? 'bg-green-50' : reportData.riskColor === 'text-yellow-500' ? 'bg-yellow-50' : reportData.riskColor === 'text-orange-500' ? 'bg-orange-50' : 'bg-red-50'} rounded-2xl p-6 text-center`}>
                      <AlertTriangle className={`${reportData.riskColor} mx-auto mb-3`} size={24} />
                      <p className={`text-3xl font-black ${reportData.riskColor}`}>{reportData.riskLevel}</p>
                      <p className="text-sm text-gray-600">Risk Level</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-6 text-center">
                      <BarChart3 className="text-red-500 mx-auto mb-3" size={24} />
                      <p className="text-3xl font-black text-red-600">{reportData.totalViolations}</p>
                      <p className="text-sm text-gray-600">Total Violations</p>
                    </div>
                  </div>

                  {/* Violation Breakdown */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-3">
                      <BarChart3 className="text-blue-500" size={20} />
                      Violation Breakdown
                    </h3>
                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-white rounded-xl">
                        <p className="text-2xl font-black text-gray-900">{reportData.violationBreakdown.tabSwitching}</p>
                        <p className="text-xs text-gray-600 mt-1">Tab Switching</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-xl">
                        <p className="text-2xl font-black text-gray-900">{reportData.violationBreakdown.gazeIssues}</p>
                        <p className="text-xs text-gray-600 mt-1">Gaze Issues</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-xl">
                        <p className="text-2xl font-black text-gray-900">{reportData.violationBreakdown.readingNotes}</p>
                        <p className="text-xs text-gray-600 mt-1">Reading Notes</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-xl">
                        <p className="text-2xl font-black text-gray-900">{reportData.violationBreakdown.multipleFaces}</p>
                        <p className="text-xs text-gray-600 mt-1">Multiple Faces</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-xl">
                        <p className="text-2xl font-black text-gray-900">{reportData.violationBreakdown.speaking}</p>
                        <p className="text-xs text-gray-600 mt-1">Speaking</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Violations */}
                  {reportData.violations.length > 0 && (
                    <div className="bg-red-50 rounded-2xl p-6">
                      <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-3">
                        <AlertTriangle className="text-red-500" size={20} />
                        Recent Violations
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {reportData.violations.map((violation, index) => (
                          <div key={index} className="flex items-start justify-between p-4 bg-white rounded-xl">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{violation.reason}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(violation.timestamp * 1000).toLocaleString()}
                              </p>
                            </div>
                            <div className="px-3 py-1 bg-red-100 rounded-full">
                              <span className="text-sm font-black text-red-600">-{violation.penalty} PT</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Violations */}
                  {reportData.violations.length === 0 && (
                    <div className="bg-green-50 rounded-2xl p-12 text-center">
                      <CheckCircle2 className="text-green-500 mx-auto mb-4" size={48} />
                      <h3 className="text-xl font-black text-green-600 mb-2">Perfect Session</h3>
                      <p className="text-gray-600">No integrity violations detected during this session.</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-500">
                Report generated on {reportData?.generatedAt}
              </p>
              <button
                onClick={handleExportPDF}
                disabled={exporting || loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                {exporting ? 'Exporting...' : 'Export Report'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;
