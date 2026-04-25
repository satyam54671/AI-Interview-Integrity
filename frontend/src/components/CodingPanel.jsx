import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { Play, Settings, Download, Terminal } from 'lucide-react';

const CodingPanel = ({ sessionId, onReportGenerate }) => {
  const [code, setCode] = useState('// Welcome to the coding challenge\n// Write your solution here\nfunction solve() {\n    // Your code here\n    return "Hello, World!";\n}');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef(null);

  const languages = [
    { value: 'javascript', label: 'JavaScript', default: '// Welcome to the coding challenge\n// Write your solution here\nfunction solve() {\n    // Your code here\n    return "Hello, World!";\n}' },
    { value: 'python', label: 'Python', default: '# Welcome to the coding challenge\n# Write your solution here\ndef solve():\n    # Your code here\n    return "Hello, World!"' },
    { value: 'java', label: 'Java', default: '// Welcome to the coding challenge\n// Write your solution here\npublic class Solution {\n    public static String solve() {\n        // Your code here\n        return "Hello, World!";\n    }\n}' },
    { value: 'cpp', label: 'C++', default: '// Welcome to the coding challenge\n// Write your solution here\n#include <iostream>\n#include <string>\nusing namespace std;\n\nstring solve() {\n    // Your code here\n    return "Hello, World!";\n}' },
    { value: 'c', label: 'C', default: '// Welcome to the coding challenge\n// Write your solution here\n#include <stdio.h>\n#include <string.h>\n\nchar* solve() {\n    // Your code here\n    return "Hello, World!";\n}' }
  ];

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    const selectedLanguage = languages.find(lang => lang.value === newLanguage);
    if (selectedLanguage) {
      setCode(selectedLanguage.default);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Running code...');
    
    try {
      // Mock execution for demo - in real implementation, this would call backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simple mock output based on language
      let mockOutput = '';
      if (language === 'javascript') {
        mockOutput = 'Hello, World!';
      } else if (language === 'python') {
        mockOutput = 'Hello, World!';
      } else if (language === 'java') {
        mockOutput = 'Hello, World!';
      } else if (language === 'cpp') {
        mockOutput = 'Hello, World!';
      } else if (language === 'c') {
        mockOutput = 'Hello, World!';
      }
      
      setOutput(`✅ Output:\n${mockOutput}\n\n⏱️  Execution time: 0.012s\n💾 Memory usage: 1.2MB`);
    } catch (error) {
      setOutput(`❌ Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearOutput = () => {
    setOutput('');
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Coding Challenge</h3>
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">LIVE</span>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => onReportGenerate && onReportGenerate()}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Download size={14} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 border-b border-gray-100">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              insertSpaces: true,
              wordWrap: 'on',
              bracketPairColorization: { enabled: true },
              guides: {
                indentation: true,
                bracketPairs: true
              }
            }}
            onMount={(editor) => {
              editorRef.current = editor;
              // Focus editor on mount
              editor.focus();
            }}
          />
        </div>

        {/* Output Console */}
        <div className="h-48 bg-gray-900 border-t border-gray-800">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-green-400" />
              <span className="text-xs font-mono text-green-400">Console Output</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearOutput}
                className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="px-3 py-1 bg-green-600 text-white rounded text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={12} />
                {isRunning ? 'Running...' : 'Run'}
              </button>
            </div>
          </div>
          <div className="p-4 font-mono text-sm text-gray-300 overflow-y-auto h-32">
            {output || '// Output will appear here when you run your code'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingPanel;
